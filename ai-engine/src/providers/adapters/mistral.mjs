/**
 * Mistral AI Provider Adapter
 * 
 * Calls the Mistral Chat Completions API (OpenAI-compatible).
 * Strong for multilingual, coding (Codestral), and European compliance.
 * 
 * Models: mistral-large-latest, codestral-latest, mistral-small-latest
 * API docs: https://docs.mistral.ai/api/
 */

import { createLogger } from '../../lib/framework-shims.mjs';

const logger = createLogger('provider-mistral');

/**
 * Run text generation via Mistral AI.
 * 
 * @param {Object} params - { systemPrompt, userPrompt, model, maxTokens, jsonMode, jsonSchema }
 * @param {Object} env - Worker env bindings
 * @returns {Object} { text, tokensUsed, durationMs, model, provider }
 */
export async function runMistral(params, env) {
  const { systemPrompt, userPrompt, model, maxTokens = 4096, jsonMode = false, jsonSchema = null } = params;

  const apiKey = env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error('MISTRAL_API_KEY not configured');

  const modelId = model?.id || env.MISTRAL_MODEL || 'mistral-large-latest';
  const start = Date.now();

  const body = {
    model: modelId,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  };

  // Mistral supports response_format for JSON mode
  if (jsonSchema) {
    body.response_format = { type: 'json_object' };
  } else if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  const durationMs = Date.now() - start;

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    logger.error(`Mistral API error (${response.status}):`, err.error?.message || response.statusText);
    throw new Error(`Mistral API error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';

  return {
    text,
    tokensUsed: {
      input: data.usage?.prompt_tokens || 0,
      output: data.usage?.completion_tokens || 0
    },
    durationMs,
    model: modelId,
    provider: 'mistral',
    stopReason: data.choices?.[0]?.finish_reason
  };
}
