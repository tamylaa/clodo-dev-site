/**
 * Capability 1: AI-Powered Intent Classifier (v2)
 *
 * Hybrid pipeline:
 *   1. Heuristic pre-filter (instant, free, deterministic)
 *   2. LLM refinement for ambiguous cases (with structured output + Zod validation)
 *   3. Cross-validation between heuristic and LLM signals
 *
 * Uses: Zod schemas, few-shot examples, SEO heuristics, response-parser,
 *        and provider-native structured output (jsonMode / jsonSchema).
 */

import { createLogger } from '../lib/framework-shims.mjs';
import { runTextGeneration } from '../providers/ai-provider.mjs';
import { IntentClassifyInputSchema, IntentClassificationSchema, INTENT_JSON_SCHEMA } from '../lib/schemas/index.mjs';
import { parseArrayResponse } from '../lib/response-parser.mjs';
import { formatIntentExamples } from '../lib/few-shot/index.mjs';
import { classifyIntentHeuristic, estimateBusinessValue, suggestContentType } from '../lib/seo-knowledge/index.mjs';
import { validateInput } from '../lib/validate-input.mjs';

const logger = createLogger('ai-intent');

const HEURISTIC_THRESHOLD = 0.82; // Above this confidence → skip LLM

// Helper to generate explainability fields
function generateExplainability(query, intent, confidence, signals) {
  const explanation = `This keyword "${query}" is classified as ${intent} intent because it contains signals like: ${signals.join(', ')}. This suggests users are looking to ${intent === 'transactional' ? 'make a purchase' : intent === 'commercial' ? 'research products' : intent === 'informational' ? 'learn information' : 'find a specific site'}.`;

  const certainty = confidence > 0.8 ? 'High' : confidence > 0.6 ? 'Medium' : 'Low';

  const alternatives = [];
  if (confidence < 0.9) {
    // Add plausible alternatives
    const altIntents = ['transactional', 'commercial', 'informational', 'navigational'].filter(i => i !== intent);
    altIntents.forEach(alt => {
      alternatives.push({ intent: alt, confidence: Math.max(0, confidence - 0.2) });
    });
  }

  const nextSteps = [];
  if (intent === 'transactional') {
    nextSteps.push('Optimize landing pages for conversions with clear CTAs');
    nextSteps.push('Add trust signals like reviews and guarantees');
  } else if (intent === 'commercial') {
    nextSteps.push('Create comparison content or product guides');
    nextSteps.push('Target long-tail keywords for better ranking');
  } else if (intent === 'informational') {
    nextSteps.push('Produce educational content like blog posts or FAQs');
    nextSteps.push('Build topical authority with comprehensive guides');
  } else {
    nextSteps.push('Ensure brand consistency in title tags and meta descriptions');
    nextSteps.push('Focus on local SEO if applicable');
  }

  return {
    explanation,
    confidenceBreakdown: { certainty, alternatives: alternatives.length ? alternatives : undefined },
    nextSteps
  };
}

export async function classifyIntentBatch(body, env) {
  const v = validateInput(IntentClassifyInputSchema, body);
  if (!v.valid) return v.error;

  const { keywords = [], context = {} } = v.data;

  if (!keywords.length) {
    return { error: 'No keywords provided', classifications: [] };
  }

  // ── Phase 1: Heuristic pre-filter ──────────────────────────────────
  const heuristicResults = keywords.map(kw => {
    const q = typeof kw === 'string' ? kw : kw.query || kw.keyword || String(kw);
    const h = classifyIntentHeuristic(q);
    return {
      query: q,
      heuristic: h,
      needsLLM: h.isAmbiguous || h.confidence < HEURISTIC_THRESHOLD
    };
  });

  const llmNeeded = heuristicResults.filter(r => r.needsLLM);
  const heuristicOnly = heuristicResults.filter(r => !r.needsLLM);

  // Build classifications for heuristic-resolved keywords
  const heuristicClassifications = heuristicOnly.map(r => {
    const base = {
      query: r.query,
      intent: r.heuristic.intent,
      confidence: r.heuristic.confidence,
      businessValue: estimateBusinessValue(r.query, r.heuristic.intent),
      contentType: suggestContentType(r.query, r.heuristic.intent),
      reasoning: `Heuristic: matched [${r.heuristic.signals.join(', ')}]`,
      source: 'heuristic'
    };
    return { ...base, ...generateExplainability(r.query, r.heuristic.intent, r.heuristic.confidence, r.heuristic.signals) };
  });

  // ── Phase 2: LLM for ambiguous keywords ────────────────────────────
  let llmClassifications = [];
  let metadata = { provider: 'heuristic-only', tokensUsed: { input: 0, output: 0 }, cost: 0, fallbackUsed: false, attemptIndex: 0 };

  if (llmNeeded.length > 0) {
    const batchSize = 50;
    const batches = [];
    for (let i = 0; i < llmNeeded.length; i += batchSize) {
      batches.push(llmNeeded.slice(i, i + batchSize));
    }

    let totalTokens = { input: 0, output: 0 };
    let totalCost = 0;
    let provider = null;

    for (const batch of batches) {
      const queries = batch.map(r => r.query);

      const result = await runTextGeneration({
        systemPrompt: buildIntentSystemPrompt(context),
        userPrompt: buildIntentUserPrompt(queries),
        complexity: 'simple',
        capability: 'intent-classify',
        maxTokens: 2048,
        jsonMode: true,
        jsonSchema: INTENT_JSON_SCHEMA
      }, env);

      provider = result.provider;
      totalTokens.input += result.tokensUsed?.input || 0;
      totalTokens.output += result.tokensUsed?.output || 0;
      totalCost += result.cost?.estimated || 0;

      // Update metadata with fallback info
      if (result.fallbackUsed) {
        metadata.fallbackUsed = true;
        metadata.attemptIndex = result.attemptIndex;
      }

      // Parse + validate with Zod
      const { data: parsed, meta } = parseArrayResponse(
        result.text,
        IntentClassificationSchema,
        (i, orig) => fallbackClassification(queries[i]),
        queries
      );

      // ── Phase 3: Cross-validate heuristic ↔ LLM ─────────────────────
      const crossValidated = parsed.map((item, i) => {
        const heuristic = batch[i].heuristic;
        const query = batch[i].query;

        // If this was a fallback item, don't cross-validate — just return as-is
        if (meta.fallbackUsed || item.source === 'ai-engine-fallback') {
          return item;
        }

        const llmIntent = validateIntent(item.intent);

        // If heuristic and LLM agree → boost confidence
        const agreedItem = {
          query: item.query || query,
          intent: llmIntent,
          confidence: Math.min(1, (item.confidence || 0.7) * 1.15),
          businessValue: clamp(item.businessValue || estimateBusinessValue(query, llmIntent), 1, 10),
          contentType: item.contentType || suggestContentType(query, llmIntent),
          reasoning: item.reasoning || '',
          source: 'llm+heuristic-agree'
        };
        return { ...agreedItem, ...generateExplainability(query, llmIntent, agreedItem.confidence, heuristic.signals) };

        // If they disagree → use LLM but lower confidence, note conflict
        const disagreedItem = {
          query: item.query || query,
          intent: llmIntent,
          confidence: clamp((item.confidence || 0.7) * 0.85, 0, 1),
          businessValue: clamp(item.businessValue || estimateBusinessValue(query, llmIntent), 1, 10),
          contentType: item.contentType || suggestContentType(query, llmIntent),
          reasoning: `${item.reasoning || ''} [heuristic suggested "${heuristic.intent}" with signals: ${heuristic.signals.join(', ')}]`,
          source: 'llm-override'
        };
        return { ...disagreedItem, ...generateExplainability(query, llmIntent, disagreedItem.confidence, heuristic.signals) };
      });

      llmClassifications.push(...crossValidated);

      logger.info(`Parsed ${parsed.length} LLM classifications`, {
        parseMethod: meta.parseMethod,
        schemaValid: meta.schemaValid
      });
    }

    metadata = {
      provider,
      tokensUsed: totalTokens,
      cost: parseFloat(totalCost.toFixed(6))
    };
  }

  // Merge heuristic + LLM results in original order
  const allClassifications = mergeInOriginalOrder(keywords, heuristicResults, heuristicClassifications, llmClassifications);

  logger.info(`Classified ${allClassifications.length} keywords (${heuristicOnly.length} heuristic, ${llmNeeded.length} LLM)`);

  return {
    classifications: allClassifications,
    metadata: {
      ...metadata,
      keywordsProcessed: keywords.length,
      heuristicResolved: heuristicOnly.length,
      llmProcessed: llmNeeded.length,
      batches: Math.ceil(llmNeeded.length / 50)
    }
  };
}

// ── Helpers ─────────────────────────────────────────────────────────

function mergeInOriginalOrder(keywords, heuristicResults, heuristicClassifications, llmClassifications) {
  const result = [];
  let hIdx = 0, lIdx = 0;

  for (const hr of heuristicResults) {
    if (!hr.needsLLM) {
      result.push(heuristicClassifications[hIdx++]);
    } else {
      result.push(llmClassifications[lIdx++] || fallbackClassification(hr.query));
    }
  }

  return result;
}

function buildIntentSystemPrompt(context) {
  const siteContext = context.siteUrl ? `The website is ${context.siteUrl}.` : '';
  const industryContext = context.industry ? `Industry: ${context.industry}.` : '';

  const fewShot = formatIntentExamples(4);

  return `You are a search intent classification expert. ${siteContext} ${industryContext}

For each search query, classify:
- intent: "transactional" | "commercial" | "informational" | "navigational"
- confidence: 0.0-1.0
- businessValue: 1-10 (10 = highest revenue potential)
- contentType: recommended content format (e.g., "landing-page", "comparison-page", "guide", "glossary-entry", "product-page")
- reasoning: 1-sentence technical explanation
- explanation: Plain-language explanation of the intent and why it matters for SEO
- confidenceBreakdown: { certainty: "High"|"Medium"|"Low", alternatives: [{intent, confidence}] if applicable }
- nextSteps: Array of 2-3 simple, actionable SEO recommendations based on the intent

Multi-intent queries: pick the DOMINANT intent but note secondary signals.

${fewShot}

RESPOND ONLY with a JSON array, one object per keyword:
[{"query":"...","intent":"...","confidence":0.0,"businessValue":0,"contentType":"...","reasoning":"...","explanation":"...","confidenceBreakdown":{"certainty":"..."},"nextSteps":["..."]}]`;
}

function buildIntentUserPrompt(keywords) {
  const kwList = keywords.map((kw, i) => `${i + 1}. "${kw}"`).join('\n');
  return `Classify these search queries by intent:\n\n${kwList}`;
}

function validateIntent(intent) {
  const valid = ['transactional', 'commercial', 'informational', 'navigational'];
  return valid.includes(intent) ? intent : 'informational';
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function fallbackClassification(keyword) {
  const kw = typeof keyword === 'string' ? keyword : keyword?.query || keyword?.keyword || String(keyword);
  const h = classifyIntentHeuristic(kw);
  const base = {
    query: kw,
    intent: h.intent,
    confidence: Math.max(0.3, h.confidence * 0.8),
    businessValue: estimateBusinessValue(kw, h.intent),
    contentType: suggestContentType(kw, h.intent),
    reasoning: 'Fallback — LLM response could not be parsed, using heuristic',
    source: 'ai-engine-fallback'
  };
  return { ...base, ...generateExplainability(kw, h.intent, base.confidence, h.signals) };
}
