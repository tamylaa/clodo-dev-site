#!/usr/bin/env node

/**
 * Lighthouse Performance Audit Script
 *
 * Runs automated Lighthouse performance audits with proper Chrome configuration
 * to avoid interstitial errors and ensure reliable performance measurements.
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';

console.log('🔍 Lighthouse Performance Audit Tool');
console.log('=====================================');

// Configuration
const config = {
  outputDir: './lighthouse-results',
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
  ]
};

function ensureOutputDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log(`📁 Created output directory: ${dir}`);
  }
}

function buildProject() {
  console.log('� Building project...');
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

function runAudit() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = join(config.outputDir, `lighthouse-report-${timestamp}`);

  // Build Chrome flags string
  const chromeFlagsStr = `--chrome-flags="${config.chromeFlags.join(' ')}"`;

  // Build Lighthouse command
  const cmd = `npx lighthouse http://localhost:3000 --output html --output json --output-path ${reportPath} ${chromeFlagsStr} --view`;

  console.log('⏳ Running Lighthouse audit on built files...');
  console.log(`Command: ${cmd}`);

  try {
    execSync(cmd, {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    console.log('✅ Lighthouse audit completed successfully!');
    console.log(`📊 Reports saved to: ${reportPath}.report.html`);

  } catch (error) {
    console.error('❌ Lighthouse audit failed!');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

async function main() {
  try {
    ensureOutputDir(config.outputDir);

    // Build the project
    buildProject();

    // Start static server
    const server = await startStaticServer();

    // Run the audit
    runAudit();

    // Clean up server
    server.kill();

    console.log('');
    console.log('🎉 Performance audit complete!');

  } catch (error) {
    console.error('💥 Audit failed:', error.message);
    process.exit(1);
  }
}

main();