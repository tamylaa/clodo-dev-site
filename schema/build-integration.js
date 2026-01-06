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
  loadPageConfiguration
} from './schema-generator.js';
import {
  detectLocaleFromPath,
  getLocaleConfig,
  shouldInjectSchemas
} from './locale-utils.js';

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
    
    // All pages get SoftwareApplication schema
    schemas.push(generateSoftwareApplicationSchema(locale));
    
    // Check if this page has a specific configuration
    if (pageConfig.pages?.[filename?.replace(/\.html$/, '')]) {
      const config = pageConfig.pages[filename?.replace(/\.html$/, '')];
      
      if (config.type === 'FAQPage') {
        schemas.push(generateFAQPageSchema(config.faqs || []));
      } else if (config.type === 'LearningResource') {
        schemas.push(generateLearningResourceSchema(config));
      }
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
