#!/usr/bin/env node
/**
 * apply_locales.js (ESM)
 * - Simple helper to dump localized metadata into public/i18n/<locale> pages
 * - Usage: node scripts/i18n/apply_locales.js --locale=de
 */
import fs from 'fs/promises';
import path from 'path';
import minimist from 'minimist';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load base URL from config
let BASE_URL = 'https://www.example.com';
try {
  const configPath = path.join(__dirname, '..', '..', 'config', 'site.config.js');
  const config = await import(`file://${configPath}`);
  BASE_URL = config.default?.url || BASE_URL;
} catch (e) {
  console.warn('⚠️  Could not load site config, using default URL');
}

const args = minimist(process.argv.slice(2));
const locale = args.locale || 'de';
const i18nFile = path.join(__dirname, '..', '..', 'content', 'i18n', `${locale}.json`);

async function run() {
  try {
    // ensure file exists
    await fs.access(i18nFile);
  } catch (err) {
    console.error('Locale file not found:', i18nFile);
    process.exit(1);
  }
  const raw = await fs.readFile(i18nFile, 'utf8');
  const i18n = JSON.parse(raw);
  const outDir = path.join(__dirname, '..', '..', 'public', 'i18n', locale);
  await fs.mkdir(outDir, { recursive: true });
  for (const [slug, meta] of Object.entries(i18n)) {
    const html = `<!doctype html>
<html lang="${locale.split('-')[0]}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${meta.title}</title>
  <meta name="description" content="${meta.meta}">
  <link rel="canonical" href="${BASE_URL}/i18n/${locale}/${slug}">
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
    await fs.writeFile(path.join(outDir, `${slug}.html`), html);
    console.log('Wrote localized page for', slug);
  }
  console.log('Localization generation complete.');
}

run().catch(err => { console.error(err); process.exit(1); });
