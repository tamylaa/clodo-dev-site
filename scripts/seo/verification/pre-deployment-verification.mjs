#!/usr/bin/env node
/**
 * pre-deployment-verification.mjs
 * 
 * Comprehensive verification to ensure all canonical and URL fixes are correct
 * before deploying to production. This checks for potential issues that could
 * cause indexing problems or broken links.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ISSUES = [];
const WARNINGS = [];
const SUCCESSES = [];

function getAllHtmlFiles(dir, rel = '') {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const r = rel ? join(rel, name) : name;
    if (statSync(full).isDirectory()) {
      out.push(...getAllHtmlFiles(full, r));
    } else if (name.endsWith('.html')) {
      out.push(r.replace(/\\/g, '/'));
    }
  }
  return out;
}

function checkFile(filePath, content) {
  const file = filePath.replace(/\\/g, '/');
  const issues = [];
  
  // Skip files that are explicitly noindex
  if (content.includes('noindex')) {
    return []; // These don't need canonical
  }
  
  // Check 1: Must have canonical tag
  const canonicalMatch = content.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  if (!canonicalMatch) {
    // Some files intentionally don't have canonical (robots blocked, etc)
    if (!file.includes('analytics') && !file.includes('performance-dashboard') && !file.includes('google')) {
      issues.push(`No canonical tag found`);
    }
    return issues;
  }
  
  const canonical = canonicalMatch[1];
  
  // Check 2: Canonical must use www.clodo.dev
  if (!canonical.includes('www.clodo.dev')) {
    issues.push(`Canonical missing www: ${canonical}`);
  }
  
  // Check 3: Canonical should start with https
  if (!canonical.startsWith('https://')) {
    issues.push(`Canonical not HTTPS: ${canonical}`);
  }
  
  // Check 4: Canonical should not have .html extension
  if (canonical.includes('.html')) {
    issues.push(`Canonical has .html extension: ${canonical}`);
  }
  
  // Check 5: Canonical should not have .amp in path (unless it's the canonical pointing to non-AMP)
  if (canonical.includes('.amp.html') || canonical.includes('/amp/')) {
    issues.push(`AMP canonical incorrectly formatted: ${canonical}`);
  }
  
  // Check 6: For AMP files, canonical should point to non-AMP version
  if (file.includes('.amp.html')) {
    if (canonical.includes('.amp') || canonical.includes('/amp/')) {
      issues.push(`AMP file canonical should point to non-AMP version, got: ${canonical}`);
    }
    // Verify it points to correct blog post
    const ampName = file.replace(/\.amp\.html$/, '').split('/').pop();
    // AMP index files are OK pointing to /blog/
    if (ampName !== 'index' && !canonical.includes(ampName)) {
      WARNINGS.push(`[${file}] AMP canonical might not match post name: ${canonical}`);
    }
  }
  
  // Check 7: Index files should have trailing slash
  if (file.endsWith('/index.html')) {
    if (!canonical.endsWith('/')) {
      issues.push(`Index file canonical should end with /: ${canonical}`);
    }
  }
  
  // Check 8: Hreflang consistency (if file has hreflang)
  const hreflangMatches = content.match(/rel=["']alternate["']\s+hreflang=["']([^"']+)["']\s+href=["']([^"']+)["']/gi) || [];
  if (hreflangMatches.length > 0) {
    hreflangMatches.forEach(hreflang => {
      if (hreflang.includes('https://clodo.dev/') && !hreflang.includes('www')) {
        issues.push(`Hreflang missing www: ${hreflang}`);
      }
    });
  }
  
  return issues;
}

function main() {
  const scanDir = 'public';
  const files = getAllHtmlFiles(scanDir);
  
  console.log(`\n🔍 Pre-Deployment Verification`);
  console.log(`Scanning: ${scanDir}`);
  console.log(`Files: ${files.length}\n`);
  
  let filesWithIssues = 0;
  let checkedFiles = 0;
  
  for (const file of files) {
    try {
      const absPath = join(scanDir, file);
      const content = readFileSync(absPath, 'utf8');
      
      // Only check files that should have canonicals
      if (content.includes('rel="canonical"') || !file.includes('analytics') && !file.includes('performance')) {
        const issues = checkFile(absPath, content);
        checkedFiles++;
        
        if (issues.length > 0) {
          filesWithIssues++;
          console.log(`❌ ${file}`);
          issues.forEach(issue => console.log(`   - ${issue}`));
        }
      }
    } catch (err) {
      ISSUES.push(`${file}: ${err.message}`);
      console.log(`⚠️  ${file}: ${err.message}`);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`  Total files: ${files.length}`);
  console.log(`  Checked: ${checkedFiles}`);
  console.log(`  Files with issues: ${filesWithIssues}`);
  console.log(`  Warnings: ${WARNINGS.length}`);
  
  if (WARNINGS.length > 0) {
    console.log(`\n⚠️  Warnings (non-blocking):`);
    WARNINGS.forEach(w => console.log(`  - ${w}`));
  }
  
  if (filesWithIssues === 0 && ISSUES.length === 0) {
    console.log(`\n✅ All checks passed! Safe to deploy.`);
    return true;
  } else {
    console.log(`\n❌ Issues found. Review before deployment.`);
    return false;
  }
}

const passed = main();
process.exit(passed ? 0 : 1);
