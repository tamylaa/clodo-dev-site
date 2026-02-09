#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, rmSync, mkdirSync, readdirSync, statSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as crypto from 'crypto';
import { injectSchemasIntoHTML } from '../schema/build-integration.js';
import { generateOrganizationSchema, generateWebSiteSchema, generateSoftwareApplicationSchema, wrapSchemaTag } from '../schema/schema-generator.js';
import { detectLocaleFromPath } from '../schema/locale-utils.js';
import { fixCanonicalUrls } from './fix-canonicals-fn.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Simple build script for Clodo Framework website
 * Minifies CSS and JS, copies assets to dist folder
 */

console.log('[BUILD] Building Clodo Framework website...');

// Clean dist directory
function cleanDist() {
    console.log('[CLEAN] Cleaning dist directory...');
    if (existsSync('dist')) {
        rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist', { recursive: true });
}

// Copy HTML files with template processing
function copyHtml(assetManifest = {}) {
    console.log('📄 Processing HTML files with templates...');

    // Read templates
    const headerTemplate = readFileSync(join('templates', 'header.html'), 'utf8');
    
    // Navigation templates - loaded from centralized nav-system
    const footerTemplate = readFileSync(join('nav-system', 'templates', 'footer.html'), 'utf8');
    const navMainTemplate = readFileSync(join('nav-system', 'templates', 'nav-main.html'), 'utf8');
    const verificationTemplate = readFileSync(join('templates', 'verification.html'), 'utf8');
    const heroTemplate = readFileSync(join('templates', 'hero.html'), 'utf8');
const heroPricingTemplate = readFileSync(join('templates', 'hero-pricing.html'), 'utf8');
    const heroMinimalTemplate = readFileSync(join('templates', 'hero-minimal.html'), 'utf8'); // Minimal hero for critical path
    const tocTemplate = readFileSync(join('templates', 'table-of-contents.html'), 'utf8');
    const tocFaqTemplate = readFileSync(join('templates', 'table-of-contents-faq.html'), 'utf8');
    const relatedContentTemplate = readFileSync(join('templates', 'related-content.html'), 'utf8');
    const relatedContentFaqTemplate = readFileSync(join('templates', 'related-content-faq.html'), 'utf8');
    const relatedContentComparisonTemplate = readFileSync(join('templates', 'related-content-comparison.html'), 'utf8');
    const relatedContentWorkersTemplate = readFileSync(join('templates', 'related-content-workers.html'), 'utf8');
    // HowTo / Benchmarks template for reuse across pages
    const howtoTemplate = readFileSync(join('templates', 'howto-section.html'), 'utf8');
    // Static announcement banner no longer used - replaced with dynamic announcements-manager.js system
    const themeScriptTemplate = readFileSync(join('templates', 'theme-script.html'), 'utf8'); // Critical theme initialization

    // Read community section template from nav-system
    const communitySectionTemplate = readFileSync(join('nav-system', 'templates', 'community-section.html'), 'utf8');

    // Read component templates
    const newsletterFormFooterTemplate = readFileSync(join('templates', 'components', 'newsletter-form-footer.html'), 'utf8');
    const newsletterCtaBlogMidTemplate = readFileSync(join('templates', 'components', 'newsletter-cta-blog-mid.html'), 'utf8');
    const newsletterCtaBlogFooterTemplate = readFileSync(join('templates', 'components', 'newsletter-cta-blog-footer.html'), 'utf8');

    // Read partial templates
    const pricingCardsTemplate = readFileSync(join('templates', 'partials', 'pricing-cards.html'), 'utf8');

    // Read critical CSS for inlining
    const criticalCssPath = join('dist', 'critical.css');
    const criticalCss = existsSync(criticalCssPath) ? readFileSync(criticalCssPath, 'utf8') : '';

    // Note: assetManifest is now passed as parameter

    // Load image manifest for SEO images (used to generate responsive picture markup & ImageObject JSON-LD)
    let imagesManifest = null;
    try {
        imagesManifest = JSON.parse(readFileSync(join('data','images','seo','images.json'), 'utf8'));
    } catch (e) {
        console.warn('[IMAGES] No images manifest found at data/images/seo/images.json - responsive images will not be generated');
        imagesManifest = [];
    }

    function findImageManifestEntriesForPage(pageFileName, locale) {
        // Return entries whose pages include this filename and optionally match locale
        const entries = imagesManifest.filter(img => Array.isArray(img.pages) && img.pages.includes(pageFileName));
        if (!entries.length) return [];
        if (!locale || locale === 'en') return entries;
        // Prefer entries that include requested locale
        const matching = entries.filter(e => Array.isArray(e.locales) && e.locales.includes(locale));
        return matching.length ? matching : entries;
    }

    // Function to build responsive <picture> markup given an image manifest entry and path prefix
    function buildPictureMarkup(entry, pathPrefix) {
        // Prefer webp variants if available in optimized
        const opt = entry.optimized || {};
        const webp1 = opt.webp_1x || null;
        const webp2 = opt.webp_2x || null;
        const png1 = opt.png_1x || entry.file || null;
        const png2 = opt.png_2x || null;
        const alt = entry.alt || '';
        const width = entry.width || '';
        const height = entry.height || '';

        // Build srcset strings
        const webpSrcset = [webp1 ? `${pathPrefix}${webp1.replace(/^\//, '')} 1x` : null, webp2 ? `${pathPrefix}${webp2.replace(/^\//, '')} 2x` : null].filter(Boolean).join(', ');
        const pngSrcset = [png1 ? `${pathPrefix}${png1.replace(/^\//, '')} 1x` : null, png2 ? `${pathPrefix}${png2.replace(/^\//, '')} 2x` : null].filter(Boolean).join(', ');

        // Fallback img src uses png1
        const imgSrc = png1 ? `${pathPrefix}${png1.replace(/^\//, '')}` : '';

        const picture = [`<picture class="hero-image" aria-hidden="false">`];
        if (webpSrcset) picture.push(`    <source type="image/webp" srcset="${webpSrcset}">`);
        if (pngSrcset) picture.push(`    <source type="image/png" srcset="${pngSrcset}">`);
        picture.push(`    <img src="${imgSrc}" alt="${escapeHtml(alt)}" width="${width}" height="${height}" loading="eager" decoding="async">`);
        picture.push(`</picture>`);
        return picture.join('\n');
    }

    function escapeHtml(str) {
        return (str || '').replace(/[&<>"]/g, function (s) {
            return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[s];
        });
    }

    // Function to adjust template paths for subdirectory files
    function adjustTemplatePaths(template, prefix) {
        if (!prefix) return template;
        // Adjust href and src attributes that are relative (not starting with http, //, /, or #)
        const adjustAttr = (match, attr, value) => {
            if (value.startsWith('http') || value.startsWith('//') || value.startsWith('/') || value.startsWith('#') || value.startsWith('mailto:') || value.startsWith('data:')) {
                return match; // Leave absolute URLs and anchors unchanged
            }
            return `${attr}="${prefix}${value}"`;
        };
        return template
            .replace(/href="([^"]*)"/g, (match, href) => adjustAttr(match, 'href', href))
            .replace(/src="([^"]*)"/g, (match, src) => adjustAttr(match, 'src', src));
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

            // Inject asset manifest into the page <head> EARLY so init-preload and defer-css
            // can access hashed filenames immediately and avoid 'preloaded but not used' warnings
            try {
                const manifestScript = `<script nonce="N0Nc3Cl0d0">window.__assetManifest__=${JSON.stringify(assetManifest)};</script>`;
                if (content.indexOf('<head>') !== -1) {
                    content = content.replace('<head>', `<head>\n    ${manifestScript}`);
                }

                // Rewrite known preload hrefs to hashed filenames when available (avoid timing mismatch)
                try {
                    if (assetManifest['styles.css']) {
                        content = content.replace(/<link rel="preload" href="\/styles\.css"/g, `<link rel="preload" href="/${assetManifest['styles.css']}"`);
                        content = content.replace(/<noscript><link rel="stylesheet" href="\/styles\.css"><\/noscript>/g, `<noscript><link rel="stylesheet" href="/${assetManifest['styles.css']}"></noscript>`);
                    }
                    const componentsKey = assetManifest['css/components-reusable.css'] || assetManifest['components-reusable.css'] || null;
                    if (componentsKey) {
                        content = content.replace(/<link rel="preload" href="\/css\/components-reusable\.css"/g, `<link rel="preload" href="/${componentsKey}"`);
                        content = content.replace(/<noscript><link rel="stylesheet" href="\/css\/components-reusable\.css"><\/noscript>/g, `<noscript><link rel="stylesheet" href="/${componentsKey}"></noscript>`);
                    }
                } catch (e) {
                    console.warn('[MANIFEST] Failed to rewrite preload hrefs for ' + srcPath + ':', e.message);
                }

                // If we have preloaded styles, ensure init-preload script runs AFTER all preload links
                try {
                    const initPreloadJs = assetManifest['js/init-preload.js'] || 'js/init-preload.js';
                    if (content.includes('<link rel="preload"') && !content.includes(`<script src="/${initPreloadJs}"></script>`)) {
                        // Prefer inserting right before the page-specific styles deferred comment so it runs after all preloads
                        if (content.includes('<!-- Page-specific styles deferred (non-critical content) -->')) {
                            content = content.replace('<!-- Page-specific styles deferred (non-critical content) -->', `    <script src="/${initPreloadJs}"></script>\n    <!-- Page-specific styles deferred (non-critical content) -->`);
                        } else {
                            // Fallback: append after the last preload occurrence
                            content = content.replace(/(<link rel="preload" href="[^"]+" as="style">)(?![\s\S]*<link rel="preload")/, `$1\n    <script src="/${initPreloadJs}"></script>`);
                        }
                    }
                } catch (e) {
                    console.warn('[MANIFEST] Failed to insert init-preload script for ' + srcPath + ':', e.message);
                }

            } catch (e) {
                console.warn('[MANIFEST] Failed to inject asset manifest into ' + srcPath + ':', e.message);
            }

            // Calculate path prefix for subdirectory files
            const fileDir = dirname(file);
            const isSubdirectory = fileDir !== '.' && fileDir !== '';
            // Use root-absolute paths for top-level pages so image URLs resolve correctly
            // whether the page is served as '/page.html' or '/page/' on production
            const pathPrefix = isSubdirectory ? '../' : '/';
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
            const adjustedHowToTemplate = adjustTemplatePaths(howtoTemplate, pathPrefix);

            // Create adjusted component templates for this file's directory level
            const adjustedNewsletterFormFooterTemplate = adjustTemplatePaths(newsletterFormFooterTemplate, pathPrefix);
            const adjustedNewsletterCtaBlogMidTemplate = adjustTemplatePaths(newsletterCtaBlogMidTemplate, pathPrefix);
            const adjustedNewsletterCtaBlogFooterTemplate = adjustTemplatePaths(newsletterCtaBlogFooterTemplate, pathPrefix);

            // Add skip link and empty announcement container after body tag if not already present
            // The container will be populated dynamically by announcements-manager.js based on config
            if (!content.includes('class="skip-link"')) {
                content = content.replace(
                    /<body>/,
                    '<body>\n    <a href="#main-content" class="skip-link">Skip to main content</a>\n    <!-- Announcement Container - Populated dynamically by announcements-manager.js -->\n    <div class="announcement-container"></div>'
                );
            } else {
                // Just add empty announcement container if skip link already exists
                if (!content.includes('announcement-container')) {
                    content = content.replace(
                        /<body>/,
                        '<body>\n    <!-- Announcement Container - Populated dynamically by announcements-manager.js -->\n    <div class="announcement-container"></div>'
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

            // Inject verification meta tags right after <head> tag
            if (content.includes('<head>')) {
                content = content.replace('<head>', `<head>\n    ${verificationTemplate}`);
                console.log(`   ✅ Search Console verification tags injected in ${file}`);
            } else {
                console.warn(`   ⚠️  No <head> tag found in ${file} - verification tags NOT injected!`);
            }

            if (content.includes('</head>')) {
                const headerStyleTag = headerCriticalCss ? `<style>${headerCriticalCss}</style>\n    ` : '';
                content = content.replace('</head>', `    ${headerStyleTag}${themeScriptTemplate}\n</head>`);
                console.log(`   ✅ Theme script (and header critical CSS) injected in ${file}`);
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
            content = content.replace(/<!--#include file="\.\.\/templates\/howto-section\.html" -->/g, adjustedHowToTemplate);
            content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/howto-section\.html" -->/g, adjustedHowToTemplate);
            content = content.replace(/<!--#include file="\.\.\/templates\/partials\/pricing-cards\.html" -->/g, adjustedPricingCardsTemplate);
            content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/partials\/pricing-cards\.html" -->/g, adjustedPricingCardsTemplate);

            // Process community section SSI includes
            const adjustedCommunitySectionTemplate = adjustTemplatePaths(communitySectionTemplate, pathPrefix);
            content = content.replace(/<!--#include file="\.\.\/templates\/community-section\.html" -->/g, adjustedCommunitySectionTemplate);
            content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/community-section\.html" -->/g, adjustedCommunitySectionTemplate);

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

            // If this page has images configured in data/schemas/page-config.json, inject responsive hero image <picture>
            try {
                const pageConfig = JSON.parse(readFileSync(join('data','schemas','page-config.json'),'utf8'));
                const lookup = file; // filename relative path as used in pagesByPath
                const fileName = (file || '').split(/[\\\/]/).pop();
                // Prefer explicit path-based page configs (pagesByPath)
                let config = pageConfig.pagesByPath && pageConfig.pagesByPath[lookup] ? pageConfig.pagesByPath[lookup] : null;
                // Fallback: check top-level pages mapping
                if (!config && pageConfig.pages && pageConfig.pages[fileName.replace('.html','')]) {
                    config = pageConfig.pages[fileName.replace('.html','')];
                }
                // If generic page config lacks images, prefer caseStudies mapping when available
                if (config && (!Array.isArray(config.images) || !config.images.length) && pageConfig.caseStudies && pageConfig.caseStudies[fileName]) {
                    console.log(`   🔁 Fallback: replacing generic page config with caseStudies config for ${file} (images present in caseStudies)`);
                    config = pageConfig.caseStudies[fileName];
                }
                // Fallback: check caseStudies mapping (case studies are stored separately)
                if (!config && pageConfig.caseStudies && pageConfig.caseStudies[fileName]) {
                    config = pageConfig.caseStudies[fileName];
                }
                // Debugging: log whether we found a page config and its images
                if (config) {
                    console.log(`   🧭 Found page config for ${file}: images=${JSON.stringify(config.images || [])}`);
                }
                if (config && Array.isArray(config.images) && config.images.length && content.includes('<div class="hero-visual">')) {
                    const locale = detectLocaleFromPath(join('public', file));
                    const entries = [];
                    for (const imgId of config.images) {
                        const found = imagesManifest.find(i => i.id === imgId);
                        if (found) entries.push(found);
                    }
                    const chosen = entries.length ? entries : findImageManifestEntriesForPage(lookup, locale);
                    if (chosen && chosen.length) {
                        // Use the first suitable hero image entry for visible hero
                        const heroEntry = chosen[0];
                        const pictureHtml = buildPictureMarkup(heroEntry, pathPrefix);

                        // Insert the picture as the first child of hero-visual
                        content = content.replace('<div class="hero-visual">', `<div class="hero-visual">\n    ${pictureHtml}`);

                        // Also add minimal hero image CSS inline to avoid flash of unstyled images (small footprint)
                        const heroCss = `.hero-image{max-width:100%;height:auto;display:block;border-radius:8px;box-shadow:0 6px 20px rgba(5,16,40,0.06);margin:0 auto}`;
                        // Inject into head-critical CSS if not already present
                        if (headerCriticalCss && !headerCriticalCss.includes('.hero-image')) {
                            headerCriticalCss += heroCss;
                        }

                        console.log(`   🖼️ Injected hero image for ${file} from manifest id: ${heroEntry.id}`);
                    }
                }
            } catch (e) {
                console.warn('[IMAGES] Failed to inject hero image for ' + file + ':', e.message);
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
            const announcementsManagerJs = assetManifest['js/announcements-manager.js'] || 'js/announcements-manager.js';

            // Replace CSS link with inline critical CSS and async non-critical CSS
            if (criticalCss) {
                const criticalCssLength = criticalCss.length;
                const maxInlineSize = 50000; // 50KB max for inlining
                
                console.log(`   📊 CSS Size Check: critical=${(criticalCssLength / 1024).toFixed(1)}KB (max=${(maxInlineSize / 1024).toFixed(0)}KB)`);
                
                // Determine which page-specific CSS bundle to load
                let pageBundle = 'common'; // Default to common CSS
                const fileName = file.split(/[\\/]/).pop().replace('.html', '');
                
                // Map file to page bundle (check full path for subdirectories)
                // Use regex to handle both forward slashes (Unix) and backslashes (Windows)
                // NOTE: Order matters - check specific filenames BEFORE generic includes()
                if (file.match(/blog[\\/]/)) {
                    pageBundle = 'blog';
                } else if (file.match(/case-studies[\\/]/)) {
                    pageBundle = 'case-studies';
                } else if (file.match(/community[\\/]/)) {
                    pageBundle = 'community';
                } else if (fileName === 'index') {
                    pageBundle = 'index';
                } else if (fileName === 'cloudflare-framework') {
                    pageBundle = 'cloudflare-framework';
                } else if (fileName === 'clodo-framework-guide') {
                    pageBundle = 'clodo-framework-guide';
                } else if (fileName === 'cloudflare-workers-guide') {
                    pageBundle = 'cloudflare-workers-guide';
                } else if (fileName === 'cloudflare-workers-development-guide') {
                    pageBundle = 'cloudflare-workers-development-guide';
                } else if (fileName === 'cloudflare-top-10-saas-edge-computing-workers-case-study-docs') {
                    pageBundle = 'cloudflare-top-10-saas-edge-computing-workers-case-study-docs';
                } else if (fileName === 'saas-product-startups-cloudflare-case-studies') {
                    pageBundle = 'saas-product-startups-cloudflare-case-studies';
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

                    if (file === 'index.html' || fileName.includes('guide') || fileName === 'cloudflare-framework') {
                        // OPTIMIZATION FOR LCP:
                        // For index.html and guide pages, we separate preload and application to ensure NO render blocking
                        // 1. In Head: Inline Critical CSS + Preload common CSS + Preload page CSS
                        // 2. In Footer: Apply both CSS files
                        
                        // Add asset manifest as global variable for use in deferred CSS loading
                        // CRITICAL: Must include nonce to comply with Content-Security-Policy
                        const manifestScript = `<script nonce="N0Nc3Cl0d0">window.__assetManifest__=${JSON.stringify(assetManifest)};</script>`;
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
                        
                        // Remove the page-specific defer CSS link since it's now loaded synchronously
                        if (pageBundle !== 'common') {
                            // Remove any link tag that contains the pageBundle and has async loading attributes
                            const asyncPattern = new RegExp(`<link[^>]*media="print"[^>]*onload="this.media='all'"[^>]*(?:href="[^"]*${pageBundle}[^"]*"|href="[^"]*css/pages/${pageBundle}[^"]*")[^>]*>|<link[^>]*(?:href="[^"]*${pageBundle}[^"]*"|href="[^"]*css/pages/${pageBundle}[^"]*")[^>]*media="print"[^>]*onload="this.media='all'"[^>]*>`, 'gi');
                            content = content.replace(asyncPattern, '');
                            console.log(`   ✅ Removed defer CSS link for synchronous loading: ${pageBundle}`);
                        }
                        
                    } else {
                        // Standard behavior for other pages (Preload + Onload hack)
                        // Adjust paths for subdirectory files (blog/*, case-studies/*, community/*)
                        const fileDir = dirname(file);
                        const isSubdirectory = fileDir !== '.' && fileDir !== '';
                        const _pathPrefix = isSubdirectory ? '../' : '';
                        console.log(`   📁 Processing ${file}: isSubdirectory=${isSubdirectory}, pathPrefix='${_pathPrefix}'`);
                        
                        const commonCss = `<link rel="stylesheet" href="/${commonCssFile}">`;
                        const pageCss = pageBundle !== 'common' ? `\n    <link rel="stylesheet" href="/${cssFile}">` : '';
                        const cssLinks = commonCss + pageCss;
                        
                        if ((content.includes('href="styles.css"') || content.includes('href="../styles.css"')) && content.match(cssLinkPatternMultiple)) {
                            content = content.replace(
                                cssLinkPatternMultiple,
                                criticalCssInline + '\n    ' + cssLinks + '\n    '
                            );
                        } else if (content.includes('href="styles.css"') || content.includes('href="../styles.css"')) {
                            content = content.replace(
                                cssLinkPatternSingle,
                                criticalCssInline + '\n    ' + cssLinks
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
                    
                    const commonCss = `<link rel="stylesheet" href="/${commonCssFile}">`;
                    const pageCss = pageBundle !== 'common' ? `\n    <link rel="stylesheet" href="/${cssFile}">` : '';
                    const cssLinks = commonCss + pageCss;
                    
                    const cssLinkPatternMultiple = /<link[^>]*href="(?:\.\.\/)?styles\.css"[^>]*>[\s\n]*<link[^>]*href="(?:\.\.\/)?styles\.css"[^>]*>[\s\n]*(?:<noscript><link[^>]*href="(?:\.\.\/)?styles\.css"[^>]*><\/noscript>[\s\n]*)?/g;
                    const cssLinkPatternSingle = /<link[^>]*rel="stylesheet"[^>]*href="(?:\.\.\/)?styles\.css"[^>]*>/g;
                    
                    // Try multiple pattern first, then single if no match
                    if ((content.includes('href="styles.css"') || content.includes('href="../styles.css"')) && content.match(cssLinkPatternMultiple)) {
                        content = content.replace(
                            cssLinkPatternMultiple,
                            cssLinks + '\n    '
                        );
                    } else if (content.includes('href="styles.css"') || content.includes('href="../styles.css"')) {
                        content = content.replace(
                            cssLinkPatternSingle,
                            cssLinks
                        );
                    } else if (pageBundle !== 'common') {
                        // Fallback: if styles.css link wasn't found but this is a page-specific bundle,
                        // inject the page CSS into the footer before </body>
                        const commonCss = `<link rel="stylesheet" href="/${commonCssFile}">`;
                        const pageCss = `\n    <link rel="stylesheet" href="/${cssFile}">`;
                        const fallbackCssLink = commonCss + pageCss;
                        content = content.replace('</body>', `    ${fallbackCssLink}\n</body>`);
                        console.log(`   ℹ️  Injected page-specific CSS (${cssFile}) via fallback method`);
                    }
                }
            }

            // Normalize any remaining relative references to styles.css to the hashed asset to avoid 404s
            try {
                const hashedCommon = assetManifest['styles.css'] || 'styles.css';
                if (content.includes('href="styles.css"') || content.includes('href="../styles.css"')) {
                    content = content.replace(/href="(?:\.\.\/)?styles\.css"/g, `href="/${hashedCommon}"`);
                    console.log(`   ✅ Normalized remaining styles.css references to /${hashedCommon}`);
                }
            } catch (e) {
                console.warn(`   ⚠️  Failed to normalize styles.css references: ${e && e.message ? e.message : e}`);
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
                    'ui/index.js',
                    'pages/cloudflare-workers-guide.js',
                    'pages/cloudflare-framework.js'
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
                    { name: 'announcements-manager.js', variable: announcementsManagerJs },
                    { name: 'main.js', variable: mainJs },
                    { name: 'analytics.js', variable: analyticsJs },
                    { name: 'defer-css.js', variable: deferCssJs },
                    { name: 'config/features.js', variable: configFeaturesJs },
                    { name: 'ui/navigation-component.js', variable: navigationJs },
                    { name: 'pages/cloudflare-workers-guide.js', variable: assetManifest['js/pages/cloudflare-workers-guide.js'] || 'js/pages/cloudflare-workers-guide.js' },
                    { name: 'pages/cloudflare-framework.js', variable: assetManifest['js/pages/cloudflare-framework.js'] || 'js/pages/cloudflare-framework.js' },
                    { name: 'pages/workers-boilerplate.js', variable: assetManifest['js/workers-boilerplate.js'] || assetManifest['js/pages/workers-boilerplate.js'] || 'js/pages/workers-boilerplate.js' }
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

            // Replace page-specific CSS href paths with hashed versions from asset manifest
            try {
                // Handle page-specific CSS files that use the defer loading pattern
                const pageCssReplacements = [
                    { name: 'css/pages/cloudflare-workers-development-guide.css', manifestKey: 'styles-cloudflare-workers-development-guide.css' },
                    { name: 'css/pages/cloudflare-workers-guide.css', manifestKey: 'styles-cloudflare-workers-guide.css' },
                    { name: 'css/pages/clodo-framework-guide.css', manifestKey: 'styles-clodo-framework-guide.css' },
                    { name: 'css/pages/cloudflare-framework.css', manifestKey: 'styles-cloudflare-framework.css' },
                    { name: 'css/pages/index.css', manifestKey: 'styles-index.css' },
                    { name: 'css/pages/pricing.css', manifestKey: 'styles-pricing.css' },
                    { name: 'css/pages/product.css', manifestKey: 'styles-product.css' },
                    { name: 'css/pages/about.css', manifestKey: 'styles-about.css' },
                    { name: 'css/pages/migrate.css', manifestKey: 'styles-migrate.css' },
                    { name: 'css/pages/case-studies.css', manifestKey: 'styles-case-studies.css' },
                    { name: 'css/pages/community.css', manifestKey: 'styles-community.css' },
                    { name: 'css/pages/workers-boilerplate.css', manifestKey: 'styles-workers-boilerplate.css' },
                    { name: 'css/pages/saas-product-startups-cloudflare-case-studies.css', manifestKey: 'styles-saas-product-startups-cloudflare-case-studies.css' },
                    { name: 'css/pages/cloudflare-top-10-saas-edge-computing-workers-case-study-docs.css', manifestKey: 'styles-cloudflare-top-10-saas-edge-computing-workers-case-study-docs.css' }
                ];

                pageCssReplacements.forEach(({ name, manifestKey }) => {
                    const hashedFile = assetManifest[manifestKey] || name;
                    // Match CSS link tags with defer loading pattern (media="print" onload="this.media='all'")
                    const escapedName = name.replace(/\//g, '\\/');
                    const regex = new RegExp(`(<link[^>]*href=["'])(${escapedName})(["'][^>]*media=["']print["'][^>]*onload=["']this\\.media=['"]all['"]["'][^>]*>)`, 'g');
                    if (regex.test(content)) {
                        content = content.replace(regex, `$1/${hashedFile}$3`);
                        console.log(`   ✅ Replaced page CSS: ${name} → /${hashedFile}`);
                    }
                });

                // Fallback: replace any css/pages/<pageName>.css links with hashed assets when possible
                // This covers any page bundles we might have missed in the explicit mapping above
                try {
                    Object.keys(assetManifest).forEach((key) => {
                        if (!key.startsWith('styles-')) return;
                        const pageName = key.replace(/^styles-/, '').replace(/\.css$/, '');
                        const pageHref = `css/pages/${pageName}.css`;
                        const hashed = assetManifest[key];
                        const fallbackRegex = new RegExp(`(<link[^>]*href=["'])(?:\\.?\\/)?${pageHref}(["'][^>]*>)`, 'g');
                        if (fallbackRegex.test(content)) {
                            content = content.replace(fallbackRegex, `$1/${hashed}$2`);
                            console.log(`   ✅ Fallback replaced ${pageHref} → /${hashed}`);
                        }
                    });
                } catch (e) {
                    console.warn(`   ⚠️  Page CSS fallback replacement failed: ${e.message}`);
                }
            } catch (e) {
                // Non-fatal - leave CSS as-is if replacement fails
                console.warn(`⚠️  Page CSS href replacement failed: ${e.message}`);
            }

            // Remove redundant security meta tags (already set via HTTP headers in _headers file)
            content = content.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/g, '');
            content = content.replace(/<meta http-equiv="X-Frame-Options"[^>]*>/g, '');
            content = content.replace(/<meta http-equiv="X-Content-Type-Options"[^>]*>/g, '');
            content = content.replace(/<meta http-equiv="Referrer-Policy"[^>]*>/g, '');
            
            // All security headers are now set via HTTP headers in _headers file (correct approach)

            // Inject generated schemas (data-driven schema system)
            content = injectSchemasIntoHTML(file, content);

                    // Fallback: if no schema script tags were injected, add default Organization/WebSite/SoftwareApplication
                    if (!(/<script[^>]*type\s*=\s*["']?application\/ld\+json["']?/i.test(content))) {
                        const defaultSchemas = [
                            generateOrganizationSchema(),
                            generateWebSiteSchema(),
                            generateSoftwareApplicationSchema()
                        ];
                        const scripts = defaultSchemas.map(s => wrapSchemaTag(s)).join('\n    ');
                        if (content.includes('</head>')) {
                            content = content.replace('</head>', `    ${scripts}\n</head>`);
                            console.log(`   ℹ️  Fallback: injected default schemas into ${file}`);
                        } else {
                            content = content + `\n${scripts}`;
                            console.log(`   ℹ️  Fallback: appended default schemas to ${file} (no </head> found)`);
                        }
                    }

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

            writeFileSync(destPath, content, 'utf8');
        }
    });
}

// Copy HTML files that don't use SSI includes (standalone HTML pages)
function copyStandaloneHtml() {
    console.log('[COPY] Copying standalone HTML files with navigation injection...');
    
    // Load navigation templates for static files
    const footerTemplate = readFileSync(join('nav-system', 'templates', 'footer.html'), 'utf8');
    const navMainTemplate = readFileSync(join('nav-system', 'templates', 'nav-main.html'), 'utf8');
    
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
                // Directory blacklist for copying standalone HTML files. Removed 'demo' so demo HTML pages are processed and receive schema injection.
                const skipDirs = ['node_modules', 'css', 'js', 'icons', 'images', 'assets', 'fonts', 'vendor'];
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
                
                let content = readFileSync(fullEntryPath, 'utf8');

                // Only copy HTML files that DON'T use SSI includes (these are standalone pages)
                if (!content.includes('<!--#include file="')) {
                    // Skip Google verification file and other special files that shouldn't have navigation
                    const skipNavFiles = ['google1234567890abcdef.html', 'robots.txt', 'sitemap.xml', 'site.webmanifest', '_redirects', '_headers', 'favicon.svg', 'favicon.ico'];
                    const shouldInjectNav = !skipNavFiles.includes(entry);
                    const hasNavbar = content.includes('class="navbar"') || content.includes('class="nav-main"');
                    const hasFooter = content.includes('<footer');
                    
                    // Inject navigation for static HTML files
                    if (shouldInjectNav && content.includes('<body')) {
                        // ALWAYS replace the navbar (remove old one if it exists, inject fresh template)
                        if (hasNavbar) {
                            // Remove old navbar (both navbar and nav-main formats)
                            content = content.replace(/<nav[^>]*class="(navbar|nav-main)"[^>]*>[\s\S]*?<\/nav>/i, '');
                        }
                        
                        // Inject fresh navbar after <body> tag
                        content = content.replace(/<body([^>]*)>/, (match) => {
                            return match + '\n    ' + navMainTemplate;
                        });
                        
                        // Only inject footer if it doesn't already exist
                        if (!hasFooter) {
                            // Inject footer before </body> tag
                            content = content.replace(/<\/body>/i, footerTemplate + '\n</body>');
                        }
                    }
                    
                    const filePath = relativePath ? join(relativePath, entry) : entry;
                    const pathPrefix = relativePath ? '../' : '/';
                    
                    // Attempt to inject responsive hero image for standalone pages when configured
                    try {
                        const pageConfig = JSON.parse(readFileSync(join('data','schemas','page-config.json'),'utf8'));
                        if (entry === 'saas-product-startups-cloudflare-case-studies.html') console.log('   🔎 Processing standalone case-study page for hero injection');
                        const fileName = entry; // filename within this directory
                        let config = pageConfig.pagesByPath && pageConfig.pagesByPath[fileName] ? pageConfig.pagesByPath[fileName] : null;
                        if (!config && pageConfig.pages && pageConfig.pages[fileName.replace('.html','')]) {
                            config = pageConfig.pages[fileName.replace('.html','')];
                        }
                        // If the generic page config lacks image info, prefer the caseStudies mapping when available
                        if (config && (!Array.isArray(config.images) || !config.images.length) && pageConfig.caseStudies && pageConfig.caseStudies[fileName]) {
                            console.log(`   🔁 Fallback: replacing generic page config with caseStudies config for ${fileName} (images present in caseStudies)`);
                            config = pageConfig.caseStudies[fileName];
                        }
                        if (!config && pageConfig.caseStudies && pageConfig.caseStudies[fileName]) {
                            config = pageConfig.caseStudies[fileName];
                        }

                        if (config && Array.isArray(config.images) && config.images.length && content.includes('<div class="hero-visual">')) {
                            const imagesManifest = JSON.parse(readFileSync(join('data','images','seo','images.json'),'utf8'));
                            const entries = [];
                            for (const imgId of config.images) {
                                const found = imagesManifest.find(i => i.id === imgId);
                                if (found) entries.push(found);
                            }
                            const chosen = entries.length ? entries : imagesManifest.filter(img => Array.isArray(img.pages) && img.pages.includes(fileName));
                            if (chosen && chosen.length) {
                                const heroEntry = chosen[0];
                                const pathPrefix = '';
                                const pictureHtml = buildPictureMarkup(heroEntry, pathPrefix);
                                content = content.replace('<div class="hero-visual">', `<div class="hero-visual">\n    ${pictureHtml}`);
                                console.log(`   🖼️ Injected hero image (standalone) for ${filePath} from manifest id: ${heroEntry.id}`);
                            }
                        }
                    } catch (e) {
                        console.warn('[IMAGES] Failed to inject hero image for standalone ' + entry + ':', e.message);
                    }

                    // Inject generated schemas (data-driven schema system)
                    content = injectSchemasIntoHTML(filePath, content);

                    // Fallback: if no schema script tags were injected, add default Organization/WebSite/SoftwareApplication
                    if (!(/<script[^>]*type\s*=\s*["']?application\/ld\+json["']?/i.test(content))) {
                        const defaultSchemas = [
                            generateOrganizationSchema(),
                            generateWebSiteSchema(),
                            generateSoftwareApplicationSchema()
                        ];
                        const scripts = defaultSchemas.map(s => wrapSchemaTag(s)).join('\n    ');
                        if (content.includes('</head>')) {
                            content = content.replace('</head>', `    ${scripts}\n</head>`);
                            console.log(`   ℹ️  Fallback: injected default schemas into ${filePath}`);
                        } else {
                            content = content + `\n${scripts}`;
                            console.log(`   ℹ️  Fallback: appended default schemas to ${filePath} (no </head> found)`);
                        }
                    }

                    const destPath = join('dist', filePath);
                    
                    // Ensure destination directory exists
                    const destDir = dirname(destPath);
                    if (!existsSync(destDir)) {
                        mkdirSync(destDir, { recursive: true });
                    }
                    
                    writeFileSync(destPath, content, 'utf8');
                    const navStatus = hasNavbar ? '✅ replaced navbar' : '✅ injected navbar';
                    console.log(`   📋 Copied standalone HTML: ${filePath} (${navStatus})`);
                }
            }
        }
    }

    copyHtmlFiles('');
}

// Bundle CSS into critical and non-critical bundles for performance
function bundleCss() {
    console.log('[CSS] Bundling CSS...');

    // Asset manifest for content-hashed filenames
    const assetManifest = {};

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
        'css/global/footer.css',  // Footer styling (loaded with common CSS - below-the-fold)
        'css/global/community-section.css'  // Community section (appears on multiple pages)
    ];

    // Page-specific CSS bundles (reduces unused CSS by 60%+)
    const pageBundles = {
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
        ],
        'workers-boilerplate': [
            'css/pages/workers-boilerplate.css'
        ],
        'clodo-framework-guide': [
            'css/pages/clodo-framework-guide.css'
        ],
        'cloudflare-workers-guide': [
            'css/components-hero-shared.css',
            'css/components-animations-shared.css',
            'css/components-shared-utilities.css',
            'css/pages/cloudflare-workers-guide.css'
        ],
        'cloudflare-workers-development-guide': [
            'css/components-hero-shared.css',
            'css/components-animations-shared.css',
            'css/components-shared-utilities.css',
            'css/pages/cloudflare-workers-development-guide.css'
        ],
        'cloudflare-top-10-saas-edge-computing-workers-case-study-docs': [
            'css/components-hero-shared.css',
            'css/components-animations-shared.css',
            'css/components-shared-utilities.css',
            'css/pages/cloudflare-top-10-saas-edge-computing-workers-case-study-docs.css'
        ],
        'saas-product-startups-cloudflare-case-studies': [
            'css/components-hero-shared.css',
            'css/components-animations-shared.css',
            'css/components-shared-utilities.css',
            'css/pages/saas-product-startups-cloudflare-case-studies.css'
        ],
        'cloudflare-framework': [
            'css/pages/cloudflare-framework.css'
        ]
    };

    // Deferred CSS bundles - loaded after initial page render
    const deferredBundles = {
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
        writeFileSync(join('dist', pageFileName), minifiedPage, 'utf8');
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
        writeFileSync(join('dist', deferredFileName), minifiedDeferred, 'utf8');
        assetManifest[`styles-${bundleName}.css`] = deferredFileName;
        console.log(`   📦 ${bundleName} CSS (deferred): ${minifiedDeferred.length} bytes -> ${deferredFileName}`);
    });

    // Minify and write critical CSS
    const minifiedCritical = minifyCss(criticalBundled);
    writeFileSync(join('dist', 'critical.css'), minifiedCritical, 'utf8');
    console.log(`📦 Critical CSS: ${minifiedCritical.length} bytes`);

    // Minify and write common CSS (shared bundle) with content hash
    const minifiedCommon = minifyCss(commonBundled);
    const commonHash = crypto.createHash('sha256').update(minifiedCommon).digest('hex').slice(0,8);
    const commonFileName = `styles.${commonHash}.css`;
    writeFileSync(join('dist', commonFileName), minifiedCommon, 'utf8');
    assetManifest['styles.css'] = commonFileName;
    console.log(`📦 Common CSS: ${minifiedCommon.length} bytes -> ${commonFileName}`);

    // Return asset manifest (will be merged with JS manifest and written later)
    return assetManifest;
}

function minifyCss() {
    console.log('[CSS] Minifying individual CSS...');
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

        writeFileSync(join(distCssDir, file), minified, 'utf8');
    });
}

import { minifyJs } from './utils/minify.js';

// Copy JavaScript with minification
function copyJs() {
    console.log('[JS] Copying and Minifying JavaScript...');
    
    // Copy main script.js
    const jsFile = join('public', 'script.js');
    const distJsFile = join('dist', 'script.js');

    if (existsSync(jsFile)) {
        const content = readFileSync(jsFile, 'utf8');
        const minified = minifyJs(content);
        writeFileSync(distJsFile, minified, 'utf8');
        console.log(`  ✓ Minified script.js (${(content.length/1024).toFixed(1)}KB -> ${(minified.length/1024).toFixed(1)}KB)`);
    }
    
    // Copy js/ module directory with content hashing
    const jsDir = join('public', 'js');
    const distJsDir = join('dist', 'js');
    const jsManifest = {}; // Track JS file hashes
    
    if (existsSync(jsDir)) {
        console.log('[JS] Copying JS modules with hashing...');
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
                    writeFileSync(hashDestPath, minified, 'utf8');
                    
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
    console.log('[CONFIG] Copying JavaScript config files...');
    
    // Note: Newsletter subscription now handled server-side via Cloudflare Functions
    // No client-side Brevo configuration needed
    console.log('  ℹ️  Newsletter uses server-side API (Cloudflare Functions)');
}

// Copy other assets
function copyAssets() {
    console.log('[ASSETS] Copying assets...');
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

    // Copy images directory if present
    const imagesSrc = join('public', 'images');
    const imagesDest = join('dist', 'images');
    if (existsSync(imagesSrc)) {
        mkdirSync(imagesDest, { recursive: true });
        for (const entry of readdirSync(imagesSrc)) {
            const srcPath = join(imagesSrc, entry);
            const destPath = join(imagesDest, entry);
            const stat = statSync(srcPath);
            if (stat.isDirectory()) {
                mkdirSync(destPath, { recursive: true });
                for (const sub of readdirSync(srcPath)) {
                    const subSrc = join(srcPath, sub);
                    const subDest = join(destPath, sub);
                    const subStat = statSync(subSrc);
                    if (subStat.isDirectory()) {
                        // Create nested directory and copy its files (one level deep)
                        mkdirSync(subDest, { recursive: true });
                        for (const nested of readdirSync(subSrc)) {
                            const nestedSrc = join(subSrc, nested);
                            const nestedDest = join(subDest, nested);
                            // Only copy files to avoid attempting to copy further directories
                            if (statSync(nestedSrc).isDirectory()) {
                                // If deeper nesting exists, copy recursively
                                const copyRecursive = (s, d) => {
                                    mkdirSync(d, { recursive: true });
                                    for (const f of readdirSync(s)) {
                                        const sPath = join(s, f);
                                        const dPath = join(d, f);
                                        if (statSync(sPath).isDirectory()) {
                                            copyRecursive(sPath, dPath);
                                        } else {
                                            copyFileSync(sPath, dPath);
                                        }
                                    }
                                };
                                copyRecursive(nestedSrc, nestedDest);
                            } else {
                                copyFileSync(nestedSrc, nestedDest);
                            }
                        }
                    } else {
                        copyFileSync(subSrc, subDest);
                    }
                }
            } else {
                copyFileSync(srcPath, destPath);
            }
        }
        console.log('[ASSETS] Copied images/ to dist/images/');
    }

    // Copy downloads directory (contains validator-scripts.zip) if present at repo root
    // Only copy directories and .zip files to avoid accidentally including secrets (e.g., .json)
    const downloadsSrc = join('downloads');
    const downloadsDest = join('dist', 'downloads');
    if (existsSync(downloadsSrc)) {
        mkdirSync(downloadsDest, { recursive: true });
        for (const entry of readdirSync(downloadsSrc)) {
            const srcPath = join(downloadsSrc, entry);
            const destPath = join(downloadsDest, entry);
            const stat = statSync(srcPath);
            if (stat.isDirectory()) {
                mkdirSync(destPath, { recursive: true });
                for (const sub of readdirSync(srcPath)) {
                    copyFileSync(join(srcPath, sub), join(destPath, sub));
                }
            } else if (entry.endsWith('.zip')) {
                // Whitelisted file type
                copyFileSync(srcPath, destPath);
            } else {
                console.log(`[ASSETS] Skipped downloads/${entry} (not allowed by whitelist)`);
            }
        }
        console.log('[ASSETS] Copied downloads/ to dist/downloads/ (whitelisted files only)');
    }

    // Copy config JSON files (announcements.json, etc.)
    const configSrc = join('config');
    const configDest = join('dist', 'config');
    if (existsSync(configSrc)) {
        mkdirSync(configDest, { recursive: true });
        for (const entry of readdirSync(configSrc)) {
            // Only copy JSON files, skip subdirectories
            if (entry.endsWith('.json')) {
                const srcPath = join(configSrc, entry);
                const destPath = join(configDest, entry);
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
        JSON.stringify(buildInfo, null, 2),
        'utf8'
    );
}

// Main build process
try {
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
        JSON.stringify(assetManifest, null, 2),
        'utf8'
    );
    console.log('[MANIFEST] Asset manifest written with', Object.keys(assetManifest).length, 'entries');
    
    copyStandaloneHtml();
    minifyCss();
    copyJsConfigs();
    copyAssets();
    generateBuildInfo();

    // Fix canonical URLs in dist
    console.log('[CANONICAL] Fixing canonical URLs to https://www.clodo.dev...');
    fixCanonicalUrls('dist', 'https://www.clodo.dev');
    console.log('[CANONICAL] Canonical URLs fixed');

    // Copy Cloudflare Functions to dist for Pages Functions deployment
    console.log('[FUNCTIONS] Copying Cloudflare Functions for deployment...');
    const functionsSource = join(__dirname, '..', 'functions');
    const functionsDestination = join(__dirname, '..', 'dist', 'functions');
    
    // Remove existing functions folder if it exists
    if (existsSync(functionsDestination)) {
        rmSync(functionsDestination, { recursive: true, force: true });
    }
    
    // Copy functions directory
    mkdirSync(functionsDestination, { recursive: true });
    const copyFunctionsRecursive = (src, dest) => {
        const files = readdirSync(src);
        files.forEach(file => {
            const srcFile = join(src, file);
            const destFile = join(dest, file);
            if (statSync(srcFile).isDirectory()) {
                mkdirSync(destFile, { recursive: true });
                copyFunctionsRecursive(srcFile, destFile);
            } else {
                copyFileSync(srcFile, destFile);
            }
        });
    };
    copyFunctionsRecursive(functionsSource, functionsDestination);
    console.log('  ✅ Functions copied to dist/functions/');

    // Run link health check
    console.log('[CHECK] Running link health check...');

    // Post-build verification: ensure pages with configured images have OG + ImageObject JSON-LD + visible <picture>
    function verifySeoImageInjection() {
        try {
            const pageConfig = JSON.parse(readFileSync(join('data','schemas','page-config.json'),'utf8'));
            // images manifest used for reference; not strictly required for verification but useful for context
            const imagesManifest = existsSync(join('data','images','seo','images.json')) ? JSON.parse(readFileSync(join('data','images','seo','images.json'),'utf8')) : [];
            const failures = [];
            const pagesToCheck = new Set();

            if (pageConfig.pagesByPath) Object.keys(pageConfig.pagesByPath).forEach(p => pagesToCheck.add(p));
            if (pageConfig.pages) Object.keys(pageConfig.pages).forEach(name => pagesToCheck.add(`${name}.html`));
            if (pageConfig.caseStudies) Object.keys(pageConfig.caseStudies).forEach(name => pagesToCheck.add(`${name}.html`));

            pagesToCheck.forEach(page => {
                const distPath = join('dist', page);
                if (!existsSync(distPath)) return; // Skip pages that weren't generated
                const content = readFileSync(distPath, 'utf8');

                // Resolve config similarly to build injection logic
                let config = pageConfig.pagesByPath && pageConfig.pagesByPath[page] ? pageConfig.pagesByPath[page] : null;
                const fileName = (page || '').split(/[\\\/]/).pop();
                if (!config && pageConfig.pages && pageConfig.pages[fileName.replace('.html','')]) config = pageConfig.pages[fileName.replace('.html','')];
                if (config && (!Array.isArray(config.images) || !config.images.length) && pageConfig.caseStudies && pageConfig.caseStudies[fileName]) config = pageConfig.caseStudies[fileName];
                if (!config && pageConfig.caseStudies && pageConfig.caseStudies[fileName]) config = pageConfig.caseStudies[fileName];

                if (config && Array.isArray(config.images) && config.images.length) {
                    const missing = [];
                    if (!content.includes('<picture class="hero-image"')) missing.push('picture');
                    if (!content.includes('"@type":"ImageObject"') && !content.includes('"@type": "ImageObject"')) missing.push('ImageObject JSON-LD');
                    if (!content.includes('property="og:image"') && !content.includes("property='og:image'")) missing.push('og:image meta');
                    if (missing.length) failures.push({page, missing});
                }
            });

            if (failures.length) {
                console.error('[VERIFY] SEO image verification failed for the following pages:');
                failures.forEach(f => console.error(`   - ${f.page}: missing ${f.missing.join(', ')}`));
                throw new Error('SEO image verification failed');
            }

            console.log('[VERIFY] All pages with configured images contain hero <picture>, ImageObject JSON-LD, and og:image meta. ✅');
        } catch (e) {
            console.error('[VERIFY] Verification failed:', e.message);
            throw e;
        }
    }

    import('./check-links.js').then(({ checkLinks }) => {
        return Promise.resolve(checkLinks()).then(() => {
            // Run verification after link check completes
            verifySeoImageInjection();
            console.log('[SUCCESS] Build completed successfully!');
            console.log('[OUTPUT] Output directory: ./dist');
            console.log('[READY] Ready for deployment');
        });
    }).catch(error => {
        console.error('❌ Link check failed:', error.message);
        process.exit(1);
    });

} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}