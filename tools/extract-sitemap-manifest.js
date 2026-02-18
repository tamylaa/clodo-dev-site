#!/usr/bin/env node
/**
 * Extract all URLs from sitemap.xml into manifest format
 * Shows what's currently being indexed
 * 
 * Output: Array of { path, source: 'sitemap', priority, changefreq }
 * 
 * Usage: node tools/extract-sitemap-manifest.js
 */
import fs from 'fs';

const sitemapXml = fs.readFileSync('public/sitemap.xml', 'utf8');

const entries = [];

// Extract all <url> blocks
const urlPattern = /<url>([\s\S]*?)<\/url>/g;
let match;

while ((match = urlPattern.exec(sitemapXml)) !== null) {
  const urlBlock = match[1];
  
  // Extract loc
  const locMatch = /<loc>(.*?)<\/loc>/.exec(urlBlock);
  if (!locMatch) continue;
  
  const fullUrl = locMatch[1];
  const path = fullUrl.replace('https://www.clodo.dev', '');
  
  // Extract optional metadata
  const priorityMatch = /<priority>(.*?)<\/priority>/.exec(urlBlock);
  const changefreqMatch = /<changefreq>(.*?)<\/changefreq>/.exec(urlBlock);
  
  entries.push({
    path: path,
    source: 'sitemap',
    priority: priorityMatch ? parseFloat(priorityMatch[1]) : 0.5,
    changefreq: changefreqMatch ? changefreqMatch[1] : 'weekly'
  });
}

console.log(JSON.stringify(entries.sort((a, b) => a.path.localeCompare(b.path)), null, 2));
process.exit(0);
