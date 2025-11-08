#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, rmSync, mkdirSync, readdirSync, statSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Simple build script for Clodo Framework website
 * Minifies CSS and JS, copies assets to dist folder
 */

console.log('🚀 Building Clodo Framework website...');

// Clean dist directory
function cleanDist() {
    console.log('🧹 Cleaning dist directory...');
    if (existsSync('dist')) {
        rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist', { recursive: true });
}

// Copy HTML files with template processing
function copyHtml() {
    console.log('📄 Processing HTML files with templates...');

    // Read footer template
    const footerTemplate = readFileSync(join('templates', 'footer.html'), 'utf8');

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
        'privacy.html',
        // New guide pages
        'edge-computing-guide.html',
        'cloudflare-workers-guide.html',
        'clodo-framework-guide.html',
        'development-deployment-guide.html',
        // New comparison/content pages
        'what-is-edge-computing.html',
        'what-is-cloudflare-workers.html',
        'how-to-migrate-from-wrangler.html',
        'edge-vs-cloud-computing.html',
        'workers-vs-lambda.html',
        // Article pages
        'clodo-framework-promise-to-reality.html',
        'clodo-framework-api-simplification.html'
    ];

    htmlFiles.forEach(file => {
        const srcPath = join('public', file);
        if (existsSync(srcPath)) {
            let content = readFileSync(srcPath, 'utf8');

            // Add announcement container after body tag
            content = content.replace(
                /<body>/,
                '<body>\n    <a href="#main-content" class="skip-link">Skip to main content</a>\n    <!-- Announcement Banner Container -->\n    <div class="announcement-container"></div>'
            );

            // Replace footer placeholder with actual footer content
            content = content.replace('<!-- FOOTER_PLACEHOLDER -->', footerTemplate);

            writeFileSync(join('dist', file), content);
        }
    });
}

// Minify CSS (simple minification)
function bundleCss() {
    console.log('🎨 Bundling CSS...');

    // Resolve @import statements and bundle all CSS files
    const cssFiles = [
        'css/base.css',
        'css/utilities.css',
        'css/components.css',
        'css/layout.css',
        'css/pages/index.css',
        'css/pages/product.css',
        'css/pages/about.css',
        'css/pages/migrate.css',
        'css/pages/subscribe.css',
        'css/pages/subscribe-enhanced.css'
    ];
    let bundled = '';

    cssFiles.forEach(file => {
        const filePath = join('public', file);
        if (existsSync(filePath)) {
            console.log(`📄 Including ${file}`);
            bundled += readFileSync(filePath, 'utf8') + '\n';
        } else {
            console.warn(`⚠️  CSS file not found: ${file}`);
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

    writeFileSync(join('dist', 'styles.css'), minified);
    console.log(`📦 Bundled CSS: ${minified.length} bytes`);
}

function minifyCss() {
    console.log('🎨 Minifying individual CSS...');
    const cssDir = join('public', 'css');
    const distCssDir = join('dist', 'css');

    if (!existsSync(cssDir)) return;

    mkdirSync(distCssDir, { recursive: true });

    const cssFiles = readdirSync(cssDir).filter(file => file.endsWith('.css'));

    cssFiles.forEach(file => {
        const content = readFileSync(join(cssDir, file), 'utf8');
        // Simple minification: remove comments, extra whitespace
        let minified = content
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
            .replace(/\s+/g, ' ') // Collapse whitespace
            .replace(/\s*{\s*/g, '{') // Remove spaces around braces
            .replace(/\s*}\s*/g, '}') // Remove spaces around closing braces
            .replace(/\s*;\s*/g, ';') // Remove spaces around semicolons
            .replace(/;\s*}/g, '}') // Remove semicolon before closing brace
            .trim();

        writeFileSync(join(distCssDir, file), minified);
    });
}

// Copy JavaScript (no minification to avoid breaking code)
function copyJs() {
    console.log('📋 Copying JavaScript...');
    const jsFile = join('public', 'script.js');
    const distJsFile = join('dist', 'script.js');

    if (!existsSync(jsFile)) return;

    // Just copy the file without minification
    writeFileSync(distJsFile, readFileSync(jsFile, 'utf8'));
}

// Copy JavaScript config files
function copyJsConfigs() {
    console.log('📋 Copying JavaScript config files...');

    // First, handle brevo-secure-config.js
    const secureConfigSrc = join('public', 'brevo-secure-config.js');
    const secureConfigDist = join('dist', 'brevo-secure-config.js');

    // DEBUG: Log what we're checking
    console.log('DEBUG Brevo config detection:');
    console.log(`  - Local file exists: ${existsSync(secureConfigSrc)}`);
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
        writeFileSync(secureConfigDist, secureConfig);
        console.log('  ✓ Generated brevo-secure-config.js from environment variables');
    } else if (existsSync(secureConfigSrc)) {
        // No env vars: Copy existing local file (development)
        writeFileSync(secureConfigDist, readFileSync(secureConfigSrc, 'utf8'));
        console.log('  ✓ Copied brevo-secure-config.js from local file');
    } else {
        console.warn('  ⚠️  ERROR: No brevo configuration available!');
        console.warn('     For local development: create public/brevo-secure-config.js');
        console.warn('     For production: set BREVO_API_KEY and BREVO_LIST_ID environment variables');
    }

    // Copy brevo-config.js
    const configFiles = ['brevo-config.js'];
    configFiles.forEach(file => {
        const srcPath = join('public', file);
        if (existsSync(srcPath)) {
            writeFileSync(join('dist', file), readFileSync(srcPath, 'utf8'));
            console.log(`  ✓ Copied ${file}`);
        } else {
            console.log(`  ⚠️  ${file} not found`);
        }
    });
}

// Copy other assets
function copyAssets() {
    console.log('📦 Copying assets...');
    // Copy legacy stylesheet for any pages that may still reference it
    if (existsSync(join('public', 'styles-organized.css'))) {
        copyFileSync(
            join('public', 'styles-organized.css'),
            join('dist', 'styles-organized.css')
        );
    }
    // Copy root assets like sitemap and robots if present
    ['robots.txt', 'sitemap.xml', 'site.webmanifest'].forEach(file => {
        const src = join('public', file);
        if (existsSync(src)) {
            copyFileSync(src, join('dist', file));
        }
    });

    // Copy icons directory if present
    const iconsSrc = join('public', 'icons');
    const iconsDest = join('dist', 'icons');
    if (existsSync(iconsSrc)) {
        mkdirSync(iconsDest, { recursive: true });
        for (const entry of readdirSync(iconsSrc)) {
            const srcPath = join(iconsSrc, entry);
            const destPath = join(iconsDest, entry);
            const stat = statSync(srcPath);
            if (stat.isDirectory()) {
                mkdirSync(destPath, { recursive: true });
                for (const sub of readdirSync(srcPath)) {
                    copyFileSync(join(srcPath, sub), join(destPath, sub));
                }
            } else {
                copyFileSync(srcPath, destPath);
            }
        }
    }
}


// Generate build info
function generateBuildInfo() {
    console.log('📊 Generating build info...');
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const buildInfo = {
        buildTime: new Date().toISOString(),
        version: packageJson.version,
        commit: process.env.GITHUB_SHA || 'local-build'
    };

    writeFileSync(
        join('dist', 'build-info.json'),
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