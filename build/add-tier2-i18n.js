#!/usr/bin/env node
/**
 * Add all i18n (internationalized) pages to index
 * Tier 2: Expands search presence to 8 languages
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const manifestPath = path.join(__dirname, '..', 'config', 'pages-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

console.log('🌍 Adding Tier 2: All i18n Pages\n');

// Track by locale
const byLocale = {};

let added = 0;
const updated = manifest.map(entry => {
  if (entry.isI18n && !entry.indexed && entry.file) {
    const locale = entry.locale || 'unknown';
    byLocale[locale] = (byLocale[locale] || 0) + 1;
    added++;
    return {
      ...entry,
      indexed: true,
      inSitemap: true,
      reason: 'i18n-expansion'
    };
  }
  return entry;
});

fs.writeFileSync(manifestPath, JSON.stringify(updated, null, 2), 'utf8');

const newStats = {
  indexed: updated.filter(e => e.indexed).length,
  total: updated.filter(e => e.file).length,
};
const newCoverage = ((newStats.indexed / newStats.total) * 100).toFixed(1);

console.log('✅ Added by Language:');
Object.entries(byLocale)
  .sort((a, b) => b[1] - a[1])
  .forEach(([locale, count]) => {
    const langNames = {
      'ar': 'Arabic (العربية)',
      'br': 'Brazilian Portuguese (Português)',
      'de': 'German (Deutsch)',
      'es-419': 'Spanish (Latin America) (Español)',
      'fa': 'Farsi (فارسی)',
      'he': 'Hebrew (עברית)',
      'in': 'Indonesian (Bahasa Indonesia)',
      'it': 'Italian (Italiano)',
    };
    console.log(`  • ${langNames[locale] || locale}: ${count} pages`);
  });

console.log(`\n📊 Stats:`);
console.log(`   Total added: ${added}`);
console.log(`   Languages: ${Object.keys(byLocale).length}`);
console.log(`   New coverage: ${newStats.indexed}/${newStats.total} (${newCoverage}%)`);
console.log(`   Uplift: +${newCoverage - 17.4}%\n`);

console.log('📌 Next:\n');
console.log('   node build/generate-sitemap-from-manifest.js');
console.log('   cp public/sitemap-from-manifest.xml public/sitemap.xml\n');

console.log('💡 NOTE: These are existing translated pages - no new content needed!');
console.log('   They expand your search presence to 8 languages.\n');
