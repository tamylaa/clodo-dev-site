import { promises as fs } from 'fs';
import path from 'path';

const root = path.resolve('public');

const mappings = {
  '#3b82f6': 'var(--primary-500)',
  '#10b981': 'var(--success-500)',
  '#ef4444': 'var(--error-500)',
  '#f59e0b': 'var(--warning-500)',
  '#f9fafb': 'var(--gray-50)',
  '#f8fafc': 'var(--gray-50)',
  '#f3f4f6': 'var(--gray-100)',
  '#e5e7eb': 'var(--gray-200)',
  '#e2e8f0': 'var(--gray-200)',
  '#6b7280': 'var(--gray-500)',
  '#111827': 'var(--gray-900)',
  '#4f46e5': 'var(--primary-600)',
  '#6366f1': 'var(--primary-500)',
  '#667eea': 'var(--accent-purple)',
  '#764ba2': 'var(--accent-purple)',
  '#2563eb': 'var(--primary-dark)',
  '#9333ea': 'var(--accent-purple)',
  '#000': 'var(--color-black)',
  '#000000': 'var(--color-black)',
  '#fff': 'var(--color-white)',
  '#ffffff': 'var(--color-white)',
  '#8b5cf6': 'var(--accent-purple)',
  'white': 'var(--color-white)',
  'black': 'var(--color-black)'
};

function shouldProcess(filePath) {
  return filePath.endsWith('.css') || filePath.endsWith('.html');
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(full));
    } else if (entry.isFile() && shouldProcess(full)) {
      files.push(full);
    }
  }
  return files;
}

(async function main() {
  const files = await walk(root);
  let totalReplacements = 0;
  const changedFiles = [];

  for (const file of files) {
    let content = await fs.readFile(file, 'utf8');
    let original = content;

    for (const [key, variable] of Object.entries(mappings)) {
      // choose regex pattern: hex codes are literal, named colors should be word-boundary
      // but avoid replacing named colors that are part of CSS variable names like "--color-white"
      let pattern;
      if (key.startsWith('#')) {
        pattern = key.replace('#','\\#');
      } else if (key === 'white' || key === 'black') {
        // negative lookbehind to avoid matching in "--color-white" or similar
        pattern = `(?<!-)\\b${key}\\b`;
      } else {
        pattern = `\\b${key}\\b`;
      }
      const re = new RegExp(pattern, 'gi');
      content = content.replace(re, variable);
    }

    // Post-normalize to avoid accidental nested var(...) constructs introduced by naive replacement
    // e.g., var(--color-var(--color-white)) -> var(--color-white)
    content = content.replace(/var\(\s*--color-var\(\s*(--[^)]+)\s*\)\s*\)/gi, 'var($1)');
    // Normalize variants with fallback: var(--color-var(--color-white), var(--color-white)) -> var(--color-white)
    content = content.replace(/var\(\s*--color-var\(\s*(--[^)]+)\s*\)\s*,\s*var\(\s*\1\s*\)\s*\)/gi, 'var($1)');

    if (content !== original) {
      // count approximate number of replacements (diff length heuristic)
      const delta = (original.match(/#/g) || []).length - (content.match(/#/g) || []).length;
      totalReplacements += Math.max(0, delta);
      await fs.writeFile(file, content, 'utf8');
      changedFiles.push(file);
    }
  }

  console.log(`Done. Files updated: ${changedFiles.length}`);
  for (const f of changedFiles) console.log(` - ${f}`);
  console.log(`Approx. replacements made: ${totalReplacements}`);
})();
