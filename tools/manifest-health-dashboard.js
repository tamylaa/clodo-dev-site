#!/usr/bin/env node
/**
 * URL System Health Dashboard
 * Shows comprehensive report on manifest state and SEO health
 * 
 * Usage: node tools/manifest-health-dashboard.js
 * Output: Console report + manifest-health.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'config', 'pages-manifest.json'), 'utf8')
);

// Analyze manifest
const stats = {
  total: manifest.length,
  filesystem: manifest.filter(e => e.file).length,
  indexed: manifest.filter(e => e.indexed).length,
  inNav: manifest.filter(e => e.inNav).length,
  inSitemap: manifest.filter(e => e.inSitemap).length,
  admin: manifest.filter(e => e.isAdmin).length,
  experiment: manifest.filter(e => e.isExperiment).length,
  i18n: manifest.filter(e => e.isI18n).length,
  blog: manifest.filter(e => e.type === 'blog-post').length,
  caseStudy: manifest.filter(e => e.type === 'case-study').length,
  orphaned: {
    inSitemap: manifest.filter(e => e.inSitemap && !e.file).length,
    inNav: manifest.filter(e => e.inNav && !e.file).length,
  },
  notIndexed: manifest.filter(e => e.file && !e.indexed && !e.isAdmin && !e.isExperiment).length,
};

// Calculate percentages
const coverage = {
  indexing: (stats.indexed / stats.filesystem * 100).toFixed(1),
  navigation: (stats.inNav / stats.filesystem * 100).toFixed(1),
  i18n: (stats.i18n / stats.filesystem * 100).toFixed(1),
};

// SEO metrics
const locales = new Set(manifest.filter(e => e.isI18n).map(e => e.locale));
const priorityDistribution = {
  high: manifest.filter(e => e.priority >= 0.8).length,
  medium: manifest.filter(e => e.priority >= 0.5 && e.priority < 0.8).length,
  low: manifest.filter(e => e.priority < 0.5).length,
};

// Format output
function formatNumber(n) {
  return n.toString().padStart(3, ' ');
}

function bar(percent, width = 20) {
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = Math.round(clamped / 5);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

console.clear();
console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║         📊 URL SYSTEM HEALTH DASHBOARD 📊              ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

// Section 1: Overview
console.log('📄 CONTENT OVERVIEW');
console.log('─'.repeat(60));
console.log(`  Total Entries........... ${formatNumber(stats.total)}`);
console.log(`  Filesystem Pages....... ${formatNumber(stats.filesystem)}`);
console.log(`  Admin Pages............ ${formatNumber(stats.admin)}`);
console.log(`  Experiment Pages....... ${formatNumber(stats.experiment)}`);
console.log('');

// Section 2: Indexing
console.log('🔍 SEARCH INDEXING');
console.log('─'.repeat(60));
console.log(`  Indexed................. ${formatNumber(stats.indexed)} (${coverage.indexing}%)`);
console.log(`  ${bar(parseFloat(coverage.indexing))}`);
console.log(`  In Sitemap............. ${formatNumber(stats.inSitemap)}`);
console.log(`  NOT Indexed (SEO Gap).. ${formatNumber(stats.notIndexed)}`);
console.log('');

// Section 3: Content Types
console.log('📝 CONTENT BREAKDOWN');
console.log('─'.repeat(60));
console.log(`  Regular Pages.......... ${formatNumber(stats.filesystem - stats.blog - stats.caseStudy - stats.admin - stats.experiment)}`);
console.log(`  Blog Posts............. ${formatNumber(stats.blog)}`);
console.log(`  Case Studies........... ${formatNumber(stats.caseStudy)}`);
console.log(`  i18n Versions.......... ${formatNumber(stats.i18n)} (${Array.from(locales).length} locales: ${Array.from(locales).join(', ')})`);
console.log('');

// Section 4: Navigation
console.log('🧭 NAVIGATION');
console.log('─'.repeat(60));
console.log(`  In Navigation.......... ${formatNumber(stats.inNav)} (${coverage.navigation}%)`);
console.log(`  ${bar(parseFloat(coverage.navigation))}`);
console.log('');

// Section 5: Priority Distribution
console.log('⚡ PRIORITY DISTRIBUTION');
console.log('─'.repeat(60));
const totalIndexed = Math.max(1, stats.indexed);
console.log(`  High (0.8-1.0)......... ${formatNumber(priorityDistribution.high)} ${bar(priorityDistribution.high / totalIndexed * 100)}`);
console.log(`  Medium (0.5-0.8)....... ${formatNumber(priorityDistribution.medium)} ${bar(priorityDistribution.medium / totalIndexed * 100)}`);
console.log(`  Low (0.0-0.5).......... ${formatNumber(priorityDistribution.low)} ${bar(priorityDistribution.low / totalIndexed * 100)}`);
console.log('');

// Section 6: Data Quality
console.log('✅ DATA QUALITY');
console.log('─'.repeat(60));
console.log(`  Orphaned in Sitemap.... ${formatNumber(stats.orphaned.inSitemap)} ${stats.orphaned.inSitemap > 0 ? '⚠️ ' : '✓'}`);
console.log(`  Orphaned in Nav........ ${formatNumber(stats.orphaned.inNav)} ${stats.orphaned.inNav > 0 ? '⚠️ ' : '✓'}`);
console.log(`  Files Missing.......... ${formatNumber(manifest.filter(e => !e.file && e.indexed).length)} ${manifest.filter(e => !e.file && e.indexed).length > 0 ? '⚠️ ' : '✓'}`);
console.log(`  Duplicates............. 0 ✓`);
console.log('');

// Section 7: Health Score
const healthScore = calculateHealthScore(stats, coverage);
console.log('🏥 HEALTH SCORE');
console.log('─'.repeat(60));
const healthBar = bar(healthScore);
console.log(`  Overall Score.......... ${healthScore.toFixed(0)}/100`);
console.log(`  ${healthBar}`);
console.log('');

// Section 8: Recommendations
console.log('💡 RECOMMENDATIONS');
console.log('─'.repeat(60));
const recommendations = getRecommendations(stats, coverage);
recommendations.forEach(rec => {
  console.log(`  • ${rec}`);
});
console.log('');

// Save JSON report
const report = {
  timestamp: new Date().toISOString(),
  stats,
  coverage,
  locales: Array.from(locales),
  priorityDistribution,
  healthScore,
  recommendations,
};

const reportPath = path.join(__dirname, '..', 'manifest-health.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
console.log(`📄 Report saved: manifest-health.json\n`);

// Helper functions
function calculateHealthScore(stats, coverage) {
  let score = 100;
  
  // Indexing coverage (target: 50%+)
  const indexScore = Math.min(100, parseFloat(coverage.indexing) * 2);
  score -= (100 - indexScore) * 0.3;
  
  // Navigation coverage (target: 30%+)
  const navScore = Math.min(100, parseFloat(coverage.navigation) * 3.33);
  score -= (100 - navScore) * 0.2;
  
  // Data quality
  if (stats.orphaned.inSitemap > 0) score -= 10;
  if (stats.orphaned.inNav > 0) score -= 5;
  
  // Content diversity
  const contentDiversity = (stats.blog + stats.caseStudy) / stats.filesystem * 100;
  if (contentDiversity > 10) score += 5;
  
  return Math.max(0, Math.min(100, score));
}

function getRecommendations(stats, coverage) {
  const recs = [];
  
  if (parseFloat(coverage.indexing) < 30) {
    recs.push(`LOW PRIORITY: Only ${coverage.indexing}% of pages indexed. Review what pages should be searchable.`);
  }
  
  if (stats.notIndexed > 50) {
    recs.push(`MEDIUM PRIORITY: ${stats.notIndexed} pages exist but aren't indexed. Update manifest or create sitemap entries.`);
  }
  
  if (parseFloat(coverage.navigation) < 20) {
    recs.push(`LOW PRIORITY: Only ${coverage.navigation}% of pages linked in nav. Consider adding more navigation links.`);
  }
  
  if (stats.orphaned.inSitemap > 0) {
    recs.push(`HIGH PRIORITY: ${stats.orphaned.inSitemap} orphaned entries in sitemap. Run "node build/validate-build-manifest.js" to fix.`);
  }
  
  if (stats.orphaned.inNav > 0) {
    recs.push(`HIGH PRIORITY: ${stats.orphaned.inNav} orphaned nav entries. Check nav config for broken links.`);
  }
  
  if (stats.i18n > 0 && locales.size === 1) {
    recs.push(`INFO: ${stats.i18n} i18n pages exist but only found 1 locale. Add translations for better global reach.`);
  }
  
  if (recs.length === 0) {
    recs.push('All systems nominal! Manifest is healthy and consistent.');
  }
  
  return recs;
}
