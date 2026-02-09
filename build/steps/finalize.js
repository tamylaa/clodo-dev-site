/**
 * Build-info generation and post-build SEO verification.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { resolvePageConfig } from '../utils/page-config.js';

export function generateBuildInfo() {
    console.log('📊 Generating build info...');
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    writeFileSync(
        join('dist', 'build-info.json'),
        JSON.stringify({
            buildTime: new Date().toISOString(),
            version: packageJson.version,
            commit: process.env.GITHUB_SHA || 'local-build',
        }, null, 2),
        'utf8'
    );
}

/**
 * Post-build verification: every page with configured images must contain
 * a hero <picture>, ImageObject JSON-LD, and og:image meta tag.
 */
export function verifySeoImageInjection() {
    try {
        const pageConfig = JSON.parse(readFileSync(join('data', 'schemas', 'page-config.json'), 'utf8'));
        const failures = [];
        const pagesToCheck = new Set();

        if (pageConfig.pagesByPath) Object.keys(pageConfig.pagesByPath).forEach(p => pagesToCheck.add(p));
        if (pageConfig.pages) Object.keys(pageConfig.pages).forEach(name => pagesToCheck.add(`${name}.html`));
        if (pageConfig.caseStudies) Object.keys(pageConfig.caseStudies).forEach(name => pagesToCheck.add(`${name}.html`));

        pagesToCheck.forEach(page => {
            const distPath = join('dist', page);
            if (!existsSync(distPath)) return;
            const content = readFileSync(distPath, 'utf8');

            const fileName = (page || '').split(/[\\/]/).pop();
            const config = resolvePageConfig(pageConfig, page, fileName);

            if (config && Array.isArray(config.images) && config.images.length) {
                const missing = [];
                if (!content.includes('<picture class="hero-image"')) missing.push('picture');
                if (!content.includes('"@type":"ImageObject"') && !content.includes('"@type": "ImageObject"')) missing.push('ImageObject JSON-LD');
                if (!content.includes('property="og:image"') && !content.includes("property='og:image'")) missing.push('og:image meta');
                if (missing.length) failures.push({ page, missing });
            }
        });

        if (failures.length) {
            console.error('[VERIFY] SEO image verification failed:');
            failures.forEach(f => console.error(`   - ${f.page}: missing ${f.missing.join(', ')}`));
            throw new Error('SEO image verification failed');
        }

        console.log('[VERIFY] All pages with configured images contain hero <picture>, ImageObject JSON-LD, and og:image meta. ✅');
    } catch (e) {
        console.error('[VERIFY] Verification failed:', e.message);
        throw e;
    }
}
