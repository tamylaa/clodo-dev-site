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
import { siteHealthPulse } from './capabilities/site-health-pulse.mjs';
import { batchAnalyze } from './capabilities/batch-analyze.mjs';
import { getProviderStatus } from './providers/ai-provider.mjs';
import { submitFeedback, getFeedbackSummary } from './capabilities/feedback.mjs';
import { getAllPromptVersions } from './capabilities/prompt-versions.mjs';
import { assessEAT } from './capabilities/eat-assessment.mjs';
import { runExperiment } from './capabilities/experiment.mjs';
import { initiateGoogleOAuth, handleGoogleOAuthCallback, getGoogleData } from './lib/google-integrations.mjs';
import { parseCSV, generateCSV, validateKeywordCSV, convertCSVToKeywords } from './lib/csv-utils.mjs';
import { sendWebhook, sendAnomalyAlert, sendCapabilityAlert, validateWebhookUrl } from './lib/webhook-utils.mjs';

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

  router.get('/ai/quality', async () => {
    const summary = await usageTracker.getQualitySummary(7);
    return jsonRes(summary);
  });

  router.get('/ai/prompt-versions', () => jsonRes(getAllPromptVersions()));

  router.post('/ai/feedback', async (req) => {
    const body = await req.json();
    const result = await submitFeedback(body, env);
    return jsonRes(result, result.success ? 200 : 400);
  });

  router.get('/ai/feedback/summary', async () => {
    const summary = await getFeedbackSummary(env, 7);
    return jsonRes(summary);
  });

  // ── Integration routes ─────────────────────────────────────────────

  router.get('/auth/google', async (req) => {
    const url = new URL(req.url);
    const siteUrl = url.searchParams.get('siteUrl');
    if (!siteUrl) return jsonRes({ error: 'siteUrl parameter required' }, 400);

    const result = await initiateGoogleOAuth(siteUrl);
    return jsonRes(result);
  });

  router.get('/auth/google/callback', async (req) => {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code || !state) return jsonRes({ error: 'Missing code or state' }, 400);

    const result = await handleGoogleOAuthCallback(code, state);
    return jsonRes(result);
  });

  router.get('/ai/integrations/google', async (req) => {
    const url = new URL(req.url);
    const siteUrl = url.searchParams.get('siteUrl');
    const dataType = url.searchParams.get('type'); // 'search-console', 'analytics', 'pagespeed'

    if (!siteUrl || !dataType) {
      return jsonRes({ error: 'siteUrl and type parameters required' }, 400);
    }

    const result = await getGoogleData(siteUrl, dataType, env);
    return jsonRes(result);
  });

  router.post('/ai/import/csv', async (req) => {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return jsonRes({ error: 'CSV file required' }, 400);
    }

    const csvText = await file.text();
    const parseResult = parseCSV(csvText);

    if (!parseResult.success) {
      return jsonRes({ error: `CSV parsing failed: ${parseResult.error}` }, 400);
    }

    const validation = validateKeywordCSV(parseResult.data);
    if (!validation.valid) {
      return jsonRes({ error: `Invalid CSV format: ${validation.error}` }, 400);
    }

    const keywords = convertCSVToKeywords(parseResult.data);
    return jsonRes({
      success: true,
      imported: keywords.length,
      data: keywords
    });
  });

  router.get('/ai/export/csv', async (req) => {
    const url = new URL(req.url);
    const capability = url.searchParams.get('capability');
    const data = url.searchParams.get('data');

    if (!capability || !data) {
      return jsonRes({ error: 'capability and data parameters required' }, 400);
    }

    let parsedData;
    try {
      parsedData = JSON.parse(decodeURIComponent(data));
    } catch {
      return jsonRes({ error: 'Invalid data format' }, 400);
    }

    // Define columns based on capability
    const columnMappings = {
      'intent-classify': ['query', 'intent', 'confidence', 'category'],
      'anomaly-diagnose': ['type', 'severity', 'description', 'recommendation'],
      'content-rewrite': ['url', 'title', 'metaDescription', 'recommendations']
    };

    const columns = columnMappings[capability];
    if (!columns) {
      return jsonRes({ error: 'Unsupported capability for export' }, 400);
    }

    const csvResult = generateCSV(parsedData, columns);
    if (!csvResult.success) {
      return jsonRes({ error: `CSV generation failed: ${csvResult.error}` }, 500);
    }

    return new Response(csvResult.csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${capability}-export.csv"`
      }
    });
  });

  router.post('/ai/webhooks/test', async (req) => {
    const body = await req.json();
    const { url } = body;

    if (!url || !validateWebhookUrl(url)) {
      return jsonRes({ error: 'Valid webhook URL required' }, 400);
    }

    const result = await sendWebhook(url, {
      event: 'test',
      message: 'AI Engine webhook test'
    });

    return jsonRes(result);
  });

  router.post('/ai/webhooks/register', async (req) => {
    const body = await req.json();
    const { url, events } = body;

    if (!url || !validateWebhookUrl(url)) {
      return jsonRes({ error: 'Valid webhook URL required' }, 400);
    }

    // In production, store webhook registrations in KV
    // For now, just validate and return success
    return jsonRes({
      success: true,
      webhookId: `webhook_${Date.now()}`,
      url,
      events: events || ['anomaly_detected', 'capability_completed']
    });
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
    await logUsage(usageTracker, 'embedding-cluster', result);
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

  router.post('/ai/eat-assess', async (req) => {
    assertCapability('CAPABILITY_EAT');
    const body = await req.json();
    const result = await assessEAT(body, env);
    await logUsage(usageTracker, 'eat-assess', result);
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
    return jsonRes(result, result.error ? 422 : 200);
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

  router.post('/ai/site-health-pulse', async (req) => {
    assertCapability('CAPABILITY_SITE_HEALTH');
    const body = await req.json();
    const result = await siteHealthPulse(body, env);
    await logUsage(usageTracker, 'site-health-pulse', result);
    return jsonRes(result);
  });

  router.post('/ai/experiment', async (req) => {
    assertCapability('CAPABILITY_EXPERIMENT');
    const body = await req.json();
    const result = await runExperiment(body, env);
    await logUsage(usageTracker, 'experiment', result);
    return jsonRes(result);
  });

  router.post('/ai/batch-analyze', async (req) => {
    // Batch analysis doesn't have a specific capability flag, but requires auth
    const body = await req.json();
    const result = await batchAnalyze(body, env);
    await logUsage(usageTracker, 'batch-analyze', result);
    return jsonRes(result, (result.errors && Object.keys(result.results || {}).length > 0) ? 207 : 200); // 207 Multi-Status for partial failures
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

  // Track quality if parse metadata is available
  const pq = meta.parseQuality || {};
  if (pq.method) {
    await usageTracker.trackQuality({
      capability,
      parseMethod: pq.method,
      schemaValid: pq.schemaValid ?? false,
      fallbackUsed: pq.fallbackUsed ?? false,
      durationMs: meta.durationMs
    });
  }
}
