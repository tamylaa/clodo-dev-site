/**
 * Capability: Schema Markup Generation
 *
 * Two-phase pipeline:
 *   1. Deterministic — infer schema types from page signals, generate
 *      valid JSON-LD with real data and bracketed placeholders for
 *      content that requires human or LLM input.
 *   2. LLM Enhancement (optional) — Claude Haiku fills the bracketed
 *      placeholders using the page's bodyPreview text.
 *
 * Supports: Article, FAQPage, HowTo, Review, Product, BreadcrumbList.
 *
 * Design: the deterministic phase is a port of visibility-analytics'
 * schema-generator.mjs so the AI Engine can produce identical output
 * standalone, then optionally enhance it.
 */

import { createLogger } from '../lib/framework-shims.mjs';
import { runTextGeneration } from '../providers/ai-provider.mjs';
import {
  GenerateSchemaInputSchema,
  GenerateSchemaOutputSchema,
  GENERATE_SCHEMA_ENHANCE_JSON_SCHEMA
} from '../lib/schemas/index.mjs';
import { parseAndValidate } from '../lib/response-parser.mjs';
import { validateInput } from '../lib/validate-input.mjs';
import { formatGenerateSchemaExamples } from '../lib/few-shot/index.mjs';

const logger = createLogger('ai-schema');

// ─── Entry point ────────────────────────────────────────────────────

export async function generateSchema(body, env) {
  const v = validateInput(GenerateSchemaInputSchema, body);
  if (!v.valid) return v.error;

  const { pages, schemaTypes, enhance } = v.data;

  const results = [];
  const allTypes = new Set();
  let totalSchemas = 0;

  for (const page of pages) {
    const detected = schemaTypes
      ? { primary: schemaTypes[0], secondary: schemaTypes.slice(1) }
      : inferSchemaTypes(page, page.path, page.keywords);

    const generated = generateAllSchemas(page, detected);
    totalSchemas += generated.length;
    generated.forEach(g => allTypes.add(g.type));

    results.push({ url: page.url, detected, generated });
  }

  // Phase 2 — LLM enhancement (fill placeholder text from bodyPreview)
  let llmMeta = null;
  if (enhance) {
    attachPageData(results, pages);
    llmMeta = await enhanceWithLLM(results, env);
    // Clean up internal-only data
    for (const r of results) delete r._pageData;
  }

  const output = {
    schemas: results,
    summary: {
      totalPages: pages.length,
      totalSchemas,
      typesGenerated: [...allTypes]
    }
  };

  if (llmMeta) {
    output.metadata = llmMeta;
  }

  logger.info(`Schema generation complete: ${pages.length} pages, ${totalSchemas} schemas`, {
    types: [...allTypes],
    enhanced: !!llmMeta
  });

  return output;
}

// ─── Phase 1: Deterministic ─────────────────────────────────────────

/**
 * Infer the best schema type(s) for a page.
 * Ported from visibility-analytics/src/analysis/schema-generator.mjs.
 */
export function inferSchemaTypes(page = {}, path = '', keywords = []) {
  const slug = (path || page.path || '').toLowerCase();
  const title = (page.title || '').toLowerCase();
  const combined = slug + ' ' + title;
  const kwText = (keywords || []).map(k => (k.query || '')).join(' ').toLowerCase();

  const types = [];

  // HowTo — step-based content
  if (combined.match(/how[\s-]to|tutorial|step[\s-]by|guide/)) {
    types.push('HowTo');
  }

  // FAQ — question headings or FAQ page
  const h2s = page.h2s || [];
  const questionH2s = h2s.filter(h =>
    /^(what|why|how|when|where|who|is |can |do |does |should )/i.test(h.trim())
  );
  if (combined.includes('faq') || combined.includes('frequently') || questionH2s.length >= 2) {
    types.push('FAQPage');
  }

  // Review / Comparison
  if (combined.match(/review|comparison|\bvs[\b\s-]|versus|best\s+\d|top\s+\d/)) {
    types.push('Review');
  }

  // Product
  if (combined.match(/pricing|product|buy|purchase/) || kwText.match(/price|cost|buy/)) {
    types.push('Product');
  }

  // Article fallback
  if (types.length === 0) {
    types.push('Article');
  }

  const primary = types[0] || 'Article';
  const secondary = [...types.slice(1), 'BreadcrumbList'].filter(t => t !== primary);

  return { primary, secondary };
}

/**
 * Generate all recommended schemas for a page.
 */
function generateAllSchemas(page, detected) {
  const results = [];

  results.push({
    type: detected.primary,
    markup: generateSchemaMarkup(detected.primary, page),
    reason: SCHEMA_REASONS[detected.primary] || 'Helps search engines understand your content.',
    priority: 'required',
    enhanced: false
  });

  if (detected.secondary.includes('BreadcrumbList')) {
    results.push({
      type: 'BreadcrumbList',
      markup: generateSchemaMarkup('BreadcrumbList', page),
      reason: SCHEMA_REASONS.BreadcrumbList,
      priority: 'recommended',
      enhanced: false
    });
  }

  for (const type of (detected.secondary || []).filter(t => t !== 'BreadcrumbList')) {
    results.push({
      type,
      markup: generateSchemaMarkup(type, page),
      reason: SCHEMA_REASONS[type] || '',
      priority: 'optional',
      enhanced: false
    });
  }

  return results;
}

/**
 * Generate JSON-LD markup for a specific schema type.
 */
export function generateSchemaMarkup(type, pageData) {
  const {
    url = '',
    path = '',
    title = '',
    description = '',
    h2s = [],
    wordCount = 0,
    keywords = [],
    siteName = '',
    language = 'en'
  } = pageData;

  const domain = url ? url.replace(/^https?:\/\//, '').split('/')[0] : '';
  const site = siteName || domain;
  const today = new Date().toISOString().split('T')[0];

  switch (type) {
    case 'Article':   return formatJsonLd(buildArticle({ url, title, description, wordCount, site, today, language }));
    case 'FAQPage':   return formatJsonLd(buildFAQ({ url, title, h2s, keywords }));
    case 'HowTo':     return formatJsonLd(buildHowTo({ url, title, description, h2s, site }));
    case 'Review':    return formatJsonLd(buildReview({ url, title, description, site, today }));
    case 'Product':   return formatJsonLd(buildProduct({ url, title, description, site }));
    case 'BreadcrumbList': return formatJsonLd(buildBreadcrumb({ url, path, title, site }));
    default:          return formatJsonLd(buildArticle({ url, title, description, wordCount, site, today, language }));
  }
}

// ── Individual schema builders ──────────────────────────────────────

function buildArticle({ url, title, description, wordCount, site, today, language }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title || 'Your Article Title',
    url,
    datePublished: today,
    dateModified: today,
    author: { '@type': 'Organization', name: site },
    publisher: { '@type': 'Organization', name: site },
    inLanguage: language
  };
  if (description) schema.description = description;
  if (wordCount > 0) schema.wordCount = wordCount;
  return schema;
}

function buildFAQ({ url, title, h2s, keywords }) {
  const questionH2s = (h2s || []).filter(h =>
    /^(what|why|how|when|where|who|is |can |do |does |should )/i.test(h.trim())
  );
  let faqHeadings = questionH2s.length >= 2 ? questionH2s : (h2s || []).filter(h => h.length > 10);

  if (faqHeadings.length === 0) {
    const kwQuestions = (keywords || []).slice(0, 3).map(k => {
      const q = k.query || '';
      return /^(what|why|how|when|where|who|is |can |do |does )/i.test(q) ? q : `What is ${q}?`;
    });
    faqHeadings = kwQuestions;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqHeadings.slice(0, 5).map(heading => ({
      '@type': 'Question',
      name: heading,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `[Write 2-3 sentences answering: "${heading}"]`
      }
    }))
  };
}

function buildHowTo({ url, title, description, h2s, site }) {
  const skip = /^(introduction|conclusion|summary|overview|table of contents|faq|about|references)/i;
  const stepHeadings = (h2s || []).filter(h => !skip.test(h.trim()) && h.length > 5);

  const steps = stepHeadings.length > 0
    ? stepHeadings.slice(0, 8).map((h, i) => ({
        '@type': 'HowToStep', position: i + 1, name: h,
        text: `[Describe step ${i + 1}: ${h}]`
      }))
    : [
        { '@type': 'HowToStep', position: 1, name: 'Step 1', text: '[Describe step 1]' },
        { '@type': 'HowToStep', position: 2, name: 'Step 2', text: '[Describe step 2]' },
        { '@type': 'HowToStep', position: 3, name: 'Step 3', text: '[Describe step 3]' }
      ];

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: title || 'How-To Guide',
    url,
    step: steps
  };
  if (description) schema.description = description;
  return schema;
}

function buildReview({ url, title, description, site, today }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    name: title || 'Review',
    url,
    datePublished: today,
    author: { '@type': 'Organization', name: site },
    itemReviewed: {
      '@type': 'Thing',
      name: `[Name of product/service reviewed in "${title || 'this article'}"]`
    },
    reviewRating: { '@type': 'Rating', ratingValue: '[Your rating, e.g. 4.5]', bestRating: '5' }
  };
  if (description) schema.description = description;
  return schema;
}

function buildProduct({ url, title, description, site }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title || '[Product Name]',
    url,
    brand: { '@type': 'Brand', name: site },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: '[USD]',
      price: '[Price]',
      availability: 'https://schema.org/InStock'
    }
  };
  if (description) schema.description = description;
  return schema;
}

function buildBreadcrumb({ url, path, title, site }) {
  const segments = (path || '/').split('/').filter(Boolean);
  const domain = url ? url.replace(/^(https?:\/\/[^/]+).*$/, '$1') : '';

  const items = [{ '@type': 'ListItem', position: 1, name: 'Home', item: domain || '/' }];
  let cumPath = '';

  segments.forEach((seg, i) => {
    cumPath += '/' + seg;
    const isLast = i === segments.length - 1;
    const name = isLast && title
      ? title
      : seg.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const entry = { '@type': 'ListItem', position: i + 2, name };
    if (!isLast) entry.item = domain + cumPath;
    items.push(entry);
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items
  };
}

// ─── Phase 2: LLM Enhancement ──────────────────────────────────────

const PLACEHOLDER_RE = /\[(?:Write |Describe |Name of |Your |Price|USD)[^\]]+\]/g;

async function enhanceWithLLM(results, env) {
  // Collect all pages that have placeholders AND bodyPreview
  const enhanceable = [];
  for (const pageResult of results) {
    const page = findPageByUrl(pageResult.url, results);
    for (const gen of pageResult.generated) {
      const placeholders = gen.markup.match(PLACEHOLDER_RE);
      if (placeholders && placeholders.length > 0) {
        enhanceable.push({ pageResult, gen, placeholders });
      }
    }
  }

  if (enhanceable.length === 0) return null;

  // Group all placeholders and bodyPreviews into a single LLM call
  const allPlaceholders = [];
  const bodyPreviews = {};

  for (const { pageResult, gen, placeholders } of enhanceable) {
    // Find original page body from the input (stored on the result)
    const pageData = pageResult._pageData;
    const body = pageData?.bodyPreview || '';
    if (!body) continue;

    bodyPreviews[pageResult.url] = body;
    for (const ph of placeholders) {
      allPlaceholders.push({ url: pageResult.url, type: gen.type, placeholder: ph });
    }
  }

  if (allPlaceholders.length === 0) return null;

  try {
    const fewShot = formatGenerateSchemaExamples(2);

    const userPrompt = `${fewShot}

Here are the placeholders to fill. For each one, write a concise, factual replacement using ONLY information from the page content provided. Do not invent facts.

${allPlaceholders.map((p, i) => `${i + 1}. Page: ${p.url} (${p.type})
   Placeholder: ${p.placeholder}
   Page content: ${(bodyPreviews[p.url] || '').slice(0, 600)}`).join('\n\n')}

Return a JSON object with an "enhancements" array. Each item has "placeholder" (exact original text) and "replacement" (your answer).`;

    const result = await runTextGeneration({
      systemPrompt: 'You are a schema markup specialist. Fill placeholder text in JSON-LD schemas using the actual page content provided. Be concise (2-3 sentences max per answer). Never invent information — only use what appears in the page content. If the page content does not contain enough information to fill a placeholder, return the original placeholder unchanged.',
      userPrompt,
      complexity: 'simple',
      capability: 'generate-schema',
      maxTokens: 2000,
      jsonMode: true,
      jsonSchema: GENERATE_SCHEMA_ENHANCE_JSON_SCHEMA
    }, env);

    const EnhanceOutputSchema = (await import('zod')).z.object({
      enhancements: (await import('zod')).z.array((await import('zod')).z.object({
        placeholder: (await import('zod')).z.string(),
        replacement: (await import('zod')).z.string()
      }))
    });

    const { data: parsed, meta } = parseAndValidate(
      result.text,
      EnhanceOutputSchema,
      { fallback: () => ({ enhancements: [] }), expect: 'object' }
    );

    const replacements = (parsed?.enhancements || []);

    // Apply replacements
    if (replacements.length > 0) {
      const replMap = new Map(replacements.map(r => [r.placeholder, r.replacement]));

      for (const { gen } of enhanceable) {
        let changed = false;
        let markup = gen.markup;
        for (const [ph, repl] of replMap) {
          if (markup.includes(ph) && repl !== ph) {
            // Escape for JSON string context
            const safeRepl = repl.replace(/"/g, '\\"');
            markup = markup.split(ph).join(safeRepl);
            changed = true;
          }
        }
        if (changed) {
          gen.markup = markup;
          gen.enhanced = true;
        }
      }
    }

    return {
      provider: result.provider,
      model: result.model,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
      durationMs: result.durationMs,
      placeholdersFilled: replacements.length,
      parseQuality: {
        method: meta.parseMethod,
        schemaValid: meta.schemaValid,
        fallbackUsed: meta.fallbackUsed
      }
    };
  } catch (err) {
    logger.warn('LLM enhancement failed, returning deterministic output', { error: err.message });
    return null;
  }
}

/**
 * Pre-attach page data to results so enhanceWithLLM can access bodyPreview.
 * Called by generateSchema before enhancement phase.
 */
function attachPageData(results, pages) {
  for (const r of results) {
    const page = pages.find(p => p.url === r.url);
    if (page) r._pageData = page;
  }
}

// This is unused outside the module but kept for reference
function findPageByUrl(url, results) {
  for (const r of results) {
    if (r.url === url) return r;
  }
  return null;
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatJsonLd(schema) {
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

const SCHEMA_REASONS = {
  Article: 'Article schema helps Google understand your content type, author, and publication date — enables rich results with author info and date.',
  FAQPage: 'FAQ schema adds expandable Q&A dropdowns directly in search results — takes up 3-4x more visual space than a regular listing.',
  HowTo: 'HowTo schema shows step-by-step instructions in search results — appears as a rich card that draws clicks away from competitors.',
  Review: 'Review schema can display star ratings in search results — star-rated results get 35% more clicks on average.',
  Product: 'Product schema enables price, availability, and rating display in search results.',
  BreadcrumbList: 'Breadcrumb schema replaces your raw URL in search results with a clean navigation trail — looks more trustworthy and takes up more space.'
};
