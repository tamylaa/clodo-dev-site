# Astro Migration Branch - README

## What This Branch Does

This is an experimental branch testing Astro.js as a replacement for the custom build system.

## Key Improvements Over Current Setup

### 1. No More Redirect Loops ✓
- Astro automatically handles URL normalization
- `/pricing`, `/pricing/`, and physical files all work
- Zero redirect management needed
- No `_redirects` file required

### 2. Simplified Build System ✓
- Current: 817 lines of custom `build.js`
- Astro: Single `astro.config.mjs` (~40 lines)
- No manual template path adjustments
- No manual CSS/JS minification

### 3. Better SEO ✓
- Automatic sitemap generation
- RSS feed support built-in
- Automatic open graph tags
- Canonical URL handling

### 4. Template Management ✓
- Current: 12+ template files, manual injection
- Astro: Layout components, automatic reuse
- One `BaseLayout.astro` replaces all templates
- Composable, reusable components

### 5. Blog System ✓
- Current: Custom `generate-blog-post.mjs` script
- Astro: Markdown files in `src/content/blog/`
- Automatic content validation
- Type-safe frontmatter

## Project Structure

```
src/
├── pages/           # Auto-routed pages → URLs
│   ├── index.astro  → /
│   ├── pricing.astro → /pricing & /pricing/
│   ├── product.astro → /product & /product/
│   └── blog/
│       └── [slug].astro → /blog/post-name
├── layouts/         # Reusable page templates
│   └── BaseLayout.astro
├── components/      # Reusable UI components
└── content/
    └── blog/        # Markdown blog posts
        ├── post-1.md
        └── post-2.md

public/             # Static assets (copied as-is)
astro.config.mjs    # Astro configuration
```

## Migration Status

- [ ] Create page files for all 28 HTML pages
- [ ] Convert templates to Astro components
- [ ] Migrate blog posts to Markdown
- [ ] Set up content collections
- [ ] Test build output
- [ ] Verify all routes work
- [ ] Compare performance
- [ ] Ready for merge decision

## How to Test This Branch

```bash
# Install dependencies
npm install

# Build with Astro
npm run build:astro

# Preview
npm run preview:astro

# Compare with current build
npm run build  # Current system
npm run build:astro  # Astro
```

## Key Files Changed

- New: `astro.config.mjs` - Astro configuration
- New: `src/` directory - New project structure
- New: `src/pages/*.astro` - Pages (replace public/*.html)
- New: `src/layouts/*.astro` - Layouts (replace templates/)
- New: `src/content/` - Content collections

## Original Files Preserved

- `public/` - Static assets (CSS, JS, images)
- `templates/` - Original templates (for reference)
- `build/` - Original build scripts (for reference)
- Everything on master branch is unchanged

## Next Steps

1. Copy remaining HTML pages to `src/pages/*.astro`
2. Test each route works correctly
3. Run build and compare output
4. Test on Cloudflare Pages staging
5. Decision: merge if successful, or continue with current approach
