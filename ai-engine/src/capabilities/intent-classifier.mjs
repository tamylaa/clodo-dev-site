/**
 * Capability 1: AI-Powered Intent Classifier
 * 
 * Replaces regex-based intent classification with real LLM understanding.
 * Processes keywords in batches through the multi-model provider system.
 */

import { createLogger } from '@tamyla/clodo-framework';
import { runTextGeneration } from '../providers/ai-provider.mjs';

const logger = createLogger('ai-intent');

export async function classifyIntentBatch(body, env) {
  const { keywords = [], context = {} } = body;

  if (!keywords.length) {
    return { error: 'No keywords provided', classifications: [] };
  }

  const batchSize = 50;
  const batches = [];
  for (let i = 0; i < keywords.length; i += batchSize) {
    batches.push(keywords.slice(i, i + batchSize));
  }

  const allClassifications = [];
  let totalTokens = { input: 0, output: 0 };
  let totalCost = 0;
  let provider = null;

  for (const batch of batches) {
    const result = await runTextGeneration({
      systemPrompt: buildIntentSystemPrompt(context),
      userPrompt: buildIntentUserPrompt(batch),
      complexity: 'simple',
      capability: 'intent-classify',
      maxTokens: 2048
    }, env);

    provider = result.provider;
    totalTokens.input += result.tokensUsed?.input || 0;
    totalTokens.output += result.tokensUsed?.output || 0;
    totalCost += result.cost?.estimated || 0;

    const parsed = parseIntentResponse(result.text, batch);
    allClassifications.push(...parsed);
  }

  logger.info(`Classified ${allClassifications.length} keywords via ${provider}`);

  return {
    classifications: allClassifications,
    metadata: {
      provider,
      keywordsProcessed: keywords.length,
      batches: batches.length,
      tokensUsed: totalTokens,
      cost: parseFloat(totalCost.toFixed(6))
    }
  };
}

function buildIntentSystemPrompt(context) {
  const siteContext = context.siteUrl ? `The website is ${context.siteUrl}.` : '';
  const industryContext = context.industry ? `Industry: ${context.industry}.` : '';

  return `You are a search intent classification expert. ${siteContext} ${industryContext}

For each search query, classify:
- intent: "transactional" | "commercial" | "informational" | "navigational"
- confidence: 0.0-1.0
- businessValue: 1-10 (10 = highest revenue potential)
- contentType: recommended content format (e.g., "landing-page", "comparison-page", "guide", "glossary-entry", "product-page")
- reasoning: 1-sentence explanation

Multi-intent queries: pick the DOMINANT intent but note secondary signals.

RESPOND ONLY with a JSON array, one object per keyword:
[{"query":"...","intent":"...","confidence":0.0,"businessValue":0,"contentType":"...","reasoning":"..."}]`;
}

function buildIntentUserPrompt(keywords) {
  const kwList = keywords.map((kw, i) => `${i + 1}. "${kw}"`).join('\n');
  return `Classify these search queries by intent:\n\n${kwList}`;
}

function parseIntentResponse(text, originalKeywords) {
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      logger.warn('No JSON array found in intent response');
      return fallbackClassifications(originalKeywords);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return fallbackClassifications(originalKeywords);

    return parsed.map((item, i) => ({
      query: item.query || originalKeywords[i] || `keyword-${i}`,
      intent: validateIntent(item.intent),
      confidence: clamp(item.confidence || 0.5, 0, 1),
      businessValue: clamp(item.businessValue || 5, 1, 10),
      contentType: item.contentType || 'article',
      reasoning: item.reasoning || '',
      source: 'ai-engine'
    }));
  } catch (err) {
    logger.warn('Failed to parse intent response:', err.message);
    return fallbackClassifications(originalKeywords);
  }
}

function validateIntent(intent) {
  const valid = ['transactional', 'commercial', 'informational', 'navigational'];
  return valid.includes(intent) ? intent : 'informational';
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function fallbackClassifications(keywords) {
  return keywords.map(kw => ({
    query: kw,
    intent: 'informational',
    confidence: 0.3,
    businessValue: 4,
    contentType: 'article',
    reasoning: 'Fallback — LLM response could not be parsed',
    source: 'ai-engine-fallback'
  }));
}
