#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const ROOT = process.cwd();
const TEMPLATE_NAV = path.join(ROOT, 'templates', 'nav-main.html');
const TARGET_LIST = [
  'public/experiments/clodo-framework-api-simplification-variant-a.html',
  'public/experiments/clodo-framework-api-simplification-variant-b.html',
  'public/experiments/clodo-framework-promise-to-reality-variant-a.html',
  'public/experiments/clodo-framework-promise-to-reality-variant-b.html',
  'public/experiments/how-to-migrate-from-wrangler-variant-a.html',
  'public/experiments/how-to-migrate-from-wrangler-variant-b.html',
  'public/framework-comparison.html',
  'public/multi-tenant-saas.html',
  'public/subscribe/thanks.html'
];

async function getHtmlFiles(dir) {
  let results = [];
  const list = await fs.readdir(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(await getHtmlFiles(filePath));
    } else if (file.endsWith('.html')) {
      results.push(path.relative(ROOT, filePath).replace(/\\/g, '/'));
    }
  }
  return results;
}

async function injectNavInto(filePath, navHtml) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    if (content.includes('<nav class="navbar"')) {
      return false;
    }

    const bodyOpen = content.match(/<body[^>]*>/i);
    if (!bodyOpen) {
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

    // Get all i18n files dynamically
    const i18nFiles = await getHtmlFiles(path.join(ROOT, 'public', 'i18n'));
    const allTargets = [...TARGET_LIST, ...i18nFiles];

    for (const rel of allTargets) {
      const p = path.join(ROOT, rel);
      try {
        await fs.access(p);
        const ok = await injectNavInto(p, navHtml);
        if (ok) changed++;
      } catch (e) {
        console.warn(`Target missing: ${rel}`);
      }
    }

    // Also handle dist if exists
    const distI18n = path.join(ROOT, 'dist', 'i18n');
    try {
      await fs.access(distI18n);
      const distFiles = await getHtmlFiles(distI18n);
      const altTargets = TARGET_LIST.map(p => p.replace(/^public\//, 'dist/'));
      for (const rel of [...altTargets, ...distFiles]) {
        const p = path.join(ROOT, rel);
        try {
          await fs.access(p);
          const ok = await injectNavInto(p, navHtml);
          if (ok) changed++;
        } catch (e) {}
      }
    } catch (e) {}

    console.log(`\nDone. Nav injected into ${changed} files.`);
  } catch (err) {
    console.error('Error reading nav template:', err);
    process.exit(1);
  }
})();
