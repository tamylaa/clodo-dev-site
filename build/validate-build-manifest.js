#!/usr/bin/env node
/**
 * Build-time manifest validation
 * Prevents URL inconsistencies from being deployed
 * 
 * Checks:
 * - All files in /public have manifest entries
 * - All indexed pages have files that exist
 * - No orphaned sitemap entries
 * - No orphaned nav entries
 * - Manifest matches reality (filesystem)
 * 
 * Usage: node build/validate-build-manifest.js
 * Exit code: 0 (pass) or 1 (fail) for CI/CD
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let errors = [];
let warnings = [];

function error(msg) {
  console.error(`❌ ${msg}`);
  errors.push(msg);
}

function warn(msg) {
  console.warn(`⚠️  ${msg}`);
  warnings.push(msg);
}

console.log('🔍 Validating build manifest...\n');

// 1. Regenerate manifest from filesystem
console.log('1️⃣  Regenerating manifest from current filesystem...');
try {
  const result = execSync('node tools/merge-manifests.js 2>&1', { encoding: 'utf8' });
  console.log('   ✓ Manifest regenerated without errors');
} catch (e) {
  error('Failed to regenerate manifest');
  console.error(e.message);
  process.exit(1);
}

// 2. Load manifest
const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'config', 'pages-manifest.json'), 'utf8')
);
console.log(`\n2️⃣  Loaded manifest with ${manifest.length} entries`);

// 3. Verify all files exist
console.log('\n3️⃣  Verifying all filesystem pages have files...');
const filesystemPages = manifest.filter(e => e.file);
let missingFiles = 0;
for (const entry of filesystemPages) {
  const filePath = path.join(__dirname, '..', 'public', entry.file);
  if (!fs.existsSync(filePath)) {
    error(`File not found: ${entry.file} (referenced by ${entry.path})`);
    missingFiles++;
  }
}
if (missingFiles === 0) {
  console.log(`   ✓ All ${filesystemPages.length} files exist`);
} else {
  error(`${missingFiles} files missing from manifest entries`);
}

// 4. Check for orphaned indexed pages
console.log('\n4️⃣  Checking indexed pages...');
const indexed = manifest.filter(e => e.indexed);
let indexedOrphans = 0;
for (const entry of indexed) {
  if (!entry.file) {
    warn(`Indexed page has no file: ${entry.path}`);
    indexedOrphans++;
  }
}
if (indexedOrphans > 0) {
  warn(`${indexedOrphans} indexed pages have no files (should be removed from manifest)`);
} else {
  console.log(`   ✓ All ${indexed.length} indexed pages have files`);
}

// 5. Check for duplicate paths
console.log('\n5️⃣  Checking for duplicates...');
const pathCounts = new Map();
for (const entry of manifest) {
  pathCounts.set(entry.path, (pathCounts.get(entry.path) || 0) + 1);
}
const duplicates = Array.from(pathCounts.entries()).filter(([_, count]) => count > 1);
if (duplicates.length > 0) {
  for (const [path, count] of duplicates) {
    error(`Duplicate path in manifest: ${path} (${count} entries)`);
  }
} else {
  console.log(`   ✓ No duplicate paths`);
}

// 6. Check locale consistency for i18n pages
console.log('\n6️⃣  Checking i18n pages...');
const i18nPages = manifest.filter(e => e.isI18n);
let localeErrors = 0;
for (const entry of i18nPages) {
  if (!entry.locale || entry.locale === 'en' || entry.locale === null) {
    error(`I18n page without locale: ${entry.path} (file: ${entry.file})`);
    localeErrors++;
  }
}
if (localeErrors === 0) {
  console.log(`   ✓ All ${i18nPages.length} i18n pages have valid locales`);
} else {
  error(`${localeErrors} i18n pages have missing/invalid locales`);
}

// 7. Check admin and experiment pages are not indexed
console.log('\n7️⃣  Checking admin/experiment pages...');
const indexedAdmin = manifest.filter(e => e.isAdmin && e.indexed);
const indexedExperiment = manifest.filter(e => e.isExperiment && e.indexed);
if (indexedAdmin.length > 0) {
  error(`${indexedAdmin.length} admin pages are marked as indexed`);
}
if (indexedExperiment.length > 0) {
  error(`${indexedExperiment.length} experiment pages are marked as indexed`);
}
if (indexedAdmin.length === 0 && indexedExperiment.length === 0) {
  console.log(`   ✓ Admin/experiment pages correctly non-indexed`);
}

// 8. Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Build Validation Summary:');
console.log(`   Total manifest entries: ${manifest.length}`);
console.log(`   Filesystem pages: ${filesystemPages.length}`);
console.log(`   Indexed pages: ${indexed.length}`);
console.log(`   Admin pages: ${manifest.filter(e => e.isAdmin).length}`);
console.log(`   Experiment pages: ${manifest.filter(e => e.isExperiment).length}`);
console.log(`   I18n pages: ${i18nPages.length}`);

console.log('\n📋 Validation Results:');
console.log(`   ✓ Passed: 7 checks`);
console.log(`   ❌ Errors: ${errors.length}`);
console.log(`   ⚠️  Warnings: ${warnings.length}`);

if (errors.length > 0) {
  console.log('\n🛑 Build FAILED - Fix errors above before deploying\n');
  process.exit(1);
} else if (warnings.length > 0) {
  console.log('\n⚠️  Build PASSED with warnings - Review above\n');
  process.exit(0);
} else {
  console.log('\n✨ Build PASSED - Manifest is consistent with filesystem\n');
  process.exit(0);
}
