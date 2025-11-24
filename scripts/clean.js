#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, '..', 'dist');

try {
  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
    console.log('🧹 Cleaned dist directory');
  } else {
    console.log('ℹ️ dist directory does not exist, nothing to clean');
  }
  process.exit(0);
} catch (err) {
  console.error('❌ Failed to clean dist:', err.message);
  process.exit(1);
}
