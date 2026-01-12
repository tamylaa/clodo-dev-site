#!/usr/bin/env node

/**
 * Build Integration for Schema Generation
 * 
 * This module integrates the schema generator with the build process.
 * Called from build.js to automatically inject generated schemas into HTML files.
 * 
 * Usage in build.js:
 * import { injectSchemasIntoHTML } from './schema/build-integration.js';
 * 
 * During HTML processing:
 * htmlContent = injectSchemasIntoHTML(htmlFilename, htmlContent);
 */

import {
  generateBlogPostSchemas,
  generateCaseStudySchemas,
  generateAllPageSchemas,
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateSoftwareApplicationSchema,
  generateFAQPageSchema,
  generateLearningResourceSchema,
  generateBreadcrumbList,
  loadPageConfiguration
} from './schema-generator.js';
import {
  detectLocaleFromPath,
  getLocaleConfig,
  shouldInjectSchemas
} from './locale-utils.js';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * Loads schema from a separate JSON file if it exists
 * @param {string} schemaName - Name of the schema file (without .json extension)
 * @returns {object|null} Parsed JSON schema or null if file doesn't exist
 */
function loadSchemaFromFile(schemaName) {
  const schemaPath = join('data', 'schemas', `${schemaName}.json`);
  if (existsSync(schemaPath)) {
    try {
      const schemaContent = readFileSync(schemaPath, 'utf8');
      return JSON.parse(schemaContent);
    } catch (e) {
      console.warn(`Failed to load schema file ${schemaPath}:`, e.message);
      return null;
    }
  }
  return null;
}

/**
 * Loads all page-specific schema files for a given page
 * @param {string} pageName - Name of the page (without .html extension)
 * @returns {Array} Array of loaded schema objects
 */
function loadPageSchemas(pageName) {
  const schemas = [];
  const schemasDir = join('data', 'schemas');
  
  // Check if schemas directory exists
  if (!existsSync(schemasDir)) {
    return schemas;
  }
  
  try {
    // Get all files in the schemas directory
    const files = readdirSync(schemasDir);
    
    // Look for files that match the pattern: ${pageName}-*.json
    const pageSchemaPattern = new RegExp(`^${pageName}-.*.json$`);
    
    for (const file of files) {
      if (pageSchemaPattern.test(file)) {
        const schemaName = file.replace(/\.json$/, '');
        const schema = loadSchemaFromFile(schemaName);
        if (schema) {
          schemas.push(schema);
        }
      }
    }
  } catch (e) {
    console.warn(`Failed to read schemas directory:`, e.message);
  }
  
  return schemas;
}

/**
 * Injects generated schemas into HTML content
 * Detects locale from file path (e.g., i18n/de/page.html → 'de')
 * Replaces existing schema blocks with generated ones based on filename
 * 
 * @param {string} htmlFilePath - The full HTML file path (e.g., 'public/i18n/de/docs.html' or 'public/blog/post.html')
 * @param {string} htmlContent - The full HTML content
 * @returns {string} HTML content with injected schemas
 */
export function injectSchemasIntoHTML(htmlFilePath, htmlContent) {
  // Skip schema injection for files that shouldn't have schemas
  if (!shouldInjectSchemas(htmlFilePath)) {
    console.log(`   ⏭️  Skipping schema injection for: ${htmlFilePath}`);
    return htmlContent;
  }

  // Detect locale from file path
  const locale = detectLocaleFromPath(htmlFilePath);
  
  const pageConfig = loadPageConfiguration();
  
  // Extract just the filename for config lookup
  const filename = htmlFilePath.split(/[\\/]/).pop();
  
  console.log(`   📋 Injecting schemas into: ${filename} (locale: ${locale})`);
  
  // Check if this file has a schema config
  let generatedSchemas = null;

  // Check blog posts
  if (pageConfig.blogPosts?.[filename]) {
    const config = pageConfig.blogPosts[filename];
    generatedSchemas = generateBlogPostSchemas(filename, config, locale);
  }

  // Check case studies
  else if (pageConfig.caseStudies?.[filename]) {
    const config = pageConfig.caseStudies[filename];
    generatedSchemas = generateCaseStudySchemas(filename, config, locale);
  }

  // For all pages (including root pages like index.html, docs.html, etc.)
  // Always inject Organization, WebSite, and other default schemas
  else {
    const schemas = [];
    
    // All pages get Organization schema
    schemas.push(generateOrganizationSchema(locale));
    
    // All pages get WebSite schema  
    schemas.push(generateWebSiteSchema(locale));
    
    // Load all page-specific schema files
    const pageName = filename.replace(/\.html$/, '');
    const pageSchemas = loadPageSchemas(pageName);

    // If the page provides its own SoftwareApplication schema, prefer that and skip the generated one
    const hasSoftwareSchema = pageSchemas.some(s => (s && (s['@type'] === 'SoftwareApplication' || (Array.isArray(s['@type']) && s['@type'].includes('SoftwareApplication')))));
    if (!hasSoftwareSchema) {
      // All pages get SoftwareApplication schema (unless overridden by page file)
      // For product pages that mention Wrangler, add an explicit feature highlighting Wrangler automation
      const softwareSchema = generateSoftwareApplicationSchema(locale);
      const mentionsWrangler = /wrangler/i.test(htmlContent) || pageName === 'product';
      if (mentionsWrangler) {
        softwareSchema.featureList = Array.from(new Set([...(softwareSchema.featureList || []), 'Cloudflare Wrangler automation — deployments, D1 migrations, and rollbacks']));
      }
      schemas.push(softwareSchema);
    }

    schemas.push(...pageSchemas);
    
    // Check if this page has a specific configuration
    if (pageConfig.pages?.[pageName]) {
      const config = pageConfig.pages[pageName];
      
      if (config.type === 'FAQPage') {
        schemas.push(generateFAQPageSchema(config.faqs || []));
      } else if (config.type === 'LearningResource') {
        schemas.push(generateLearningResourceSchema(config));
      }
    }
    // Heuristics for pages without explicit config:
    //  - If the HTML contains breadcrumb markup, auto-generate BreadcrumbList
    //  - If the HTML looks like an article (has <article> or og:type=article), add Article schema
    //  - If the HTML contains FAQ items (.faq-item), extract Q&A and add FAQPage schema
    try {
      // Breadcrumb detection: parse anchors inside <nav class="breadcrumbs"> or <nav aria-label="Breadcrumb">
      const breadcrumbNavMatch = htmlContent.match(/<nav[^>]*class=["']?breadcrumbs["']?[^>]*>[\s\S]*?<\/nav>/i) || htmlContent.match(/<nav[^>]*aria-label=["']?Breadcrumb["']?[^>]*>[\s\S]*?<\/nav>/i);
      if (breadcrumbNavMatch) {
        const navHtml = breadcrumbNavMatch[0];
        const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        let m;
        const items = [];
        while ((m = linkRegex.exec(navHtml)) !== null) {
          const href = m[1];
          const name = m[2].replace(/<[^>]+>/g, '').trim();
          const url = href.startsWith('http') ? href : `https://www.clodo.dev${href.startsWith('/') ? '' : '/'}${href.replace(/^\//, '')}`;
          items.push({ name, url });
        }
        // Attempt to capture the last non-link breadcrumb label (e.g., <span>Current Page</span>)
        const lastLabelMatch = navHtml.match(/<(?:(?:span|div|li)[^>]*)(?:[^>]*?)>([^<]+)<\/(?:span|div|li)>/i);
        if (lastLabelMatch && lastLabelMatch[1]) {
          const lastName = lastLabelMatch[1].trim();
          if (!items.find(it => it.name === lastName)) {
            // Use canonical or site root as the URL for final breadcrumb when not linked
            const canonicalMatch = htmlContent.match(/<link rel=["']canonical["'] href=["']([^"']+)["']\s*\/>/i);
            const lastUrl = canonicalMatch ? canonicalMatch[1] : `https://www.clodo.dev`;
            items.push({ name: lastName, url: lastUrl });
          }
        }
        if (items.length) {
          schemas.push(generateBreadcrumbList(items));
        }
      }

      // FAQ detection: simple extraction from .faq-item / .faq-question / .faq-answer markup
      if (/class=["']?faq-item["']?/i.test(htmlContent)) {
        const faqRegex = /<div[^>]*class=["']?faq-item["']?[^>]*>[\s\S]*?<div[^>]*class=["']?faq-question["']?[^>]*>([\s\S]*?)<\/div>[\s\S]*?<div[^>]*class=["']?faq-answer["']?[^>]*>([\s\S]*?)<\/div>/gi;
        let fm;
        const faqs = [];
        while ((fm = faqRegex.exec(htmlContent)) !== null) {
          const q = fm[1].replace(/<[^>]+>/g, '').trim();
          const a = fm[2].replace(/<[^>]+>/g, '').trim();
          if (q && a) faqs.push({ name: q, acceptedAnswer: a });
        }
        if (faqs.length) {
          schemas.push(generateFAQPageSchema(faqs));
        }
      }

      // Article detection: look for <article> or og:type=article or meta[type]=article
      if (/<article[\s>]/i.test(htmlContent) || /<meta[^>]*property=["']og:type["'][^>]*content=["']article["'][^>]*>/i.test(htmlContent) || /<meta[^>]*name=["']twitter:card["'][^>]*content=["']summary_large_image["'][^>]*>/i.test(htmlContent)) {
        const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
        const canonicalMatch = htmlContent.match(/<link rel=["']canonical["'] href=["']([^"']+)["']\s*\/>/i);
        const pageUrl = canonicalMatch ? canonicalMatch[1] : null;
        const headline = titleMatch ? titleMatch[1].trim() : '';
        if (headline) {
          const articleSchema = {
            '@context': 'https://schema.org',
            '@type': 'Article',
            'headline': headline,
            'url': pageUrl
          };
          schemas.push(articleSchema);
        }
      }
    } catch (e) {
      console.warn('Schema heuristics failed:', e.message);
    }    
    // Wrap all schemas with tags and join
    generatedSchemas = schemas
      .filter(Boolean)
      .map(schema => `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`)
      .join('\n');
  }

  // If no schema was generated, return original content
  if (!generatedSchemas) {
    console.warn(`   ⚠️  No schemas generated for: ${filename}`);
    return htmlContent;
  }

  console.log(`   ✅ Generated ${(generatedSchemas.match(/<script type="application\/ld\+json">/g) || []).length} schema(s) for: ${filename}`);

  // Replace or inject schemas
  // Strategy: Remove old inline schemas and inject new ones in <head>
  
  // Remove existing schema script tags to avoid duplication
  let cleanedHTML = htmlContent.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/g,
    ''
  );

  // Inject schemas in the head section (before closing </head>)
  if (cleanedHTML.includes('</head>')) {
    cleanedHTML = cleanedHTML.replace(
      '</head>',
      `${generatedSchemas}\n</head>`
    );
  } else {
    // If no head section, add at the beginning
    cleanedHTML = generatedSchemas + '\n' + cleanedHTML;
  }

  return cleanedHTML;
}

/**
 * Pre-generates all schemas and caches them
 * Useful for logging/debugging before building
 * 
 * @returns {Object} Map of filename -> schemas
 */
export function preGenerateAllSchemas() {
  try {
    return generateAllPageSchemas();
  } catch (error) {
    console.error('Error pre-generating schemas:', error.message);
    return {};
  }
}

/**
 * Reports which files have schema configs
 * Useful for verification that all pages are configured
 * 
 * @returns {Object} Configuration report
 */
export function getConfigurationReport() {
  const pageConfig = loadPageConfiguration();
  
  return {
    blogPostsConfigured: Object.keys(pageConfig.blogPosts || {}).length,
    caseStudiesConfigured: Object.keys(pageConfig.caseStudies || {}).length,
    pagesConfigured: Object.keys(pageConfig.pages || {}).length,
    blogPosts: Object.keys(pageConfig.blogPosts || {}),
    caseStudies: Object.keys(pageConfig.caseStudies || {}),
    pages: Object.keys(pageConfig.pages || {}),
    totalConfiguredPages: (
      Object.keys(pageConfig.blogPosts || {}).length +
      Object.keys(pageConfig.caseStudies || {}).length +
      Object.keys(pageConfig.pages || {}).length
    )
  };
}

/**
 * Validates that all schema configs reference valid files
 * Warns if config exists for non-existent pages
 * 
 * @param {string[]} builtFiles - Array of HTML files that were built
 * @returns {Object} Validation report with warnings and suggestions
 */
export function validateSchemaConfigs(builtFiles) {
  const pageConfig = loadPageConfiguration();
  const warnings = [];
  const suggestions = [];

  // Check blog posts config
  for (const configuredFile of Object.keys(pageConfig.blogPosts || {})) {
    if (!builtFiles.includes(configuredFile)) {
      warnings.push(`Blog post configured but not built: ${configuredFile}`);
    }
  }

  // Check case studies config
  for (const configuredFile of Object.keys(pageConfig.caseStudies || {})) {
    if (!builtFiles.includes(configuredFile)) {
      warnings.push(`Case study configured but not built: ${configuredFile}`);
    }
  }

  // Suggest schema configs for common files without configs
  const commonPages = [
    'index.html',
    'pricing.html',
    'product.html',
    'docs.html',
    'examples.html'
  ];

  for (const page of commonPages) {
    if (builtFiles.includes(page) && 
        !pageConfig.pages?.[page.replace('.html', '')] &&
        !pageConfig.blogPosts?.[page] &&
        !pageConfig.caseStudies?.[page]) {
      suggestions.push(`Consider adding schema config for: ${page}`);
    }
  }

  return {
    valid: warnings.length === 0,
    warnings,
    suggestions,
    report: getConfigurationReport()
  };
}

export default {
  injectSchemasIntoHTML,
  preGenerateAllSchemas,
  getConfigurationReport,
  validateSchemaConfigs
};
