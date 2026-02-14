/**
 * Capability: Batch Analysis
 *
 * Runs multiple AI capabilities in a single request for efficiency.
 * Useful for cron jobs and bulk processing.
 */

import { createLogger } from '../lib/framework-shims.mjs';

const logger = createLogger('ai-batch');

export async function batchAnalyze(requests, env) {
  if (!Array.isArray(requests) || requests.length === 0) {
    return {
      _input: { requestCount: 0, capabilities: [] },
      results: {},
      errors: [{ requestIndex: -1, capability: null, error: 'requests must be a non-empty array' }],
      summary: { totalRequests: 0, successful: 0, failed: 1 }
    };
  }

  if (requests.length > 10) {
    return {
      _input: { requestCount: requests.length, capabilities: requests.map(r => r.capability) },
      results: {},
      errors: [{ requestIndex: -1, capability: null, error: 'Maximum 10 requests per batch' }],
      summary: { totalRequests: requests.length, successful: 0, failed: requests.length }
    };
  }

  // Deep validation: check payload sizes and structure
  const MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB per payload
  const MAX_TOTAL_SIZE = 5 * 1024 * 1024; // 5MB total
  let totalSize = 0;

  for (let i = 0; i < requests.length; i++) {
    const req = requests[i];
    const payloadSize = JSON.stringify(req).length;

    if (payloadSize > MAX_PAYLOAD_SIZE) {
      return {
        _input: { requestCount: requests.length, capabilities: requests.map(r => r.capability) },
        results: {},
        errors: [{ requestIndex: i, capability: req.capability, error: `Request ${i}: payload too large (${payloadSize} bytes > ${MAX_PAYLOAD_SIZE})` }],
        summary: { totalRequests: requests.length, successful: 0, failed: requests.length }
      };
    }

    totalSize += payloadSize;

    if (totalSize > MAX_TOTAL_SIZE) {
      return {
        _input: { requestCount: requests.length, capabilities: requests.map(r => r.capability) },
        results: {},
        errors: [{ requestIndex: i, capability: req.capability, error: `Total batch size too large (${totalSize} bytes > ${MAX_TOTAL_SIZE})` }],
        summary: { totalRequests: requests.length, successful: 0, failed: requests.length }
      };
    }

    if (!req.capability || typeof req.capability !== 'string') {
      return {
        _input: { requestCount: requests.length, capabilities: requests.map(r => r.capability) },
        results: {},
        errors: [{ requestIndex: i, capability: req.capability, error: `Request ${i}: invalid or missing capability` }],
        summary: { totalRequests: requests.length, successful: 0, failed: requests.length }
      };
    }

    if (!req.payload || typeof req.payload !== 'object') {
      return {
        _input: { requestCount: requests.length, capabilities: requests.map(r => r.capability) },
        results: {},
        errors: [{ requestIndex: i, capability: req.capability, error: `Request ${i}: invalid or missing payload` }],
        summary: { totalRequests: requests.length, successful: 0, failed: requests.length }
      };
    }

    // Validate capability is known
    const validCapabilities = [
      'intent-classify', 'anomaly-diagnose', 'embedding-cluster', 'chat',
      'content-rewrite', 'refine-recs', 'smart-forecast', 'cannibalization-detect',
      'content-gaps', 'page-score', 'site-health-pulse'
    ];

    if (!validCapabilities.includes(req.capability)) {
      return {
        _input: { requestCount: requests.length, capabilities: requests.map(r => r.capability) },
        results: {},
        errors: [{ requestIndex: i, capability: req.capability, error: `Request ${i}: unknown capability '${req.capability}'` }],
        summary: { totalRequests: requests.length, successful: 0, failed: requests.length }
      };
    }
  }

  const results = {};
  const errors = [];

  // Process requests with concurrency limit to prevent resource exhaustion
  const CONCURRENCY_LIMIT = 3;
  const batches = [];
  for (let i = 0; i < requests.length; i += CONCURRENCY_LIMIT) {
    batches.push(requests.slice(i, i + CONCURRENCY_LIMIT));
  }

  for (const batch of batches) {
    const batchPromises = batch.map(async (req, index) => {
      const globalIndex = requests.indexOf(req);
      try {
        const { capability, payload } = req;

        // Import the appropriate capability function
        let capabilityFunction;
        switch (capability) {
        case 'intent-classify':
          const { classifyIntentBatch } = await import('./intent-classifier.mjs');
          capabilityFunction = classifyIntentBatch;
          break;
        case 'anomaly-diagnose':
          const { diagnoseAnomalies } = await import('./anomaly-diagnosis.mjs');
          capabilityFunction = diagnoseAnomalies;
          break;
        case 'embedding-cluster':
          const { clusterByEmbeddings } = await import('./embedding-clusters.mjs');
          capabilityFunction = clusterByEmbeddings;
          break;
        case 'chat':
          const { conversationalAi } = await import('./conversational-ai.mjs');
          capabilityFunction = conversationalAi;
          break;
        case 'content-rewrite':
          const { contentRewrites } = await import('./content-rewrites.mjs');
          capabilityFunction = contentRewrites;
          break;
        case 'refine-recs':
          const { refineRecommendations } = await import('./recommendation-refiner.mjs');
          capabilityFunction = refineRecommendations;
          break;
        case 'smart-forecast':
          const { smartForecast } = await import('./smart-forecasting.mjs');
          capabilityFunction = smartForecast;
          break;
        case 'cannibalization-detect':
          const { detectCannibalization } = await import('./cannibalization-detect.mjs');
          capabilityFunction = detectCannibalization;
          break;
        case 'content-gaps':
          const { analyzeContentGaps } = await import('./content-gaps.mjs');
          capabilityFunction = analyzeContentGaps;
          break;
        case 'page-score':
          const { scorePages } = await import('./page-scorer.mjs');
          capabilityFunction = scorePages;
          break;
        case 'site-health-pulse':
          const { siteHealthPulse } = await import('./site-health-pulse.mjs');
          capabilityFunction = siteHealthPulse;
          break;
        default:
          throw new Error(`Unknown capability: ${capability}`);
      }

        const result = await capabilityFunction(payload, env);
        return { index: globalIndex, capability, result };

      } catch (error) {
        logger.error(`Batch request ${globalIndex} failed:`, error);
        return { index: globalIndex, capability: req.capability, error: error.message };
      }
    });

    const batchResults = await Promise.all(batchPromises);

    // Organize results by request index
    for (const item of batchResults) {
      if (item.error) {
        errors.push({ requestIndex: item.index, capability: item.capability, error: item.error });
      } else {
        results[item.index] = {
          capability: item.capability,
          result: item.result
        };
      }
    }
  }

  return {
    _input: {
      requestCount: requests.length,
      capabilities: requests.map(r => r.capability)
    },
    results,
    errors: errors.length > 0 ? errors : undefined,
    summary: {
      totalRequests: requests.length,
      successful: Object.keys(results).length,
      failed: errors.length
    }
  };
}