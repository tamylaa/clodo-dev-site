#!/usr/bin/env node
const { request } = require('https');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

const hostArg = process.argv[2] || 'https://www.clodo.dev';
const assets = process.argv.slice(3);
const defaultAssets = ['/', '/styles.css', '/js/init-preload.js', '/images/guides/cloudflare-stream/architecture-cloudflare-stream-pipeline-800x420.png'];
const targetAssets = assets.length ? assets : defaultAssets;

function checkAsset(base, asset) {
  return new Promise((resolve) => {
    try {
      const url = new URL(asset, base);
      const opts = { method: 'GET', headers: { 'Accept-Encoding': 'br,gzip' } };
      const req = request(url, opts, (res) => {
        // consume minimal data then abort to avoid large downloads
        res.on('data', () => {});
        res.on('end', () => {});

        const out = {
          url: url.href,
          status: res.statusCode,
          headers: res.headers,
        };
        resolve(out);
      });
      req.on('error', (e) => { resolve({ url: asset, error: e.message }); });
      req.setTimeout(5000, () => { req.abort(); resolve({ url: asset, error: 'timeout' }); });
      req.end();
    } catch (e) { resolve({ url: asset, error: e.message }); }
  });
}

(async () => {
  console.log('Cloudflare production check for', hostArg);
  const results = [];
  for (const a of targetAssets) {
    process.stdout.write(`Checking ${a} ... `);
    // eslint-disable-next-line no-await-in-loop
    const r = await checkAsset(hostArg, a);
    results.push(r);
    if (r.error) console.log('ERROR', r.error); else console.log(r.status, r.headers['content-encoding'] || '-', r.headers['cf-cache-status'] || '-');
  }

  const outDir = path.join('visual-tests');
  try { fs.mkdirSync(outDir, { recursive: true }); } catch {}
  const outPath = path.join(outDir, 'cloudflare-check.json');
  fs.writeFileSync(outPath, JSON.stringify({ checked: targetAssets, results }, null, 2), 'utf8');
  console.log('Results written to', outPath);
  // Print short guidance
  for (const r of results) {
    if (r.error) continue;
    const ce = r.headers['content-encoding'] || null;
    const cf = r.headers['cf-cache-status'] || null;
    const vary = r.headers['vary'] || null;
    const cc = r.headers['cache-control'] || null;
    console.log(`- ${r.url}: status=${r.status} encoding=${ce} cf-cache=${cf} vary=${vary} cache-control=${cc}`);
  }
})();
