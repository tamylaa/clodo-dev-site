#!/usr/bin/env node

// Validate Review objects: ensure microdata reviews contain itemReviewed and JSON-LD reviews include itemReviewed or are nested under a reviewed object.
// Usage: node tools/validate-reviews.js [path]

import fs from 'fs';
import path from 'path';

const dir = process.argv[2] || 'dist';
let hasError = false;

function readFiles(dirPath) {
  const files = fs.readdirSync(dirPath);
  return files.filter(f => f.endsWith('.html')).map(f => path.join(dirPath, f));
}

function checkMicrodata(html, file) {
  const reviewRegex = /<([a-z0-9]+)([^>]*)itemscope[^>]*itemtype=["']https:\/\/schema.org\/Review["']([^>]*)>([\s\S]*?)<\/?\1>/gi;
  let m;
  while ((m = reviewRegex.exec(html)) !== null) {
    const block = m[0];
    if (!/itemprop=["']itemReviewed["']/i.test(block)) {
      console.error(`Missing itemReviewed (microdata) in Review block in ${file}`);
      hasError = true;
    }
  }
}

function checkJsonLd(html, file) {
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = scriptRegex.exec(html)) !== null) {
    const jsonText = m[1];
    try {
      const parsed = JSON.parse(jsonText);
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes) {
        scanNodeForReview(node, file, 'json-ld');
      }
    } catch (e) {
      // ignore parse errors here; other tools check JSON validity
    }
  }
}

function scanNodeForReview(node, file, source, parentType) {
  if (!node || typeof node !== 'object') return;
  if (node['@type'] === 'Review') {
    // If Review is nested under another object, it's acceptable (implied itemReviewed). If top-level and no itemReviewed, flag.
    if (!node.itemReviewed && !parentType) {
      console.error(`JSON-LD Review missing itemReviewed in ${file}`);
      hasError = true;
    }
  }
  for (const k of Object.keys(node)) {
    const v = node[k];
    if (Array.isArray(v)) {
      v.forEach(child => scanNodeForReview(child, file, source, node['@type']));
    } else if (typeof v === 'object' && v !== null) {
      scanNodeForReview(v, file, source, node['@type']);
    }
  }
}

const files = readFiles(dir).concat(
  // include nested directories
  fs.readdirSync(dir).flatMap(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) return readFiles(p);
    return [];
  })
);

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  checkMicrodata(html, file);
  checkJsonLd(html, file);
}

if (hasError) {
  console.error('\nValidation failed: some Review objects are missing itemReviewed.');
  process.exit(2);
} else {
  console.log('All Review objects validated.');
  process.exit(0);
}
