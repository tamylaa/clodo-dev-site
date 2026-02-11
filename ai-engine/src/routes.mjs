/**
 * Route Registration
 * 
 * Maps API endpoints to capability handlers.
 * Each route validates that its capability is enabled before processing.
 */

import { getCapabilityManifest } from './capabilities/manifest.mjs';
import { classifyIntentBatch } from './capabilities/intent-classifier.mjs';
import { diagnoseAnomalies } from './capabilities/anomaly-diagnosis.mjs';
import { clusterByEmbeddings } from './capabilities/embedding-clusters.mjs';
import { chatWithData } from './capabilities/conversational-ai.mjs';
import { generateRewrites } from './capabilities/content-rewrites.mjs';
import { refineRecommendations } from './capabilities/recommendation-refiner.mjs';
import { smartForecast } from './capabilities/smart-forecasting.mjs';
import { detectCannibalization } from './capabilities/cannibalization-detect.mjs';
import { analyseContentGaps } from './capabilities/content-gaps.mjs';
import { scorePages } from './capabilities/page-scorer.mjs';
import { getProviderStatus } from './providers/ai-provider.mjs';

/**
 * Register all AI capability routes on the router.
 */
export function registerRoutes(router, env, usageTracker) {
  const jsonRes = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });

  const assertCapability = (capVar) => {
    if (env[capVar] === 'false') {
      throw { status: 403, message: `Capability disabled (${capVar})` };
    }
  };

  // ── Discovery endpoints ───────────────────────────────────────────

  router.get('/ai/capabilities', () => jsonRes(getCapabilityManifest(env)));

  router.get('/ai/providers', () => jsonRes(getProviderStatus(env)));

  router.get('/ai/usage', async () => {
    const summary = await usageTracker.getSummary(7);
    return jsonRes(summary);
  });

  // ── Capability routes ─────────────────────────────────────────────

  router.post('/ai/intent-classify', async (req) => {
    assertCapability('CAPABILITY_INTENT');
    const body = await req.json();
    const result = await classifyIntentBatch(body, env);
    await logUsage(usageTracker, 'intent-classify', result);
    return jsonRes(result);
  });

  router.post('/ai/anomaly-diagnose', async (req) => {
    assertCapability('CAPABILITY_ANOMALY');
    const body = await req.json();
    const result = await diagnoseAnomalies(body, env);
    await logUsage(usageTracker, 'anomaly-diagnose', result);
    return jsonRes(result);
  });

  router.post('/ai/embedding-cluster', async (req) => {
    assertCapability('CAPABILITY_EMBEDDINGS');
    const body = await req.json();
    const result = await clusterByEmbeddings(body, env);
    return jsonRes(result);
  });

  router.post('/ai/chat', async (req) => {
    assertCapability('CAPABILITY_CHAT');
    const body = await req.json();
    const result = await chatWithData(body, env);
    await logUsage(usageTracker, 'chat', result);
    return jsonRes(result);
  });

  router.post('/ai/content-rewrite', async (req) => {
    assertCapability('CAPABILITY_REWRITES');
    const body = await req.json();
    const result = await generateRewrites(body, env);
    await logUsage(usageTracker, 'content-rewrite', result);
    return jsonRes(result);
  });

  router.post('/ai/refine-recs', async (req) => {
    assertCapability('CAPABILITY_REFINER');
    const body = await req.json();
    const result = await refineRecommendations(body, env);
    await logUsage(usageTracker, 'refine-recs', result);
    return jsonRes(result);
  });

  router.post('/ai/smart-forecast', async (req) => {
    assertCapability('CAPABILITY_FORECAST');
    const body = await req.json();
    const result = await smartForecast(body, env);
    await logUsage(usageTracker, 'smart-forecast', result);
    return jsonRes(result);
  });

  router.post('/ai/cannibalization-detect', async (req) => {
    assertCapability('CAPABILITY_CANNIBALIZATION');
    const body = await req.json();
    const result = await detectCannibalization(body, env);
    await logUsage(usageTracker, 'cannibalization-detect', result);
    return jsonRes(result);
  });

  router.post('/ai/content-gaps', async (req) => {
    assertCapability('CAPABILITY_CONTENT_GAPS');
    const body = await req.json();
    const result = await analyseContentGaps(body, env);
    await logUsage(usageTracker, 'content-gaps', result);
    return jsonRes(result);
  });

  router.post('/ai/page-score', async (req) => {
    assertCapability('CAPABILITY_PAGE_SCORER');
    const body = await req.json();
    const result = await scorePages(body, env);
    await logUsage(usageTracker, 'page-score', result);
    return jsonRes(result);
  });
}

/**
 * Log usage metrics from a capability result.
 */
async function logUsage(usageTracker, capability, result) {
  const meta = result.metadata || {};
  await usageTracker.logRequest({
    capability,
    provider: meta.provider,
    model: meta.model,
    tokensUsed: meta.tokensUsed,
    cost: meta.cost,
    durationMs: meta.durationMs
  });
}
