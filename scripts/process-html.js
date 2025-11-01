#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Process HTML files to inject critical CSS
 */

console.log('🔧 Processing HTML files with critical CSS...');

const htmlFiles = [
    'index.html',
    'about.html',
    'docs.html',
    'examples.html',
    'pricing.html',
    'components.html',
    'subscribe.html',
    'product.html',
    'migrate.html',
    'privacy.html'
];

const criticalCssPath = path.join('public', 'css', 'critical.css');

if (!fs.existsSync(criticalCssPath)) {
    console.error('❌ Critical CSS file not found. Run extract-critical-css.js first.');
    process.exit(1);
}

const criticalCss = fs.readFileSync(criticalCssPath, 'utf8');

htmlFiles.forEach(file => {
    const filePath = path.join('public', file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');

        // Replace the placeholder with actual critical CSS
        content = content.replace('{CRITICAL_CSS}', criticalCss);

        fs.writeFileSync(filePath, content);
        console.log(`✅ Processed ${file}`);
    }
});

console.log('🎉 HTML processing complete!');