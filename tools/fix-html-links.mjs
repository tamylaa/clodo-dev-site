#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const DIST_DIR = path.join(process.cwd(), 'dist');

const fileList = [];

async function walk(dir) {
  const items = await fs.readdir(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    const st = await fs.stat(full);
    if (st.isDirectory()) await walk(full);
    else if (item.endsWith('.html')) fileList.push(full);
  }
}

(async function main() {
  try {
    // Only walk directories that exist to support CI runs where ./dist may not be present yet
    async function exists(dir) {
      try { await fs.access(dir); return true; } catch (e) { return false; }
    }

    if (await exists(PUBLIC_DIR)) await walk(PUBLIC_DIR);
    else console.log('Skipping missing public dir:', PUBLIC_DIR);

    if (await exists(DIST_DIR)) await walk(DIST_DIR);
    else console.log('Skipping missing dist dir:', DIST_DIR);

    console.log('Files to process:', fileList.length);

    let changedFiles = 0;

    for (const file of fileList) {
      let content = await fs.readFile(file, 'utf8');
      const original = content;

      // Generic replacements: convert various .html internal links to extensionless preserves fragments
      content = content.replace(/href="(?:\.\.\/|\/)?([a-z0-9\-\/]+)\.html(#.*?)?"/gi, (m, p1, p2) => `href="/${p1}${p2 || ''}"`);

      // Blog directory specific: ensure /blog/<slug> format (also covers fragments)
      if (file.includes(path.join('public', 'blog')) || file.includes(path.join('dist', 'blog'))) {
        content = content.replace(/href="([a-z0-9-]+)\.html(#.*?)?"/gi, (m, p1, p2) => `href="/blog/${p1}${p2 || ''}"`);
        // Remove .html from absolute blog URLs (update domain pattern as needed)
        content = content.replace(/https:\/\/[a-z0-9.-]+\/blog\/([a-z0-9-]+)\.html/gi, (m, p1) => m.replace('.html', ''));
      }

      // Case studies folder local links -> /case-studies/<slug>
      if (file.includes(path.join('public', 'case-studies')) || file.includes(path.join('dist', 'case-studies'))) {
        content = content.replace(/href="([a-z0-9-]+)\.html(#.*?)?"/gi, (m, p1, p2) => `href="/case-studies/${p1}${p2 || ''}"`);
      }

      if (content !== original) {
        await fs.writeFile(file, content, 'utf8');
        changedFiles++;
        console.log(`Updated: ${file}`);
      }
    }

    console.log(`\nDone. Files changed: ${changedFiles}`);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
