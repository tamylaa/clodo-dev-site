#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('=== Path Adjustment Test ===');

// Read templates
const navMainTemplate = readFileSync(join('templates', 'nav-main.html'), 'utf8');
console.log('nav-main.html loaded, has emoji:', navMainTemplate.includes('⚖️'));

// Function to adjust template paths for subdirectory files
function adjustTemplatePaths(template, prefix) {
    if (!prefix) return template;
    // Adjust href attributes that are relative (not starting with http, //, or #)
    return template.replace(/href="([^"]*)"/g, (match, href) => {
        if (href.startsWith('http') || href.startsWith('//') || href.startsWith('#') || href.startsWith('mailto:')) {
            return match; // Leave absolute URLs and anchors unchanged
        }
        return `href="${prefix}${href}"`;
    });
}

// Test path adjustment
const adjusted = adjustTemplatePaths(navMainTemplate, '../');
console.log('After path adjustment, has emoji:', adjusted.includes('⚖️'));

// Write to test file
writeFileSync('debug-path-adjust.html', adjusted, 'utf8');
console.log('File written');

// Read back
const readBack = readFileSync('debug-path-adjust.html', 'utf8');
console.log('Read back, has emoji:', readBack.includes('⚖️'));

// Check for corruption
const hasCorruption = readBack.includes('??�') || readBack.includes('⚖️�');
console.log('Has corruption:', hasCorruption);