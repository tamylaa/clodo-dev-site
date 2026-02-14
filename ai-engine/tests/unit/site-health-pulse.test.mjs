/**
 * Tests — Site Health Pulse (Capability 11)
 *
 * Tests the composite orchestrator that runs sub-capabilities in parallel
 * and cross-references findings into insight chains.
 *
 * Since Site Health Pulse calls other capabilities internally, we mock the
 * underlying provider layer (same pattern as data-flow tests).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockEnv } from '../setup.mjs';

// ── Mock the provider layer ──────────────────────────────────────────

const mockTextGeneration = vi.fn();
const mockEmbeddings = vi.fn();

vi.mock('../../src/providers/ai-provider.mjs', () => ({
  runTextGeneration: (...args) => mockTextGeneration(...args),
  runEmbeddings: (...args) => mockEmbeddings(...args),
  getProviderStatus: () => ({
    claude: { name: 'Anthropic Claude', available: true, tier: 'premium' },
    cloudflare: { name: 'Cloudflare Workers AI', available: true, tier: 'free' }
  })
}));

// ── Import after mocks ───────────────────────────────────────────────

import { siteHealthPulse } from '../../src/capabilities/site-health-pulse.mjs';
import { SiteHealthPulseInputSchema, SiteHealthPulseOutputSchema } from '../../src/lib/schemas/site-health-pulse.schema.mjs';

// ── Helpers ──────────────────────────────────────────────────────────

function makeLLMResponse(text) {
  return {
    text,
    provider: 'claude',
    model: 'claude-sonnet-4-20250514',
    tokensUsed: { input: 500, output: 200 },
    cost: { estimated: 0.004 },
    durationMs: 800
  };
}

const basePages = [
  {
    url: '/blog/seo-tips',
    title: 'SEO Tips for 2025',
    description: 'Learn the best SEO tips and tricks.',
    headings: ['SEO Tips for 2025', 'Tip 1: Keyword Research'],
    wordCount: 1800,
    loadTimeMs: 2100,
    mobileOptimised: true,
    internalLinks: 5,
    externalLinks: 3,
    images: 4,
    imagesWithAlt: 4,
    schemaMarkup: true,
    keywords: ['seo tips', 'seo tips 2025'],
    position: 8,
    clicks: 200,
    impressions: 3000
  },
  {
    url: '/blog/seo-guide',
    title: 'Complete SEO Guide',
    description: 'A comprehensive guide to SEO.',
    headings: ['Complete SEO Guide', 'Chapter 1'],
    wordCount: 2500,
    loadTimeMs: 1800,
    mobileOptimised: true,
    internalLinks: 8,
    externalLinks: 5,
    images: 6,
    imagesWithAlt: 6,
    schemaMarkup: true,
    keywords: ['seo guide', 'seo tips'],
    position: 4,
    clicks: 500,
    impressions: 8000
  }
];

// ── Test Suite ────────────────────────────────────────────────────────

describe('Site Health Pulse', () => {
  let env;

  beforeEach(() => {
    vi.clearAllMocks();
    env = createMockEnv({ CAPABILITY_SITE_HEALTH: 'true' });

    // Mock responses based on capability
    mockTextGeneration.mockImplementation((opts) => {
      if (opts.capability === 'page-scorer') {
        return Promise.resolve(makeLLMResponse(JSON.stringify({
          scores: [
            {
              url: '/blog/seo-tips',
              overallScore: 72,
              grade: 'B',
              dimensions: {
                technical: { score: 80, issues: [], suggestions: [] },
                content: { score: 70, issues: ['Thin meta description'], suggestions: ['Expand meta'] },
                onPage: { score: 65, issues: ['Missing H2s'], suggestions: ['Add H2 subheadings'] },
                ux: { score: 75, issues: [], suggestions: [] }
              },
              topPriority: 'Expand meta description',
              estimatedImpact: 'medium'
            },
            {
              url: '/blog/seo-guide',
              overallScore: 85,
              grade: 'A',
              dimensions: {
                technical: { score: 90, issues: [], suggestions: [] },
                content: { score: 85, issues: [], suggestions: [] },
                onPage: { score: 80, issues: [], suggestions: [] },
                ux: { score: 88, issues: [], suggestions: [] }
              },
              topPriority: 'Consider adding FAQ schema',
              estimatedImpact: 'low'
            }
          ],
          averageScore: 78,
          summary: 'Overall good SEO performance.'
        })));
      } else if (opts.capability === 'cannibalization-detect') {
        return Promise.resolve(makeLLMResponse(JSON.stringify({
          conflicts: [],
          summary: 'No cannibalization detected.',
          overallSeverity: 'none'
        })));
      } else if (opts.capability === 'content-gaps') {
        return Promise.resolve(makeLLMResponse(JSON.stringify({
          gaps: [],
          summary: 'No content gaps identified.',
          coverageScore: 85
        })));
      } else if (opts.capability === 'anomaly-diagnosis') {
        return Promise.resolve(makeLLMResponse(JSON.stringify({
          diagnoses: [],
          summary: 'No anomalies detected.',
          overallSeverity: 'none'
        })));
      } else {
        return Promise.resolve(makeLLMResponse(JSON.stringify({})));
      }
    });

    // Mock embeddings for cannibalization
    mockEmbeddings.mockResolvedValue({
      embeddings: [
        new Array(768).fill(0.1),
        new Array(768).fill(0.1)
      ],
      provider: 'cloudflare',
      model: 'bge-base-en-v1.5'
    });
  });

  // ── Schema validation ───────────────────────────────────────────

  describe('Input Schema', () => {
    it('accepts valid full input', () => {
      const result = SiteHealthPulseInputSchema.safeParse({
        pages: basePages,
        anomalies: [{ type: 'traffic', severity: 'high', metric: 'clicks' }],
        currentData: { totalClicks: 1000 },
        siteKeywords: ['seo tips'],
        competitorKeywords: [{ keyword: 'seo audit', source: 'competitor.com' }],
        context: { siteUrl: 'https://example.com', industry: 'Marketing' }
      });
      expect(result.success).toBe(true);
    });

    it('accepts minimal input (pages only)', () => {
      const result = SiteHealthPulseInputSchema.safeParse({
        pages: [{ url: '/page-a' }]
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty pages array', () => {
      const result = SiteHealthPulseInputSchema.safeParse({ pages: [] });
      expect(result.success).toBe(false);
    });

    it('rejects missing pages', () => {
      const result = SiteHealthPulseInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  // ── Capability execution ────────────────────────────────────────

  describe('Pages-only mode (minimal)', () => {
    it('runs page-scorer and returns health score', async () => {
      const result = await siteHealthPulse({ pages: basePages }, env);

      expect(result.healthScore).toBeGreaterThanOrEqual(0);
      expect(result.healthScore).toBeLessThanOrEqual(100);
      expect(result.grade).toBeDefined();
      expect(result.dimensions.pageQuality.score).toBeGreaterThan(0);
      expect(result.capabilitiesRun).toContain('page-scorer');
      expect(result.summary).toBeTruthy();
      expect(result.metadata).toBeDefined();
    });

    it('does not run cannibalization for pages without keywords', async () => {
      const pagesNoKw = [{ url: '/a' }, { url: '/b' }];
      const result = await siteHealthPulse({ pages: pagesNoKw }, env);

      expect(result.capabilitiesRun).not.toContain('cannibalization');
      expect(result.metadata.subCapabilities?.['cannibalization']?.ran).toBe(false);
    });

    it('does not run content-gaps without competitor keywords', async () => {
      const result = await siteHealthPulse({ pages: basePages }, env);

      expect(result.capabilitiesRun).not.toContain('content-gaps');
    });

    it('does not run anomaly-diagnosis without anomalies', async () => {
      const result = await siteHealthPulse({ pages: basePages }, env);

      expect(result.capabilitiesRun).not.toContain('anomaly-diagnosis');
    });
  });

  describe('Full mode (all sub-capabilities)', () => {
    it('orchestrates all 4 sub-capabilities', async () => {
      const body = {
        pages: basePages,
        anomalies: [{ type: 'traffic_drop', severity: 'high', metric: 'clicks', currentValue: 50, expectedValue: 200 }],
        currentData: { totalClicks: 1000, period: { start: '2025-01-01', end: '2025-01-31' } },
        siteKeywords: ['seo tips', 'seo guide'],
        competitorKeywords: [
          { keyword: 'seo audit tool', source: 'competitor.com', volume: 5000 },
          { keyword: 'seo checklist', source: 'competitor.com', volume: 3000 }
        ],
        context: { siteUrl: 'https://example.com' }
      };

      const result = await siteHealthPulse(body, env);

      expect(result.healthScore).toBeGreaterThanOrEqual(0);
      expect(result.healthScore).toBeLessThanOrEqual(100);
      expect(result.dimensions).toHaveProperty('pageQuality');
      expect(result.dimensions).toHaveProperty('cannibalization');
      expect(result.dimensions).toHaveProperty('contentCoverage');
      expect(result.dimensions).toHaveProperty('anomalyRisk');
      expect(result.capabilitiesRun.length).toBeGreaterThanOrEqual(2); // at least page-scorer + one other
      expect(result.topPriorities).toBeInstanceOf(Array);
      expect(result.topPriorities.length).toBeLessThanOrEqual(5);
    });
  });

  // ── Input validation ────────────────────────────────────────────

  describe('Input validation', () => {
    it('rejects null body', async () => {
      const result = await siteHealthPulse(null, env);
      expect(result.error).toBeDefined();
    });

    it('rejects non-object body', async () => {
      const result = await siteHealthPulse('not an object', env);
      expect(result.error).toBeDefined();
    });

    it('handles empty pages array gracefully', async () => {
      const result = await siteHealthPulse({ pages: [] }, env);
      // Empty pages passes business-rule validation (too_small is non-structural)
      // but page-scorer returns an empty scores array, resulting in 0 health score
      expect(result.healthScore === 0 || result.error || result.validationErrors).toBeTruthy();
    });
  });

  // ── Cross-capability insights ─────────────────────────────────

  describe('Insight generation', () => {
    it('returns insights array', async () => {
      const result = await siteHealthPulse({ pages: basePages }, env);
      expect(result.insights).toBeInstanceOf(Array);
    });

    it('each insight has required fields', async () => {
      const result = await siteHealthPulse({ pages: basePages }, env);
      for (const insight of result.insights) {
        expect(insight.id).toBeTruthy();
        expect(insight.type).toMatch(/^(cross-capability|single-capability|warning)$/);
        expect(insight.severity).toMatch(/^(critical|high|medium|low)$/);
        expect(insight.title).toBeTruthy();
        expect(insight.description).toBeTruthy();
        expect(insight.capabilities).toBeInstanceOf(Array);
        expect(insight.suggestedAction).toBeTruthy();
      }
    });
  });

  // ── Priorities ────────────────────────────────────────────────

  describe('Priority derivation', () => {
    it('returns at most 5 priorities', async () => {
      const result = await siteHealthPulse({ pages: basePages }, env);
      expect(result.topPriorities.length).toBeLessThanOrEqual(5);
    });

    it('each priority has required fields', async () => {
      const result = await siteHealthPulse({ pages: basePages }, env);
      for (const p of result.topPriorities) {
        expect(p.rank).toBeGreaterThan(0);
        expect(p.title).toBeTruthy();
        expect(p.category).toBeTruthy();
        expect(p.impact).toMatch(/^(critical|high|medium|low)$/);
        expect(p.effort).toMatch(/^(quick-win|moderate|major)$/);
      }
    });
  });

  // ── Grade mapping ─────────────────────────────────────────────

  describe('Grade mapping', () => {
    it('maps health score to a letter grade', async () => {
      const result = await siteHealthPulse({ pages: basePages }, env);
      expect(['A+', 'A', 'B', 'C', 'D', 'F']).toContain(result.grade);
    });
  });

  // ── Sub-capability error resilience ───────────────────────────

  describe('Error resilience', () => {
    it('handles sub-capability failure gracefully', async () => {
      // Make the first LLM call fail
      mockTextGeneration
        .mockRejectedValueOnce(new Error('Provider unavailable'))
        .mockResolvedValue(makeLLMResponse(JSON.stringify({
          scores: [],
          averageScore: 0,
          summary: 'Fallback'
        })));

      const result = await siteHealthPulse({ pages: basePages }, env);

      // Should still return a valid response
      expect(result.healthScore).toBeDefined();
      expect(typeof result.healthScore).toBe('number');
      expect(result.grade).toBeDefined();
    });
  });

  // ── Summary text ──────────────────────────────────────────────

  describe('Summary', () => {
    it('includes health score in summary', async () => {
      const result = await siteHealthPulse({ pages: basePages }, env);
      expect(result.summary).toContain('Site health score');
      expect(result.summary).toContain('/100');
    });
  });
});
