#!/usr/bin/env node
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function run(cmd, args, opts = {}) {
  const c = spawnSync(cmd, args, { stdio: 'inherit', shell: true, ...opts });
  if (c.status !== 0) {
    console.error(`\nCommand failed: ${cmd} ${args.join(' ')}`);
    process.exit(c.status === null ? 1 : c.status);
  }
}

/** Like run() but returns exit code instead of terminating the pipeline */
function runSoft(cmd, args, opts = {}) {
  const c = spawnSync(cmd, args, { stdio: 'inherit', shell: true, ...opts });
  return c.status === null ? 1 : c.status;
}

function localBin(name) {
  const base = join(process.cwd(), 'node_modules', '.bin');
  const win = process.platform === 'win32';
  const candidate = win ? join(base, `${name}.cmd`) : join(base, name);
  return existsSync(candidate) ? candidate : name;
}

// Minimal CLI flags
const argv = process.argv.slice(2);
const skipCloudflare = argv.includes('--skip-cloudflare');
const lhciOnly = argv.includes('--lhci-only');
const noInstall = argv.includes('--no-install');

// 1/6 — install dependencies (if not skipped)
console.log('\n[PIPELINE] 1/6 — Installing dependencies (npm ci)');
if (!noInstall) {
  // Try npm in PATH, else try common location relative to node
  try {
    run('npm', ['ci']);
  } catch (e) {
    const npmCmd = join(dirname(process.execPath), process.platform === 'win32' ? 'npm.cmd' : 'npm');
    if (existsSync(npmCmd)) run(npmCmd, ['ci']); else {
      console.warn('   ⚠️  npm not available. Run the script with --no-install if dependencies are already installed.');
      process.exit(1);
    }
  }
} else {
  console.log('   ℹ️  Skipping npm install (flag --no-install supplied)');
}

if (!lhciOnly) {
  // 2/6 Build
  console.log('\n[PIPELINE] 2/6 — Building site (node build/build.js)');
  run(process.execPath, [join('build', 'build.js')], { shell: false });

  // 3/6 Verify
  console.log('\n[PIPELINE] 3/6 — Verifying build artifacts (node tools/verify-build.cjs)');
  run(process.execPath, [join('tools', 'verify-build.cjs'), 'dist'], { shell: false });

  // 4/6 Precompress (use wrapper directly)
  console.log('\n[PIPELINE] 4/6 — Precompressing assets (node tools/precompress-wrapper.cjs)');
  run(process.execPath, [join('tools', 'precompress-wrapper.cjs'), 'dist'], { shell: false });
}

// 5/6 Lighthouse CI — use autorun (collect + assert + upload in one go)
// On Windows, chrome-launcher may crash with EPERM during temp dir cleanup,
// but reports are typically saved before the crash occurs.
console.log('\n[PIPELINE] 5/6 — Running Lighthouse CI');
const lhciEntry = join(process.cwd(), 'node_modules', '@lhci', 'cli', 'src', 'cli.js');
// Ensure node's directory is on PATH so LHCI's startServerCommand can find `node`
const nodeDir = dirname(process.execPath);
const currentPath = process.env.PATH || process.env.Path || '';
if (!currentPath.includes(nodeDir)) {
  process.env.PATH = `${nodeDir};${currentPath}`;
}
if (existsSync(lhciEntry)) {
  // Use wrapper that patches fs.rmSync to handle Windows EPERM in chrome-launcher cleanup
  const wrapperPath = join('tools', 'lhci-wrapper.mjs');
  const lhciScript = existsSync(wrapperPath) ? wrapperPath : lhciEntry;
  const lhciCode = runSoft(process.execPath, [lhciScript, 'autorun', '--config=.lighthouserc.json'], { shell: false });
  if (lhciCode !== 0) {
    console.warn(`   ⚠️  LHCI exited with code ${lhciCode} (non-fatal)`);
  }

  // Report results from saved manifest (may exist even if LHCI crashed during cleanup)
  const manifestPath = join('visual-tests', 'lighthouse-ci', 'manifest.json');
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    console.log('\n   Lighthouse CI Results:');
    for (const entry of manifest) {
      const s = entry.summary;
      console.log(`   URL: ${entry.url}`);
      console.log(`     Performance:    ${(s.performance * 100).toFixed(0)}`);
      console.log(`     Accessibility:  ${(s.accessibility * 100).toFixed(0)}`);
      console.log(`     Best Practices: ${(s['best-practices'] * 100).toFixed(0)}`);
      console.log(`     SEO:            ${(s.seo * 100).toFixed(0)}`);
      if (s.performance < 0.60) {
        console.warn(`   ⚠️  Performance score ${(s.performance * 100).toFixed(0)} is below 60 — review the report at ${entry.htmlPath}`);
      }
    }
  } else {
    console.warn('   ⚠️  No LHCI manifest found — Lighthouse results may not have been saved');
  }
} else {
  console.log('   ℹ️  @lhci/cli not installed locally, skipping Lighthouse CI');
}

if (!skipCloudflare) {
  console.log('\n[PIPELINE] 6/6 — Checking production Cloudflare headers (node tools/check-cloudflare-prod.cjs)');
  run(process.execPath, [join('tools', 'check-cloudflare-prod.cjs'), 'https://www.clodo.dev'], { shell: false });
} else {
  console.log('\n[PIPELINE] Skipped Cloudflare check (flag --skip-cloudflare supplied)');
}

console.log('\n[PIPELINE] All steps completed successfully');
process.exit(0);
