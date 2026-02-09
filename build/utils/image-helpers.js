/**
 * Responsive-image helpers used by HTML processing and post-build verification.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

/** Escape HTML special characters */
export function escapeHtml(str) {
    return (str || '').replace(/["&<>]/g, s => ({ '"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;' })[s]);
}

/** Load the SEO images manifest (returns [] on failure) */
export function loadImagesManifest() {
    try {
        return JSON.parse(readFileSync(join('data', 'images', 'seo', 'images.json'), 'utf8'));
    } catch {
        console.warn('[IMAGES] No images manifest found at data/images/seo/images.json');
        return [];
    }
}

/** Find image manifest entries for a page, optionally preferring a locale */
export function findImageEntriesForPage(manifest, pageFileName, locale) {
    const entries = manifest.filter(img => Array.isArray(img.pages) && img.pages.includes(pageFileName));
    if (!entries.length) return [];
    if (!locale || locale === 'en') return entries;
    const matching = entries.filter(e => Array.isArray(e.locales) && e.locales.includes(locale));
    return matching.length ? matching : entries;
}

/** Build responsive <picture> markup from an image manifest entry */
export function buildPictureMarkup(entry, pathPrefix) {
    const opt = entry.optimized || {};
    const webp1 = opt.webp_1x || null;
    const webp2 = opt.webp_2x || null;
    const png1 = opt.png_1x || entry.file || null;
    const png2 = opt.png_2x || null;
    const alt = entry.alt || '';
    const width = entry.width || '';
    const height = entry.height || '';

    const strip = (p) => p.replace(/^\//, '');
    const webpSrcset = [webp1 && `${pathPrefix}${strip(webp1)} 1x`, webp2 && `${pathPrefix}${strip(webp2)} 2x`].filter(Boolean).join(', ');
    const pngSrcset = [png1 && `${pathPrefix}${strip(png1)} 1x`, png2 && `${pathPrefix}${strip(png2)} 2x`].filter(Boolean).join(', ');
    const imgSrc = png1 ? `${pathPrefix}${strip(png1)}` : '';

    const picture = ['<picture class="hero-image" aria-hidden="false">'];
    if (webpSrcset) picture.push(`    <source type="image/webp" srcset="${webpSrcset}">`);
    if (pngSrcset) picture.push(`    <source type="image/png" srcset="${pngSrcset}">`);
    picture.push(`    <img src="${imgSrc}" alt="${escapeHtml(alt)}" width="${width}" height="${height}" loading="eager" decoding="async">`);
    picture.push('</picture>');
    return picture.join('\n');
}
