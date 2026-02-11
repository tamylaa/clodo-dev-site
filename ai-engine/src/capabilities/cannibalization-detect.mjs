/**
 * Capability 8: Keyword Cannibalization Detection
 *
 * Hybrid pipeline:
 *   1. Deterministic pre-screening — exact/fuzzy keyword overlap detection
 *   2. LLM analysis — severity assessment, consolidation recommendations
 *   3. Zod validation + structured output
 *
 * Detects when multiple pages on the same site compete for identical or
 * near-identical keywords, diluting ranking signals.
 */

import { createLogger } from '../lib/framework-shims.mjs';
import { runTextGeneration } from '../providers/ai-provider.mjs';
import { CannibalizationOutputSchema, CANNIBALIZATION_JSON_SCHEMA } from '../lib/schemas/index.mjs';
import { parseAndValidate } from '../lib/response-parser.mjs';
import { formatCannibalizationExamples } from '../lib/few-shot/index.mjs';
import { jaccardSimilarity } from '../lib/math-utils.mjs';

const logger = createLogger('ai-cannibalization');

const MAX_PAGES = 100;

export async function detectCannibalization(body, env) {
  const { pages = [], context = {} } = body;

  if (pages.length < 2) {
    return { conflicts: [], summary: 'At least 2 pages required for cannibalization detection', overallSeverity: 'none', metadata: {} };
  }

  const trimmedPages = pages.slice(0, MAX_PAGES);

  // ── Phase 1: Deterministic overlap detection ──────────────────────
  const candidateClusters = findOverlappingKeywords(trimmedPages);

  if (candidateClusters.length === 0) {
    return {
      conflicts: [],
      summary: 'No keyword overlaps detected across the provided pages.',
      overallSeverity: 'none',
      metadata: { pagesAnalysed: trimmedPages.length, method: 'deterministic', clustersFound: 0 }
    };
  }

  // ── Phase 2: LLM severity analysis + recommendations ─────────────
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(candidateClusters, trimmedPages, context);

  const result = await runTextGeneration({
    systemPrompt,
    userPrompt,
    complexity: 'moderate',
    capability: 'cannibalization-detect',
    maxTokens: 4096,
    jsonMode: true,
    jsonSchema: CANNIBALIZATION_JSON_SCHEMA
  }, env);

  // ── Phase 3: Parse + validate ─────────────────────────────────────
  const { data, meta } = parseAndValidate(result.text, CannibalizationOutputSchema, {
    fallback: buildFallback(candidateClusters)
  });

  logger.info(`Cannibalization analysis complete`, {
    conflicts: data.conflicts?.length || 0,
    severity: data.overallSeverity,
    parseMethod: meta.parseMethod
  });

  return {
    ...data,
    metadata: {
      provider: result.provider,
      model: result.model,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
      pagesAnalysed: trimmedPages.length,
      candidateClusters: candidateClusters.length,
      parseQuality: meta
    }
  };
}

// ── Deterministic overlap detection ─────────────────────────────────

function findOverlappingKeywords(pages) {
  // Build a map: keyword → list of pages that target it
  const keywordMap = new Map();

  for (const page of pages) {
    const keywords = page.keywords || extractImpliedKeywords(page);
    for (const kw of keywords) {
      const normalised = kw.toLowerCase().trim();
      if (!normalised) continue;
      if (!keywordMap.has(normalised)) keywordMap.set(normalised, []);
      keywordMap.get(normalised).push(page);
    }
  }

  // Find keywords targeted by 2+ pages
  const exactOverlaps = [];
  for (const [keyword, targetPages] of keywordMap) {
    if (targetPages.length >= 2) {
      exactOverlaps.push({ keyword, pages: targetPages, type: 'exact' });
    }
  }

  // Fuzzy overlap: check title-based similarity for pages without explicit keywords
  const fuzzyOverlaps = findFuzzyOverlaps(pages, keywordMap);

  // Deduplicate: prefer exact matches
  const seen = new Set(exactOverlaps.map(o => o.keyword));
  const combined = [...exactOverlaps];
  for (const f of fuzzyOverlaps) {
    if (!seen.has(f.keyword)) {
      combined.push(f);
      seen.add(f.keyword);
    }
  }

  return combined.slice(0, 20); // cap at 20 clusters
}

function extractImpliedKeywords(page) {
  // Derive keywords from title if explicit keywords aren't provided
  if (!page.title) return [];
  return [page.title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\b(the|a|an|in|on|at|for|to|of|and|or|is|are)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()];
}

function findFuzzyOverlaps(pages, existingMap) {
  const overlaps = [];
  const titles = pages.map(p => tokenize(p.title || p.url || ''));

  for (let i = 0; i < titles.length; i++) {
    for (let j = i + 1; j < titles.length; j++) {
      const sim = jaccardSimilarity(titles[i], titles[j]);
      if (sim >= 0.5) {
        const combinedTitle = `[fuzzy] ${pages[i].title || pages[i].url} ↔ ${pages[j].title || pages[j].url}`;
        overlaps.push({
          keyword: combinedTitle.slice(0, 80),
          pages: [pages[i], pages[j]],
          type: 'fuzzy',
          similarity: sim
        });
      }
    }
  }

  return overlaps.slice(0, 10);
}

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
}

// ── Prompt builders ──────────────────────────────────────────────────

function buildSystemPrompt() {
  const examples = formatCannibalizationExamples(2);
  return `You are an expert SEO analyst specialising in keyword cannibalization detection.

Analyse the provided keyword overlap clusters and determine:
1. Severity of each conflict (critical/high/medium/low)
2. Which page should be the canonical winner
3. Specific actionable recommendations (redirect, merge, differentiate, canonical tag)
4. Estimated traffic loss percentage from cannibalization

Severity guidelines:
- critical: 3+ pages competing, high-value keyword, both in top 20
- high: 2 pages with significant ranking impact, key conversion keyword
- medium: 2 pages with moderate overlap, one significantly outperforms
- low: minor overlap, different intent angles, minimal impact

${examples ? `\n## Few-Shot Examples\n${examples}` : ''}

Respond with valid JSON matching the required schema.`;
}

function buildUserPrompt(clusters, pages, context) {
  const clusterSummary = clusters.map((c, i) => {
    const pageSummaries = c.pages.map(p =>
      `  - ${p.url} | title: "${p.title || 'N/A'}" | pos: ${p.position ?? 'N/A'} | clicks: ${p.clicks ?? 'N/A'} | impressions: ${p.impressions ?? 'N/A'}`
    ).join('\n');
    return `Cluster ${i + 1}: "${c.keyword}" (${c.type} match)\n${pageSummaries}`;
  }).join('\n\n');

  return `## Site Context
Site: ${context.siteUrl || 'Not specified'}
Industry: ${context.industry || 'Not specified'}
Total pages analysed: ${pages.length}

## Keyword Overlap Clusters
${clusterSummary}

Analyse each cluster for cannibalization severity and provide consolidation recommendations.`;
}

// ── Fallback ────────────────────────────────────────────────────────

function buildFallback(clusters) {
  return {
    conflicts: clusters.slice(0, 5).map(c => ({
      keyword: c.keyword,
      severity: c.pages.length >= 3 ? 'high' : 'medium',
      pages: c.pages.map(p => ({
        url: p.url,
        title: p.title || '',
        position: p.position,
        clicks: p.clicks,
        impressions: p.impressions
      })),
      recommendation: `Multiple pages target "${c.keyword}". Review and consolidate content or differentiate intent targeting.`,
      suggestedCanonical: c.pages.sort((a, b) => (a.position || 999) - (b.position || 999))[0]?.url,
      estimatedTrafficLoss: 20
    })),
    summary: `${clusters.length} potential cannibalization conflict(s) detected across provided pages.`,
    overallSeverity: clusters.length > 3 ? 'high' : clusters.length > 0 ? 'medium' : 'none'
  };
}
