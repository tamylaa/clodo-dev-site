# Clodo Dev Site — Media Strategy

> Last updated: 2026-02-09  
> Status: **Active** — covers images today, video and storage scaling roadmap

---

## 1. Current State

### Storage Snapshot

| Category | Files | Size |
|---|---|---|
| Source originals (`public/images/seo/`) | 4 | 3.6 MB |
| Optimized variants (`public/images/seo/optimized/`) | 10 | 7.1 MB |
| Product demo (SVG + placeholder mp4 + VTT) | 4 | 2.7 KB |
| **Total** | **18** | **~10.7 MB** |

### What Exists Today

```
public/images/
├── product-demo.mp4            ← 28-byte placeholder (not a real video)
├── product-demo.svg            ← SVG diagram fallback
├── product-demo-poster.svg     ← poster for <video>
├── product-demo-captions.vtt   ← WebVTT captions
└── seo/
    ├── hero-cloudflare-collab-1200x630.png        (source)
    ├── architecture-cloudflare-collab.svg          (source)
    ├── benchmark-discord-shopify-github-1200x675.png (source)
    ├── screenshot-collab-features-1280x720.png     (source)
    └── optimized/
        ├── hero-*-1200x630.{png,webp}             (1x)
        ├── hero-*-2400x1260.{png,webp}            (2x retina)
        ├── benchmark-*-1200x675.{png,webp}        (1x)
        ├── benchmark-*-2400x1350.{png,webp}       (2x retina)
        ├── screenshot-*-1280x720.{png,webp}       (1x)
        └── screenshot-*-2560x1440.{png,webp}      (2x retina)
```

### Build Pipeline

1. **Hero injection** — `<div class="hero-visual">` → build injects `<picture>` with first hero-role entry  
2. **Slot injection** (NEW) — `<figure data-media-slot="<manifest-id>">` → build injects the right markup  
3. **Copy to dist** — `build/steps/copy-assets.js` copies `public/images/` recursively  
4. **Cloudflare CDN** — served from Cloudflare Pages edge cache (86,400s for images, immutable for hashed assets)

---

## 2. Media Manifest Schema

All media is registered in `data/images/seo/images.json`. The build reads this at build time.

### Image Entry

```jsonc
{
  "id": "hero-collab",                            // unique, used in data-media-slot="…"
  "file": "/images/seo/hero-cloudflare-collab-1200x630.png",
  "alt": "Descriptive alt text",
  "caption": "Visible caption below the image",
  "width": 1200,
  "height": 630,
  "format": "image/png",                           // or "image/svg+xml"
  "optimized": {
    "png_1x":  "/images/seo/optimized/hero-cloudflare-collab-1200x630.png",
    "webp_1x": "/images/seo/optimized/hero-cloudflare-collab-1200x630.webp",
    "png_2x":  "/images/seo/optimized/hero-cloudflare-collab-2400x1260.png",
    "webp_2x": "/images/seo/optimized/hero-cloudflare-collab-2400x1260.webp"
  },
  "role": "hero",                                  // hero | diagram | benchmark | screenshot
  "pages": ["saas-product-startups-cloudflare-case-studies.html"],
  "locales": ["en"]
}
```

### Video Entry (NEW — ready for use)

```jsonc
{
  "id": "product-demo-video",
  "type": "video",                                 // ← distinguishes from images
  "src": "/images/product-demo.mp4",               // self-hosted path (or R2 URL)
  "poster": "/images/product-demo-poster.svg",
  "captions": "/images/product-demo-captions.vtt",
  "alt": "Demo: validate, deploy, migrate, verify",
  "width": 560,
  "height": 315,
  "mimeType": "video/mp4",
  "role": "demo",
  "pages": ["product.html"],
  "locales": ["en"],

  // For EXTERNAL video hosting (pick one):
  // "external": "stream",                         // Cloudflare Stream
  // "streamId": "abc123...",                       // Stream video ID
  // "streamAccount": "def456..."                   // Stream account hash

  // "external": "youtube",                         // YouTube
  // "embedUrl": "https://www.youtube-nocookie.com/embed/VIDEO_ID"

  // "external": "r2",                              // Cloudflare R2
  // "src": "https://media.clodo.dev/videos/product-demo.mp4"
}
```

### How to Add Media to a Page

1. **Register** the entry in `data/images/seo/images.json`
2. **Add a slot** in the HTML: `<figure class="media-figure" data-media-slot="your-id"><figcaption>Caption</figcaption></figure>`
3. **Run build** — the slot gets filled automatically with the right `<picture>`, `<img>`, `<video>`, or `<iframe>`

---

## 3. Video Hosting Strategy

### Option Comparison

| Option | Cost | Max Size | Encoding | Global CDN | Analytics | SEO |
|---|---|---|---|---|---|---|
| **Self-hosted (Pages)** | Free (within Pages 25 MB limit per file) | 25 MB | You handle | ✅ Cloudflare CDN | ❌ | ✅ `<video>` tag |
| **Cloudflare R2** | $0.015/GB stored + $0.36/M reads | Unlimited | You handle | ✅ via custom domain | ❌ | ✅ `<video>` tag |
| **Cloudflare Stream** | $5/1000 min stored + $1/1000 min viewed | Unlimited | ✅ Auto HLS/DASH | ✅ Built-in | ✅ Built-in | ⚠️ `<iframe>` only |
| **YouTube (unlisted)** | Free | 12 hours | ✅ Auto | ✅ YouTube CDN | ✅ YouTube | ⚠️ `<iframe>`, ad risk |

### Recommended Approach (Tiered)

```
┌─────────────────────────────────────────────────────────┐
│  Tier 1: Short clips < 5 MB (demos, UI walkthroughs)   │
│  → Self-hosted in public/images/ via Cloudflare Pages   │
│  → Best SEO (native <video>), zero cost, fastest TTFB   │
├─────────────────────────────────────────────────────────┤
│  Tier 2: Medium videos 5–100 MB                         │
│  → Cloudflare R2 + custom domain (media.clodo.dev)      │
│  → Native <video>, ~$0.02/GB/month, unlimited size      │
│  → Set "external": "r2" in manifest                     │
├─────────────────────────────────────────────────────────┤
│  Tier 3: Long-form / high-traffic videos                │
│  → Cloudflare Stream (adaptive bitrate, built-in player)│
│  → Set "external": "stream" in manifest                 │
│  → OR YouTube embed for maximum reach                   │
└─────────────────────────────────────────────────────────┘
```

### R2 Setup (When Ready)

```bash
# 1. Create R2 bucket
wrangler r2 bucket create clodo-media

# 2. Set up custom domain in Cloudflare dashboard:
#    media.clodo.dev → R2 bucket "clodo-media"

# 3. Upload video
wrangler r2 object put clodo-media/videos/product-demo.mp4 --file=public/images/product-demo.mp4

# 4. Reference in manifest:
#    "external": "r2",
#    "src": "https://media.clodo.dev/videos/product-demo.mp4"
```

---

## 4. Image Storage Scaling Plan

### Current: 10.7 MB (4 images × ~2.5 variants each)

The PNG originals are the space hog. WebP variants are **94-98% smaller**:

| Image | PNG 1x | WebP 1x | Savings |
|---|---|---|---|
| Hero | 700 KB | 19 KB | 97% |
| Benchmark | 544 KB | 14 KB | 97% |
| Screenshot | 754 KB | 26 KB | 97% |

### Projected Growth

| Milestone | Images | Est. Size (with PNGs) | Est. Size (WebP-only) |
|---|---|---|---|
| Today | 4 | 10.7 MB | ~1 MB |
| 10 pages with images | 30–40 | ~80 MB | ~8 MB |
| 25 pages with images | 75–100 | ~200 MB | ~20 MB |
| 50+ pages | 150+ | **~400 MB** | ~40 MB |

### Cloudflare Pages Limits to Watch

| Limit | Value | Current Usage |
|---|---|---|
| File size | 25 MB per file | ✅ Largest is 1.9 MB |
| Total deployment | 25,000 files | ✅ ~250 files |
| Build output size | 20 GB | ✅ ~11 MB |
| Bandwidth | Unlimited | ✅ |

### Mitigation Strategies (Ordered by When to Implement)

#### Now ✅ Already Done
- WebP variants for all raster images (94-98% smaller than PNG)
- `loading="lazy"` on non-hero images
- Responsive `srcset` with 1x/2x variants
- Build-time injection (no client-side image loading logic)

#### At ~30 Images: Drop PNG Originals from Dist
```javascript
// In build/steps/copy-assets.js, add a filter:
copyRecursive('public/images', 'dist/images', {
    filter: (name) => {
        // Skip source PNGs if WebP exists (keep optimized/ only)
        if (name.endsWith('.png') && !name.includes('optimized'))
            return false;
        return true;
    }
});
```

#### At ~50 Images: Move to R2
- Store originals in R2 (`media.clodo.dev`)
- Keep only optimized WebP in the repo for build
- Build rewrites paths to R2 URLs for large assets

#### At ~100 Images: Automated Pipeline
```
┌──────────┐    ┌────────────┐    ┌───────────┐    ┌──────────┐
│ Drop PNG  │ →  │ sharp/squoosh│ →  │ Upload R2  │ →  │ Update   │
│ in images/│    │ optimize    │    │ + CDN     │    │ manifest │
│ source/   │    │ WebP+AVIF  │    │           │    │ .json    │
└──────────┘    └────────────┘    └───────────┘    └──────────┘
```

Consider adding an `npm run optimize-images` script:
```bash
# Using sharp (already Node-native):
npx sharp-cli resize public/images/seo/source/*.png \
  --width 1200 --format webp --quality 80 \
  --output public/images/seo/optimized/
```

#### Future: AVIF Support
AVIF offers ~50% better compression than WebP. Add to the manifest:
```jsonc
"optimized": {
    "avif_1x": "/images/seo/optimized/hero-1200x630.avif",
    "webp_1x": "/images/seo/optimized/hero-1200x630.webp",
    "png_1x":  "/images/seo/optimized/hero-1200x630.png"
}
```

The `buildPictureMarkup()` function can be extended to emit `<source type="image/avif">` as the first source.

---

## 5. CDN Caching Strategy (Already Configured)

Current `_headers` rules:

| Pattern | Cache-Control | Notes |
|---|---|---|
| `*.png`, `*.jpg`, `*.svg`, `*.webp` | `public, max-age=86400` | 24h — could increase to 1yr with hash |
| `*.css`, `*.js` | `public, max-age=31536000, immutable` | ✅ Content-hashed filenames |
| `*.html` | `public, max-age=3600, stale-while-revalidate=86400` | 1h + 24h stale |

### Recommended Improvement: Hash Image Filenames

Currently images use static filenames. When we start using `content-hash` for images (like we do for CSS/JS), update the `_headers`:

```
/images/seo/optimized/*
  Cache-Control: public, max-age=31536000, immutable
```

This would require the build to:
1. Hash image files at build time
2. Update the manifest with hashed paths
3. Inject hashed paths into HTML

This is a later optimization — current 24h cache is fine for now.

---

## 6. Adding Media to a New Page (Checklist)

```markdown
### Quick Checklist

- [ ] Create/obtain the image or video asset
- [ ] For images: generate optimized variants (1x PNG, 1x WebP, 2x PNG, 2x WebP)
- [ ] Place files in `public/images/seo/` (source) and `public/images/seo/optimized/` (variants)
- [ ] Add entry to `data/images/seo/images.json` with correct id, alt, dimensions, pages
- [ ] Add `<figure data-media-slot="your-id">` in the HTML where you want it
- [ ] For hero images: ensure `<div class="hero-visual">` exists and entry has `"role": "hero"`
- [ ] Run `node build/build.js --dir public` and verify in dist
- [ ] Check alt text is descriptive for accessibility
- [ ] For videos > 5 MB: consider R2 instead of self-hosting
```

---

## 7. Architecture Diagram

```
Author workflow:

  1. Create asset   2. Register in manifest   3. Add HTML slot       4. Build
  ┌──────────┐      ┌────────────────────┐     ┌──────────────────┐   ┌─────────┐
  │ PNG/SVG  │  →   │ images.json        │  →  │ data-media-slot  │ → │ build.js│
  │ or video │      │ {id, file, alt...} │     │ in <figure>      │   │         │
  └──────────┘      └────────────────────┘     └──────────────────┘   └────┬────┘
                                                                           │
  Output in dist:                                                          ▼
  ┌──────────────────────────────────────────────────────────────────────────┐
  │ <figure data-media-slot="benchmark-discord-shopify-github">             │
  │   <picture class="media-image">                                        │
  │     <source type="image/webp" srcset="…1x, …2x">                      │
  │     <source type="image/png"  srcset="…1x, …2x">                      │
  │     <img src="…" alt="…" width="1200" height="675" loading="lazy">     │
  │   </picture>                                                           │
  │   <figcaption>Real-world median page-load improvement…</figcaption>    │
  │ </figure>                                                              │
  └──────────────────────────────────────────────────────────────────────────┘

  For SVG:  → <img class="media-diagram" src="….svg">
  For video: → <video class="media-video" controls> or <iframe> (Stream/YT)
```

---

## 8. Key Files Reference

| File | Purpose |
|---|---|
| `data/images/seo/images.json` | Media manifest (source of truth) |
| `data/schemas/page-config.json` | Page → image ID mapping |
| `build/utils/image-helpers.js` | All markup builders + slot injector |
| `build/steps/process-html.js` | Calls hero + slot injection during build |
| `build/steps/copy-assets.js` | Copies images/ to dist/ |
| `build/steps/finalize.js` | Post-build SEO verification |
| `public/_headers` | CDN cache rules for image types |
