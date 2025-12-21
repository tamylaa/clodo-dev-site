#!/usr/bin/env node
/**
 * run_lighthouse.js (ESM)
 * - Simple Lighthouse runner that saves JSON reports to reports/lighthouse
 * - Usage: node scripts/perf/run_lighthouse.js --urls=public/how-to-migrate-from-wrangler.html,public/clodo-framework-api-simplification.html
 * Note: Install lighthouse (npm i -D lighthouse) and run on a machine with Chrome.
 */
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import minimist from 'minimist';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const args = minimist(process.argv.slice(2));
const urlsArg = args.urls || '';
if (!urlsArg) {
  console.error('No urls specified. Use --urls=path1,path2');
  process.exit(1);
}
const urls = urlsArg.split(',');
const outDir = path.join(__dirname, '..', '..', 'reports', 'lighthouse');
await fs.mkdir(outDir, { recursive: true });
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
