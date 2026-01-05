# Navigation System - Original File Locations

**Purpose:** Reference guide showing where navigation files originally came from before reorganization.

**Date Migrated:** January 5, 2026

---

## CSS Files - Original Locations

| Original Path | New Location | Purpose | Size | Lines |
|---|---|---|---|---|
| `public/css/global/footer.css` | `nav-system/css/global/footer.css` | Footer styling | 22.49 KB | 986 |
| `public/css/global/header.css` | `nav-system/css/global/header.css` | Header/navbar styling | 10.51 KB | 483 |
| `public/css/pages/blog/header.css` | `nav-system/css/pages/blog/header.css` | Blog-specific header styling | 5.27 KB | 263 |

**CSS Legacy Location:** `nav-system/css/legacy/`

---

## JavaScript Files - Original Locations

### Core Logic
| Original Path | New Location | Purpose | Size | Lines |
|---|---|---|---|---|
| `public/js/core/navigation.js` | `nav-system/js/core/navigation.js` | Core navigation logic | 11.16 KB | 454 |
| `public/js/component-nav.js` | `nav-system/js/core/component-nav.js` | Component navigation | 1.18 KB | 38 |

### UI Components
| Original Path | New Location | Purpose | Size | Lines |
|---|---|---|---|---|
| `public/js/ui/navigation-component.js` | `nav-system/js/ui/navigation-component.js` | UI component for navigation | 19.21 KB | 722 |

### Tools
| Original Path | New Location | Purpose | Size | Lines |
|---|---|---|---|---|
| `scripts/analyze-navigation-system.js` | `nav-system/js/tools/analyze-navigation-system.js` | System analysis tool | 8.42 KB | 315 |
| `scripts/audit-nav-files.js` | `nav-system/js/tools/audit-nav-files.js` | File audit tool | 7.89 KB | 290 |
| `scripts/generate-navigation-config.js` | `nav-system/js/tools/generate-navigation-config.js` | Config generation tool | 5.33 KB | 198 |

### Tests
| Original Path | New Location | Purpose | Size | Lines |
|---|---|---|---|---|
| `tests/navigation-test.js` | `nav-system/js/tests/navigation-test.js` | Navigation tests | 4.21 KB | 156 |
| `tests/run-navigation-tests.js` | `nav-system/js/tests/run-navigation-tests.js` | Test runner | 2.87 KB | 107 |
| `tests/test-navigation-static.js` | `nav-system/js/tests/test-navigation-static.js` | Static nav tests | 3.45 KB | 128 |
| `tests/unit/navigation.test.js` | `nav-system/js/tests/unit/navigation.test.js` | Unit tests - navigation | 5.92 KB | 221 |
| `tests/unit/navigation-component.test.js` | `nav-system/js/tests/unit/navigation-component.test.js` | Unit tests - component | 6.34 KB | 236 |

**JS Legacy Location:** `nav-system/js/legacy/`

---

## HTML Template Files - Original Locations

| Original Path | New Location | Purpose | Size | Lines |
|---|---|---|---|---|
| `templates/nav-main.html` | `nav-system/templates/nav-main.html` | Main navigation template | 12.04 KB | 160 |
| `templates/footer.html` | `nav-system/templates/footer.html` | Footer template | 9.11 KB | 131 |
| `templates/content-cluster-nav.html` | `nav-system/templates/content-cluster-nav.html` | Content cluster navigation | 3.36 KB | 50 |
| `templates/components/newsletter-cta-blog-footer.html` | `nav-system/templates/components/newsletter-cta-blog-footer.html` | Newsletter CTA component | 2.14 KB | 32 |
| `templates/components/newsletter-form-footer.html` | `nav-system/templates/components/newsletter-form-footer.html` | Newsletter form component | 2.89 KB | 45 |
| `docs/SCHEMA_SNIPPETS_BREADCRUMBS.html` | `nav-system/templates/components/breadcrumbs-schema.html` | Breadcrumb schema snippets | 1.73 KB | 54 |

**HTML Legacy Location:** `nav-system/templates/legacy/`

---

## Configuration Files - Original Locations

| Original Path | New Location | Purpose | Size | Lines |
|---|---|---|---|---|
| `config/navigation.json` | `nav-system/configs/navigation.json` | Navigation data configuration | 13.57 KB | 553 |
| `config/announcements.json` | `nav-system/configs/announcements.json` | Announcements configuration | 2.21 KB | 84 |

**Config Legacy Location:** `nav-system/configs/legacy/`

---

## Schema Files - Original Locations

| Original Path | New Location | Purpose | Size | Lines |
|---|---|---|---|---|
| `data/blog-data.schema.json` | `nav-system/schemas/blog-data.schema.json` | Blog data schema | 3.72 KB | 124 |
| `data/blog-post.schema.json` | `nav-system/schemas/blog-post.schema.json` | Blog post schema | 8.13 KB | 276 |

**Schema Legacy Location:** `nav-system/schemas/legacy/`

---

## Summary

- **Total Files:** 24
- **Total Size:** 198.5 KB
- **Total Lines:** 8,390
- **Categories:** CSS (3), JS (11), HTML (6), Config (2), Schema (2)
- **Original Locations:** Scattered across 8 directories
- **New Location:** Centralized in `nav-system/`

---

## Organization Rationale

**Why This Structure?**

1. **Discoverability:** All navigation code now in one place
2. **Purpose-based:** Files organized by function (CSS, JS, templates, configs, schemas)
3. **Scalability:** Easy to add new navigation components
4. **Maintenance:** Clear structure for developers
5. **Legacy Reference:** Old locations still accessible

**What This Enables:**

✅ Quick understanding of what navigation files exist  
✅ Easy location of specific CSS, JS, or templates  
✅ Clear dependencies between files  
✅ Better documentation and analysis  
✅ Foundation for future improvements  

---

## Legacy File References

**If you need to access original files:**

- CSS originals: `public/css/global/`, `public/css/pages/blog/`
- JS originals: `public/js/core/`, `public/js/ui/`, `scripts/`, `tests/`
- HTML originals: `templates/`, `docs/`
- Config originals: `config/`
- Schema originals: `data/`

**Note:** Original files have been copied to `nav-system/` but originals remain in place for backwards compatibility during transition.

---

*Navigation System Organization - Original Locations Reference*  
*Created: January 5, 2026*
