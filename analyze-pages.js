#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const skipDirs = ['node_modules', 'css', 'js', 'icons', 'demo', 'images', 'assets', 'fonts', 'vendor', '_next', '.git', 'amp'];

function findAllHtmlPages(dir, prefix = '') {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      
      if (entry.isDirectory()) {
        if (skipDirs.includes(entry.name) || entry.name.startsWith('.')) continue;
        results.push(...findAllHtmlPages(fullPath, relativePath));
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        const url = '/' + relativePath.replace(/\\/g, '/').replace(/\.html$/, '');
        const urlNormalized = url === '/index' ? '/' : url;
        results.push(urlNormalized);
      }
    }
  } catch (e) {
    console.error(`Error reading ${dir}: ${e.message}`);
  }
  return results;
}

const allPages = findAllHtmlPages('public').sort();
console.log(`\n=== ALL HTML PAGES (${allPages.length}) ===\n`);
allPages.forEach(p => console.log(p));

// Now read sitemap and extract URLs
const sitemapXml = fs.readFileSync('public/sitemap.xml', 'utf8');
const sitemapUrls = [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)]
  .map(m => m[1].replace('https://www.clodo.dev', ''))
  .sort();

console.log(`\n=== URLS IN SITEMAP (${sitemapUrls.length}) ===\n`);
sitemapUrls.forEach(p => console.log(p));

// Find differences
const pagesNotInSitemap = allPages.filter(p => !sitemapUrls.includes(p));
const urlsNotAsPages = sitemapUrls.filter(p => !allPages.includes(p));

console.log(`\n=== PAGES NOT IN SITEMAP (${pagesNotInSitemap.length}) ===\n`);
pagesNotInSitemap.slice(0, 30).forEach(p => console.log(p));
if (pagesNotInSitemap.length > 30) console.log(`... and ${pagesNotInSitemap.length - 30} more`);

console.log(`\n=== SITEMAP URLS WITHOUT MATCHING FILES (${urlsNotAsPages.length}) ===\n`);
urlsNotAsPages.forEach(p => console.log(p));
