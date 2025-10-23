# HERO LAYOUT OVERRIDE APPLIED (FINAL)

Date: October 23, 2025
Status: ✅ Applied in code

## Summary
To resolve the layout/viewport/container constraint conflict, we removed the global `hero` class from the homepage hero section and added a page-specific override. This decouples the homepage hero from `layout.css`'s `.hero` defaults (max-width: 800px; centered text) so the hero background can be full-width while the inner content stays properly constrained.

## What changed

- HTML (public/index.html)
  - `<section id="hero" class="hero" ...>` → `<section id="hero" ...>`

- CSS (public/css/pages/index.css)
  - Added:
    ```css
    #hero.hero {
      max-width: none;
      width: 100%;
      margin: 0;
      text-align: left;
    }
    ```
    Note: After removing `class="hero"`, this override is defensive for future cases where the class might be reintroduced.

- Existing improvements retained:
  - `.hero-container { max-width: 1200px; padding: 0 clamp(1.5rem, 5vw, 3rem); }`
  - `.hero-container { gap: min(clamp(2rem, 8vw, 6rem), 48px); }` (caps ultra-wide gap)

## Why
- `layout.css` defines a global `.hero` block component that is center-aligned and constrained to 800px. The homepage hero requires:
  - Full-bleed background (100vw via pseudo-elements)
  - Constrained inner content (grid + max-width + responsive padding)
  - Left-aligned text styles per page design

Removing the global class prevents unintended constraints and avoids selector battles.

## Verification
- Build: ✅ Successful
- Dev server: ✅ http://localhost:8000
- Visual checks:
  - Background spans full width
  - Content constrained by `.hero-container`
  - Gap capped at 48px on ultra-wide
  - Mobile/Tablet unchanged

## Notes
- If global `.hero` is desired elsewhere, keep using it. The homepage hero now uses its own page-specific styles without relying on the global `.hero` block.
- If re-adding `class="hero"` to the homepage section, the `#hero.hero` override in page CSS will prevent regressions.

## Commit message suggestion
"Fix: Decouple homepage hero from global .hero constraints; ensure full-bleed background with constrained container and capped ultra-wide gap"
