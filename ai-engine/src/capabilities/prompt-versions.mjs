/**
 * Prompt Version Management
 *
 * Tracks prompt template versions per capability for A/B testing
 * and rollback. Each capability can have a "live" version and
 * experimental versions. Results can be correlated with feedback
 * to determine which prompts perform best.
 *
 * Storage: KV under `prompt-version:{capability}` keys.
 */

import { createLogger } from '../lib/framework-shims.mjs';

const logger = createLogger('prompt-versions');

// ── In-memory prompt version registry ────────────────────────────────

const PROMPT_VERSIONS = {
  'intent-classify': {
    current: 'v2.0',
    versions: {
      'v1.0': { description: 'Basic intent classification', date: '2025-01-15' },
      'v2.0': { description: 'Enhanced with heuristic pre-classification + few-shot examples', date: '2025-06-01' }
    }
  },
  'anomaly-diagnosis': {
    current: 'v2.0',
    versions: {
      'v1.0': { description: 'Simple anomaly diagnosis', date: '2025-01-15' },
      'v2.0': { description: 'Z-score scoring + pattern library + enriched prompts', date: '2025-06-01' }
    }
  },
  'embedding-cluster': {
    current: 'v2.0',
    versions: {
      'v1.0': { description: 'Basic agglomerative clustering', date: '2025-01-15' },
      'v2.0': { description: 'Silhouette scoring + LLM labeling + hub mapping', date: '2025-06-01' }
    }
  },
  'chat': {
    current: 'v2.0',
    versions: {
      'v1.0': { description: 'Basic conversational AI', date: '2025-01-15' },
      'v2.0': { description: 'Citation verification + hallucination guard + KV memory', date: '2025-06-01' }
    }
  },
  'content-rewrite': {
    current: 'v2.0',
    versions: {
      'v1.0': { description: 'Basic title/description rewrites', date: '2025-01-15' },
      'v2.0': { description: 'Competitor analysis + CTR prediction + A/B variants', date: '2025-06-01' }
    }
  },
  'recommendation-refine': {
    current: 'v2.0',
    versions: {
      'v1.0': { description: 'Basic recommendation refinement', date: '2025-01-15' },
      'v2.0': { description: 'Few-shot examples + structured output', date: '2025-06-01' }
    }
  },
  'smart-forecast': {
    current: 'v2.0',
    versions: {
      'v1.0': { description: 'LLM-only forecasting', date: '2025-01-15' },
      'v2.0': { description: 'Dual output (statistical + LLM) + accuracy tracking', date: '2025-06-01' }
    }
  },
  'cannibalization-detect': {
    current: 'v1.0',
    versions: {
      'v1.0': { description: 'Deterministic + semantic overlap + LLM analysis', date: '2025-06-01' }
    }
  },
  'content-gaps': {
    current: 'v1.0',
    versions: {
      'v1.0': { description: 'Gap detection + embedding clustering + content briefs', date: '2025-06-01' }
    }
  },
  'page-scorer': {
    current: 'v1.0',
    versions: {
      'v1.0': { description: 'Multi-factor page scoring with LLM recommendations', date: '2025-06-01' }
    }
  }
};

/**
 * Get the current prompt version for a capability.
 */
export function getPromptVersion(capability) {
  const config = PROMPT_VERSIONS[capability];
  if (!config) return { version: 'unknown', description: 'Not tracked' };
  return {
    version: config.current,
    ...(config.versions[config.current] || {})
  };
}

/**
 * Get all prompt versions for a capability.
 */
export function getPromptHistory(capability) {
  const config = PROMPT_VERSIONS[capability];
  if (!config) return null;
  return {
    capability,
    current: config.current,
    versions: Object.entries(config.versions).map(([version, info]) => ({
      version,
      ...info,
      isCurrent: version === config.current
    }))
  };
}

/**
 * Get a summary of all prompt versions across all capabilities.
 */
export function getAllPromptVersions() {
  return Object.entries(PROMPT_VERSIONS).map(([capability, config]) => ({
    capability,
    currentVersion: config.current,
    totalVersions: Object.keys(config.versions).length,
    lastUpdate: config.versions[config.current]?.date || 'unknown'
  }));
}

/**
 * Record a prompt experiment result to KV for analysis.
 */
export async function recordExperimentResult(env, {
  capability,
  promptVersion,
  requestId,
  durationMs,
  parseMethod,
  schemaValid,
  userRating
}) {
  if (!env.KV_AI) return;

  const dateKey = new Date().toISOString().slice(0, 10);
  const key = `prompt-experiment:${capability}:${dateKey}`;

  const existing = await env.KV_AI.get(key, { type: 'json' }) || { results: [] };
  existing.results.push({
    version: promptVersion,
    requestId,
    durationMs,
    parseMethod,
    schemaValid,
    userRating,
    timestamp: new Date().toISOString()
  });

  // Keep only last 100 results per day per capability
  if (existing.results.length > 100) {
    existing.results = existing.results.slice(-100);
  }

  await env.KV_AI.put(key, JSON.stringify(existing), {
    expirationTtl: 30 * 86400 // 30 days
  });

  logger.info(`Experiment result recorded: ${capability} ${promptVersion}`, { requestId });
}
