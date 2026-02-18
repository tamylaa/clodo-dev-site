#!/usr/bin/env node
/**
 * Add recommended high-value pages to index
 * Tier 1: 7 strategic pages with proven SEO value
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const manifestPath = path.join(__dirname, '..', 'config', 'pages-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Tier 1 recommended pages
const tier1 = [
  '/cloud-vs-edge',
  '/cloudflare-d1-errors',
  '/cloudflare-top-10-saas-edge-computing-workers-case-study-docs',
  '/cloudflare-workers-auth',
  '/cloudflare-workers-cold-start-optimization',
  '/cloudflare-workers-development-guide',
  '/cloudflare-workers-enterprise-features',
];

console.log('🚀 Adding Tier 1 Recommended Pages\n');

let added = 0;
const updated = manifest.map(entry => {
  if (tier1.includes(entry.path) && !entry.indexed) {
    console.log(`  ✅ Adding: ${entry.path}`);
    added++;
    return {
      ...entry,
      indexed: true,
      inSitemap: true,
      reason: 'high-value-technical-content'
    };
  }
  return entry;
});

fs.writeFileSync(manifestPath, JSON.stringify(updated, null, 2), 'utf8');

const newStats = {
  indexed: updated.filter(e => e.indexed).length,
  total: updated.filter(e => e.file).length,
};
const newCoverage = ((newStats.indexed / newStats.total) * 100).toFixed(1);

console.log(`\n✅ Added ${added} pages`);
console.log(`📈 New coverage: ${newStats.indexed}/${newStats.total} (${newCoverage}%)\n`);

console.log('📌 Next:\n');
console.log('   node build/generate-sitemap-from-manifest.js');
console.log('   cp public/sitemap-from-manifest.xml public/sitemap.xml\n');
