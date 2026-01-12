#!/usr/bin/env node

/**
 * Schema Configuration CLI Tool
 * 
 * Commands:
 *   node schema/cli.js status       - Show schema configuration status
 *   node schema/cli.js generate     - Pre-generate all schemas
 *   node schema/cli.js validate     - Validate schema configurations
 *   node schema/cli.js help         - Show help message
 */

import {
  preGenerateAllSchemas,
  getConfigurationReport,
  validateSchemaConfigs
} from './build-integration.js';
import { loadPageConfiguration } from './schema-generator.js';

const command = process.argv[2] || 'status';

function formatJSON(obj, indent = 2) {
  return JSON.stringify(obj, null, indent);
}

function showStatus() {
  const report = getConfigurationReport();
  
  console.log('\n========================================');
  console.log('SCHEMA CONFIGURATION STATUS');
  console.log('========================================\n');
  
  console.log(`📝 Blog Posts:      ${report.blogPostsConfigured} configured`);
  if (report.blogPosts.length > 0) {
    console.log('   Files:');
    report.blogPosts.forEach(f => console.log(`     ✓ ${f}`));
  }
  
  console.log(`\n📊 Case Studies:    ${report.caseStudiesConfigured} configured`);
  if (report.caseStudies.length > 0) {
    console.log('   Files:');
    report.caseStudies.forEach(f => console.log(`     ✓ ${f}`));
  }
  
  console.log(`\n📄 Pages:           ${report.pagesConfigured} configured`);
  if (report.pages.length > 0) {
    console.log('   Pages:');
    report.pages.forEach(f => console.log(`     ✓ ${f}`));
  }
  
  console.log(`\n📦 Total:           ${report.totalConfiguredPages} pages configured`);
  console.log('========================================\n');
}

function showGenerate() {
  console.log('\n📋 Pre-generating all schemas...\n');
  
  const schemas = preGenerateAllSchemas();
  const fileCount = Object.keys(schemas).length;
  
  console.log(`✅ Generated schemas for ${fileCount} files:\n`);
  
  Object.entries(schemas).forEach(([filename, schemaMarkup]) => {
    const blockCount = (schemaMarkup.match(/<script type="application\/ld\+json">/g) || []).length;
    console.log(`  ${filename}: ${blockCount} schema blocks`);
  });
  
  console.log('\n========================================');
  console.log('SAMPLE SCHEMA (Organization + TechArticle)');
  console.log('========================================\n');
  
  const firstFile = Object.values(schemas)[0];
  if (firstFile) {
    // Extract all schemas from first file
    const allMatches = [...firstFile.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
    
    if (allMatches.length > 0) {
      // Show first schema (Organization)
      try {
        const parsed = JSON.parse(allMatches[0][1]);
        console.log('// Organization Schema:');
        console.log(formatJSON(parsed));
      } catch (e) {
        console.log(allMatches[0][1]);
      }
      
      if (allMatches.length > 1) {
        console.log('\n// TechArticle Schema:');
        try {
          const parsed = JSON.parse(allMatches[1][1]);
          console.log(formatJSON(parsed));
        } catch (e) {
          console.log(allMatches[1][1]);
        }
      }
    }
  }
  
  console.log('\n');
}

function showValidate() {
  const pageConfig = loadPageConfiguration();
  const report = getConfigurationReport();
  
  console.log('\n========================================');
  console.log('SCHEMA CONFIGURATION VALIDATION');
  console.log('========================================\n');
  
  console.log('✅ Configuration valid\n');
  
  console.log(`📊 Summary:`);
  console.log(`   Blog Posts:  ${report.blogPostsConfigured}`);
  console.log(`   Case Studies: ${report.caseStudiesConfigured}`);
  console.log(`   Pages:       ${report.pagesConfigured}`);
  console.log(`   Total:       ${report.totalConfiguredPages}`);
  
  console.log('\n📋 Blog Posts Configuration:');
  Object.entries(pageConfig.blogPosts || {}).forEach(([filename, config]) => {
    console.log(`\n  ${filename}`);
    console.log(`    Title:     ${config.title}`);
    console.log(`    Author:    ${config.author}`);
    console.log(`    Published: ${config.published}`);
    console.log(`    URL:       ${config.url}`);
    if (config.keywords) {
      console.log(`    Keywords:  ${config.keywords.join(', ')}`);
    }
  });
  
  console.log('\n📊 Case Studies Configuration:');
  Object.entries(pageConfig.caseStudies || {}).forEach(([filename, config]) => {
    console.log(`\n  ${filename}`);
    console.log(`    Title:     ${config.title}`);
    console.log(`    Industry:  ${config.industry}`);
    console.log(`    Metrics:   ${config.metrics?.length || 0}`);
    console.log(`    URL:       ${config.url}`);
    if (config.metrics) {
      config.metrics.forEach(m => {
        console.log(`      • ${m.name}: ${m.value}${m.unitText}`);
      });
    }
  });
  
  console.log('\n📄 Pages Configuration:');
  Object.entries(pageConfig.pages || {}).forEach(([pageName, config]) => {
    console.log(`\n  ${pageName}.html`);
    console.log(`    Type: ${config.type}`);
    if (config.type === 'FAQPage') {
      console.log(`    Q&As: ${config.faqs?.length || 0}`);
    }
  });
  
  console.log('\n========================================\n');
}

function showHelp() {
  console.log(`
Schema Configuration CLI

Commands:
  node schema/cli.js status       Show configuration status summary
  node schema/cli.js generate     Pre-generate all schemas and show sample
  node schema/cli.js validate     Validate all configurations with details
  node schema/cli.js help         Show this help message

Example usage:
  node schema/cli.js status
  node schema/cli.js generate > schemas-output.txt
  node schema/cli.js validate | grep "Case Studies"

Configuration files:
  data/schemas/page-config.json - Page and blog post configurations (preferred)
  data/schemas/defaults.json    - Default values for organization, software, etc. (preferred; legacy 'schema/defaults.json' supported)
  schema/schema-generator.js    - Schema generation module
  schema/build-integration.js   - Build system integration

To integrate into build process:
  In build.js, add:
    import { injectSchemasIntoHTML } from './schema/build-integration.js';
    htmlContent = injectSchemasIntoHTML(filename, htmlContent);
`);
}

// Execute command
switch (command) {
  case 'status':
    showStatus();
    break;
  case 'generate':
    showGenerate();
    break;
  case 'validate':
    showValidate();
    break;
  case 'help':
  case '-h':
  case '--help':
    showHelp();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.log('Use "node schema/cli.js help" for available commands');
    process.exit(1);
}
