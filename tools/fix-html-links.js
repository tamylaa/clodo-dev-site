#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const DIST_DIR = path.join(__dirname, '..', 'dist');

const fileList = [];

function walk(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full);
    else if (item.endsWith('.html')) fileList.push(full);
  }
}

walk(PUBLIC_DIR);
walk(DIST_DIR);

const replacements = [
  // docs
  { re: /href="\.\.\/docs\.html/g, repl: 'href="/docs' },
  { re: /href="\/docs\.html/g, repl: 'href="/docs' },
  { re: /href="docs\.html/g, repl: 'href="/docs' },
  // common pages
  { re: /href="(\.{0,2}\/)?pricing\.html/g, repl: 'href="/pricing' },
  { re: /href="(\.{0,2}\/)?examples\.html/g, repl: 'href="/examples' },
  { re: /href="(\.{0,2}\/)?privacy\.html/g, repl: 'href="/privacy' },
  { re: /href="(\.{0,2}\/)?migrate\.html/g, repl: 'href="/migrate' },
  { re: /href="(\.{0,2}\/)?product\.html/g, repl: 'href="/product' },
  { re: /href="(\.{0,2}\/)?faq\.html/g, repl: 'href="/faq' },
  { re: /href="(\.{0,2}\/)?index\.html/g, repl: 'href="/' },
  // blog intra-links (slug.html -> /blog/slug) only for files inside blog dir
];

let changedFiles = 0;
let changedCount = 0;

for (const file of fileList) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Generic replacements
  for (const r of replacements) {
    content = content.replace(r.re, r.repl);
  }

  // Blog directory specific: replace "slug.html" -> "/blog/slug" for internal links (not absolute)
  if (file.includes(path.join('public', 'blog')) || file.includes(path.join('dist', 'blog'))) {
    content = content.replace(/href="([a-z0-9-]+)\.html"/g, (m, p1) => {
      return `href="/blog/${p1}"`;
    });

    // Replace absolute share URLs with .html
    content = content.replace(/https:\/\/clodo\.dev\/blog\/([a-z0-9-]+)\.html/g, 'https://www.clodo.dev/blog/$1');
    content = content.replace(/https:\/\/www\.clodo\.dev\/blog\/([a-z0-9-]+)\.html/g, 'https://www.clodo.dev/blog/$1');
  }

  // Also replace occurrences of /blog/<slug>.html in hrefs for any file
  content = content.replace(/href="\/blog\/([a-z0-9-]+)\.html"/g, 'href="/blog/$1"');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
    changedCount += (content.match(/href=/g) || []).length - (original.match(/href=/g) || []).length;
    console.log(`Updated: ${file}`);
  }
}

console.log(`\nDone. Files changed: ${changedFiles}`);
