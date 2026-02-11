#!/usr/bin/env node
/*
Runner for Cloudflare Worker synthetic test using Miniflare (local).
- Spawns `npx miniflare worker.js --port 8787` in the worker folder
- Waits for the server, then calls worker endpoint and saves JSON
*/

import { spawn } from 'child_process';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKER_DIR = path.join(__dirname, 'cloudflare-worker');
const PORT = process.env.PORT || 8787;
const RUNS = parseInt(process.argv[2] || '5', 10);
const TARGET = process.env.TARGET || 'https://clodo.dev/edge-vs-cloud-computing';

function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

async function waitForServer(url, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) return true;
    } catch (e) { }
    await sleep(500);
  }
  throw new Error('Server did not become reachable in time');
}

console.log('Starting Miniflare (local Cloudflare Worker runtime) programmatically ...');
// Use Miniflare programmatic API (avoids shell/OS issues)
import { Miniflare } from 'miniflare';
const mf = new Miniflare({
  scriptPath: path.join(WORKER_DIR,'worker.mjs'),
  modules: true,
  watch: false,
});

console.log('Running the synthetic sweep using Miniflare.dispatchFetch() ...');
const results = [];
for (let i=0;i<RUNS;i++){
  process.stdout.write(`Run ${i+1}/${RUNS} ... `);
  try {
    const res = await mf.dispatchFetch(`http://worker/?u=${encodeURIComponent(TARGET)}&n=1`);
    const json = await res.json();
    results.push({success:true, json});
    console.log('OK', json.results && json.results[0] ? `ttfb=${json.results[0].ttfb}ms total=${json.results[0].total}ms bytes=${json.results[0].bytes}` : 'no-data');
  } catch (err) {
    console.log('ERROR', err.message);
    results.push({success:false, error: String(err)});
  }
  await sleep(400);
}

const outDir = path.resolve(process.cwd(),'data','benchmarks','cloud-vs-edge');
fs.mkdirSync(outDir, { recursive:true });
const outFile = path.join(outDir, `cloudflare-worker-synthetic-${Date.now()}.json`);
fs.writeFileSync(outFile, JSON.stringify({ meta:{target:TARGET, runs:RUNS, when: new Date().toISOString()}, results }, null, 2));
console.log('Saved sweep to', outFile);

// Miniflare used programmatically — nothing to kill
process.exit(0);
