/**
 * Static asset and Cloudflare Functions copying step.
 * Uses the shared copyRecursive helper instead of repeated inline loops.
 */
import { existsSync, copyFileSync, rmSync } from 'fs';
import { join } from 'path';
import { copyRecursive } from '../utils/fs-helpers.js';

export function copyAssets() {
    console.log('[ASSETS] Copying assets...');

    // Legacy stylesheet
    if (existsSync(join('public', 'styles-organized.css'))) {
        copyFileSync(join('public', 'styles-organized.css'), join('dist', 'styles-organized.css'));
    }

    // Root assets (sitemap, robots, manifest, favicons, CF Pages config, …)
    ['robots.txt', 'sitemap.xml', 'site.webmanifest', 'google1234567890abcdef.html',
     'favicon.svg', 'favicon.ico', '_redirects', '_headers', '_routes.json', '404.html'
    ].forEach(file => {
        const src = join('public', file);
        if (existsSync(src)) copyFileSync(src, join('dist', file));
    });

    // Standard directories – full recursive copy
    ['icons', 'js', 'demo'].forEach(dir => {
        const src = join('public', dir);
        if (existsSync(src)) copyRecursive(src, join('dist', dir));
    });

    // Images directory
    if (existsSync(join('public', 'images'))) {
        copyRecursive(join('public', 'images'), join('dist', 'images'));
        console.log('[ASSETS] Copied images/ to dist/images/');
    }

    // Downloads directory – .zip whitelist at top level, everything inside subdirectories
    if (existsSync('downloads')) {
        copyRecursive('downloads', join('dist', 'downloads'), {
            filter: (name, fullPath, isDir) => {
                if (isDir) return true;
                // Only restrict files at the top level of downloads/
                const rel = fullPath.replace(/\\/g, '/').replace(/^downloads\//, '');
                if (!rel.includes('/')) {
                    if (!name.endsWith('.zip')) {
                        console.log(`[ASSETS] Skipped downloads/${name} (not allowed by whitelist)`);
                        return false;
                    }
                }
                return true;
            },
        });
        console.log('[ASSETS] Copied downloads/ to dist/downloads/ (whitelisted files only)');
    }

    // Config JSON files (no subdirectories)
    if (existsSync('config')) {
        copyRecursive('config', join('dist', 'config'), {
            filter: (name, _path, isDir) => !isDir && name.endsWith('.json'),
        });
    }
}

export function copyFunctions() {
    console.log('[FUNCTIONS] Copying Cloudflare Functions for deployment...');
    const dest = join('dist', 'functions');
    if (existsSync(dest)) {
        rmSync(dest, { recursive: true, force: true });
    }
    copyRecursive('functions', dest);
    console.log('  ✅ Functions copied to dist/functions/');
}
