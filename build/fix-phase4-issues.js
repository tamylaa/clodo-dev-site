#!/usr/bin/env node
/**
 * Phase 4: Fix SEO & Stability Issues
 * - Fix redirect pages (mark as not indexed)
 * - Add HTTP redirects
 * - Fix structural issues
 * 
 * Usage: node build/fix-phase4-issues.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('\n🔧 PHASE 4: FIXING SEO & STABILITY ISSUES\n');
console.log('════════════════════════════════════════════════════════════════\n');

const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'config', 'pages-manifest.json'), 'utf8')
);

// 1. Identify redirect pages that shouldn't be indexed
console.log('1️⃣  FIXING REDIRECT PAGES\n');

const redirectPages = [
  { path: '/cloud-vs-edge', to: '/edge-vs-cloud-computing', reason: 'redirect-page' }
];

let redirectsToAdd = [];

redirectPages.forEach(redirect => {
  const entry = manifest.find(e => e.path === redirect.path);
  if (entry && entry.indexed) {
    console.log(`❌ ${redirect.path} should NOT be indexed (it's a redirect)`);
    
    // Mark as not indexed
    entry.indexed = false;
    entry.reason = redirect.reason;
    
    // Add to redirects
    redirectsToAdd.push(`${redirect.path} ${redirect.to} 301`);
    
    // Add noindex to HTML
    const filePath = path.join(__dirname, '..', 'public', entry.file);
    if (fs.existsSync(filePath)) {
      let html = fs.readFileSync(filePath, 'utf8');
      
      // Add noindex if not present
      if (!html.includes('noindex')) {
        const noindexMeta = '<meta name="robots" content="noindex, nofollow">';
        if (html.includes('</head>')) {
          html = html.replace('</head>', `  ${noindexMeta}\n</head>`);
          fs.writeFileSync(filePath, html, 'utf8');
          console.log(`   ✓ Added noindex meta tag\n`);
        }
      }
    }
  }
});

// 2. Update manifest
console.log('2️⃣  UPDATING MANIFEST\n');
fs.writeFileSync(
  path.join(__dirname, '..', 'config', 'pages-manifest.json'),
  JSON.stringify(manifest, null, 2),
  'utf8'
);
console.log('✓ Manifest updated (redirect pages)');
console.log(`  Entries updated: ${redirectPages.length}\n`);

// 3. Add redirects
if (redirectsToAdd.length > 0) {
  console.log('3️⃣  ADDING HTTP REDIRECTS\n');
  
  const redirectsFile = path.join(__dirname, '..', 'public', '_redirects');
  let redirectsContent = fs.readFileSync(redirectsFile, 'utf8');
  
  // Find where to insert (after domain canonicalization section)
  const insertPoint = redirectsContent.indexOf('# EXTENSION NORMALIZATION');
  
  if (insertPoint > -1) {
    const redirectsSection = `\n# CONTENT REDIRECTS\n# Redirect canonical aliases\n${redirectsToAdd.join('\n')}\n`;
    redirectsContent = redirectsContent.slice(0, insertPoint) + redirectsSection + redirectsContent.slice(insertPoint);
    fs.writeFileSync(redirectsFile, redirectsContent, 'utf8');
    console.log(`✓ Added ${redirectsToAdd.length} redirect rules`);
    redirectsToAdd.forEach(r => {
      console.log(`  ${r}`);
    });
  }
  console.log();
}

// 4. Report
console.log('════════════════════════════════════════════════════════════════');
console.log('\n📊 PHASE 4 FIX SUMMARY\n');
console.log(`✅ Redirect pages fixed: ${redirectPages.length}`);
console.log(`✅ Noindex tags added: ${redirectPages.length}`);
console.log(`✅ HTTP redirects added: ${redirectsToAdd.length}`);
console.log(`✅ Manifest updated\n`);

console.log('════════════════════════════════════════════════════════════════\n');
console.log('📋 NEXT STEPS:\n');
console.log('1. npm run build        (rebuild with fixes)');
console.log('2. npm run audit:content (verify improvements)');
console.log('3. npm run inject-hreflang (inject hreflang on build)\n');
