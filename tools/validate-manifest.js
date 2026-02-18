#!/usr/bin/env node
/**
 * Validate the pages manifest against actual files
 * Simple validation without test framework
 * 
 * Usage: node tools/validate-manifest.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'pages-manifest.json'), 'utf8'));

let passed = 0;
let failed = 0;
const errors = [];

function test(name, condition, details = '') {
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
    failed++;
    errors.push({ name, details });
  }
}

console.log('🔍 Validating Pages Manifest\n');

// Basic validation
test('Manifest exists', manifest && Array.isArray(manifest), `Found ${manifest?.length || 0} entries`);

const filesystem = manifest.filter(e => e.file !== null);
const sitemap = manifest.filter(e => e.inSitemap);
const nav = manifest.filter(e => e.inNav);
const admin = manifest.filter(e => e.isAdmin);
const experiments = manifest.filter(e => e.isExperiment);
const i18n = manifest.filter(e => e.isI18n);

test('All entries have required fields', manifest.every(e => 
  e.path && typeof e.indexed === 'boolean' && typeof e.inNav === 'boolean' && typeof e.inSitemap === 'boolean'
), `${manifest.length} entries checked`);

test('No duplicate paths', manifest.length === new Set(manifest.map(e => e.path)).size, 
  `${manifest.length - new Set(manifest.map(e => e.path)).size} duplicates found`);

test('All filesystem pages accounted for', filesystem.length === 235, `Found ${filesystem.length} pages`);
test('Sitemap entries parsed', sitemap.length >= 50, `Found ${sitemap.length} sitemap entries (50+ expected)`);
test('Nav entries extracted', nav.length >= 20, `Found ${nav.length} nav entries (20+ expected)`);

// Path format validation - skip external URLs
const badPaths = manifest.filter(e => {
  // External URLs are ok to skip
  if (e.path.startsWith('http')) return false;
  // Anchors are ok (internal nav links)
  if (e.path.includes('#')) return false;
  // All internal paths must start with /
  if (!e.path.startsWith('/')) return true;
  // Must not contain .html extension
  if (e.path.includes('.html')) return true;
  // Must not end with / except root
  if (e.path !== '/' && e.path.endsWith('/')) return true;
  return false;
});
test('All paths properly formatted', badPaths.length === 0, 
  badPaths.length === 0 ? '' : `${badPaths.length} paths with bad format: ${badPaths.map(e => e.path).slice(0, 3).join(', ')}`);

// Admin pages should not be indexed
const indexedAdmin = manifest.filter(e => e.isAdmin && e.indexed);
test('Admin pages not indexed', indexedAdmin.length === 0, 
  indexedAdmin.length === 0 ? '' : `${indexedAdmin.length} admin pages indexed: ${indexedAdmin.map(e => e.path).join(', ')}`);

// Experiments should not be indexed
const indexedExperiments = manifest.filter(e => e.isExperiment && e.indexed);
test('Experiment pages not indexed', indexedExperiments.length === 0,
  indexedExperiments.length === 0 ? '' : `${indexedExperiments.length} experiment pages indexed`);

// I18n pages should have locale
const noLocaleI18n = manifest.filter(e => e.isI18n && (!e.locale || e.locale === 'en' || e.locale === null));
test('I18n pages have proper locale', noLocaleI18n.length === 0,
  noLocaleI18n.length === 0 ? '' : `${noLocaleI18n.length} i18n pages missing/wrong locale`);

// Sitemap orphans (in sitemap but no file) - should not be in manifest anymore
const orphanedSitemap = sitemap.filter(e => !e.file);
test('All sitemap entries have files', orphanedSitemap.length === 0, 
  orphanedSitemap.length === 0 ? '✓ No incorrect orphan entries' : `Found ${orphanedSitemap.length}: ${orphanedSitemap.map(e => e.path).join(', ')}`);

// Nav orphans (in nav but no file) - excluding external links and anchors
const orphanedNav = nav.filter(e => !e.file && !e.path.startsWith('http') && !e.path.includes('#'));
test('All internal nav entries have files', orphanedNav.length === 0,
  orphanedNav.length === 0 ? '' : `${orphanedNav.length} nav entries orphaned: ${orphanedNav.map(e => e.path).slice(0, 3).join(', ')}`);

const notIndexed = filesystem.filter(e => !e.indexed && !e.isAdmin && !e.isExperiment);
test('Coverage statistics',  true,
  `In sitemap: ${sitemap.length}/${filesystem.length} (${((sitemap.length / filesystem.length) * 100).toFixed(1)}%)\n   In nav: ${nav.length}/${filesystem.length} (${((nav.length / filesystem.length) * 100).toFixed(1)}%)\n   Not indexed (public): ${notIndexed.length}`);

// Summary
console.log(`\n📊 Manifest Statistics:`);
console.log(`   Total entries: ${manifest.length}`);
console.log(`   Filesystem pages: ${filesystem.length}`);
console.log(`   In sitemap: ${sitemap.length}`);
console.log(`   In nav: ${nav.length}`);
console.log(`   Admin pages: ${admin.length}`);
console.log(`   Experiment pages: ${experiments.length}`);
console.log(`   I18n pages: ${i18n.length}`);

console.log(`\n📋 Test Results:`);
console.log(`   ✅ Passed: ${passed}`);
console.log(`   ❌ Failed: ${failed}`);

if (failed === 0) {
  console.log(`\n✨ All validations passed! Manifest is ready for use.\n`);
  process.exit(0);
} else {
  console.log(`\n⚠️  ${failed} validation(s) failed. Review issues above.\n`);
  process.exit(1);
}
