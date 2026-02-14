/**
 * Capability 6: Recommendation Refiner (v2 — Multi-Turn)
 *
 * Two-pass AI refinement: Critic → Refiner.
 * Pass 1 critiques weak spots, Pass 2 rewrites with stronger evidence.
 *
 * Enhanced with:
 *   - Few-shot examples for quality anchoring
 *   - Structured output (jsonMode) on the refine pass
 *   - Zod schema validation
 *   - Improved parsing via response-parser
 */

import { createLogger } from '../lib/framework-shims.mjs';
import { runTextGeneration } from '../providers/ai-provider.mjs';
import { RecommendationRefinerInputSchema, RecommendationRefinerOutputSchema, RECOMMENDATION_REFINER_JSON_SCHEMA } from '../lib/schemas/index.mjs';
import { parseAndValidate } from '../lib/response-parser.mjs';
import { formatRecommendationExamples } from '../lib/few-shot/index.mjs';
import { validateInput } from '../lib/validate-input.mjs';

const logger = createLogger('ai-refiner');

export async function refineRecommendations(body, env) {
  const v = validateInput(RecommendationRefinerInputSchema, body);
  if (!v.valid) return v.error;

  const { recommendations = [], analyticsContext = {} } = v.data;

  if (!recommendations.length) {
    return { refined: [], message: 'No recommendations to refine' };
  }

  const batch = recommendations.slice(0, 12);

  // Pass 1: Critique
  const critiqueResult = await runTextGeneration({
    systemPrompt: buildCriticSystemPrompt(),
    userPrompt: buildCriticUserPrompt(batch, analyticsContext),
    complexity: 'standard',
    capability: 'refine-recs',
    maxTokens: 2048
  }, env);

  const critique = critiqueResult.text;
  logger.info(`Critique pass complete via ${critiqueResult.provider}`);

  // Pass 2: Refine (prefer Claude — complex task) with structured output
  const refineResult = await runTextGeneration({
    systemPrompt: buildRefinerSystemPrompt(),
    userPrompt: buildRefinerUserPrompt(batch, critique, analyticsContext),
    complexity: 'complex',
    capability: 'refine-recs',
    maxTokens: 4096,
    jsonMode: true,
    jsonSchema: RECOMMENDATION_REFINER_JSON_SCHEMA
  }, env);

  const { data: parsed, meta } = parseAndValidate(
    refineResult.text,
    RecommendationRefinerOutputSchema,
    {
      fallback: () => ({ refined: addRefinementFlags(batch) }),
      expect: 'object'
    }
  );

  const refined = (parsed?.refined || addRefinementFlags(batch)).map((r, i) => ({
    ...r,
    id: r.id || r.original || batch[i]?.id || `refined-${i}`,
    refinedBy: meta.fallbackUsed ? 'ai-engine-fallback' : 'ai-engine',
    refinedAt: new Date().toISOString()
  }));

  logger.info(`Refinement pass complete via ${refineResult.provider} — ${refined.length} recs refined`, {
    parseMethod: meta.parseMethod,
    schemaValid: meta.schemaValid
  });

  return {
    refined,
    critique: critique.slice(0, 2000),
    metadata: {
      provider: `critique:${critiqueResult.provider} / refine:${refineResult.provider}`,
      passes: 2,
      originalCount: batch.length,
      refinedCount: refined.length,
      tokensUsed: {
        critique: critiqueResult.tokensUsed,
        refine: refineResult.tokensUsed
      },
      cost: {
        critique: critiqueResult.cost,
        refine: refineResult.cost,
        total: parseFloat(((critiqueResult.cost?.estimated || 0) + (refineResult.cost?.estimated || 0)).toFixed(6))
      },
      totalDurationMs: critiqueResult.durationMs + refineResult.durationMs,
      parseQuality: {
        method: meta.parseMethod,
        schemaValid: meta.schemaValid,
        fallbackUsed: meta.fallbackUsed
      }
    }
  };
}

function buildCriticSystemPrompt() {
  return `You are a senior SEO consultant reviewing AI-generated recommendations. Be HARSH but constructive.

For each recommendation, evaluate:
1. SPECIFICITY: Does it reference exact pages, keywords, and metrics? Or is it generic?
2. EVIDENCE: Is the projected impact realistic and backed by data? Or made up?
3. ACTIONABILITY: Can someone implement this in under 2 hours with clear steps? Or is it vague?
4. PRIORITY: Is the priority level (critical/high/medium/low) justified by the data?
5. UNIQUENESS: Is this a genuinely useful insight? Or boilerplate advice anyone could give?

Rate each recommendation 1-10 and explain what's wrong. Be specific about weaknesses.

RESPOND as plain text with numbered critiques, one per recommendation.`;
}

function buildCriticUserPrompt(recs, context) {
  const recBlocks = recs.map((r, i) => {
    return `REC ${i + 1} [${r.priority || 'medium'}] — ${r.category || 'general'}
  Title: ${r.title}
  Description: ${r.description || ''}
  Affected pages: ${(r.affectedPages || []).join(', ') || 'none specified'}
  Affected keywords: ${(r.affectedKeywords || []).join(', ') || 'none specified'}
  Projected impact: ${r.projectedImpact ? JSON.stringify(r.projectedImpact) : 'none'}
  Specific change: ${r.specificChange || 'none'}`;
  }).join('\n\n');

  return `Review these ${recs.length} SEO recommendations:\n\n${recBlocks}`;
}

function buildRefinerSystemPrompt() {
  const fewShot = formatRecommendationExamples(2);

  return `You are an expert SEO strategist. You've received recommendations AND a critique of those recommendations. Your job is to REWRITE each recommendation to address every critique point.

${fewShot}

RULES:
1. Every recommendation MUST reference specific pages AND keywords
2. Every projected impact MUST be quantified with realistic numbers
3. Every recommendation MUST have 3+ concrete implementation steps
4. Remove any generic advice — every sentence must be specific to the data
5. If a recommendation is fundamentally weak, replace it with something better
6. Maintain the same JSON structure as the original

RESPOND ONLY with this JSON:
{"refined":[{"id":"...","priority":"critical|high|medium|low","category":"...","title":"...","description":"...","affectedPages":[],"affectedKeywords":[],"specificChange":"...","implementation_steps":[],"projectedImpact":{"metric":"...","currentValue":0,"projectedValue":0,"confidence":0.0},"evidence":"...","refinementNotes":"what was changed and why"}]}`;
}

function buildRefinerUserPrompt(recs, critique, context) {
  const recsJson = JSON.stringify(recs, null, 2);

  let contextBlock = '';
  if (context.summary) {
    contextBlock = `\nANALYTICS CONTEXT:
  Impressions: ${context.summary.totalImpressions || 'N/A'}
  Clicks: ${context.summary.totalClicks || 'N/A'}
  CTR: ${context.summary.avgCTR || 'N/A'}
  Position: ${context.summary.avgPosition || 'N/A'}`;
  }

  return `ORIGINAL RECOMMENDATIONS:\n${recsJson}\n\nCRITIQUE:\n${critique}\n${contextBlock}\n\nRewrite every recommendation to address the critique. Make them specific, evidence-backed, and actionable.`;
}

// parseRefineResponse replaced by parseAndValidate from response-parser.mjs

function addRefinementFlags(recs) {
  return recs.map(r => ({
    ...r,
    refinedBy: 'ai-engine-fallback',
    refinementNotes: 'Refinement response could not be parsed — returning originals'
  }));
}
