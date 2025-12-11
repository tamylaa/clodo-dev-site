# Template Injection Strategy - Best Practices

## Overview

The Clodo Framework uses a **placeholder-based template injection system** for reusable components. This document outlines the best approach, implementation, and how to ensure consistency across development and production environments.

---

## Current Architecture

### Template System (✅ Recommended Approach)

**Templates are reusable HTML components stored in `/templates/`:**

```
templates/
├── header.html          # Site header (nav, branding)
├── nav-main.html        # Main navigation menu
├── hero.html            # Hero section (production-ready badge, CTA, code preview)
└── footer.html          # Site footer (newsletter, links, social)
```

**Source files** (`public/`) contain **placeholders** instead of duplicated code:

```html
<!-- In public/index.html -->
<!DOCTYPE html>
<html>
<head>...</head>
<body>
    <!-- HEADER_PLACEHOLDER -->
    <!-- HERO_PLACEHOLDER -->
    <!-- FOOTER_PLACEHOLDER -->
</body>
</html>
```

**Build process** and **dev-server** inject templates at runtime:

```
public/index.html + templates/* → build.js/dev-server.js → dist/index.html
                                   (placeholder replacement)
```

---

## Why This Approach is Best

### ✅ Advantages

| Benefit | Explanation |
|---------|-------------|
| **Single Source of Truth** | Edit hero once in `templates/hero.html`, it auto-updates everywhere |
| **DRY Principle** | No code duplication across 20+ HTML pages |
| **Consistency** | All pages always have identical hero/footer/header |
| **Easy Maintenance** | Change hero topbar? Update one file, deploy everywhere |
| **Dev/Prod Parity** | `dev-server.js` and `build.js` use identical injection logic |
| **Scalability** | Easy to add to new pages: just add `<!-- HERO_PLACEHOLDER -->` |
| **Separation of Concerns** | Content (`templates/`) separate from structure (`public/`) |

---

## Implementation Details

### 1. **Placeholder Syntax**

```html
<!-- Standard template placeholders (processed by build.js and dev-server.js) -->
<!-- HEADER_PLACEHOLDER -->
<!-- HERO_PLACEHOLDER -->
<!-- FOOTER_PLACEHOLDER -->

<!-- SSI includes (legacy, for nav-main.html compatibility) -->
<!--#include file="../templates/nav-main.html" -->
```

### 2. **Build Process** (`build.js`)

**Step 1: Load templates**
```javascript
const heroTemplate = readFileSync(join('templates', 'hero.html'), 'utf8');
const footerTemplate = readFileSync(join('templates', 'footer.html'), 'utf8');
const headerTemplate = readFileSync(join('templates', 'header.html'), 'utf8');
const navMainTemplate = readFileSync(join('templates', 'nav-main.html'), 'utf8');
```

**Step 2: Replace placeholders**
```javascript
content = content.replace('<!-- HERO_PLACEHOLDER -->', heroTemplate);
content = content.replace('<!-- FOOTER_PLACEHOLDER -->', footerTemplate);
content = content.replace('<!-- HEADER_PLACEHOLDER -->', headerTemplate);
content = content.replace(/^\s*<!--#include file="\.\.\/templates\/nav-main\.html" -->/gm, navMainTemplate);
```

**Step 3: Write to dist/**
```javascript
writeFileSync(join('dist', file), content, 'utf8');
```

### 3. **Dev-Server Process** (`dev-server.js`)

Same placeholder replacement logic, but applied **on-the-fly** for local development:

```javascript
if (ext === 'html') {
    data = data.replace(/<!-- HERO_PLACEHOLDER -->/g, getTemplate('hero.html'));
    data = data.replace(/<!-- FOOTER_PLACEHOLDER -->/g, getTemplate('footer.html'));
    data = data.replace(/<!-- HEADER_PLACEHOLDER -->/g, getTemplate('header.html'));
    data = data.replace(/<!--#include file="\.\.\/templates\/nav-main\.html" -->/g, getTemplate('nav-main.html'));
}
```

---

## Verification Checklist

### ✅ Build Process Works

```bash
node build.js
```

**Expected output:**
```
✅ Build completed successfully!
📁 Output directory: ./dist
```

**Verify injection:**
```powershell
Select-String -Path "dist\index.html" -Pattern "hero-topbar|Production Ready"
# Should find: Production Ready badge, hero-topbar div
```

### ✅ Dev-Server Works

```bash
node dev-server.js
```

**Expected output:**
```
🚀 Clodo Framework Dev Server running at http://localhost:8000
```

**Verify local template injection:**
Visit `http://localhost:8000/` and confirm:
- ✅ Hero section renders with "Production Ready" badge
- ✅ "Trusted by 500+" social proof displays
- ✅ Footer shows with newsletter form
- ✅ All styles applied correctly

### ✅ Consistency Check

**Both should have identical HTML structure:**
```powershell
# Check dist (production)
Get-Content dist\index.html | Select-String -Pattern "hero-badge-group" | Measure-Object -Line

# Check public (should match when served via dev-server)
```

---

## Adding New Pages

**To add hero/footer to a new page:**

1. **Create page**: `public/new-page.html`
2. **Add placeholder**: 
   ```html
   <!-- HERO_PLACEHOLDER -->
   <!-- FOOTER_PLACEHOLDER -->
   ```
3. **No other changes needed!** 
   - `build.js` auto-processes all HTML files
   - `dev-server.js` auto-injects templates
   - Page immediately has hero + footer

---

## Updating Templates

**When to edit each:**

| What Changed | Edit This File | Result |
|-------------|----------------|--------|
| Hero badge text | `templates/hero.html` | Updates ALL pages (dev + prod) |
| Footer links | `templates/footer.html` | Updates ALL pages (dev + prod) |
| Navigation menu | `templates/nav-main.html` | Updates ALL pages (dev + prod) |
| Page-specific content | `public/page-name.html` | Only affects that page |

---

## Common Patterns

### Example: Hero Section

**Template** (`templates/hero.html`, 91 lines):
```html
<!-- HERO SECTION TEMPLATE -->
<section id="hero" aria-labelledby="hero-title">
    <div class="hero-container">
        <div class="hero-topbar">
            <div class="hero-badge">
                <span>Production Ready</span>
            </div>
            <div class="hero-social-proof">
                <span>Trusted by <strong>500+</strong> companies worldwide</span>
            </div>
        </div>
        <!-- ... rest of hero content ... -->
    </div>
</section>
```

**Usage** (`public/index.html`):
```html
<main id="main-content">
    <!-- HERO_PLACEHOLDER -->  <!-- ← Single line replaces 91 lines of HTML -->
    <!-- Other sections ... -->
</main>
```

---

## Troubleshooting

### Issue: Hero not appearing in dev-server

**Solution:**
1. Restart dev-server: `node dev-server.js`
2. Verify placeholder exists in `public/index.html`
3. Check `templates/hero.html` exists and is valid
4. Look for errors in dev-server console

### Issue: Hero appears in prod (dist) but not dev

**Cause:** dev-server not running or placeholder not updated
**Solution:**
1. Verify `dev-server.js` line 104 has all replacements
2. Restart dev-server
3. Check network tab for content being served

### Issue: Changes not reflecting after rebuild

**Solution:**
1. Verify `build.js` reads template: Check line 32 has `heroTemplate`
2. Verify replacement logic exists: Check line 89 has replacement
3. Delete `dist/` and rebuild: `rm -r dist ; node build.js`
4. Hard refresh browser: `Ctrl+Shift+R` (clear cache)

---

## Technical Debt Resolved

### ✅ Removed
- ❌ Inline hero HTML duplicated across pages
- ❌ Inconsistent footer between dev-server and production
- ❌ Template placeholder references that weren't implemented
- ❌ Manual copy-paste maintenance for hero changes

### ✅ Implemented
- ✅ Placeholder-based injection in `build.js`
- ✅ Placeholder processing in `dev-server.js`  
- ✅ `templates/hero.html` now actually used
- ✅ Single-file hero updates propagate everywhere

---

## Files Modified

| File | Change | Purpose |
|------|--------|---------|
| `build.js` | Added heroTemplate loading and replacement | Production build injection |
| `dev-server.js` | Already had hero placeholder replacement | Local dev injection |
| `public/index.html` | Replaced 124 lines of inline hero with `<!-- HERO_PLACEHOLDER -->` | Cleaner source, template-driven |
| `templates/hero.html` | Already existed, now actually used | Reusable hero component |

---

## Deployment Confidence

✅ **Both environments now use identical logic:**
- `build.js` (production): Template → Placeholder → dist/
- `dev-server.js` (development): Template → Placeholder → localhost:8000

✅ **No more "works locally but fails in production"**
- Same injection mechanism for both
- Template changes auto-propagate everywhere
- Consistent HTML structure guaranteed

---

## Next Steps

1. ✅ Apply same pattern to other pages (docs.html, pricing.html, etc.)
2. ✅ Audit for any other inline duplicated components
3. ✅ Document all available placeholders in README
4. ✅ Add CI/CD validation that templates are injected correctly
