#!/usr/bin/env node
/**
 * Wrapper around LHCI that patches fs.rmSync to handle Windows EPERM errors
 * in chrome-launcher's temp directory cleanup. Without this patch, Node.js v24+
 * throws EPERM when removing Chrome's temp profile directory immediately after
 * the process exits (the directory is still briefly locked by Windows).
 *
 * Usage: node tools/lhci-wrapper.mjs autorun --config=.lighthouserc.json
 */
import fs from 'fs';
import { createRequire } from 'module';
import { dirname } from 'path';

// Ensure node's directory is on PATH so LHCI's startServerCommand can find `node`
const nodeDir = dirname(process.execPath);
const currentPath = process.env.PATH || process.env.Path || '';
if (!currentPath.includes(nodeDir)) {
  process.env.PATH = `${nodeDir}${process.platform === 'win32' ? ';' : ':'}${currentPath}`;
}

const originalRmSync = fs.rmSync;
fs.rmSync = function patchedRmSync(path, options) {
  try {
    return originalRmSync.call(fs, path, options);
  } catch (err) {
    if (err.code === 'EPERM' && String(path).includes('lighthouse')) {
      console.warn(`   [lhci-wrapper] Ignored EPERM on temp dir cleanup: ${path}`);
      return;
    }
    throw err;
  }
};

// Load the CJS LHCI CLI in the patched context
const require = createRequire(import.meta.url);
require('@lhci/cli/src/cli.js');
