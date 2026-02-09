/**
 * Google Gemini Provider Adapter
 * 
 * Calls the Gemini API via Google AI Studio.
 * Excellent cost-efficiency and massive context windows (1M tokens).
 * 
 * Models: gemini-2.0-flash, gemini-2.5-pro-preview-06-05
 * API docs: https://ai.google.dev/api/generate-content
 */

import { createLogger } from '@tamyla/clodo-framework';

const logger = createLogger('provider-gemini');

/**
 * Run text generation via Google Gemini.
 * 
 * @param {Object} params - { systemPrompt, userPrompt, model, maxTokens }
 * @param {Object} env - Worker env bindings
 * @returns {Object} { text, tokensUsed, durationMs, model, provider }
 */
export async function runGemini(params, env) {
  const { systemPrompt, userPrompt, model, maxTokens = 4096 } = params;

  const apiKey = env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not configured');

  const modelId = model?.id || env.GEMINI_MODEL || 'gemini-2.0-flash';
  const start = Date.now();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [{
        parts: [{ text: userPrompt }]
      }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7
      }
    })
  });

  const durationMs = Date.now() - start;

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    logger.error(`Gemini API error (${response.status}):`, err.error?.message || response.statusText);
    throw new Error(`Gemini API error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const usageMetadata = data.usageMetadata || {};

  return {
    text,
    tokensUsed: {
      input: usageMetadata.promptTokenCount || 0,
      output: usageMetadata.candidatesTokenCount || 0
    },
    durationMs,
    model: modelId,
    provider: 'gemini',
    stopReason: data.candidates?.[0]?.finishReason
  };
}
