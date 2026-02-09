/**
 * Tests: Usage Tracker & Rate Limiting
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsageTracker } from '../../src/middleware/usage-tracker.mjs';
import { createMockEnv } from '../setup.mjs';

describe('UsageTracker', () => {
  let kv;
  let tracker;

  beforeEach(() => {
    kv = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined)
    };
    tracker = new UsageTracker(kv, { MAX_REQUESTS_PER_HOUR: '10' });
  });

  describe('checkAndIncrement()', () => {
    it('allows first request', async () => {
      const result = await tracker.checkAndIncrement('test');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
      expect(result.current).toBe(1);
    });

    it('blocks requests over limit', async () => {
      kv.get.mockResolvedValue('10');

      const result = await tracker.checkAndIncrement('test');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('allows when just under limit', async () => {
      kv.get.mockResolvedValue('9');

      const result = await tracker.checkAndIncrement('test');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
      expect(result.current).toBe(10);
    });

    it('sets TTL of 1 hour on rate counter', async () => {
      await tracker.checkAndIncrement('test');

      expect(kv.put).toHaveBeenCalledWith(
        expect.stringContaining('rate:test:'),
        '1',
        { expirationTtl: 3600 }
      );
    });

    it('gracefully handles no KV', async () => {
      const noKvTracker = new UsageTracker(null, { MAX_REQUESTS_PER_HOUR: '10' });
      const result = await noKvTracker.checkAndIncrement('test');

      expect(result.allowed).toBe(true);
    });
  });

  describe('logRequest()', () => {
    it('logs usage with provider and cost data', async () => {
      await tracker.logRequest({
        capability: 'chat',
        provider: 'claude',
        model: 'claude-sonnet-4-20250514',
        tokensUsed: { input: 100, output: 50 },
        cost: { estimated: 0.001 },
        durationMs: 1200
      });

      expect(kv.put).toHaveBeenCalledWith(
        expect.stringContaining('usage:'),
        expect.any(String),
        { expirationTtl: 604800 }
      );

      // Verify the stored data structure
      const storedData = JSON.parse(kv.put.mock.calls.find(c => c[0].startsWith('usage:'))[1]);
      expect(storedData.requests).toBe(1);
      expect(storedData.totalCost).toBe(0.001);
      expect(storedData.byProvider.claude.requests).toBe(1);
      expect(storedData.byCapability.chat.requests).toBe(1);
    });
  });

  describe('getSummary()', () => {
    it('returns empty summary when no data', async () => {
      const summary = await tracker.getSummary(7);

      expect(summary.total.requests).toBe(0);
      expect(summary.dailyBreakdown).toEqual([]);
    });

    it('returns summary with no KV', async () => {
      const noKvTracker = new UsageTracker(null, {});
      const summary = await noKvTracker.getSummary();

      expect(summary.message).toBe('No KV binding available');
    });
  });
});
