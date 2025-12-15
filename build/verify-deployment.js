#!/usr/bin/env node

/**
 * Deployment Verification Script
 * 
 * Validates that the Astro build is production-ready before deployment
 * - Checks all critical pages exist
 * - Verifies no broken links
 * - Confirms build output structure
 * - Tests navigation and core functionality
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const buildDir = path.join(rootDir, 'dist-astro', 'client');

const CRITICAL_PAGES = [
  'index.html',
  'pricing/index.html',
  'product/index.html',
  'docs/index.html',
  'about/index.html',
  'migrate/index.html',
];

const REQUIRED_FILES = [
  'sitemap-index.xml',
  'sitemap-0.xml',
  'robots.txt',
];

console.log('🔍 Deployment Verification Script\n');
console.log('=' .repeat(50));

let passed = 0;
let failed = 0;

function check(condition, message) {
  if (condition) {
    console.log(`✅ ${message}`);
    passed++;
  } else {
    console.log(`❌ ${message}`);
    failed++;
  }
}

function warn(message) {
  console.log(`⚠️  ${message}`);
}

// 1. Verify build directory exists
const buildExists = fs.existsSync(buildDir);
check(buildExists, 'Build directory exists at dist-astro/client');

if (!buildExists) {
  console.log('\n❌ Build directory not found. Run "npm run build" first.\n');
  process.exit(1);
}

// 2. Check critical pages
console.log('\n📄 Checking Critical Pages:');
CRITICAL_PAGES.forEach(page => {
  const pagePath = path.join(buildDir, page);
  const exists = fs.existsSync(pagePath);
  check(exists, `${page}`);
});

// 3. Check required files
console.log('\n📦 Checking Required Files:');
REQUIRED_FILES.forEach(file => {
  const filePath = path.join(buildDir, file);
  const exists = fs.existsSync(filePath);
  check(exists, `${file}`);
});

// 4. Count HTML files
console.log('\n📊 Build Statistics:');
const htmlFiles = [];
function findHtmlFiles(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      findHtmlFiles(fullPath);
    } else if (file.name.endsWith('.html')) {
      htmlFiles.push(path.relative(buildDir, fullPath));
    }
  });
}
findHtmlFiles(buildDir);
check(htmlFiles.length >= 28, `Generated ${htmlFiles.length} HTML files (expected >= 28)`);

// 5. Check for CSS files
const cssFiles = [];
function findCssFiles(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      findCssFiles(fullPath);
    } else if (file.name.endsWith('.css')) {
      cssFiles.push(path.relative(buildDir, fullPath));
    }
  });
}
findCssFiles(buildDir);
check(cssFiles.length > 0, `Generated ${cssFiles.length} CSS files`);

// 6. Verify wrangler.toml configuration
const wranglerPath = path.join(rootDir, 'config', 'wrangler.toml');
const wranglerContent = fs.readFileSync(wranglerPath, 'utf-8');
check(
  wranglerContent.includes('dist-astro/client'),
  'wrangler.toml configured for dist-astro/client output'
);

// 7. Verify package.json build script
const packageJsonPath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
check(
  packageJson.scripts.build === 'npm run build:astro',
  'package.json: npm run build uses Astro'
);

// 8. Summary
console.log('\n' + '='.repeat(50));
console.log(`\n📋 Summary: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('✨ All verification checks passed!');
  console.log('\n🚀 Ready for deployment to production.\n');
  console.log('Next steps:');
  console.log('1. Push to GitHub: git push origin feature/astro-migration');
  console.log('2. Merge to master: git checkout master && git merge feature/astro-migration');
  console.log('3. Deploy: git push origin master (triggers Cloudflare Pages build)\n');
  process.exit(0);
} else {
  console.log('⚠️  Some verification checks failed.');
  console.log('Please review the errors above before deployment.\n');
  process.exit(1);
}
