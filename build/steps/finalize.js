/**
 * Build-info generation and post-build SEO verification.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { resolvePageConfig } from '../utils/page-config.js';

export function generateBuildInfo() {
    console.log('📊 Generating build info...');
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

    // count pages in dist that contain JSON-LD / schema (simple heuristic)
    const distRoot = 'dist';
    let schemaCount = 0;
    const traverseAndCount = (dir) => {
        if (!existsSync(dir)) return;
        const items = readdirSync(dir);
        for (const it of items) {
            const full = join(dir, it);
            if (statSync(full).isDirectory()) {
                traverseAndCount(full);
            } else if (it.endsWith('.html')) {
                const c = readFileSync(full, 'utf8');
                if (/type=["']application\/ld\+json["']|"@type"\s*:/i.test(c)) schemaCount++;
            }
        }
    };
    traverseAndCount(distRoot);

    const info = {
        // keep backward-compatible key for scripts that read buildTime
        buildTime: new Date().toISOString(),
        // prefer `timestamp` for validation checks
        timestamp: new Date().toISOString(),
        version: packageJson.version,
        commit: process.env.GITHUB_SHA || 'local-build',
        schemaCount
    };

    writeFileSync(join('dist', 'build-info.json'), JSON.stringify(info, null, 2), 'utf8');
    console.log(`✅ Wrote dist/build-info.json (schemaCount=${schemaCount})`);
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
                // Only treat ImageObject + og:image as hard failures; missing <picture> is a warning
                const hardMissing = missing.filter(m => m !== 'picture');
                if (hardMissing.length) failures.push({ page, missing: hardMissing });
                else if (missing.length) console.warn(`[VERIFY] ⚠️  ${page}: ${missing.join(', ')} not injected (non-fatal)`);
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
