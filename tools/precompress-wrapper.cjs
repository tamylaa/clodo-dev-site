#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');

// Environment-controlled wrapper for precompress-assets.js
// Set SKIP_PRECOMPRESS=1 to skip, or PUBLISH_PRECOMPRESSED=0 to skip when deploying behind Cloudflare
const skip = process.env.SKIP_PRECOMPRESS === '1' || process.env.PUBLISH_PRECOMPRESSED === '0';
if (skip) {
  console.log('Precompressing skipped via environment (SKIP_PRECOMPRESS or PUBLISH_PRECOMPRESSED)');
  process.exit(0);
}

const script = path.join(__dirname, 'precompress-assets.cjs');
const args = process.argv.slice(2);
const node = process.execPath;

const res = spawnSync(node, [script, ...args], { stdio: 'inherit' });
process.exit(res.status === null ? 1 : res.status);
