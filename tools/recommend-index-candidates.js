#!/usr/bin/env node
/**
 * Analyze unindexed pages to recommend for indexing
 * Categorizes pages by type, value, and search potential
 * 
 * Usage: node tools/recommend-index-candidates.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'config', 'pages-manifest.json'), 'utf8')
);

// Get unindexed pages (excluding admin and experiments)
const unindexed = manifest.filter(e => 
  !e.indexed && 
  e.file && 
  !e.isAdmin && 
  !e.isExperiment &&
  !e.isIndex
);

console.log('\n📋 UNINDEXED PAGES ANALYSIS');
console.log('═'.repeat(80));
console.log(`Total unindexed: ${unindexed.length}\n`);

// Categorize by potential value
const categories = {
  'High-Value Content': [],
  'Documentation': [],
  'Guides & Tutorials': [],
  'Comparison Pages': [],
  'Technical Deep-Dives': [],
  'General Pages': [],
  'Internationalized (i18n)': [],
};

unindexed.forEach(page => {
  const path = page.path;
  const type = page.type;
  
  // Categorize
  if (page.isI18n) {
    categories['Internationalized (i18n)'].push(page);
  } else if (path.includes('/vs-') || path.includes('-vs-')) {
    categories['Comparison Pages'].push(page);
  } else if (path.startsWith('/docs/') || path === '/docs' || path.includes('/reference/')) {
    categories['Documentation'].push(page);
  } else if (path.includes('/guide') || path.includes('/tutorial') || path.includes('/how-to')) {
    categories['Guides & Tutorials'].push(page);
  } else if (path.includes('/cloudflare-') && path.length > 15) {
    categories['Technical Deep-Dives'].push(page);
  } else if (page.type === 'blog-post' || page.type === 'case-study') {
    categories['High-Value Content'].push(page);
  } else {
    categories['General Pages'].push(page);
  }
});

// Display by category with recommendations
const recommendations = {
  'High-Value Content': { recommend: true, reason: 'Blog posts & case studies drive organic traffic' },
  'Documentation': { recommend: true, reason: 'Helps users understand product - core SEO value' },
  'Guides & Tutorials': { recommend: true, reason: 'Long-form content attracts search traffic' },
  'Comparison Pages': { recommend: true, reason: 'High commercial intent - users comparing alternatives' },
  'Technical Deep-Dives': { recommend: true, reason: 'Technical audiences search for these' },
  'General Pages': { recommend: false, reason: 'Less search value - mostly internal/support content' },
  'Internationalized (i18n)': { recommend: false, reason: 'Already has locale qualifiers - review separately' },
};

Object.entries(categories).forEach(([category, pages]) => {
  if (pages.length === 0) return;
  
  const rec = recommendations[category];
  const recommended = rec.recommend ? '✅ RECOMMEND' : '⚠️  OPTIONAL';
  
  console.log(`\n${recommended}: ${category} (${pages.length})`);
  console.log(`Reason: ${rec.reason}`);
  console.log('─'.repeat(80));
  
  if (pages.length <= 10) {
    pages.forEach(p => console.log(`  • ${p.path}`));
  } else {
    pages.slice(0, 10).forEach(p => console.log(`  • ${p.path}`));
    console.log(`  ... and ${pages.length - 10} more`);
  }
});

// Summary with action items
console.log('\n' + '═'.repeat(80));
console.log('📊 INDEXING STRATEGY RECOMMENDATION\n');

const highValue = categories['High-Value Content'].length +
                  categories['Documentation'].length +
                  categories['Guides & Tutorials'].length +
                  categories['Comparison Pages'].length +
                  categories['Technical Deep-Dives'].length;

console.log(`Quick Wins (Add immediately):`);
console.log(`  • Documentation pages: ${categories['Documentation'].length}`);
console.log(`  • Guides & Tutorials: ${categories['Guides & Tutorials'].length}`);
console.log(`  • Comparison pages: ${categories['Comparison Pages'].length}`);
console.log(`  • Technical Deep-Dives: ${categories['Technical Deep-Dives'].length}`);
console.log(`  ────────────────────────────`);
console.log(`  Total High-Value: ${highValue} pages\n`);

console.log(`If added, new coverage would be:`);
const currentIndexed = manifest.filter(e => e.indexed).length;
const totalFilesystem = manifest.filter(e => e.file).length;
const newIndexed = currentIndexed + highValue;
const newCoverage = ((newIndexed / totalFilesystem) * 100).toFixed(1);
console.log(`  Current: ${currentIndexed}/${totalFilesystem} (${((currentIndexed/totalFilesystem)*100).toFixed(1)}%)`);
console.log(`  After: ${newIndexed}/${totalFilesystem} (${newCoverage}%)`);
console.log(`  Uplift: +${highValue} pages (+${(newCoverage - ((currentIndexed/totalFilesystem)*100).toFixed(1))}%)\n`);

console.log('Optional (Lower priority, review individually):');
console.log(`  • General pages: ${categories['General Pages'].length}`);
console.log(`  • i18n pages: ${categories['Internationalized (i18n)'].length}\n`);

console.log('═'.repeat(80));
console.log('\n💡 NEXT STEPS:\n');
console.log('1. Review the lists above');
console.log('2. To add recommended pages, try:');
console.log('   node build/auto-index-by-category.js "Documentation,Guides,Comparison,Deep-Dives"\n');
console.log('3. Or manually add to nav-system/configs/navigation.json\n');

// Export JSON for reference
const report = {
  timestamp: new Date().toISOString(),
  totalUnindexed: unindexed.length,
  currentIndexed: currentIndexed,
  recommendedCount: highValue,
  projectedCoverage: newCoverage,
  categories: Object.entries(categories).reduce((acc, [cat, pages]) => ({
    ...acc,
    [cat]: pages.map(p => ({ path: p.path, type: p.type }))
  }), {})
};

fs.writeFileSync(
  path.join(__dirname, '..', 'indexing-candidates.json'),
  JSON.stringify(report, null, 2),
  'utf8'
);

console.log('📄 Detailed report saved: indexing-candidates.json\n');
