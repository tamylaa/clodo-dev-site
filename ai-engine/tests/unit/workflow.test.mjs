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
  it('GET /ai/capabilities returns all 7 capabilities', async () => {
    const { status, data } = await fetchJSON('GET', '/ai/capabilities');

    expect(status).toBe(200);
    expect(data.engine).toBe('ai-engine');
    expect(data.capabilities).toHaveLength(7);

    const ids = data.capabilities.map(c => c.id);
    expect(ids).toContain('intent-classify');
    expect(ids).toContain('anomaly-diagnose');
    expect(ids).toContain('embedding-cluster');
    expect(ids).toContain('chat');
    expect(ids).toContain('content-rewrite');
    expect(ids).toContain('refine-recs');
    expect(ids).toContain('smart-forecast');
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
});

// ═══════════════════════════════════════════════════════════════════════

describe('Workflow: Error Handling', () => {
  it('returns 404 for unknown routes', async () => {
    const { status, data } = await fetchJSON('GET', '/ai/nonexistent');

    expect(status).toBe(404);
    expect(data.error).toBe('Not found');
    expect(data.endpoints).toBeInstanceOf(Array);
  });

  it('returns 500 on unexpected provider error', async () => {
    mockTextGeneration.mockRejectedValue(new Error('All providers failed'));

    const { status, data } = await fetchJSON('POST', '/ai/chat', {
      body: { message: 'test' }
    });

    expect(status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
