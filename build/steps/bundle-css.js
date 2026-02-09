/**
 * CSS bundling step.
 * Reads source CSS from public/, bundles critical + common + page-specific +
 * deferred CSS, minifies, content-hashes, and writes to dist/.
 * Returns the CSS portion of the asset manifest.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import * as crypto from 'crypto';
import { minifyCssContent } from '../utils/css-minify.js';

// ── CSS bundle configuration ────────────────────────────────────────

const criticalCssFiles = [
    'css/critical-base.css',
    'css/global/header.css',
    'css/utilities.css',
];

const commonCssFiles = [
    'css/base.css',
    'css/layout.css',
    'css/components/buttons.css',
    'css/components-common.css',
    'css/global/footer.css',
    'css/global/community-section.css',
];

const pageBundles = {
    'index': [
        'css/pages/index/hero.css',
        'css/hero-decorations.css',
        'css/pages/index/hero-animations.css',
    ],
    'pricing': ['css/pages/pricing/index.css'],
    'blog': [
        'css/pages/blog/header.css',
        'css/pages/blog/index.css',
        'css/pages/blog/card.css',
        'css/pages/blog/stats.css',
        'css/pages/blog/post.css',
    ],
    'subscribe': [
        'css/pages/subscribe/hero.css',
        'css/pages/subscribe/form.css',
        'css/pages/subscribe/preview.css',
        'css/pages/subscribe/testimonials.css',
    ],
    'product': ['css/pages/product.css'],
    'about': ['css/pages/about.css'],
    'migrate': ['css/pages/migrate.css'],
    'case-studies': ['css/pages/case-studies.css'],
    'community': ['css/pages/community.css'],
    'workers-boilerplate': ['css/pages/workers-boilerplate.css'],
    'clodo-framework-guide': ['css/pages/clodo-framework-guide.css'],
    'cloudflare-workers-guide': [
        'css/components-hero-shared.css',
        'css/components-animations-shared.css',
        'css/components-shared-utilities.css',
        'css/pages/cloudflare-workers-guide.css',
    ],
    'cloudflare-workers-development-guide': [
        'css/components-hero-shared.css',
        'css/components-animations-shared.css',
        'css/components-shared-utilities.css',
        'css/pages/cloudflare-workers-development-guide.css',
    ],
    'cloudflare-top-10-saas-edge-computing-workers-case-study-docs': [
        'css/components-hero-shared.css',
        'css/components-animations-shared.css',
        'css/components-shared-utilities.css',
        'css/pages/cloudflare-top-10-saas-edge-computing-workers-case-study-docs.css',
    ],
    'saas-product-startups-cloudflare-case-studies': [
        'css/components-hero-shared.css',
        'css/components-animations-shared.css',
        'css/components-shared-utilities.css',
        'css/pages/saas-product-startups-cloudflare-case-studies.css',
    ],
    'cloudflare-framework': ['css/pages/cloudflare-framework.css'],
};

const deferredBundles = {
    'index-deferred': [
        'css/components-page-specific.css',
        'css/pages/index/benefits.css',
        'css/pages/index/cloudflare-edge.css',
        'css/pages/index/comparison.css',
        'css/pages/index/cta.css',
        'css/pages/index/features.css',
        'css/pages/index/social-proof.css',
        'css/pages/index/stats.css',
        'css/pages/index.css',
    ],
};

// ── Helpers ──────────────────────────────────────────────────────────

/** Recursively resolve CSS import-url statements */
function resolveImports(cssContent, baseDir) {
    return cssContent.replace(/@import\s+url\(['"]?([^'")\s]+)['"]?\);?/g, (match, importPath) => {
        const resolvedPath = join(baseDir, importPath);
        if (existsSync(resolvedPath)) {
            console.log(`   📄 Resolving @import: ${importPath}`);
            const importedContent = readFileSync(resolvedPath, 'utf8');
            return resolveImports(importedContent, dirname(resolvedPath));
        }
        console.warn(`⚠️  Import file not found: ${resolvedPath}`);
        return match;
    });
}

/** Read, concatenate, and resolve @imports for a list of CSS source files */
function bundleFiles(files, label) {
    let bundled = '';
    files.forEach(file => {
        const filePath = join('public', file);
        if (existsSync(filePath)) {
            console.log(`📄 Including ${label}: ${file}`);
            let css = readFileSync(filePath, 'utf8');
            css = resolveImports(css, dirname(filePath));
            bundled += css + '\n';
        } else {
            console.warn(`⚠️  ${label} CSS file not found: ${file}`);
        }
    });
    return bundled;
}

/** Minify CSS, write a content-hashed file to dist, update manifest */
function writeHashedCss(content, baseName, manifest) {
    const minified = minifyCssContent(content);
    const hash = crypto.createHash('sha256').update(minified).digest('hex').slice(0, 8);
    const fileName = `${baseName}.${hash}.css`;
    writeFileSync(join('dist', fileName), minified, 'utf8');
    manifest[`${baseName}.css`] = fileName;
    console.log(`   📦 ${baseName} CSS: ${minified.length} bytes -> ${fileName}`);
    return minified;
}

// ── Main export ─────────────────────────────────────────────────────

export function bundleCss() {
    console.log('[CSS] Bundling CSS...');
    const assetManifest = {};

    // Critical CSS (inlined into <head>)
    const criticalBundled = bundleFiles(criticalCssFiles, 'critical');

    // Common CSS (shared across pages, loaded async)
    const commonBundled = bundleFiles(commonCssFiles, 'common');

    // Page-specific bundles
    Object.entries(pageBundles).forEach(([pageName, files]) => {
        console.log(`📄 Bundling ${pageName} CSS...`);
        const bundled = bundleFiles(files, pageName);
        writeHashedCss(bundled, `styles-${pageName}`, assetManifest);
    });

    // Deferred bundles (lazy-loaded after initial render)
    Object.entries(deferredBundles).forEach(([bundleName, files]) => {
        console.log(`📄 Bundling ${bundleName} CSS (deferred)...`);
        const bundled = bundleFiles(files, bundleName);
        writeHashedCss(bundled, `styles-${bundleName}`, assetManifest);
    });

    // Write critical CSS (no hash – referenced by fixed name)
    const minifiedCritical = minifyCssContent(criticalBundled);
    writeFileSync(join('dist', 'critical.css'), minifiedCritical, 'utf8');
    console.log(`📦 Critical CSS: ${minifiedCritical.length} bytes`);

    // Write common CSS with content hash
    writeHashedCss(commonBundled, 'styles', assetManifest);

    return assetManifest;
}
