/**
 * JavaScript processing step.
 * Minifies and content-hashes JS from public/js/ → dist/js/.
 * Returns the JS portion of the asset manifest.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, copyFileSync } from 'fs';
import { join } from 'path';
import * as crypto from 'crypto';
import { minifyJs } from '../utils/minify.js';

export function copyJs() {
    console.log('[JS] Copying and Minifying JavaScript...');

    // Copy main script.js
    const jsFile = join('public', 'script.js');
    if (existsSync(jsFile)) {
        const content = readFileSync(jsFile, 'utf8');
        const minified = minifyJs(content);
        writeFileSync(join('dist', 'script.js'), minified, 'utf8');
        console.log(`  ✓ Minified script.js (${(content.length / 1024).toFixed(1)}KB -> ${(minified.length / 1024).toFixed(1)}KB)`);
    }

    // Copy js/ module directory with content hashing
    const jsDir = join('public', 'js');
    const distJsDir = join('dist', 'js');
    const jsManifest = {};

    if (!existsSync(jsDir)) return jsManifest;

    console.log('[JS] Copying JS modules with hashing...');
    mkdirSync(distJsDir, { recursive: true });

    function hashRecursive(srcDir, destDir, relativePath = '') {
        for (const item of readdirSync(srcDir)) {
            const srcPath = join(srcDir, item);
            const destPath = join(destDir, item);
            const stat = statSync(srcPath);
            const relPath = relativePath ? `${relativePath}/${item}` : item;

            if (stat.isDirectory()) {
                mkdirSync(destPath, { recursive: true });
                hashRecursive(srcPath, destPath, relPath);
            } else if (item.endsWith('.js')) {
                const content = readFileSync(srcPath, 'utf8');
                const minified = minifyJs(content);
                const hash = crypto.createHash('sha256').update(minified).digest('hex').slice(0, 8);
                const hashFileName = item.replace('.js', `.${hash}.js`);
                writeFileSync(join(destDir, hashFileName), minified, 'utf8');
                jsManifest[`js/${relPath}`] = `js/${relativePath ? `${relativePath}/` : ''}${hashFileName}`;
                console.log(`  ✓ Minified ${srcPath.replace('public/', '')} -> ${hashFileName}`);
            } else if (item === 'README.md') {
                copyFileSync(srcPath, destPath);
            }
        }
    }

    hashRecursive(jsDir, distJsDir);
    return jsManifest;
}
