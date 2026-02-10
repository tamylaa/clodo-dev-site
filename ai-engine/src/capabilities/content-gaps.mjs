/**
 * Capability 9: Content Gap Analysis
 *
 * Hybrid pipeline:
 *   1. Deterministic set-difference — find competitor keywords absent from site
 *   2. LLM enrichment — prioritise gaps, suggest content types & titles
 *   3. Zod validation + structured output
 *
 * Identifies topics/keywords competitors rank for that the target site doesn't,
 * revealing high-value content creation opportunities.
 */

import { createLogger } from '../lib/framework-shims.mjs';
import { runTextGeneration } from '../providers/ai-provider.mjs';
import { ContentGapsOutputSchema, CONTENT_GAPS_JSON_SCHEMA } from '../lib/schemas/index.mjs';
import { parseAndValidate } from '../lib/response-parser.mjs';
import { formatContentGapExamples } from '../lib/few-shot/index.mjs';
import { jaccardSimilarity } from '../lib/math-utils.mjs';

const logger = createLogger('ai-content-gaps');

const MAX_GAPS = 30; // Cap analysis at 30 gaps to keep prompts focused

export async function analyseContentGaps(body, env) {
  const { siteKeywords = [], competitorKeywords = [], context = {} } = body;

  if (!siteKeywords.length || !competitorKeywords.length) {
    return {
      gaps: [],
      summary: 'Both siteKeywords and competitorKeywords are required.',
      topOpportunities: [],
      metadata: {}
    };
  }

  // ── Phase 1: Deterministic gap detection ──────────────────────────
  const gaps = findKeywordGaps(siteKeywords, competitorKeywords);

  if (gaps.length === 0) {
    return {
      gaps: [],
      summary: 'No content gaps detected — the site already covers all competitor keywords (or very close variants).',
      topOpportunities: [],
      metadata: { siteKeywords: siteKeywords.length, competitorKeywords: competitorKeywords.length, method: 'deterministic', gapsFound: 0 }
    };
  }

  // ── Phase 2: LLM enrichment + prioritisation ─────────────────────
  const systemPrompt = buildSystemPrompt(context);
  const userPrompt = buildUserPrompt(gaps, siteKeywords, context);

  const result = await runTextGeneration({
    systemPrompt,
    userPrompt,
    complexity: 'moderate',
    capability: 'content-gaps',
    maxTokens: 4096,
    jsonMode: true,
    jsonSchema: CONTENT_GAPS_JSON_SCHEMA
  }, env);

  // ── Phase 3: Parse + validate ─────────────────────────────────────
  const { data, meta } = parseAndValidate(result.text, ContentGapsOutputSchema, {
    fallback: buildFallback(gaps)
  });

  logger.info(`Content gap analysis complete`, {
    gapsFound: data.gaps?.length || 0,
    topOpportunities: data.topOpportunities?.length || 0,
    parseMethod: meta.parseMethod
  });

  return {
    ...data,
    metadata: {
      provider: result.provider,
      model: result.model,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
      siteKeywordCount: siteKeywords.length,
      competitorKeywordCount: competitorKeywords.length,
      rawGapsDetected: gaps.length,
      parseQuality: meta
    }
  };
}

// ── Deterministic gap detection ─────────────────────────────────────

function findKeywordGaps(siteKeywords, competitorKeywords) {
  const siteNormalised = new Set(siteKeywords.map(k => normalise(k)));
  const siteTokenSets = siteKeywords.map(k => tokenize(k));

  const gaps = [];

  for (const ck of competitorKeywords) {
    const compKw = typeof ck === 'string' ? ck : ck.keyword;
    const normalised = normalise(compKw);

    // Skip if the site already targets this exact keyword
    if (siteNormalised.has(normalised)) continue;

    // Skip if very similar to an existing site keyword (Jaccard >= 0.7)
    const compTokens = tokenize(compKw);
    const isCovered = siteTokenSets.some(siteTokens => jaccardSimilarity(siteTokens, compTokens) >= 0.7);
    if (isCovered) continue;

    gaps.push({
      keyword: compKw,
      source: typeof ck === 'object' ? ck.source : undefined,
      position: typeof ck === 'object' ? ck.position : undefined,
      volume: typeof ck === 'object' ? ck.volume : undefined
    });
  }

  // Sort by estimated value: prefer high-volume, low-position (competitor ranks well)
  gaps.sort((a, b) => {
    const scoreA = (a.volume || 0) * (a.position ? (100 - Math.min(a.position, 100)) / 100 : 0.5);
    const scoreB = (b.volume || 0) * (b.position ? (100 - Math.min(b.position, 100)) / 100 : 0.5);
    return scoreB - scoreA;
  });

  return gaps.slice(0, MAX_GAPS);
}

function normalise(kw) {
  return kw.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
}

function tokenize(text) {
  return normalise(text).split(/\s+/).filter(Boolean);
}

// ── Prompt builders ──────────────────────────────────────────────────

function buildSystemPrompt(context) {
  const examples = formatContentGapExamples(1);
  return `You are an expert SEO content strategist specialising in content gap analysis.

Given a list of keyword gaps (keywords competitors rank for but the target site doesn't),
you must:
1. Assess the opportunity level (high/medium/low) based on volume, difficulty, and relevance
2. Suggest the best content type (blog post, landing page, comparison guide, etc.)
3. Propose an optimised title for each gap
4. Explain why this is a gap worth filling
5. Identify the top 3-5 highest-priority opportunities

Opportunity guidelines:
- high: Volume 1000+, competitor top-10, strong relevance to site
- medium: Volume 100-999, or weaker relevance
- low: Volume <100, tangential topic, high difficulty

Difficulty guidelines:
- easy: Low competition, informational intent, topic expertise exists
- moderate: Medium competition, mixed intent
- hard: High competition, saturated SERP, requires significant authority

${context.industry ? `Industry: ${context.industry}` : ''}
${context.targetAudience ? `Target Audience: ${context.targetAudience}` : ''}

${examples ? `\n## Few-Shot Examples\n${examples}` : ''}

Respond with valid JSON matching the required schema.`;
}

function buildUserPrompt(gaps, siteKeywords, context) {
  const gapList = gaps.map((g, i) =>
    `${i + 1}. "${g.keyword}"${g.volume ? ` (vol: ${g.volume})` : ''}${g.position ? ` — competitor pos: ${g.position}` : ''}${g.source ? ` [${g.source}]` : ''}`
  ).join('\n');

  return `## Site Context
Site: ${context.siteUrl || 'Not specified'}
Existing site keywords (${siteKeywords.length}): ${siteKeywords.slice(0, 20).join(', ')}${siteKeywords.length > 20 ? '...' : ''}

## Content Gaps Detected (${gaps.length})
${gapList}

Analyse each gap and provide opportunity assessment, content recommendations, and prioritisation.`;
}

// ── Fallback ────────────────────────────────────────────────────────

function buildFallback(gaps) {
  const mapped = gaps.slice(0, 10).map(g => ({
    keyword: g.keyword,
    opportunity: g.volume && g.volume >= 1000 ? 'high' : g.volume && g.volume >= 100 ? 'medium' : 'low',
    estimatedVolume: g.volume || 0,
    difficulty: 'moderate',
    suggestedContentType: 'blog-post',
    suggestedTitle: `Guide to ${g.keyword.charAt(0).toUpperCase() + g.keyword.slice(1)}`,
    reasoning: `Competitor${g.source ? ` (${g.source})` : ''} ranks${g.position ? ` at position ${g.position}` : ''} for this keyword. Content gap identified.`,
    competitorUrls: g.source ? [g.source] : []
  }));

  const topOps = mapped.filter(g => g.opportunity === 'high').slice(0, 5).map(g => g.keyword);

  return {
    gaps: mapped,
    summary: `${gaps.length} content gap(s) identified. ${topOps.length} high-priority opportunities.`,
    topOpportunities: topOps.length > 0 ? topOps : mapped.slice(0, 3).map(g => g.keyword)
  };
}
