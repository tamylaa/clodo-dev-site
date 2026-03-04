/**
 * JavaScript processing step.
 * Minifies and content-hashes JS from public/js/ → dist/js/.
 * Returns the JS portion of the asset manifest.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, copyFileSync } from 'fs';
import { join } from 'path';
import * as crypto from 'crypto';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let terser = null;
try { terser = require('terser'); } catch (e) { /* terser not installed — fallback used */ }
import { minifyJs } from '../utils/minify.js';

export async function copyJs() {
    console.log('[JS] Copying and Minifying JavaScript...');

    // Copy main script.js
    const jsFile = join('public', 'script.js');
    if (existsSync(jsFile)) {
        const content = readFileSync(jsFile, 'utf8');
        if (terser && typeof terser.minify === 'function') {
            try {
                const res = await terser.minify({ 'script.js': content }, { sourceMap: { filename: 'script.js', url: 'script.js.map' }, compress: { passes: 2 }, mangle: true });
                if (res && res.code) {
                    const outPath = join('dist', 'script.js');
                    mkdirSync(join('dist'), { recursive: true });
                    writeFileSync(outPath, res.code, 'utf8');
                    if (res.map) writeFileSync(outPath + '.map', typeof res.map === 'string' ? res.map : JSON.stringify(res.map), 'utf8');
                    console.log(`  ✓ Minified script.js -> dist/script.js (sourcemap written)`);
                }
            } catch (e) {
                console.warn('[JS] terser failed for script.js — falling back to lightweight minify:', e.message);
                const minified = minifyJs(content);
                writeFileSync(join('dist', 'script.js'), minified, 'utf8');
            }
        } else {
            const minified = minifyJs(content);
            writeFileSync(join('dist', 'script.js'), minified, 'utf8');
            console.log(`  ✓ Minified script.js (${(content.length / 1024).toFixed(1)}KB -> ${(minified.length / 1024).toFixed(1)}KB)`);
        }
    }

    // Copy js/ module directory with content hashing
    const jsDir = join('public', 'js');
    const distJsDir = join('dist', 'js');
    const jsManifest = {};

    if (!existsSync(jsDir)) return jsManifest;

    console.log('[JS] Copying JS modules with hashing...');
    mkdirSync(distJsDir, { recursive: true });

    async function hashRecursive(srcDir, destDir, relativePath = '') {
        for (const item of readdirSync(srcDir)) {
            const srcPath = join(srcDir, item);
            const destPath = join(destDir, item);
            const stat = statSync(srcPath);
            const relPath = relativePath ? `${relativePath}/${item}` : item;

            if (stat.isDirectory()) {
                mkdirSync(destPath, { recursive: true });
                // eslint-disable-next-line no-await-in-loop
                await hashRecursive(srcPath, destPath, relPath);
            } else if (item.endsWith('.js')) {
                const content = readFileSync(srcPath, 'utf8');
                if (terser && typeof terser.minify === 'function') {
                    try {
                        const minRes = await terser.minify({ [item]: content }, { sourceMap: { filename: item, url: item + '.map' }, compress: { passes: 2 }, mangle: true });
                        let code = minRes.code || content;
                        let map = minRes.map ? (typeof minRes.map === 'string' ? minRes.map : JSON.stringify(minRes.map)) : null;
                        const hash = crypto.createHash('sha256').update(code).digest('hex').slice(0, 8);
                        const hashFileName = item.replace('.js', `.${hash}.js`);
                        const outPath = join(destDir, hashFileName);

                        // If map exists, update map.file to hashed name and update sourceMappingURL
                        if (map) {
                            try {
                                const mapJson = JSON.parse(map);
                                mapJson.file = hashFileName;
                                map = JSON.stringify(mapJson);
                                // Ensure code references the correct map name
                                const mapName = `${hashFileName}.map`;
                                if (/\/\/# sourceMappingURL=/.test(code) || /\/\*# sourceMappingURL=/.test(code)) {
                                    code = code.replace(/sourceMappingURL=[^\n]*/, `sourceMappingURL=${mapName}`);
                                } else {
                                    code += `\n//# sourceMappingURL=${mapName}`;
                                }
                                writeFileSync(outPath + '.map', map, 'utf8');
                            } catch (e) {
                                console.warn('[JS] Failed to adjust source map for', item, e.message);
                            }
                        }

                        writeFileSync(outPath, code, 'utf8');
                        jsManifest[`js/${relPath}`] = `js/${relativePath ? `${relativePath}/` : ''}${hashFileName}`;
                        console.log(`  ✓ Minified ${srcPath.replace('public/', '')} -> ${hashFileName}`);
                    } catch (e) {
                        console.warn('[JS] terser failed for', srcPath, '— falling back to lightweight minify:', e.message);
                        const minified = minifyJs(content);
                        const hash = crypto.createHash('sha256').update(minified).digest('hex').slice(0, 8);
                        const hashFileName = item.replace('.js', `.${hash}.js`);
                        writeFileSync(join(destDir, hashFileName), minified, 'utf8');
                        jsManifest[`js/${relPath}`] = `js/${relativePath ? `${relativePath}/` : ''}${hashFileName}`;
                    }
                } else {
                    const minified = minifyJs(content);
                    const hash = crypto.createHash('sha256').update(minified).digest('hex').slice(0, 8);
                    const hashFileName = item.replace('.js', `.${hash}.js`);
                    writeFileSync(join(destDir, hashFileName), minified, 'utf8');
                    jsManifest[`js/${relPath}`] = `js/${relativePath ? `${relativePath}/` : ''}${hashFileName}`;
                    console.log(`  ✓ Minified ${srcPath.replace('public/', '')} -> ${hashFileName}`);
                }
            } else if (item === 'README.md') {
                copyFileSync(srcPath, destPath);
            }
        }
    }

    await hashRecursive(jsDir, distJsDir);
    return jsManifest;
}
