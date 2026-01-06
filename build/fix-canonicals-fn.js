#!/usr/bin/env node

/**
 * fix-canonicals-fn.js
 * 
 * Exportable function to normalize canonical links in HTML files
 * - Ensure canonical host is https://www.clodo.dev
 * - Use clean URLs (no .html) for canonical where applicable
 * - For index.html, canonical should be https://www.clodo.dev/
 */

import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function getAllHtmlFiles(dir, rel = '') {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const r = rel ? join(rel, name) : name;
    if (statSync(full).isDirectory()) {
      out.push(...getAllHtmlFiles(full, r));
    } else if (name.endsWith('.html')) {
      out.push(r.replace(/\\/g, '/'));
    }
  }
  return out;
}

function toCanonicalUrl(filePath, baseUrl) {
  if (filePath === 'index.html') return baseUrl + '/';
  if (filePath.endsWith('/index.html')) {
    // e.g. case-studies/index.html -> /case-studies/
    return baseUrl + '/' + filePath.replace(/index\.html$/, '').replace(/^\//, '');
  }
  // remove .html extension
  return baseUrl + '/' + filePath.replace(/\.html$/, '').replace(/^\//, '');
}

export function fixCanonicalUrls(distDir, baseUrl = 'https://www.clodo.dev') {
  const files = getAllHtmlFiles(distDir);
  let changed = 0;

  for (const file of files) {
    const abs = join(distDir, file);
    const source = readFileSync(abs, 'utf8');
    const desired = toCanonicalUrl(file, baseUrl);

    const updated = source.replace(/<link[^>]+rel=["']canonical["'][^>]*>/i, (match) => {
      // replace or insert href
      if (/href=/.test(match)) {
        return match.replace(/href=["'][^"']+["']/, `href="${desired}"`);
      }
      // no href present: add it
      return match.replace(/<link/i, `<link href="${desired}"`);
    });

    if (updated !== source) {
      writeFileSync(abs, updated, 'utf8');
      console.log(`  ✓ Updated canonical in ${file} -> ${desired}`);
      changed++;
    }
  }

  console.log(`  ✓ Canonical fix complete. Files updated: ${changed}`);
  return changed;
}

// CLI usage
if (process.argv[1] && process.argv[1].endsWith('fix-canonicals-fn.js')) {
  const distDir = process.argv[2] || 'dist';
  const baseUrl = process.argv[3] || 'https://www.clodo.dev';
  fixCanonicalUrls(distDir, baseUrl);
}
