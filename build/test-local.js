#!/usr/bin/env node

/**
 * Local Testing Assistant
 * 
 * Helps validate the site before merging to production
 * Tests critical pages, links, and functionality
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

console.log('\n🧪 LOCAL TESTING ASSISTANT\n');
console.log('=' .repeat(50));

let passed = 0;
let warnings = 0;
let failed = 0;

function check(condition, message, type = 'check') {
  if (type === 'check') {
    if (condition) {
      console.log(`✅ ${message}`);
      passed++;
    } else {
      console.log(`❌ ${message}`);
      failed++;
    }
  } else if (type === 'warn') {
    console.log(`⚠️  ${message}`);
    warnings++;
  } else if (type === 'info') {
    console.log(`ℹ️  ${message}`);
  }
}

// 1. Check source files exist
console.log('\n📁 Checking Source Files:');

const pagesToCheck = [
  'src/pages/index.astro',
  'src/pages/pricing.astro',
  'src/pages/product.astro',
  'src/pages/docs.astro',
  'src/pages/blog/index.astro',
  'src/layouts/BaseLayout.astro',
];

pagesToCheck.forEach(page => {
  const exists = fs.existsSync(path.join(rootDir, page));
  check(exists, `${page.split('/').pop()}`);
});

// 2. Check JSON blog posts
console.log('\n📝 Checking Blog Posts:');

const postsToCheck = [
  'data/posts/cloudflare-workers-tutorial-beginners.json',
  'data/posts/cloudflare-infrastructure-myth.json',
];

postsToCheck.forEach(post => {
  const filePath = path.join(rootDir, post);
  const exists = fs.existsSync(filePath);
  check(exists, `${post.split('/').pop()}`);
});

// 3. Check configuration files
console.log('\n⚙️  Checking Configuration:');

const configsToCheck = [
  'config/wrangler.toml',
  'astro.config.mjs',
  'package.json',
];

configsToCheck.forEach(config => {
  const filePath = path.join(rootDir, config);
  const exists = fs.existsSync(filePath);
  check(exists, `${config}`);
});

// 4. Verify wrangler.toml has Astro output
console.log('\n🔧 Checking Configuration Content:');

const wranglerPath = path.join(rootDir, 'config', 'wrangler.toml');
const wranglerContent = fs.readFileSync(wranglerPath, 'utf-8');
check(
  wranglerContent.includes('dist-astro/client'),
  'wrangler.toml uses Astro output'
);

// 5. Verify package.json build script
const packageJsonPath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
check(
  packageJson.scripts.build === 'npm run build:astro',
  'build script uses Astro'
);

// 6. Check for node_modules
console.log('\n📦 Checking Dependencies:');

const nodeModulesExists = fs.existsSync(path.join(rootDir, 'node_modules'));
check(nodeModulesExists, 'node_modules installed');

// 7. Check git status
console.log('\n🔗 Git Status:');

try {
  const gitConfigPath = path.join(rootDir, '.git');
  const isGitRepo = fs.existsSync(gitConfigPath);
  check(isGitRepo, 'Git repository initialized');
} catch (e) {
  check(false, 'Git repository check');
}

// 8. Summary and next steps
console.log('\n' + '='.repeat(50));
console.log(`\n📋 Testing Summary:`);
console.log(`  ✅ Passed: ${passed}`);
console.log(`  ⚠️  Warnings: ${warnings}`);
console.log(`  ❌ Failed: ${failed}`);

console.log('\n📌 Next Steps for Local Testing:');
console.log(`
1. Dev server should be running at: http://localhost:4321/

2. Test the following:
   ✓ Homepage (/) loads and renders
   ✓ Navigation menu works
   ✓ Blog page (/blog/) displays posts
   ✓ Pricing page (/pricing/) shows pricing
   ✓ Responsive design (test on mobile/tablet)
   ✓ Links don't have errors
   ✓ No console errors (F12 → Console)

3. Check browser console for errors:
   - Open DevTools: F12
   - Go to Console tab
   - Look for red error messages

4. After testing locally:
   - Stop dev server: Ctrl+C
   - Run: npm run build
   - Run: npm run verify:deployment
   - If all pass, ready to merge

5. Refer to LOCAL_TESTING_GUIDE.md for:
   - Complete testing checklist
   - Page-by-page test procedures
   - Common issues and solutions
`);

console.log('📚 Documentation:');
console.log('  → LOCAL_TESTING_GUIDE.md (comprehensive checklist)');
console.log('  → DEPLOYMENT_STATUS.md (deployment guide)');
console.log('  → BLOG_IMPLEMENTATION.md (blog details)');

console.log('\n✨ Ready for Local QA Testing!\n');

if (failed === 0) {
  console.log('🟢 All pre-flight checks passed!\n');
  process.exit(0);
} else {
  console.log('🔴 Some checks failed. Review above.\n');
  process.exit(1);
}
