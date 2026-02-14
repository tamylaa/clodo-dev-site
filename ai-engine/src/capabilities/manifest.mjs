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
    version: '3.0.0',
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
        id: 'eat-assess',
        name: 'E-A-T Assessment',
        description: 'Evaluates content quality for Expertise, Authoritativeness, and Trustworthiness',
        endpoint: '/ai/eat-assess',
        method: 'POST',
        enabled: env.CAPABILITY_EAT !== 'false',
        inputSchema: {
          content: 'string — the content to analyze',
          url: 'string (optional) — page URL',
          author: 'string (optional) — content author',
          publishDate: 'string (optional) — publication date',
          topic: 'string (optional) — content topic'
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
      },
      {
        id: 'cannibalization-detect',
        name: 'Keyword Cannibalization Detection',
        description: 'Detects keyword cannibalization — multiple pages competing for the same query',
        endpoint: '/ai/cannibalization-detect',
        method: 'POST',
        enabled: env.CAPABILITY_CANNIBALIZATION !== 'false',
        inputSchema: {
          pages: 'object[] — [{ url, title, keywords, position, clicks, impressions }]',
          context: 'object (optional) — { siteUrl, industry }'
        }
      },
      {
        id: 'content-gaps',
        name: 'Content Gap Analysis',
        description: 'Identifies keywords competitors rank for that the site doesn\'t — reveals content opportunities',
        endpoint: '/ai/content-gaps',
        method: 'POST',
        enabled: env.CAPABILITY_CONTENT_GAPS !== 'false',
        inputSchema: {
          siteKeywords: 'string[] — keywords the site currently ranks for',
          competitorKeywords: 'object[] — [{ keyword, source, position, volume }]',
          context: 'object (optional) — { siteUrl, industry, targetAudience }'
        }
      },
      {
        id: 'page-score',
        name: 'SEO Page Scorer',
        description: 'Scores pages across technical, content, on-page, and UX dimensions with actionable fixes',
        endpoint: '/ai/page-score',
        method: 'POST',
        enabled: env.CAPABILITY_PAGE_SCORER !== 'false',
        inputSchema: {
          pages: 'object[] — [{ url, title, description, headings, wordCount, loadTimeMs, mobileOptimised, ... }]',
          context: 'object (optional) — { siteUrl, industry }'
        }
      },
      {
        id: 'site-health-pulse',
        name: 'Site Health Pulse',
        description: 'Composite health check — runs page-scorer, cannibalization, content-gaps, and anomaly-diagnosis in parallel, cross-references findings into a unified score + insight chains',
        endpoint: '/ai/site-health-pulse',
        method: 'POST',
        enabled: env.CAPABILITY_SITE_HEALTH !== 'false',
        inputSchema: {
          pages: 'object[] — page data (required)',
          anomalies: 'object[] (optional) — detected anomalies',
          currentData: 'object (optional) — analytics summary',
          siteKeywords: 'string[] (optional) — for content gap analysis',
          competitorKeywords: 'object[] (optional) — competitor keyword data',
          context: 'object (optional) — { siteUrl, industry }'
        }
      },
      {
        id: 'experiment',
        name: 'AI Experimentation & Customization',
        description: 'User-driven experimentation with custom prompts, A/B testing, and hypothesis testing',
        endpoint: '/ai/experiment',
        method: 'POST',
        enabled: env.CAPABILITY_EXPERIMENT !== 'false',
        inputSchema: {
          type: 'string — "custom-prompt", "ab-test", or "hypothesis-test"',
          capability: 'string (optional) — existing capability to test against',
          prompt: 'string — custom prompt to test',
          promptAlt: 'string (optional) — second prompt for A/B testing',
          model: 'string (optional) — specific model to use',
          testData: 'any — data to run the experiment on',
          hypothesis: 'string (optional) — hypothesis statement for testing',
          iterations: 'number (optional, default 5) — number of runs for hypothesis testing'
        }
      },
      {
        id: 'batch-analyze',
        name: 'Batch Analysis',
        description: 'Run multiple AI capabilities in a single request for efficiency',
        endpoint: '/ai/batch-analyze',
        method: 'POST',
        enabled: true, // No specific capability flag
        inputSchema: {
          requests: 'object[] — [{ capability: string, payload: object }] (max 10 requests)'
        }
      }
    ],
    integrations: [
      {
        id: 'google-oauth',
        name: 'Google OAuth Integration',
        description: 'Connect to Google Search Console, Analytics, and PageSpeed Insights',
        endpoints: [
          { path: '/auth/google', method: 'GET', description: 'Initiate OAuth flow' },
          { path: '/auth/google/callback', method: 'GET', description: 'Handle OAuth callback' },
          { path: '/ai/integrations/google', method: 'GET', description: 'Fetch Google data' }
        ],
        inputSchema: {
          siteUrl: 'string — the website URL to connect',
          type: 'string (optional) — "search-console", "analytics", or "pagespeed"'
        }
      },
      {
        id: 'csv-import-export',
        name: 'CSV Import/Export',
        description: 'Import keyword data from CSV files and export results',
        endpoints: [
          { path: '/ai/import/csv', method: 'POST', description: 'Import CSV data' },
          { path: '/ai/export/csv', method: 'GET', description: 'Export results as CSV' }
        ],
        inputSchema: {
          file: 'File — CSV file for import',
          capability: 'string — capability for export',
          data: 'string — JSON data to export'
        }
      },
      {
        id: 'webhooks',
        name: 'Webhook Notifications',
        description: 'Real-time alerts for anomalies and capability completions',
        endpoints: [
          { path: '/ai/webhooks/test', method: 'POST', description: 'Test webhook URL' },
          { path: '/ai/webhooks/register', method: 'POST', description: 'Register webhook' }
        ],
        inputSchema: {
          url: 'string — webhook URL',
          events: 'string[] (optional) — events to subscribe to'
        }
      }
    ]
  };
}
