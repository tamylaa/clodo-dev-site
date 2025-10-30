#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Simple build script for Clodo Framework website
 * Minifies CSS and JS, copies assets to dist folder
 */

console.log('🚀 Building Clodo Framework website...');

// Clean dist directory
function cleanDist() {
    console.log('🧹 Cleaning dist directory...');
    if (fs.existsSync('dist')) {
        fs.rmSync('dist', { recursive: true, force: true });
    }
    fs.mkdirSync('dist', { recursive: true });
}

// Copy HTML files
function copyHtml() {
    console.log('📄 Copying HTML files...');
    const htmlFiles = ['index.html', 'about.html', 'docs.html', 'examples.html', 'pricing.html', 'components.html', 'subscribe.html'];
    htmlFiles.forEach(file => {
        const srcPath = path.join('public', file);
        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, path.join('dist', file));
        }
    });
}

// Minify CSS (simple minification)
function bundleCss() {
    console.log('🎨 Bundling CSS...');
    const cssFiles = [
        'base.css',
        'utilities.css',
        'components.css',
        'layout.css',
        'pages/index.css',
        'pages/subscribe.css'
    ];
    let bundled = '';

    cssFiles.forEach(file => {
        const filePath = path.join('public', 'css', file);
        if (fs.existsSync(filePath)) {
            bundled += fs.readFileSync(filePath, 'utf8') + '\n';
        }
    });

    // Simple minification
    let minified = bundled
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/\s*{\s*/g, '{') // Remove spaces around braces
        .replace(/\s*}\s*/g, '}') // Remove spaces around closing braces
        .replace(/\s*;\s*/g, ';') // Remove spaces around semicolons
        .replace(/;\s*}/g, '}') // Remove semicolon before closing brace
        .trim();

    fs.writeFileSync(path.join('dist', 'styles.css'), minified);
    fs.writeFileSync(path.join('public', 'styles.css'), minified);
}

function minifyCss() {
    console.log('🎨 Minifying individual CSS...');
    const cssDir = path.join('public', 'css');
    const distCssDir = path.join('dist', 'css');

    if (!fs.existsSync(cssDir)) return;

    fs.mkdirSync(distCssDir, { recursive: true });

    const cssFiles = fs.readdirSync(cssDir).filter(file => file.endsWith('.css'));

    cssFiles.forEach(file => {
        const content = fs.readFileSync(path.join(cssDir, file), 'utf8');
        // Simple minification: remove comments, extra whitespace
        let minified = content
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
            .replace(/\s+/g, ' ') // Collapse whitespace
            .replace(/\s*{\s*/g, '{') // Remove spaces around braces
            .replace(/\s*}\s*/g, '}') // Remove spaces around closing braces
            .replace(/\s*;\s*/g, ';') // Remove spaces around semicolons
            .replace(/;\s*}/g, '}') // Remove semicolon before closing brace
            .trim();

        fs.writeFileSync(path.join(distCssDir, file), minified);
    });
}

// Copy JavaScript (no minification to avoid breaking code)
function copyJs() {
    console.log('📋 Copying JavaScript...');
    const jsFile = path.join('public', 'script.js');
    const distJsFile = path.join('dist', 'script.js');

    if (!fs.existsSync(jsFile)) return;

    // Just copy the file without minification
    fs.copyFileSync(jsFile, distJsFile);
}

// Copy JavaScript config files
function copyJsConfigs() {
    console.log('📋 Copying JavaScript config files...');

    // First, handle brevo-secure-config.js
    const secureConfigSrc = path.join('public', 'brevo-secure-config.js');
    const secureConfigDist = path.join('dist', 'brevo-secure-config.js');

    // DEBUG: Log what we're checking
    console.log('DEBUG Brevo config detection:');
    console.log(`  - Local file exists: ${fs.existsSync(secureConfigSrc)}`);
    console.log(`  - BREVO_API_KEY env: ${process.env.BREVO_API_KEY ? '✓ set' : '✗ not set'}`);
    console.log(`  - BREVO_LIST_ID env: ${process.env.BREVO_LIST_ID ? '✓ set' : '✗ not set'}`);
    console.log(`  - CI environment: ${process.env.CI ? '✓ production' : '✗ local'}`);

    // Prioritize environment variables when available (for production security)
    // Fall back to local file for development convenience
    if (process.env.BREVO_API_KEY && process.env.BREVO_LIST_ID) {
        // Environment variables available: Generate from them (production)
        const secureConfig = `// Secure Brevo configuration - Generated from environment variables
console.log('brevo-secure-config.js is loading...');

window.BREVO_SECURE_CONFIG = {
    API_KEY: '${process.env.BREVO_API_KEY}',
    LIST_ID: ${parseInt(process.env.BREVO_LIST_ID)},
};

console.log('brevo-secure-config.js loaded successfully:', {
    hasApiKey: !!window.BREVO_SECURE_CONFIG.API_KEY,
    listId: window.BREVO_SECURE_CONFIG.LIST_ID
});`;
        fs.writeFileSync(secureConfigDist, secureConfig);
        console.log('  ✓ Generated brevo-secure-config.js from environment variables');
    } else if (fs.existsSync(secureConfigSrc)) {
        // No env vars: Copy existing local file (development)
        fs.copyFileSync(secureConfigSrc, secureConfigDist);
        console.log('  ✓ Copied brevo-secure-config.js from local file');
    } else {
        console.warn('  ⚠️  ERROR: No brevo configuration available!');
        console.warn('     For local development: create public/brevo-secure-config.js');
        console.warn('     For production: set BREVO_API_KEY and BREVO_LIST_ID environment variables');
    }

    // Copy brevo-config.js
    const configFiles = ['brevo-config.js'];
    configFiles.forEach(file => {
        const srcPath = path.join('public', file);
        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, path.join('dist', file));
            console.log(`  ✓ Copied ${file}`);
        } else {
            console.log(`  ⚠️  ${file} not found`);
        }
    });
}

// Copy other assets
function copyAssets() {
    console.log('📦 Copying assets...');
    // Copy bundled stylesheet
    if (fs.existsSync(path.join('public', 'styles.css'))) {
        fs.copyFileSync(
            path.join('public', 'styles.css'),
            path.join('dist', 'styles.css')
        );
    }
    // Copy legacy stylesheet for any pages that may still reference it
    if (fs.existsSync(path.join('public', 'styles-organized.css'))) {
        fs.copyFileSync(
            path.join('public', 'styles-organized.css'),
            path.join('dist', 'styles-organized.css')
        );
    }
    // Copy root assets like sitemap and robots if present
    ['robots.txt', 'sitemap.xml', 'site.webmanifest'].forEach(file => {
        const src = path.join('public', file);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, path.join('dist', file));
        }
    });

    // Copy icons directory if present
    const iconsSrc = path.join('public', 'icons');
    const iconsDest = path.join('dist', 'icons');
    if (fs.existsSync(iconsSrc)) {
        fs.mkdirSync(iconsDest, { recursive: true });
        for (const entry of fs.readdirSync(iconsSrc)) {
            const srcPath = path.join(iconsSrc, entry);
            const destPath = path.join(iconsDest, entry);
            const stat = fs.statSync(srcPath);
            if (stat.isDirectory()) {
                fs.mkdirSync(destPath, { recursive: true });
                for (const sub of fs.readdirSync(srcPath)) {
                    fs.copyFileSync(path.join(srcPath, sub), path.join(destPath, sub));
                }
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }
}

// Generate build info
function generateBuildInfo() {
    console.log('📊 Generating build info...');
    const buildInfo = {
        buildTime: new Date().toISOString(),
        version: require('./package.json').version,
        commit: process.env.GITHUB_SHA || 'local-build'
    };

    fs.writeFileSync(
        path.join('dist', 'build-info.json'),
        JSON.stringify(buildInfo, null, 2)
    );
}

// Main build process
try {
    cleanDist();
    copyHtml();
    bundleCss();
    minifyCss();
    copyJs();
    copyJsConfigs();
    copyAssets();
    generateBuildInfo();

    console.log('✅ Build completed successfully!');
    console.log('📁 Output directory: ./dist');
    console.log('🚀 Ready for deployment');

} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}