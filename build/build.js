#!/usr/bin/env node
/**
 * Build orchestrator for Clodo Framework website.
 *
 * Each step lives in its own module under build/steps/.
 * Shared utilities live under build/utils/.
 *
 * Pipeline:
 *   clean → bundleCss → copyJs → processTemplatedHtml → writeManifest
 *   → processStandaloneHtml → minifyIndividualCss → copyAssets
 *   → generateBuildInfo → fixCanonicalUrls → copyFunctions
 *   → checkLinks → verifySeoImageInjection
 */
import { writeFileSync } from 'fs';
import { join } from 'path';
import { fixCanonicalUrls } from './fix-canonicals-fn.js';
import { cleanDist } from './steps/clean.js';
import { bundleCss } from './steps/bundle-css.js';
import { minifyIndividualCss } from './steps/minify-css.js';
import { copyJs } from './steps/process-js.js';
import { copyAssets, copyFunctions } from './steps/copy-assets.js';
import { processTemplatedHtml, processStandaloneHtml } from './steps/process-html.js';
import { generateBuildInfo, verifySeoImageInjection } from './steps/finalize.js';
import { optimizeImages } from './steps/optimize-images.js';
import { purgeCss } from './steps/purge-css.js';

console.log('[BUILD] Building Clodo Framework website...');

async function main() {
    try {
        // 1. Clean output directory
        cleanDist();

        // 2. Bundle & hash CSS (must run first – HTML needs critical.css)
        const cssManifest = bundleCss();

        // 3. Minify & hash JS
        const jsManifest = await copyJs();

        // 4. Merge into a single asset manifest
        let assetManifest = { ...cssManifest, ...jsManifest };

        // 5. Optimize images -> generates dist/images and data/images/.../images.json
        await optimizeImages();

        // 6. Run PurgeCSS to remove unused rules from built CSS (best-effort)
        await purgeCss();

        // 7. Re-read CSS manifest if needed (bundleCss writes hashed names already)
        assetManifest = { ...cssManifest, ...jsManifest };

        // 8. Process SSI-include HTML files (injects templates, CSS, schemas, images)
        processTemplatedHtml(assetManifest);

        // 9. Write combined asset manifest to dist
        writeFileSync(
            join('dist', 'asset-manifest.json'),
            JSON.stringify(assetManifest, null, 2),
            'utf8',
        );
        console.log('[MANIFEST] Asset manifest written with', Object.keys(assetManifest).length, 'entries');

        // 10. Process standalone HTML files (no SSI includes)
        processStandaloneHtml();

        // 11. Minify individual CSS files
        minifyIndividualCss();

        // 12. Copy static assets + Cloudflare Functions
        copyAssets();
        generateBuildInfo();

        // 13. Post-processing
        console.log('[CANONICAL] Fixing canonical URLs to https://www.clodo.dev...');
        fixCanonicalUrls('dist', 'https://www.clodo.dev');
        console.log('[CANONICAL] Canonical URLs fixed');

        copyFunctions();

        // 14. Link health check + SEO verification (async)
        console.log('[CHECK] Running link health check...');
        import('./check-links.js').then(({ checkLinks }) => {
            return Promise.resolve(checkLinks()).then(() => {
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
}

main();
