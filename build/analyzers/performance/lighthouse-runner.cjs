#!/usr/bin/env node
/**
 * run_lighthouse.cjs
 * - Simple Lighthouse runner that saves JSON reports to reports/lighthouse
 * - Usage: node scripts/perf/run_lighthouse.cjs --urls=public/how-to-migrate-from-wrangler.html,public/clodo-framework-api-simplification.html
 * Note: Install lighthouse (npm i -D lighthouse) and run on a machine with Chrome.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const args = require('minimist')(process.argv.slice(2));
const urlsArg = args.urls || '';
if (!urlsArg) {
  console.error('No urls specified. Use --urls=path1,path2');
  process.exit(1);
}
const urls = urlsArg.split(',');
const outDir = path.join(__dirname, '..', '..', 'reports', 'lighthouse');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
for (const u of urls) {
  const fullUrl = u.startsWith('http') ? u : `https://www.clodo.dev/${u.replace(/^public\//,'')}`;
  const safeName = u.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const outFile = path.join(outDir, `${safeName}.report.json`);
  console.log('Running lighthouse for', fullUrl);
  try {
    execSync(`npx lighthouse "${fullUrl}" --output=json --output-path="${outFile}" --emulated-form-factor=mobile --quiet`, { stdio: 'inherit' });
    console.log('Saved report to', outFile);
  } catch (err) {
    console.error('Lighthouse run failed for', fullUrl);
  }
}
console.log('Lighthouse runs complete.');
