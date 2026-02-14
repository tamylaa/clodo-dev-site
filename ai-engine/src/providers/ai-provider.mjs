/**
 * AI Provider — Multi-Model Orchestrator
 * 
 * This is the single entry point for all AI operations.
 * It routes requests to the optimal model based on:
 *   1. Task capability (intent-classify, chat, refine-recs, etc.)
 *   2. Complexity level (simple, standard, complex)
 *   3. Provider availability (which API keys are configured)
 *   4. User/env preference (AI_PROVIDER, AI_PREFERRED_PROVIDER)
 *   5. Fallback chain (if preferred fails, try next in line)
 * 
 * Provider priority (default): Claude > OpenAI > Gemini > Mistral > DeepSeek > Cloudflare
 * Claude is PREFERRED — it produces the best SEO analysis output.
 * Cloudflare Workers AI is always the free fallback.
 * 
 * Cost tracking: every call returns cost estimate for billing transparency.
 */

import { createLogger } from '../lib/framework-shims.mjs';
import { MODELS, PROVIDERS, CAPABILITY_MODEL_MAP, isProviderAvailable, getModel } from './model-registry.mjs';
import { runClaude } from './adapters/claude.mjs';
import { runOpenAI } from './adapters/openai.mjs';
import { runGemini } from './adapters/gemini.mjs';
import { runMistral } from './adapters/mistral.mjs';
import { runDeepSeek } from './adapters/deepseek.mjs';
import { runCloudflare, runCloudflareEmbeddings } from './adapters/cloudflare.mjs';

const logger = createLogger('ai-provider');

// ── Adapter dispatch map ─────────────────────────────────────────────

const ADAPTER_MAP = {
  claude: runClaude,
  openai: runOpenAI,
  gemini: runGemini,
  mistral: runMistral,
  deepseek: runDeepSeek,
  cloudflare: runCloudflare
};

// ── Main entry point ─────────────────────────────────────────────────

/**
 * Run text generation through the multi-model provider system.
 * 
 * @param {Object} params
 * @param {string} params.systemPrompt - System instruction
 * @param {string} params.userPrompt - User message
 * @param {string} [params.complexity='standard'] - simple | standard | complex
 * @param {string} [params.capability] - Which capability is calling (for model routing)
 * @param {number} [params.maxTokens=4096] - Max output tokens
 * @param {string} [params.forceProvider] - Force a specific provider
 * @param {string} [params.forceModel] - Force a specific model key
 * @param {boolean} [params.jsonMode] - Request JSON-formatted output from the model
 * @param {Object} [params.jsonSchema] - JSON Schema for structured output (OpenAI format: { name, schema })
 * @param {Object} env - Worker env bindings
 * @returns {Object} { text, tokensUsed, durationMs, model, provider, cost, fallbackUsed }
 */
export async function runTextGeneration(params, env) {
  const {
    systemPrompt,
    userPrompt,
    complexity = 'standard',
    capability = null,
    maxTokens = 4096,
    forceProvider = null,
    forceModel = null,
    jsonMode = false,
    jsonSchema = null
  } = params;

  // Build the model chain to try
  const modelChain = resolveModelChain({
    capability,
    complexity,
    forceProvider: forceProvider || env.AI_PROVIDER,
    forceModel,
    preferredProvider: env.AI_PREFERRED_PROVIDER || 'claude',
    env
  });

  if (modelChain.length === 0) {
    throw new Error('No AI providers available — configure at least one API key or enable Workers AI');
  }

  // Try each model in the chain until one succeeds
  let lastError = null;
  let fallbackUsed = false;

  for (let i = 0; i < modelChain.length; i++) {
    const { modelKey, model, providerId } = modelChain[i];

    try {
      const adapter = ADAPTER_MAP[providerId];
      if (!adapter) {
        logger.warn(`No adapter for provider "${providerId}"`);
        continue;
      }

      logger.info(`Trying ${providerId}/${model.id} for ${capability || 'generic'} (${complexity})`);

      // Add timeout wrapper around adapter calls
      const timeoutMs = env.AI_TIMEOUT_MS ? parseInt(env.AI_TIMEOUT_MS) : 30000; // 30 second default
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Provider ${providerId} timed out after ${timeoutMs}ms`)), timeoutMs);
      });

      const result = await Promise.race([
        adapter({ systemPrompt, userPrompt, model, maxTokens, jsonMode, jsonSchema }, env),
        timeoutPromise
      ]);

      // Calculate estimated cost
      const cost = estimateCost(model, result.tokensUsed);

      return {
        ...result,
        cost,
        modelKey,
        fallbackUsed: i > 0,
        fallbackChain: modelChain.map(m => `${m.providerId}/${m.modelKey}`),
        attemptIndex: i
      };
    } catch (err) {
      lastError = err;
      fallbackUsed = true;
      logger.warn(`Provider ${providerId}/${model.id} failed: ${err.message}. Trying next...`);
    }
  }

  throw new Error(`All ${modelChain.length} providers failed. Last error: ${lastError?.message}`);
}

/**
 * Run embeddings (currently only Cloudflare Workers AI supports this).
 * 
 * @param {string[]} texts - Texts to embed
 * @param {Object} env - Worker env bindings
 * @returns {Object} { embeddings, model, provider, durationMs }
 */
export async function runEmbeddings(texts, env) {
  // Embeddings currently only use Cloudflare Workers AI (free)
  if (!env.AI) {
    throw new Error('Cloudflare AI binding required for embeddings');
  }

  return runCloudflareEmbeddings(texts, env);
}

// ── Model chain resolution ───────────────────────────────────────────

/**
 * Build an ordered list of models to try for a given request.
 */
function resolveModelChain({ capability, complexity, forceProvider, forceModel, preferredProvider, env }) {
  // Case 1: Forced model key — try only that model
  if (forceModel && forceModel !== 'auto') {
    const model = getModel(forceModel);
    if (model && isProviderAvailable(model.provider, env)) {
      return [{ modelKey: forceModel, model, providerId: model.provider }];
    }
    logger.warn(`Forced model "${forceModel}" not available, falling back to chain`);
  }

  // Case 2: Forced provider (not "auto") — use only models from that provider
  if (forceProvider && forceProvider !== 'auto') {
    return getProviderModels(forceProvider, complexity, env);
  }

  // Case 3: Capability-specific routing
  if (capability && CAPABILITY_MODEL_MAP[capability]) {
    const capChain = CAPABILITY_MODEL_MAP[capability][complexity] || CAPABILITY_MODEL_MAP[capability].standard;
    if (capChain) {
      const chain = capChain
        .map(key => {
          const model = getModel(key);
          if (!model) return null;
          if (!isProviderAvailable(model.provider, env)) return null;
          return { modelKey: key, model, providerId: model.provider };
        })
        .filter(Boolean);

      if (chain.length > 0) return chain;
    }
  }

  // Case 4: Auto mode — build chain based on preferred provider + complexity
  return buildAutoChain(complexity, preferredProvider, env);
}

/**
 * Get the best models from a specific provider.
 */
function getProviderModels(providerId, complexity, env) {
  if (!isProviderAvailable(providerId, env)) return [];

  const qualityOrder = { best: 0, excellent: 1, good: 2, basic: 3 };

  const models = Object.entries(MODELS)
    .filter(([, m]) => m.provider === providerId && m.type !== 'embedding')
    .sort((a, b) => (qualityOrder[a[1].quality] || 9) - (qualityOrder[b[1].quality] || 9));

  // For simple tasks, prefer smaller/faster models
  if (complexity === 'simple') {
    models.sort((a, b) => {
      const speedOrder = { fastest: 0, fast: 1, medium: 2, slow: 3 };
      return (speedOrder[a[1].speed] || 9) - (speedOrder[b[1].speed] || 9);
    });
  }

  return models.map(([key, model]) => ({
    modelKey: key,
    model,
    providerId
  }));
}

/**
 * Build the auto-routing chain considering all available providers.
 */
function buildAutoChain(complexity, preferredProvider, env) {
  const chain = [];

  // Priority order for providers
  const providerOrder = complexity === 'complex'
    ? ['claude', 'openai', 'gemini', 'deepseek', 'mistral', 'cloudflare']
    : complexity === 'simple'
      ? ['cloudflare', 'deepseek', 'mistral', 'gemini', 'openai', 'claude']
      : ['claude', 'openai', 'gemini', 'deepseek', 'mistral', 'cloudflare'];

  // Move preferred provider to front if not already
  if (preferredProvider && providerOrder.includes(preferredProvider)) {
    const idx = providerOrder.indexOf(preferredProvider);
    providerOrder.splice(idx, 1);
    providerOrder.unshift(preferredProvider);
  }

  for (const providerId of providerOrder) {
    if (!isProviderAvailable(providerId, env)) continue;

    const models = getProviderModels(providerId, complexity, env);
    // Add only the best model from each provider to the chain
    if (models.length > 0) {
      chain.push(models[0]);
    }
  }

  return chain;
}

// ── Cost estimation ──────────────────────────────────────────────────

/**
 * Estimate the cost of a request based on token usage.
 */
function estimateCost(model, tokensUsed) {
  if (!model || !tokensUsed) return { estimated: 0, currency: 'USD' };

  const inputCost = ((tokensUsed.input || 0) / 1000) * (model.costPer1kInput || 0);
  const outputCost = ((tokensUsed.output || 0) / 1000) * (model.costPer1kOutput || 0);

  return {
    estimated: parseFloat((inputCost + outputCost).toFixed(6)),
    inputCost: parseFloat(inputCost.toFixed(6)),
    outputCost: parseFloat(outputCost.toFixed(6)),
    currency: 'USD'
  };
}

/**
 * Get a summary of all available providers and their status.
 */
export function getProviderStatus(env) {
  const status = {};

  for (const [id, provider] of Object.entries(PROVIDERS)) {
    const available = isProviderAvailable(id, env);
    const models = Object.entries(MODELS)
      .filter(([, m]) => m.provider === id)
      .map(([key, m]) => ({
        key,
        name: m.name,
        quality: m.quality,
        speed: m.speed,
        costPer1kInput: m.costPer1kInput,
        costPer1kOutput: m.costPer1kOutput
      }));

    status[id] = {
      name: provider.name,
      available,
      tier: provider.tier,
      strengths: provider.strengths,
      models
    };
  }

  return status;
}
