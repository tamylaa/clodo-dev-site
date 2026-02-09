/**
 * Capability Manifest
 * 
 * Self-describing capability discovery endpoint.
 * Now includes multi-model provider info.
 */

import { getProviderStatus } from '../providers/ai-provider.mjs';

export function getCapabilityManifest(env) {
  const providers = getProviderStatus(env);
  const availableProviders = Object.entries(providers)
    .filter(([, p]) => p.available)
    .map(([id, p]) => ({ id, name: p.name, tier: p.tier }));

  return {
    engine: 'ai-engine',
    version: '2.0.0',
    providers: availableProviders,
    capabilities: [
      {
        id: 'intent-classify',
        name: 'AI Intent Classifier',
        description: 'LLM-powered keyword intent classification — replaces regex heuristics',
        endpoint: '/ai/intent-classify',
        method: 'POST',
        enabled: env.CAPABILITY_INTENT !== 'false',
        inputSchema: {
          keywords: 'string[] — list of search queries to classify',
          context: 'object (optional) — { siteUrl, industry, targetAudience }'
        }
      },
      {
        id: 'anomaly-diagnose',
        name: 'Anomaly Root-Cause Diagnosis',
        description: 'AI-powered root-cause analysis for sudden metric changes',
        endpoint: '/ai/anomaly-diagnose',
        method: 'POST',
        enabled: env.CAPABILITY_ANOMALY !== 'false',
        inputSchema: {
          anomalies: 'object[] — detected anomalies with type, severity, metrics',
          currentData: 'object — summary metrics for context'
        }
      },
      {
        id: 'embedding-cluster',
        name: 'Semantic Keyword Clustering',
        description: 'Groups keywords by meaning using vector embeddings',
        endpoint: '/ai/embedding-cluster',
        method: 'POST',
        enabled: env.CAPABILITY_EMBEDDINGS !== 'false',
        inputSchema: {
          keywords: 'object[] — [{ query, clicks, impressions, ctr, position }]',
          minSimilarity: 'number (0-1, default 0.7)'
        }
      },
      {
        id: 'chat',
        name: 'Conversational Analytics AI',
        description: 'Ask questions about your SEO data in plain English',
        endpoint: '/ai/chat',
        method: 'POST',
        enabled: env.CAPABILITY_CHAT !== 'false',
        inputSchema: {
          message: 'string — the user question',
          analyticsContext: 'object — current analytics summary data',
          history: 'object[] (optional) — previous conversation turns'
        }
      },
      {
        id: 'content-rewrite',
        name: 'Content Rewrite Suggestions',
        description: 'AI generates specific title, meta, and H1 rewrites for target keywords',
        endpoint: '/ai/content-rewrite',
        method: 'POST',
        enabled: env.CAPABILITY_REWRITES !== 'false',
        inputSchema: {
          pages: 'object[] — [{ url, title, description, h1, targetKeywords, position, ctr }]'
        }
      },
      {
        id: 'refine-recs',
        name: 'Recommendation Refiner',
        description: 'Two-pass AI refinement: critiques then rewrites recommendations',
        endpoint: '/ai/refine-recs',
        method: 'POST',
        enabled: env.CAPABILITY_REFINER !== 'false',
        inputSchema: {
          recommendations: 'object[] — the original AI recommendations',
          analyticsContext: 'object — current analytics data for evidence'
        }
      },
      {
        id: 'smart-forecast',
        name: 'Smart Forecasting',
        description: 'Context-aware trend interpretation beyond linear extrapolation',
        endpoint: '/ai/smart-forecast',
        method: 'POST',
        enabled: env.CAPABILITY_FORECAST !== 'false',
        inputSchema: {
          timeSeries: 'object[] — [{ date, impressions, clicks, ctr, position }]',
          forecastDays: 'number (default 14)',
          context: 'string (optional)'
        }
      }
    ]
  };
}
