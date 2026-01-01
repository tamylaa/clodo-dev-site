import fs from 'fs/promises';
import path from 'path';

// Simulate the fix-links script processing
const testContent = `<strong>⚖️ Comparisons</strong>`;
console.log('Original content:', testContent);

// Apply the same replacements as fix-links
let content = testContent;

// Generic replacements: convert various .html internal links to extensionless preserves fragments
content = content.replace(/href="(?:\.\.|\/)?([a-z0-9\-/]+)\.html(#.*?)?"/gi, (m, p1, p2) => `href="/${p1}${p2 || ''}"`);

// Blog directory specific: ensure /blog/<slug> format (also covers fragments)
content = content.replace(/href="([a-z0-9-]+)\.html(#.*?)?"/gi, (m, p1, p2) => `href="/blog/${p1}${p2 || ''}"`);
content = content.replace(/https:\/\/clodo\.dev\/blog\/([a-z0-9-]+)\.html/gi, 'https://clodo.dev/blog/$1');
content = content.replace(/https:\/\/www\.clodo\.dev\/blog\/([a-z0-9-]+)\.html/gi, 'https://clodo.dev/blog/$1');

console.log('After processing:', content);
console.log('Still has emoji:', content.includes('⚖️'));