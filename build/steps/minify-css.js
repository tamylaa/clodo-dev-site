/**
 * Minify individual CSS files from public/css/ → dist/css/.
 * (Separate from the bundling step – handles files loaded directly.)
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { minifyCssContent } from '../utils/css-minify.js';

export function minifyIndividualCss() {
    console.log('[CSS] Minifying individual CSS...');
    const cssDir = join('public', 'css');
    const distCssDir = join('dist', 'css');

    if (!existsSync(cssDir)) return;

    mkdirSync(distCssDir, { recursive: true });

    readdirSync(cssDir)
        .filter(file => file.endsWith('.css'))
        .forEach(file => {
            const content = readFileSync(join(cssDir, file), 'utf8');
            writeFileSync(join(distCssDir, file), minifyCssContent(content), 'utf8');
        });
}
