/**
 * DeepSeek Provider Adapter
 * 
 * Calls the DeepSeek API (OpenAI-compatible).
 * Exceptional value for reasoning tasks — DeepSeek-R1 rivals o1 at 1/10th the cost.
 * 
 * Models: deepseek-chat (V3), deepseek-reasoner (R1)
 * API docs: https://platform.deepseek.com/api-docs
 */

import { createLogger } from '@tamyla/clodo-framework';

const logger = createLogger('provider-deepseek');

/**
 * Run text generation via DeepSeek.
 * 
 * @param {Object} params - { systemPrompt, userPrompt, model, maxTokens }
 * @param {Object} env - Worker env bindings
 * @returns {Object} { text, tokensUsed, durationMs, model, provider }
 */
export async function runDeepSeek(params, env) {
  const { systemPrompt, userPrompt, model, maxTokens = 4096 } = params;

  const apiKey = env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured');

  const modelId = model?.id || env.DEEPSEEK_MODEL || 'deepseek-chat';
  const start = Date.now();

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  const durationMs = Date.now() - start;

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    logger.error(`DeepSeek API error (${response.status}):`, err.error?.message || response.statusText);
    throw new Error(`DeepSeek API error: ${err.error?.message || response.statusText}`);
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
    provider: 'deepseek',
    stopReason: data.choices?.[0]?.finish_reason
  };
}
