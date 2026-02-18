#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'pages-manifest.json'), 'utf8'));

console.log('=== PATHS WITH BAD FORMAT ===');
manifest.filter(e => !e.path.startsWith('/') || e.path.includes('.html') || (e.path !== '/' && e.path.endsWith('/'))).forEach(e => {
  console.log(`${e.path} (file: ${e.file})`);
});

console.log('\n=== I18N PAGES WITHOUT LOCALE ===');
const i18nNoLocale = manifest.filter(e => e.isI18n && (!e.locale || e.locale === 'en'));
console.log(`Total: ${i18nNoLocale.length}`);
i18nNoLocale.slice(0, 5).forEach(e => {
  console.log(`${e.path} (locale: ${e.locale}, file: ${e.file})`);
});

console.log('\n=== NAV ORPHANS (internal, not external) ===');
const navEntries = manifest.filter(e => e.inNav);
const orphan = navEntries.filter(e => !e.file && !e.path.startsWith('http') && !e.path.includes('#'));
console.log(`Total: ${orphan.length}`);
orphan.forEach(e => {
  console.log(`${e.path}`);
});
