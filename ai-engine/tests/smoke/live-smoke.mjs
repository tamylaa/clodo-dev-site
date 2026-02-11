#!/usr/bin/env node

/**
 * Live Smoke Test — Hit the Deployed AI Engine and Validate Responses
 * 
 * Usage:
 *   node tests/smoke/live-smoke.mjs [staging|production] [--token TOKEN]
 * 
 * Environment variables:
 *   AI_ENGINE_TOKEN — Bearer token for authentication
 *   AI_ENGINE_URL   — Override base URL
 * 
 * This script:
 *   1. Hits /health (no auth) and validates shape
 *   2. Hits /ai/capabilities and /ai/providers (auth required)
 *   3. Sends a minimal payload to each capability endpoint
 *   4. Validates every response against schema validators
 *   5. Reports timing, provider used, and cost per capability
 *   6. Exits 0 if all pass, 1 if any fail
 */

import {
  validateHealthResponse,
  validateCapabilitiesResponse,
  validateProvidersResponse,
  validateIntentClassifyResponse,
  validateAnomalyDiagnoseResponse,
  validateEmbeddingClusterResponse,
  validateChatResponse,
  validateContentRewriteResponse,
  validateRefineRecsResponse,
  validateSmartForecastResponse
} from '../fixtures/validators.mjs';

import {
  intentClassifyPayloads,
  anomalyDiagnosePayloads,
  embeddingClusterPayloads,
  chatPayloads,
  contentRewritePayloads,
  refineRecsPayloads,
  smartForecastPayloads
} from '../fixtures/payloads.mjs';

// ── Configuration ────────────────────────────────────────────────────

const URLS = {
  staging: 'https://ai-engine-staging.wetechfounders.workers.dev',
  production: 'https://ai-engine.wetechfounders.workers.dev'
};

const args = process.argv.slice(2);
const envArg = args.find(a => !a.startsWith('--'));
const tokenArg = args.find(a => a.startsWith('--token='))?.split('=')[1];

const BASE_URL = process.env.AI_ENGINE_URL || URLS[envArg] || URLS.staging;
const TOKEN = tokenArg || process.env.AI_ENGINE_TOKEN;

if (!TOKEN) {
  console.error('\n  ERROR: No token provided.');
  console.error('  Set AI_ENGINE_TOKEN env var or pass --token=YOUR_TOKEN\n');
  process.exit(1);
}

// ── HTTP helpers ─────────────────────────────────────────────────────

async function get(path, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = `Bearer ${TOKEN}`;

  const start = Date.now();
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  const elapsed = Date.now() - start;
  const data = await res.json();

  return { status: res.status, data, elapsed };
}

async function post(path, body) {
  const start = Date.now();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    },
    body: JSON.stringify(body)
  });
  const elapsed = Date.now() - start;
  const data = await res.json();

  return { status: res.status, data, elapsed };
}

// ── Test runner ──────────────────────────────────────────────────────

const results = [];
let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    const result = await fn();
    passed++;
    results.push({ name, status: 'PASS', ...result });
    console.log(`  ✓ ${name} (${result.elapsed}ms)${result.provider ? ` [${result.provider}]` : ''}`);
  } catch (err) {
    failed++;
    results.push({ name, status: 'FAIL', error: err.message });
    console.log(`  ✗ ${name} — ${err.message}`);
  }
}

function assertStatus(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label}: expected HTTP ${expected}, got ${actual}`);
}

// ═══════════════════════════════════════════════════════════════════════
// RUN TESTS
// ═══════════════════════════════════════════════════════════════════════

console.log(`\n  AI Engine Smoke Test`);
console.log(`  Target: ${BASE_URL}`);
console.log(`  Time:   ${new Date().toISOString()}\n`);

// ── 1. Health ────────────────────────────────────────────────────────

await test('GET /health', async () => {
  const { status, data, elapsed } = await get('/health', false);
  assertStatus(status, 200, '/health');
  validateHealthResponse(data);
  return { elapsed, healthy: data.healthy };
});

// ── 2. Discovery ─────────────────────────────────────────────────────

await test('GET /ai/capabilities', async () => {
  const { status, data, elapsed } = await get('/ai/capabilities');
  assertStatus(status, 200, '/ai/capabilities');
  validateCapabilitiesResponse(data);
  const enabled = data.capabilities.filter(c => c.enabled).length;
  return { elapsed, enabled: `${enabled}/${data.capabilities.length}` };
});

await test('GET /ai/providers', async () => {
  const { status, data, elapsed } = await get('/ai/providers');
  assertStatus(status, 200, '/ai/providers');
  validateProvidersResponse(data);
  const available = Object.values(data).filter(p => p.available).length;
  return { elapsed, available: `${available}/${Object.keys(data).length}` };
});

await test('GET /ai/usage', async () => {
  const { status, data, elapsed } = await get('/ai/usage');
  assertStatus(status, 200, '/ai/usage');
  return { elapsed };
});

// ── 3. Capabilities ──────────────────────────────────────────────────

await test('POST /ai/intent-classify', async () => {
  const { status, data, elapsed } = await post('/ai/intent-classify', {
    keywords: ['best crm software', 'what is seo'],
    context: { industry: 'SaaS' }
  });
  assertStatus(status, 200, '/ai/intent-classify');
  validateIntentClassifyResponse(data);
  return { elapsed, provider: data.metadata.provider, cost: data.metadata.cost };
});

await test('POST /ai/anomaly-diagnose', async () => {
  const { status, data, elapsed } = await post('/ai/anomaly-diagnose', anomalyDiagnosePayloads.minimal);
  assertStatus(status, 200, '/ai/anomaly-diagnose');
  validateAnomalyDiagnoseResponse(data);
  return { elapsed, provider: data.metadata.provider };
});

await test('POST /ai/embedding-cluster', async () => {
  const { status, data, elapsed } = await post('/ai/embedding-cluster', embeddingClusterPayloads.minimal);
  assertStatus(status, 200, '/ai/embedding-cluster');
  validateEmbeddingClusterResponse(data);
  return { elapsed, clusters: data.stats.clusterCount };
});

await test('POST /ai/chat', async () => {
  const { status, data, elapsed } = await post('/ai/chat', chatPayloads.full);
  assertStatus(status, 200, '/ai/chat');
  validateChatResponse(data);
  return { elapsed, provider: data.metadata.provider, responseLength: data.response.length };
});

await test('POST /ai/content-rewrite', async () => {
  const { status, data, elapsed } = await post('/ai/content-rewrite', contentRewritePayloads.minimal);
  assertStatus(status, 200, '/ai/content-rewrite');
  validateContentRewriteResponse(data);
  return { elapsed, provider: data.metadata.provider };
});

await test('POST /ai/refine-recs', async () => {
  const { status, data, elapsed } = await post('/ai/refine-recs', refineRecsPayloads.minimal);
  assertStatus(status, 200, '/ai/refine-recs');
  validateRefineRecsResponse(data);
  return { elapsed, provider: data.metadata.provider, passes: data.metadata.passes };
});

await test('POST /ai/smart-forecast', async () => {
  const { status, data, elapsed } = await post('/ai/smart-forecast', smartForecastPayloads.minimal);
  assertStatus(status, 200, '/ai/smart-forecast');
  validateSmartForecastResponse(data);
  return { elapsed, provider: data.metadata.provider };
});

// ── 4. Auth edge cases ───────────────────────────────────────────────

await test('Rejects unauthenticated /ai/* requests', async () => {
  const { status, elapsed } = await get('/ai/capabilities', false);
  if (status !== 401) throw new Error(`Expected 401, got ${status}`);
  return { elapsed };
});

// ═══════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════

const totalElapsed = results.reduce((s, r) => s + (r.elapsed || 0), 0);

console.log(`\n  ─────────────────────────────────────`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log(`  Total time: ${(totalElapsed / 1000).toFixed(1)}s`);
console.log(`  ─────────────────────────────────────\n`);

if (failed > 0) {
  console.log('  FAILED TESTS:');
  for (const r of results.filter(r => r.status === 'FAIL')) {
    console.log(`    ✗ ${r.name}: ${r.error}`);
  }
  console.log('');
  process.exit(1);
}

process.exit(0);
