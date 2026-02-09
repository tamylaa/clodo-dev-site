/**
 * HTML processing step.
 *
 * processTemplatedHtml(assetManifest)  – processes SSI-include HTML files
 * processStandaloneHtml()              – processes standalone HTML files
 *
 * Both inject navigation, schemas, hero images, and write to dist/.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { injectSchemasIntoHTML } from '../../schema/build-integration.js';
import { generateOrganizationSchema, generateWebSiteSchema, generateSoftwareApplicationSchema, wrapSchemaTag } from '../../schema/schema-generator.js';
import { detectLocaleFromPath } from '../../schema/locale-utils.js';
import { loadImagesManifest, findImageEntriesForPage, buildPictureMarkup, injectMediaSlots } from '../utils/image-helpers.js';
import { adjustTemplatePaths } from '../utils/fs-helpers.js';
import { loadPageConfig, resolvePageConfig, resolvePageCssBundle, PAGE_CSS_REPLACEMENTS } from '../utils/page-config.js';

// ── Template loading ────────────────────────────────────────────────

function loadTemplates() {
    return {
        header:                    readFileSync(join('templates', 'header.html'), 'utf8'),
        footer:                    readFileSync(join('nav-system', 'templates', 'footer.html'), 'utf8'),
        navMain:                   readFileSync(join('nav-system', 'templates', 'nav-main.html'), 'utf8'),
        verification:              readFileSync(join('templates', 'verification.html'), 'utf8'),
        hero:                      readFileSync(join('templates', 'hero.html'), 'utf8'),
        heroPricing:               readFileSync(join('templates', 'hero-pricing.html'), 'utf8'),
        heroMinimal:               readFileSync(join('templates', 'hero-minimal.html'), 'utf8'),
        toc:                       readFileSync(join('templates', 'table-of-contents.html'), 'utf8'),
        tocFaq:                    readFileSync(join('templates', 'table-of-contents-faq.html'), 'utf8'),
        relatedContent:            readFileSync(join('templates', 'related-content.html'), 'utf8'),
        relatedContentFaq:         readFileSync(join('templates', 'related-content-faq.html'), 'utf8'),
        relatedContentComparison:  readFileSync(join('templates', 'related-content-comparison.html'), 'utf8'),
        relatedContentWorkers:     readFileSync(join('templates', 'related-content-workers.html'), 'utf8'),
        howto:                     readFileSync(join('templates', 'howto-section.html'), 'utf8'),
        themeScript:               readFileSync(join('templates', 'theme-script.html'), 'utf8'),
        communitySection:          readFileSync(join('nav-system', 'templates', 'community-section.html'), 'utf8'),
        newsletterFormFooter:      readFileSync(join('templates', 'components', 'newsletter-form-footer.html'), 'utf8'),
        newsletterCtaBlogMid:      readFileSync(join('templates', 'components', 'newsletter-cta-blog-mid.html'), 'utf8'),
        newsletterCtaBlogFooter:   readFileSync(join('templates', 'components', 'newsletter-cta-blog-footer.html'), 'utf8'),
        pricingCards:              readFileSync(join('templates', 'partials', 'pricing-cards.html'), 'utf8'),
    };
}

// ── Data-driven SSI include replacement ─────────────────────────────
// Maps template keys → their SSI file paths.  The replacer generates
// regexes that match both ../ and ../../ prefixes.

const SSI_TEMPLATE_MAP = {
    navMain:                   'templates/nav-main.html',
    footer:                    'templates/footer.html',
    header:                    'templates/header.html',
    hero:                      'templates/hero.html',
    toc:                       'templates/table-of-contents.html',
    tocFaq:                    'templates/table-of-contents-faq.html',
    relatedContent:            'templates/related-content.html',
    relatedContentFaq:         'templates/related-content-faq.html',
    relatedContentComparison:  'templates/related-content-comparison.html',
    relatedContentWorkers:     'templates/related-content-workers.html',
    howto:                     'templates/howto-section.html',
    pricingCards:              'templates/partials/pricing-cards.html',
    communitySection:          'templates/community-section.html',
};

const SSI_COMPONENT_MAP = {
    newsletterFormFooter:    'components/newsletter-form-footer.html',
    newsletterCtaBlogMid:    'components/newsletter-cta-blog-mid.html',
    newsletterCtaBlogFooter: 'components/newsletter-cta-blog-footer.html',
};

function replaceSSIIncludes(content, adjusted) {
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Template includes: <!--#include file="../<path>" --> or <!--#include file="../../<path>" -->
    for (const [key, path] of Object.entries(SSI_TEMPLATE_MAP)) {
        content = content.replace(
            new RegExp(`<!--#include file="\\.\\./(?:\\.\\./)?${esc(path)}" -->`, 'g'),
            adjusted[key],
        );
    }

    // Component includes: optional ../ or ../../ prefix
    for (const [key, path] of Object.entries(SSI_COMPONENT_MAP)) {
        content = content.replace(
            new RegExp(`<!--#include file="(?:\\.\\./(?:\\.\\./)?)?${esc(path)}" -->`, 'g'),
            adjusted[key],
        );
    }

    return content;
}

// ── Shared helpers ──────────────────────────────────────────────────

/** Inject default Organization / WebSite / SoftwareApplication schemas when none exist */
function injectDefaultSchemas(content, filePath) {
    if (/<script[^>]*type\s*=\s*["']?application\/ld\+json["']?/i.test(content)) return content;

    const scripts = [
        generateOrganizationSchema(),
        generateWebSiteSchema(),
        generateSoftwareApplicationSchema(),
    ].map(s => wrapSchemaTag(s)).join('\n    ');

    if (content.includes('</head>')) {
        content = content.replace('</head>', `    ${scripts}\n</head>`);
        console.log(`   ℹ️  Fallback: injected default schemas into ${filePath}`);
    } else {
        content += `\n${scripts}`;
        console.log(`   ℹ️  Fallback: appended default schemas to ${filePath} (no </head> found)`);
    }
    return content;
}

/** Attempt to inject a responsive hero <picture> into the hero-visual container */
function injectHeroImage(content, file, fileName, pathPrefix, pageConfig, imagesManifest) {
    try {
        const config = resolvePageConfig(pageConfig, file, fileName);
        if (config) console.log(`   🧭 Found page config for ${file}: images=${JSON.stringify(config.images || [])}`);

        if (config && Array.isArray(config.images) && config.images.length && content.includes('<div class="hero-visual">')) {
            const locale = detectLocaleFromPath(join('public', file));
            const entries = [];
            for (const imgId of config.images) {
                const found = imagesManifest.find(i => i.id === imgId);
                if (found) entries.push(found);
            }
            const chosen = entries.length ? entries : findImageEntriesForPage(imagesManifest, file, locale);
            // Pick the hero-role entry, or fall back to the first entry
            const heroEntry = chosen.find(e => e.role === 'hero') || chosen[0];
            if (heroEntry) {
                const pictureHtml = buildPictureMarkup(heroEntry, pathPrefix, { cssClass: 'hero-image', loading: 'eager' });
                content = content.replace('<div class="hero-visual">', `<div class="hero-visual">\n    ${pictureHtml}`);
                console.log(`   🖼️ Injected hero image for ${file} from manifest id: ${heroEntry.id}`);
            }
        }
    } catch (e) {
        console.warn('[IMAGES] Failed to inject hero image for ' + file + ':', e.message);
    }
    return content;
}

/** Replace script src attributes with content-hashed versions from the asset manifest */
function hashScriptPaths(content, assetManifest) {
    try {
        const replacements = [
            { name: 'init-systems.js',                    key: 'js/init-systems.js' },
            { name: 'announcements-manager.js',           key: 'js/announcements-manager.js' },
            { name: 'main.js',                            key: 'js/main.js' },
            { name: 'analytics.js',                       key: 'js/analytics.js' },
            { name: 'defer-css.js',                       key: 'js/defer-css.js' },
            { name: 'config/features.js',                 key: 'js/config/features.js' },
            { name: 'ui/navigation-component.js',         key: 'js/ui/navigation-component.js' },
            { name: 'pages/cloudflare-workers-guide.js',  key: 'js/pages/cloudflare-workers-guide.js' },
            { name: 'pages/cloudflare-framework.js',      key: 'js/pages/cloudflare-framework.js' },
            { name: 'pages/workers-boilerplate.js',       key: 'js/workers-boilerplate.js',
              fallbackKey: 'js/pages/workers-boilerplate.js' },
        ];

        replacements.forEach(({ name, key, fallbackKey }) => {
            const hashed = assetManifest[key] || (fallbackKey && assetManifest[fallbackKey]) || key;
            const escapedName = name.replace(/\//g, '\\/');
            const regex = new RegExp(`(<script[^>]*src=["'])(?:\\.|\\/|)js\\/${escapedName}(["'][^>]*>)`, 'g');
            content = content.replace(regex, `$1/${hashed}$2`);
        });
    } catch (e) {
        console.warn(`⚠️  Script src replacement failed: ${e.message}`);
    }
    return content;
}

/** Replace page-specific CSS href attributes with hashed versions */
function hashCssHrefs(content, assetManifest) {
    try {
        // Explicit page CSS replacements (defer loading pattern)
        PAGE_CSS_REPLACEMENTS.forEach(({ href, manifestKey }) => {
            const hashedFile = assetManifest[manifestKey] || href;
            const escapedName = href.replace(/\//g, '\\/');
            const regex = new RegExp(
                `(<link[^>]*href=["'])(${escapedName})(["'][^>]*media=["']print["'][^>]*onload=["']this\\.media=['"]all['"]["'][^>]*>)`, 'g');
            if (regex.test(content)) {
                content = content.replace(regex, `$1/${hashedFile}$3`);
                console.log(`   ✅ Replaced page CSS: ${href} → /${hashedFile}`);
            }
        });

        // Fallback: replace any css/pages/<pageName>.css links not handled above
        Object.keys(assetManifest).forEach(key => {
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
        console.warn(`⚠️  Page CSS href replacement failed: ${e.message}`);
    }
    return content;
}

/** Build the critical header CSS string (header + breadcrumb + optional blog) */
function buildHeaderCriticalCss(file) {
    const headerCssPath = join('public', 'css', 'global', 'header.css');
    let css = '';
    if (existsSync(headerCssPath)) {
        css = readFileSync(headerCssPath, 'utf8')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .split('\n').map(l => l.trim()).filter(l => l.length > 0).join('');
    }

    const breadcrumbCss = '.breadcrumbs{max-width:1280px;margin:0 auto;padding:1rem;font-size:.875rem;color:var(--text-muted)}.breadcrumbs ol{list-style:none;display:flex;gap:.5rem;flex-wrap:wrap;margin:0;padding:0}.breadcrumbs li{display:flex;align-items:center}.breadcrumbs li:not(:last-child):after{content:"/";margin-left:.5rem}.breadcrumbs a{color:var(--primary-color);text-decoration:none}.breadcrumbs a:hover{text-decoration:underline}.navbar{transition:none !important}.css-ready .navbar{transition:all var(--transition-fast)}';
    css = css ? css + breadcrumbCss : breadcrumbCss;

    if (file.includes('blog/')) {
        css += '.blog-index__header{margin-bottom:3rem}.blog-index__header h1{margin-bottom:.75rem}.blog-index__header p{font-size:1.1rem;margin:0 auto;line-height:1.6}';
    }
    return css;
}

// Scripts that should receive the `defer` attribute
const DEFER_SCRIPTS = [
    'component-nav.js', 'analytics.js', 'github-integration.js', 'lazy-loading.js',
    'scroll-animations.js', 'main.js', 'defer-css.js', 'config/features.js',
    'features/index.js', 'features/newsletter.js', 'features/brevo-chat.js',
    'ui/index.js', 'pages/cloudflare-workers-guide.js', 'pages/cloudflare-framework.js',
];

// ── Find HTML files needing template processing ─────────────────────

function findHtmlFiles(dir, relativePath = '') {
    const files = [];
    const fullDirPath = join('public', dir);
    if (!existsSync(fullDirPath)) return files;

    const skipDirs = ['node_modules', 'css', 'js', 'icons', 'demo', 'images', 'assets', 'fonts', 'vendor'];

    for (const entry of readdirSync(fullDirPath)) {
        const fullEntryPath = join(fullDirPath, entry);
        const stat = statSync(fullEntryPath);

        if (stat.isDirectory()) {
            if (entry.startsWith('.') || skipDirs.includes(entry)) { console.log(`   ⏭️  Skipping directory: ${entry}`); continue; }
            if (/internal|private|draft|temp/.test(entry)) { console.log(`   ⚠️  Skipping potentially internal directory: ${entry}`); continue; }
            const sub = relativePath ? join(relativePath, entry) : entry;
            files.push(...findHtmlFiles(join(dir, entry), sub));
        } else if (entry.endsWith('.html')) {
            if (/internal|private|draft|temp/.test(entry)) { console.log(`   ⚠️  Skipping potentially internal file: ${entry}`); continue; }
            const content = readFileSync(fullEntryPath, 'utf8');
            if (content.includes('<!--#include file="')) {
                files.push(relativePath ? join(relativePath, entry) : entry);
            } else {
                console.log(`   ℹ️  HTML file without SSI includes: ${relativePath ? join(relativePath, entry) : entry}`);
            }
        }
    }
    return files;
}

// ═══════════════════════════════════════════════════════════════════
//  processTemplatedHtml – main export
// ═══════════════════════════════════════════════════════════════════

export function processTemplatedHtml(assetManifest = {}) {
    console.log('📄 Processing HTML files with templates...');

    const templates = loadTemplates();
    const criticalCss = existsSync(join('dist', 'critical.css')) ? readFileSync(join('dist', 'critical.css'), 'utf8') : '';
    const imagesManifest = loadImagesManifest();

    let pageConfig;
    try { pageConfig = loadPageConfig(); } catch { pageConfig = { pages: {}, pagesByPath: {} }; }

    const htmlFiles = findHtmlFiles('');
    console.log(`   📋 Found ${htmlFiles.length} HTML files that need template processing:`);
    htmlFiles.forEach(f => console.log(`     - ${f}`));

    htmlFiles.forEach(file => {
        const srcPath = join('public', file);
        if (!existsSync(srcPath)) return;
        let content = readFileSync(srcPath, 'utf8');

        // ── 1. Inject asset manifest into <head> ────────────────────
        try {
            const manifestScript = `<script nonce="N0Nc3Cl0d0">window.__assetManifest__=${JSON.stringify(assetManifest)};</script>`;
            if (content.indexOf('<head>') !== -1) {
                content = content.replace('<head>', `<head>\n    ${manifestScript}`);
            }

            // Rewrite preload hrefs to hashed filenames
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
            } catch (e) { console.warn('[MANIFEST] Failed to rewrite preload hrefs for ' + srcPath + ':', e.message); }

            // Insert init-preload script after preload links
            try {
                const initPreloadJs = assetManifest['js/init-preload.js'] || 'js/init-preload.js';
                if (content.includes('<link rel="preload"') && !content.includes(`<script src="/${initPreloadJs}"></script>`)) {
                    if (content.includes('<!-- Page-specific styles deferred (non-critical content) -->')) {
                        content = content.replace('<!-- Page-specific styles deferred (non-critical content) -->', `    <script src="/${initPreloadJs}"></script>\n    <!-- Page-specific styles deferred (non-critical content) -->`);
                    } else {
                        content = content.replace(/(<link rel="preload" href="[^"]+" as="style">)(?![\s\S]*<link rel="preload")/, `$1\n    <script src="/${initPreloadJs}"></script>`);
                    }
                }
            } catch (e) { console.warn('[MANIFEST] Failed to insert init-preload script for ' + srcPath + ':', e.message); }
        } catch (e) { console.warn('[MANIFEST] Failed to inject asset manifest into ' + srcPath + ':', e.message); }

        // ── 2. Path prefix + adjust all templates ───────────────────
        const fileDir = dirname(file);
        const isSubdirectory = fileDir !== '.' && fileDir !== '';
        const pathPrefix = isSubdirectory ? '../' : '/';
        console.log(`   📁 Processing ${file}: isSubdirectory=${isSubdirectory}, pathPrefix='${pathPrefix}'`);

        const adjusted = {};
        for (const key of Object.keys(templates)) {
            adjusted[key] = adjustTemplatePaths(templates[key], pathPrefix);
        }

        // ── 3. Skip link + announcement container ───────────────────
        if (!content.includes('class="skip-link"')) {
            content = content.replace(/<body>/, '<body>\n    <a href="#main-content" class="skip-link">Skip to main content</a>\n    <!-- Announcement Container - Populated dynamically by announcements-manager.js -->\n    <div class="announcement-container"></div>');
        } else if (!content.includes('announcement-container')) {
            content = content.replace(/<body>/, '<body>\n    <!-- Announcement Container - Populated dynamically by announcements-manager.js -->\n    <div class="announcement-container"></div>');
        }

        // ── 4. Header placeholder / auto-inject ─────────────────────
        content = content.replace('<!-- HEADER_PLACEHOLDER -->', adjusted.header);
        if (!content.includes('<!--#include file="') && !(/<header[\s>]/i).test(content) && !content.includes('<!-- HEADER_PLACEHOLDER -->')) {
            content = content.replace(/<body>/, `<body>\n    ${adjusted.header}`);
            console.log(`   ℹ️  Header auto-injected into ${file} (no SSI includes present)`);
        }

        // ── 5. Critical header CSS + theme script into <head> ───────
        let headerCriticalCss = buildHeaderCriticalCss(file);

        if (content.includes('<head>')) {
            content = content.replace('<head>', `<head>\n    ${templates.verification}`);
            console.log(`   ✅ Search Console verification tags injected in ${file}`);
        } else {
            console.warn(`   ⚠️  No <head> tag found in ${file} - verification tags NOT injected!`);
        }

        if (content.includes('</head>')) {
            const headerStyleTag = headerCriticalCss ? `<style>${headerCriticalCss}</style>\n    ` : '';
            content = content.replace('</head>', `    ${headerStyleTag}${templates.themeScript}\n</head>`);
            console.log(`   ✅ Theme script (and header critical CSS) injected in ${file}`);
        } else {
            console.warn(`   ⚠️  No </head> tag found in ${file} - theme script NOT injected!`);
        }

        // ── 6. Replace SSI includes (data-driven) ───────────────────
        content = replaceSSIIncludes(content, adjusted);

        // ── 7. Hero placeholders ────────────────────────────────────
        if (file === 'index.html') {
            content = content.replace('<!-- HERO_PLACEHOLDER -->', templates.heroMinimal);
        } else if (file === 'pricing.html') {
            content = content.replace('<!-- HERO_PLACEHOLDER -->', adjusted.heroPricing);
        } else {
            content = content.replace('<!-- HERO_PLACEHOLDER -->', adjusted.hero);
        }

        // ── 8. Hero image injection from manifest ───────────────────
        const fileName = (file || '').split(/[\\/]/).pop();
        content = injectHeroImage(content, file, fileName, pathPrefix, pageConfig, imagesManifest);

        // ── 8b. Media-slot injection (diagram, benchmark, screenshot, video) ──
        content = injectMediaSlots(content, imagesManifest, pathPrefix, file);

        // Append hero-image CSS + media-figure CSS
        if (content.includes('<picture class="hero-image"') && !headerCriticalCss.includes('.hero-image')) {
            headerCriticalCss += '.hero-image{max-width:100%;height:auto;display:block;border-radius:8px;box-shadow:0 6px 20px rgba(5,16,40,0.06);margin:0 auto}';
        }
        if (content.includes('data-media-slot=') || content.includes('class="media-image"') || content.includes('class="media-diagram"') || content.includes('class="media-video"')) {
            headerCriticalCss += '.media-figure{margin:2rem 0;text-align:center}.media-figure figcaption{font-size:.875rem;color:#6b7280;margin-top:.75rem;font-style:italic}.media-image,.media-diagram{max-width:100%;height:auto;display:block;margin:0 auto;border-radius:8px}.media-image{box-shadow:0 4px 12px rgba(0,0,0,.08)}.media-video{max-width:100%;height:auto;display:block;margin:0 auto;border-radius:8px}.media-video-wrapper{border-radius:8px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.08)}';
        }

        // ── 9. Footer + navbar safety fallbacks ─────────────────────
        content = content.replace('<!-- FOOTER_PLACEHOLDER -->', adjusted.footer);
        if (!(/<nav\s+class=["']navbar["']/i).test(content)) {
            content = content.replace(/<body>/, `<body>\n    <header>\n${adjusted.header}\n    </header>`);
            console.log(`   ℹ️  Header (nav) injected into ${file} (post-processing fallback)`);
        }

        // ── 10. CSS inlining & bundle replacement ───────────────────
        const initPreloadJs = assetManifest['js/init-preload.js'] || 'js/init-preload.js';
        const pageBundle = resolvePageCssBundle(file);
        const origCssFile = pageBundle === 'common' ? 'styles.css' : `styles-${pageBundle}.css`;
        const cssFile = assetManifest[origCssFile] || origCssFile;
        const commonCssFile = assetManifest['styles.css'] || 'styles.css';
        console.log(`   📄 Loading CSS bundle: ${cssFile} (resolved from ${origCssFile})`);
        console.log(`   📄 Common CSS file: ${commonCssFile} (resolved from styles.css)`);

        if (criticalCss) {
            const criticalCssLength = criticalCss.length;
            const maxInlineSize = 50000;
            console.log(`   📊 CSS Size Check: critical=${(criticalCssLength / 1024).toFixed(1)}KB (max=${(maxInlineSize / 1024).toFixed(0)}KB)`);

            const cssLinkPatternMultiple = /<link[^>]*href="(?:\.\.\/)?styles\.css"[^>]*>[\s\n]*<link[^>]*href="(?:\.\.\/)?styles\.css"[^>]*>[\s\n]*(?:<noscript><link[^>]*href="(?:\.\.\/)?styles\.css"[^>]*><\/noscript>[\s\n]*)?/g;
            const cssLinkPatternSingle = /<link[^>]*rel="stylesheet"[^>]*href="(?:\.\.\/)?styles\.css"[^>]*>/g;

            if (criticalCssLength < maxInlineSize) {
                const criticalCssInline = `<style>${criticalCss}</style>`;

                if (file === 'index.html' || fileName.includes('guide') || fileName === 'cloudflare-framework') {
                    // LCP-optimised: separate preload (head) + apply (footer)
                    const manifestScript = `<script nonce="N0Nc3Cl0d0">window.__assetManifest__=${JSON.stringify(assetManifest)};</script>`;
                    const headInjection = `${criticalCssInline}\n    ${manifestScript}\n    <link rel="preload" href="/${commonCssFile}" as="style">\n    <link rel="preload" href="/${cssFile}" as="style">\n    <script src="/${initPreloadJs}"></script>`;
                    const footerInjection = `<link rel="stylesheet" href="/${commonCssFile}">\n    <link rel="stylesheet" href="/${cssFile}">`;

                    if (content.includes('href="styles.css"') || content.includes('href="../styles.css"')) {
                        content = content.match(cssLinkPatternMultiple)
                            ? content.replace(cssLinkPatternMultiple, headInjection)
                            : content.replace(cssLinkPatternSingle, headInjection);
                    }
                    content = content.replace('</body>', `    ${footerInjection}\n</body>`);

                    if (pageBundle !== 'common') {
                        const asyncPattern = new RegExp(`<link[^>]*media="print"[^>]*onload="this.media='all'"[^>]*(?:href="[^"]*${pageBundle}[^"]*"|href="[^"]*css/pages/${pageBundle}[^"]*")[^>]*>|<link[^>]*(?:href="[^"]*${pageBundle}[^"]*"|href="[^"]*css/pages/${pageBundle}[^"]*")[^>]*media="print"[^>]*onload="this.media='all'"[^>]*>`, 'gi');
                        content = content.replace(asyncPattern, '');
                        console.log(`   ✅ Removed defer CSS link for synchronous loading: ${pageBundle}`);
                    }
                } else {
                    // Standard: inline critical + synchronous common + page CSS
                    const commonCss = `<link rel="stylesheet" href="/${commonCssFile}">`;
                    const pageCss = pageBundle !== 'common' ? `\n    <link rel="stylesheet" href="/${cssFile}">` : '';
                    const cssLinks = commonCss + pageCss;

                    if ((content.includes('href="styles.css"') || content.includes('href="../styles.css"')) && content.match(cssLinkPatternMultiple)) {
                        content = content.replace(cssLinkPatternMultiple, criticalCssInline + '\n    ' + cssLinks + '\n    ');
                    } else if (content.includes('href="styles.css"') || content.includes('href="../styles.css"')) {
                        content = content.replace(cssLinkPatternSingle, criticalCssInline + '\n    ' + cssLinks);
                    }
                }
                console.log('   ✅ Critical CSS inlined (< 50KB)');
            } else {
                console.warn(`   ⚠️  Critical CSS too large (${(criticalCssLength / 1024).toFixed(1)}KB) - using async loading only`);
                const commonCss = `<link rel="stylesheet" href="/${commonCssFile}">`;
                const pageCss = pageBundle !== 'common' ? `\n    <link rel="stylesheet" href="/${cssFile}">` : '';
                const cssLinks = commonCss + pageCss;

                if ((content.includes('href="styles.css"') || content.includes('href="../styles.css"')) && content.match(cssLinkPatternMultiple)) {
                    content = content.replace(cssLinkPatternMultiple, cssLinks + '\n    ');
                } else if (content.includes('href="styles.css"') || content.includes('href="../styles.css"')) {
                    content = content.replace(cssLinkPatternSingle, cssLinks);
                } else if (pageBundle !== 'common') {
                    content = content.replace('</body>', `    ${commonCss}${pageCss}\n</body>`);
                    console.log(`   ℹ️  Injected page-specific CSS (${cssFile}) via fallback method`);
                }
            }
        }

        // Normalize remaining styles.css references to hashed asset
        try {
            const hashedCommon = assetManifest['styles.css'] || 'styles.css';
            if (content.includes('href="styles.css"') || content.includes('href="../styles.css"')) {
                content = content.replace(/href="(?:\.\.\/)?styles\.css"/g, `href="/${hashedCommon}"`);
                console.log(`   ✅ Normalized remaining styles.css references to /${hashedCommon}`);
            }
        } catch (e) { console.warn(`   ⚠️  Failed to normalize styles.css references: ${e?.message ?? e}`); }

        // ── 11. Defer non-critical scripts ──────────────────────────
        try {
            DEFER_SCRIPTS.forEach(name => {
                const regex = new RegExp(`<script([^>]*)src=["'](?:\\.|\\/|)js\\/${name}["']([^>]*)><\\/script>`, 'g');
                content = content.replace(regex, m => {
                    if (/\bdefer\b|\basync\b/.test(m)) return m;
                    if (/type=["']module["']/.test(m)) return m;
                    return m.replace('<script', '<script defer');
                });
            });
        } catch { /* non-fatal */ }

        // ── 12. Hash script / CSS paths ─────────────────────────────
        content = hashScriptPaths(content, assetManifest);
        content = hashCssHrefs(content, assetManifest);

        // ── 13. Remove redundant security meta tags ─────────────────
        content = content.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/g, '');
        content = content.replace(/<meta http-equiv="X-Frame-Options"[^>]*>/g, '');
        content = content.replace(/<meta http-equiv="X-Content-Type-Options"[^>]*>/g, '');
        content = content.replace(/<meta http-equiv="Referrer-Policy"[^>]*>/g, '');

        // ── 14. Schema injection ────────────────────────────────────
        content = injectSchemasIntoHTML(file, content);
        content = injectDefaultSchemas(content, file);

        // ── 15. Write output ────────────────────────────────────────
        const destPath = join('dist', file);
        mkdirSync(dirname(destPath), { recursive: true });

        // Final safety: ensure navbar exists
        if (!(/<nav\s+class=["']navbar["']/i).test(content)) {
            content = content.replace(/<body>/, `<body>\n    <header>\n${adjusted.header}\n    </header>`);
            console.log(`   ℹ️  Header (nav) injected into ${file} (final fallback before write)`);
        }

        writeFileSync(destPath, content, 'utf8');
    });
}

// ═══════════════════════════════════════════════════════════════════
//  processStandaloneHtml
// ═══════════════════════════════════════════════════════════════════

export function processStandaloneHtml() {
    console.log('[COPY] Copying standalone HTML files with navigation injection...');

    const footerTemplate = readFileSync(join('nav-system', 'templates', 'footer.html'), 'utf8');
    const navMainTemplate = readFileSync(join('nav-system', 'templates', 'nav-main.html'), 'utf8');
    const imagesManifest = loadImagesManifest();

    let pageConfig;
    try { pageConfig = loadPageConfig(); } catch { pageConfig = { pages: {}, pagesByPath: {} }; }

    const skipDirs = ['node_modules', 'css', 'js', 'icons', 'images', 'assets', 'fonts', 'vendor'];
    const skipNavFiles = ['google1234567890abcdef.html', 'robots.txt', 'sitemap.xml', 'site.webmanifest', '_redirects', '_headers', '_routes.json', '404.html', 'favicon.svg', 'favicon.ico'];

    function walkDir(dir, relativePath = '') {
        const fullDirPath = join('public', dir);
        if (!existsSync(fullDirPath)) return;

        for (const entry of readdirSync(fullDirPath)) {
            const fullEntryPath = join(fullDirPath, entry);
            const stat = statSync(fullEntryPath);

            if (stat.isDirectory()) {
                if (entry.startsWith('.') || skipDirs.includes(entry)) continue;
                if (/internal|private|draft|temp/.test(entry)) continue;
                walkDir(join(dir, entry), relativePath ? join(relativePath, entry) : entry);
                continue;
            }

            if (!entry.endsWith('.html')) continue;
            if (/internal|private|draft|temp/.test(entry)) continue;

            let content = readFileSync(fullEntryPath, 'utf8');
            if (content.includes('<!--#include file="')) continue; // handled by processTemplatedHtml

            const shouldInjectNav = !skipNavFiles.includes(entry);
            const hasNavbar = content.includes('class="navbar"') || content.includes('class="nav-main"');
            const hasFooter = content.includes('<footer');

            if (shouldInjectNav && content.includes('<body')) {
                if (hasNavbar) {
                    content = content.replace(/<nav[^>]*class="(navbar|nav-main)"[^>]*>[\s\S]*?<\/nav>/i, '');
                }
                content = content.replace(/<body([^>]*)>/, match => match + '\n    ' + navMainTemplate);
                if (!hasFooter) {
                    content = content.replace(/<\/body>/i, footerTemplate + '\n</body>');
                }
            }

            const filePath = relativePath ? join(relativePath, entry) : entry;
            const pathPrefix = relativePath ? '../' : '/';

            // Hero image injection
            if (entry === 'saas-product-startups-cloudflare-case-studies.html') {
                console.log('   🔎 Processing standalone case-study page for hero + media-slot injection');
            }
            content = injectHeroImage(content, filePath, entry, pathPrefix, pageConfig, imagesManifest);

            // Media-slot injection (diagrams, benchmarks, screenshots, videos)
            content = injectMediaSlots(content, imagesManifest, pathPrefix, filePath);

            // Schema injection
            content = injectSchemasIntoHTML(filePath, content);
            content = injectDefaultSchemas(content, filePath);

            // Write output
            const destPath = join('dist', filePath);
            mkdirSync(dirname(destPath), { recursive: true });
            writeFileSync(destPath, content, 'utf8');
            const navStatus = hasNavbar ? '✅ replaced navbar' : '✅ injected navbar';
            console.log(`   📋 Copied standalone HTML: ${filePath} (${navStatus})`);
        }
    }

    walkDir('');
}
