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
    const heroMinimalTemplate = readFileSync(join('templates', 'hero-minimal.html'), 'utf8'); // Minimal hero for critical path
    const tocTemplate = readFileSync(join('templates', 'table-of-contents.html'), 'utf8');
    const tocFaqTemplate = readFileSync(join('templates', 'table-of-contents-faq.html'), 'utf8');
    const relatedContentTemplate = readFileSync(join('templates', 'related-content.html'), 'utf8');
    const relatedContentFaqTemplate = readFileSync(join('templates', 'related-content-faq.html'), 'utf8');
    const relatedContentComparisonTemplate = readFileSync(join('templates', 'related-content-comparison.html'), 'utf8');
    const relatedContentWorkersTemplate = readFileSync(join('templates', 'related-content-workers.html'), 'utf8');
    const announcementBannerTemplate = readFileSync(join('templates', 'announcement-banner.html'), 'utf8');

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
        'clodo-vs-lambda.html',
        'faq.html',
        // Article pages
        'clodo-framework-promise-to-reality.html',
        'clodo-framework-api-simplification.html',
        // Performance dashboard page
        'performance-dashboard.html',
        // Blog pages
        'blog/index.html',
        'blog/cloudflare-infrastructure-myth.html',
        'blog/cloudflare-workers-tutorial-beginners.html',
        'blog/building-developer-communities.html',
        'blog/debugging-silent-build-failures.html',
        'blog/instant-try-it-impact.html',
        'blog/stackblitz-integration-journey.html',
        // Community pages
        'community/welcome.html',
        // Case study pages
        'case-studies/index.html',
        'case-studies/fintech-payment-platform.html',
        'case-studies/healthcare-saas-platform.html'
    ];

    htmlFiles.forEach(file => {
        const srcPath = join('public', file);
        if (existsSync(srcPath)) {
            let content = readFileSync(srcPath, 'utf8');

            // Add skip link and announcement container after body tag if not already present
            // Skip announcement banner for index.html to optimize LCP (hero title should be LCP)
            const isIndexPage = file === 'index.html';
            if (!content.includes('class="skip-link"')) {
                if (!isIndexPage) {
                    content = content.replace(
                        /<body>/,
                        '<body>\n    <a href="#main-content" class="skip-link">Skip to main content</a>\n    <!-- Announcement Banner Container -->\n    <div class="announcement-container">' + announcementBannerTemplate + '</div>'
                    );
                } else {
                    content = content.replace(
                        /<body>/,
                        '<body>\n    <a href="#main-content" class="skip-link">Skip to main content</a>'
                    );
                }
            } else {
                // Just add announcement container if skip link already exists (but not for index)
                if (!isIndexPage) {
                    content = content.replace(
                        /<body>/,
                        '<body>\n    <!-- Announcement Banner Container -->\n    <div class="announcement-container">' + announcementBannerTemplate + '</div>'
                    );
                }
            }

            // Replace header placeholder with actual header content
            content = content.replace('<!-- HEADER_PLACEHOLDER -->', headerTemplate);

            // Process SSI includes (handles any indentation)
            content = content.replace(/<!--#include file="\.\.\/templates\/nav-main\.html" -->/g, navMainTemplate);
            content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/nav-main\.html" -->/g, navMainTemplate);
            content = content.replace(/<!--#include file="\.\.\/templates\/footer\.html" -->/g, footerTemplate);
            content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/footer\.html" -->/g, footerTemplate);
            content = content.replace(/<!--#include file="\.\.\/templates\/header\.html" -->/g, headerTemplate);
            content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/header\.html" -->/g, headerTemplate);
            content = content.replace(/<!--#include file="\.\.\/templates\/hero\.html" -->/g, heroTemplate);
            content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/hero\.html" -->/g, heroTemplate);
            content = content.replace(/<!--#include file="\.\.\/templates\/table-of-contents\.html" -->/g, tocTemplate);
            content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/table-of-contents\.html" -->/g, tocTemplate);
            content = content.replace(/<!--#include file="\.\.\/templates\/table-of-contents-faq\.html" -->/g, tocFaqTemplate);
            content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/table-of-contents-faq\.html" -->/g, tocFaqTemplate);
            content = content.replace(/<!--#include file="\.\.\/templates\/related-content\.html" -->/g, relatedContentTemplate);
            content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/related-content\.html" -->/g, relatedContentTemplate);
            content = content.replace(/<!--#include file="\.\.\/templates\/related-content-faq\.html" -->/g, relatedContentFaqTemplate);
            content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/related-content-faq\.html" -->/g, relatedContentFaqTemplate);
            content = content.replace(/<!--#include file="\.\.\/templates\/related-content-comparison\.html" -->/g, relatedContentComparisonTemplate);
            content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/related-content-comparison\.html" -->/g, relatedContentComparisonTemplate);
            content = content.replace(/<!--#include file="\.\.\/templates\/related-content-workers\.html" -->/g, relatedContentWorkersTemplate);
            content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/related-content-workers\.html" -->/g, relatedContentWorkersTemplate);

            // Replace hero placeholder with actual hero content
            // For index.html, use minimal hero (critical path only)
            if (file === 'index.html') {
                content = content.replace('<!-- HERO_PLACEHOLDER -->', heroMinimalTemplate);
            } else {
                content = content.replace('<!-- HERO_PLACEHOLDER -->', heroTemplate);
            }

            // Replace footer placeholder with actual footer content (legacy support)
            content = content.replace('<!-- FOOTER_PLACEHOLDER -->', footerTemplate);

            // Replace CSS link with inline critical CSS and async non-critical CSS
            if (criticalCss) {
                const criticalCssLength = criticalCss.length;
                const maxInlineSize = 50000; // 50KB max for inlining
                
                console.log(`   📊 CSS Size Check: critical=${(criticalCssLength / 1024).toFixed(1)}KB (max=${(maxInlineSize / 1024).toFixed(0)}KB)`);
                
                // Determine which page-specific CSS bundle to load
                let pageBundle = 'common'; // Default to common CSS
                const fileName = file.split('/').pop().replace('.html', '');
                
                // Map file to page bundle (check full path for subdirectories)
                if (file.includes('blog/')) {
                    pageBundle = 'blog';
                } else if (file.includes('case-studies/')) {
                    pageBundle = 'case-studies';
                } else if (fileName === 'index') {
                    pageBundle = 'index';
                } else if (fileName.includes('pricing')) {
                    pageBundle = 'pricing';
                } else if (fileName.includes('subscribe')) {
                    pageBundle = 'subscribe';
                } else if (fileName.includes('product')) {
                    pageBundle = 'product';
                } else if (fileName.includes('about')) {
                    pageBundle = 'about';
                } else if (fileName.includes('migrate')) {
                    pageBundle = 'migrate';
                }
                
                const cssFile = pageBundle === 'common' ? 'styles.css' : `styles-${pageBundle}.css`;
                console.log(`   📄 Loading CSS bundle: ${cssFile}`);
                
                // Only inline if critical CSS is actually small (< 50KB)
                if (criticalCssLength < maxInlineSize) {
                    const criticalCssInline = `<style>${criticalCss}</style>`;
                    
                    // Define patterns - handle both absolute and relative paths (../ for subdirectories)
                    const cssLinkPatternMultiple = /<link[^>]*href="(?:\.\.\/)?styles\.css"[^>]*>[\s\n]*<link[^>]*href="(?:\.\.\/)?styles\.css"[^>]*>[\s\n]*(?:<noscript><link[^>]*href="(?:\.\.\/)?styles\.css"[^>]*><\/noscript>[\s\n]*)?/g;
                    const cssLinkPatternSingle = /<link[^>]*rel="stylesheet"[^>]*href="(?:\.\.\/)?styles\.css"[^>]*>/g;

                    if (file === 'index.html') {
                        // OPTIMIZATION FOR LCP:
                        // For index.html, we separate preload and application to ensure NO render blocking
                        // 1. In Head: Inline Critical CSS + Preload common CSS + Preload page CSS
                        // 2. In Footer: Apply both CSS files
                        
                        const headInjection = `${criticalCssInline}\n    <link rel="preload" href="styles.css" as="style">\n    <link rel="preload" href="${cssFile}" as="style">`;
                        const footerInjection = `<link rel="stylesheet" href="styles.css">\n    <link rel="stylesheet" href="${cssFile}">`;
                        
                        // Replace in head
                        if (content.includes('href="styles.css"') || content.includes('href="../styles.css"')) {
                            if (content.match(cssLinkPatternMultiple)) {
                                content = content.replace(cssLinkPatternMultiple, headInjection);
                            } else {
                                content = content.replace(cssLinkPatternSingle, headInjection);
                            }
                        }
                        
                        // Append to body (before closing tag)
                        content = content.replace('</body>', `    ${footerInjection}\n</body>`);
                        
                    } else {
                        // Standard behavior for other pages (Preload + Onload hack)
                        // Adjust paths for subdirectory files (blog/*, case-studies/*, community/*)
                        const isSubdirectory = file.includes('/');
                        const pathPrefix = isSubdirectory ? '../' : '';
                        
                        const commonCss = `<link rel="preload" href="${pathPrefix}styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="${pathPrefix}styles.css"></noscript>`;
                        const pageCss = pageBundle !== 'common' ? `\n    <link rel="preload" href="${pathPrefix}${cssFile}" as="style" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="${pathPrefix}${cssFile}"></noscript>` : '';
                        const asyncCssLink = commonCss + pageCss;
                        
                        if ((content.includes('href="styles.css"') || content.includes('href="../styles.css"')) && content.match(cssLinkPatternMultiple)) {
                            content = content.replace(
                                cssLinkPatternMultiple,
                                criticalCssInline + '\n    ' + asyncCssLink + '\n    '
                            );
                        } else if (content.includes('href="styles.css"') || content.includes('href="../styles.css"')) {
                            content = content.replace(
                                cssLinkPatternSingle,
                                criticalCssInline + '\n    ' + asyncCssLink
                            );
                        }
                    }
                    console.log('   ✅ Critical CSS inlined (< 50KB)');
                } else {
                    console.warn(`   ⚠️  Critical CSS too large (${(criticalCssLength / 1024).toFixed(1)}KB) - using async loading only`);
                    // If critical CSS is too large, just use async loading
                    // Adjust paths for subdirectory files (blog/*, case-studies/*, community/*)
                    const isSubdirectory = file.includes('/');
                    const pathPrefix = isSubdirectory ? '../' : '';
                    
                    const commonCss = `<link rel="preload" href="${pathPrefix}styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="${pathPrefix}styles.css"></noscript>`;
                    const pageCss = pageBundle !== 'common' ? `\n    <link rel="preload" href="${pathPrefix}${cssFile}" as="style" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="${pathPrefix}${cssFile}"></noscript>` : '';
                    const asyncCssLink = commonCss + pageCss;
                    
                    const cssLinkPatternMultiple = /<link[^>]*href="(?:\.\.\/)?styles\.css"[^>]*>[\s\n]*<link[^>]*href="(?:\.\.\/)?styles\.css"[^>]*>[\s\n]*(?:<noscript><link[^>]*href="(?:\.\.\/)?styles\.css"[^>]*><\/noscript>[\s\n]*)?/g;
                    const cssLinkPatternSingle = /<link[^>]*rel="stylesheet"[^>]*href="(?:\.\.\/)?styles\.css"[^>]*>/g;
                    
                    // Try multiple pattern first, then single if no match
                    if ((content.includes('href="styles.css"') || content.includes('href="../styles.css"')) && content.match(cssLinkPatternMultiple)) {
                        content = content.replace(
                            cssLinkPatternMultiple,
                            asyncCssLink + '\n    '
                        );
                    } else if (content.includes('href="styles.css"') || content.includes('href="../styles.css"')) {
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

    // Critical CSS files (needed for initial render - above-the-fold only)
    const criticalCssFiles = [
        'css/critical-base.css', // Optimized variables & resets
        'css/global/header.css', // Header/navigation (always visible)
        'css/utilities.css'      // Essential utility classes
    ];

    // Common CSS (shared across all pages, loaded asynchronously)
    const commonCssFiles = [
        'css/base.css',        // Full base styles (overrides critical-base)
        'css/layout.css',      // Grid, containers, basic layout
        'css/components/buttons.css',  // Button component
        'css/components-common.css',  // Truly reusable components (buttons, cards, forms, icons, alerts, badges, loading)
        'css/global/footer.css'  // Footer styling (below-the-fold)
    ];

    // Page-specific CSS bundles (reduces unused CSS by 60%+)
    const pageBundles = {
        'index': [
            'css/pages/index/hero.css',
            'css/hero-decorations.css',
            'css/pages/index/hero-animations.css',
            'css/pages/index/social-proof.css',
            'css/pages/index/stats.css'
            // Note: benefits, testimonials, features, and index-specific moved to deferred for performance
        ],
        'pricing': [
            'css/pages/pricing/hero.css',
            'css/pages/pricing/cards.css',
            'css/pages/pricing/contact-form.css'
        ],
        'blog': [
            'css/pages/blog/header.css',
            'css/pages/blog/index.css',
            'css/pages/blog/card.css',
            'css/pages/blog/stats.css',
            'css/pages/blog/post.css'
        ],
        'subscribe': [
            'css/pages/subscribe/hero.css',
            'css/pages/subscribe/form.css',
            'css/pages/subscribe/preview.css',
            'css/pages/subscribe/testimonials.css'
        ],
        'product': [
            'css/pages/product.css'
        ],
        'about': [
            'css/pages/about.css'
        ],
        'migrate': [
            'css/pages/migrate.css'
        ],
        'case-studies': [
            'css/pages/case-studies.css'
        ]
    };

    // Deferred CSS bundles - loaded after initial page render
    const deferredBundles = {
        'index-deferred': [
            'css/components-page-specific.css',  // Below-the-fold homepage sections
            'css/pages/index/benefits.css',      // Benefits section
            'css/pages/index.css',               // Edge, features, comparison, testimonials, CTA sections
            'css/pages/index/testimonials.css',  // Testimonials section
            'css/pages/index/features.css'       // Features section
        ]
    };

    // Proper CSS minification function that preserves @keyframes and CSS syntax
    const minifyCss = (css) => {
        return css
            // Remove multi-line comments
            .replace(/\/\*[\s\S]*?\*\//g, '')
            // Remove single-line comments (but not URLs)
            .replace(/(?<!:)\/\/.*/g, '')
            // Remove leading/trailing whitespace per line and empty lines
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n')
            // Now carefully minify spacing while preserving important syntax
            .replace(/\s*{\s*/g, '{')
            .replace(/\s*}\s*/g, '}')
            .replace(/\s*:\s*/g, ':')
            .replace(/\s*;\s*/g, ';')
            .replace(/\s*,\s*/g, ',')
            .replace(/;\s*}/g, '}')
            // CRITICAL: Preserve space before !important flag
            .replace(/\s+!important/g, ' !important')
            // Preserve spaces in calc() and similar functions
            .replace(/calc\s*\(\s*/g, 'calc(')
            .trim();
    };

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

    // Bundle common CSS (shared across pages)
    let commonBundled = '';
    commonCssFiles.forEach(file => {
        const filePath = join('public', file);
        if (existsSync(filePath)) {
            console.log(`📄 Including common: ${file}`);
            commonBundled += readFileSync(filePath, 'utf8') + '\n';
        } else {
            console.warn(`⚠️  Common CSS file not found: ${file}`);
        }
    });

    // Bundle page-specific CSS
    Object.entries(pageBundles).forEach(([pageName, files]) => {
        console.log(`📄 Bundling ${pageName} CSS...`);
        let pageBundled = '';
        files.forEach(file => {
            const filePath = join('public', file);
            if (existsSync(filePath)) {
                console.log(`   📄 Including: ${file}`);
                pageBundled += readFileSync(filePath, 'utf8') + '\n';
            } else {
                console.warn(`⚠️  Page CSS file not found: ${file}`);
            }
        });
        
        // Minify and write page-specific CSS
        const minifiedPage = minifyCss(pageBundled);
        writeFileSync(join('dist', `styles-${pageName}.css`), minifiedPage);
        console.log(`   📦 ${pageName} CSS: ${minifiedPage.length} bytes`);
    });

    // Bundle deferred CSS (lazy-loaded after initial render)
    Object.entries(deferredBundles).forEach(([bundleName, files]) => {
        console.log(`📄 Bundling ${bundleName} CSS (deferred)...`);
        let deferredBundled = '';
        files.forEach(file => {
            const filePath = join('public', file);
            if (existsSync(filePath)) {
                console.log(`   📄 Including: ${file}`);
                deferredBundled += readFileSync(filePath, 'utf8') + '\n';
            } else {
                console.warn(`⚠️  Deferred CSS file not found: ${file}`);
            }
        });
        
        // Minify and write deferred CSS
        const minifiedDeferred = minifyCss(deferredBundled);
        writeFileSync(join('dist', `styles-${bundleName}.css`), minifiedDeferred);
        console.log(`   📦 ${bundleName} CSS (deferred): ${minifiedDeferred.length} bytes`);
    });

    // Minify and write critical CSS
    const minifiedCritical = minifyCss(criticalBundled);
    writeFileSync(join('dist', 'critical.css'), minifiedCritical);
    console.log(`📦 Critical CSS: ${minifiedCritical.length} bytes`);

    // Minify and write common CSS (shared bundle)
    const minifiedCommon = minifyCss(commonBundled);
    writeFileSync(join('dist', 'styles.css'), minifiedCommon);
    console.log(`📦 Common CSS: ${minifiedCommon.length} bytes`);
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
        // Improved minification: preserve CSS syntax properly
        let minified = content
            // Remove multi-line comments
            .replace(/\/\*[\s\S]*?\*\//g, '')
            // Remove single-line comments (but not URLs)
            .replace(/(?<!:)\/\/.*/g, '')
            // Remove leading/trailing whitespace per line and empty lines
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n')
            // Now minify spacing
            .replace(/\s*{\s*/g, '{')
            .replace(/\s*}\s*/g, '}')
            .replace(/\s*:\s*/g, ':')
            .replace(/\s*;\s*/g, ';')
            .replace(/\s*,\s*/g, ',')
            .replace(/;\s*}/g, '}')
            // CRITICAL: Preserve space before !important
            .replace(/\s+!important/g, ' !important')
            // Preserve spaces in calc() and similar functions
            .replace(/calc\s*\(\s*/g, 'calc(')
            .trim();

        writeFileSync(join(distCssDir, file), minified);
    });
}

// Simple JS Minifier
function minifyJs(code) {
    return code
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
        .replace(/(?<!:)\/\/.*/g, '') // Remove single-line comments
        .replace(/^\s+|\s+$/gm, '') // Trim lines
        .replace(/\n+/g, '\n') // Remove empty lines
        ;
}

// Copy JavaScript with minification
function copyJs() {
    console.log('📋 Copying and Minifying JavaScript...');
    
    // Copy main script.js
    const jsFile = join('public', 'script.js');
    const distJsFile = join('dist', 'script.js');

    if (existsSync(jsFile)) {
        const content = readFileSync(jsFile, 'utf8');
        const minified = minifyJs(content);
        writeFileSync(distJsFile, minified);
        console.log(`  ✓ Minified script.js (${(content.length/1024).toFixed(1)}KB -> ${(minified.length/1024).toFixed(1)}KB)`);
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
                } else if (item.endsWith('.js')) {
                    const content = readFileSync(srcPath, 'utf8');
                    const minified = minifyJs(content);
                    writeFileSync(destPath, minified);
                    console.log(`  ✓ Minified ${srcPath.replace('public/', '')}`);
                } else if (item === 'README.md') {
                    copyFileSync(srcPath, destPath);
                }
            });
        }
        
        copyJsRecursive(jsDir, distJsDir);
    }
}

// Copy JavaScript config files
function copyJsConfigs() {
    console.log('📋 Copying JavaScript config files...');
    
    // Note: Newsletter subscription now handled server-side via Cloudflare Functions
    // No client-side Brevo configuration needed
    console.log('  ℹ️  Newsletter uses server-side API (Cloudflare Functions)');
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
    ['robots.txt', 'sitemap.xml', 'site.webmanifest', 'google1234567890abcdef.html', 'favicon.svg', 'favicon.ico'].forEach(file => {
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

    // Run link health check
    console.log('🔗 Running link health check...');
    import('./check-links.js').then(({ checkLinks }) => {
        checkLinks();
        console.log('✅ Build completed successfully!');
        console.log('📁 Output directory: ./dist');
        console.log('🚀 Ready for deployment');
    }).catch(error => {
        console.error('❌ Link check failed:', error.message);
        process.exit(1);
    });

} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}