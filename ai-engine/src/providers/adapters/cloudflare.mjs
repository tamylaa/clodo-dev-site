/**
 * Cloudflare Workers AI Provider Adapter
 * 
 * Uses the env.AI binding for zero-cost inference.
 * Free tier: 10,000 neurons/day. Best for simple tasks and embeddings.
 * 
 * Models: Llama 3.3 70B, Llama 3.1 8B, BGE embeddings
 * Docs: https://developers.cloudflare.com/workers-ai/
 */

import { createLogger } from '../../lib/framework-shims.mjs';

const logger = createLogger('provider-cloudflare');

/**
 * Run text generation via Cloudflare Workers AI.
 * 
 * @param {Object} params - { systemPrompt, userPrompt, model, maxTokens, jsonMode, jsonSchema }
 * @param {Object} env - Worker env bindings
 * @returns {Object} { text, tokensUsed, durationMs, model, provider }
 */
export async function runCloudflare(params, env) {
  const { systemPrompt, userPrompt, model, maxTokens = 2048, jsonMode = false, jsonSchema = null } = params;

  if (!env.AI) throw new Error('Cloudflare AI binding not available');

  // Select model based on prompt size and model preference
  const promptLength = (systemPrompt?.length || 0) + (userPrompt?.length || 0);
  const modelId = model?.id
    || (promptLength > 6000
      ? (env.CF_MODEL_LARGE || '@cf/meta/llama-3.3-70b-instruct-fp8-fast')
      : (env.CF_MODEL_SMALL || '@cf/meta/llama-3.1-8b-instruct-fast'));

  const start = Date.now();

  // Workers AI doesn't have native JSON mode — augment system prompt
  let finalSystem = systemPrompt;
  if (jsonSchema) {
    finalSystem += `\n\nIMPORTANT: Respond ONLY with valid JSON matching this schema. No markdown fences, no explanation:\n${JSON.stringify(jsonSchema.schema || jsonSchema, null, 2)}`;
  } else if (jsonMode) {
    finalSystem += '\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown fences, no explanation.';
  }

  const result = await env.AI.run(modelId, {
    messages: [
      { role: 'system', content: finalSystem },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: maxTokens
  });

  const durationMs = Date.now() - start;
  const text = result.response || '';

  return {
    text,
    tokensUsed: {
      input: 0, // Workers AI doesn't report token counts
      output: 0
    },
    durationMs,
    model: modelId,
    provider: 'cloudflare',
    stopReason: 'complete'
  };
}

/**
 * Run embeddings via Cloudflare Workers AI.
 * 
 * @param {string[]} texts - Array of texts to embed
 * @param {Object} env - Worker env bindings
 * @returns {Object} { embeddings, model, durationMs }
 */
export async function runCloudflareEmbeddings(texts, env) {
  if (!env.AI) throw new Error('Cloudflare AI binding not available');

  const modelId = env.CF_MODEL_EMBEDDING || '@cf/baai/bge-base-en-v1.5';
  const start = Date.now();

  const result = await env.AI.run(modelId, { text: texts });
  const durationMs = Date.now() - start;

  return {
    embeddings: result.data || [],
    model: modelId,
    provider: 'cloudflare',
    durationMs,
    dimensions: result.data?.[0]?.length || 768
  };
}
