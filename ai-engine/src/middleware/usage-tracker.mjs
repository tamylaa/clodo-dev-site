/**
 * Usage Tracker Middleware
 * 
 * Tracks API usage per hour for rate limiting and per day for analytics.
 * Stores data in KV with auto-expiring keys.
 * 
 * Now also tracks per-provider costs for billing transparency.
 */

import { createLogger } from '@tamyla/clodo-framework';

const logger = createLogger('ai-usage');

export class UsageTracker {
  constructor(kv, env) {
    this.kv = kv;
    this.maxPerHour = parseInt(env.MAX_REQUESTS_PER_HOUR || '120', 10);
  }

  /**
   * Check rate limit and increment counter.
   * @returns {{ allowed: boolean, remaining: number, resetAt: string }}
   */
  async checkAndIncrement(identifier = 'global') {
    if (!this.kv) {
      return { allowed: true, remaining: 999, resetAt: 'N/A (no KV)' };
    }

    const hourKey = `rate:${identifier}:${currentHourKey()}`;

    try {
      const current = parseInt(await this.kv.get(hourKey) || '0', 10);

      if (current >= this.maxPerHour) {
        return {
          allowed: false,
          remaining: 0,
          current,
          limit: this.maxPerHour,
          resetAt: nextHourReset()
        };
      }

      // Increment (TTL = 1 hour)
      await this.kv.put(hourKey, String(current + 1), { expirationTtl: 3600 });

      return {
        allowed: true,
        remaining: this.maxPerHour - current - 1,
        current: current + 1,
        limit: this.maxPerHour,
        resetAt: nextHourReset()
      };
    } catch (err) {
      logger.error('Rate limit check failed:', err.message);
      return { allowed: true, remaining: -1, resetAt: 'error' };
    }
  }

  /**
   * Log a completed request with provider and cost info.
   */
  async logRequest({ capability, provider, model, tokensUsed, cost, durationMs }) {
    if (!this.kv) return;

    const dayKey = `usage:${currentDayKey()}`;

    try {
      const existing = await this.kv.get(dayKey, 'json') || {
        date: currentDayKey(),
        requests: 0,
        totalCost: 0,
        byProvider: {},
        byCapability: {},
        totalTokens: { input: 0, output: 0 },
        totalDurationMs: 0
      };

      existing.requests += 1;
      existing.totalCost += cost?.estimated || 0;
      existing.totalTokens.input += tokensUsed?.input || 0;
      existing.totalTokens.output += tokensUsed?.output || 0;
      existing.totalDurationMs += durationMs || 0;

      // Track by provider
      if (!existing.byProvider[provider]) {
        existing.byProvider[provider] = { requests: 0, cost: 0, tokens: { input: 0, output: 0 } };
      }
      existing.byProvider[provider].requests += 1;
      existing.byProvider[provider].cost += cost?.estimated || 0;
      existing.byProvider[provider].tokens.input += tokensUsed?.input || 0;
      existing.byProvider[provider].tokens.output += tokensUsed?.output || 0;

      // Track by capability
      if (capability) {
        if (!existing.byCapability[capability]) {
          existing.byCapability[capability] = { requests: 0, cost: 0 };
        }
        existing.byCapability[capability].requests += 1;
        existing.byCapability[capability].cost += cost?.estimated || 0;
      }

      // TTL = 7 days
      await this.kv.put(dayKey, JSON.stringify(existing), { expirationTtl: 604800 });
    } catch (err) {
      logger.error('Usage log failed:', err.message);
    }
  }

  /**
   * Get usage summary for the last N days.
   */
  async getSummary(days = 7) {
    if (!this.kv) return { message: 'No KV binding available' };

    const summaries = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = `usage:${date.toISOString().split('T')[0]}`;
      const data = await this.kv.get(key, 'json');
      if (data) summaries.push(data);
    }

    // Aggregate totals
    const total = summaries.reduce((acc, day) => ({
      requests: acc.requests + day.requests,
      totalCost: acc.totalCost + (day.totalCost || 0),
      totalTokens: {
        input: acc.totalTokens.input + (day.totalTokens?.input || 0),
        output: acc.totalTokens.output + (day.totalTokens?.output || 0)
      }
    }), { requests: 0, totalCost: 0, totalTokens: { input: 0, output: 0 } });

    // Current rate limit status
    const hourKey = `rate:global:${currentHourKey()}`;
    const currentHourUsage = parseInt(await this.kv.get(hourKey) || '0', 10);

    return {
      period: `Last ${days} days`,
      total: {
        ...total,
        totalCost: parseFloat(total.totalCost.toFixed(4))
      },
      dailyBreakdown: summaries,
      rateLimit: {
        currentHour: currentHourUsage,
        limit: this.maxPerHour,
        remaining: Math.max(0, this.maxPerHour - currentHourUsage)
      }
    };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────

function currentHourKey() {
  const d = new Date();
  return `${d.toISOString().split('T')[0]}-${String(d.getUTCHours()).padStart(2, '0')}`;
}

function currentDayKey() {
  return new Date().toISOString().split('T')[0];
}

function nextHourReset() {
  const d = new Date();
  d.setUTCHours(d.getUTCHours() + 1, 0, 0, 0);
  return d.toISOString();
}
