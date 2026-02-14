/**
 * Capability: User Feedback Collection
 *
 * Collects thumbs-up/down and optional text feedback on AI outputs.
 * Stores in KV for analysis. Used to improve prompts and models over time.
 *
 * Endpoints:
 *   POST /ai/feedback — Submit feedback
 *   GET /ai/feedback/summary — Get aggregated feedback stats
 */

import { createLogger } from '../lib/framework-shims.mjs';
import { z } from 'zod';
import { validateInput } from '../lib/validate-input.mjs';

const logger = createLogger('ai-feedback');

const FeedbackInputSchema = z.object({
  capability: z.string().min(1),
  requestId: z.string().optional(),
  rating: z.enum(['positive', 'negative', 'neutral']),
  comment: z.string().max(1000).optional(),
  outputSample: z.string().max(2000).optional(),
  metadata: z.object({
    provider: z.string().optional(),
    model: z.string().optional(),
    promptVersion: z.string().optional(),
    durationMs: z.number().optional()
  }).optional()
});

/**
 * Submit feedback for an AI capability output.
 */
export async function submitFeedback(body, env) {
  const v = validateInput(FeedbackInputSchema, body);
  if (!v.valid) return v.error;

  const { capability, rating, comment, requestId, outputSample, metadata } = v.data;

  const feedbackRecord = {
    id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    capability,
    rating,
    comment: comment || null,
    requestId: requestId || null,
    outputSample: outputSample || null,
    metadata: metadata || {},
    timestamp: new Date().toISOString()
  };

  if (!env.KV_AI) {
    logger.warn('No KV namespace available, feedback not persisted');
    return { success: true, id: feedbackRecord.id, stored: false };
  }

  // Store individual feedback record
  const recordKey = `feedback:${feedbackRecord.id}`;
  await env.KV_AI.put(recordKey, JSON.stringify(feedbackRecord), {
    expirationTtl: 90 * 86400 // 90 days
  });

  // Update daily aggregation
  const dateKey = new Date().toISOString().slice(0, 10);
  const aggKey = `feedback-agg:${dateKey}`;
  const existing = await env.KV_AI.get(aggKey, { type: 'json' }) || {};

  if (!existing[capability]) {
    existing[capability] = { positive: 0, negative: 0, neutral: 0, total: 0, comments: [] };
  }
  existing[capability][rating]++;
  existing[capability].total++;
  if (comment) {
    existing[capability].comments.push({
      rating,
      text: comment.slice(0, 200),
      time: feedbackRecord.timestamp
    });
    // Keep only last 20 comments per capability per day
    if (existing[capability].comments.length > 20) {
      existing[capability].comments = existing[capability].comments.slice(-20);
    }
  }

  await env.KV_AI.put(aggKey, JSON.stringify(existing), {
    expirationTtl: 90 * 86400
  });

  logger.info(`Feedback recorded: ${capability} = ${rating}`, { id: feedbackRecord.id });

  return {
    success: true,
    id: feedbackRecord.id,
    stored: true
  };
}

/**
 * Get aggregated feedback summary for the last N days.
 */
export async function getFeedbackSummary(env, days = 7) {
  if (!env.KV_AI) {
    return { error: 'KV not available', days, capabilities: {} };
  }

  const capabilities = {};
  const now = new Date();

  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dateKey = date.toISOString().slice(0, 10);
    const aggKey = `feedback-agg:${dateKey}`;
    const dayData = await env.KV_AI.get(aggKey, { type: 'json' });
    if (!dayData) continue;

    for (const [cap, stats] of Object.entries(dayData)) {
      if (!capabilities[cap]) {
        capabilities[cap] = { positive: 0, negative: 0, neutral: 0, total: 0, satisfactionRate: 0, recentComments: [] };
      }
      capabilities[cap].positive += stats.positive || 0;
      capabilities[cap].negative += stats.negative || 0;
      capabilities[cap].neutral += stats.neutral || 0;
      capabilities[cap].total += stats.total || 0;
      if (stats.comments) {
        capabilities[cap].recentComments.push(...stats.comments);
      }
    }
  }

  // Calculate satisfaction rates
  for (const cap of Object.values(capabilities)) {
    cap.satisfactionRate = cap.total > 0
      ? Math.round((cap.positive / cap.total) * 100)
      : 0;
    // Keep only 10 most recent comments
    cap.recentComments = cap.recentComments
      .sort((a, b) => b.time.localeCompare(a.time))
      .slice(0, 10);
  }

  return { days, capabilities };
}

export { FeedbackInputSchema };
