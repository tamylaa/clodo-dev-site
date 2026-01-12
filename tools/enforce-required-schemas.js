#!/usr/bin/env node
/**
 * Enforce required schemas for pages based on schema/page-config.json
 * Usage: node tools/enforce-required-schemas.js [distPath] [--fail]
 */
import { readFileSync, readdirSync } from 'fs';
import { join, extname, basename } from 'path';

const distPath = process.argv[2] || 'dist';
const failOnMissing = process.argv.includes('--fail');

function findHtmlFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) files.push(...findHtmlFiles(p));
    else if (e.isFile() && extname(e.name) === '.html') files.push(p);
  }
  return files;
}

function extractSchemaTypesFromHtml(html) {
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const types = new Set();
  let m;
  while ((m = regex.exec(html)) !== null) {
    const jsonText = m[1].trim();
    try {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed['@type'])) parsed['@type'].forEach(t => types.add(t));
      else if (typeof parsed['@type'] === 'string') types.add(parsed['@type']);
      else if (parsed['@graph']) {
        const g = parsed['@graph'];
        if (Array.isArray(g)) g.forEach(item => item['@type'] && types.add(item['@type']));
      }
    } catch (e) {
      // ignore malformed
    }
  }
  return types;
}

function loadPageConfig() {
  const cfg = JSON.parse(readFileSync('schema/page-config.json', 'utf8'));
  return cfg;
}

function run() {
  // Prefer config from data/schemas/page-config.json if present
  let cfg = {};
  const cfgPath = 'data/schemas/page-config.json';
  try {
    cfg = JSON.parse(require('fs').readFileSync(cfgPath, 'utf8'));
  } catch (e) {
    // Fallback to old location
    try { cfg = loadPageConfig(); } catch (err) { cfg = {}; }
  }
  const pagesCfg = cfg.pages || {};
  const required = {};

  // Collect required schemas for pages
  for (const [pageName, pconf] of Object.entries(pagesCfg)) {
    if (pconf.requiredSchemas && Array.isArray(pconf.requiredSchemas) && pconf.requiredSchemas.length) {
      required[`${pageName}.html`] = pconf.requiredSchemas;
    }
  }

  // Also support blogPosts and caseStudies configs
  if (cfg.blogPosts) {
    for (const [fileName, bconf] of Object.entries(cfg.blogPosts)) {
      if (bconf.requiredSchemas && Array.isArray(bconf.requiredSchemas) && bconf.requiredSchemas.length) {
        required[fileName] = bconf.requiredSchemas;
      }
    }
  }
  if (cfg.caseStudies) {
    for (const [fileName, cconf] of Object.entries(cfg.caseStudies)) {
      if (cconf.requiredSchemas && Array.isArray(cconf.requiredSchemas) && cconf.requiredSchemas.length) {
        required[fileName] = cconf.requiredSchemas;
      }
    }
  }

  if (Object.keys(required).length === 0) {
    console.log('No pages have requiredSchemas configured. Nothing to enforce.');
    return 0;
  }

  const htmlFiles = findHtmlFiles(distPath);
  const missingReport = [];

  for (const [pageFile, reqSchemas] of Object.entries(required)) {
    // Try to find in dist path (may be nested)
    const target = htmlFiles.find(f => f.endsWith(`/${pageFile}`) || f.endsWith(`\\${pageFile}`) || basename(f) === pageFile);
    if (!target) {
      missingReport.push({ page: pageFile, missing: ['(page not built)'] });
      continue;
    }
    const html = readFileSync(target, 'utf8');
    const present = extractSchemaTypesFromHtml(html);
    const missing = reqSchemas.filter(r => !present.has(r));
    if (missing.length) missingReport.push({ page: pageFile, missing });
  }

  if (missingReport.length === 0) {
    console.log('✅ All required schemas present for configured pages.');
    return 0;
  }

  console.error('\n❌ Missing required schemas detected:');
  missingReport.forEach(r => {
    console.error(` - ${r.page}: Missing -> ${r.missing.join(', ')}`);
  });

  if (failOnMissing) {
    console.error('\nFailing due to --fail.');
    process.exit(1);
  } else {
    console.warn('\nWarning only: to fail on missing schemas run with --fail');
    return 1;
  }
}

if (import.meta.url && process.argv[1] && process.argv[1].endsWith('enforce-required-schemas.js')) run();

export default { run };
