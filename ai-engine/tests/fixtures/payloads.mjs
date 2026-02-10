/**
 * Test Fixtures — Realistic Payloads for Every AI Engine Capability
 * 
 * These fixtures mirror the exact shapes accepted by each endpoint.
 * Use them for unit tests, integration tests, and live smoke tests.
 */

// ═══════════════════════════════════════════════════════════════════════
// 1. POST /ai/intent-classify
// ═══════════════════════════════════════════════════════════════════════

export const intentClassifyPayloads = {
  /** Minimal valid request */
  minimal: {
    keywords: ['best crm software']
  },

  /** Full request with context */
  full: {
    keywords: [
      'best crm software 2026',
      'hubspot vs salesforce',
      'what is a crm',
      'buy salesforce license',
      'crm login page',
      'how to set up crm for small business',
      'crm pricing comparison',
      'free crm download'
    ],
    context: {
      siteUrl: 'https://example.com',
      industry: 'SaaS',
      targetAudience: 'small business owners'
    }
  },

  /** Edge case: empty keywords */
  empty: {
    keywords: []
  },

  /** Large batch (> 50 triggers batching) */
  largeBatch: {
    keywords: Array.from({ length: 75 }, (_, i) => `keyword ${i + 1} for seo analysis`)
  }
};

export const intentClassifyExpectedShape = {
  classifications: [{
    query: 'string',
    intent: 'transactional|commercial|informational|navigational',
    confidence: 'number (0-1)',
    businessValue: 'number (1-10)',
    contentType: 'string (e.g. landing-page, guide)',
    reasoning: 'string',
    source: 'ai-engine | ai-engine-fallback'
  }],
  metadata: {
    provider: 'string (claude|openai|gemini|...)',
    keywordsProcessed: 'number',
    batches: 'number',
    tokensUsed: { input: 'number', output: 'number' },
    cost: 'number (USD)'
  }
};


// ═══════════════════════════════════════════════════════════════════════
// 2. POST /ai/anomaly-diagnose
// ═══════════════════════════════════════════════════════════════════════

export const anomalyDiagnosePayloads = {
  minimal: {
    anomalies: [{
      type: 'position-drop',
      severity: 'critical',
      description: 'Average position dropped from 8.2 to 14.5 in 48h'
    }]
  },

  full: {
    anomalies: [
      {
        id: 'anom-1',
        type: 'position-drop',
        severity: 'critical',
        description: 'Position dropped sharply for top keywords',
        keyword: 'best crm software',
        previousValue: 4.2,
        currentValue: 18.7,
        changePercent: -345
      },
      {
        id: 'anom-2',
        type: 'ctr-drop',
        severity: 'warning',
        description: 'CTR declined despite stable impressions',
        page: '/blog/crm-guide',
        previousValue: 0.072,
        currentValue: 0.031,
        magnitude: '-57%'
      },
      {
        id: 'anom-3',
        type: 'impression-spike',
        severity: 'info',
        description: 'Sudden 300% increase in impressions for brand terms',
        keyword: 'example crm',
        previousValue: 1200,
        currentValue: 4800
      }
    ],
    currentData: {
      summary: {
        totalImpressions: 245000,
        totalClicks: 8750,
        avgCTR: 0.0357,
        avgPosition: 12.4
      },
      period: {
        start: '2026-01-27',
        end: '2026-02-09'
      }
    }
  },

  empty: {
    anomalies: []
  }
};

export const anomalyDiagnoseExpectedShape = {
  diagnoses: [{
    anomalyId: 'string',
    likelyCause: 'string',
    confidence: 'number (0-1)',
    immediateAction: 'string',
    investigationSteps: ['string'],
    isRealProblem: 'boolean',
    severity: 'critical|warning|info',
    source: 'ai-engine | ai-engine-fallback'
  }],
  metadata: {
    provider: 'string',
    model: 'string',
    anomaliesProcessed: 'number',
    tokensUsed: { input: 'number', output: 'number' },
    cost: 'object',
    durationMs: 'number'
  }
};


// ═══════════════════════════════════════════════════════════════════════
// 3. POST /ai/embedding-cluster
// ═══════════════════════════════════════════════════════════════════════

export const embeddingClusterPayloads = {
  /** Simple string array */
  minimal: {
    keywords: ['crm software', 'crm tools', 'customer relationship management']
  },

  /** Full objects with metrics */
  full: {
    keywords: [
      { query: 'best crm software', clicks: 320, impressions: 8400, ctr: 0.038, position: 6.2 },
      { query: 'top crm tools', clicks: 180, impressions: 5200, ctr: 0.035, position: 7.1 },
      { query: 'crm for small business', clicks: 450, impressions: 12000, ctr: 0.038, position: 4.8 },
      { query: 'how to choose a crm', clicks: 90, impressions: 3100, ctr: 0.029, position: 11.3 },
      { query: 'email marketing automation', clicks: 210, impressions: 6700, ctr: 0.031, position: 8.5 },
      { query: 'marketing automation tools', clicks: 150, impressions: 4900, ctr: 0.031, position: 9.2 },
      { query: 'salesforce alternatives', clicks: 280, impressions: 7800, ctr: 0.036, position: 5.4 },
      { query: 'hubspot pricing', clicks: 340, impressions: 9200, ctr: 0.037, position: 5.1 }
    ],
    minSimilarity: 0.75
  },

  /** Too few to cluster */
  tooFew: {
    keywords: ['only one keyword']
  }
};

export const embeddingClusterExpectedShape = {
  clusters: [{
    label: 'string (most prominent keyword)',
    keywords: ['string'],
    keywordIndices: ['number'],
    size: 'number',
    totalImpressions: 'number',
    totalClicks: 'number',
    avgPosition: 'number',
    avgCTR: 'number'
  }],
  orphans: ['object | { query: string }'],
  stats: {
    total: 'number',
    clustered: 'number',
    orphaned: 'number',
    clusterCount: 'number',
    embeddingModel: 'string'
  }
};


// ═══════════════════════════════════════════════════════════════════════
// 4. POST /ai/chat
// ═══════════════════════════════════════════════════════════════════════

export const chatPayloads = {
  minimal: {
    message: 'What are my top performing keywords?'
  },

  full: {
    message: 'Why did my CTR drop last week?',
    analyticsContext: {
      summary: {
        totalImpressions: 245000,
        totalClicks: 8750,
        avgCTR: 0.0357,
        avgPosition: 12.4
      },
      period: { start: '2026-01-27', end: '2026-02-09' },
      topQueries: [
        { query: 'best crm software', position: 4.2, ctr: 0.068, impressions: 8400, clicks: 571 },
        { query: 'crm for small business', position: 6.1, ctr: 0.042, impressions: 12000, clicks: 504 },
        { query: 'free crm tools', position: 8.8, ctr: 0.025, impressions: 5600, clicks: 140 }
      ],
      topPages: [
        { page: '/blog/best-crm-guide', position: 5.1, ctr: 0.055, impressions: 18000 },
        { page: '/pricing', position: 3.2, ctr: 0.082, impressions: 9200 }
      ],
      anomalies: [
        { severity: 'warning', type: 'ctr-drop', description: 'CTR declined 15% week-over-week' }
      ]
    },
    history: [
      { role: 'user', content: 'Show me my site overview' },
      { role: 'assistant', content: 'Your site has 245K impressions and 8.75K clicks...' }
    ]
  },

  noMessage: {
    message: ''
  }
};

export const chatExpectedShape = {
  response: 'string (natural language answer)',
  metadata: {
    provider: 'string',
    model: 'string',
    tokensUsed: { input: 'number', output: 'number' },
    cost: 'object',
    durationMs: 'number',
    conversationLength: 'number'
  }
};


// ═══════════════════════════════════════════════════════════════════════
// 5. POST /ai/content-rewrite
// ═══════════════════════════════════════════════════════════════════════

export const contentRewritePayloads = {
  minimal: {
    pages: [{
      url: '/blog/crm-guide',
      title: 'CRM Guide',
      targetKeywords: ['best crm software']
    }]
  },

  full: {
    pages: [
      {
        url: '/blog/best-crm-guide',
        title: 'Best CRM Software Guide',
        description: 'A guide to CRM software.',
        h1: 'CRM Software Guide',
        targetKeywords: ['best crm software 2026', 'top crm tools'],
        position: 6.2,
        ctr: 0.038,
        intent: 'commercial'
      },
      {
        url: '/blog/email-marketing-tips',
        title: 'Email Marketing Tips',
        description: 'Tips for email marketing.',
        h1: 'Email Marketing Tips for Beginners',
        targetKeywords: [
          { query: 'email marketing tips', clicks: 120 },
          { query: 'how to do email marketing' }
        ],
        position: 11.5,
        ctr: 0.021,
        intent: 'informational'
      }
    ]
  },

  empty: {
    pages: []
  }
};

export const contentRewriteExpectedShape = {
  rewrites: [{
    url: 'string',
    title: { current: 'string', suggested: 'string', reasoning: 'string' },
    description: { current: 'string', suggested: 'string', reasoning: 'string' },
    h1: { current: 'string', suggested: 'string', reasoning: 'string' },
    estimatedCTRLift: 'string',
    source: 'ai-engine | ai-engine-fallback'
  }],
  metadata: {
    provider: 'string',
    model: 'string',
    pagesProcessed: 'number',
    tokensUsed: 'object',
    cost: 'object',
    durationMs: 'number'
  }
};


// ═══════════════════════════════════════════════════════════════════════
// 6. POST /ai/refine-recs
// ═══════════════════════════════════════════════════════════════════════

export const refineRecsPayloads = {
  minimal: {
    recommendations: [{
      title: 'Improve page titles',
      description: 'Add target keywords to page titles for better rankings.'
    }]
  },

  full: {
    recommendations: [
      {
        id: 'rec-1',
        priority: 'high',
        category: 'on-page',
        title: 'Optimize title tags for top 10 keywords',
        description: 'Several high-traffic keywords have suboptimal title tags. Update them to include primary keyword and power words.',
        affectedPages: ['/blog/crm-guide', '/pricing'],
        affectedKeywords: ['best crm software', 'crm pricing'],
        projectedImpact: { metric: 'CTR', currentValue: 0.038, projectedValue: 0.055, confidence: 0.7 },
        specificChange: 'Add year and power words to title tags'
      },
      {
        id: 'rec-2',
        priority: 'medium',
        category: 'content',
        title: 'Create comparison content',
        description: 'Missing content for high-intent commercial keywords.',
        affectedPages: [],
        affectedKeywords: ['hubspot vs salesforce', 'crm comparison'],
        projectedImpact: { metric: 'traffic', currentValue: 0, projectedValue: 500, confidence: 0.5 }
      }
    ],
    analyticsContext: {
      summary: {
        totalImpressions: 245000,
        totalClicks: 8750,
        avgCTR: 0.0357,
        avgPosition: 12.4
      }
    }
  },

  empty: {
    recommendations: []
  }
};

export const refineRecsExpectedShape = {
  refined: [{
    id: 'string',
    priority: 'critical|high|medium|low',
    category: 'string',
    title: 'string',
    description: 'string',
    affectedPages: ['string'],
    affectedKeywords: ['string'],
    specificChange: 'string',
    implementation_steps: ['string'],
    projectedImpact: { metric: 'string', currentValue: 'number', projectedValue: 'number', confidence: 'number' },
    evidence: 'string',
    refinementNotes: 'string',
    refinedBy: 'ai-engine',
    refinedAt: 'ISO 8601 timestamp'
  }],
  critique: 'string (truncated to 2000 chars)',
  metadata: {
    provider: 'string (critique:X / refine:Y)',
    passes: 2,
    originalCount: 'number',
    refinedCount: 'number',
    tokensUsed: { critique: 'object', refine: 'object' },
    cost: { critique: 'object', refine: 'object', total: 'number' },
    totalDurationMs: 'number'
  }
};


// ═══════════════════════════════════════════════════════════════════════
// 7. POST /ai/smart-forecast
// ═══════════════════════════════════════════════════════════════════════

export const smartForecastPayloads = {
  /** Minimum viable (7 data points) */
  minimal: {
    timeSeries: Array.from({ length: 7 }, (_, i) => ({
      date: `2026-02-0${i + 1}`,
      impressions: 1000 + Math.floor(Math.random() * 200),
      clicks: 35 + Math.floor(Math.random() * 15),
      ctr: 0.035 + Math.random() * 0.005,
      position: 8 + Math.random() * 2
    }))
  },

  /** 30-day series with realistic trend */
  full: {
    timeSeries: Array.from({ length: 30 }, (_, i) => {
      const date = new Date('2026-01-11');
      date.setDate(date.getDate() + i);
      const trend = 1 + i * 0.02; // gradual upward trend
      const weekday = date.getDay();
      const weekdayFactor = weekday === 0 || weekday === 6 ? 0.7 : 1.0;
      
      return {
        date: date.toISOString().split('T')[0],
        impressions: Math.floor((8000 + i * 100) * weekdayFactor * trend),
        clicks: Math.floor((280 + i * 5) * weekdayFactor * trend),
        ctr: parseFloat((0.035 + i * 0.0003).toFixed(4)),
        position: parseFloat((12.5 - i * 0.1).toFixed(1))
      };
    }),
    forecastDays: 14,
    context: 'Site launched a major content refresh on Jan 20. Google core update rumored for mid-Feb.'
  },

  /** Too few data points */
  tooFew: {
    timeSeries: [
      { date: '2026-02-01', impressions: 1000, clicks: 35 },
      { date: '2026-02-02', impressions: 1100, clicks: 40 }
    ]
  }
};

export const smartForecastExpectedShape = {
  forecast: {
    forecasts: {
      impressions: {
        current: 'number', forecastMid: 'number', forecastLow: 'number', forecastHigh: 'number',
        confidence: 'number (0-1)', reasoning: 'string', trend: 'rising|falling|stable'
      },
      clicks: '(same shape)',
      ctr: '(same shape)',
      position: '(same shape)'
    },
    overallOutlook: 'string (1-paragraph summary)',
    risks: ['string'],
    opportunities: ['string']
  },
  stats: {
    'per-metric': {
      current: 'number', mean: 'number', min: 'number', max: 'number',
      stdDev: 'number', slope: 'number', direction: 'rising|falling|stable',
      weekOverWeek: 'number (%)', dataPoints: 'number'
    }
  },
  metadata: {
    provider: 'string', model: 'string', dataPoints: 'number',
    forecastDays: 'number', tokensUsed: 'object', cost: 'object', durationMs: 'number'
  }
};


// ═══════════════════════════════════════════════════════════════════════
// Discovery Endpoints (GET, no body)
// ═══════════════════════════════════════════════════════════════════════

export const discoveryEndpoints = {
  health: { method: 'GET', path: '/health', auth: false },
  capabilities: { method: 'GET', path: '/ai/capabilities', auth: true },
  providers: { method: 'GET', path: '/ai/providers', auth: true },
  usage: { method: 'GET', path: '/ai/usage', auth: true }
};


// ═══════════════════════════════════════════════════════════════════════
// Full Endpoint Registry (for automated test generation)
// ═══════════════════════════════════════════════════════════════════════

export const endpointRegistry = [
  {
    id: 'intent-classify',
    path: '/ai/intent-classify',
    method: 'POST',
    envToggle: 'CAPABILITY_INTENT',
    payloads: intentClassifyPayloads,
    expectedShape: intentClassifyExpectedShape,
    description: 'LLM-powered keyword intent classification'
  },
  {
    id: 'anomaly-diagnose',
    path: '/ai/anomaly-diagnose',
    method: 'POST',
    envToggle: 'CAPABILITY_ANOMALY',
    payloads: anomalyDiagnosePayloads,
    expectedShape: anomalyDiagnoseExpectedShape,
    description: 'Root-cause diagnosis for metric anomalies'
  },
  {
    id: 'embedding-cluster',
    path: '/ai/embedding-cluster',
    method: 'POST',
    envToggle: 'CAPABILITY_EMBEDDINGS',
    payloads: embeddingClusterPayloads,
    expectedShape: embeddingClusterExpectedShape,
    description: 'Semantic keyword clustering via vector embeddings'
  },
  {
    id: 'chat',
    path: '/ai/chat',
    method: 'POST',
    envToggle: 'CAPABILITY_CHAT',
    payloads: chatPayloads,
    expectedShape: chatExpectedShape,
    description: 'Conversational Q&A grounded in analytics data'
  },
  {
    id: 'content-rewrite',
    path: '/ai/content-rewrite',
    method: 'POST',
    envToggle: 'CAPABILITY_REWRITES',
    payloads: contentRewritePayloads,
    expectedShape: contentRewriteExpectedShape,
    description: 'SEO-optimized title/meta/H1 rewrite suggestions'
  },
  {
    id: 'refine-recs',
    path: '/ai/refine-recs',
    method: 'POST',
    envToggle: 'CAPABILITY_REFINER',
    payloads: refineRecsPayloads,
    expectedShape: refineRecsExpectedShape,
    description: 'Two-pass AI refinement of SEO recommendations'
  },
  {
    id: 'smart-forecast',
    path: '/ai/smart-forecast',
    method: 'POST',
    envToggle: 'CAPABILITY_FORECAST',
    payloads: smartForecastPayloads,
    expectedShape: smartForecastExpectedShape,
    description: 'Context-aware traffic/metric forecasting'
  }
];
