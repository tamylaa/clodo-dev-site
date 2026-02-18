#!/usr/bin/env node
/**
 * Phase 4: Inject hreflang tags into i18n pages
 * Adds alternate language links for proper i18n SEO
 * 
 * Usage: node build/inject-hreflang.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'config', 'pages-manifest.json'), 'utf8')
);

// Group pages by slug (same content in different languages)
const pagesBySlug = {};
manifest.forEach(entry => {
  if (entry.indexed) {
    const slug = entry.isI18n ? entry.path.split('/').pop() : entry.path;
    if (!pagesBySlug[slug]) {
      pagesBySlug[slug] = [];
    }
    pagesBySlug[slug].push(entry);
  }
});

console.log('🌐 Injecting Hreflang Tags for i18n Pages\n');

let pagesProcessed = 0;
let hreflangAdded = 0;

for (const [slug, pages] of Object.entries(pagesBySlug)) {
  // Only process if multiple language versions exist
  if (pages.length <= 1) continue;
  
  const i18nPages = pages.filter(p => p.isI18n);
  const enPage = pages.find(p => !p.isI18n);
  
  if (!i18nPages.length) continue; // No i18n variants
  
  // Process each language version
  for (const page of i18nPages) {
    const filePath = path.join(__dirname, '..', 'dist', page.file);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${filePath}`);
      continue;
    }
    
    pagesProcessed++;
    let html = fs.readFileSync(filePath, 'utf8');
    
    // Skip if hreflang already exists
    if (html.includes('rel="alternate"') && html.includes('hreflang=')) {
      continue;
    }
    
    // Generate hreflang tags
    const hreflangTags = generateHreflangs(page, pages);
    
    if (hreflangTags) {
      // Inject before </head>
      if (html.includes('</head>')) {
        html = html.replace('</head>', `${hreflangTags}</head>`);
      } else if (html.includes('</HEAD>')) {
        html = html.replace('</HEAD>', `${hreflangTags}</HEAD>`);
      }
      
      fs.writeFileSync(filePath, html, 'utf8');
      hreflangAdded++;
      console.log(`✅ ${page.path} (${page.locale})`);
    }
  }
}

console.log(`\n📊 Results:`);
console.log(`   Pages processed: ${pagesProcessed}`);
console.log(`   Hreflang added: ${hreflangAdded}`);
console.log(`   Success rate: ${((hreflangAdded/pagesProcessed)*100).toFixed(1)}%\n`);

function generateHreflangs(currentPage, allVersions) {
  let tags = '';
  
  // Add link to each alternate version
  for (const variant of allVersions) {
    if (variant.path === currentPage.path) continue; // Skip self
    
    const lang = variant.locale === 'en' ? 'en' : variant.locale;
    const url = `https://www.clodo.dev${variant.path}`;
    tags += `\n  <link rel="alternate" hreflang="${lang}" href="${url}">`;
  }
  
  // Add hreflang="x-default" for English version
  const enVersion = allVersions.find(p => !p.isI18n);
  if (enVersion) {
    const defaultUrl = `https://www.clodo.dev${enVersion.path}`;
    tags += `\n  <link rel="alternate" hreflang="x-default" href="${defaultUrl}">`;
  }
  
  return tags ? `\n  <!-- Hreflang tags for alternate language versions -->${tags}\n` : null;
}
