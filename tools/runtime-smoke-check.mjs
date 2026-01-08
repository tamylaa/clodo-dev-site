#!/usr/bin/env node
import { spawn } from 'child_process';

// Use global fetch when available (Node 18+); fall back to dynamic import of node-fetch if needed
let fetchFn;
if (typeof fetch !== 'undefined') {
  fetchFn = fetch;
} else {
  // dynamic import allowed in ESM
  fetchFn = (await import('node-fetch')).default;
}

const PORT = process.env.SMOKE_PORT || 38200;
const BASE = `http://localhost:${PORT}`;
const DEV_CMD = 'node';
const DEV_ARGS = ['build/dev-server.js', '--port', String(PORT)];

const urls = [
  '/',
  '/docs.html',
  '/case-studies',
  '/case-studies/healthcare-saas-platform',
  '/blog/building-developer-communities',
  '/migrate'
];

console.log(`Starting dev server for smoke test on ${BASE}...`);
const proc = spawn(DEV_CMD, DEV_ARGS, { stdio: ['ignore', 'pipe', 'inherit'] });

let ready = false;
proc.stdout.setEncoding('utf8');
proc.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  if (!ready && /Dev Server running at|Ready for deployment|Home page:/i.test(chunk)) {
    ready = true;
  }
});

proc.on('error', (err) => {
  console.error('Failed to start dev server:', err);
  process.exit(1);
});

async function waitForReady(timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(BASE + '/');
      if (r.ok) return true;
    } catch (e) {
      // ignore
    }
    await new Promise(r => setTimeout(r, 300));
  }
  return false;
}

(async function run() {
  const ok = await waitForReady(15000);
  if (!ok) {
    console.error('Dev server did not become ready in time.');
    proc.kill();
    process.exit(1);
  }

  console.log('Server ready — running smoke checks...');
  let failures = 0;

  for (const u of urls) {
    try {
      const r = await fetch(BASE + u, { method: 'GET' });
      if (r.status >= 200 && r.status < 300) {
        console.log(`✅ ${u} -> ${r.status}`);
      } else {
        console.error(`❌ ${u} -> ${r.status}`);
        failures++;
      }
    } catch (e) {
      console.error(`❌ ${u} -> ERROR: ${e.message}`);
      failures++;
    }
  }

  proc.kill();
  process.exit(failures > 0 ? 1 : 0);
})();
