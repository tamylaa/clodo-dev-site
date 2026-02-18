#!/usr/bin/env node
/**
 * Extract all navigation hrefs into manifest format
 * Shows what URLs are referenced in navigation
 * 
 * Output: Array of { path, source: 'nav', label, category }
 * 
 * Usage: node tools/extract-nav-manifest.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const navConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'nav-system', 'configs', 'navigation.json'), 'utf8'));

const entries = new Set();

function extractHrefs(items, category = null) {
  if (!items) return;
  
  if (Array.isArray(items)) {
    for (const item of items) {
      if (item.href && item.href !== '#' && !item.href.startsWith('http')) {
        entries.add(JSON.stringify({
          path: item.href,
          source: 'nav',
          label: item.label,
          category: category || item.category || 'default',
          type: item.type || 'link'
        }));
      }
      if (item.children) extractHrefs(item.children, category || item.category);
      if (item.links) extractHrefs(item.links, category);
    }
  } else if (typeof items === 'object') {
    for (const section of Object.values(items)) {
      if (section.links) extractHrefs(section.links, category || section.label);
      else if (Array.isArray(section)) extractHrefs(section, category);
    }
  }
}

// Extract from main nav
if (navConfig.mainNav) {
  extractHrefs(navConfig.mainNav, 'product');
}

// Extract from footer
if (navConfig.footer) {
  extractHrefs(navConfig.footer, 'footer');
}

// Extract from breadcrumbs
if (navConfig.breadcrumbs) {
  extractHrefs(navConfig.breadcrumbs, 'breadcrumb');
}

// Convert Set to sorted array
const result = Array.from(entries)
  .map(e => JSON.parse(e))
  .sort((a, b) => a.path.localeCompare(b.path));

console.log(JSON.stringify(result, null, 2));
process.exit(0);
