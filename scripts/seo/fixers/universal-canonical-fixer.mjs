#!/usr/bin/env node
/**
 * universal-canonical-fixer.mjs
 * 
 * Fixes ALL canonical inconsistencies across the entire site:
 * 1. Ensures all canonicals use https://www.clodo.dev (www prefix)
 * 2. Strips .html extensions from canonicals
 * 3. Handles locale pages (/i18n/{locale}/path)
 * 4. Handles AMP pages (point to non-AMP canonical)
 * 5. Handles experiment pages
 * 6. Ensures consistency without breaking links or redirects
 */

import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const CANONICAL_BASE = 'https://www.clodo.dev';

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

function generateCorrectCanonical(filePath) {
  // filePath is like: blog/instant-try-it-impact.html
  // or: i18n/de/clodo-framework-api-simplification.html
  // or: amp/en/blog/foo.amp.html
  // or: index.html (root)
  // or: blog/index.html
  // or: experiments/variant-a.html
  
  let canonical = filePath
    .replace(/\.html$/, '') // Remove .html
    .replace(/\.amp$/, '');  // Remove .amp suffix
  
  // For AMP files in /amp/[locale]/ directories, extract the non-AMP path
  // amp/en/blog/foo → blog/foo
  if (canonical.startsWith('amp/')) {
    canonical = canonical.replace(/^amp\/[a-z]{2}\//, '');
  }
  
  // For index files: convert to directory URLs
  // index → / (root)
  // blog/index → blog/
  if (canonical === 'index') {
    canonical = '';
  } else if (canonical.endsWith('/index')) {
    canonical = canonical.replace(/\/index$/, '/');
  }
  
  if (canonical) {
    return CANONICAL_BASE + '/' + canonical;
  } else {
    return CANONICAL_BASE + '/';
  }
}

function fixCanonical(filePath, html) {
  const correctCanonical = generateCorrectCanonical(filePath);
  
  // Find existing canonical
  const canonicalRegex = /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i;
  const match = html.match(canonicalRegex);
  
  if (!match) {
    console.log(`⚠️  No canonical found in ${filePath}`);
    return { html, changed: false, hadCanonical: false };
  }
  
  const oldCanonical = match[1];
  
  // Check if it's already correct
  if (oldCanonical === correctCanonical) {
    return { html, changed: false, alreadyCorrect: true };
  }
  
  // Replace the canonical
  const newHtml = html.replace(
    canonicalRegex,
    `<link rel="canonical" href="${correctCanonical}"`
  );
  
  return { html: newHtml, correctCanonical, oldCanonical, changed: true };
}

function main() {
  const scanDir = process.argv[2] || 'public';
  const verbose = !process.argv.includes('--quiet');
  
  const files = getAllHtmlFiles(scanDir);
  
  console.log(`\n🔗 Universal Canonical Fixer`);
  console.log(`Scanning: ${scanDir}`);
  console.log(`Files: ${files.length}\n`);
  
  let fixed = 0;
  let alreadyCorrect = 0;
  const errors = [];
  const changes = [];
  
  for (const file of files) {
    const absPath = join(scanDir, file);
    try {
      const html = readFileSync(absPath, 'utf8');
      const { html: newHtml, changed, alreadyCorrect: isCorrect, oldCanonical, correctCanonical, hadCanonical } = fixCanonical(file, html);
      
      if (hadCanonical === false) {
        errors.push(`${file}: No canonical tag found`);
        continue;
      }
      
      if (isCorrect) {
        alreadyCorrect++;
      } else if (changed) {
        writeFileSync(absPath, newHtml, 'utf8');
        fixed++;
        if (verbose) {
          console.log(`  ✓ ${file}`);
          console.log(`    ${oldCanonical} → ${correctCanonical}`);
        }
        changes.push({ file, oldCanonical, correctCanonical });
      }
    } catch (err) {
      errors.push(`${file}: ${err.message}`);
    }
  }
  
  if (verbose) {
    if (errors.length) {
      console.log(`\n⚠️  Errors:`);
      errors.forEach(e => console.log(`  - ${e}`));
    }
    
    console.log(`\n✅ Complete!`);
    console.log(`  Fixed: ${fixed}`);
    console.log(`  Already correct: ${alreadyCorrect}`);
    console.log(`  Errors: ${errors.length}`);
    console.log(`  Total processed: ${files.length}`);
  }
  
  return { fixed, alreadyCorrect, errors, changes };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} else {
  // Also run if directly invoked
  main();
}

export { generateCorrectCanonical, fixCanonical };
