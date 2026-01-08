#!/usr/bin/env node
/**
 * fix-hreflang-tags.mjs
 * Fix all hreflang href values to use www.clodo.dev instead of clodo.dev
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

function fixHreflangs(html) {
  // Replace all hreflang hrefs that point to https://clodo.dev with https://www.clodo.dev
  return html.replace(
    /href="https:\/\/clodo\.dev([^"]*)"/g,
    'href="https://www.clodo.dev$1"'
  );
}

function main() {
  const scanDir = process.argv[2] || 'public';
  const files = getAllHtmlFiles(scanDir);
  
  console.log(`\n🔗 Fixing hreflang tags`);
  console.log(`Scanning: ${scanDir}`);
  console.log(`Files: ${files.length}\n`);
  
  let fixed = 0;
  
  for (const file of files) {
    const absPath = join(scanDir, file);
    try {
      const html = readFileSync(absPath, 'utf8');
      const newHtml = fixHreflangs(html);
      
      if (newHtml !== html) {
        writeFileSync(absPath, newHtml, 'utf8');
        fixed++;
        console.log(`  ✓ ${file}`);
      }
    } catch (err) {
      console.error(`  ❌ ${file}: ${err.message}`);
    }
  }
  
  console.log(`\n✅ Fixed hreflang tags in ${fixed} files`);
}

main();
