#!/usr/bin/env node

/**
 * Lighthouse Performance Audit Script
 *
 * Runs automated Lighthouse performance audits on both local build and production
 * with proper Chrome configuration to avoid interstitial errors and ensure
 * reliable performance measurements.
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';

console.log('🔍 Lighthouse Performance Audit Tool');
console.log('=====================================');

// Configuration
const config = {
  outputDir: './lighthouse-results',
  localUrl: 'http://localhost:3000',
  productionUrl: 'https://www.clodo.dev',
  chromeFlags: [
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor',
    '--no-first-run',
    '--disable-default-apps',
    '--mute-audio',
    '--disable-logging',
    '--allow-running-insecure-content',
    '--ignore-certificate-errors'
  ],
  performanceThreshold: 80 // Alert if performance drops below this
};

function ensureOutputDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log(`📁 Created output directory: ${dir}`);
  }
}

function buildProject() {
  console.log('🔨 Building project...');
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: process.cwd() });
    console.log('✅ Build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

function startStaticServer() {
  console.log('🌐 Starting static file server...');

  // Use http-server
  const server = spawn('npx', ['http-server', 'dist', '-p', '3000', '-s'], {
    stdio: 'ignore',
    cwd: process.cwd(),
    shell: true
  });

  // Wait a bit for server to start
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('✅ Static server started on http://localhost:3000');
      resolve(server);
    }, 2000);
  });
}

function runAudit(url, environment) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const envLabel = environment.toUpperCase();
  const reportPath = join(config.outputDir, `lighthouse-${environment}-${timestamp}`);

  // Build Chrome flags string
  const chromeFlagsStr = `--chrome-flags="${config.chromeFlags.join(' ')}"`;

  // Build Lighthouse command
  const cmd = `npx lighthouse ${url} --output html --output json --output-path ${reportPath} ${chromeFlagsStr}`;

  console.log(`\n⏳ Running Lighthouse audit on ${envLabel} (${url})...`);
  console.log('⏱️  This may take 2-3 minutes per environment...\n');

  try {
    execSync(cmd, {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    console.log(`✅ ${envLabel} Lighthouse audit completed!`);
    console.log(`📊 Reports saved to: ${reportPath}.report.html`);

    // Parse the JSON report to extract scores
    const jsonReport = JSON.parse(readFileSync(`${reportPath}.report.json`, 'utf-8'));
    const scores = jsonReport.categories;
    
    return {
      environment,
      url,
      reportPath: `${reportPath}.report.html`,
      scores: {
        performance: Math.round(scores.performance.score * 100),
        accessibility: Math.round(scores.accessibility.score * 100),
        seo: Math.round(scores.seo.score * 100),
        'best-practices': Math.round(scores['best-practices'].score * 100)
      }
    };

  } catch (error) {
    console.error(`❌ ${envLabel} Lighthouse audit failed!`);
    console.error('Error:', error.message);
    return null;
  }
}

function generateComparisonReport(localResult, productionResult) {
  if (!localResult || !productionResult) {
    console.log('\n⚠️  Could not generate comparison report (missing results)');
    return;
  }

  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('📊 PERFORMANCE COMPARISON REPORT');
  console.log('═══════════════════════════════════════════════════════════\n');

  const categories = ['performance', 'accessibility', 'seo', 'best-practices'];
  
  console.log('Metric              Local        Production   Delta');
  console.log('─'.repeat(56));

  let performanceAlert = false;

  for (const category of categories) {
    const localScore = localResult.scores[category];
    const prodScore = productionResult.scores[category];
    const delta = prodScore - localScore;
    const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;
    const deltaColor = delta < -10 ? '🔴' : delta < 0 ? '🟡' : '🟢';

    if (category === 'performance' && delta < -10) {
      performanceAlert = true;
    }

    console.log(
      `${category.padEnd(20)} ${String(localScore).padEnd(12)} ${String(prodScore).padEnd(12)} ${deltaColor} ${deltaStr}`
    );
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');

  if (performanceAlert) {
    console.log('⚠️  ALERT: Production performance is >10 points lower than local!');
    console.log('   This may indicate a deployment issue or performance regression.\n');
  }

  if (productionResult.scores.performance >= 90) {
    console.log('✅ EXCELLENT: Production performance is 90+ (target met!)\n');
  } else if (productionResult.scores.performance >= 80) {
    console.log('👍 GOOD: Production performance is 80+\n');
  } else {
    console.log('⚠️  WARNING: Production performance is below 80\n');
  }

  console.log(`📄 Local Report:      ${localResult.reportPath}`);
  console.log(`📄 Production Report: ${productionResult.reportPath}\n`);
}

async function main() {
  try {
    ensureOutputDir(config.outputDir);

    // Build the project
    buildProject();

    // Start static server
    const server = await startStaticServer();

    // Run local audit
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║ PHASE 1: LOCAL BUILD AUDIT (with 3G throttling)          ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    const localResult = runAudit(config.localUrl, 'local');

    // Run production audit
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║ PHASE 2: PRODUCTION AUDIT (www.clodo.dev)                ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    const productionResult = runAudit(config.productionUrl, 'production');

    // Clean up server
    server.kill();

    // Generate comparison report
    generateComparisonReport(localResult, productionResult);

    console.log('🎉 All audits complete!\n');

  } catch (error) {
    console.error('💥 Audit failed:', error.message);
    process.exit(1);
  }
}

main();