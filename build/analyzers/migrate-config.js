#!/usr/bin/env node

/**
 * Configuration Migration Helper
 * Updates analyzer scripts to use centralized configuration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Migration mappings: old hardcoded values -> new config paths
const MIGRATION_MAP = {
  // URLs
  "'https://www.clodo.dev'": "ANALYZER_CONFIG.urls.production",
  "'http://localhost:8000'": "ANALYZER_CONFIG.urls.development",
  "'https://www.webpagetest.org'": "ANALYZER_CONFIG.urls.webpagetest",

  // Ports
  '38200': 'getPort("devServer")',
  '8000': 'ANALYZER_CONFIG.ports.lighthouse',

  // Timeouts
  '30000': 'ANALYZER_CONFIG.timeouts.pageLoad',
  '500': 'ANALYZER_CONFIG.timeouts.performanceMonitorWait',
  '20': 'ANALYZER_CONFIG.timeouts.performanceMonitorMaxAttempts',
  '10000': 'ANALYZER_CONFIG.timeouts.smokeTestReady',
  '15000': 'ANALYZER_CONFIG.timeouts.smokeTestExtended',
  '2300': 'ANALYZER_CONFIG.timeouts.mutationObserver',

  // SEO Keywords
  "['wrangler', 'cloudflare workers', 'serverless', 'ruby on rails for cloudflare', 'scaffolding for workers', 'worker migration', 'rails cloudflare integration', 'serverless framework comparison']":
    'ANALYZER_CONFIG.seo.targetKeywords',

  // WebPageTest locations
  "['Dulles:Chrome', 'Frankfurt:Chrome', 'Mumbai:Chrome', 'SAO:Chrome']":
    'ANALYZER_CONFIG.webpagetest.locations',

  // Smoke test URLs
  "['/', '/docs', '/case-studies', '/case-studies/healthcare-saas-platform', '/blog/building-developer-communities', '/migrate']":
    'ANALYZER_CONFIG.smokeTest.urls'
};

const IMPORT_STATEMENT = "import { ANALYZER_CONFIG, getBaseUrl, isDevelopment, getPort } from '../config.js';\n";

function migrateFile(filePath) {
  console.log(`🔄 Migrating ${path.relative(__dirname, filePath)}...`);

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Add import statement if not present and if file uses config values
  let hasImport = content.includes("from '../config.js'");
  let needsImport = false;

  // Apply migrations
  for (const [oldValue, newValue] of Object.entries(MIGRATION_MAP)) {
    if (content.includes(oldValue)) {
      content = content.replace(new RegExp(oldValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newValue);
      modified = true;
      needsImport = true;
    }
  }

  // Special handling for BASE_URL patterns
  const baseUrlPatterns = [
    /const BASE_URL = process\.argv\[2\] \|\| ['"`]https:\/\/www\.clodo\.dev['"`];?/,
    /let BASE_URL = ['"`]http:\/\/localhost:8000['"`];?/
  ];

  baseUrlPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, 'const BASE_URL = getBaseUrl();');
      modified = true;
      needsImport = true;
    }
  });

  // Add import if needed
  if (needsImport && !hasImport) {
    // Find the first import or require statement
    const importMatch = content.match(/^import\s+.*from\s+['"`].*['"`];?/m);
    const requireMatch = content.match(/^const\s+.*=\s+require\(/m);

    if (importMatch) {
      content = content.replace(importMatch[0], IMPORT_STATEMENT + importMatch[0]);
    } else if (requireMatch) {
      content = content.replace(requireMatch[0], IMPORT_STATEMENT + requireMatch[0]);
    } else {
      // Add at the top after shebang
      const shebangMatch = content.match(/^#!.*$/m);
      if (shebangMatch) {
        content = content.replace(shebangMatch[0], shebangMatch[0] + '\n' + IMPORT_STATEMENT);
      } else {
        content = IMPORT_STATEMENT + '\n' + content;
      }
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated ${path.relative(__dirname, filePath)}`);
  } else {
    console.log(`⏭️  No changes needed for ${path.relative(__dirname, filePath)}`);
  }
}

function migrateAllFiles() {
  const analyzersDir = __dirname;

  // Files to migrate (excluding config.js and this migration script)
  const filesToMigrate = [
    'performance/lighthouse-runner.js',
    'performance/webpagetest-runner.js',
    'seo/seo-tracker.js',
    'seo/keyword-ranking-tracker.js',
    'testing/runtime-smoke-check.js',
    'validation/page-load-tester.js',
    'lcp-checker.js'
  ];

  console.log('🚀 Starting analyzer configuration migration...\n');

  filesToMigrate.forEach(file => {
    const fullPath = path.join(analyzersDir, file);
    if (fs.existsSync(fullPath)) {
      migrateFile(fullPath);
    } else {
      console.log(`⚠️  File not found: ${file}`);
    }
  });

  console.log('\n🎉 Migration complete!');
  console.log('📝 Review the changes and test the analyzers to ensure they work correctly.');
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateAllFiles();
}

export { migrateFile, migrateAllFiles };