#!/usr/bin/env node
/**
 * Generate sitemap.xml from pages manifest
 * Replaces hardcoded sitemap generation with manifest-based approach
 * 
 * Benefits:
 * - Single source of truth (manifest defines what gets indexed)
 * - Automatic inclusion of new pages once added to filesystem
 * - Consistent priority/changefreq rules
 * - Easy to maintain and audit
 * 
 * Usage: node build/generate-sitemap-from-manifest.js
 * Output: public/sitemap-from-manifest.xml (for comparison)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load manifest
const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'config', 'pages-manifest.json'), 'utf8')
);

// Base URL for sitemap
const SITE_BASE = 'https://clodo.dev';

// Build priority rules
function getPriority(entry) {
  if (entry.path === '/') return 1.0;
  if (entry.path === '/docs' || entry.path === '/blog' || entry.path === '/case-studies') return 0.9;
  if (entry.type === 'blog-post') return 0.7;
  if (entry.type === 'case-study') return 0.8;
  if (entry.isI18n) return 0.6;
  return entry.priority || 0.5;
}

// Build changefreq rules
function getChangefreq(entry) {
  if (entry.path === '/') return 'weekly';
  if (entry.type === 'blog-post') return 'monthly';
  if (entry.type === 'case-study') return 'monthly';
  if (entry.path === '/docs' || entry.path.startsWith('/docs/')) return 'weekly';
  return entry.changefreq || 'monthly';
}

// Get last modified date
function getLastmod(entry) {
  if (entry.file) {
    try {
      const filePath = path.join(__dirname, '..', 'public', entry.file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        return stats.mtime.toISOString().split('T')[0];
      }
    } catch (e) {
      // ignore
    }
  }
  return new Date().toISOString().split('T')[0];
}

// Filter entries that should be indexed
const indexedEntries = manifest.filter(e => 
  e.indexed && 
  e.file && 
  !e.isAdmin && 
  !e.isExperiment &&
  !e.isIndex // Don't index /index pages
);

console.log(`📄 Generating sitemap from manifest`);
console.log(`   Source: config/pages-manifest.json`);
console.log(`   Indexed entries: ${indexedEntries.length}`);

// Build sitemap XML
let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
sitemap += ' xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

for (const entry of indexedEntries) {
  const priority = getPriority(entry);
  const changefreq = getChangefreq(entry);
  const lastmod = getLastmod(entry);
  
  sitemap += `  <url>\n`;
  sitemap += `    <loc>${SITE_BASE}${entry.path}</loc>\n`;
  sitemap += `    <lastmod>${lastmod}</lastmod>\n`;
  sitemap += `    <changefreq>${changefreq}</changefreq>\n`;
  sitemap += `    <priority>${priority.toFixed(1)}</priority>\n`;
  
  // Add alternate links for i18n pages
  if (entry.isI18n && entry.locale !== 'en') {
    // Link to English version if exists
    const enPath = entry.path.replace(/\/i18n\/[^/]+\//, '/');
    const enEntry = manifest.find(e => e.path === enPath && e.locale === 'en');
    if (enEntry) {
      sitemap += `    <xhtml:link rel="alternate" hreflang="${entry.locale}" href="${SITE_BASE}${entry.path}" />\n`;
    }
  }
  
  sitemap += `  </url>\n`;
}

sitemap += '</urlset>\n';

// Write output
const outputPath = path.join(__dirname, '..', 'public', 'sitemap-from-manifest.xml');
fs.writeFileSync(outputPath, sitemap, 'utf8');

console.log(`\n✅ Generated: ${outputPath}`);
console.log(`   Entries: ${indexedEntries.length}`);
console.log(`   Size: ${(sitemap.length / 1024).toFixed(1)}KB`);

// Compare with current sitemap if it exists
const currentPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
if (fs.existsSync(currentPath)) {
  const current = fs.readFileSync(currentPath, 'utf8');
  const currentEntries = (current.match(/<url>/g) || []).length;
  
  console.log(`\n📊 Comparison with current sitemap:`);
  console.log(`   Current entries: ${currentEntries}`);
  console.log(`   Generated entries: ${indexedEntries.length}`);
  
  if (currentEntries !== indexedEntries.length) {
    const diff = indexedEntries.length - currentEntries;
    console.log(`   Difference: ${diff > 0 ? '+' : ''}${diff}`);
    
    if (diff > 0) {
      console.log(`\n💡 Manifest-based generator found ${diff} additional pages that could be indexed`);
      console.log(`   These pages exist in filesystem but weren't in the hardcoded sitemap`);
    }
  }
}

console.log(`\n📌 Next: Compare generated vs current sitemap to verify accuracy`);
console.log(`   diff public/sitemap.xml public/sitemap-from-manifest.xml`);

process.exit(0);
