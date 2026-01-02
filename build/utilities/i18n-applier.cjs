#!/usr/bin/env node
/**
 * apply_locales.cjs
 * - Simple helper to dump localized metadata into public/i18n/<locale> pages or inject into templates during build
 * - Usage: node scripts/i18n/apply_locales.cjs --locale=de
 */
const fs = require('fs');
const path = require('path');
const args = require('minimist')(process.argv.slice(2));
const locale = args.locale || 'de';
const i18nFile = path.join(__dirname, '..', '..', 'content', 'i18n', `${locale}.json`);
if (!fs.existsSync(i18nFile)) {
  console.error('Locale file not found:', i18nFile);
  process.exit(1);
}
const i18n = JSON.parse(fs.readFileSync(i18nFile, 'utf8'));
const outDir = path.join(__dirname, '..', '..', 'public', 'i18n', locale);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
for (const [slug, meta] of Object.entries(i18n)) {
  const html = `<!doctype html>
<html lang="${locale.split('-')[0]}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${meta.title}</title>
  <meta name="description" content="${meta.meta}">
  <link rel="canonical" href="https://www.clodo.dev/${slug}">
</head>
<body>
  <div style="padding:1rem; background:#f3f4f6; border-left:4px solid #3b82f6;">
    <strong>Localized page</strong> — ${locale}
  </div>
  <main>
    <h1>${meta.title}</h1>
    <p>${meta.meta}</p>
    <p><a href="/">Volver</a></p>
  </main>
</body>
</html>`;
  fs.writeFileSync(path.join(outDir, `${slug}.html`), html);
  console.log('Wrote localized page for', slug);
}
console.log('Localization generation complete.');
