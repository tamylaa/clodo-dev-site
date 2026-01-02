#!/usr/bin/env node

/**
 * fix-canonicals.js
 *
 * Normalize canonical links in built HTML files under `public/`:
 * - Ensure canonical host is https://www.clodo.dev
 * - Use clean URLs (no .html) for canonical where applicable
 * - For index.html, canonical should be https://www.clodo.dev/
 *
 * Usage: node build/fix-canonicals.js [baseUrl]
 */

import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const BASE = process.argv[2] || 'https://www.clodo.dev';
const publicDir = join(process.cwd(), 'public');

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

function toCanonicalUrl(filePath) {
  if (filePath === 'index.html') return BASE + '/';
  if (filePath.endsWith('/index.html')) {
    // e.g. case-studies/index.html -> /case-studies/
    return BASE + '/' + filePath.replace(/index\.html$/, '').replace(/^\//, '');
  }
  // remove .html extension
  return BASE + '/' + filePath.replace(/\.html$/, '').replace(/^\//, '');
}

const files = getAllHtmlFiles(publicDir);
let changed = 0;

for (const file of files) {
  const abs = join(publicDir, file);
  const source = readFileSync(abs, 'utf8');
  const desired = toCanonicalUrl(file);

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
    console.log(`Updated canonical in ${file} -> ${desired}`);
    changed++;
  }
}

console.log(`Done. Files updated: ${changed}`);
if (changed === 0) process.exit(0);
else process.exit(0);