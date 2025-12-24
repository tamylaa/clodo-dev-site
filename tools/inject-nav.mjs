#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const ROOT = process.cwd();
const TEMPLATE_NAV = path.join(ROOT, 'templates', 'nav-main.html');

// List target HTML files that need navigation injected
// Update this list for your specific pages
const TARGETS = [
  // Experiment pages
  'public/experiments/variant-a.html',
  'public/experiments/variant-b.html',
  // i18n pages
  'public/i18n/de/index.html',
  // Other standalone pages
  'public/subscribe/thanks.html'
];

const ALT_TARGETS = TARGETS.map(p => p.replace(/^public\//, 'dist/'));

async function injectNavInto(filePath, navHtml) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    if (content.includes('<nav class="navbar"')) {
      console.log(`Already has nav: ${filePath}`);
      return false;
    }

    const bodyOpen = content.match(/<body[^>]*>/i);
    if (!bodyOpen) {
      console.warn(`No <body> tag found in ${filePath} — skipping`);
      return false;
    }

    const insertPos = content.indexOf(bodyOpen[0]) + bodyOpen[0].length;
    const newContent = content.slice(0, insertPos) + '\n' + navHtml + '\n' + content.slice(insertPos);
    await fs.writeFile(filePath, newContent, 'utf8');
    console.log(`Injected nav into: ${filePath}`);
    return true;
  } catch (err) {
    console.error(`Failed to inject into ${filePath}:`, err.message);
    return false;
  }
}

(async function main(){
  try {
    const navHtml = await fs.readFile(TEMPLATE_NAV, 'utf8');
    let changed = 0;

    for (const rel of TARGETS) {
      const p = path.join(ROOT, rel);
      try {
        await fs.access(p);
        const ok = await injectNavInto(p, navHtml);
        if (ok) changed++;
      } catch (e) {
        console.warn(`Target missing: ${rel}`);
      }
    }

    for (const rel of ALT_TARGETS) {
      const p = path.join(ROOT, rel);
      try {
        await fs.access(p);
        const ok = await injectNavInto(p, navHtml);
        if (ok) changed++;
      } catch (e) {
        // ignore missing dist copy
      }
    }

    console.log(`\nDone. Nav injected into ${changed} files.`);
  } catch (err) {
    console.error('Error reading nav template:', err);
    process.exit(1);
  }
})();
