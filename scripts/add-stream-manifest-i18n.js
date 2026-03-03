import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(__dirname, '..', 'config', 'pages-manifest.json');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const slug = 'cloudflare-stream-complete-guide';
const locales = ['ar', 'br', 'de', 'es-419', 'fa', 'he', 'in', 'it'];

// Check if i18n entries already exist
const existing = manifest.filter(e => e.path && e.path.includes(slug) && e.isI18n === true);
if (existing.length >= locales.length) {
  console.log(`All i18n entries for ${slug} already exist (${existing.length}). Skipping.`);
  process.exit(0);
}

// Find insertion point: after the last i18n entry for cloudflare-top-10
const topTenSlug = 'cloudflare-top-10-saas-edge-computing-workers-case-study-docs';

for (const locale of locales) {
  const searchPath = `/i18n/${locale}/${topTenSlug}`;
  const idx = manifest.findIndex(e => e.path === searchPath);
  
  if (idx === -1) {
    console.log(`Warning: Could not find ${searchPath}, will append at end for ${locale}`);
    manifest.push({
      path: `/i18n/${locale}/${slug}`,
      file: `i18n/${locale}/${slug}.html`,
      type: 'page',
      locale: locale === 'br' ? 'pt-BR' : locale === 'in' ? 'id' : locale,
      indexed: true,
      inNav: false,
      inSitemap: false,
      priority: 0.5,
      changefreq: 'weekly',
      isAdmin: false,
      isExperiment: false,
      isI18n: true,
      isIndex: false,
      reason: 'i18n-expansion'
    });
  } else {
    // Insert right after the top-10 entry for this locale
    manifest.splice(idx + 1, 0, {
      path: `/i18n/${locale}/${slug}`,
      file: `i18n/${locale}/${slug}.html`,
      type: 'page',
      locale: locale === 'br' ? 'pt-BR' : locale === 'in' ? 'id' : locale,
      indexed: true,
      inNav: false,
      inSitemap: false,
      priority: 0.5,
      changefreq: 'weekly',
      isAdmin: false,
      isExperiment: false,
      isI18n: true,
      isIndex: false,
      reason: 'i18n-expansion'
    });
    console.log(`Inserted i18n/${locale}/${slug} after index ${idx}`);
  }
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`\nManifest updated with ${locales.length} i18n entries.`);
console.log(`Total entries: ${manifest.length}`);
