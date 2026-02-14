/**
 * Capability 5: Content Rewrite Suggestions (v2)
 *
 * Generates optimized title, meta description, and H1 rewrites
 * based on target keywords, search intent, and SERP patterns.
 *
 * Enhanced with:
 *   - Zod schema validation
 *   - Structured output (jsonMode / jsonSchema)
 *   - Character-count guardrails in post-processing
 *   - Competitor title analysis
 *   - Position-based CTR prediction
 *   - SERP-aware prompt construction
 *   - Title scoring with length guardrails
 *   - A/B variant generation
 */

import { createLogger } from '../lib/framework-shims.mjs';
import { runTextGeneration } from '../providers/ai-provider.mjs';
import { ContentRewriteInputSchema, ContentRewriteOutputSchema, CONTENT_REWRITE_JSON_SCHEMA } from '../lib/schemas/index.mjs';
import { parseAndValidate } from '../lib/response-parser.mjs';
import { validateInput } from '../lib/validate-input.mjs';
import { formatContentRewriteExamples } from '../lib/few-shot/index.mjs';
import { round } from '../lib/math-utils.mjs';

const logger = createLogger('ai-rewrites');

// ── Position-based expected CTR curves (desktop, Google, 2024 benchmarks) ──
const EXPECTED_CTR_BY_POSITION = [
  0.396, 0.187, 0.112, 0.080, 0.062,  // positions 1-5
  0.048, 0.038, 0.031, 0.026, 0.022   // positions 6-10
];

/**
 * Estimate expected CTR for a given SERP position.
 * Returns null if position is outside 1-10 range.
 */
export function expectedCTR(position) {
  if (!position || position < 1 || position > 10) return null;
  const idx = Math.min(Math.round(position) - 1, 9);
  return EXPECTED_CTR_BY_POSITION[idx];
}

/**
 * Score a title based on SEO best practices (0-100).
 */
export function scoreTitle(title, targetKeyword) {
  if (!title) return { score: 0, issues: ['No title provided'] };
  let score = 50; // baseline
  const issues = [];
  const len = title.length;

  // Length scoring
  if (len >= 50 && len <= 60) score += 15;
  else if (len >= 40 && len <= 65) score += 8;
  else if (len > 70) { score -= 15; issues.push(`Title too long (${len} chars)`); }
  else if (len < 25) { score -= 15; issues.push(`Title too short (${len} chars)`); }

  // Keyword presence
  if (targetKeyword) {
    const kw = targetKeyword.toLowerCase();
    const t = title.toLowerCase();
    if (t.includes(kw)) {
      score += 15;
      // Keyword near front is better
      if (t.indexOf(kw) < 20) score += 5;
    } else {
      score -= 10;
      issues.push('Target keyword missing from title');
    }
  }

  // Power words
  const powerWords = /\b(best|top|ultimate|guide|proven|essential|complete|step.by.step|how to|tips|review|vs|free)\b/i;
  if (powerWords.test(title)) score += 5;

  // Freshness signals
  const freshness = /\b(202[4-9]|updated|latest|new)\b/i;
  if (freshness.test(title)) score += 5;

  // Number in title
  if (/\d+/.test(title)) score += 5;

  return { score: Math.max(0, Math.min(100, score)), issues };
}

/**
 * Analyze competitor titles/descriptions to extract patterns.
 */
export function analyzeCompetitors(competitors) {
  if (!competitors || competitors.length === 0) return null;

  const titles = competitors.filter(c => c.title).map(c => c.title);
  if (titles.length === 0) return null;

  // Average title length
  const avgTitleLen = round(titles.reduce((s, t) => s + t.length, 0) / titles.length, 0);

  // Common words (excluding stop words)
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'this', 'that', 'from', 'your', 'you', 'it', 'its']);
  const wordFreq = {};
  titles.forEach(t => {
    const words = t.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
    const seen = new Set();
    words.forEach(w => {
      if (w.length > 2 && !stopWords.has(w) && !seen.has(w)) {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
        seen.add(w);
      }
    });
  });

  const commonTerms = Object.entries(wordFreq)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  // Check for patterns
  const hasNumbers = titles.filter(t => /\d+/.test(t)).length;
  const hasYear = titles.filter(t => /\b202[4-9]\b/.test(t)).length;
  const hasPowerWords = titles.filter(t => /\b(best|top|ultimate|guide|how to)\b/i.test(t)).length;

  return {
    count: titles.length,
    avgTitleLength: avgTitleLen,
    commonTerms,
    patterns: {
      withNumbers: `${hasNumbers}/${titles.length}`,
      withYear: `${hasYear}/${titles.length}`,
      withPowerWords: `${hasPowerWords}/${titles.length}`
    },
    topTitles: titles.slice(0, 5)
  };
}

export async function generateRewrites(body, env) {
  const v = validateInput(ContentRewriteInputSchema, body);
  if (!v.valid) return v.error;

  const { pages = [], competitors = [], tone = 'professional', industry } = v.data;

  if (!pages.length) {
    return { rewrites: [], message: 'No pages provided' };
  }

  const batch = pages.slice(0, 10);
  const competitorAnalysis = analyzeCompetitors(competitors);

  // Phase 0: Compute deterministic CTR analysis per page
  const pagesWithCTR = batch.map(p => {
    const expected = expectedCTR(p.position);
    const actual = p.ctr || null;
    let ctrGap = null;
    let ctrOpportunity = null;
    if (expected !== null && actual !== null) {
      ctrGap = round((expected - actual) * 100, 2); // percentage points
      ctrOpportunity = ctrGap > 2 ? 'high' : ctrGap > 0.5 ? 'medium' : 'low';
    }
    const kw = Array.isArray(p.targetKeywords)
      ? p.targetKeywords.map(k => typeof k === 'string' ? k : k.query || k.keyword).filter(Boolean)[0]
      : p.targetKeyword || null;
    const currentTitleScore = scoreTitle(p.title, kw);
    return { ...p, expectedCTR: expected, ctrGap, ctrOpportunity, primaryKeyword: kw, currentTitleScore };
  });

  const result = await runTextGeneration({
    systemPrompt: buildRewriteSystemPrompt(tone, competitorAnalysis),
    userPrompt: buildRewriteUserPrompt(pagesWithCTR, competitorAnalysis, industry),
    complexity: 'standard',
    capability: 'content-rewrite',
    maxTokens: 4096,
    jsonMode: true,
    jsonSchema: CONTENT_REWRITE_JSON_SCHEMA
  }, env);

  const { data: parsed, meta } = parseAndValidate(
    result.text,
    ContentRewriteOutputSchema,
    {
      fallback: () => ({ rewrites: fallbackRewrites(batch) }),
      expect: 'object'
    }
  );

  const rewrites = (parsed?.rewrites || fallbackRewrites(batch)).map((r, i) => {
    const page = pagesWithCTR[i] || {};
    const sugTitle = r.title?.suggested || r.rewritten?.title || '';
    const sugDesc = r.description?.suggested || r.rewritten?.description || '';
    const sugH1 = r.h1?.suggested || r.rewritten?.h1 || '';
    const kw = page.primaryKeyword || '';

    // Score suggested title
    const suggestedTitleScore = scoreTitle(sugTitle, kw);

    // Generate A/B variants
    const variants = generateVariants(sugTitle, sugDesc, kw, tone);

    return {
      url: r.url || page.url || `page-${i}`,
      title: typeof r.title === 'object' ? r.title : {
        current: page.title || '',
        suggested: sugTitle,
        reasoning: r.reasoning || ''
      },
      description: typeof r.description === 'object' ? r.description : {
        current: page.description || '',
        suggested: sugDesc,
        reasoning: r.reasoning || ''
      },
      h1: typeof r.h1 === 'object' ? r.h1 : {
        current: page.h1 || '',
        suggested: sugH1,
        reasoning: r.reasoning || ''
      },
      estimatedCTRLift: r.estimatedCTRLift || r.estimatedImpact || 'Unknown',
      titleScore: {
        current: page.currentTitleScore?.score || 0,
        suggested: suggestedTitleScore.score,
        issues: suggestedTitleScore.issues
      },
      ctrAnalysis: page.ctrGap !== null ? {
        currentCTR: page.ctr ? round(page.ctr * 100, 2) : null,
        expectedCTR: page.expectedCTR ? round(page.expectedCTR * 100, 2) : null,
        gapPct: page.ctrGap,
        opportunity: page.ctrOpportunity
      } : null,
      variants,
      titleLength: sugTitle.length,
      descriptionLength: sugDesc.length,
      warnings: [
        ...(sugTitle.length > 60 ? [`Title too long (${sugTitle.length} chars, max 60)`] : []),
        ...(sugDesc.length > 160 ? [`Description too long (${sugDesc.length} chars, max 160)`] : []),
        ...(sugTitle.length < 30 ? [`Title too short (${sugTitle.length} chars, min 30)`] : [])
      ],
      source: meta.fallbackUsed ? 'ai-engine-fallback' : 'ai-engine',
      ...generateExplainability(r, pagesWithCTR[i])
    };
  });

  logger.info(`Generated rewrites for ${rewrites.length} pages via ${result.provider}`, {
    parseMethod: meta.parseMethod,
    schemaValid: meta.schemaValid,
    competitorCount: competitors.length
  });

  return {
    rewrites,
    competitorInsights: competitorAnalysis,
    metadata: {
      provider: result.provider,
      model: result.model,
      pagesProcessed: batch.length,
      competitorsAnalyzed: competitors.length,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
      durationMs: result.durationMs,
      parseQuality: {
        method: meta.parseMethod,
        schemaValid: meta.schemaValid,
        fallbackUsed: meta.fallbackUsed
      }
    }
  };
}

function buildRewriteSystemPrompt(tone, competitorAnalysis) {
  let toneGuide = '';
  switch (tone) {
    case 'casual': toneGuide = '\nTONE: Use conversational, approachable language. Contractions are fine.'; break;
    case 'technical': toneGuide = '\nTONE: Use precise, authoritative language. Include technical terms where appropriate.'; break;
    case 'persuasive': toneGuide = '\nTONE: Use compelling, action-oriented language with strong CTAs.'; break;
    default: toneGuide = '\nTONE: Use professional, clear language.';
  }

  let competitorSection = '';
  if (competitorAnalysis) {
    competitorSection = `\n\nCOMPETITOR INTELLIGENCE:
- ${competitorAnalysis.count} competitor titles analyzed
- Average competitor title length: ${competitorAnalysis.avgTitleLength} chars
- Common terms in competitor titles: ${competitorAnalysis.commonTerms.map(t => t.word).join(', ')}
- Patterns: ${competitorAnalysis.patterns.withNumbers} use numbers, ${competitorAnalysis.patterns.withYear} use year, ${competitorAnalysis.patterns.withPowerWords} use power words
- Top competitor titles: ${competitorAnalysis.topTitles.map((t, i) => `\n  ${i + 1}. "${t}"`).join('')}

STRATEGY: Your rewrites should DIFFERENTIATE from these competitors while still including proven patterns. Stand out but stay relevant.`;
  }

  return `You are an expert SEO copywriter who creates click-worthy, search-optimized content elements.
${toneGuide}

For each page, generate optimized rewrites for:
1. title: SEO title tag (50-60 chars, include primary keyword, add power words / numbers / year)
2. description: Meta description (140-155 chars, include call-to-action, mention benefit)
3. h1: Page heading (can differ from title, more engaging, matches user intent)
4. explanation: Plain-language summary explaining the rewrite's benefits and confidence
5. confidenceBreakdown: Object with primarySignal (key evidence), alternativeApproaches (other options), contentQuality (assessment)
6. nextSteps: Array of prioritized implementation and monitoring steps

RULES:
- Match the keyword's search INTENT (transactional → urgency/CTA, informational → comprehensiveness, commercial → comparison/best-of)
- Include the PRIMARY target keyword naturally — don't stuff
- Add freshness signals ([2026], Updated, Latest) where appropriate
- Use power words: proven, essential, complete, ultimate, step-by-step
- Meta descriptions MUST include a CTA: "Learn how...", "Discover...", "Find out..."
- Preserve the page's core topic — don't change what the page is about
- For EACH rewrite, explain WHY it's better (1 sentence)
- When CTR gap data is provided, prioritize pages with the highest gaps
${competitorSection}

RESPOND ONLY with this JSON:
{"rewrites":[{"url":"...","title":{"current":"...","suggested":"...","reasoning":"..."},"description":{"current":"...","suggested":"...","reasoning":"..."},"h1":{"current":"...","suggested":"...","reasoning":"..."},"estimatedCTRLift":"...","explanation":"...","confidenceBreakdown":{"primarySignal":"...","alternativeApproaches":["..."],"contentQuality":"..."},"nextSteps":["..."]}]}`;
}

function buildRewriteUserPrompt(pages, competitorAnalysis, industry) {
  const pageBlocks = pages.map((p, i) => {
    const keywords = Array.isArray(p.targetKeywords)
      ? p.targetKeywords.map(k => typeof k === 'string' ? k : k.query || k.keyword).join(', ')
      : p.targetKeyword || p.primaryKeyword || 'N/A';

    let ctrLine = `Current CTR: ${p.ctr ? (p.ctr * 100).toFixed(1) + '%' : 'N/A'}`;
    if (p.ctrGap !== null) {
      ctrLine += ` | Expected CTR: ${round(p.expectedCTR * 100, 1)}% | Gap: ${p.ctrGap > 0 ? '+' : ''}${p.ctrGap}pp (${p.ctrOpportunity} opportunity)`;
    }

    let titleScoreLine = '';
    if (p.currentTitleScore) {
      titleScoreLine = `\n  Title score: ${p.currentTitleScore.score}/100${p.currentTitleScore.issues.length ? ' — Issues: ' + p.currentTitleScore.issues.join('; ') : ''}`;
    }

    return `PAGE ${i + 1}:
  URL: ${p.url || 'N/A'}
  Current title: ${p.title || '(none)'}
  Current description: ${p.description || '(none)'}
  Current H1: ${p.h1 || '(none)'}
  Target keywords: ${keywords}
  Current position: ${p.position || 'N/A'}
  ${ctrLine}
  Intent: ${p.intent || 'unknown'}${titleScoreLine}`;
  }).join('\n\n');

  const industryLine = industry ? `\nIndustry context: ${industry}` : '';

  return `Generate optimized rewrites for these pages:${industryLine}\n\n${pageBlocks}\n\n${formatContentRewriteExamples()}`;
}

/**
 * Generate title/description A/B variants by applying simple transformations.
 * These are deterministic alternatives for split-testing.
 */
function generateVariants(title, description, keyword, tone) {
  if (!title || title.length < 10) return [];
  const variants = [];

  // Variant A: Add number or year if missing
  if (!/\d/.test(title) && title.length < 56) {
    variants.push({
      label: 'A',
      strategy: 'add-year',
      title: `${title} (${new Date().getFullYear()})`,
      description
    });
  }

  // Variant B: Front-load keyword if it's not near the start
  if (keyword && title.toLowerCase().indexOf(keyword.toLowerCase()) > 15) {
    const cleaned = title.replace(new RegExp(keyword, 'i'), '').replace(/^\s*[-:|]\s*/, '').replace(/\s*[-:|]\s*$/, '').trim();
    const frontLoaded = `${keyword.charAt(0).toUpperCase() + keyword.slice(1)}: ${cleaned}`;
    if (frontLoaded.length <= 65) {
      variants.push({
        label: 'B',
        strategy: 'front-load-keyword',
        title: frontLoaded,
        description
      });
    }
  }

  // Variant C: Add power word prefix
  const powerPrefixes = {
    professional: 'Essential',
    casual: 'Your Go-To',
    technical: 'Complete',
    persuasive: 'Proven'
  };
  const prefix = powerPrefixes[tone] || 'Essential';
  if (!title.toLowerCase().includes(prefix.toLowerCase()) && title.length < 48) {
    variants.push({
      label: 'C',
      strategy: 'power-word-prefix',
      title: `${prefix} ${title}`,
      description
    });
  }

  return variants.slice(0, 3);
}

// parseRewriteResponse replaced by parseAndValidate from response-parser.mjs

function generateExplainability(rewrite, pageData) {
  const { reasoning, estimatedImpact } = rewrite;
  const { ctrGap, ctrOpportunity, primaryKeyword, currentTitleScore } = pageData;

  // Plain-language explanation
  let explanation = 'This rewrite optimizes for ' + (primaryKeyword || 'target keywords');
  if (estimatedImpact === 'high') {
    explanation += ', with high expected impact on CTR and rankings.';
  } else if (estimatedImpact === 'medium') {
    explanation += ', with moderate improvements expected.';
  } else {
    explanation += ', with potential for incremental gains.';
  }

  if (ctrGap && ctrGap > 0) {
    explanation += ' Current CTR is ' + ctrGap + ' percentage points below expected for this position.';
  }

  // Confidence breakdown
  const confidenceBreakdown = {
    primarySignal: reasoning || 'Based on SEO best practices and competitor analysis',
    alternativeApproaches: ['Focus on different keywords', 'Emphasize different value propositions', 'Use different tone or style'],
    contentQuality: currentTitleScore ? (currentTitleScore.score > 70 ? 'Good baseline quality' : 'Room for improvement') : 'Unknown baseline quality'
  };

  // Next steps
  const nextSteps = [
    'Implement the suggested title and meta description',
    'Monitor CTR and position changes for 1-2 weeks',
    'Test A/B variants if possible',
    'Update internal links and content to match new messaging'
  ];

  return { explanation, confidenceBreakdown, nextSteps };
}

function fallbackRewrites(pages) {
  return pages.map(p => ({
    url: p.url || 'unknown',
    title: { current: p.title || '', suggested: '', reasoning: 'LLM response could not be parsed' },
    description: { current: p.description || '', suggested: '', reasoning: 'LLM response could not be parsed' },
    h1: { current: p.h1 || '', suggested: '', reasoning: 'LLM response could not be parsed' },
    estimatedCTRLift: 'Unknown',
    source: 'ai-engine-fallback'
  }));
}
