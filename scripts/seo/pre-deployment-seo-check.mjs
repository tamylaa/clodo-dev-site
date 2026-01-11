#!/usr/bin/env node
/**
 * Comprehensive SEO Pre-Deployment Verification Suite
 * Runs all SEO scripts and generates unified report
 * 
 * Usage: node scripts/seo/pre-deployment-seo-check.mjs --dir public --fix --generate-report
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { flags: {} };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.replace(/^--/, '');
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
      result.flags[key] = value;
    }
  }
  return result.flags;
}

async function runScript(scriptPath, args = []) {
  try {
    console.log(`   Running ${path.basename(scriptPath)}...`);
    const cmd = `node "${scriptPath}" ${args.join(' ')}`;
    const output = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    return { success: true, output };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function loadJsonReport(reportPath) {
  try {
    if (fs.existsSync(reportPath)) {
      return JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    }
  } catch (e) {
    console.warn(`   ⚠️  Could not load report: ${reportPath}`);
  }
  return null;
}

async function main() {
  const flags = parseArgs();
  const dir = flags.dir || 'public';
  const fix = flags.fix === true;
  const generateReport = flags['generate-report'] === true;
  const output = flags.output || 'reports/seo-pre-deployment-check.json';
  
  console.log(`\n╔═══════════════════════════════════════╗`);
  console.log(`║ 🚀 SEO Pre-Deployment Verification   ║`);
  console.log(`║    Complete Site Audit Suite         ║`);
  console.log(`╚═══════════════════════════════════════╝\n`);
  
  console.log(`📁 Target directory: ${dir}`);
  if (fix) console.log(`🔧 Fix mode: ENABLED`);
  console.log();
  
  const checks = {
    schemas: { status: 'pending', report: null },
    eeat: { status: 'pending', report: null },
    headings: { status: 'pending', report: null },
    internalLinks: { status: 'pending', report: null },
    canonicals: { status: 'pending', report: null },
    hreflangs: { status: 'pending', report: null }
  };
  
  const startTime = Date.now();
  
  // 1. Schema Validation & Generation
  console.log(`\n1️⃣  Schema Validation & Generation`);
  console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  const schemaScript = path.join(__dirname, 'schema-generator.mjs');
  if (fs.existsSync(schemaScript)) {
    const schemaResult = await runScript(schemaScript, ['--dir', dir]);
    checks.schemas.status = schemaResult.success ? 'completed' : 'failed';
    const schemaReport = loadJsonReport('reports/schema-audit.json');
    if (schemaReport) {
      checks.schemas.report = schemaReport;
      console.log(`   ✅ Schemas: ${schemaReport.valid}/${schemaReport.total} valid (${Math.round((schemaReport.valid/schemaReport.total)*100)}%)`);
    }
  } else {
    console.log(`   ⚠️  Schema script not found`);
  }
  
  // 2. E-E-A-T Signal Analysis
  console.log(`\n2️⃣  E-E-A-T Signal Analysis`);
  console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  const eeatScript = path.join(__dirname, 'eeat-enhancer.mjs');
  if (fs.existsSync(eeatScript)) {
    const args = ['--dir', dir];
    if (fix) args.push('--fix');
    const eeatResult = await runScript(eeatScript, args);
    checks.eeat.status = eeatResult.success ? 'completed' : 'failed';
    const eeatReport = loadJsonReport('reports/eeat-audit.json');
    if (eeatReport) {
      checks.eeat.report = eeatReport;
      console.log(`   ✅ E-E-A-T: Avg score ${eeatReport.avgScore}/${eeatReport.maxScore} (${Math.round((eeatReport.avgScore/eeatReport.maxScore)*100)}%)`);
      if (fix && eeatReport.modified > 0) {
        console.log(`   🔧 Enhanced ${eeatReport.modified} pages`);
      }
    }
  }
  
  // 3. Heading Hierarchy Validation
  console.log(`\n3️⃣  Heading Hierarchy Validation`);
  console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  const headingScript = path.join(__dirname, 'heading-validator.mjs');
  if (fs.existsSync(headingScript)) {
    const args = ['--dir', dir];
    if (fix) args.push('--fix');
    const headingResult = await runScript(headingScript, args);
    checks.headings.status = headingResult.success ? 'completed' : 'failed';
    const headingReport = loadJsonReport('reports/heading-audit.json');
    if (headingReport) {
      checks.headings.report = headingReport;
      console.log(`   ✅ Pages: ${headingReport.valid} valid, ${headingReport.invalid} need fixes`);
      if (headingReport.errors > 0) console.log(`   ❌ Errors: ${headingReport.errors}`);
      if (headingReport.warnings > 0) console.log(`   ⚠️  Warnings: ${headingReport.warnings}`);
    }
  }
  
  // 4. Internal Link Analysis
  console.log(`\n4️⃣  Internal Link Analysis`);
  console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  const linkScript = path.join(__dirname, 'internal-link-optimizer.mjs');
  if (fs.existsSync(linkScript)) {
    const linkResult = await runScript(linkScript, ['--dir', dir, '--analyze']);
    checks.internalLinks.status = linkResult.success ? 'completed' : 'failed';
    const linkReport = loadJsonReport('reports/internal-links-audit.json');
    if (linkReport) {
      checks.internalLinks.report = linkReport;
      console.log(`   ✅ Pages scanned: ${linkReport.scanned}`);
      console.log(`   💬 Optimal: ${linkReport.optimal}, Needs work: ${linkReport.needsImprovement}`);
      console.log(`   📊 Avg links/page: ${linkReport.metrics.avgInternalLinks}`);
      if (linkReport.metrics.orphanedPages > 0) {
        console.log(`   ⚠️  Orphaned pages (no internal links): ${linkReport.metrics.orphanedPages}`);
      }
    }
  }
  
  // 5. Canonical Consistency
  console.log(`\n5️⃣  Canonical Consistency Check`);
  console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  const canonicalScript = path.join(__dirname, 'check-canonical-consistency.mjs');
  if (fs.existsSync(canonicalScript)) {
    const canonicalResult = await runScript(canonicalScript, ['--dir', dir]);
    checks.canonicals.status = canonicalResult.success ? 'completed' : 'failed';
    console.log(`   ✅ Canonical verification complete`);
  }
  
  // 6. Hreflang Tags
  console.log(`\n6️⃣  Hreflang Tag Validation`);
  console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  const hreflangScript = path.join(__dirname, 'fix-hreflang-tags.mjs');
  if (fs.existsSync(hreflangScript)) {
    const args = ['--dir', dir];
    if (fix) args.push('--fix');
    const hreflangResult = await runScript(hreflangScript, args);
    checks.hreflangs.status = hreflangResult.success ? 'completed' : 'failed';
    console.log(`   ✅ Hreflang verification complete`);
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Generate unified report
  const report = {
    timestamp: new Date().toISOString(),
    duration: `${duration}s`,
    directory: dir,
    fixMode: fix,
    checks,
    summary: {
      completedChecks: Object.values(checks).filter(c => c.status === 'completed').length,
      totalChecks: Object.keys(checks).length,
      allPassed: Object.values(checks).every(c => c.status !== 'failed')
    },
    recommendations: generateRecommendations(checks)
  };
  
  // Save report
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(report, null, 2));
  
  // Print summary
  console.log(`\n╔═══════════════════════════════════════╗`);
  console.log(`║ ✅ SEO Verification Complete          ║`);
  console.log(`╚═══════════════════════════════════════╝\n`);
  
  console.log(`📊 Summary:`);
  console.log(`   Checks completed: ${report.summary.completedChecks}/${report.summary.totalChecks}`);
  console.log(`   Duration: ${duration}s`);
  console.log(`   Status: ${report.summary.allPassed ? '✅ READY FOR DEPLOYMENT' : '⚠️  REVIEW NEEDED'}`);
  
  if (report.recommendations.length > 0) {
    console.log(`\n💡 Recommendations:`);
    report.recommendations.slice(0, 5).forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
  }
  
  console.log(`\n📋 Full report: ${output}\n`);
  
  process.exit(report.summary.allPassed ? 0 : 1);
}

function generateRecommendations(checks) {
  const recommendations = [];
  
  if (checks.schemas.report && checks.schemas.report.valid < checks.schemas.report.total) {
    recommendations.push(`Update ${checks.schemas.report.total - checks.schemas.report.valid} pages with correct schemas`);
  }
  
  if (checks.eeat.report && checks.eeat.report.avgScore < checks.eeat.report.maxScore * 0.7) {
    recommendations.push('Improve E-E-A-T signals - add author info, credentials, publication dates');
  }
  
  if (checks.headings.report && checks.headings.report.errors > 0) {
    recommendations.push(`Fix ${checks.headings.report.errors} heading hierarchy errors`);
  }
  
  if (checks.internalLinks.report && checks.internalLinks.report.metrics.orphanedPages > 0) {
    recommendations.push(`Add internal links to ${checks.internalLinks.report.metrics.orphanedPages} orphaned pages`);
  }
  
  if (checks.internalLinks.report) {
    const genericAnchor = checks.internalLinks.report.results?.filter(r => r.anchorTextQuality?.generic > 0).length || 0;
    if (genericAnchor > 0) {
      recommendations.push(`Improve anchor text on ${genericAnchor} pages (avoid generic "click here")`);
    }
  }
  
  return recommendations;
}

main().catch(e => {
  console.error('❌ Fatal error:', e.message);
  process.exit(1);
});
