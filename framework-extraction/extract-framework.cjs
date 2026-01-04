#!/usr/bin/env node

/**
 * Framework Extraction Script (CommonJS Version)
 *
 * This script helps identify and extract reusable components from clodo-dev-site
 * to the framework-extraction folder for later integration into clodo-web-starter.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SOURCE_DIR = path.join(__dirname, '..');
const EXTRACTION_DIR = __dirname;

// Files to extract with their target locations
const EXTRACTION_MAP = {
  // Build Tools - Core
  'build/build.js': 'build-tools/core-build.js',
  'build/dev-server.js': 'build-tools/dev-server.js',
  'build/analyze-css-changes.js': 'build-tools/css-analyzer.js',
  'build/generate-amp.js': 'content-tools/amp-generator.js',
  'build/demo-service-creation.js': 'build-tools/service-scaffolder.js',
  'build/clean-index-css.js': 'build-tools/css-cleaner.js',

  // Content Tools
  'build/generate-blog-post.mjs': 'content-tools/blog-generator.mjs',
  'build/content-effectiveness-analyzer.js': 'content-tools/content-analyzer.js',
  'build/keyword-ranking-tracker.js': 'content-tools/seo-tracker.js',

  // Validation Tools - Core
  'build/check-links.js': 'validation-tools/link-checker.js',
  'build/check-lcp.js': 'validation-tools/lcp-checker.js',
  'build/check-page-loading.js': 'validation-tools/page-load-tester.js',
  'build/seo-performance-test.js': 'validation-tools/seo-performance-test.js',
  'build/validate-headers.js': 'validation-tools/header-validator.js',
  'build/validate-redirects.js': 'validation-tools/redirect-validator.js',
  'build/check-visual.js': 'validation-tools/visual-regression.js',

  // Validation Tools - Advanced
  'build/check-analytics-visual.js': 'validation-tools/analytics-validator.js',
  'build/check-community-visual.js': 'validation-tools/community-validator.js',
  'build/check-index-visual.js': 'validation-tools/homepage-validator.js',
  'build/check-nav-stability.js': 'validation-tools/nav-validator.js',
  'build/check-production-button.js': 'validation-tools/prod-readiness.js',
  'build/check-lcp-node.js': 'validation-tools/lcp-node-checker.js',

  // Validation Tools - Observers
  'build/observe-header-change.js': 'validation-tools/observers/header-observer.js',
  'build/observe-images.js': 'validation-tools/observers/image-observer.js',
  'build/observe-mutations.js': 'validation-tools/observers/mutation-observer.js',

  // Development Tools
  'build/fix-canonicals.js': 'build-tools/canonical-fixer.js',
  'build/inspect-canonical.js': 'build-tools/canonical-inspector.js',
  'build/inspect-layout-shift.js': 'build-tools/layout-shift-inspector.js',

  // Deployment Tools
  'build/setup-clodo.js': 'deployment-tools/cloudflare-setup.js',
  'build/setup-clodo.ps1': 'deployment-tools/cloudflare-setup.ps1',
  'build/consolidate-footer.ps1': 'deployment-tools/footer-consolidator.ps1',
  'build/prod-main-current.js': 'deployment-tools/prod-config.js',
  'build/production-main.js': 'deployment-tools/prod-entry.js',
  'build/production-stackblitz.js': 'deployment-tools/stackblitz-config.js'
};

/**
 * Check if a file exists
 */
function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Copy a file from source to extraction directory
 */
function copyFile(sourcePath, targetPath) {
  const targetDir = path.dirname(targetPath);

  // Ensure target directory exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.copyFileSync(sourcePath, targetPath);
  console.log(`✓ Copied: ${path.relative(SOURCE_DIR, sourcePath)} → ${path.relative(EXTRACTION_DIR, targetPath)}`);
}

/**
 * Extract all mapped files
 */
function extractFiles() {
  console.log('🚀 Starting framework component extraction...\n');

  let successCount = 0;
  let skipCount = 0;

  for (const [sourceRelative, targetRelative] of Object.entries(EXTRACTION_MAP)) {
    const sourcePath = path.join(SOURCE_DIR, sourceRelative);
    const targetPath = path.join(EXTRACTION_DIR, targetRelative);

    if (fileExists(sourcePath)) {
      try {
        copyFile(sourcePath, targetPath);
        successCount++;
      } catch (error) {
        console.error(`✗ Failed to copy ${sourceRelative}: ${error.message}`);
      }
    } else {
      console.log(`⚠ Skipped: ${sourceRelative} (file not found)`);
      skipCount++;
    }
  }

  console.log(`\n📊 Extraction Summary:`);
  console.log(`   ✓ Successfully extracted: ${successCount} files`);
  console.log(`   ⚠ Skipped: ${skipCount} files`);
  console.log(`   📁 Total files processed: ${Object.keys(EXTRACTION_MAP).length}`);
}

/**
 * Extract templates
 */
function extractTemplates() {
  console.log('\n🏗️ Extracting templates...');

  const templateDirs = [
    'templates',           // All templates
    'templates/components',
    'templates/blog',
    'templates/partials',
    'templates/schema-partials'
  ];
  let templateCount = 0;

  for (const templateDir of templateDirs) {
    const sourceDir = path.join(SOURCE_DIR, templateDir);
    const targetDir = path.join(EXTRACTION_DIR, 'templates', path.basename(templateDir));

    if (fs.existsSync(sourceDir)) {
      // Copy entire directory
      fs.cpSync(sourceDir, targetDir, { recursive: true });
      const files = fs.readdirSync(targetDir, { recursive: true }).filter(f => fs.statSync(path.join(targetDir, f)).isFile());
      templateCount += files.length;
      console.log(`✓ Copied ${files.length} files from ${templateDir}`);
    } else {
      console.log(`⚠ Skipped: ${templateDir} (directory not found)`);
    }
  }

  console.log(`📄 Templates extracted: ${templateCount} files`);
}

/**
 * Extract configuration files
 */
function extractConfig() {
  console.log('\n⚙️ Extracting configuration files...');

  const configSource = path.join(SOURCE_DIR, 'config');
  const configTarget = path.join(EXTRACTION_DIR, 'config', 'templates');

  if (fs.existsSync(configSource)) {
    fs.cpSync(configSource, configTarget, { recursive: true });
    const files = fs.readdirSync(configTarget, { recursive: true }).filter(f => fs.statSync(path.join(configTarget, f)).isFile());
    console.log(`✓ Copied ${files.length} config files`);
  } else {
    console.log('⚠ Skipped: config directory not found');
  }
}

/**
 * Create extraction manifest
 */
function createManifest() {
  console.log('\n📋 Creating extraction manifest...');

  const manifest = {
    extractionDate: new Date().toISOString(),
    sourceProject: 'clodo-dev-site',
    targetProject: 'clodo-web-starter',
    extractedComponents: Object.keys(EXTRACTION_MAP).map(source => ({
      source: source,
      target: EXTRACTION_MAP[source],
      status: fileExists(path.join(SOURCE_DIR, source)) ? 'extracted' : 'not_found'
    })),
    notes: [
      'Files have been copied but may need modifications for framework use',
      'Remove site-specific paths and configurations',
      'Add configurable parameters for different projects',
      'Update import paths to work with new structure'
    ]
  };

  const manifestPath = path.join(EXTRACTION_DIR, 'extraction-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✓ Created extraction-manifest.json');
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'extract';

  console.log('Framework Extraction Tool');
  console.log('========================');

  switch (command) {
    case 'extract':
      extractFiles();
      extractTemplates();
      extractConfig();
      createManifest();
      break;

    case 'list':
      console.log('📂 Files to be extracted:');
      Object.entries(EXTRACTION_MAP).forEach(([source, target]) => {
        const exists = fileExists(path.join(SOURCE_DIR, source));
        console.log(`   ${exists ? '✓' : '✗'} ${source} → ${target}`);
      });
      break;

    case 'verify':
      console.log('🔍 Verifying extraction...');
      let missingCount = 0;
      Object.keys(EXTRACTION_MAP).forEach(source => {
        const sourcePath = path.join(SOURCE_DIR, source);
        if (!fileExists(sourcePath)) {
          console.log(`   ✗ Missing: ${source}`);
          missingCount++;
        }
      });
      console.log(`\n📊 Verification: ${missingCount} files missing`);
      break;

    default:
      console.log('Usage: node extract-framework.js [command]');
      console.log('Commands:');
      console.log('  extract  - Extract all framework components');
      console.log('  list     - List files to be extracted');
      console.log('  verify   - Verify all source files exist');
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  extractFiles,
  extractTemplates,
  extractConfig,
  createManifest
};