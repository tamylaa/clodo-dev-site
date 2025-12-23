#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, rmSync, mkdirSync, readdirSync, statSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as crypto from 'crypto';
import loadConfig from './config-loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Global config - will be populated by loadConfig()
let CONFIG = null;

/**
 * Build script for website
 * Minifies CSS and JS, copies assets to dist folder
 * Configuration-driven for easy customization
 */

const siteName = () => CONFIG?.site?.site?.name || 'Website';
console.log('🚀 Building website...');

// Clean dist directory
function cleanDist() {
    console.log('🧹 Cleaning dist directory...');
    if (existsSync('dist')) {
        rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist', { recursive: true });
}

// Copy HTML files with template processing
function copyHtml(assetManifest = {}) {
    console.log('📄 Processing HTML files with templates...');

    // Read templates
    const footerTemplate = readFileSync(join('templates', 'footer.html'), 'utf8');
    const headerTemplate = readFileSync(join('templates', 'header.html'), 'utf8');
    const navMainTemplate = readFileSync(join('templates', 'nav-main.html'), 'utf8');
    const heroTemplate = readFileSync(join('templates', 'hero.html'), 'utf8');
const heroPricingTemplate = readFileSync(join('templates', 'hero-pricing.html'), 'utf8');
    const heroMinimalTemplate = readFileSync(join('templates', 'hero-minimal.html'), 'utf8'); // Minimal hero for critical path
    const tocTemplate = readFileSync(join('templates', 'table-of-contents.html'), 'utf8');
    const tocFaqTemplate = readFileSync(join('templates', 'table-of-contents-faq.html'), 'utf8');
    const relatedContentTemplate = readFileSync(join('templates', 'related-content.html'), 'utf8');
    const relatedContentFaqTemplate = readFileSync(join('templates', 'related-content-faq.html'), 'utf8');
    const relatedContentComparisonTemplate = readFileSync(join('templates', 'related-content-comparison.html'), 'utf8');
    const relatedContentWorkersTemplate = readFileSync(join('templates', 'related-content-workers.html'), 'utf8');
    const announcementBannerTemplate = readFileSync(join('templates', 'announcement-banner.html'), 'utf8');
    const themeScriptTemplate = readFileSync(join('templates', 'theme-script.html'), 'utf8'); // Critical theme initialization

    // Read component templates
    const newsletterFormFooterTemplate = readFileSync(join('templates', 'components', 'newsletter-form-footer.html'), 'utf8');
    const newsletterCtaBlogMidTemplate = readFileSync(join('templates', 'components', 'newsletter-cta-blog-mid.html'), 'utf8');
    const newsletterCtaBlogFooterTemplate = readFileSync(join('templates', 'components', 'newsletter-cta-blog-footer.html'), 'utf8');

    // Read partial templates
    const pricingCardsTemplate = readFileSync(join('templates', 'partials', 'pricing-cards.html'), 'utf8');
    
    // Read schema template (for base Organization/WebSite schema)
    const schemaBasePath = join('templates', 'partials', 'schema-base.html');
    const schemaBaseTemplate = existsSync(schemaBasePath) ? readFileSync(schemaBasePath, 'utf8') : '';

    // Read critical CSS for inlining
    const criticalCssPath = join('dist', 'critical.css');
    const criticalCss = existsSync(criticalCssPath) ? readFileSync(criticalCssPath, 'utf8') : '';

    // Note: assetManifest is now passed as parameter
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
    function findHtmlFiles(dir, relativePath = '') {
        const files = [];
        const fullDirPath = join('public', dir);
        
        if (!existsSync(fullDirPath)) {
            return files;
        }
        
        const entries = readdirSync(fullDirPath);

        for (const entry of entries) {
            const fullEntryPath = join(fullDirPath, entry);
            const stat = statSync(fullEntryPath);

            if (stat.isDirectory()) {
                // Skip directories that shouldn't be processed or exposed
                const skipDirs = ['node_modules', 'css', 'js', 'icons', 'demo', 'images', 'assets', 'fonts', 'vendor'];
                if (entry.startsWith('.') || skipDirs.includes(entry)) {
                    console.log(`   ⏭️  Skipping directory: ${entry}`);
                    continue;
                }
                
                // Additional safety check: skip any directory that might contain internal/private content
                if (entry.includes('internal') || entry.includes('private') || entry.includes('draft') || entry.includes('temp')) {
                    console.log(`   ⚠️  Skipping potentially internal directory: ${entry}`);
                    continue;
                }
                
                // Recursively search subdirectories with updated relative path
                const subRelativePath = relativePath ? join(relativePath, entry) : entry;
                files.push(...findHtmlFiles(join(dir, entry), subRelativePath));
            } else if (entry.endsWith('.html')) {
                // Skip files that might be internal or shouldn't be exposed
                if (entry.includes('internal') || entry.includes('private') || entry.includes('draft') || entry.includes('temp')) {
                    console.log(`   ⚠️  Skipping potentially internal file: ${entry}`);
                    continue;
                }
                
                const content = readFileSync(fullEntryPath, 'utf8');

                // Check if file uses SSI includes (needs template processing)
                if (content.includes('<!--#include file="')) {
                    const filePath = relativePath ? join(relativePath, entry) : entry;
                    files.push(filePath);
                } else {
                    // Log files that are HTML but don't use templates (for awareness)
                    console.log(`   ℹ️  HTML file without SSI includes: ${relativePath ? join(relativePath, entry) : entry}`);
                }
            }
        }

        return files;
    }

    const htmlFiles = findHtmlFiles('');
    console.log(`   📋 Found ${htmlFiles.length} HTML files that need template processing:`);
    htmlFiles.forEach(file => console.log(`     - ${file}`));

    htmlFiles.forEach(file => {
        const srcPath = join('public', file);
        if (existsSync(srcPath)) {
            let content = readFileSync(srcPath, 'utf8');

            // Calculate path prefix for subdirectory files
            const fileDir = dirname(file);
            const isSubdirectory = fileDir !== '.' && fileDir !== '';
            const pathPrefix = isSubdirectory ? '../' : '';
            console.log(`   📁 Processing ${file}: isSubdirectory=${isSubdirectory}, pathPrefix='${pathPrefix}'`);

            // Create adjusted templates for this file's directory level
            const adjustedNavMainTemplate = adjustTemplatePaths(navMainTemplate, pathPrefix);
            const adjustedFooterTemplate = adjustTemplatePaths(footerTemplate, pathPrefix);
            const adjustedHeaderTemplate = adjustTemplatePaths(headerTemplate, pathPrefix);
            const adjustedHeroTemplate = adjustTemplatePaths(heroTemplate, pathPrefix);
            const adjustedHeroPricingTemplate = adjustTemplatePaths(heroPricingTemplate, pathPrefix);
            const adjustedTocTemplate = adjustTemplatePaths(tocTemplate, pathPrefix);
            const adjustedTocFaqTemplate = adjustTemplatePaths(tocFaqTemplate, pathPrefix);
            const adjustedRelatedContentTemplate = adjustTemplatePaths(relatedContentTemplate, pathPrefix);
            const adjustedRelatedContentFaqTemplate = adjustTemplatePaths(relatedContentFaqTemplate, pathPrefix);
            const adjustedRelatedContentComparisonTemplate = adjustTemplatePaths(relatedContentComparisonTemplate, pathPrefix);
            const adjustedRelatedContentWorkersTemplate = adjustTemplatePaths(relatedContentWorkersTemplate, pathPrefix);
            const adjustedPricingCardsTemplate = adjustTemplatePaths(pricingCardsTemplate, pathPrefix);

            // Create adjusted component templates for this file's directory level
            const adjustedNewsletterFormFooterTemplate = adjustTemplatePaths(newsletterFormFooterTemplate, pathPrefix);
            const adjustedNewsletterCtaBlogMidTemplate = adjustTemplatePaths(newsletterCtaBlogMidTemplate, pathPrefix);
            const adjustedNewsletterCtaBlogFooterTemplate = adjustTemplatePaths(newsletterCtaBlogFooterTemplate, pathPrefix);

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
            content = content.replace('<!-- HEADER_PLACEHOLDER -->', adjustedHeaderTemplate);

            // If the HTML file does not use SSI includes and doesn't already have a <header>,
            // auto-inject the header template so pages authored as standalone still get the nav.
            if (!content.includes('<!--#include file="') && !(/<header[\s>]/i).test(content) && !content.includes('<!-- HEADER_PLACEHOLDER -->')) {
                content = content.replace(/<body>/, `<body>\n    ${adjustedHeaderTemplate}`);
                console.log(`   ℹ️  Header auto-injected into ${file} (no SSI includes present)`);
            }

            // Inject critical header CSS and theme script into <head> to prevent FOUC
            // Header CSS is inlined to ensure nav styles are applied immediately (reduces layout shift)
            const headerCssPath = join('public', 'css', 'global', 'header.css');
            let headerCriticalCss = '';
            if (existsSync(headerCssPath)) {
                headerCriticalCss = readFileSync(headerCssPath, 'utf8')
                    .replace(/\/\*[\s\S]*?\*\//g, '') // remove comments
                    .split('\n').map(l => l.trim()).filter(l => l.length > 0).join('');
            }
            // Minimal breadcrumb styles inlined as well to avoid flash-of-unstyled breadcrumbs
            const breadcrumbCss = `.breadcrumbs{max-width:1280px;margin:0 auto;padding:1rem;font-size:.875rem;color:var(--text-muted)}.breadcrumbs ol{list-style:none;display:flex;gap:.5rem;flex-wrap:wrap;margin:0;padding:0}.breadcrumbs li{display:flex;align-items:center}.breadcrumbs li:not(:last-child):after{content:"/";margin-left:.5rem}.breadcrumbs a{color:var(--primary-color);text-decoration:none}.breadcrumbs a:hover{text-decoration:underline}.navbar{transition:none !important}.css-ready .navbar{transition:all var(--transition-fast)}`;
            if (headerCriticalCss) {
                headerCriticalCss = headerCriticalCss + breadcrumbCss;
            } else {
                headerCriticalCss = breadcrumbCss;
            }

            // Page-specific critical tweaks: e.g., blog index header spacing to avoid layout shifts
            if (file.includes('blog/')) {
                const blogCritical = `.blog-index__header{margin-bottom:3rem}.blog-index__header h1{margin-bottom:.75rem}.blog-index__header p{font-size:1.1rem;margin:0 auto;line-height:1.6}`;
                headerCriticalCss = headerCriticalCss + blogCritical;
            }
            if (content.includes('</head>')) {
                const headerStyleTag = headerCriticalCss ? `<style>${headerCriticalCss}</style>\n    ` : '';
                
                // Inject base schema.org only if page doesn't already have schema data
                // This provides default Organization/WebSite schema for new pages
                const hasExistingSchema = content.includes('application/ld+json');
                const schemaTag = (!hasExistingSchema && schemaBaseTemplate) 
                    ? `\n    ${schemaBaseTemplate}\n    ` 
                    : '';
                
                content = content.replace('</head>', `    ${headerStyleTag}${schemaTag}${themeScriptTemplate}\n</head>`);
                console.log(`   ✅ Theme script (and header critical CSS) injected in ${file}${schemaTag ? ' + base schema' : ''}`);
            } else {
                console.warn(`   ⚠️  No </head> tag found in ${file} - theme script NOT injected!`);
            }

            // Process SSI includes (handles any indentation) with path-adjusted templates
            content = content.replace(/<!--#include file="\.\.\/templates\/nav-main\.html" -->/g, adjustedNavMainTemplate);
            content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/nav-main\.html" -->/g, adjustedNavMainTemplate);
            content = content.replace(/<!--#include file="\.\.\/templates\/footer\.html" -->/g, adjustedFooterTemplate);
            content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/footer\.html" -->/g, adjustedFooterTemplate);
            content = content.replace(/<!--#include file="\.\.\/templates\/header\.html" -->/g, adjustedHeaderTemplate);
            content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/header\.html" -->/g, adjustedHeaderTemplate);
            content = content.replace(/<!--#include file="\.\.\/templates\/hero\.html" -->/g, adjustedHeroTemplate);
            content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/hero\.html" -->/g, adjustedHeroTemplate);
            content = content.replace(/<!--#include file="\.\.\/templates\/table-of-contents\.html" -->/g, adjustedTocTemplate);
            content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/table-of-contents\.html" -->/g, adjustedTocTemplate);
            content = content.replace(/<!--#include file="\.\.\/templates\/table-of-contents-faq\.html" -->/g, adjustedTocFaqTemplate);
            content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/table-of-contents-faq\.html" -->/g, adjustedTocFaqTemplate);
            content = content.replace(/<!--#include file="\.\.\/templates\/related-content\.html" -->/g, adjustedRelatedContentTemplate);
            content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/related-content\.html" -->/g, adjustedRelatedContentTemplate);
            content = content.replace(/<!--#include file="\.\.\/templates\/related-content-faq\.html" -->/g, adjustedRelatedContentFaqTemplate);
            content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/related-content-faq\.html" -->/g, adjustedRelatedContentFaqTemplate);
            content = content.replace(/<!--#include file="\.\.\/templates\/related-content-comparison\.html" -->/g, adjustedRelatedContentComparisonTemplate);
            content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/related-content-comparison\.html" -->/g, adjustedRelatedContentComparisonTemplate);
            content = content.replace(/<!--#include file="\.\.\/templates\/related-content-workers\.html" -->/g, adjustedRelatedContentWorkersTemplate);
            content = content.replace(/<!--#include file="\.\.\/templates\/partials\/pricing-cards\.html" -->/g, adjustedPricingCardsTemplate);
            content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/partials\/pricing-cards\.html" -->/g, adjustedPricingCardsTemplate);

            // Process component SSI includes
            content = content.replace(/<!--#include file="components\/newsletter-form-footer\.html" -->/g, adjustedNewsletterFormFooterTemplate);
            content = content.replace(/<!--#include file="\.\.\/components\/newsletter-form-footer\.html" -->/g, adjustedNewsletterFormFooterTemplate);
            content = content.replace(/<!--#include file="\.\.\/\.\.\/components\/newsletter-form-footer\.html" -->/g, adjustedNewsletterFormFooterTemplate);
            content = content.replace(/<!--#include file="components\/newsletter-cta-blog-mid\.html" -->/g, adjustedNewsletterCtaBlogMidTemplate);
            content = content.replace(/<!--#include file="\.\.\/components\/newsletter-cta-blog-mid\.html" -->/g, adjustedNewsletterCtaBlogMidTemplate);
            content = content.replace(/<!--#include file="\.\.\/\.\.\/components\/newsletter-cta-blog-mid\.html" -->/g, adjustedNewsletterCtaBlogMidTemplate);
            content = content.replace(/<!--#include file="components\/newsletter-cta-blog-footer\.html" -->/g, adjustedNewsletterCtaBlogFooterTemplate);
            content = content.replace(/<!--#include file="\.\.\/components\/newsletter-cta-blog-footer\.html" -->/g, adjustedNewsletterCtaBlogFooterTemplate);
            content = content.replace(/<!--#include file="\.\.\/\.\.\/components\/newsletter-cta-blog-footer\.html" -->/g, adjustedNewsletterCtaBlogFooterTemplate);
            content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/related-content-workers\.html" -->/g, adjustedRelatedContentWorkersTemplate);

            // Replace hero placeholder with actual hero content
            // For index.html, use minimal hero (critical path only)
            // For pricing, use a pricing-specific hero template
            if (file === 'index.html') {
                content = content.replace('<!-- HERO_PLACEHOLDER -->', heroMinimalTemplate);
            } else if (file === 'pricing.html') {
                content = content.replace('<!-- HERO_PLACEHOLDER -->', adjustedHeroPricingTemplate);
            } else {
                content = content.replace('<!-- HERO_PLACEHOLDER -->', adjustedHeroTemplate);
            }

            // Replace footer placeholder with actual footer content (legacy support)
            content = content.replace('<!-- FOOTER_PLACEHOLDER -->', adjustedFooterTemplate);

            // Safety fallback: if after processing there is still no navbar inserted, inject header/nav
            if (!(/<nav\s+class=["']navbar["']/i).test(content)) {
                // wrap nav in <header> for semantics
                content = content.replace(/<body>/, `<body>\n    <header>\n${adjustedHeaderTemplate}\n    </header>`);
                console.log(`   ℹ️  Header (nav) injected into ${file} (post-processing fallback)`);
            }

            // Look up hashed JS and CSS filenames from manifest (available for use throughout copyHtml)
            const initPreloadJs = assetManifest['js/init-preload.js'] || 'js/init-preload.js';
            const mainJs = assetManifest['js/main.js'] || 'js/main.js';
            const analyticsJs = assetManifest['js/analytics.js'] || 'js/analytics.js';
            const initSystemsJs = assetManifest['js/init-systems.js'] || 'js/init-systems.js';
            const deferCssJs = assetManifest['js/defer-css.js'] || 'js/defer-css.js';
            const configFeaturesJs = assetManifest['js/config/features.js'] || 'js/config/features.js';
            const navigationJs = assetManifest['js/ui/navigation-component.js'] || 'js/ui/navigation-component.js';

            // Replace CSS link with inline critical CSS and async non-critical CSS
            if (criticalCss) {
                const criticalCssLength = criticalCss.length;
                const maxInlineSize = CONFIG?.pages?.optimization?.criticalCss?.maxInlineSize || 50000; // 50KB max for inlining
                
                console.log(`   📊 CSS Size Check: critical=${(criticalCssLength / 1024).toFixed(1)}KB (max=${(maxInlineSize / 1024).toFixed(0)}KB)`);
                
                // Determine which page-specific CSS bundle to load using config
                // CONFIG.getPageBundle uses rules from pages.config.json
                const pageBundle = CONFIG?.getPageBundle ? CONFIG.getPageBundle(file) : 'common';
                
                const origCssFile = pageBundle === 'common' ? 'styles.css' : `styles-${pageBundle}.css`;
                const cssFile = assetManifest[origCssFile] || origCssFile;
                const commonCssFile = assetManifest['styles.css'] || 'styles.css'; // Get hashed common CSS filename
                console.log(`   📄 Loading CSS bundle: ${cssFile} (resolved from ${origCssFile})`);
                console.log(`   📄 Common CSS file: ${commonCssFile} (resolved from styles.css)`);
                
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
                        
                        // Add asset manifest as global variable for use in deferred CSS loading
                        const manifestScript = `<script>window.__assetManifest__=${JSON.stringify(assetManifest)};</script>`;
                        const headInjection = `${criticalCssInline}\n    ${manifestScript}\n    <link rel="preload" href="/${commonCssFile}" as="style">\n    <link rel="preload" href="/${cssFile}" as="style">\n    <script src="/${initPreloadJs}"></script>`;
                        const footerInjection = `<link rel="stylesheet" href="/${commonCssFile}">\n    <link rel="stylesheet" href="/${cssFile}">`;
                        
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
                        const fileDir = dirname(file);
                        const isSubdirectory = fileDir !== '.' && fileDir !== '';
                        const _pathPrefix = isSubdirectory ? '../' : '';
                        console.log(`   📁 Processing ${file}: isSubdirectory=${isSubdirectory}, pathPrefix='${_pathPrefix}'`);
                        
                        const commonCss = `<link rel="preload" href="/${commonCssFile}" as="style"><noscript><link rel="stylesheet" href="/${commonCssFile}"></noscript>`;
                        const pageCss = pageBundle !== 'common' ? `\n    <link rel="preload" href="/${cssFile}" as="style"><noscript><link rel="stylesheet" href="/${cssFile}"></noscript>` : '';
                        const asyncCssLink = commonCss + pageCss + `\n    <script src="/${initPreloadJs}"></script>`;
                        
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
                    const fileDir = dirname(file);
                    const isSubdirectory = fileDir !== '.' && fileDir !== '';
                    const _pathPrefix = isSubdirectory ? '../' : '';
                    
                    const commonCss = `<link rel="preload" href="/${commonCssFile}" as="style"><noscript><link rel="stylesheet" href="/${commonCssFile}"></noscript>`;
                    const pageCss = pageBundle !== 'common' ? `\n    <link rel="preload" href="/${cssFile}" as="style"><noscript><link rel="stylesheet" href="/${cssFile}"></noscript>` : '';
                    const asyncCssLink = commonCss + pageCss + `\n    <script src="/${initPreloadJs}"></script>`;
                    
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
                    } else if (pageBundle !== 'common') {
                        // Fallback: if styles.css link wasn't found but this is a page-specific bundle,
                        // inject the page CSS into the footer before </body>
                        const commonCss = `<link rel="preload" href="/${commonCssFile}" as="style"><noscript><link rel="stylesheet" href="/${commonCssFile}"></noscript>`;
                        const pageCss = `\n    <link rel="preload" href="/${cssFile}" as="style"><noscript><link rel="stylesheet" href="/${cssFile}"></noscript>`;
                        const fallbackCssLink = commonCss + pageCss + `\n    <script src="/${initPreloadJs}"></script>`;
                        content = content.replace('</body>', `    ${fallbackCssLink}\n</body>`);
                        console.log(`   ℹ️  Injected page-specific CSS (${cssFile}) via fallback method`);
                    }
                }
            }

            // Add defer attribute to non-critical scripts to reduce main-thread blocking & improve LCP
            // Skip scripts that must run early (theme/init-preload) or are module scripts (type="module")
            try {
                const deferScriptNames = [
                    'component-nav.js',
                    'analytics.js',
                    'github-integration.js',
                    'lazy-loading.js',
                    'scroll-animations.js',
                    'main.js',
                    'defer-css.js',
                    'config/features.js',
                    'features/index.js',
                    'features/newsletter.js',
                    'features/brevo-chat.js',
                    'ui/index.js'
                ];

                deferScriptNames.forEach((name) => {
                    const regex = new RegExp(`<script([^>]*)src=["'](?:\\.|\\/|)js\\/${name}["']([^>]*)><\\/script>`, 'g');
                    content = content.replace(regex, (m) => {
                        if (/\bdefer\b|\basync\b/.test(m)) return m; // already deferred/async
                        if (/type=["']module["']/.test(m)) return m; // module scripts are deferred by default
                        return m.replace('<script', '<script defer');
                    });
                });
            } catch (e) {
                // Non-fatal - leave scripts as-is if anything goes wrong
            }

            // Replace script src paths with hashed versions from asset manifest
            try {
                const scriptReplacements = [
                    { name: 'init-systems.js', variable: initSystemsJs },
                    { name: 'main.js', variable: mainJs },
                    { name: 'analytics.js', variable: analyticsJs },
                    { name: 'defer-css.js', variable: deferCssJs },
                    { name: 'config/features.js', variable: configFeaturesJs },
                    { name: 'ui/navigation-component.js', variable: navigationJs }
                ];

                scriptReplacements.forEach(({ name, variable }) => {
                    // Match script tags with this src path and replace with hashed version
                    const escapedName = name.replace(/\//g, '\\/');
                    const regex = new RegExp(`(<script[^>]*src=["'])(?:\\.|\\/|)js\\/${escapedName}(["'][^>]*>)`, 'g');
                    content = content.replace(regex, `$1/${variable}$2`);
                });
            } catch (e) {
                // Non-fatal - leave scripts as-is if hashing fails
                console.warn(`⚠️  Script src replacement failed: ${e.message}`);
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

            // Final safety: ensure the navbar exists in the final content; if not, inject it
            if (!(/<nav\s+class=["']navbar["']/i).test(content)) {
                content = content.replace(/<body>/, `<body>\n    <header>\n${adjustedHeaderTemplate}\n    </header>`);
                console.log(`   ℹ️  Header (nav) injected into ${file} (final fallback before write)`);
            }

            // Process template variables ({{siteName}}, {{baseUrl}}, etc.)
            // This replaces placeholders with values from site.config.js
            if (CONFIG?.processTemplateVariables) {
                content = CONFIG.processTemplateVariables(content, {
                    currentPage: file,
                    currentYear: new Date().getFullYear()
                });
            }

            writeFileSync(destPath, content);
        }
    });
}

// Copy HTML files that don't use SSI includes (standalone HTML pages)
function copyStandaloneHtml() {
    console.log('📄 Copying standalone HTML files...');
    
    function copyHtmlFiles(dir, relativePath = '') {
        const fullDirPath = join('public', dir);
        
        if (!existsSync(fullDirPath)) {
            return;
        }
        
        const entries = readdirSync(fullDirPath);

        for (const entry of entries) {
            const fullEntryPath = join(fullDirPath, entry);
            const stat = statSync(fullEntryPath);

            if (stat.isDirectory()) {
                // Skip directories that shouldn't be processed
                const skipDirs = ['node_modules', 'css', 'js', 'icons', 'demo', 'images', 'assets', 'fonts', 'vendor'];
                if (entry.startsWith('.') || skipDirs.includes(entry)) {
                    continue;
                }
                
                // Additional safety check: skip any directory that might contain internal/private content
                if (entry.includes('internal') || entry.includes('private') || entry.includes('draft') || entry.includes('temp')) {
                    continue;
                }
                
                // Recursively search subdirectories
                const subRelativePath = relativePath ? join(relativePath, entry) : entry;
                copyHtmlFiles(join(dir, entry), subRelativePath);
            } else if (entry.endsWith('.html')) {
                // Skip files that might be internal or shouldn't be exposed
                if (entry.includes('internal') || entry.includes('private') || entry.includes('draft') || entry.includes('temp')) {
                    continue;
                }
                
                const content = readFileSync(fullEntryPath, 'utf8');

                // Only copy HTML files that DON'T use SSI includes (these are standalone pages)
                if (!content.includes('<!--#include file="')) {
                    const filePath = relativePath ? join(relativePath, entry) : entry;
                    const destPath = join('dist', filePath);
                    
                    // Ensure destination directory exists
                    const destDir = dirname(destPath);
                    if (!existsSync(destDir)) {
                        mkdirSync(destDir, { recursive: true });
                    }
                    
                    copyFileSync(fullEntryPath, destPath);
                    console.log(`   📋 Copied standalone HTML: ${filePath}`);
                }
            }
        }
    }

    copyHtmlFiles('');
}

// Bundle CSS into critical and non-critical bundles for performance
function bundleCss() {
    console.log('🎨 Bundling CSS...');

    // Asset manifest for content-hashed filenames
    const assetManifest = {};

    // Critical CSS files (needed for initial render - above-the-fold only)
    // These are hardcoded as they are structural, not content-dependent
    const criticalCssFiles = [
        'css/critical-base.css', // Optimized variables & resets
        'css/global/header.css', // Header/navigation (always visible)
        'css/utilities.css'      // Essential utility classes
    ];

    // Common CSS (shared across all pages, loaded asynchronously)
    // Can be overridden via config/pages.config.json commonCss.files
    const defaultCommonCssFiles = [
        'css/base.css',        // Full base styles (overrides critical-base)
        'css/layout.css',      // Grid, containers, basic layout
        'css/components/buttons.css',  // Button component
        'css/components-common.css',  // Truly reusable components (buttons, cards, forms, icons, alerts, badges, loading)
        'css/global/footer.css'  // Footer styling (loaded with common CSS - below-the-fold)
    ];
    
    // Use config-driven common CSS if available, otherwise use defaults
    const commonCssFiles = CONFIG?.getCommonCssFiles?.()?.length > 0 
        ? CONFIG.getCommonCssFiles() 
        : defaultCommonCssFiles;

    // Page-specific CSS bundles from config (reduces unused CSS by 60%+)
    // Falls back to hardcoded bundles if config not available
    const configPageBundles = CONFIG?.pages?.pageBundles || {};
    const defaultPageBundles = {
        'index': [
            'css/pages/index/hero.css',
            'css/hero-decorations.css',
            'css/pages/index/hero-animations.css'
            // Note: social-proof, stats, benefits, features, comparison, cta, and other sections moved to deferred for performance
        ],
        'pricing': [
            'css/pages/pricing/index.css'
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
        ],
        'community': [
            'css/pages/community.css'
        ]
    };
    
    // Merge config bundles with defaults (config takes precedence)
    const pageBundles = { ...defaultPageBundles };
    for (const [bundleName, bundleConfig] of Object.entries(configPageBundles)) {
        if (bundleConfig?.css) {
            pageBundles[bundleName] = bundleConfig.css;
        }
    }

    // Deferred CSS bundles - loaded after initial page render
    // Build from config if available
    const defaultDeferredBundles = {
        'index-deferred': [
            'css/components-page-specific.css',              // Below-the-fold homepage sections
            'css/pages/index/benefits.css',                  // Benefits section
            'css/pages/index/cloudflare-edge.css',          // Cloudflare Edge section
            'css/pages/index/comparison.css',               // Comparison section
            'css/pages/index/cta.css',                      // CTA section
            'css/pages/index/features.css',                 // Features section
            'css/pages/index/social-proof.css',             // Social proof/testimonials section
            'css/pages/index/stats.css',                    // Stats section
            'css/pages/index.css'                           // Additional index page styles
        ]
    };
    
    // Build deferred bundles from config
    const deferredBundles = { ...defaultDeferredBundles };
    for (const [bundleName, bundleConfig] of Object.entries(configPageBundles)) {
        if (bundleConfig?.deferred?.length > 0) {
            deferredBundles[`${bundleName}-deferred`] = bundleConfig.deferred;
        }
    }

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

    // Function to recursively resolve @import statements
    const resolveImports = (cssContent, baseDir) => {
        return cssContent.replace(/@import\s+url\(['"]?([^'")\s]+)['"]?\);?/g, (match, importPath) => {
            const resolvedPath = join(baseDir, importPath);
            if (existsSync(resolvedPath)) {
                console.log(`   📄 Resolving @import: ${importPath}`);
                const importedContent = readFileSync(resolvedPath, 'utf8');
                // Recursively resolve nested imports
                return resolveImports(importedContent, dirname(resolvedPath));
            } else {
                console.warn(`⚠️  Import file not found: ${resolvedPath}`);
                return match; // Return original if not found
            }
        });
    };

    // Bundle page-specific CSS
    Object.entries(pageBundles).forEach(([pageName, files]) => {
        console.log(`📄 Bundling ${pageName} CSS...`);
        let pageBundled = '';
        files.forEach(file => {
            const filePath = join('public', file);
            if (existsSync(filePath)) {
                console.log(`   📄 Including: ${file}`);
                let cssContent = readFileSync(filePath, 'utf8');
                // Resolve @import statements
                const baseDir = dirname(filePath);
                cssContent = resolveImports(cssContent, baseDir);
                pageBundled += cssContent + '\n';
            } else {
                console.warn(`⚠️  Page CSS file not found: ${file}`);
            }
        });
        
        // Minify and write page-specific CSS with content hash
        const minifiedPage = minifyCss(pageBundled);
        const pageHash = crypto.createHash('sha256').update(minifiedPage).digest('hex').slice(0,8);
        const pageFileName = `styles-${pageName}.${pageHash}.css`;
        writeFileSync(join('dist', pageFileName), minifiedPage);
        assetManifest[`styles-${pageName}.css`] = pageFileName;
        console.log(`   📦 ${pageName} CSS: ${minifiedPage.length} bytes -> ${pageFileName}`);
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
        
        // Minify and write deferred CSS with content hash
        const minifiedDeferred = minifyCss(deferredBundled);
        const deferredHash = crypto.createHash('sha256').update(minifiedDeferred).digest('hex').slice(0,8);
        const deferredFileName = `styles-${bundleName}.${deferredHash}.css`;
        writeFileSync(join('dist', deferredFileName), minifiedDeferred);
        assetManifest[`styles-${bundleName}.css`] = deferredFileName;
        console.log(`   📦 ${bundleName} CSS (deferred): ${minifiedDeferred.length} bytes -> ${deferredFileName}`);
    });

    // Minify and write critical CSS
    const minifiedCritical = minifyCss(criticalBundled);
    writeFileSync(join('dist', 'critical.css'), minifiedCritical);
    console.log(`📦 Critical CSS: ${minifiedCritical.length} bytes`);

    // Minify and write common CSS (shared bundle) with content hash
    const minifiedCommon = minifyCss(commonBundled);
    const commonHash = crypto.createHash('sha256').update(minifiedCommon).digest('hex').slice(0,8);
    const commonFileName = `styles.${commonHash}.css`;
    writeFileSync(join('dist', commonFileName), minifiedCommon);
    assetManifest['styles.css'] = commonFileName;
    console.log(`📦 Common CSS: ${minifiedCommon.length} bytes -> ${commonFileName}`);

    // Return asset manifest (will be merged with JS manifest and written later)
    return assetManifest;
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
    
    // Copy js/ module directory with content hashing
    const jsDir = join('public', 'js');
    const distJsDir = join('dist', 'js');
    const jsManifest = {}; // Track JS file hashes
    
    if (existsSync(jsDir)) {
        console.log('📦 Copying JS modules with hashing...');
        mkdirSync(distJsDir, { recursive: true });
        
        // Recursively copy all JS files and hash them
        // eslint-disable-next-line no-inner-declarations
        function copyJsRecursive(srcDir, destDir, relativePath = '') {
            const items = readdirSync(srcDir);
            
            items.forEach(item => {
                const srcPath = join(srcDir, item);
                const destPath = join(destDir, item);
                const stat = statSync(srcPath);
                const relPath = relativePath ? `${relativePath}/${item}` : item;
                
                if (stat.isDirectory()) {
                    mkdirSync(destPath, { recursive: true });
                    copyJsRecursive(srcPath, destPath, relPath);
                } else if (item.endsWith('.js')) {
                    const content = readFileSync(srcPath, 'utf8');
                    const minified = minifyJs(content);
                    
                    // Generate hash of minified content
                    const jsHash = crypto.createHash('sha256').update(minified).digest('hex').slice(0, 8);
                    const hashFileName = item.replace('.js', `.${jsHash}.js`);
                    const hashDestPath = join(destDir, hashFileName);
                    
                    // Write hashed file
                    writeFileSync(hashDestPath, minified);
                    
                    // Store in manifest (key is original path, value is hashed filename)
                    const manifestKey = `js/${relPath}`;
                    jsManifest[manifestKey] = `js/${relativePath ? `${relativePath}/` : ''}${hashFileName}`;
                    
                    console.log(`  ✓ Minified ${srcPath.replace('public/', '')} -> ${hashFileName}`);
                } else if (item === 'README.md') {
                    copyFileSync(srcPath, destPath);
                }
            });
        }
        
        copyJsRecursive(jsDir, distJsDir);
    }
    
    // Return JS manifest for use in HTML generation
    return jsManifest;
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
    ['robots.txt', 'sitemap.xml', 'site.webmanifest', 'google1234567890abcdef.html', 'favicon.svg', 'favicon.ico', '_redirects', '_headers'].forEach(file => {
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
        commit: process.env.GITHUB_SHA || 'local-build',
        siteName: CONFIG?.site?.site?.name || 'Unknown'
    };

    writeFileSync(
        join('dist', 'build-info.json'),
        JSON.stringify(buildInfo, null, 2)
    );
}

// Main build process - wrapped in async IIFE to support config loading
(async () => {
    try {
        // Load configuration first
        CONFIG = await loadConfig();
        console.log(`🚀 Building ${CONFIG?.site?.site?.name || 'website'}...`);
        
        cleanDist();
        const cssManifest = bundleCss();  // Must run before copyHtml since HTML processing needs critical.css, returns CSS asset manifest
        const jsManifest = copyJs();      // Extract JS manifest early so it can be passed to copyHtml
        
        // Merge CSS and JS manifests into single asset manifest
        const assetManifest = { ...cssManifest, ...jsManifest };
        
        // Pass merged manifest to copyHtml so it can inject hashed filenames
        copyHtml(assetManifest);
        
        // Write final combined asset manifest
        writeFileSync(
            join('dist', 'asset-manifest.json'),
            JSON.stringify(assetManifest, null, 2)
        );
        console.log('📦 Asset manifest written with', Object.keys(assetManifest).length, 'entries');
        
        copyStandaloneHtml();
        minifyCss();
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
        console.error(error.stack);
        process.exit(1);
    }
})();