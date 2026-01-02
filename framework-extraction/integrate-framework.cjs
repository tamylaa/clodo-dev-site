#!/usr/bin/env node

/**
 * Framework Integration Script
 *
 * This script helps integrate extracted framework components into clodo-web-starter
 */

const fs = require('fs');
const path = require('path');

// Configuration
const EXTRACTION_DIR = __dirname;
const STARTER_DIR = path.join(__dirname, '..', '..', 'clodo-web-starter');

// Integration mapping
const INTEGRATION_MAP = {
  'build-tools': 'build',
  'content-tools': 'build',
  'validation-tools': 'build',
  'deployment-tools': 'build',
  'templates': 'templates',
  'config/templates': 'config'
};

/**
 * Copy directory recursively
 */
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`⚠ Source directory not found: ${src}`);
    return;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const files = fs.readdirSync(src);
  for (const file of files) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✓ Copied: ${path.relative(EXTRACTION_DIR, srcPath)} → ${path.relative(STARTER_DIR, destPath)}`);
    }
  }
}

/**
 * Integrate all components
 */
function integrateComponents() {
  console.log('🚀 Integrating framework components into clodo-web-starter...\n');

  if (!fs.existsSync(STARTER_DIR)) {
    console.error(`✗ clodo-web-starter directory not found: ${STARTER_DIR}`);
    console.log('Please ensure clodo-web-starter is cloned alongside clodo-dev-site');
    process.exit(1);
  }

  let totalFiles = 0;

  for (const [sourceDir, targetDir] of Object.entries(INTEGRATION_MAP)) {
    const srcPath = path.join(EXTRACTION_DIR, sourceDir);
    const destPath = path.join(STARTER_DIR, targetDir);

    console.log(`\n📁 Integrating ${sourceDir} → ${targetDir}`);
    const beforeCount = countFiles(destPath);
    copyDir(srcPath, destPath);
    const afterCount = countFiles(destPath);
    const addedFiles = afterCount - beforeCount;

    console.log(`Added ${addedFiles} files to ${targetDir}`);
    totalFiles += addedFiles;
  }

  console.log(`\n📊 Integration Summary:`);
  console.log(`   ✓ Total files integrated: ${totalFiles}`);
  console.log(`   📁 Target project: ${STARTER_DIR}`);
}

/**
 * Count files in directory recursively
 */
function countFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;

  let count = 0;
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      count += countFiles(itemPath);
    } else {
      count++;
    }
  }

  return count;
}

/**
 * Create integration manifest
 */
function createIntegrationManifest() {
  const manifest = {
    integrationDate: new Date().toISOString(),
    sourceDir: EXTRACTION_DIR,
    targetDir: STARTER_DIR,
    integratedComponents: Object.keys(INTEGRATION_MAP).map(source => ({
      source: source,
      target: INTEGRATION_MAP[source],
      fileCount: countFiles(path.join(EXTRACTION_DIR, source))
    })),
    nextSteps: [
      'Review integrated files for path updates',
      'Test build process in clodo-web-starter',
      'Update package.json scripts if needed',
      'Run validation tools to ensure everything works'
    ]
  };

  const manifestPath = path.join(STARTER_DIR, 'integration-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✓ Created integration-manifest.json in clodo-web-starter');
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'integrate';

  console.log('Framework Integration Tool');
  console.log('==========================');

  switch (command) {
    case 'integrate':
      integrateComponents();
      createIntegrationManifest();
      break;

    case 'preview':
      console.log('📋 Integration Preview:');
      console.log(`Source: ${EXTRACTION_DIR}`);
      console.log(`Target: ${STARTER_DIR}`);
      console.log('\nComponents to integrate:');
      Object.entries(INTEGRATION_MAP).forEach(([source, target]) => {
        const srcPath = path.join(EXTRACTION_DIR, source);
        const fileCount = countFiles(srcPath);
        console.log(`  ${source} (${fileCount} files) → ${target}`);
      });
      break;

    default:
      console.log('Usage: node integrate-framework.cjs [command]');
      console.log('Commands:');
      console.log('  integrate - Integrate all framework components');
      console.log('  preview   - Preview what will be integrated');
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  integrateComponents,
  createIntegrationManifest
};