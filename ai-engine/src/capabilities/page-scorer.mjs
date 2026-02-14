/**
 * Capability 10: SEO Page Scorer
 *
 * Hybrid pipeline:
 *   1. Deterministic scoring — rule-based checks on provided page metrics
 *   2. LLM enrichment — contextual recommendations, priority ordering
 *   3. Zod validation + structured output
 *
 * Scores pages across 4 dimensions (technical, content, on-page, UX)
 * and produces actionable improvement recommendations.
 */

import { createLogger } from '../lib/framework-shims.mjs';
import { runTextGeneration } from '../providers/ai-provider.mjs';
import { PageScorerInputSchema, PageScorerOutputSchema, PAGE_SCORER_JSON_SCHEMA } from '../lib/schemas/index.mjs';
import { parseAndValidate } from '../lib/response-parser.mjs';
import { formatPageScorerExamples } from '../lib/few-shot/index.mjs';
import { avg, round } from '../lib/math-utils.mjs';
import { validateInput } from '../lib/validate-input.mjs';

const logger = createLogger('ai-page-scorer');

const MAX_PAGES = 20;

export async function scorePages(body, env) {
  const v = validateInput(PageScorerInputSchema, body);
  if (!v.valid) return v.error;

  const { pages = [], context = {} } = v.data;

  if (!pages.length) {
    return { scores: [], averageScore: 0, summary: 'No pages provided.', metadata: {} };
  }

  const trimmedPages = pages.slice(0, MAX_PAGES);

  // ── Phase 1: Deterministic scoring ────────────────────────────────
  const preScores = trimmedPages.map(computeDeterministicScore);

  // ── Phase 2: LLM enrichment ───────────────────────────────────────
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(preScores, trimmedPages, context);

  const result = await runTextGeneration({
    systemPrompt,
    userPrompt,
    complexity: 'standard',
    capability: 'page-scorer',
    maxTokens: 6144,
    jsonMode: true,
    jsonSchema: PAGE_SCORER_JSON_SCHEMA
  }, env);

  // ── Phase 3: Parse + validate ─────────────────────────────────────
  const { data, meta } = parseAndValidate(result.text, PageScorerOutputSchema, {
    fallback: () => buildFallback(preScores)
  });

  logger.info(`Page scoring complete`, {
    pages: data.scores?.length || 0,
    averageScore: data.averageScore,
    parseMethod: meta.parseMethod
  });

  return {
    ...data,
    metadata: {
      provider: result.provider,
      model: result.model,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
      pagesScored: trimmedPages.length,
      parseQuality: meta
    }
  };
}

// ── Deterministic scoring engine ────────────────────────────────────

function computeDeterministicScore(page) {
  const technical = scoreTechnical(page);
  const content = scoreContent(page);
  const onPage = scoreOnPage(page);
  const ux = scoreUX(page);

  const overall = round(avg([technical.score, content.score, onPage.score, ux.score]), 0);

  return {
    url: page.url,
    overallScore: overall,
    grade: scoreToGrade(overall),
    dimensions: { technical, content, onPage, ux },
    rawPage: page
  };
}

function scoreTechnical(page) {
  let score = 70; // Base score
  const issues = [];
  const suggestions = [];

  // Load time
  if (page.loadTimeMs != null) {
    if (page.loadTimeMs > 4000) { score -= 25; issues.push(`Critical: load time ${page.loadTimeMs}ms (target <2500ms)`); suggestions.push('Audit server response time, compress assets, enable caching'); }
    else if (page.loadTimeMs > 2500) { score -= 15; issues.push(`Load time ${page.loadTimeMs}ms exceeds 2500ms target`); suggestions.push('Optimize images, enable lazy loading, minimize render-blocking resources'); }
    else if (page.loadTimeMs <= 1500) { score += 10; }
  }

  // Schema markup
  if (page.schemaMarkup === false) {
    score -= 10;
    issues.push('No schema markup detected');
    suggestions.push('Add appropriate structured data (Article, Product, FAQ, etc.)');
  } else if (page.schemaMarkup === true) {
    score += 5;
  }

  // Mobile
  if (page.mobileOptimised === false) {
    score -= 20;
    issues.push('Page not optimised for mobile');
    suggestions.push('Implement responsive design and test with Google Mobile-Friendly Tool');
  } else if (page.mobileOptimised === true) {
    score += 5;
  }

  return { score: clamp(score, 0, 100), issues, suggestions };
}

function scoreContent(page) {
  let score = 70;
  const issues = [];
  const suggestions = [];

  // Word count
  if (page.wordCount != null) {
    if (page.wordCount < 300) { score -= 30; issues.push(`Very thin content: ${page.wordCount} words`); suggestions.push('Expand content significantly — aim for 1500+ words for competitive keywords'); }
    else if (page.wordCount < 800) { score -= 15; issues.push(`Thin content: ${page.wordCount} words (recommended 1000+)`); suggestions.push('Add more depth, examples, and supporting content'); }
    else if (page.wordCount < 1500) { score -= 5; issues.push(`Word count ${page.wordCount} is below 1500 recommended for competitive keywords`); suggestions.push('Expand with case studies, data, or additional sections'); }
    else if (page.wordCount >= 2000) { score += 10; }
  }

  // Images
  if (page.images != null && page.images > 0) {
    const altRatio = (page.imagesWithAlt || 0) / page.images;
    if (altRatio < 0.5) { score -= 15; issues.push(`Only ${page.imagesWithAlt || 0} of ${page.images} images have alt text`); suggestions.push('Add descriptive alt text to all images including target keywords where natural'); }
    else if (altRatio < 1) { score -= 5; issues.push(`${page.images - (page.imagesWithAlt || 0)} images missing alt text`); suggestions.push('Add alt text to remaining images'); }
    else { score += 5; }
  } else if (page.images === 0 && page.wordCount && page.wordCount > 500) {
    score -= 10;
    issues.push('No images in content');
    suggestions.push('Add relevant images, charts, or infographics to improve engagement');
  }

  // Headings / structure
  if (page.headings) {
    if (page.headings.length < 2) { score -= 10; issues.push('Insufficient heading structure'); suggestions.push('Add H2/H3 subheadings to organise content'); }
    else if (page.headings.length >= 4) { score += 5; }
  }

  return { score: clamp(score, 0, 100), issues, suggestions };
}

function scoreOnPage(page) {
  let score = 70;
  const issues = [];
  const suggestions = [];

  // Title
  if (page.title) {
    if (page.title.length > 60) { score -= 10; issues.push(`Title too long (${page.title.length} chars, max 60)`); suggestions.push('Shorten title to 50-60 characters, front-load primary keyword'); }
    else if (page.title.length < 30) { score -= 10; issues.push(`Title too short (${page.title.length} chars)`); suggestions.push('Expand title to 50-60 chars with relevant modifiers'); }
    else { score += 5; }
  } else {
    score -= 20;
    issues.push('No title provided');
    suggestions.push('Add a compelling title tag with primary keyword');
  }

  // Meta description
  if (page.description) {
    if (page.description.length > 160) { score -= 5; issues.push(`Meta description too long (${page.description.length} chars)`); suggestions.push('Trim meta description to 120-160 characters'); }
    else if (page.description.length < 70) { score -= 10; issues.push(`Meta description too short (${page.description.length} chars)`); suggestions.push('Write a compelling 120-160 char meta description with target keyword and CTA'); }
    else { score += 5; }
  } else {
    score -= 15;
    issues.push('No meta description');
    suggestions.push('Write a unique meta description (120-160 chars) with primary keyword');
  }

  // Internal links
  if (page.internalLinks != null) {
    if (page.internalLinks === 0) { score -= 15; issues.push('No internal links'); suggestions.push('Add 3-8 contextual internal links to related content'); }
    else if (page.internalLinks < 3) { score -= 5; issues.push(`Only ${page.internalLinks} internal link(s) — aim for 3-8`); suggestions.push('Add more internal links to related pages'); }
    else if (page.internalLinks >= 5) { score += 5; }
  }

  // External links
  if (page.externalLinks != null) {
    if (page.externalLinks === 0) { score -= 5; issues.push('No external links'); suggestions.push('Link to 2-3 authoritative external sources to boost E-E-A-T signals'); }
    else if (page.externalLinks >= 2) { score += 3; }
  }

  return { score: clamp(score, 0, 100), issues, suggestions };
}

function scoreUX(page) {
  let score = 75;
  const issues = [];
  const suggestions = [];

  // Mobile optimised (also impacts UX beyond technical)
  if (page.mobileOptimised === true) {
    score += 10;
  } else if (page.mobileOptimised === false) {
    score -= 15;
    issues.push('Not mobile-optimised — poor mobile UX');
    suggestions.push('Ensure responsive layout, touch-friendly tap targets, readable font sizes');
  }

  // Load time (also UX impact)
  if (page.loadTimeMs != null) {
    if (page.loadTimeMs > 3000) { score -= 15; issues.push('Slow page load degrades user experience'); suggestions.push('Improve load time to under 2.5s for better engagement metrics'); }
    else if (page.loadTimeMs <= 1500) { score += 10; }
  }

  // Content structure signals
  if (page.wordCount && page.wordCount > 300 && page.images && page.images > 0) {
    score += 5; // Visual content aids UX
  }

  return { score: clamp(score, 0, 100), issues, suggestions };
}

function scoreToGrade(score) {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// ── Prompt builders ──────────────────────────────────────────────────

function buildSystemPrompt() {
  const examples = formatPageScorerExamples(1);
  return `You are an expert SEO page auditor. You will receive pages with their deterministic pre-scores
and must produce a final enriched analysis.

For each page:
1. Review the deterministic scores across 4 dimensions (technical, content, on-page, UX)
2. Refine scores if the rule-based assessment missed nuance
3. Add any additional issues or suggestions based on the full context
4. Identify the single top-priority fix with estimated impact
5. Assign a final grade (A+, A, B, C, D, F)

Focus on actionable, specific recommendations — not generic advice.

${examples ? `\n## Few-Shot Examples\n${examples}` : ''}

Respond with valid JSON matching the required schema.`;
}

function buildUserPrompt(preScores, pages, context) {
  const pageDetails = preScores.map((ps, i) => {
    const p = pages[i];
    return `Page ${i + 1}: ${p.url}
  Title: ${p.title || 'N/A'} (${(p.title || '').length} chars)
  Description: ${p.description ? `${p.description.slice(0, 80)}... (${p.description.length} chars)` : 'N/A'}
  Word count: ${p.wordCount || 'N/A'} | Load time: ${p.loadTimeMs ? `${p.loadTimeMs}ms` : 'N/A'} | Mobile: ${p.mobileOptimised ?? 'N/A'}
  Links: ${p.internalLinks || 0} internal, ${p.externalLinks || 0} external
  Images: ${p.images || 0} total, ${p.imagesWithAlt || 0} with alt | Schema: ${p.schemaMarkup ?? 'N/A'}
  Keywords: ${(p.keywords || []).join(', ') || 'N/A'}
  Pre-scores: overall=${ps.overallScore} (${ps.grade}), tech=${ps.dimensions.technical.score}, content=${ps.dimensions.content.score}, onPage=${ps.dimensions.onPage.score}, ux=${ps.dimensions.ux.score}
  Issues found: ${[...ps.dimensions.technical.issues, ...ps.dimensions.content.issues, ...ps.dimensions.onPage.issues, ...ps.dimensions.ux.issues].join('; ') || 'None'}`;
  }).join('\n\n');

  return `## Site Context
Site: ${context.siteUrl || 'Not specified'}
Industry: ${context.industry || 'Not specified'}

## Pages to Score (${pages.length})
${pageDetails}

Review each page's deterministic scores, refine as needed, add contextual recommendations, and produce the final analysis.`;
}

// ── Fallback ────────────────────────────────────────────────────────

function buildFallback(preScores) {
  const scores = preScores.map(ps => ({
    url: ps.url,
    overallScore: ps.overallScore,
    grade: ps.grade,
    dimensions: {
      technical: { score: ps.dimensions.technical.score, issues: ps.dimensions.technical.issues, suggestions: ps.dimensions.technical.suggestions },
      content: { score: ps.dimensions.content.score, issues: ps.dimensions.content.issues, suggestions: ps.dimensions.content.suggestions },
      onPage: { score: ps.dimensions.onPage.score, issues: ps.dimensions.onPage.issues, suggestions: ps.dimensions.onPage.suggestions },
      ux: { score: ps.dimensions.ux.score, issues: ps.dimensions.ux.issues, suggestions: ps.dimensions.ux.suggestions }
    },
    topPriority: findTopPriority(ps),
    estimatedImpact: ps.overallScore < 50 ? 'high' : ps.overallScore < 70 ? 'medium' : 'low'
  }));

  const avgScore = round(avg(scores.map(s => s.overallScore)), 0);

  return {
    scores,
    averageScore: avgScore,
    summary: `${scores.length} page(s) scored. Average: ${avgScore}/100 (${scoreToGrade(avgScore)}). Analysis based on deterministic rules — LLM enrichment unavailable.`
  };
}

function findTopPriority(preScore) {
  const dims = preScore.dimensions;
  const worst = Object.entries(dims).sort(([, a], [, b]) => a.score - b.score)[0];
  const [dimName, dimData] = worst;
  return dimData.suggestions[0] || `Improve ${dimName} score (currently ${dimData.score}/100)`;
}
