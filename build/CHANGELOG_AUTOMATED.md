## Automated fixes applied by link-normalizer script

- Replaced legacy `.html` internal links with extensionless canonical URLs across `public/` and `dist/`.
- Converted blog internal links `slug.html` -> `/blog/slug` to avoid redirects.
- Updated social share absolute URLs to use extensionless paths.
- Updated `build/generate-blog-post.mjs` to emit extensionless `mainEntityOfPage.@id` in JSON-LD.
- Added `tools/fix-html-links.mjs` (ESM) as the canonical link-normalizer and removed the CommonJS variant.
- Injected the standard navigation (`templates/nav-main.html`) into experiment and other pages flagged by tests to remove navigation warnings.
- Re-ran and confirmed `tests/test-navigation-static.js` now passes with zero failures and zero warnings.
