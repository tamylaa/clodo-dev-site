/**
 * Tests — Zod Schemas
 *
 * Validates all input/output schemas accept valid data and reject invalid data.
 */

import { describe, it, expect } from 'vitest';
import {
  IntentClassifyInputSchema,
  AnomalyInputSchema,
  EmbeddingClusterInputSchema,
  ConversationalInputSchema,
  ContentRewriteInputSchema,
  RecommendationRefinerInputSchema,
  SmartForecastInputSchema,
  CannibalizationInputSchema,
  ContentGapsInputSchema,
  PageScorerInputSchema,
  SiteHealthPulseInputSchema
} from '../../src/lib/schemas/index.mjs';

// ── Helper ──────────────────────────────────────────────────────────

function expectValid(schema, data) {
  const result = schema.safeParse(data);
  expect(result.success).toBe(true);
  return result;
}

function expectInvalid(schema, data) {
  const result = schema.safeParse(data);
  expect(result.success).toBe(false);
  return result;
}

// ── IntentClassifyInputSchema ────────────────────────────────────────

describe('IntentClassifyInputSchema', () => {
  it('accepts valid input', () => {
    expectValid(IntentClassifyInputSchema, {
      keywords: ['buy shoes', 'find stores', 'best running shoes']
    });
  });

  it('accepts minimal input', () => {
    expectValid(IntentClassifyInputSchema, {
      keywords: ['test']
    });
  });

  it('rejects empty keywords array', () => {
    expectInvalid(IntentClassifyInputSchema, { keywords: [] });
  });

  it('rejects missing keywords', () => {
    expectInvalid(IntentClassifyInputSchema, {});
  });

  it('rejects non-string keyword', () => {
    expectInvalid(IntentClassifyInputSchema, {
      keywords: [123]
    });
  });
});

// ── AnomalyInputSchema ──────────────────────────────────────────────

describe('AnomalyInputSchema', () => {
  it('accepts valid anomalies', () => {
    expectValid(AnomalyInputSchema, {
      anomalies: [
        { type: 'traffic-drop', description: 'sudden drop in clicks', previousValue: 1000, currentValue: 200 }
      ]
    });
  });

  it('rejects empty anomalies', () => {
    expectInvalid(AnomalyInputSchema, { anomalies: [] });
  });
});

// ── EmbeddingClusterInputSchema ──────────────────────────────────────

describe('EmbeddingClusterInputSchema', () => {
  it('accepts string keywords', () => {
    expectValid(EmbeddingClusterInputSchema, {
      keywords: ['seo', 'marketing', 'content']
    });
  });

  it('accepts object keywords', () => {
    expectValid(EmbeddingClusterInputSchema, {
      keywords: [{ query: 'seo', clicks: 10 }, { query: 'marketing', clicks: 5 }]
    });
  });

  it('rejects empty keywords', () => {
    expectInvalid(EmbeddingClusterInputSchema, { keywords: [] });
  });
});

// ── ConversationalInputSchema ────────────────────────────────────────

describe('ConversationalInputSchema', () => {
  it('accepts valid message', () => {
    expectValid(ConversationalInputSchema, { message: 'What are my top pages?' });
  });

  it('accepts with analytics context', () => {
    expectValid(ConversationalInputSchema, {
      message: 'How is my traffic?',
      analyticsContext: {
        summary: { totalImpressions: 10000, totalClicks: 500 }
      }
    });
  });

  it('accepts with conversationId', () => {
    expectValid(ConversationalInputSchema, {
      message: 'Follow up question',
      conversationId: 'conv_abc123'
    });
  });

  it('rejects empty message', () => {
    expectInvalid(ConversationalInputSchema, { message: '' });
  });
});

// ── ContentRewriteInputSchema ────────────────────────────────────────

describe('ContentRewriteInputSchema', () => {
  it('accepts valid pages', () => {
    expectValid(ContentRewriteInputSchema, {
      pages: [{ url: 'https://example.com', title: 'Test' }]
    });
  });

  it('accepts with competitors', () => {
    expectValid(ContentRewriteInputSchema, {
      pages: [{ url: 'https://example.com' }],
      competitors: [{ url: 'https://competitor.com', title: 'Comp Title', position: 1 }]
    });
  });

  it('accepts with targetKeywords array', () => {
    expectValid(ContentRewriteInputSchema, {
      pages: [{
        url: 'https://example.com',
        targetKeywords: ['seo guide', { query: 'seo tips' }]
      }]
    });
  });

  it('rejects empty pages', () => {
    expectInvalid(ContentRewriteInputSchema, { pages: [] });
  });

  it('rejects invalid tone', () => {
    expectInvalid(ContentRewriteInputSchema, {
      pages: [{ url: 'https://example.com' }],
      tone: 'aggressive'
    });
  });
});

// ── SmartForecastInputSchema ─────────────────────────────────────────

describe('SmartForecastInputSchema', () => {
  it('accepts valid time series', () => {
    const timeSeries = Array.from({ length: 7 }, (_, i) => ({
      date: `2025-01-0${i + 1}`,
      clicks: 100 + i * 10,
      impressions: 5000 + i * 100
    }));
    expectValid(SmartForecastInputSchema, { timeSeries });
  });

  it('accepts with forecast options', () => {
    const timeSeries = Array.from({ length: 14 }, (_, i) => ({
      date: `2025-01-${String(i + 1).padStart(2, '0')}`,
      clicks: 100 + i * 5,
      impressions: 5000 + i * 50
    }));
    expectValid(SmartForecastInputSchema, {
      timeSeries,
      forecastDays: 14,
      seasonality: 'weekly'
    });
  });
});

// ── CannibalizationInputSchema ───────────────────────────────────────

describe('CannibalizationInputSchema', () => {
  it('accepts valid pages', () => {
    expectValid(CannibalizationInputSchema, {
      pages: [
        { url: 'https://example.com/page1', title: 'Page 1' },
        { url: 'https://example.com/page2', title: 'Page 2' }
      ]
    });
  });

  it('rejects single page', () => {
    expectInvalid(CannibalizationInputSchema, {
      pages: [{ url: 'https://example.com/page1' }]
    });
  });
});

// ── ContentGapsInputSchema ───────────────────────────────────────────

describe('ContentGapsInputSchema', () => {
  it('accepts valid input', () => {
    expectValid(ContentGapsInputSchema, {
      siteKeywords: ['seo', 'marketing'],
      competitorKeywords: [{ keyword: 'tech seo', volume: 1000 }]
    });
  });

  it('rejects empty site keywords', () => {
    expectInvalid(ContentGapsInputSchema, {
      siteKeywords: [],
      competitorKeywords: ['keyword']
    });
  });
});

// ── PageScorerInputSchema ────────────────────────────────────────────

describe('PageScorerInputSchema', () => {
  it('accepts valid pages', () => {
    expectValid(PageScorerInputSchema, {
      pages: [{ url: 'https://example.com', clicks: 100, impressions: 5000 }]
    });
  });
});

// ── RecommendationRefinerInputSchema ─────────────────────────────────

describe('RecommendationRefinerInputSchema', () => {
  it('accepts valid recommendations', () => {
    expectValid(RecommendationRefinerInputSchema, {
      recommendations: [{ title: 'Improve meta descriptions', priority: 'high' }]
    });
  });
});

// ── SiteHealthPulseInputSchema ───────────────────────────────────────

describe('SiteHealthPulseInputSchema', () => {
  it('accepts full input with all fields', () => {
    expectValid(SiteHealthPulseInputSchema, {
      pages: [{ url: '/page-a', title: 'Test', keywords: ['seo'] }],
      anomalies: [{ type: 'traffic', severity: 'high' }],
      currentData: { totalClicks: 1000 },
      siteKeywords: ['seo'],
      competitorKeywords: [{ keyword: 'seo audit' }],
      context: { siteUrl: 'https://example.com' }
    });
  });

  it('accepts minimal input (pages only)', () => {
    expectValid(SiteHealthPulseInputSchema, {
      pages: [{ url: '/page-a' }]
    });
  });

  it('rejects empty pages array', () => {
    expectInvalid(SiteHealthPulseInputSchema, { pages: [] });
  });

  it('rejects missing pages', () => {
    expectInvalid(SiteHealthPulseInputSchema, {});
  });

  it('defaults optional arrays to empty', () => {
    const result = SiteHealthPulseInputSchema.safeParse({ pages: [{ url: '/a' }] });
    expect(result.success).toBe(true);
    expect(result.data.anomalies).toEqual([]);
    expect(result.data.siteKeywords).toEqual([]);
    expect(result.data.competitorKeywords).toEqual([]);
  });
});
