/**
 * Tests: Data Flow — Input Parsing, LLM Response Parsing, Fallback Behavior
 * 
 * These tests verify each capability's data pipeline WITHOUT making real API calls.
 * They mock the AI provider layer and test:
 *   1. Input validation (empty, malformed, edge cases)
 *   2. LLM response parsing (valid JSON, broken JSON, garbage)
 *   3. Fallback behavior (graceful degradation on parse failure)
 *   4. Output shape compliance (matches documented schema)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockEnv } from '../setup.mjs';

// ── Mock the provider layer before importing capabilities ────────────

const mockTextGeneration = vi.fn();
const mockEmbeddings = vi.fn();

vi.mock('../../src/providers/ai-provider.mjs', () => ({
  runTextGeneration: (...args) => mockTextGeneration(...args),
  runEmbeddings: (...args) => mockEmbeddings(...args),
  getProviderStatus: () => ({
    claude: { name: 'Anthropic Claude', available: true, tier: 'premium' },
    cloudflare: { name: 'Cloudflare Workers AI', available: true, tier: 'free' }
  })
}));

// ── Import capabilities (after mock is set up) ──────────────────────

import { classifyIntentBatch } from '../../src/capabilities/intent-classifier.mjs';
import { diagnoseAnomalies } from '../../src/capabilities/anomaly-diagnosis.mjs';
import { clusterByEmbeddings } from '../../src/capabilities/embedding-clusters.mjs';
import { chatWithData } from '../../src/capabilities/conversational-ai.mjs';
import { generateRewrites } from '../../src/capabilities/content-rewrites.mjs';
import { refineRecommendations } from '../../src/capabilities/recommendation-refiner.mjs';
import { smartForecast } from '../../src/capabilities/smart-forecasting.mjs';
import { detectCannibalization } from '../../src/capabilities/cannibalization-detect.mjs';
import { analyseContentGaps } from '../../src/capabilities/content-gaps.mjs';
import { scorePages } from '../../src/capabilities/page-scorer.mjs';

import {
  intentClassifyPayloads,
  anomalyDiagnosePayloads,
  embeddingClusterPayloads,
  chatPayloads,
  contentRewritePayloads,
  refineRecsPayloads,
  smartForecastPayloads,
  cannibalizationPayloads,
  contentGapsPayloads,
  pageScorerPayloads
} from '../fixtures/payloads.mjs';

import {
  validateIntentClassifyResponse,
  validateAnomalyDiagnoseResponse,
  validateEmbeddingClusterResponse,
  validateChatResponse,
  validateContentRewriteResponse,
  validateRefineRecsResponse,
  validateSmartForecastResponse,
  validateCannibalizationResponse,
  validateContentGapsResponse,
  validatePageScorerResponse
} from '../fixtures/validators.mjs';

// ── Helpers ──────────────────────────────────────────────────────────

function makeLLMResponse(text) {
  return {
    text,
    provider: 'claude',
    model: 'claude-sonnet-4-20250514',
    tokensUsed: { input: 500, output: 200 },
    cost: { estimated: 0.0045 },
    durationMs: 1200
  };
}

function makeEmbeddingResponse(count) {
  return {
    embeddings: Array.from({ length: count }, () =>
      Array.from({ length: 768 }, () => Math.random() - 0.5)
    ),
    model: '@cf/baai/bge-base-en-v1.5',
    provider: 'cloudflare',
    durationMs: 300
  };
}

// ═══════════════════════════════════════════════════════════════════════

describe('Data Flow: Intent Classifier', () => {
  const env = createMockEnv();

  beforeEach(() => { mockTextGeneration.mockReset(); });

  it('parses valid LLM JSON into classified keywords', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse(JSON.stringify([
      { query: 'best crm software 2026', intent: 'commercial', confidence: 0.92, businessValue: 8, contentType: 'comparison-page', reasoning: 'User is comparing options' },
      { query: 'what is a crm', intent: 'informational', confidence: 0.95, businessValue: 4, contentType: 'guide', reasoning: 'User seeks definition' }
    ])));

    const result = await classifyIntentBatch(intentClassifyPayloads.full, env);

    // Hybrid pipeline: all 8 keywords go through heuristic + LLM + cross-validation
    expect(result.classifications.length).toBeGreaterThanOrEqual(1);
    expect(result.classifications[0].intent).toBe('commercial');
    // Cross-validation: heuristic & LLM agree → confidence boosted by 1.15x, capped at 1.0
    expect(result.classifications[0].confidence).toBeGreaterThanOrEqual(0.92);
    expect(result.metadata.provider).toBe('claude');
    expect(result.metadata.keywordsProcessed).toBe(8);
    expect(() => validateIntentClassifyResponse(result)).not.toThrow();
  });

  it('returns fallback classifications on garbage LLM response', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse('Sorry, I cannot process that request.'));

    const result = await classifyIntentBatch({ keywords: ['test keyword'] }, env);

    expect(result.classifications).toHaveLength(1);
    expect(result.classifications[0].source).toBe('ai-engine-fallback');
    expect(result.classifications[0].confidence).toBe(0.3);
    expect(() => validateIntentClassifyResponse(result)).not.toThrow();
  });

  it('returns empty array for empty keywords', async () => {
    const result = await classifyIntentBatch(intentClassifyPayloads.empty, env);

    expect(result.classifications).toEqual([]);
    expect(mockTextGeneration).not.toHaveBeenCalled();
  });

  it('batches keywords >50 into multiple LLM calls', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse('[]'));

    await classifyIntentBatch(intentClassifyPayloads.largeBatch, env);

    // 75 keywords / 50 per batch = 2 calls
    expect(mockTextGeneration).toHaveBeenCalledTimes(2);
  });

  it('clamps out-of-range confidence and businessValue', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse(JSON.stringify([
      { query: 'test', intent: 'informational', confidence: 1.5, businessValue: 15, contentType: 'guide', reasoning: '' }
    ])));

    const result = await classifyIntentBatch({ keywords: ['test'] }, env);

    expect(result.classifications[0].confidence).toBe(1);
    expect(result.classifications[0].businessValue).toBe(10);
  });

  it('normalizes invalid intent values to informational', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse(JSON.stringify([
      { query: 'test', intent: 'garbage-intent', confidence: 0.5, businessValue: 5, contentType: 'article', reasoning: '' }
    ])));

    const result = await classifyIntentBatch({ keywords: ['test'] }, env);

    expect(result.classifications[0].intent).toBe('informational');
  });
});

// ═══════════════════════════════════════════════════════════════════════

describe('Data Flow: Anomaly Diagnosis', () => {
  const env = createMockEnv();

  beforeEach(() => { mockTextGeneration.mockReset(); });

  it('parses valid diagnosis JSON', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse(JSON.stringify({
      diagnoses: [{
        anomalyId: 'anom-1',
        likelyCause: 'Google core update detected',
        confidence: 0.85,
        immediateAction: 'Check Search Console for manual actions',
        investigationSteps: ['Review GSC messages', 'Compare to algorithm update timeline'],
        isRealProblem: true,
        severity: 'critical'
      }]
    })));

    const result = await diagnoseAnomalies(anomalyDiagnosePayloads.minimal, env);

    expect(result.diagnoses).toHaveLength(1);
    expect(result.diagnoses[0].likelyCause).toBe('Google core update detected');
    expect(() => validateAnomalyDiagnoseResponse(result)).not.toThrow();
  });

  it('returns fallback on unparseable response', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse('I think the issue might be related to...'));

    const result = await diagnoseAnomalies(anomalyDiagnosePayloads.minimal, env);

    expect(result.diagnoses).toHaveLength(1);
    expect(result.diagnoses[0].source).toBe('ai-engine-fallback');
    expect(result.diagnoses[0].confidence).toBe(0);
  });

  it('limits to top 5 anomalies by severity', async () => {
    const manyAnomalies = {
      anomalies: Array.from({ length: 8 }, (_, i) => ({
        type: 'test', severity: i < 2 ? 'critical' : 'info', description: `Anomaly ${i}`
      }))
    };

    mockTextGeneration.mockResolvedValue(makeLLMResponse(JSON.stringify({ diagnoses: [] })));
    await diagnoseAnomalies(manyAnomalies, env);

    // Check the prompt was built with only 5 anomalies
    const callArgs = mockTextGeneration.mock.calls[0][0];
    const anomalyCount = (callArgs.userPrompt.match(/ANOMALY \d+/g) || []).length;
    expect(anomalyCount).toBeLessThanOrEqual(5);
  });

  it('returns empty for no anomalies', async () => {
    const result = await diagnoseAnomalies(anomalyDiagnosePayloads.empty, env);

    expect(result.diagnoses).toEqual([]);
    expect(mockTextGeneration).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════

describe('Data Flow: Embedding Clusters', () => {
  const env = createMockEnv();

  beforeEach(() => { mockEmbeddings.mockReset(); });

  it('clusters similar embeddings together', async () => {
    // Create 4 embeddings: first 2 very similar, last 2 very similar
    const baseA = Array.from({ length: 768 }, () => 0.5);
    const baseB = Array.from({ length: 768 }, () => -0.5);

    mockEmbeddings.mockResolvedValue({
      embeddings: [
        baseA,
        baseA.map(v => v + 0.01),  // very close to baseA
        baseB,
        baseB.map(v => v + 0.01)   // very close to baseB
      ]
    });

    const result = await clusterByEmbeddings({
      keywords: ['crm software', 'crm tools', 'email marketing', 'marketing automation'],
      minSimilarity: 0.9
    }, env);

    expect(result.clusters.length).toBeGreaterThanOrEqual(1);
    expect(result.stats.total).toBe(4);
    expect(() => validateEmbeddingClusterResponse(result)).not.toThrow();
  });

  it('returns all orphans when nothing clusters', async () => {
    // Orthogonal embeddings — nothing should cluster
    const dims = 768;
    mockEmbeddings.mockResolvedValue({
      embeddings: [
        Array.from({ length: dims }, (_, i) => i === 0 ? 1 : 0),
        Array.from({ length: dims }, (_, i) => i === 1 ? 1 : 0),
        Array.from({ length: dims }, (_, i) => i === 2 ? 1 : 0)
      ]
    });

    const result = await clusterByEmbeddings({
      keywords: ['aaa', 'bbb', 'ccc'],
      minSimilarity: 0.9
    }, env);

    expect(result.clusters).toHaveLength(0);
    expect(result.orphans).toHaveLength(3);
  });

  it('handles object keywords with metrics', async () => {
    mockEmbeddings.mockResolvedValue({
      embeddings: Array.from({ length: 3 }, () =>
        Array.from({ length: 768 }, () => Math.random())
      )
    });

    const result = await clusterByEmbeddings(embeddingClusterPayloads.full, env);

    expect(result.stats.total).toBe(8);
    expect(() => validateEmbeddingClusterResponse(result)).not.toThrow();
  });

  it('returns early for fewer than 2 keywords', async () => {
    const result = await clusterByEmbeddings(embeddingClusterPayloads.tooFew, env);

    expect(result.clusters).toEqual([]);
    expect(mockEmbeddings).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════

describe('Data Flow: Conversational AI', () => {
  const env = createMockEnv();

  beforeEach(() => { mockTextGeneration.mockReset(); });

  it('returns text response with metadata', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse(
      'Your top keyword is "best crm software" at position 4.2 with a 6.8% CTR.'
    ));

    const result = await chatWithData(chatPayloads.full, env);

    expect(result.response).toContain('best crm software');
    expect(result.metadata.conversationLength).toBe(3); // 2 history + 1 current
    expect(() => validateChatResponse(result)).not.toThrow();
  });

  it('escalates complexity for long conversations', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse('Answer'));

    const longHistory = {
      message: 'Follow-up question',
      history: Array.from({ length: 5 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant', content: `Turn ${i}`
      }))
    };

    await chatWithData(longHistory, env);

    const callArgs = mockTextGeneration.mock.calls[0][0];
    expect(callArgs.complexity).toBe('complex');
  });

  it('returns error for empty/missing message', async () => {
    const result = await chatWithData({ message: '' }, env);
    expect(result.error).toBeTruthy();
    expect(mockTextGeneration).not.toHaveBeenCalled();
  });

  it('includes analytics data in system prompt', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse('Answer'));

    await chatWithData(chatPayloads.full, env);

    const callArgs = mockTextGeneration.mock.calls[0][0];
    expect(callArgs.systemPrompt).toContain('245');  // impressions
    expect(callArgs.systemPrompt).toContain('best crm software');
  });
});

// ═══════════════════════════════════════════════════════════════════════

describe('Data Flow: Content Rewrites', () => {
  const env = createMockEnv();

  beforeEach(() => { mockTextGeneration.mockReset(); });

  it('parses valid rewrite JSON', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse(JSON.stringify({
      rewrites: [{
        url: '/blog/crm-guide',
        title: { current: 'CRM Guide', suggested: 'Best CRM Software Guide 2026 | Top 10 Tools Compared', reasoning: 'Added year and specificity' },
        description: { current: 'A guide to CRM.', suggested: 'Discover the 10 best CRM tools for 2026. Compare pricing...', reasoning: 'More specific' },
        h1: { current: 'CRM Guide', suggested: 'The Complete CRM Software Comparison for 2026', reasoning: 'More engaging' },
        estimatedCTRLift: '+15-25%'
      }]
    })));

    const result = await generateRewrites(contentRewritePayloads.minimal, env);

    expect(result.rewrites).toHaveLength(1);
    expect(result.rewrites[0].title.suggested).toContain('2026');
    expect(() => validateContentRewriteResponse(result)).not.toThrow();
  });

  it('returns fallback on garbage response', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse('Here are my suggestions:\n\n1. Change the title...'));

    const result = await generateRewrites(contentRewritePayloads.minimal, env);

    expect(result.rewrites[0].source).toBe('ai-engine-fallback');
  });

  it('caps at 10 pages per request', async () => {
    const manyPages = {
      pages: Array.from({ length: 15 }, (_, i) => ({
        url: `/page-${i}`, title: `Page ${i}`, targetKeywords: [`keyword ${i}`]
      }))
    };

    mockTextGeneration.mockResolvedValue(makeLLMResponse(JSON.stringify({ rewrites: [] })));
    await generateRewrites(manyPages, env);

    const callArgs = mockTextGeneration.mock.calls[0][0];
    const pageCount = (callArgs.userPrompt.match(/PAGE \d+/g) || []).length;
    expect(pageCount).toBeLessThanOrEqual(10);
  });

  it('returns empty for no pages', async () => {
    const result = await generateRewrites(contentRewritePayloads.empty, env);
    expect(result.rewrites).toEqual([]);
    expect(mockTextGeneration).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════

describe('Data Flow: Recommendation Refiner', () => {
  const env = createMockEnv();

  beforeEach(() => { mockTextGeneration.mockReset(); });

  it('performs two-pass refinement (critique + refine)', async () => {
    mockTextGeneration
      .mockResolvedValueOnce(makeLLMResponse('CRITIQUE: Recommendation 1 is too vague. Score: 4/10.'))
      .mockResolvedValueOnce(makeLLMResponse(JSON.stringify({
        refined: [{
          id: 'rec-1', priority: 'high', category: 'on-page',
          title: 'Update title tags for /blog/crm-guide and /pricing to include "2026" and primary keyword',
          description: 'Refined description with evidence',
          affectedPages: ['/blog/crm-guide', '/pricing'],
          affectedKeywords: ['best crm software'],
          implementation_steps: ['Step 1', 'Step 2', 'Step 3'],
          projectedImpact: { metric: 'CTR', currentValue: 0.038, projectedValue: 0.052, confidence: 0.65 },
          evidence: 'Based on position 6.2 and industry CTR benchmarks',
          refinementNotes: 'Added specific pages and realistic projections',
          refinedBy: 'ai-engine',
          refinedAt: '2026-02-10T00:00:00Z'
        }]
      })));

    const result = await refineRecommendations(refineRecsPayloads.full, env);

    expect(mockTextGeneration).toHaveBeenCalledTimes(2);
    expect(result.refined).toHaveLength(1);
    expect(result.critique).toContain('CRITIQUE');
    expect(result.metadata.passes).toBe(2);
    expect(() => validateRefineRecsResponse(result)).not.toThrow();
  });

  it('second pass receives critique from first pass', async () => {
    const critiqueText = 'This recommendation lacks specificity.';
    mockTextGeneration
      .mockResolvedValueOnce(makeLLMResponse(critiqueText))
      .mockResolvedValueOnce(makeLLMResponse(JSON.stringify({ refined: [{ title: 'Better rec', refinedBy: 'ai-engine' }] })));

    await refineRecommendations(refineRecsPayloads.minimal, env);

    const refineCallArgs = mockTextGeneration.mock.calls[1][0];
    expect(refineCallArgs.userPrompt).toContain(critiqueText);
  });

  it('returns empty for no recommendations', async () => {
    const result = await refineRecommendations(refineRecsPayloads.empty, env);
    expect(result.refined).toEqual([]);
    expect(mockTextGeneration).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════

describe('Data Flow: Smart Forecasting', () => {
  const env = createMockEnv();

  beforeEach(() => { mockTextGeneration.mockReset(); });

  it('computes stats and parses forecast JSON', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse(JSON.stringify({
      forecasts: {
        impressions: { current: 9500, forecastMid: 10200, forecastLow: 8800, forecastHigh: 11600, confidence: 0.7, reasoning: 'Upward trend continuing', trend: 'rising' },
        clicks: { current: 340, forecastMid: 380, forecastLow: 310, forecastHigh: 450, confidence: 0.65, reasoning: 'Correlated with impressions', trend: 'rising' }
      },
      overallOutlook: 'Positive trajectory expected to continue.',
      risks: ['Potential algorithm update'],
      opportunities: ['Publish more content in trending topics']
    })));

    const result = await smartForecast(smartForecastPayloads.full, env);

    expect(result.forecasts.impressions.trend).toBeDefined();
    expect(result.stats).toHaveProperty('impressions');
    expect(result.stats.impressions.direction).toBeDefined();
    expect(() => validateSmartForecastResponse(result)).not.toThrow();
  });

  it('returns fallback forecast on garbage response', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse('Based on the data I can see a general upward trend...'));

    const result = await smartForecast(smartForecastPayloads.minimal, env);

    expect(result.forecasts).toBeDefined();
    expect(Object.keys(result.forecasts).length).toBeGreaterThan(0);
  });

  it('rejects fewer than 7 data points', async () => {
    const result = await smartForecast(smartForecastPayloads.tooFew, env);

    expect(result.error).toContain('at least 7');
    expect(mockTextGeneration).not.toHaveBeenCalled();
  });

  it('computes correct statistical summaries', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse(JSON.stringify({
      forecasts: {}, overallOutlook: '', risks: [], opportunities: []
    })));

    const result = await smartForecast(smartForecastPayloads.full, env);

    // Verify stats were computed from the 30-day series
    expect(result.stats.impressions).toBeDefined();
    expect(result.stats.impressions.dataPoints).toBe(30);
    expect(result.stats.impressions.mean).toBeGreaterThan(0);
    expect(result.stats.impressions.stdDev).toBeGreaterThan(0);
    expect(['rising', 'falling', 'stable']).toContain(result.stats.impressions.direction);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Data Flow: Cannibalization Detection
// ═══════════════════════════════════════════════════════════════════════

describe('Data Flow: Cannibalization Detection', () => {
  const env = createMockEnv();

  beforeEach(() => { mockTextGeneration.mockReset(); });

  it('detects keyword overlaps and returns LLM analysis', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse(JSON.stringify({
      conflicts: [{
        keyword: 'best crm software',
        severity: 'high',
        pages: [
          { url: '/blog/best-crm', title: 'Best CRM Software 2025', position: 8, clicks: 120 },
          { url: '/reviews/crm-comparison', title: 'CRM Comparison & Reviews', position: 12, clicks: 45 }
        ],
        recommendation: 'Consolidate into a single page.',
        suggestedCanonical: '/blog/best-crm',
        estimatedTrafficLoss: 30
      }],
      summary: '1 conflict detected.',
      overallSeverity: 'high'
    })));

    const result = await detectCannibalization(cannibalizationPayloads.full, env);

    expect(result.conflicts.length).toBeGreaterThanOrEqual(1);
    expect(result.overallSeverity).toBeTruthy();
    expect(result.summary).toBeTruthy();
    expect(result.metadata.provider).toBe('claude');
    expect(() => validateCannibalizationResponse(result)).not.toThrow();
  });

  it('returns no conflicts for pages with no keyword overlap', async () => {
    const result = await detectCannibalization(cannibalizationPayloads.noOverlap, env);

    expect(result.conflicts).toEqual([]);
    expect(result.overallSeverity).toBe('none');
    expect(mockTextGeneration).not.toHaveBeenCalled();
  });

  it('returns early for fewer than 2 pages', async () => {
    const result = await detectCannibalization(cannibalizationPayloads.tooFew, env);

    expect(result.conflicts).toEqual([]);
    expect(result.overallSeverity).toBe('none');
    expect(mockTextGeneration).not.toHaveBeenCalled();
  });

  it('uses fallback on garbage LLM response', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse('NOT VALID JSON AT ALL!!!'));

    const result = await detectCannibalization(cannibalizationPayloads.full, env);

    // Should still return valid structure via fallback
    expect(result.conflicts).toBeDefined();
    expect(result.summary).toBeTruthy();
    expect(result.overallSeverity).toBeTruthy();
    expect(() => validateCannibalizationResponse(result)).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Data Flow: Content Gap Analysis
// ═══════════════════════════════════════════════════════════════════════

describe('Data Flow: Content Gap Analysis', () => {
  const env = createMockEnv();

  beforeEach(() => { mockTextGeneration.mockReset(); });

  it('identifies gaps and returns LLM enrichment', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse(JSON.stringify({
      gaps: [
        { keyword: 'crm for small business', opportunity: 'high', estimatedVolume: 5400, difficulty: 'moderate', suggestedContentType: 'comparison-guide', suggestedTitle: 'Best CRM for Small Business 2025', reasoning: 'High-volume gap.', competitorUrls: ['competitor-a.com'] },
        { keyword: 'crm implementation guide', opportunity: 'medium', estimatedVolume: 2900, difficulty: 'easy', suggestedContentType: 'guide', suggestedTitle: 'CRM Implementation Guide', reasoning: 'Low competition.', competitorUrls: ['competitor-b.com'] }
      ],
      summary: '2 gaps found.',
      topOpportunities: ['crm for small business', 'crm implementation guide']
    })));

    const result = await analyseContentGaps(contentGapsPayloads.full, env);

    expect(result.gaps.length).toBeGreaterThanOrEqual(1);
    expect(result.topOpportunities.length).toBeGreaterThanOrEqual(1);
    expect(result.summary).toBeTruthy();
    expect(result.metadata.provider).toBe('claude');
    expect(() => validateContentGapsResponse(result)).not.toThrow();
  });

  it('returns empty for missing site/competitor keywords', async () => {
    const result = await analyseContentGaps(contentGapsPayloads.empty, env);

    expect(result.gaps).toEqual([]);
    expect(mockTextGeneration).not.toHaveBeenCalled();
  });

  it('returns empty when site already covers competitor keywords', async () => {
    const result = await analyseContentGaps(contentGapsPayloads.noDifference, env);

    expect(result.gaps).toEqual([]);
    expect(result.overallSeverity || result.summary).toBeTruthy();
    expect(mockTextGeneration).not.toHaveBeenCalled();
  });

  it('uses fallback on garbage LLM response', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse('broken!!!'));

    const result = await analyseContentGaps(contentGapsPayloads.full, env);

    expect(result.gaps).toBeDefined();
    expect(result.summary).toBeTruthy();
    expect(result.topOpportunities).toBeDefined();
    expect(() => validateContentGapsResponse(result)).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Data Flow: Page Scorer
// ═══════════════════════════════════════════════════════════════════════

describe('Data Flow: Page Scorer', () => {
  const env = createMockEnv();

  beforeEach(() => { mockTextGeneration.mockReset(); });

  it('scores pages with deterministic + LLM enrichment', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse(JSON.stringify({
      scores: [{
        url: '/blog/seo-tips',
        overallScore: 82,
        grade: 'A',
        dimensions: {
          technical: { score: 85, issues: [], suggestions: ['Add HTTP/2'] },
          content: { score: 88, issues: [], suggestions: [] },
          onPage: { score: 78, issues: ['Add more internal links'], suggestions: ['Link to cornerstone content'] },
          ux: { score: 90, issues: [], suggestions: [] }
        },
        topPriority: 'Add more internal links to cornerstone content',
        estimatedImpact: 'medium'
      }],
      averageScore: 82,
      summary: '1 page scored. Average 82/100 (Grade A).'
    })));

    const result = await scorePages(pageScorerPayloads.full, env);

    expect(result.scores.length).toBe(1);
    expect(result.scores[0].overallScore).toBeGreaterThanOrEqual(0);
    expect(result.scores[0].overallScore).toBeLessThanOrEqual(100);
    expect(result.averageScore).toBeGreaterThanOrEqual(0);
    expect(result.summary).toBeTruthy();
    expect(result.metadata.provider).toBe('claude');
    expect(() => validatePageScorerResponse(result)).not.toThrow();
  });

  it('returns empty for no pages', async () => {
    const result = await scorePages(pageScorerPayloads.empty, env);

    expect(result.scores).toEqual([]);
    expect(result.averageScore).toBe(0);
    expect(mockTextGeneration).not.toHaveBeenCalled();
  });

  it('scores a poor page lower than average', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse(JSON.stringify({
      scores: [{
        url: '/blog/thin-content',
        overallScore: 25,
        grade: 'F',
        dimensions: {
          technical: { score: 20, issues: ['Slow load', 'No schema', 'Not mobile-friendly'], suggestions: ['Fix all'] },
          content: { score: 15, issues: ['Thin content', 'No alt text'], suggestions: ['Expand'] },
          onPage: { score: 30, issues: ['Title too short', 'Description too short'], suggestions: ['Rewrite'] },
          ux: { score: 35, issues: ['Slow', 'Not mobile-friendly'], suggestions: ['Improve'] }
        },
        topPriority: 'Expand thin content to 1500+ words',
        estimatedImpact: 'high'
      }],
      averageScore: 25,
      summary: 'Very poor page.'
    })));

    const result = await scorePages(pageScorerPayloads.poorPage, env);

    expect(result.scores[0].overallScore).toBeLessThan(50);
    expect(result.scores[0].estimatedImpact).toBe('high');
    expect(() => validatePageScorerResponse(result)).not.toThrow();
  });

  it('uses fallback on garbage LLM response', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse('totally broken'));

    const result = await scorePages(pageScorerPayloads.full, env);

    // Deterministic fallback should still provide valid scores
    expect(result.scores.length).toBe(1);
    expect(result.scores[0].overallScore).toBeGreaterThanOrEqual(0);
    expect(result.scores[0].dimensions).toBeDefined();
    expect(result.summary).toBeTruthy();
    expect(() => validatePageScorerResponse(result)).not.toThrow();
  });

  it('computes deterministic scores for minimal input', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse(JSON.stringify({
      scores: [{
        url: '/page-a',
        overallScore: 70,
        grade: 'B',
        dimensions: {
          technical: { score: 70, issues: [], suggestions: [] },
          content: { score: 70, issues: [], suggestions: [] },
          onPage: { score: 70, issues: ['No title provided'], suggestions: ['Add a title'] },
          ux: { score: 75, issues: [], suggestions: [] }
        },
        topPriority: 'Add a page title',
        estimatedImpact: 'medium'
      }],
      averageScore: 70,
      summary: 'Minimal input scored.'
    })));

    const result = await scorePages(pageScorerPayloads.minimal, env);

    expect(result.scores.length).toBe(1);
    expect(result.scores[0].url).toBe('/page-a');
    expect(() => validatePageScorerResponse(result)).not.toThrow();
  });
});
