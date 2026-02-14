/**
 * Golden Test Datasets — Evaluation Framework
 *
 * Fixed input/output pairs for regression testing AI capabilities.
 * Each dataset has: input payload, expected output patterns (not exact match),
 * and quality assertions that must hold.
 *
 * Used by evaluate.mjs to run capability evaluations without live AI calls.
 */

// ── Intent Classification Golden Set ─────────────────────────────────

export const INTENT_CLASSIFY_GOLDEN = [
  {
    id: 'intent-1',
    input: { queries: [{ query: 'buy nike air max', clicks: 50, impressions: 1000 }] },
    expectations: {
      resultCount: 1,
      firstIntent: 'transactional',
      hasConfidence: true,
      minConfidence: 0.5
    }
  },
  {
    id: 'intent-2',
    input: { queries: [{ query: 'what is machine learning', clicks: 200, impressions: 5000 }] },
    expectations: {
      resultCount: 1,
      firstIntent: 'informational',
      hasConfidence: true
    }
  },
  {
    id: 'intent-3',
    input: { queries: [{ query: 'gmail login', clicks: 1000, impressions: 10000 }] },
    expectations: {
      resultCount: 1,
      firstIntent: 'navigational',
      hasConfidence: true
    }
  },
  {
    id: 'intent-4',
    input: { queries: [{ query: 'best laptop 2025 under $1000', clicks: 30, impressions: 800 }] },
    expectations: {
      resultCount: 1,
      firstIntent: 'commercial',
      hasConfidence: true
    }
  }
];

// ── Anomaly Diagnosis Golden Set ─────────────────────────────────────

export const ANOMALY_GOLDEN = [
  {
    id: 'anomaly-1',
    input: {
      metrics: [
        { date: '2025-01-01', clicks: 100, impressions: 5000, position: 5 },
        { date: '2025-01-02', clicks: 95, impressions: 4800, position: 5.1 },
        { date: '2025-01-03', clicks: 10, impressions: 500, position: 25 },
        { date: '2025-01-04', clicks: 8, impressions: 400, position: 28 }
      ],
      context: { url: 'example.com/product' }
    },
    expectations: {
      hasDiagnoses: true,
      minDiagnoses: 1,
      mentionsSeverity: true,
      hasActionItems: true
    }
  },
  {
    id: 'anomaly-2',
    input: {
      metrics: [
        { date: '2025-01-01', clicks: 50, impressions: 1000, position: 3 },
        { date: '2025-01-02', clicks: 52, impressions: 1020, position: 3.1 },
        { date: '2025-01-03', clicks: 48, impressions: 980, position: 2.9 },
        { date: '2025-01-04', clicks: 51, impressions: 1010, position: 3 }
      ],
      context: { url: 'example.com/stable-page' }
    },
    expectations: {
      hasDiagnoses: true,
      mentionsStable: true // Should recognise stable metrics
    }
  }
];

// ── Content Rewrites Golden Set ──────────────────────────────────────

export const CONTENT_REWRITE_GOLDEN = [
  {
    id: 'rewrite-1',
    input: {
      pages: [{
        url: 'https://example.com/seo-guide',
        title: 'seo guide',
        description: 'a guide about seo',
        h1: 'SEO Guide',
        targetKeyword: 'seo guide',
        position: 8,
        ctr: 0.02
      }]
    },
    expectations: {
      hasRewrites: true,
      rewriteCount: 1,
      suggestedTitleMinLength: 20,
      suggestedTitleMaxLength: 65,
      suggestedDescMinLength: 50,
      hasCTRAnalysis: true,
      hasVariants: true
    }
  }
];

// ── Smart Forecast Golden Set ────────────────────────────────────────

export const FORECAST_GOLDEN = [
  {
    id: 'forecast-1',
    input: {
      metrics: { clicks: [100, 110, 105, 120, 115, 130, 125, 140, 135, 150] },
      horizon: 7,
      context: { keyword: 'test keyword' }
    },
    expectations: {
      hasForecasts: true,
      forecastMetric: 'clicks',
      hasStatisticalForecast: true,
      forecastLength: 7
    }
  }
];

// ── Cannibalization Golden Set ───────────────────────────────────────

export const CANNIBALIZATION_GOLDEN = [
  {
    id: 'cannibal-1',
    input: {
      pages: [
        { url: 'https://example.com/seo-guide', title: 'Complete SEO Guide 2025', keywords: ['seo guide'], position: 5, clicks: 100 },
        { url: 'https://example.com/seo-tutorial', title: 'SEO Guide for Beginners', keywords: ['seo guide'], position: 12, clicks: 30 },
        { url: 'https://example.com/unrelated', title: 'Best Coffee Machines', keywords: ['coffee machines'], position: 3, clicks: 200 }
      ]
    },
    expectations: {
      hasConflicts: true,
      minConflicts: 1,
      conflictKeyword: 'seo guide',
      unrelatedNotFlagged: true
    }
  }
];

// ── Content Gaps Golden Set ──────────────────────────────────────────

export const CONTENT_GAPS_GOLDEN = [
  {
    id: 'gaps-1',
    input: {
      siteKeywords: ['seo guide', 'keyword research', 'link building'],
      competitorKeywords: [
        { keyword: 'technical seo', volume: 5000, position: 3 },
        { keyword: 'seo guide', volume: 10000, position: 1 },
        { keyword: 'content strategy', volume: 3000, position: 5 }
      ],
      context: { industry: 'digital marketing' }
    },
    expectations: {
      hasGaps: true,
      gapKeywords: ['technical seo', 'content strategy'],
      excludesExisting: true // 'seo guide' should NOT be a gap
    }
  }
];

// ── All datasets in one bundle ───────────────────────────────────────

export const ALL_GOLDEN_DATASETS = {
  'intent-classify': INTENT_CLASSIFY_GOLDEN,
  'anomaly-diagnosis': ANOMALY_GOLDEN,
  'content-rewrite': CONTENT_REWRITE_GOLDEN,
  'smart-forecast': FORECAST_GOLDEN,
  'cannibalization-detect': CANNIBALIZATION_GOLDEN,
  'content-gaps': CONTENT_GAPS_GOLDEN
};
