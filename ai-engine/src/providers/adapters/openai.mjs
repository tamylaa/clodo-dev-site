/**
 * OpenAI Provider Adapter
 * 
 * Calls the OpenAI Chat Completions API.
 * Supports GPT-4o, GPT-4o-mini, o1, o3-mini, and Codex.
 * 
 * Models: gpt-4o, gpt-4o-mini, o1, o3-mini, codex-mini-latest
 * API docs: https://platform.openai.com/docs/api-reference/chat
 */

import { createLogger } from '../../lib/framework-shims.mjs';

const logger = createLogger('provider-openai');

// o-series (reasoning) models use a different message structure
const REASONING_MODELS = new Set(['o1', 'o3-mini', 'o1-mini', 'o1-preview']);

/**
 * Run text generation via OpenAI.
 * 
 * @param {Object} params - { systemPrompt, userPrompt, model, maxTokens, jsonMode, jsonSchema }
 * @param {Object} env - Worker env bindings
 * @returns {Object} { text, tokensUsed, durationMs, model, provider }
 */
export async function runOpenAI(params, env) {
  const { systemPrompt, userPrompt, model, maxTokens = 4096, jsonMode = false, jsonSchema = null } = params;

  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const modelId = model?.id || env.OPENAI_MODEL || 'gpt-4o';
  const isReasoning = REASONING_MODELS.has(modelId);
  const start = Date.now();

  // Reasoning models don't support system messages — merge into user prompt
  const messages = isReasoning
    ? [{ role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }]
    : [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];

  const body = {
    model: modelId,
    messages
  };

  // Reasoning models use max_completion_tokens instead of max_tokens
  if (isReasoning) {
    body.max_completion_tokens = maxTokens;
  } else {
    body.max_tokens = maxTokens;
  }

  // Structured output: prefer json_schema (strict), fall back to json_object
  if (!isReasoning) {
    if (jsonSchema) {
      body.response_format = { type: 'json_schema', json_schema: jsonSchema };
    } else if (jsonMode) {
      body.response_format = { type: 'json_object' };
    }
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
    logger.error(`OpenAI API error (${response.status}):`, err.error?.message || response.statusText);
    throw new Error(`OpenAI API error: ${err.error?.message || response.statusText}`);
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
    provider: 'openai',
    stopReason: data.choices?.[0]?.finish_reason
  };
}
