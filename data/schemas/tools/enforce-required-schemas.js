#!/usr/bin/env node
// Thin wrapper to call the top-level enforcement script but with data/schemas as the source
import { spawnSync } from 'child_process';

// Prefer running the local enforce script which already supports data/schemas
const res = spawnSync('node', ['tools/enforce-required-schemas.js', 'dist', '--fail'], { stdio: 'inherit' });
process.exit(res.status);
