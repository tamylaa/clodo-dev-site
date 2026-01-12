#!/usr/bin/env node

import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join, extname, basename } from 'path';

function findHtmlFiles(dir) {
  const entries = readdirSync(dir);
  const files = [];
  for (const e of entries) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) {
      files.push(...findHtmlFiles(p));
    } else if (s.isFile() && extname(e) === '.html') {
      files.push(p);
    }
  }
  return files;
}

function replaceInlineSchemas(filePath) {
  let html = readFileSync(filePath, 'utf8');
  const hasInline = /<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/i.test(html);
  if (!hasInline) return false;

  // Remove all inline JSON-LD script tags
  html = html.replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');

  // Inject a placeholder before closing </head>
  const fileName = basename(filePath);
  const placeholder = `<!-- INJECT_SCHEMAS: ${fileName.replace('.html','')} -->\n`;
  if (html.includes('</head>')) {
    html = html.replace('</head>', `${placeholder}</head>`);
  } else {
    // Append at the start
    html = `${placeholder}${html}`;
  }

  writeFileSync(filePath, html, 'utf8');
  return true;
}

const publicDir = 'public';
const files = findHtmlFiles(publicDir);
let changed = 0;
for (const f of files) {
  const did = replaceInlineSchemas(f);
  if (did) {
    console.log(`Replaced inline schemas with placeholder in: ${f}`);
    changed++;
  }
}

console.log(`Done. Files updated: ${changed}`);
process.exit(0);
