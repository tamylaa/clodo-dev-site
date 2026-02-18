#!/usr/bin/env node
/**
 * CI/CD Pipeline Manifest Monitoring
 * Runs in continuous integration to detect URL consistency regressions
 * 
 * Features:
 * - Compares current manifest against baseline
 * - Detects new files, deleted files, unindexed pages
 * - Generates reports for deployment
 * - Fails CI if coverage drops below threshold
 * 
 * Usage: node build/ci-manifest-check.js [--baseline baseline.json] [--threshold 20]
 * Exit code: 0 (pass) | 1 (fail)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse arguments
const args = process.argv.slice(2);
let baselinePath = path.join(__dirname, '..', '.ci', 'manifest-baseline.json');
let coverageThreshold = 20; // Minimum % of pages that should be indexed

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--baseline') baselinePath = args[i + 1];
  if (args[i] === '--threshold') coverageThreshold = parseInt(args[i + 1]);
}

console.log('🔍 CI/CD Manifest Monitor\n');

// Load current manifest
const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'config', 'pages-manifest.json'), 'utf8')
);

const current = {
  timestamp: new Date().toISOString(),
  filesystemCount: manifest.filter(e => e.file).length,
  indexedCount: manifest.filter(e => e.indexed).length,
  inNavCount: manifest.filter(e => e.inNav).length,
  adminCount: manifest.filter(e => e.isAdmin).length,
  experimentCount: manifest.filter(e => e.isExperiment).length,
  i18nCount: manifest.filter(e => e.isI18n).length,
  coverage: manifest.filter(e => e.indexed).length / manifest.filter(e => e.file).length * 100
};

console.log('📊 Current State:');
console.log(`   Filesystem: ${current.filesystemCount} pages`);
console.log(`   Indexed: ${current.indexedCount} pages`);
console.log(`   Coverage: ${current.coverage.toFixed(1)}%`);
console.log(`   In Nav: ${current.inNavCount}`);
console.log(`   Admin: ${current.adminCount}`);
console.log(`   Experiments: ${current.experimentCount}`);
console.log(`   I18n: ${current.i18nCount}`);

let failed = false;

// Check against baseline if exists
if (fs.existsSync(baselinePath)) {
  console.log('\n📈 Comparing against baseline...');
  
  try {
    const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    
    // Check for regressions
    const filesystemDiff = current.filesystemCount - baseline.filesystemCount;
    const indexedDiff = current.indexedCount - baseline.indexedCount;
    const coverageDiff = current.coverage - baseline.coverage;
    
    console.log(`   Files: ${baseline.filesystemCount} → ${current.filesystemCount} (${filesystemDiff > 0 ? '+' : ''}${filesystemDiff})`);
    console.log(`   Indexed: ${baseline.indexedCount} → ${current.indexedCount} (${indexedDiff > 0 ? '+' : ''}${indexedDiff})`);
    console.log(`   Coverage: ${baseline.coverage.toFixed(1)}% → ${current.coverage.toFixed(1)}% (${coverageDiff > 0 ? '+' : ''}${coverageDiff.toFixed(1)}%)`);
    
    // Warnings
    if (filesystemDiff > 20) {
      console.warn(`\n⚠️  Large filesystem growth: +${filesystemDiff} pages\n   Review if intentional`);
    }
    
    if (coverageDiff < -5) {
      console.error(`\n❌ Coverage regression detected: ${coverageDiff.toFixed(1)}%\n   New pages added but not indexed`);
      failed = true;
    }
    
  } catch (e) {
    console.error(`⚠️  Could not read baseline: ${e.message}`);
  }
} else {
  console.log(`\n💾 No baseline found - creating: ${baselinePath}`);
  const ciDir = path.dirname(baselinePath);
  if (!fs.existsSync(ciDir)) fs.mkdirSync(ciDir, { recursive: true });
}

// Check coverage threshold
console.log(`\n⚙️  Checking coverage threshold: ${coverageThreshold}%`);
if (current.coverage < coverageThreshold) {
  console.error(`❌ Coverage ${current.coverage.toFixed(1)}% is below threshold ${coverageThreshold}%`);
  failed = true;
} else {
  console.log(`✓ Coverage ${current.coverage.toFixed(1)}% meets threshold`);
}

// Save current as new baseline
const outPath = baselinePath;
const outDir = path.dirname(outPath);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(current, null, 2), 'utf8');
console.log(`\n💾 Baseline saved: ${outPath}`);

// Report
console.log('\n' + '='.repeat(60));
if (failed) {
  console.error('❌ CI Check FAILED');
  process.exit(1);
} else {
  console.log('✅ CI Check PASSED');
  process.exit(0);
}
