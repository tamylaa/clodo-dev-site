import { readdirSync, statSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, relative, dirname } from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let sharp = null;
try { sharp = require('sharp'); } catch (e) { /* sharp not installed */ }

function walk(dir, cb) {
    for (const entry of readdirSync(dir)) {
        const p = join(dir, entry);
        const stat = statSync(p);
        if (stat.isDirectory()) walk(p, cb); else cb(p);
    }
}

export async function optimizeImages() {
    console.log('[Images] Optimizing images and generating responsive variants...');
    const src = join('public', 'images');
    const dest = join('dist', 'images');
    const manifestDir = join('data', 'images', 'seo');
    const manifestPath = join(manifestDir, 'images.json');
    const manifest = [];

    if (!existsSync(src)) { console.log('   ℹ️  No public/images directory found. Skipping image optimization.'); return; }

    mkdirSync(dest, { recursive: true });

    const tasks = [];
    walk(src, (filePath) => {
        const rel = relative(src, filePath).replace(/\\/g, '/');
        const outBase = join(dest, rel);
        const outDir = dirname(outBase);
        mkdirSync(outDir, { recursive: true });

        const entry = { id: rel.replace(/[^a-z0-9-_.]/gi, '_'), file: `/images/${rel}`, optimized: {} };

        // Copy original
        try { writeFileSync(join(dest, rel), readFileSync(filePath)); } catch (e) { console.warn('   ⚠️  Failed to copy image', filePath, e.message); }

        if (!sharp) {
            manifest.push(entry);
            return;
        }

        // Generate two widths (1x and 2x) as avif + webp
        const widths = [800, 1600];
        widths.forEach(w => {
            tasks.push((async () => {
                try {
                    // AVIF first
                    try {
                        const avifBuf = await sharp(filePath).resize({ width: w }).avif({ quality: 50 }).toBuffer();
                        const avifName = rel.replace(/(\.[^.]+)$/, `-${w}w.avif`);
                        const avifOut = join(dest, avifName);
                        mkdirSync(dirname(avifOut), { recursive: true });
                        writeFileSync(avifOut, avifBuf);
                        if (w === 800) entry.optimized.avif_1x = `/images/${avifName}`;
                        if (w === 1600) entry.optimized.avif_2x = `/images/${avifName}`;
                    } catch (e) {
                        // AVIF may fail on older sharp builds; continue to webp
                        console.warn('   ⚠️  sharp AVIF conversion failed for', filePath, e.message);
                    }

                    // WebP fallback
                    const buf = await sharp(filePath).resize({ width: w }).webp({ quality: 80 }).toBuffer();
                    const name = rel.replace(/(\.[^.]+)$/, `-${w}w.webp`);
                    const out = join(dest, name);
                    mkdirSync(dirname(out), { recursive: true });
                    writeFileSync(out, buf);
                    if (w === 800) entry.optimized.webp_1x = `/images/${name}`;
                    if (w === 1600) entry.optimized.webp_2x = `/images/${name}`;
                } catch (e) {
                    console.warn('   ⚠️  sharp conversion failed for', filePath, e.message);
                }
            })());
        });

        manifest.push(entry);
    });

    // Wait for all image tasks to finish
    try { await Promise.all(tasks); } catch (e) { /* ignore individual failures already logged */ }

    // Write manifest
    try {
        mkdirSync(manifestDir, { recursive: true });
        writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
        console.log(`   ✅ Image manifest written to ${manifestPath} (${manifest.length} entries)`);
    } catch (e) {
        console.warn('   ⚠️  Failed to write image manifest:', e.message);
    }
}
