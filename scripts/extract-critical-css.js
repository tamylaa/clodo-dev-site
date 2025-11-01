#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extract critical CSS for above-the-fold content
 * This script identifies and extracts CSS needed for initial page render
 */

console.log('🎯 Extracting Critical CSS...');

// Read the main CSS file
const cssPath = path.join('public', 'styles.css');
if (!fs.existsSync(cssPath)) {
    console.error('❌ styles.css not found');
    process.exit(1);
}

const css = fs.readFileSync(cssPath, 'utf8');

// Critical CSS selectors and patterns for above-the-fold content
const criticalPatterns = [
    // CSS Variables and root styles - these are safe
    /:root\s*\{[^}]*\}/g,
    /\[data-theme[^}]*\}/g,

    // Basic reset and typography - safe
    /html\s*\{[^}]*\}/g,
    /body\s*\{[^}]*\}/g,
    /h[1-6]\s*\{[^}]*\}/g,
    /p\s*\{[^}]*\}/g,
    /a\s*\{[^}]*\}/g,

    // Navigation - safe
    /\.navbar\s*\{[^}]*\}/g,
    /\.nav-container\s*\{[^}]*\}/g,
    /\.nav-menu\s*\{[^}]*\}/g,
    /\.logo\s*\{[^}]*\}/g,
    /\.theme-toggle\s*\{[^}]*\}/g,

    // Hero section - safe
    /#hero\s*\{[^}]*\}/g,
    /\.hero\s*\{[^}]*\}/g,
    /\.btn\s*\{[^}]*\}/g,

    // Container and layout - safe
    /\.container\s*\{[^}]*\}/g,

    // Skip link - safe
    /\.skip-link\s*\{[^}]*\}/g,

    // Focus styles - safe
    /\*:focus\s*\{[^}]*\}/g,
    /button:focus\s*\{[^}]*\}/g,
    /input:focus\s*\{[^}]*\}/g,

    // Loading states - safe
    /\.loading\s*\{[^}]*\}/g,
    /\.spinner\s*\{[^}]*\}/g,

    // Utility classes - safe
    /\.sr-only\s*\{[^}]*\}/g,
    /\.text-heart\s*\{[^}]*\}/g,

    // Critical animations - safe
    /@keyframes\s+fadeIn\s*\{[^}]*\}/g
];

let criticalCss = '';
const processedSelectors = new Set();

// Extract critical CSS
criticalPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(css)) !== null) {
        const rule = match[0];
        // Basic validation - ensure it has opening and closing braces and they're balanced
        const openBraces = (rule.match(/\{/g) || []).length;
        const closeBraces = (rule.match(/\}/g) || []).length;
        if (openBraces === closeBraces && openBraces > 0 && !rule.includes('){')) {
            if (!processedSelectors.has(rule)) {
                criticalCss += rule + '\n';
                processedSelectors.add(rule);
            }
        }
    }
});

// Add critical media queries that are well-formed
const mediaQueryPattern = /@media\s*\([^}]*\{[^}]*\}/g;
let mediaMatch;
while ((mediaMatch = mediaQueryPattern.exec(css)) !== null) {
    const query = mediaMatch[0];
    // Only include simple media queries that affect critical content
    if ((query.includes('prefers-reduced-motion') || query.includes('prefers-color-scheme')) &&
        query.split('{').length === 2 && query.split('}').length === 2) {
        criticalCss += query + '\n';
    }
}

// Minify critical CSS
const minifiedCritical = criticalCss
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/\s*{\s*/g, '{') // Remove spaces around braces
    .replace(/\s*}\s*/g, '}') // Remove spaces around closing braces
    .replace(/\s*;\s*/g, ';') // Remove spaces around semicolons
    .replace(/;\s*}/g, '}') // Remove semicolon before closing brace
    .replace(/,\s*/g, ',') // Remove spaces after commas
    .trim();

// Write critical CSS to file
const criticalCssPath = path.join('public', 'css', 'critical.css');
fs.writeFileSync(criticalCssPath, minifiedCritical);

console.log(`✅ Critical CSS extracted (${minifiedCritical.length} bytes)`);
console.log(`📁 Saved to: ${criticalCssPath}`);

// Return the critical CSS for inlining
module.exports = minifiedCritical;