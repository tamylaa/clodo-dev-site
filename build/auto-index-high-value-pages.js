#!/usr/bin/env node
/**
 * Auto-index high-value page types
 * Marks blog posts, case studies, and docs as indexed
 * These are SEO-valuable content types that should be discoverable
 * 
 * Usage: node build/auto-index-high-value-pages.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load manifest
const manifestPath = path.join(__dirname, '..', 'config', 'pages-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

console.log('🚀 Auto-indexing high-value page types\n');

// Track changes
let changes = 0;
const updated = manifest.map(entry => {
  // Don't modify if already indexed
  if (entry.indexed) return entry;
  
  // Don't modify admin/experiment pages
  if (entry.isAdmin || entry.isExperiment) return entry;
  
  // Skip if no file
  if (!entry.file) return entry;
  
  // Auto-index high-value types
  const shouldIndex = 
    entry.type === 'blog-post' ||
    entry.type === 'case-study' ||
    entry.path.startsWith('/docs') ||
    entry.path === '/docs';
  
  if (shouldIndex) {
    changes++;
    return {
      ...entry,
      indexed: true,
      inSitemap: true,
      reason: `auto-indexed-${entry.type}`
    };
  }
  
  return entry;
});

// Report changes
const byType = {};
updated.forEach(e => {
  if (e.indexed && (e.type === 'blog-post' || e.type === 'case-study' || e.path.startsWith('/docs'))) {
    const key = e.type || 'docs';
    byType[key] = (byType[key] || 0) + 1;
  }
});

console.log('📊 Pages auto-indexed:');
console.log(`   Blog posts: ${byType['blog-post'] || 0}`);
console.log(`   Case studies: ${byType['case-study'] || 0}`);
console.log(`   Documentation: ${byType['docs'] || 0}`);
console.log(`   Total changes: ${changes}\n`);

// Write updated manifest
fs.writeFileSync(manifestPath, JSON.stringify(updated, null, 2), 'utf8');
console.log(`✅ Manifest updated: ${manifestPath}`);

// Show new indexing stats
const newStats = {
  total: updated.length,
  indexed: updated.filter(e => e.indexed).length,
  unindexed: updated.filter(e => !e.indexed && e.file && !e.isAdmin && !e.isExperiment).length,
};

const coverage = ((newStats.indexed / (updated.filter(e => e.file).length)) * 100).toFixed(1);

console.log(`\n📈 New Indexing Coverage:`);
console.log(`   Total entries: ${newStats.total}`);
console.log(`   Indexed: ${newStats.indexed}`);
console.log(`   Not indexed: ${newStats.unindexed}`);
console.log(`   Coverage: ${coverage}%\n`);

console.log('📌 Next steps:');
console.log('   1. npm run prebuild              (validate changes)');
console.log('   2. npm run sitemap:generate      (regenerate sitemap)');
console.log('   3. npm run manifest:health       (see new health score)');
console.log('   4. git add config/pages-manifest.json (commit changes)\n');

process.exit(0);
