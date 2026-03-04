import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let PurgeCSS = null;
try { PurgeCSS = require('purgecss').PurgeCSS; } catch (e) { /* purgecss not installed */ }

export async function purgeCss() {
    console.log('[PurgeCSS] Removing unused CSS from built bundles...');
    if (!PurgeCSS) {
        console.warn('   ⚠️  purgecss not available (devDependency missing). Skipping PurgeCSS step.');
        return;
    }

    const cssDir = join('dist', 'css');
    const candidateCss = [];
    try {
        if (existsSync(cssDir)) {
            for (const f of readdirSync(cssDir)) {
                if (f.endsWith('.css')) candidateCss.push(join(cssDir, f));
            }
        }
        // Also check root styles.css
        if (existsSync(join('dist', 'styles.css'))) candidateCss.push(join('dist', 'styles.css'));
    } catch (e) {
        console.warn('[PurgeCSS] Failed to enumerate CSS files:', e.message);
    }

    if (!candidateCss.length) {
        console.log('   ℹ️  No CSS files found in dist to purge.');
        return;
    }

    const contentGlobs = ['dist/**/*.html', 'public/**/*.html', 'public/**/*.js'];
    try {
        const purger = new PurgeCSS();
        const results = await purger.purge({ content: contentGlobs, css: candidateCss });
        for (const r of results) {
            try {
                writeFileSync(r.file, r.css, 'utf8');
                console.log(`   ✅ Purged ${r.file} => ${(r.css.length/1024).toFixed(1)}KB`);
            } catch (e) {
                console.warn('   ⚠️  Failed to write purged CSS for', r.file, e.message);
            }
        }
    } catch (e) {
        console.warn('[PurgeCSS] PurgeCSS run failed:', e.message);
    }
}
