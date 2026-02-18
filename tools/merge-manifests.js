#!/usr/bin/env node
/**
 * Merge filesystem, sitemap, and nav manifests into unified pages manifest
 * Consolidates all sources of truth into single config
 * 
 * Output: config/pages-manifest.json
 * 
 * Usage: node tools/merge-manifests.js
 */
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('📊 Merging manifests...\n');

// Extract all sources
console.log('  1️⃣  Scanning filesystem...');
const filesystemJson = execSync('node tools/extract-filesystem-manifest.js', { encoding: 'utf8' });
const filesystem = JSON.parse(filesystemJson);
console.log(`     Found ${filesystem.length} pages in filesystem`);

console.log('  2️⃣  Parsing sitemap...');
const sitemapJson = execSync('node tools/extract-sitemap-manifest.js', { encoding: 'utf8' });
const sitemap = JSON.parse(sitemapJson);
console.log(`     Found ${sitemap.length} URLs in sitemap`);

console.log('  3️⃣  Extracting nav hrefs...');
const navJson = execSync('node tools/extract-nav-manifest.js', { encoding: 'utf8' });
const nav = JSON.parse(navJson);
console.log(`     Found ${nav.length} hrefs in navigation`);

// Load previous manifest to preserve indexed decisions
let previousManifest = [];
try {
  const prevPath = path.join(__dirname, '..', 'config', 'pages-manifest.json');
  if (fs.existsSync(prevPath)) {
    previousManifest = JSON.parse(fs.readFileSync(prevPath, 'utf8'));
  }
} catch (e) {
  // ignore if can't read previous
}

const previousMap = new Map(previousManifest.map(e => [e.path, e]));

// Merge into unified manifest
const mergedMap = new Map(); // path -> entry

// Start with filesystem (source of truth for what exists)
for (const fs_entry of filesystem) {
  const key = fs_entry.path;
  const previous = previousMap.get(key);
  
  mergedMap.set(key, {
    path: fs_entry.path,
    file: fs_entry.file,
    type: fs_entry.type,
    locale: fs_entry.locale,
    indexed: previous ? previous.indexed : false, // Preserve if was set before
    inNav: false,   // Will set below
    inSitemap: false, // Will set below
    priority: previous ? previous.priority : 0.5,
    changefreq: previous ? previous.changefreq : 'weekly',
    isAdmin: fs_entry.isAdmin,
    isExperiment: fs_entry.isExperiment,
    isI18n: fs_entry.isI18n,
    isIndex: fs_entry.isIndex,
    reason: fs_entry.isAdmin ? 'admin-page' : fs_entry.isExperiment ? 'ab-test' : (previous ? previous.reason : null)
  });
}

// Mark what's in sitemap
for (const sitemap_entry of sitemap) {
  const key = sitemap_entry.path;
  if (mergedMap.has(key)) {
    const entry = mergedMap.get(key);
    entry.inSitemap = true;
    entry.indexed = true; // If in sitemap, we want it indexed
    entry.priority = sitemap_entry.priority;
    entry.changefreq = sitemap_entry.changefreq;
  } else {
    // Sitemap entry with no corresponding file - these are errors in sitemap generation
    // Don't add to manifest (they shouldn't be there)
    console.warn(`⚠️  Sitemap has orphaned entry: ${key}`);
  }
}

// Mark what's in nav
for (const nav_entry of nav) {
  const key = nav_entry.path;
  // Skip external URLs (already filtered in extraction but double-check)
  if (key.startsWith('http') || key.includes('#')) continue;
  
  if (mergedMap.has(key)) {
    const entry = mergedMap.get(key);
    entry.inNav = true;
    // If in nav and wasn't previously indexed, mark as indexed
    if (!entry.indexed) {
      entry.indexed = true;
    }
  } else {
    // Nav entry with no corresponding file - these are likely errors in nav config
    // Don't add to manifest (they shouldn't be there)
    console.warn(`⚠️  Nav has orphaned entry: ${key}`);
  }
}

// Set sensible defaults for admin/experiment pages
for (const entry of mergedMap.values()) {
  if (entry.isAdmin) {
    entry.indexed = false;
    entry.inSitemap = false;
    entry.inNav = false;
  }
  if (entry.isExperiment) {
    entry.indexed = false;
    entry.inSitemap = false;
    entry.inNav = false;
  }
}

// Convert to sorted array
const merged = Array.from(mergedMap.values())
  .sort((a, b) => a.path.localeCompare(b.path));

// Write manifest
const outPath = path.join(__dirname, '..', 'config', 'pages-manifest.json');
const outDir = path.dirname(outPath);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(outPath, JSON.stringify(merged, null, 2), 'utf8');

console.log(`\n✅ Merged manifest written: ${outPath}`);
console.log(`   Total entries: ${merged.length}`);
console.log(`   Indexed (in sitemap): ${merged.filter(e => e.indexed).length}`);
console.log(`   In nav: ${merged.filter(e => e.inNav).length}`);
console.log(`   Admin pages: ${merged.filter(e => e.isAdmin).length}`);
console.log(`   Experiment pages: ${merged.filter(e => e.isExperiment).length}`);

// Report discrepancies
const orphanedInSitemap = merged.filter(e => e.inSitemap && !e.file);
const orphanedInNav = merged.filter(e => e.inNav && !e.file);
const filesystemNotIndexed = merged.filter(e => e.file && !e.inSitemap && !e.isAdmin && !e.isExperiment);

if (orphanedInSitemap.length > 0) {
  console.log(`\n⚠️  URLs in sitemap with no file (${orphanedInSitemap.length}):`);
  orphanedInSitemap.forEach(e => console.log(`    ${e.path}`));
}

if (orphanedInNav.length > 0) {
  console.log(`\n⚠️  Hrefs in nav with no file (${orphanedInNav.length}):`);
  orphanedInNav.forEach(e => console.log(`    ${e.path}`));
}

if (filesystemNotIndexed.length > 0) {
  console.log(`\n⚠️  Pages on filesystem not in sitemap (${filesystemNotIndexed.length}):`);
  filesystemNotIndexed.slice(0, 10).forEach(e => console.log(`    ${e.path}`));
  if (filesystemNotIndexed.length > 10) {
    console.log(`    ... and ${filesystemNotIndexed.length - 10} more`);
  }
}

console.log('\n📌 Next step: Run manifest consistency tests');
console.log('   npm test -- tests/manifest-consistency.spec.js');
