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

    // Read templates
    const footerTemplate = readFileSync(join('templates', 'footer.html'), 'utf8');
    const headerTemplate = readFileSync(join('templates', 'header.html'), 'utf8');
    const navMainTemplate = readFileSync(join('templates', 'nav-main.html'), 'utf8');
    const heroTemplate = readFileSync(join('templates', 'hero.html'), 'utf8');

    // Read critical CSS for inlining
    const criticalCssPath = join('dist', 'critical.css');
    const criticalCss = existsSync(criticalCssPath) ? readFileSync(criticalCssPath, 'utf8') : '';

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
        'analytics.html',
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
        'clodo-framework-api-simplification.html',
        // Blog pages
        'blog/index.html',
        'blog/debugging-silent-build-failures.html',
        'blog/instant-try-it-impact.html',
        'blog/stackblitz-integration-journey.html'
    ];

    htmlFiles.forEach(file => {
        const srcPath = join('public', file);
        if (existsSync(srcPath)) {
            let content = readFileSync(srcPath, 'utf8');

            // Add skip link and announcement container after body tag if not already present
            if (!content.includes('class="skip-link"')) {
                content = content.replace(
                    /<body>/,
                    '<body>\n    <a href="#main-content" class="skip-link">Skip to main content</a>\n    <!-- Announcement Banner Container -->\n    <div class="announcement-container"></div>'
                );
            } else {
                // Just add announcement container if skip link already exists
                content = content.replace(
                    /<body>/,
                    '<body>\n    <!-- Announcement Banner Container -->\n    <div class="announcement-container"></div>'
                );
            }

            // Replace header placeholder with actual header content
            content = content.replace('<!-- HEADER_PLACEHOLDER -->', headerTemplate);

            // Process SSI includes
            content = content.replace(/^\s*<!--#include file="\.\.\/templates\/nav-main\.html" -->/gm, navMainTemplate);
            content = content.replace(/^\s*<!--#include file="\.\.\/templates\/footer\.html" -->/gm, footerTemplate);
            content = content.replace(/^\s*<!--#include file="\.\.\/templates\/header\.html" -->/gm, headerTemplate);
            content = content.replace(/^\s*<!--#include file="\.\.\/templates\/hero\.html" -->/gm, heroTemplate);

            // Replace hero placeholder with actual hero content (legacy support)
            content = content.replace('<!-- HERO_PLACEHOLDER -->', heroTemplate);

            // Replace footer placeholder with actual footer content (legacy support)
            content = content.replace('<!-- FOOTER_PLACEHOLDER -->', footerTemplate);

            // Replace CSS link with inline critical CSS and async non-critical CSS
            if (criticalCss) {
                const criticalCssLength = criticalCss.length;
                const maxInlineSize = 50000; // 50KB max for inlining
                
                console.log(`   📊 CSS Size Check: critical=${(criticalCssLength / 1024).toFixed(1)}KB (max=${(maxInlineSize / 1024).toFixed(0)}KB)`);
                
                // Only inline if critical CSS is actually small (< 50KB)
                if (criticalCssLength < maxInlineSize) {
                    const criticalCssInline = `<style>${criticalCss}</style>`;
                    const asyncCssLink = '<link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel=\'stylesheet\'"><noscript><link rel="stylesheet" href="styles.css"></noscript>';

                    // Replace ALL existing styles.css links - handle multiple formats:
                    // 1. Multiple preload + direct links (newer format with duplicates)
                    // 2. Single direct link (simpler format)
                    const cssLinkPatternMultiple = /<link[^>]*href="styles\.css"[^>]*>[\s\n]*<link[^>]*href="styles\.css"[^>]*>[\s\n]*(?:<noscript><link[^>]*href="styles\.css"[^>]*><\/noscript>[\s\n]*)?/g;
                    const cssLinkPatternSingle = /<link[^>]*rel="stylesheet"[^>]*href="styles\.css"[^>]*>/g;
                    
                    // Try multiple pattern first, then single if no match
                    if (content.includes('href="styles.css"') && content.match(cssLinkPatternMultiple)) {
                        content = content.replace(
                            cssLinkPatternMultiple,
                            criticalCssInline + '\n    ' + asyncCssLink + '\n    '
                        );
                    } else if (content.includes('href="styles.css"')) {
                        // Single simple link replacement
                        content = content.replace(
                            cssLinkPatternSingle,
                            criticalCssInline + '\n    ' + asyncCssLink
                        );
                    }
                    console.log('   ✅ Critical CSS inlined (< 50KB)');
                } else {
                    console.warn(`   ⚠️  Critical CSS too large (${(criticalCssLength / 1024).toFixed(1)}KB) - using async loading only`);
                    // If critical CSS is too large, just use async loading
                    const asyncCssLink = '<link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel=\'stylesheet\'"><noscript><link rel="stylesheet" href="styles.css"></noscript>';
                    const cssLinkPatternMultiple = /<link[^>]*href="styles\.css"[^>]*>[\s\n]*<link[^>]*href="styles\.css"[^>]*>[\s\n]*(?:<noscript><link[^>]*href="styles\.css"[^>]*><\/noscript>[\s\n]*)?/g;
                    const cssLinkPatternSingle = /<link[^>]*rel="stylesheet"[^>]*href="styles\.css"[^>]*>/g;
                    
                    // Try multiple pattern first, then single if no match
                    if (content.includes('href="styles.css"') && content.match(cssLinkPatternMultiple)) {
                        content = content.replace(
                            cssLinkPatternMultiple,
                            asyncCssLink + '\n    '
                        );
                    } else if (content.includes('href="styles.css"')) {
                        content = content.replace(
                            cssLinkPatternSingle,
                            asyncCssLink
                        );
                    }
                }
            }

            // Remove redundant security meta tags (already set via HTTP headers in _headers file)
            content = content.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/g, '');
            content = content.replace(/<meta http-equiv="X-Frame-Options"[^>]*>/g, '');
            content = content.replace(/<meta http-equiv="X-Content-Type-Options"[^>]*>/g, '');
            content = content.replace(/<meta http-equiv="Referrer-Policy"[^>]*>/g, '');
            
            // All security headers are now set via HTTP headers in _headers file (correct approach)

            // Ensure destination directory exists
            const destPath = join('dist', file);
            const destDir = dirname(destPath);
            if (!existsSync(destDir)) {
                mkdirSync(destDir, { recursive: true });
            }

            writeFileSync(destPath, content);
        }
    });
}

// Bundle CSS into critical and non-critical bundles for performance
function bundleCss() {
    console.log('🎨 Bundling CSS...');

    // Critical CSS files (needed for initial render)
    const criticalCssFiles = [
        'css/base.css',        // CSS variables, resets, typography
        'css/layout.css'       // Grid, containers, basic layout
    ];

    // Non-critical CSS files (can load asynchronously)
    const nonCriticalCssFiles = [
        'css/utilities.css',
        'css/components/buttons.css',  // Button component (Quick Win #3 + #4)
        'css/components.css',  // Navigation and other components
        'css/global/header.css',  // Header/navigation menu styling
        'css/global/footer.css',  // Footer styling
        'css/pages/index/hero.css',  // Hero section styles
        'css/pages/index.css',
        'css/pages/index/features.css',  // Features section styles
        'css/pages/product.css',
        'css/pages/about.css',
        'css/pages/migrate.css',
        'css/pages/subscribe.css',
        'css/pages/subscribe-enhanced.css',
        'css/pages/blog.css',
        'css/pages/pricing.css'
    ];

    // Bundle critical CSS
    let criticalBundled = '';
    criticalCssFiles.forEach(file => {
        const filePath = join('public', file);
        if (existsSync(filePath)) {
            console.log(`📄 Including critical: ${file}`);
            criticalBundled += readFileSync(filePath, 'utf8') + '\n';
        } else {
            console.warn(`⚠️  Critical CSS file not found: ${file}`);
        }
    });

    // Bundle non-critical CSS
    let nonCriticalBundled = '';
    nonCriticalCssFiles.forEach(file => {
        const filePath = join('public', file);
        if (existsSync(filePath)) {
            console.log(`📄 Including non-critical: ${file}`);
            nonCriticalBundled += readFileSync(filePath, 'utf8') + '\n';
        } else {
            console.warn(`⚠️  Non-critical CSS file not found: ${file}`);
        }
    });

    // Proper CSS minification function that preserves @keyframes
    const minifyCss = (css) => {
        return css
            // Remove comments
            .replace(/\/\*[\s\S]*?\*\//g, '')
            // Normalize whitespace while preserving structure
            .replace(/\s+/g, ' ')
            .replace(/\s*([{}:;,])\s*/g, '$1')
            // Remove trailing semicolons before closing braces
            .replace(/;\s*}/g, '}')
            // Remove leading/trailing whitespace
            .trim();
    };

    // Minify and write critical CSS
    const minifiedCritical = minifyCss(criticalBundled);
    writeFileSync(join('dist', 'critical.css'), minifiedCritical);
    console.log(`📦 Critical CSS: ${minifiedCritical.length} bytes`);

    // Minify and write non-critical CSS
    const minifiedNonCritical = minifyCss(nonCriticalBundled);
    writeFileSync(join('dist', 'styles.css'), minifiedNonCritical);
    console.log(`📦 Non-critical CSS: ${minifiedNonCritical.length} bytes`);
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
    
    // Copy main script.js
    const jsFile = join('public', 'script.js');
    const distJsFile = join('dist', 'script.js');

    if (existsSync(jsFile)) {
        writeFileSync(distJsFile, readFileSync(jsFile, 'utf8'));
    }
    
    // Copy js/ module directory (Quick Win #5)
    const jsDir = join('public', 'js');
    const distJsDir = join('dist', 'js');
    
    if (existsSync(jsDir)) {
        console.log('📦 Copying JS modules...');
        mkdirSync(distJsDir, { recursive: true });
        
        // Recursively copy all JS files
        // eslint-disable-next-line no-inner-declarations
        function copyJsRecursive(srcDir, destDir) {
            const items = readdirSync(srcDir);
            
            items.forEach(item => {
                const srcPath = join(srcDir, item);
                const destPath = join(destDir, item);
                const stat = statSync(srcPath);
                
                if (stat.isDirectory()) {
                    mkdirSync(destPath, { recursive: true });
                    copyJsRecursive(srcPath, destPath);
                } else if (item.endsWith('.js') || item === 'README.md') {
                    copyFileSync(srcPath, destPath);
                    console.log(`  ✓ Copied ${srcPath.replace('public/', '')}`);
                }
            });
        }
        
        copyJsRecursive(jsDir, distJsDir);
    }
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
    ['robots.txt', 'sitemap.xml', 'site.webmanifest', 'google1234567890abcdef.html'].forEach(file => {
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

    // Copy js directory if present
    const jsSrc = join('public', 'js');
    const jsDest = join('dist', 'js');
    if (existsSync(jsSrc)) {
        mkdirSync(jsDest, { recursive: true });
        for (const entry of readdirSync(jsSrc)) {
            const srcPath = join(jsSrc, entry);
            const destPath = join(jsDest, entry);
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

    // Copy demo directory if present
    const demoSrc = join('public', 'demo');
    const demoDest = join('dist', 'demo');
    if (existsSync(demoSrc)) {
        mkdirSync(demoDest, { recursive: true });
        for (const entry of readdirSync(demoSrc)) {
            const srcPath = join(demoSrc, entry);
            const destPath = join(demoDest, entry);
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
    bundleCss();  // Must run before copyHtml since HTML processing needs critical.css
    copyHtml();
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