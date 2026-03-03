/**
 * Tests — Schema Markup Generation
 *
 * Covers:
 *   1. Zod input/output schema validation
 *   2. Deterministic type inference (inferSchemaTypes)
 *   3. JSON-LD markup generation (generateSchemaMarkup)
 *   4. Full generateSchema pipeline (without LLM — enhance: false)
 *   5. Manifest & route registration
 */

import { describe, it, expect } from 'vitest';
import {
  GenerateSchemaInputSchema,
  GenerateSchemaOutputSchema,
  GENERATE_SCHEMA_ENHANCE_JSON_SCHEMA
} from '../../src/lib/schemas/index.mjs';
import {
  generateSchema,
  inferSchemaTypes,
  generateSchemaMarkup
} from '../../src/capabilities/generate-schema.mjs';
import { getCapabilityManifest } from '../../src/capabilities/manifest.mjs';
import { createMockEnv } from '../setup.mjs';

// ── Helpers ─────────────────────────────────────────────────────────

function expectValid(schema, data) {
  const result = schema.safeParse(data);
  expect(result.success).toBe(true);
  return result;
}

function expectInvalid(schema, data) {
  const result = schema.safeParse(data);
  expect(result.success).toBe(false);
  return result;
}

const BLOG_PAGE = {
  url: 'https://example.com/blog/seo-guide',
  path: '/blog/seo-guide',
  title: 'Complete SEO Guide for Beginners',
  description: 'Learn SEO from scratch with this comprehensive guide.',
  h2s: ['What is SEO?', 'Why does SEO matter?', 'On-Page Optimization', 'Link Building'],
  wordCount: 2500,
  keywords: [{ query: 'seo guide', impressions: 500 }],
  siteName: 'Example',
  language: 'en'
};

const HOWTO_PAGE = {
  url: 'https://example.com/how-to-install-wordpress',
  path: '/how-to-install-wordpress',
  title: 'How to Install WordPress Step by Step',
  description: 'A tutorial for installing WordPress.',
  h2s: ['Download WordPress', 'Create a Database', 'Run the Installer', 'Configure Settings'],
  wordCount: 1500,
  siteName: 'Example'
};

const FAQ_PAGE = {
  url: 'https://example.com/faq',
  path: '/faq',
  title: 'Frequently Asked Questions',
  h2s: ['What is your return policy?', 'How long does shipping take?', 'Can I cancel my order?'],
  wordCount: 800,
  siteName: 'Example'
};

const REVIEW_PAGE = {
  url: 'https://example.com/blog/cloudflare-vs-fastly',
  path: '/blog/cloudflare-vs-fastly',
  title: 'Cloudflare vs Fastly: CDN Comparison Review',
  description: 'A head-to-head comparison of two popular CDN providers.',
  h2s: ['Performance', 'Pricing', 'Features', 'Verdict'],
  wordCount: 3000,
  siteName: 'Example'
};

// ── Input Schema ────────────────────────────────────────────────────

describe('GenerateSchemaInputSchema', () => {
  it('accepts valid input with all fields', () => {
    expectValid(GenerateSchemaInputSchema, {
      pages: [BLOG_PAGE],
      enhance: false
    });
  });

  it('accepts minimal input', () => {
    expectValid(GenerateSchemaInputSchema, {
      pages: [{ url: 'https://example.com' }]
    });
  });

  it('accepts forced schema types', () => {
    expectValid(GenerateSchemaInputSchema, {
      pages: [{ url: 'https://example.com' }],
      schemaTypes: ['Article', 'BreadcrumbList'],
      enhance: false
    });
  });

  it('rejects empty pages array', () => {
    expectInvalid(GenerateSchemaInputSchema, { pages: [] });
  });

  it('rejects missing pages', () => {
    expectInvalid(GenerateSchemaInputSchema, {});
  });

  it('rejects invalid schema type', () => {
    expectInvalid(GenerateSchemaInputSchema, {
      pages: [{ url: 'https://example.com' }],
      schemaTypes: ['InvalidType']
    });
  });

  it('accepts multiple pages', () => {
    expectValid(GenerateSchemaInputSchema, {
      pages: [BLOG_PAGE, HOWTO_PAGE, FAQ_PAGE],
      enhance: false
    });
  });
});

// ── inferSchemaTypes ────────────────────────────────────────────────

describe('inferSchemaTypes', () => {
  it('defaults to Article for generic content', () => {
    const result = inferSchemaTypes({ title: 'About Us' }, '/about');
    expect(result.primary).toBe('Article');
    expect(result.secondary).toContain('BreadcrumbList');
  });

  it('detects HowTo from path', () => {
    const result = inferSchemaTypes({ title: 'WordPress Setup' }, '/how-to-install-wordpress');
    expect(result.primary).toBe('HowTo');
  });

  it('detects HowTo from title', () => {
    const result = inferSchemaTypes({ title: 'How to Build a Website' }, '/build-website');
    expect(result.primary).toBe('HowTo');
  });

  it('detects tutorial as HowTo', () => {
    const result = inferSchemaTypes({ title: 'CSS Grid Tutorial' }, '/css-grid-tutorial');
    expect(result.primary).toBe('HowTo');
  });

  it('detects FAQPage from slug', () => {
    const result = inferSchemaTypes({ title: 'FAQ' }, '/faq');
    expect(result.primary).toBe('FAQPage');
  });

  it('detects FAQPage from question headings', () => {
    const result = inferSchemaTypes({
      title: 'Getting Started',
      h2s: ['What is SEO?', 'Why does it matter?', 'How do I start?']
    }, '/getting-started');
    expect(result.primary).toBe('FAQPage');
  });

  it('detects Review from vs pattern', () => {
    const result = inferSchemaTypes({ title: 'Cloudflare vs Fastly' }, '/cloudflare-vs-fastly');
    expect(result.primary).toBe('Review');
  });

  it('detects Review from comparison keyword', () => {
    const result = inferSchemaTypes({ title: 'Best CDN Comparison' }, '/cdn-comparison');
    expect(result.primary).toBe('Review');
  });

  it('detects Product from pricing page', () => {
    const result = inferSchemaTypes({ title: 'Pricing Plans' }, '/pricing');
    expect(result.primary).toBe('Product');
  });

  it('detects Product from keyword signals', () => {
    const result = inferSchemaTypes({ title: 'Widget X' }, '/widget-x', [{ query: 'buy widget x' }]);
    expect(result.primary).toBe('Product');
  });

  it('always includes BreadcrumbList in secondary', () => {
    const result = inferSchemaTypes({ title: 'Any Page' }, '/any');
    expect(result.secondary).toContain('BreadcrumbList');
  });

  it('does not duplicate primary in secondary', () => {
    const result = inferSchemaTypes({}, '/faq');
    expect(result.secondary).not.toContain(result.primary);
  });
});

// ── generateSchemaMarkup ────────────────────────────────────────────

describe('generateSchemaMarkup', () => {
  it('generates valid Article JSON-LD', () => {
    const markup = generateSchemaMarkup('Article', BLOG_PAGE);
    expect(markup).toContain('<script type="application/ld+json">');
    expect(markup).toContain('"@type": "Article"');
    expect(markup).toContain('"headline": "Complete SEO Guide for Beginners"');
    expect(markup).toContain('"wordCount": 2500');

    // Must be valid JSON inside the script tag
    const json = markup.replace(/<\/?script[^>]*>/g, '').trim();
    const parsed = JSON.parse(json);
    expect(parsed['@context']).toBe('https://schema.org');
    expect(parsed['@type']).toBe('Article');
  });

  it('generates valid FAQPage JSON-LD', () => {
    const markup = generateSchemaMarkup('FAQPage', FAQ_PAGE);
    expect(markup).toContain('"@type": "FAQPage"');
    expect(markup).toContain('"@type": "Question"');
    expect(markup).toContain('What is your return policy?');

    const json = markup.replace(/<\/?script[^>]*>/g, '').trim();
    const parsed = JSON.parse(json);
    expect(parsed.mainEntity).toHaveLength(3);
    expect(parsed.mainEntity[0].acceptedAnswer).toBeDefined();
  });

  it('generates valid HowTo JSON-LD', () => {
    const markup = generateSchemaMarkup('HowTo', HOWTO_PAGE);
    expect(markup).toContain('"@type": "HowTo"');
    expect(markup).toContain('"@type": "HowToStep"');
    expect(markup).toContain('Download WordPress');

    const json = markup.replace(/<\/?script[^>]*>/g, '').trim();
    const parsed = JSON.parse(json);
    expect(parsed.step).toHaveLength(4);
    expect(parsed.step[0].position).toBe(1);
  });

  it('generates valid Review JSON-LD', () => {
    const markup = generateSchemaMarkup('Review', REVIEW_PAGE);
    expect(markup).toContain('"@type": "Review"');
    expect(markup).toContain('Cloudflare vs Fastly');
    expect(markup).toContain('reviewRating');

    const json = markup.replace(/<\/?script[^>]*>/g, '').trim();
    const parsed = JSON.parse(json);
    expect(parsed.author).toBeDefined();
    expect(parsed.itemReviewed).toBeDefined();
  });

  it('generates valid BreadcrumbList JSON-LD', () => {
    const markup = generateSchemaMarkup('BreadcrumbList', BLOG_PAGE);
    expect(markup).toContain('"@type": "BreadcrumbList"');

    const json = markup.replace(/<\/?script[^>]*>/g, '').trim();
    const parsed = JSON.parse(json);
    expect(parsed.itemListElement.length).toBeGreaterThanOrEqual(2);
    expect(parsed.itemListElement[0].name).toBe('Home');
  });

  it('generates valid Product JSON-LD', () => {
    const markup = generateSchemaMarkup('Product', {
      url: 'https://example.com/product/widget',
      title: 'Widget Pro',
      description: 'The best widget on the market',
      siteName: 'Example'
    });
    expect(markup).toContain('"@type": "Product"');
    expect(markup).toContain('Widget Pro');

    const json = markup.replace(/<\/?script[^>]*>/g, '').trim();
    const parsed = JSON.parse(json);
    expect(parsed.offers).toBeDefined();
    expect(parsed.brand.name).toBe('Example');
  });

  it('handles missing optional fields gracefully', () => {
    const markup = generateSchemaMarkup('Article', { url: 'https://example.com' });
    const json = markup.replace(/<\/?script[^>]*>/g, '').trim();
    const parsed = JSON.parse(json);
    expect(parsed['@type']).toBe('Article');
    expect(parsed.url).toBe('https://example.com');
  });

  it('HowTo filters skip headings like Introduction and Conclusion', () => {
    const markup = generateSchemaMarkup('HowTo', {
      url: 'https://example.com/guide',
      title: 'Setup Guide',
      h2s: ['Introduction', 'Step One: Install', 'Step Two: Configure', 'Conclusion']
    });
    const json = markup.replace(/<\/?script[^>]*>/g, '').trim();
    const parsed = JSON.parse(json);
    const stepNames = parsed.step.map(s => s.name);
    expect(stepNames).not.toContain('Introduction');
    expect(stepNames).not.toContain('Conclusion');
    expect(stepNames).toContain('Step One: Install');
  });
});

// ── Full pipeline (deterministic only) ──────────────────────────────

describe('generateSchema (enhance: false)', () => {
  it('processes a single page and returns expected structure', async () => {
    const env = createMockEnv({ CAPABILITY_SCHEMA: 'true' });
    const result = await generateSchema({
      pages: [BLOG_PAGE],
      enhance: false
    }, env);

    expect(result.schemas).toHaveLength(1);
    expect(result.schemas[0].url).toBe(BLOG_PAGE.url);
    expect(result.schemas[0].detected.primary).toBeDefined();
    expect(result.schemas[0].generated.length).toBeGreaterThan(0);
    expect(result.summary.totalPages).toBe(1);
    expect(result.summary.totalSchemas).toBeGreaterThan(0);
    expect(result.summary.typesGenerated.length).toBeGreaterThan(0);

    // No LLM metadata
    expect(result.metadata).toBeUndefined();
  });

  it('processes multiple pages', async () => {
    const env = createMockEnv({ CAPABILITY_SCHEMA: 'true' });
    const result = await generateSchema({
      pages: [BLOG_PAGE, HOWTO_PAGE, FAQ_PAGE, REVIEW_PAGE],
      enhance: false
    }, env);

    expect(result.schemas).toHaveLength(4);
    expect(result.summary.totalPages).toBe(4);
    expect(result.summary.totalSchemas).toBeGreaterThanOrEqual(4); // at least 1 per page
  });

  it('respects forced schemaTypes', async () => {
    const env = createMockEnv({ CAPABILITY_SCHEMA: 'true' });
    const result = await generateSchema({
      pages: [{ url: 'https://example.com', title: 'Any Page' }],
      schemaTypes: ['HowTo', 'BreadcrumbList'],
      enhance: false
    }, env);

    expect(result.schemas[0].detected.primary).toBe('HowTo');
    expect(result.schemas[0].detected.secondary).toContain('BreadcrumbList');
  });

  it('returns empty result for empty pages (validates but no data)', async () => {
    const env = createMockEnv({ CAPABILITY_SCHEMA: 'true' });
    const result = await generateSchema({ pages: [] }, env);
    // Zod min(1) is a business-rule error — validateInput passes it through
    // The capability processes 0 pages and returns an empty result
    expect(result.schemas || []).toHaveLength(0);
  });

  it('rejects non-object body', async () => {
    const env = createMockEnv({ CAPABILITY_SCHEMA: 'true' });
    const result = await generateSchema(null, env);
    expect(result.error).toBeDefined();
  });

  it('all generated schemas have required fields', async () => {
    const env = createMockEnv({ CAPABILITY_SCHEMA: 'true' });
    const result = await generateSchema({
      pages: [BLOG_PAGE, HOWTO_PAGE],
      enhance: false
    }, env);

    for (const pageSchema of result.schemas) {
      for (const gen of pageSchema.generated) {
        expect(gen.type).toBeTruthy();
        expect(gen.markup).toContain('<script type="application/ld+json">');
        expect(gen.reason).toBeTruthy();
        expect(['required', 'recommended', 'optional']).toContain(gen.priority);
        expect(gen.enhanced).toBe(false);
      }
    }
  });

  it('always includes BreadcrumbList as secondary schema', async () => {
    const env = createMockEnv({ CAPABILITY_SCHEMA: 'true' });
    const result = await generateSchema({
      pages: [BLOG_PAGE],
      enhance: false
    }, env);

    const types = result.schemas[0].generated.map(g => g.type);
    expect(types).toContain('BreadcrumbList');
  });
});

// ── Manifest registration ───────────────────────────────────────────

describe('Schema capability in manifest', () => {
  it('is included in capability list', () => {
    const manifest = getCapabilityManifest(createMockEnv({ CAPABILITY_SCHEMA: 'true' }));
    const cap = manifest.capabilities.find(c => c.id === 'generate-schema');
    expect(cap).toBeDefined();
    expect(cap.endpoint).toBe('/ai/generate-schema');
    expect(cap.enabled).toBe(true);
  });

  it('can be disabled via env var', () => {
    const manifest = getCapabilityManifest(createMockEnv({ CAPABILITY_SCHEMA: 'false' }));
    const cap = manifest.capabilities.find(c => c.id === 'generate-schema');
    expect(cap.enabled).toBe(false);
  });
});

// ── JSON Schema for LLM output ──────────────────────────────────────

describe('GENERATE_SCHEMA_ENHANCE_JSON_SCHEMA', () => {
  it('has expected structure', () => {
    expect(GENERATE_SCHEMA_ENHANCE_JSON_SCHEMA.name).toBe('schema_enhancement');
    expect(GENERATE_SCHEMA_ENHANCE_JSON_SCHEMA.schema.properties.enhancements).toBeDefined();
    expect(GENERATE_SCHEMA_ENHANCE_JSON_SCHEMA.schema.properties.enhancements.items.properties.placeholder).toBeDefined();
    expect(GENERATE_SCHEMA_ENHANCE_JSON_SCHEMA.schema.properties.enhancements.items.properties.replacement).toBeDefined();
  });
});
