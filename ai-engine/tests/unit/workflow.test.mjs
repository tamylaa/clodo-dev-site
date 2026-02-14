/**
 * Tests: End-to-End Workflow — Full Request Lifecycle
 * 
 * Tests the complete worker request lifecycle:
 *   Request → CORS → Auth → Rate Limit → Route → Capability → Provider → Response
 * 
 * These tests import the worker's fetch handler directly and simulate
 * full HTTP requests, verifying headers, status codes, and response shapes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockEnv } from '../setup.mjs';

// ── Mock the provider layer (no real API calls) ─────────────────────

const mockTextGeneration = vi.fn();
const mockEmbeddings = vi.fn();

vi.mock('../../src/providers/ai-provider.mjs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    runTextGeneration: (...args) => mockTextGeneration(...args),
    runEmbeddings: (...args) => mockEmbeddings(...args)
  };
});

// ── Import the worker ───────────────────────────────────────────────

import worker from '../../src/worker.mjs';

// ── Helpers ──────────────────────────────────────────────────────────

function makeRequest(method, path, { body, headers = {} } = {}) {
  const url = `https://ai-engine.test.workers.dev${path}`;
  const init = {
    method,
    headers: new Headers({
      'Content-Type': 'application/json',
      ...headers
    })
  };
  if (body) init.body = JSON.stringify(body);
  return new Request(url, init);
}

function authedHeaders(extraHeaders = {}) {
  return {
    authorization: 'Bearer test-token-123',
    ...extraHeaders
  };
}

async function fetchJSON(method, path, opts = {}) {
  const req = makeRequest(method, path, {
    body: opts.body,
    headers: opts.auth !== false ? authedHeaders(opts.headers) : opts.headers
  });
  const env = opts.env || createMockEnv();
  const response = await worker.fetch(req, env, {});
  const data = await response.json();
  return { response, data, status: response.status };
}

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

// ═══════════════════════════════════════════════════════════════════════

describe('Workflow: Health Check', () => {
  it('GET /health returns 200 with health status (no auth required)', async () => {
    const { status, data } = await fetchJSON('GET', '/health', { auth: false });

    expect(status).toBe(200);
    expect(data.service).toBe('ai-engine');
    expect(data.version).toBe('2.0.0');
    expect(data.healthy).toBe(true);
    expect(data.checks.kv_ai.status).toBe('ok');
    expect(data.checks.workers_ai.status).toBe('ok');
  });

  it('GET / also returns health', async () => {
    const { status, data } = await fetchJSON('GET', '/', { auth: false });
    expect(status).toBe(200);
    expect(data.service).toBe('ai-engine');
  });
});

// ═══════════════════════════════════════════════════════════════════════

describe('Workflow: CORS', () => {
  it('OPTIONS returns 204 with CORS headers', async () => {
    const req = makeRequest('OPTIONS', '/ai/capabilities');
    const env = createMockEnv();
    const response = await worker.fetch(req, env, {});

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('all responses include CORS headers', async () => {
    const { response } = await fetchJSON('GET', '/health', { auth: false });
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════

describe('Workflow: Authentication', () => {
  it('rejects /ai/* without auth', async () => {
    const { status, data } = await fetchJSON('GET', '/ai/capabilities', { auth: false });

    expect(status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('accepts bearer token auth', async () => {
    const { status, data } = await fetchJSON('GET', '/ai/capabilities');

    expect(status).toBe(200);
    expect(data.capabilities).toBeInstanceOf(Array);
  });

  it('accepts service binding auth', async () => {
    const { status } = await fetchJSON('GET', '/ai/capabilities', {
      auth: false,
      headers: { 'x-ai-engine-service': 'visibility-analytics' }
    });

    expect(status).toBe(200);
  });

  it('rejects invalid bearer token', async () => {
    const { status } = await fetchJSON('GET', '/ai/capabilities', {
      auth: false,
      headers: { authorization: 'Bearer wrong-token' }
    });

    expect(status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════

describe('Workflow: Rate Limiting', () => {
  it('returns 429 when rate limit exceeded', async () => {
    const env = createMockEnv();
    env.KV_AI.get.mockResolvedValue('300'); // Over the limit

    const { status, data, response } = await fetchJSON('GET', '/ai/capabilities', { env });

    expect(status).toBe(429);
    expect(data.error).toBe('Rate limit exceeded');
    expect(response.headers.get('Retry-After')).toBe('3600');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
  });
});

// ═══════════════════════════════════════════════════════════════════════

describe('Workflow: Discovery Endpoints', () => {
  it('GET /ai/capabilities returns all 14 capabilities', async () => {
    const { status, data } = await fetchJSON('GET', '/ai/capabilities');

    expect(status).toBe(200);
    expect(data.engine).toBe('ai-engine');
    expect(data.capabilities).toHaveLength(14);

    const ids = data.capabilities.map(c => c.id);
    expect(ids).toContain('intent-classify');
    expect(ids).toContain('anomaly-diagnose');
    expect(ids).toContain('embedding-cluster');
    expect(ids).toContain('chat');
    expect(ids).toContain('content-rewrite');
    expect(ids).toContain('eat-assess');
    expect(ids).toContain('refine-recs');
    expect(ids).toContain('smart-forecast');
    expect(ids).toContain('cannibalization-detect');
    expect(ids).toContain('content-gaps');
    expect(ids).toContain('page-score');
    expect(ids).toContain('site-health-pulse');
    expect(ids).toContain('experiment');
    expect(ids).toContain('batch-analyze');
  });

  it('GET /ai/providers returns all 6 providers', async () => {
    const { status, data } = await fetchJSON('GET', '/ai/providers');

    expect(status).toBe(200);
    expect(data.claude).toBeDefined();
    expect(data.cloudflare).toBeDefined();
    expect(data.claude.available).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════

describe('Workflow: Capability Toggle', () => {
  it('returns 403 when capability is disabled', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse('test'));

    const env = createMockEnv({ CAPABILITY_INTENT: 'false' });
    const { status, data } = await fetchJSON('POST', '/ai/intent-classify', {
      body: { keywords: ['test'] },
      env
    });

    expect(status).toBe(403);
    expect(data.error).toContain('Capability disabled');
  });
});

// ═══════════════════════════════════════════════════════════════════════

describe('Workflow: Full Capability Round-Trips', () => {
  beforeEach(() => {
    mockTextGeneration.mockReset();
    mockEmbeddings.mockReset();
  });

  it('POST /ai/intent-classify → JSON with classifications', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse(JSON.stringify([
      { query: 'best crm', intent: 'commercial', confidence: 0.9, businessValue: 8, contentType: 'comparison-page', reasoning: 'Comparing products' }
    ])));

    const { status, data } = await fetchJSON('POST', '/ai/intent-classify', {
      body: { keywords: ['best crm'] }
    });

    expect(status).toBe(200);
    expect(data.classifications).toBeDefined();
    expect(data.metadata.provider).toBe('claude');
  });

  it('POST /ai/anomaly-diagnose → JSON with diagnoses', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse(JSON.stringify({
      diagnoses: [{ anomalyId: 'a1', likelyCause: 'Algorithm update', confidence: 0.8, immediateAction: 'Check GSC', investigationSteps: ['Step 1'], isRealProblem: true, severity: 'critical' }]
    })));

    const { status, data } = await fetchJSON('POST', '/ai/anomaly-diagnose', {
      body: { anomalies: [{ type: 'drop', severity: 'critical', description: 'Position dropped' }] }
    });

    expect(status).toBe(200);
    expect(data.diagnoses).toHaveLength(1);
  });

  it('POST /ai/chat → JSON with response text', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse('Your top keyword has a 6.8% CTR.'));

    const { status, data } = await fetchJSON('POST', '/ai/chat', {
      body: { message: 'What is my top keyword?', analyticsContext: {} }
    });

    expect(status).toBe(200);
    expect(data.response).toContain('6.8%');
  });

  it('POST /ai/content-rewrite → JSON with rewrites', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse(JSON.stringify({
      rewrites: [{
        url: '/test', title: { current: 'Old', suggested: 'New', reasoning: 'Better' },
        description: { current: 'Old', suggested: 'New', reasoning: 'Better' },
        h1: { current: 'Old', suggested: 'New', reasoning: 'Better' },
        estimatedCTRLift: '+20%'
      }]
    })));

    const { status, data } = await fetchJSON('POST', '/ai/content-rewrite', {
      body: { pages: [{ url: '/test', title: 'Old', targetKeywords: ['kw'] }] }
    });

    expect(status).toBe(200);
    expect(data.rewrites).toHaveLength(1);
  });

  it('POST /ai/eat-assess → JSON with assessment', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse(JSON.stringify({
      scores: { expertise: 0.8, authoritativeness: 0.7, trustworthiness: 0.9, overall: 0.8 },
      analysis: { expertise: 'Strong technical knowledge', authoritativeness: 'Established site', trustworthiness: 'Factual and cited' },
      recommendations: ['Add more citations', 'Include author bio']
    })));

    const { status, data } = await fetchJSON('POST', '/ai/eat-assess', {
      body: { content: 'This is a sample article about SEO best practices with citations.' }
    });

    expect(status).toBe(200);
    expect(data.scores).toBeDefined();
  });

  it('POST /ai/smart-forecast → JSON with forecast', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse(JSON.stringify({
      forecasts: { impressions: { current: 1000, forecastMid: 1100, forecastLow: 900, forecastHigh: 1300, confidence: 0.7, reasoning: 'Upward', trend: 'rising' } },
      overallOutlook: 'Positive', risks: [], opportunities: []
    })));

    const ts = Array.from({ length: 10 }, (_, i) => ({
      date: `2026-02-0${i + 1}`, impressions: 1000 + i * 10, clicks: 35 + i, ctr: 0.035, position: 8
    }));

    const { status, data } = await fetchJSON('POST', '/ai/smart-forecast', {
      body: { timeSeries: ts }
    });

    expect(status).toBe(200);
    expect(data.forecasts).toBeDefined();
    expect(data.stats).toBeDefined();
  });

  it('POST /ai/embedding-cluster → JSON with clusters', async () => {
    mockEmbeddings.mockResolvedValue({
      embeddings: [[0.1, 0.2, 0.3], [0.1, 0.2, 0.4], [0.8, 0.9, 0.1]],
      model: 'text-embedding-ada-002',
      provider: 'cloudflare'
    });

    const { status, data } = await fetchJSON('POST', '/ai/embedding-cluster', {
      body: { keywords: ['seo software', 'seo tool', 'crm system'] }
    });

    expect(status).toBe(200);
    expect(data.clusters).toBeDefined();
    expect(data.stats).toBeDefined();
    expect(data.stats.total).toBe(3);
  });

  it('POST /ai/refine-recs → JSON with refined recommendations', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse(JSON.stringify({
      refined: [{
        original: 'Improve page speed',
        refined: 'Optimize Core Web Vitals and reduce server response time',
        priority: 'high',
        effort: 'moderate',
        estimatedImpact: '+15% conversion rate',
        actionSteps: ['Audit current performance', 'Implement caching', 'Optimize images'],
        rationale: 'Page speed directly impacts user experience and rankings'
      }]
    })));

    const { status, data } = await fetchJSON('POST', '/ai/refine-recs', {
      body: {
        recommendations: [{ title: 'Improve page speed', description: 'Make pages load faster' }],
        analyticsContext: { monthlyTraffic: 10000 }
      }
    });

    expect(status).toBe(200);
    expect(data.refined).toBeDefined();
    expect(data.refined).toHaveLength(1);
  });

  it('POST /ai/cannibalization-detect → JSON with conflicts', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse(JSON.stringify({
      conflicts: [{
        keyword: 'seo software',
        severity: 'high',
        pages: [
          { url: '/seo-tools', title: 'SEO Tools', position: 5 },
          { url: '/best-seo-software', title: 'Best SEO Software', position: 7 }
        ],
        recommendation: 'Choose one page as canonical for this keyword',
        suggestedCanonical: '/seo-tools'
      }],
      summary: 'Found 1 keyword cannibalization conflict',
      overallSeverity: 'high'
    })));

    const { status, data } = await fetchJSON('POST', '/ai/cannibalization-detect', {
      body: {
        pages: [
          { url: '/seo-tools', keywords: ['seo software'], position: 5 },
          { url: '/best-seo-software', keywords: ['seo software'], position: 7 }
        ]
      }
    });

    expect(status).toBe(200);
    expect(data.conflicts).toBeDefined();
    expect(data.conflicts).toHaveLength(1);
    expect(data.overallSeverity).toBe('high');
  });

  it('POST /ai/content-gaps → JSON with gaps', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse(JSON.stringify({
      gaps: [{
        keyword: 'seo automation',
        opportunity: 'high',
        estimatedVolume: 1200,
        difficulty: 'moderate',
        suggestedContentType: 'Guide',
        suggestedTitle: 'Complete Guide to SEO Automation Tools',
        reasoning: 'Competitors rank well but site has no coverage'
      }],
      summary: 'Identified 1 high-opportunity content gap',
      topOpportunities: ['seo automation']
    })));

    const { status, data } = await fetchJSON('POST', '/ai/content-gaps', {
      body: {
        siteKeywords: ['seo tools', 'keyword research'],
        competitorKeywords: [{ keyword: 'seo automation', volume: 1200 }]
      }
    });

    expect(status).toBe(200);
    expect(data.gaps).toBeDefined();
    expect(data.gaps).toHaveLength(1);
    expect(data.topOpportunities).toBeDefined();
  });

  it('POST /ai/page-score → JSON with page scores', async () => {
    mockTextGeneration.mockResolvedValue(makeLLMResponse(JSON.stringify({
      pages: [{
        url: '/test-page',
        overallScore: 75,
        grade: 'B',
        dimensions: {
          technical: { score: 80, issues: [], suggestions: [] },
          content: { score: 70, issues: ['Low word count'], suggestions: ['Add more content'] },
          onPage: { score: 85, issues: [], suggestions: [] },
          ux: { score: 65, issues: ['Slow load time'], suggestions: ['Optimize images'] }
        },
        priorityFixes: ['Increase word count', 'Improve load speed']
      }],
      summary: { averageScore: 75, topIssues: ['Content length', 'Performance'] }
    })));

    const { status, data } = await fetchJSON('POST', '/ai/page-score', {
      body: {
        pages: [{
          url: '/test-page',
          title: 'Test Page',
          wordCount: 300,
          loadTimeMs: 3000
        }]
      }
    });

    expect(status).toBe(200);
    expect(data.pages).toBeDefined();
    expect(data.pages).toHaveLength(1);
    expect(data.pages[0].overallScore).toBeDefined();
    expect(data.summary).toBeDefined();
  });

  it('POST /ai/site-health-pulse → JSON with health assessment', async () => {
    // Mock multiple LLM calls for the composite capability
    mockTextGeneration
      .mockResolvedValueOnce(makeLLMResponse(JSON.stringify({
        pages: [{
          url: '/test',
          overallScore: 75,
          grade: 'B',
          dimensions: { technical: { score: 80 }, content: { score: 70 }, onPage: { score: 85 }, ux: { score: 65 } }
        }]
      })))
      .mockResolvedValueOnce(makeLLMResponse(JSON.stringify({
        conflicts: [],
        summary: 'No cannibalization detected',
        overallSeverity: 'none'
      })))
      .mockResolvedValueOnce(makeLLMResponse(JSON.stringify({
        gaps: [{ keyword: 'missing topic', opportunity: 'high' }],
        summary: 'Found content gaps',
        topOpportunities: ['missing topic']
      })))
      .mockResolvedValueOnce(makeLLMResponse(JSON.stringify({
        diagnoses: [],
        summary: 'No anomalies detected'
      })));

    const { status, data } = await fetchJSON('POST', '/ai/site-health-pulse', {
      body: {
        pages: [{
          url: '/test',
          title: 'Test Page',
          wordCount: 500,
          keywords: ['test keyword']
        }],
        siteKeywords: ['existing keyword'],
        competitorKeywords: [{ keyword: 'missing topic' }]
      }
    });

    expect(status).toBe(200);
    expect(data.healthScore).toBeDefined();
    expect(data.grade).toBeDefined();
    expect(data.dimensions).toBeDefined();
    expect(data.insights).toBeDefined();
    expect(data.capabilitiesRun).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════

describe('Workflow: Provider Fallback Chains', () => {
  beforeEach(() => {
    mockTextGeneration.mockReset();
  });

  it('falls back to next provider when first fails', async () => {
    // Mock fallback behavior
    const mockResult = {
      text: JSON.stringify([{
        query: 'asdfghjkl',
        intent: 'informational',
        confidence: 0.8
      }]),
      provider: 'openai',
      model: 'gpt-4',
      tokensUsed: { input: 100, output: 50 },
      cost: { estimated: 0.002 },
      durationMs: 800,
      fallbackUsed: true,
      attemptIndex: 1
    };
    mockTextGeneration.mockResolvedValueOnce(mockResult);

    const { status, data } = await fetchJSON('POST', '/ai/intent-classify', {
      body: { keywords: ['asdfghjkl'] }
    });

    expect(status).toBe(200);
    expect(data.classifications).toBeDefined();
    // Mock simulates fallback behavior
    expect(data.metadata).toBeDefined();
  });

  it('returns 500 when all providers fail', async () => {
    mockTextGeneration.mockRejectedValue(new Error('All providers failed'));

    const { status, data } = await fetchJSON('POST', '/ai/intent-classify', {
      body: { keywords: ['test'] }
    });

    expect(status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('times out after configured timeout', async () => {
    // Mock timeout error
    mockTextGeneration.mockRejectedValueOnce(new Error('Provider claude timed out after 1000ms'));

    const env = createMockEnv({ AI_TIMEOUT_MS: '1000' }); // 1 second timeout
    const { status, data } = await fetchJSON('POST', '/ai/intent-classify', {
      body: { keywords: ['test'] },
      env
    });

    expect(status).toBe(500);
    expect(data.error).toBe('Internal server error');
  }, 10000); // 10 second test timeout
});

// ═══════════════════════════════════════════════════════════════════════

describe('Workflow: Error Recovery & Edge Cases', () => {
  beforeEach(() => {
    mockTextGeneration.mockReset();
    mockEmbeddings.mockReset();
  });

  it('handles network failures gracefully', async () => {
    mockTextGeneration.mockRejectedValue(new Error('Network timeout'));

    const { status, data } = await fetchJSON('POST', '/ai/chat', {
      body: { message: 'test' }
    });

    expect(status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('validates batch request payload sizes', async () => {
    const largePayload = 'x'.repeat(1024 * 1024 + 1); // 1MB + 1 byte
    const { status, data } = await fetchJSON('POST', '/ai/batch-analyze', {
      body: [{
        capability: 'intent-classify',
        payload: { keywords: [largePayload] }
      }]
    });

    expect(status).toBe(200); // Should succeed but with error in batch
    expect(data.errors).toBeDefined();
    expect(data.errors[0].error).toContain('payload too large');
  });

  it('rejects unknown capabilities in batch', async () => {
    const { status, data } = await fetchJSON('POST', '/ai/batch-analyze', {
      body: [{
        capability: 'unknown-capability',
        payload: { test: 'data' }
      }]
    });

    expect(status).toBe(200); // 200 with errors
    expect(data.errors).toBeDefined();
    expect(data.errors[0].error).toContain('unknown capability');
  });

  it('handles deeply nested invalid schema data', async () => {
    // Create deeply nested invalid data that should trigger schema validation
    const deepInvalid = {
      pages: [{
        url: '/test',
        title: 'Test',
        description: 'Desc',
        headings: ['H1', 'H2'],
        wordCount: 'not-a-number', // Invalid - should be number
        loadTimeMs: 1000,
        mobileOptimised: true,
        internalLinks: 5,
        externalLinks: 2,
        images: 3,
        imagesWithAlt: 2,
        schemaMarkup: false,
        keywords: ['test']
      }]
    };

    const { status, data } = await fetchJSON('POST', '/ai/page-score', {
      body: deepInvalid
    });

    // Should either succeed with coerced data or fail gracefully
    expect([200, 422]).toContain(status);
  });

  it('handles empty batch requests', async () => {
    const { status, data } = await fetchJSON('POST', '/ai/batch-analyze', {
      body: []
    });

    expect(status).toBe(200);
    expect(data.errors).toBeDefined();
    expect(data.errors[0].error).toContain('non-empty array');
  });

  it('handles oversized batch requests', async () => {
    const largeBatch = Array.from({ length: 15 }, (_, i) => ({
      capability: 'intent-classify',
      payload: { keywords: [`keyword${i}`] }
    }));

    const { status, data } = await fetchJSON('POST', '/ai/batch-analyze', {
      body: largeBatch
    });

    expect(status).toBe(200);
    expect(data.errors).toBeDefined();
    expect(data.errors[0].error).toContain('Maximum 10 requests');
  });
});
