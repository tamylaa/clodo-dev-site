/**
 * Media helpers — responsive images, SVG diagrams, and video markup.
 *
 * Supports three injection mechanisms:
 *   1. Hero injection  – inserts the first manifest image inside <div class="hero-visual">
 *   2. Slot injection  – fills every <figure data-media-slot="<id>"> with the matching
 *                        manifest entry (image *or* video)
 *   3. Future: external video via Cloudflare Stream / R2 URLs in the manifest
 *
 * Manifest entry shapes (data/images/seo/images.json):
 *   Image  – { id, file, alt, caption, width, height, format, optimized:{…}, role, pages, locales }
 *   Video  – { id, type:"video", src, poster, captions, alt, width, height, role, pages, locales,
 *              external?: "stream"|"r2"|"youtube" }
 */
import { readFileSync } from 'fs';
import { join } from 'path';

/* ────────────────────────── tiny helpers ────────────────────────── */

/** Escape HTML special characters */
export function escapeHtml(str) {
    return (str || '').replace(/["&<>]/g, s => ({ '"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;' })[s]);
}

/** Strip leading slash so path-prefix concatenation works */
const strip = (p) => (p || '').replace(/^\//, '');

/* ────────────────────────── manifest loading ───────────────────── */

/** Load the media manifest (returns [] on failure) */
export function loadImagesManifest() {
    try {
        return JSON.parse(readFileSync(join('data', 'images', 'seo', 'images.json'), 'utf8'));
    } catch {
        console.warn('[MEDIA] No manifest found at data/images/seo/images.json');
        return [];
    }
}

/** Find manifest entries for a page, optionally preferring a locale */
export function findImageEntriesForPage(manifest, pageFileName, locale) {
    const entries = manifest.filter(img => Array.isArray(img.pages) && img.pages.includes(pageFileName));
    if (!entries.length) return [];
    if (!locale || locale === 'en') return entries;
    const matching = entries.filter(e => Array.isArray(e.locales) && e.locales.includes(locale));
    return matching.length ? matching : entries;
}

/** Find a single manifest entry by its id */
export function findEntryById(manifest, id) {
    return manifest.find(e => e.id === id) || null;
}

/* ────────────────────────── image markup ────────────────────────── */

/**
 * Build responsive <picture> markup.
 * @param {object}  entry       Manifest image entry
 * @param {string}  pathPrefix  e.g. '/' or '../'
 * @param {object}  [opts]      { cssClass, loading, role }
 */
export function buildPictureMarkup(entry, pathPrefix, opts = {}) {
    const opt = entry.optimized || {};
    const cssClass = opts.cssClass || 'hero-image';
    const loading  = opts.loading  || 'eager';

    const webp1 = opt.webp_1x || null;
    const webp2 = opt.webp_2x || null;
    const png1  = opt.png_1x || entry.file || null;
    const png2  = opt.png_2x || null;
    const alt    = entry.alt || '';
    const width  = entry.width || '';
    const height = entry.height || '';

    const webpSrcset = [webp1 && `${pathPrefix}${strip(webp1)} 1x`, webp2 && `${pathPrefix}${strip(webp2)} 2x`].filter(Boolean).join(', ');
    const pngSrcset  = [png1  && `${pathPrefix}${strip(png1)} 1x`,  png2  && `${pathPrefix}${strip(png2)} 2x`].filter(Boolean).join(', ');
    const imgSrc     = png1 ? `${pathPrefix}${strip(png1)}` : '';

    const picture = [`<picture class="${cssClass}" aria-hidden="false">`];
    if (webpSrcset) picture.push(`    <source type="image/webp" srcset="${webpSrcset}">`);
    if (pngSrcset)  picture.push(`    <source type="image/png" srcset="${pngSrcset}">`);
    picture.push(`    <img src="${imgSrc}" alt="${escapeHtml(alt)}" width="${width}" height="${height}" loading="${loading}" decoding="async">`);
    picture.push('</picture>');
    return picture.join('\n');
}

/**
 * Build inline <img> for SVG entries (no <picture> wrapper needed).
 */
export function buildSvgMarkup(entry, pathPrefix, opts = {}) {
    const cssClass = opts.cssClass || 'media-svg';
    const loading  = opts.loading  || 'lazy';
    const src = entry.optimized?.svg || entry.file || '';
    return `<img class="${cssClass}" src="${pathPrefix}${strip(src)}" alt="${escapeHtml(entry.alt || '')}" width="${entry.width || ''}" height="${entry.height || ''}" loading="${loading}" decoding="async">`;
}

/* ────────────────────────── video markup ────────────────────────── */

/**
 * Build <video> markup from a manifest entry with type:"video".
 *
 * Supports self-hosted (local), Cloudflare Stream, R2, and YouTube.
 * @param {object} entry       Manifest video entry
 * @param {string} pathPrefix  e.g. '/' or '../'
 */
export function buildVideoMarkup(entry, pathPrefix) {
    const alt     = escapeHtml(entry.alt || '');
    const width   = entry.width  || 560;
    const height  = entry.height || 315;
    const poster  = entry.poster ? `${pathPrefix}${strip(entry.poster)}` : '';
    const src     = entry.src || entry.file || '';

    // YouTube / external embed → responsive iframe
    if (entry.external === 'youtube' && entry.embedUrl) {
        return [
            `<div class="media-video-wrapper" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden">`,
            `    <iframe src="${escapeHtml(entry.embedUrl)}" title="${alt}" width="${width}" height="${height}" style="position:absolute;top:0;left:0;width:100%;height:100%" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`,
            `</div>`,
        ].join('\n');
    }

    // Cloudflare Stream → uses stream.cloudflarestream.com iframe
    if (entry.external === 'stream' && entry.streamId) {
        return [
            `<div class="media-video-wrapper" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden">`,
            `    <iframe src="https://customer-${entry.streamAccount || ''}.cloudflarestream.com/${entry.streamId}/iframe" title="${alt}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>`,
            `</div>`,
        ].join('\n');
    }

    // Self-hosted or R2 → native <video> element
    const videoSrc = entry.external === 'r2' ? src : `${pathPrefix}${strip(src)}`;
    const captions = entry.captions ? `${pathPrefix}${strip(entry.captions)}` : '';
    const lines = [
        `<video class="media-video" controls preload="metadata" width="${width}" height="${height}"${poster ? ` poster="${poster}"` : ''} aria-label="${alt}">`,
        `    <source src="${videoSrc}" type="${entry.mimeType || 'video/mp4'}">`,
    ];
    if (captions) {
        lines.push(`    <track kind="captions" src="${captions}" srclang="en" label="English captions">`);
    }
    lines.push(`    <p>Your browser does not support the video element. <a href="${videoSrc}">Download the video</a>.</p>`);
    lines.push(`</video>`);
    return lines.join('\n');
}

/* ────────────────────── unified media builder ──────────────────── */

/**
 * Build the right markup for any manifest entry (image or video).
 * @param {object} entry       Manifest entry
 * @param {string} pathPrefix  e.g. '/' or '../'
 * @param {object} [opts]      Passed through to image builders
 */
export function buildMediaMarkup(entry, pathPrefix, opts = {}) {
    if (!entry) return '';

    // Video entry
    if (entry.type === 'video') {
        return buildVideoMarkup(entry, pathPrefix);
    }

    // SVG diagram
    if (entry.format === 'image/svg+xml' || (entry.file || '').endsWith('.svg')) {
        return buildSvgMarkup(entry, pathPrefix, { cssClass: 'media-diagram', loading: 'lazy', ...opts });
    }

    // Raster image (PNG/JPG/WebP) – responsive <picture>
    return buildPictureMarkup(entry, pathPrefix, { cssClass: 'media-image', loading: 'lazy', ...opts });
}

/* ────────────────────── slot injection engine ──────────────────── */

/**
 * Scan HTML for <figure data-media-slot="<id>"> and inject the matching
 * manifest entry's markup inside, preserving the existing <figcaption>.
 *
 * @param {string} content         HTML string
 * @param {Array}  manifest        Full media manifest
 * @param {string} pathPrefix      e.g. '/' or '../'
 * @param {string} fileName        Current page filename for logging
 * @returns {string}               Updated HTML
 */
export function injectMediaSlots(content, manifest, pathPrefix, fileName) {
    // Match <figure … data-media-slot="id" …>…</figure>
    const slotRe = /<figure\b[^>]*data-media-slot="([^"]+)"[^>]*>([\s\S]*?)<\/figure>/g;
    let injected = 0;

    content = content.replace(slotRe, (match, slotId, inner) => {
        const entry = findEntryById(manifest, slotId);
        if (!entry) {
            console.warn(`   ⚠️  [MEDIA] No manifest entry for slot "${slotId}" on ${fileName}`);
            return match;  // leave placeholder untouched
        }

        const markup = buildMediaMarkup(entry, pathPrefix);
        if (!markup) return match;

        // Preserve any <figcaption> already in the slot
        const captionMatch = inner.match(/<figcaption[\s\S]*?<\/figcaption>/);
        const caption = captionMatch ? captionMatch[0] : '';

        injected++;
        console.log(`   🖼️  [MEDIA] Injected ${entry.type || entry.format || 'image'} for slot "${slotId}" on ${fileName}`);

        // Rebuild the <figure> with media + caption
        const figAttrs = match.match(/^<figure\b[^>]*/)?.[0] || '<figure';
        return `${figAttrs}>\n        ${markup}\n        ${caption}\n    </figure>`;
    });

    if (injected) console.log(`   ✅ [MEDIA] ${injected} media slot(s) filled on ${fileName}`);
    return content;
}
