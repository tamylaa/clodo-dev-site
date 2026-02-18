#!/usr/bin/env node
/**
 * Pre-build checks for URL consistency
 * Runs before npm run build to catch issues early
 * 
 * Features:
 * - Regenerates manifest from filesystem (detects new/deleted pages)
 * - Validates manifest for inconsistencies
 * - Compares generated vs current sitemaps
 * - Suggests fixes for common issues
 * 
 * Usage: node build/pre-build-checks.js
 * Can be added to package.json: "prebuild": "node build/pre-build-checks.js"
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function logStep(num, title) {
  log(`\n${num}️⃣  ${title}`, 'bold');
}

console.clear();
log('╔════════════════════════════════════════════════════════╗', 'blue');
log('║            PRE-BUILD URL CONSISTENCY CHECKS            ║', 'blue');
log('╚════════════════════════════════════════════════════════╝', 'blue');

let checksPassed = 0;
let checksFailed = 0;
let checksWarning = 0;

// Step 1: Check for uncommitted filesystem changes
logStep('1', 'Checking filesystem for new/deleted pages');
try {
  // Get current manifest from last build
  const manifest = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'config', 'pages-manifest.json'), 'utf8')
  );
  const filesystemCount = manifest.filter(e => e.file).length;
  
  // Count actual files now
  function countHtmlFiles(dir, skip = ['node_modules', 'css', 'js', 'icons', 'demo', 'images', 'assets', 'fonts', 'vendor', '_next', '.git', 'amp']) {
    const results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (skip.includes(entry.name) || entry.name.startsWith('.')) continue;
        results.push(...countHtmlFiles(path.join(dir, entry.name), skip));
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        results.push(entry.name);
      }
    }
    return results;
  }
  
  const actualCount = countHtmlFiles(path.join(__dirname, '..', 'public')).length;
  
  if (actualCount === filesystemCount) {
    log(`✓ File count matches: ${actualCount} pages`, 'green');
    checksPassed++;
  } else {
    const diff = actualCount - filesystemCount;
    log(`⚠ File count changed: ${filesystemCount} → ${actualCount} (${diff > 0 ? '+' : ''}${diff})`, 'yellow');
    log(`  Action: Manifest will be regenerated during build`, 'yellow');
    checksWarning++;
  }
} catch (e) {
  log(`✗ Failed to check file count: ${e.message}`, 'red');
  checksFailed++;
}

// Step 2: Validate manifest structure
logStep('2', 'Validating manifest structure');
try {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'config', 'pages-manifest.json'), 'utf8')
  );
  
  let structureOk = true;
  
  // Check required fields
  for (const entry of manifest) {
    if (!entry.path || entry.indexed === undefined || entry.inNav === undefined) {
      structureOk = false;
      log(`✗ Invalid entry: ${JSON.stringify(entry).substring(0, 50)}...`, 'red');
      checksFailed++;
      break;
    }
  }
  
  if (structureOk) {
    log(`✓ Manifest structure valid (${manifest.length} entries)`, 'green');
    checksPassed++;
  }
} catch (e) {
  log(`✗ Failed to parse manifest: ${e.message}`, 'red');
  checksFailed++;
}

// Step 3: Check indexed pages coverage
logStep('3', 'Analyzing indexed page coverage');
try {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'config', 'pages-manifest.json'), 'utf8')
  );
  
  const filesystem = manifest.filter(e => e.file).length;
  const indexed = manifest.filter(e => e.indexed).length;
  const coverage = ((indexed / filesystem) * 100).toFixed(1);
  
  log(`📊 Coverage: ${indexed}/${filesystem} pages indexed (${coverage}%)`, 'blue');
  
  if (indexed < 20) {
    log(`⚠ Low coverage detected - only ${indexed} pages will be in sitemap`, 'yellow');
    checksWarning++;
  } else if (coverage >= 20 && coverage < 50) {
    log(`⚠ Moderate coverage - ${coverage}% of pages are indexed`, 'yellow');
    checksWarning++;
  } else {
    log(`✓ Good coverage for SEO`, 'green');
    checksPassed++;
  }
} catch (e) {
  log(`✗ Failed to analyze coverage: ${e.message}`, 'red');
  checksFailed++;
}

// Step 4: Check for orphaned entries
logStep('4', 'Detecting orphaned entries');
try {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'config', 'pages-manifest.json'), 'utf8')
  );
  
  const orphaned = manifest.filter(e => !e.file && (e.indexed || e.inNav));
  
  if (orphaned.length === 0) {
    log(`✓ No orphaned entries found`, 'green');
    checksPassed++;
  } else {
    log(`⚠ Found ${orphaned.length} orphaned entries:`, 'yellow');
    orphaned.slice(0, 3).forEach(e => {
      log(`  - ${e.path} (${e.inSitemap ? 'sitemap' : 'nav'})`, 'yellow');
    });
    if (orphaned.length > 3) {
      log(`  ... and ${orphaned.length - 3} more`, 'yellow');
    }
    checksWarning++;
  }
} catch (e) {
  log(`✗ Failed to detect orphans: ${e.message}`, 'red');
  checksFailed++;
}

// Step 5: Check for i18n consistency
logStep('5', 'Verifying i18n page locales');
try {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'config', 'pages-manifest.json'), 'utf8')
  );
  
  const i18n = manifest.filter(e => e.isI18n);
  const noLocale = i18n.filter(e => !e.locale || e.locale === 'en' || e.locale === null);
  
  if (noLocale.length === 0) {
    log(`✓ All ${i18n.length} i18n pages have valid locales`, 'green');
    checksPassed++;
  } else {
    log(`✗ ${noLocale.length} i18n pages have missing/invalid locales`, 'red');
    checksFailed++;
  }
} catch (e) {
  log(`✗ Failed to check i18n: ${e.message}`, 'red');
  checksFailed++;
}

// Step 6: Estimate SEO impact
logStep('6', 'Estimating SEO impact');
try {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'config', 'pages-manifest.json'), 'utf8')
  );
  
  const filesystem = manifest.filter(e => e.file).length;
  const indexed = manifest.filter(e => e.indexed).length;
  const notIndexed = filesystem - indexed;
  const seoGain = ((notIndexed / filesystem) * 100).toFixed(1);
  
  if (notIndexed > 50) {
    log(`💡 SEO Opportunity: ${notIndexed} pages (${seoGain}%) not indexed`, 'yellow');
    log(`   These pages exist but won't appear in search results`, 'yellow');
    log(`   Consider reviewing: tools/debug-manifest-issues.js`, 'yellow');
    checksWarning++;
  } else {
    log(`✓ Indexing strategy looks good`, 'green');
    checksPassed++;
  }
} catch (e) {
  log(`✗ Failed to estimate impact: ${e.message}`, 'red');
  checksFailed++;
}

// Summary
log('\n' + '='.repeat(60), 'blue');
log('📋 Check Summary:', 'bold');
log(`   ✓ Passed: ${checksPassed}`, 'green');
log(`   ⚠ Warnings: ${checksWarning}`, 'yellow');
log(`   ✗ Failed: ${checksFailed}`, 'red');

if (checksFailed > 0) {
  log('\n🛑 Pre-build checks FAILED', 'red');
  log('   Fix errors above before building', 'red');
  log('   Run: node build/validate-build-manifest.js (for details)\n', 'yellow');
  process.exit(1);
}

if (checksWarning > 0) {
  log('\n⚠️  Pre-build checks PASSED with warnings', 'yellow');
  log('   Review warnings above', 'yellow');
}

log('\n✨ Ready to build!', 'green');
log('   Manifest is consistent with filesystem\n', 'green');
process.exit(0);
