/**
 * Anthropic Claude Provider Adapter
 * 
 * Calls the Anthropic Messages API.
 * Claude is the PREFERRED provider for complex SEO analysis.
 * 
 * Models: Claude Opus 4, Claude Sonnet 4, Claude 3.5 Haiku
 * API docs: https://docs.anthropic.com/en/api/messages
 */

import { createLogger } from '../../lib/framework-shims.mjs';

const logger = createLogger('provider-claude');

/**
 * Run text generation via Anthropic Claude.
 * 
 * @param {Object} params - { systemPrompt, userPrompt, model, maxTokens, jsonMode, jsonSchema }
 * @param {Object} env - Worker env bindings
 * @returns {Object} { text, tokensUsed, durationMs, model, provider }
 */
export async function runClaude(params, env) {
  const { systemPrompt, userPrompt, model, maxTokens = 4096, jsonMode = false, jsonSchema = null } = params;

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const modelId = model?.id || env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
  const start = Date.now();

  // For JSON mode, add a prefilled assistant message to anchor JSON output
  const messages = [{ role: 'user', content: userPrompt }];
  if (jsonMode || jsonSchema) {
    messages.push({ role: 'assistant', content: '{' });
  }

  // Augment system prompt with JSON instruction when schema is provided
  let finalSystem = systemPrompt;
  if (jsonSchema) {
    finalSystem += `\n\nYou MUST respond with valid JSON matching this schema:\n${JSON.stringify(jsonSchema.schema || jsonSchema, null, 2)}`;
  } else if (jsonMode) {
    finalSystem += '\n\nYou MUST respond with valid JSON only. No markdown, no explanation.';
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: maxTokens,
      system: finalSystem,
      messages
    })
  });

  const durationMs = Date.now() - start;

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    logger.error(`Claude API error (${response.status}):`, err.error?.message || response.statusText);
    throw new Error(`Claude API error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  let text = data.content?.[0]?.text || '';

  // When we prefilled with '{', prepend it back to form valid JSON
  if ((jsonMode || jsonSchema) && text && !text.trimStart().startsWith('{') && !text.trimStart().startsWith('[')) {
    text = '{' + text;
  }

  return {
    text,
    tokensUsed: {
      input: data.usage?.input_tokens || 0,
      output: data.usage?.output_tokens || 0
    },
    durationMs,
    model: modelId,
    provider: 'claude',
    stopReason: data.stop_reason
  };
}
