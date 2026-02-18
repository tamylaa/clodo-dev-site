#!/usr/bin/env node
/**
 * Content quality audit
 * Identifies thin, low-quality, or shallow content
 * 
 * Usage: node tools/audit-content-quality.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('\n📝 CONTENT QUALITY AUDIT\n');
console.log('════════════════════════════════════════════════════════════════\n');

const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'config', 'pages-manifest.json'), 'utf8')
);

const distDir = path.join(__dirname, '..', 'dist');

// Quality thresholds
const MIN_WORDS = 300;      // Minimum word count for a page to be considered substantial
const MIN_H1 = 1;           // Minimum H1 tags
const MIN_HEADERS = 2;      // Minimum total headers
const MIN_IMAGES = 1;       // Minimum images (for visual content)

const results = {
  total: 0,
  thinContent: [],      // < 300 words
  noH1: [],             // Missing H1
  noStructure: [],      // < 2 headers
  noImages: [],         // No images
  good: []
};

console.log('🔍 Scanning indexed pages for content quality...\n');

manifest.forEach(entry => {
  if (!entry.indexed || !entry.file) return;
  
  results.total++;
  const filePath = path.join(distDir, entry.file);
  
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Skipping (not found): ${entry.path}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract text content (remove HTML tags)
  const text = content.replace(/<[^>]*>/g, ' ').trim();
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  // Count headers
  const h1Count = (content.match(/<h1[^>]*>/gi) || []).length;
  const h2Count = (content.match(/<h2[^>]*>/gi) || []).length;
  const h3Count = (content.match(/<h3[^>]*>/gi) || []).length;
  const headerCount = h1Count + h2Count + h3Count;
  
  // Count images
  const imageCount = (content.match(/<img[^>]*>/gi) || []).length;
  
  // Analyze description
  const metaDesc = content.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
  const descLength = metaDesc ? metaDesc[1].length : 0;
  
  // Flag quality issues
  const issues = [];
  
  if (wordCount < MIN_WORDS) {
    issues.push(`thin-content:${wordCount}w`);
    results.thinContent.push(entry);
  }
  
  if (h1Count === 0) {
    issues.push('no-h1');
    results.noH1.push(entry);
  }
  
  if (headerCount < MIN_HEADERS) {
    issues.push('no-structure');
    results.noStructure.push(entry);
  }
  
  if (imageCount === 0 && !entry.path.includes('sitemap')) {
    issues.push('no-images');
    results.noImages.push(entry);
  }
  
  if (issues.length === 0) {
    results.good.push(entry);
  }
  
  if (issues.length > 0) {
    console.log(`⚠️  ${entry.path}`);
    console.log(`   Issues: ${issues.join(', ')}`);
    console.log(`   Stats: ${wordCount}w, ${h1Count}×H1, ${headerCount}×header, ${imageCount}×img, ${descLength}ch desc`);
    console.log();
  }
});

// Report
console.log('════════════════════════════════════════════════════════════════');
console.log('\n📊 CONTENT QUALITY REPORT\n');
console.log(`   Pages analyzed: ${results.total}`);
console.log(`   Well formatted: ${results.good.length}`);
console.log(`   Thin content: ${results.thinContent.length} (${((results.thinContent.length/results.total)*100).toFixed(1)}%)`);
console.log(`   Missing H1: ${results.noH1.length}`);
console.log(`   Poor structure: ${results.noStructure.length}`);
console.log(`   No images: ${results.noImages.length}`);

if (results.thinContent.length > 0) {
  console.log('\n⚠️  THIN CONTENT PAGES (add more detail for ranking boost):\n');
  results.thinContent.slice(0, 10).forEach(p => {
    console.log(`   ${p.path}`);
  });
  if (results.thinContent.length > 10) {
    console.log(`   ... and ${results.thinContent.length - 10} more`);
  }
}

if (results.noH1.length > 0) {
  console.log('\n⚠️  MISSING H1 TAGS (add proper page heading):\n');
  results.noH1.slice(0, 5).forEach(p => {
    console.log(`   ${p.path}`);
  });
  if (results.noH1.length > 5) {
    console.log(`   ... and ${results.noH1.length - 5} more`);
  }
}

console.log('\n════════════════════════════════════════════════════════════════\n');

if (results.good.length === results.total) {
  console.log('✅ ALL PAGES HAVE GOOD CONTENT QUALITY\n');
} else {
  console.log(`⚠️  ${results.total - results.good.length} pages need content improvements\n`);
}
