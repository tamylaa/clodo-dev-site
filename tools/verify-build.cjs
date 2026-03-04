#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const dist = process.argv[2] || 'dist';
const checks = [
  'index.html',
  'asset-manifest.json',
];

function exists(p) {
  try { return fs.existsSync(path.join(dist, p)); } catch { return false; }
}

let ok = true;
console.log('Verifying build artifacts in', dist);
for (const c of checks) {
  if (!exists(c)) {
    console.error('MISSING:', c);
    ok = false;
  } else {
    const stat = fs.statSync(path.join(dist, c));
    if (stat.size === 0) { console.error('EMPTY:', c); ok = false; } else console.log('OK:', c, `${(stat.size/1024).toFixed(1)}KB`);
  }
}

// Verify asset-manifest references resolve to real files
if (exists('asset-manifest.json')) {
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(dist, 'asset-manifest.json'), 'utf8'));
    let missing = 0;
    for (const [key, val] of Object.entries(manifest)) {
      const refPath = typeof val === 'string' ? val : null;
      if (refPath && !fs.existsSync(path.join(dist, refPath))) {
        console.error('MANIFEST REF MISSING:', key, '->', refPath);
        missing++;
      }
    }
    if (missing) { console.error(`${missing} manifest reference(s) missing`); ok = false; }
    else console.log('OK: all', Object.keys(manifest).length, 'asset-manifest refs resolve');
  } catch (e) { console.warn('WARN: could not validate asset-manifest:', e.message); }
}

// Check for CSS files
const cssDir = path.join(dist, 'css');
if (fs.existsSync(cssDir)) {
  const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
  if (!cssFiles.length) { console.error('MISSING: no CSS files in dist/css'); ok = false; }
  else console.log('OK: css files:', cssFiles.length);
} else { console.error('MISSING: dist/css directory'); ok = false; }

// Check for at least one JS file in dist/js when present
const jsDir = path.join(dist, 'js');
if (fs.existsSync(jsDir)) {
  const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
  if (!files.length) { console.warn('WARN: no .js files in dist/js'); }
  else console.log('OK: js files:', files.length);
}

// Check for images manifest
const imgManifest = path.join('data', 'images', 'seo', 'images.json');
if (fs.existsSync(imgManifest)) console.log('OK: image manifest exists'); else console.log('INFO: image manifest not present');

if (!ok) {
  console.error('Build verification failed');
  process.exit(2);
}

console.log('Build verification passed');
process.exit(0);
