/**
 * Page-configuration helpers.
 * Centralises the page-config lookup logic used by both templated and
 * standalone HTML processing, and the page → CSS-bundle mapping.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

/** Load data/schemas/page-config.json (throws on missing file) */
export function loadPageConfig() {
    return JSON.parse(readFileSync(join('data', 'schemas', 'page-config.json'), 'utf8'));
}

/**
 * Resolve the effective page config for a file.
 * Checks pagesByPath → pages → caseStudies in order, and prefers the
 * caseStudies entry when the generic config has no images.
 *
 * @param {object} pageConfig  – The full page-config.json object
 * @param {string} filePath    – File path as used in pagesByPath keys
 * @param {string} fileName    – Bare filename (e.g. "case-study.html")
 */
export function resolvePageConfig(pageConfig, filePath, fileName) {
    let config = pageConfig.pagesByPath?.[filePath] ?? null;

    if (!config && pageConfig.pages?.[fileName.replace('.html', '')]) {
        config = pageConfig.pages[fileName.replace('.html', '')];
    }

    // Prefer caseStudies entry when generic config lacks images
    if (config && (!Array.isArray(config.images) || !config.images.length) && pageConfig.caseStudies?.[fileName]) {
        config = pageConfig.caseStudies[fileName];
    }

    // Fallback: caseStudies mapping
    if (!config && pageConfig.caseStudies?.[fileName]) {
        config = pageConfig.caseStudies[fileName];
    }

    return config;
}

/** Map a file path to its page-specific CSS bundle name */
export function resolvePageCssBundle(file) {
    const fileName = file.split(/[\\/]/).pop().replace('.html', '');

    // Directory-based bundles (check before filename to handle blog/post.html etc.)
    if (file.match(/blog[\\/]/)) return 'blog';
    if (file.match(/case-studies[\\/]/)) return 'case-studies';
    if (file.match(/community[\\/]/)) return 'community';

    // Exact-match pages
    const exactMap = {
        'index': 'index',
        'cloudflare-framework': 'cloudflare-framework',
        'clodo-framework-guide': 'clodo-framework-guide',
        'cloudflare-workers-guide': 'cloudflare-workers-guide',
        'cloudflare-workers-development-guide': 'cloudflare-workers-development-guide',
        'cloudflare-top-10-saas-edge-computing-workers-case-study-docs': 'cloudflare-top-10-saas-edge-computing-workers-case-study-docs',
        'saas-product-startups-cloudflare-case-studies': 'saas-product-startups-cloudflare-case-studies',
    };
    if (exactMap[fileName]) return exactMap[fileName];

    // Substring-match pages
    if (fileName.includes('pricing')) return 'pricing';
    if (fileName.includes('subscribe')) return 'subscribe';
    if (fileName.includes('product')) return 'product';
    if (fileName.includes('about')) return 'about';
    if (fileName.includes('migrate')) return 'migrate';

    return 'common';
}

/**
 * Page-specific CSS replacement mappings.
 * Each entry maps an original href (as authored in HTML) to its asset-manifest key.
 */
export const PAGE_CSS_REPLACEMENTS = [
    { href: 'css/pages/cloudflare-workers-development-guide.css', manifestKey: 'styles-cloudflare-workers-development-guide.css' },
    { href: 'css/pages/cloudflare-workers-guide.css', manifestKey: 'styles-cloudflare-workers-guide.css' },
    { href: 'css/pages/clodo-framework-guide.css', manifestKey: 'styles-clodo-framework-guide.css' },
    { href: 'css/pages/cloudflare-framework.css', manifestKey: 'styles-cloudflare-framework.css' },
    { href: 'css/pages/index.css', manifestKey: 'styles-index.css' },
    { href: 'css/pages/pricing.css', manifestKey: 'styles-pricing.css' },
    { href: 'css/pages/product.css', manifestKey: 'styles-product.css' },
    { href: 'css/pages/about.css', manifestKey: 'styles-about.css' },
    { href: 'css/pages/migrate.css', manifestKey: 'styles-migrate.css' },
    { href: 'css/pages/case-studies.css', manifestKey: 'styles-case-studies.css' },
    { href: 'css/pages/community.css', manifestKey: 'styles-community.css' },
    { href: 'css/pages/workers-boilerplate.css', manifestKey: 'styles-workers-boilerplate.css' },
    { href: 'css/pages/saas-product-startups-cloudflare-case-studies.css', manifestKey: 'styles-saas-product-startups-cloudflare-case-studies.css' },
    { href: 'css/pages/cloudflare-top-10-saas-edge-computing-workers-case-study-docs.css', manifestKey: 'styles-cloudflare-top-10-saas-edge-computing-workers-case-study-docs.css' },
];
