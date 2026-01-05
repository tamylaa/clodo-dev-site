#!/usr/bin/env node

/**
 * Schema.org Generator for Clodo Framework Website
 * 
 * Generates structured data from:
 * - Data files (blog-data.json, etc.)
 * - Page configurations
 * - Template library
 * - Locale-specific defaults
 * 
 * Usage: Called from build.js during HTML processing
 * Ensures single source of truth for all schema markup
 * Supports multi-language (i18n) schema generation
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { getLocaleConfig, buildLocaleUrl } from './locale-utils.js';

// Load shared data
let blogData = null;
let schemaDefaults = null;
let defaultsI18n = null;

function loadData() {
  if (!blogData) {
    try {
      blogData = JSON.parse(readFileSync(join('data', 'blog-data.json'), 'utf8'));
    } catch (e) {
      console.error('Failed to load blog-data.json:', e.message);
      blogData = { authors: {}, testimonials: {} };
    }
  }
  if (!schemaDefaults) {
    try {
      schemaDefaults = JSON.parse(readFileSync(join('schema', 'defaults.json'), 'utf8'));
    } catch (e) {
      console.warn('Schema defaults not found, using minimal config');
      schemaDefaults = { organization: {}, author: {} };
    }
  }
  if (!defaultsI18n) {
    try {
      defaultsI18n = JSON.parse(readFileSync(join('schema', 'defaults-i18n.json'), 'utf8'));
    } catch (e) {
      console.warn('i18n defaults not found, using English only');
      defaultsI18n = { locales: { en: {} } };
    }
  }
  return { blogData, schemaDefaults, defaultsI18n };
}

/**
 * Generate shared Organization schema with locale support
 * @param {string} locale - Language locale code (e.g., 'en', 'de', 'it')
 * Used across all pages
 */
export function generateOrganizationSchema(locale = 'en') {
  const localeConfig = getLocaleConfig(locale);
  const org = localeConfig.organization;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': org.name || 'Clodo Framework',
    'url': org.url_locale || org.url || 'https://clodo.dev',
    'logo': org.logo || 'https://clodo.dev/icons/icon.svg',
    'founded': org.founded || '2024',
    'foundingLocation': {
      '@type': 'Place',
      'address': {
        '@type': 'PostalAddress',
        'addressCountry': localeConfig.region || 'US'
      }
    },
    'contactPoint': {
      '@type': 'ContactPoint',
      'email': org.email || 'product@clodo.dev',
      'contactType': 'Customer Support',
      'availableLanguage': localeConfig.language || 'en'
    },
    'inLanguage': localeConfig.locale || 'en-US',
    'sameAs': org.sameAs || [
      'https://github.com/tamylaa/clodo-framework',
      'https://www.npmjs.com/package/@tamyla/clodo-framework',
      'https://twitter.com/clodoframework',
      'https://linkedin.com/company/clodo-framework'
    ]
  };
}

/**
 * Generate BreadcrumbList schema
 * @param {Array} items - [{name, url}]
 */
export function generateBreadcrumbList(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url
    }))
  };
}

/**
 * Generate TechArticle schema for blog posts
 * @param {Object} post - Blog post data from blog-data.json or frontmatter
 */
export function generateTechArticleSchema(post) {
  const { blogData } = loadData();
  const author = post.author ? blogData.authors?.[post.author] : null;

  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    'headline': post.headline || post.title,
    'description': post.description,
    'image': post.image || 'https://clodo.dev/og-image.png',
    'datePublished': post.datePublished || post.published,
    'dateModified': post.dateModified || post.updated || post.datePublished,
    'author': author ? {
      '@type': 'Person',
      'name': author.name,
      'url': author.url,
      'jobTitle': author.jobTitle,
      'sameAs': [
        author.social?.github,
        author.social?.linkedin,
        author.social?.twitter
      ].filter(Boolean)
    } : {
      '@type': 'Organization',
      'name': 'Clodo Framework'
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Clodo Framework',
      'url': 'https://clodo.dev',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://clodo.dev/icons/icon.svg'
      }
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': post.url
    },
    'articleSection': post.section || 'Technical',
    'keywords': post.keywords || [],
    'wordCount': post.wordCount || 2500,
    'proficiencyLevel': post.proficiencyLevel || 'Intermediate',
    'dependencies': post.dependencies || '',
    ...(post.url && {
      'url': post.url
    })
  };
}

/**
 * Generate FAQPage schema
 * @param {Array} faqs - [{name, acceptedAnswer}]
 */
export function generateFAQPageSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.name,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.acceptedAnswer
      }
    }))
  };
}

/**
 * Generate QuantitativeValue for metrics
 * @param {Object} metric - {name, value, unitText}
 */
export function generateQuantitativeValue(metric) {
  return {
    '@type': 'QuantitativeValue',
    'value': metric.value,
    'unitText': metric.unitText || ''
  };
}

/**
 * Generate ItemList with metrics (for case studies)
 * @param {Array} items - [{name, description, value, unitText}]
 */
export function generateMetricsItemList(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': 'Key Performance Indicators',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'item': {
        '@type': 'Thing',
        'name': item.name,
        'description': item.description,
        'quantitativeValue': generateQuantitativeValue({
          value: item.value,
          unitText: item.unitText
        })
      }
    }))
  };
}

/**
 * Generate Product schema with offers
 * @param {Object} product - {name, description, offers: [...]}
 */
export function generateProductSchema(product) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.name,
    'description': product.description,
    'image': product.image || 'https://clodo.dev/icons/icon.svg',
    'url': product.url || 'https://clodo.dev',
    'brand': {
      '@type': 'Brand',
      'name': product.brand || 'Clodo'
    },
    'offers': product.offers.map(offer => ({
      '@type': 'Offer',
      'name': offer.name,
      'price': offer.price,
      'priceCurrency': offer.priceCurrency || 'USD',
      'availability': offer.availability || 'https://schema.org/InStock',
      'description': offer.description,
      'url': offer.url
    })),
    ...(product.aggregateRating && {
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': product.aggregateRating.value,
        'ratingCount': product.aggregateRating.count,
        'bestRating': '5',
        'worstRating': '1'
      }
    })
  };
}

/**
 * Generate HowTo schema
 * @param {Object} howto - {name, description, totalTime, steps: [...]}
 */
export function generateHowToSchema(howto) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    'name': howto.name,
    'description': howto.description,
    'totalTime': howto.totalTime,
    'step': howto.steps.map((step, index) => ({
      '@type': 'HowToStep',
      'position': index + 1,
      'name': step.name,
      'text': step.text,
      ...(step.url && { 'url': step.url })
    }))
  };
}

/**
 * Generate LearningResource schema
 * @param {Object} resource - {name, description, url, educationalLevel}
 */
export function generateLearningResourceSchema(resource) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    'name': resource.name,
    'description': resource.description,
    'url': resource.url,
    'author': {
      '@type': 'Organization',
      'name': 'Clodo Framework Team'
    },
    'educationalLevel': resource.educationalLevel || 'Intermediate to Advanced',
    'learningResourceType': resource.types || ['Conceptual', 'Procedural'],
    'inLanguage': 'en',
    'isAccessibleForFree': true
  };
}

/**
 * Wrap schema in script tag with nonce
 */
export function wrapSchemaTag(schema, nonce = 'N0Nc3Cl0d0') {
  return `<script type="application/ld+json" nonce="${nonce}">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

/**
 * Generate complete schema set for a page
 * Useful for bulk generation in build process
 */
export function generatePageSchemas(pageConfig) {
  const schemas = [];

  // Always include organization
  schemas.push(wrapSchemaTag(generateOrganizationSchema()));

  // Add breadcrumb if provided
  if (pageConfig.breadcrumbs) {
    schemas.push(wrapSchemaTag(generateBreadcrumbList(pageConfig.breadcrumbs)));
  }

  // Add main content schema
  if (pageConfig.schema) {
    const schemaType = pageConfig.schema.type;
    let schema;

    switch (schemaType) {
      case 'TechArticle':
        schema = generateTechArticleSchema(pageConfig.schema);
        break;
      case 'FAQPage':
        schema = generateFAQPageSchema(pageConfig.schema.faqs);
        break;
      case 'Product':
        schema = generateProductSchema(pageConfig.schema);
        break;
      case 'HowTo':
        schema = generateHowToSchema(pageConfig.schema);
        break;
      case 'LearningResource':
        schema = generateLearningResourceSchema(pageConfig.schema);
        break;
      default:
        schema = pageConfig.schema;
    }

    if (schema) {
      schemas.push(wrapSchemaTag(schema));
    }
  }

  return schemas.join('\n');
}

/**
 * Loads page configuration and generates schemas for all pages
 * Reads from schema/page-config.json to ensure DRY principle
 */
export function loadPageConfiguration() {
  try {
    return JSON.parse(readFileSync(join('schema', 'page-config.json'), 'utf8'));
  } catch (e) {
    console.error('Failed to load page-config.json:', e.message);
    return { blogPosts: {}, caseStudies: {}, pages: {} };
  }
}

/**
 * Generate schemas for a specific blog post
 * Reads author info from blog-data.json to avoid duplication
 * Supports locale-specific URLs and metadata
 * 
 * @param {string} htmlFilename - The blog post filename
 * @param {Object} config - Configuration from page-config.json
 * @param {string} locale - Language locale code (default: 'en')
 */
export function generateBlogPostSchemas(htmlFilename, config, locale = 'en') {
  const { blogData } = loadData();
  const localeConfig = getLocaleConfig(locale);
  const schemas = [];

  // Organization schema (shared)
  schemas.push(wrapSchemaTag(generateOrganizationSchema(locale)));

  // TechArticle schema from config + author data
  const author = blogData.authors?.[config.author];
  const blogUrl = buildLocaleUrl(config.url.replace('https://clodo.dev', ''), locale);
  
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: config.headline || config.title,
    description: config.description,
    url: blogUrl,
    datePublished: config.published,
    dateModified: config.updated || config.published,
    inLanguage: localeConfig.locale || 'en-US',
    author: author ? {
      '@type': 'Person',
      name: author.name,
      url: author.url || buildLocaleUrl('', locale)
    } : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Clodo',
      url: buildLocaleUrl('', locale)
    },
    mainEntity: {
      '@type': 'TechArticle',
      headline: config.headline || config.title,
      description: config.description
    }
  };

  if (config.proficiencyLevel) {
    articleSchema.proficiencyLevel = config.proficiencyLevel;
  }
  if (config.dependencies) {
    articleSchema.dependencies = config.dependencies;
  }
  if (config.keywords && Array.isArray(config.keywords)) {
    articleSchema.keywords = config.keywords.join(', ');
  }
  if (config.wordCount) {
    articleSchema.wordCount = config.wordCount;
  }

  schemas.push(wrapSchemaTag(articleSchema));

  // Breadcrumb for blog post
  const breadcrumbs = [
    { name: 'Home', item: 'https://clodo.dev' },
    { name: 'Blog', item: 'https://clodo.dev/blog' },
    { name: config.headline || config.title, item: config.url }
  ];
  schemas.push(wrapSchemaTag(generateBreadcrumbList(breadcrumbs)));

  return schemas.join('\n');
}

/**
 * Generate schemas for a case study page
 * Includes metrics as QuantitativeValue objects
 * Supports locale-specific URLs and metadata
 * 
 * @param {string} htmlFilename - The case study filename
 * @param {Object} config - Configuration from page-config.json
 * @param {string} locale - Language locale code (default: 'en')
 */
export function generateCaseStudySchemas(htmlFilename, config, locale = 'en') {
  const localeConfig = getLocaleConfig(locale);
  const schemas = [];

  // Organization schema
  schemas.push(wrapSchemaTag(generateOrganizationSchema(locale)));

  // Case study schema with metrics
  const caseStudyUrl = buildLocaleUrl(config.url.replace('https://clodo.dev', ''), locale);

  // Article schema for case study
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: config.headline || config.title,
    description: config.description,
    url: caseStudyUrl,
    datePublished: new Date().toISOString(),
    inLanguage: localeConfig.locale || 'en-US',
    publisher: {
      '@type': 'Organization',
      name: 'Clodo',
      url: buildLocaleUrl('', locale)
    }
  };

  schemas.push(wrapSchemaTag(articleSchema));

  // Metrics as ItemList with QuantitativeValues
  if (config.metrics && Array.isArray(config.metrics)) {
    const metricsSchema = generateMetricsItemList(config.metrics);
    schemas.push(wrapSchemaTag(metricsSchema));
  }

  // Breadcrumb
  const breadcrumbs = [
    { name: 'Home', item: 'https://clodo.dev' },
    { name: 'Case Studies', item: 'https://clodo.dev/case-studies' },
    { name: config.headline || config.title, item: config.url }
  ];
  schemas.push(wrapSchemaTag(generateBreadcrumbList(breadcrumbs)));

  return schemas.join('\n');
}

/**
 * Batch generate schemas for all pages from config
 * Returns object with htmlFilename -> schemas mapping
 */
export function generateAllPageSchemas() {
  const pageConfig = loadPageConfiguration();
  const allSchemas = {};

  // Generate blog post schemas
  if (pageConfig.blogPosts) {
    for (const [filename, config] of Object.entries(pageConfig.blogPosts)) {
      allSchemas[filename] = generateBlogPostSchemas(filename, config);
    }
  }

  // Generate case study schemas
  if (pageConfig.caseStudies) {
    for (const [filename, config] of Object.entries(pageConfig.caseStudies)) {
      allSchemas[filename] = generateCaseStudySchemas(filename, config);
    }
  }

  // Generate page-specific schemas
  if (pageConfig.pages) {
    for (const [pageName, config] of Object.entries(pageConfig.pages)) {
      const schemas = [];
      schemas.push(wrapSchemaTag(generateOrganizationSchema()));

      if (config.type === 'FAQPage') {
        schemas.push(wrapSchemaTag(generateFAQPageSchema(config.faqs || [])));
      } else if (config.type === 'LearningResource') {
        schemas.push(wrapSchemaTag(generateLearningResourceSchema(config)));
      }

      allSchemas[`${pageName}.html`] = schemas.join('\n');
    }
  }

  return allSchemas;
}

export default {
  generateOrganizationSchema,
  generateBreadcrumbList,
  generateTechArticleSchema,
  generateFAQPageSchema,
  generateQuantitativeValue,
  generateMetricsItemList,
  generateProductSchema,
  generateHowToSchema,
  generateLearningResourceSchema,
  generatePageSchemas,
  generateBlogPostSchemas,
  generateCaseStudySchemas,
  generateAllPageSchemas,
  loadPageConfiguration,
  wrapSchemaTag,
  loadData
};
