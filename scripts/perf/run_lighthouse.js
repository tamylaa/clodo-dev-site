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
  const tmpOut = outFile + '.tmp';

  // Preflight: skip URLs that don't return a successful response (helps avoid running Lighthouse on 404s)
  try {
    const resp = await fetch(fullUrl, { method: 'HEAD' });
    if (!resp.ok) {
      console.warn(`Skipping ${fullUrl} - preflight status ${resp.status}`);
      continue;
    }
  } catch (e) {
    console.warn(`Skipping ${fullUrl} - preflight failed: ${e.message}`);
    continue;
  }

  console.log('Running lighthouse for', fullUrl);

  // Prepare a unique user-data-dir for Chrome to avoid collisions/EBUSY on Windows
  const os = await import('os');
  const tmpBase = os.tmpdir();
  const tmpDir = path.join(tmpBase, `lighthouse-${safeName}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await fs.mkdir(tmpDir, { recursive: true });

  // Retry on transient failures (e.g., locked temp files on Windows when Chrome launches)
  const maxAttempts = 3;
  let attempt = 0;
  let succeeded = false;
  while (attempt < maxAttempts && !succeeded) {
    attempt++;
    try {
      // Safer chrome flags for CI and Windows environments, with explicit user-data-dir per run
      const chromeFlags = `--emulated-form-factor=mobile --chrome-flags="--headless --no-sandbox --disable-dev-shm-usage --user-data-dir=${tmpDir}"`;
      // Write to a temporary output file and rename on success to avoid invalid JSON leftovers
      execSync(`npx lighthouse "${fullUrl}" --output=json --output-path="${tmpOut}" ${chromeFlags} --quiet`, { stdio: 'inherit' });
      // Ensure temp file exists and is valid JSON before moving
      try {
        const raw = await fs.readFile(tmpOut, 'utf8');
        JSON.parse(raw);
        await fs.rename(tmpOut, outFile);
        console.log('Saved report to', outFile);
        succeeded = true;
      } catch (e) {
        console.error(`Report written but invalid for ${fullUrl}: ${e.message}`);
        // Remove bad temp file
        try { await fs.rm(tmpOut, { force: true }); } catch (_) { /* ignore cleanup errors */ }
        throw new Error('Invalid report generated');
      }
    } catch (err) {
      console.error(`Lighthouse run failed for ${fullUrl} (attempt ${attempt}): ${err.message}`);
      if (attempt < maxAttempts) {
        console.log('Retrying in 1s...');
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  // Cleanup per-run temp dir
  try {
    await fs.rm(tmpDir, { recursive: true, force: true });
  } catch (e) {
    console.warn('Failed to remove temp dir', tmpDir, e.message);
  }

  if (!succeeded) {
    console.error(`Failed to generate Lighthouse report for ${fullUrl} after ${maxAttempts} attempts`);
  }
}
console.log('Lighthouse runs complete.');
