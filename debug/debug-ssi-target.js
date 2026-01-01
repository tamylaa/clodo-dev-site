#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('=== Targeted SSI Replacement Test ===');

// Read templates
const navMainTemplate = readFileSync(join('templates', 'nav-main.html'), 'utf8');
console.log('nav-main.html loaded, has emoji:', navMainTemplate.includes('⚖️'));

// Read a source file
const sourceFile = 'public/blog/index.html';
let content = readFileSync(sourceFile, 'utf8');
console.log('Source file loaded, length:', content.length);
console.log('Source file has emoji before replacements:', content.includes('⚖️'));

// Do just the SSI replacements
content = content.replace(/<!--#include file="\.\.\/templates\/nav-main\.html" -->/g, navMainTemplate);
content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/nav-main\.html" -->/g, navMainTemplate);

console.log('After SSI replacements, has emoji:', content.includes('⚖️'));

// Write to a test file
writeFileSync('debug-ssi-only.html', content, 'utf8');
console.log('File written');

// Read it back
const readBack = readFileSync('debug-ssi-only.html', 'utf8');
console.log('Read back, has emoji:', readBack.includes('⚖️'));

// Check for corruption
const hasCorruption = readBack.includes('??�') || readBack.includes('⚖️�');
console.log('Has corruption:', hasCorruption);