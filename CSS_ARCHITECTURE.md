# CSS Architecture Documentation

## 📋 Overview

This document explains the CSS architecture for the Clodo Framework website, including file organization, load order, and critical specificity rules to prevent conflicts.

**Last Updated:** November 26, 2025  
**Created Due To:** Hero subtitle alignment issue caused by CSS cascade conflicts

---

## 🏗️ Build System Architecture

The site uses a **custom build system** (`build.js`) that bundles CSS into **2 files**:

### 1. **Critical CSS** (`critical.css`)
- **Size:** ~35KB
- **Loading:** Inlined in `<head>` for instant rendering
- **Purpose:** Above-the-fold styles needed for initial paint
- **Files Included:**
  - `css/base.css` - CSS variables, resets, typography
  - `css/layout.css` - Grid, containers, basic layout

### 2. **Non-Critical CSS** (`styles.css`)
- **Size:** ~166KB
- **Loading:** Loaded via `<link rel="stylesheet">` 
- **Purpose:** Below-the-fold styles, components, page-specific styles
- **Files Included (in order):**
  - `css/utilities.css`
  - `css/components/buttons.css`
  - `css/components.css`
  - `css/global/header.css`
  - `css/global/footer.css`
  - `css/pages/index/hero.css` ← **Hero styles**
  - `css/pages/index.css`
  - `css/pages/index/features.css`
  - All other page-specific CSS

---

## 📂 File Structure & Responsibilities

```
public/css/
├── base.css              # Foundation (variables, resets, typography)
├── layout.css            # Layout primitives (grid, containers, sections)
├── components.css        # Reusable components (nav, cards, etc.)
├── utilities.css         # Utility classes (.flex, .mt-2, etc.)
├── components/
│   └── buttons.css       # Button component styles
├── global/
│   ├── header.css        # Site header/navigation
│   └── footer.css        # Site footer
└── pages/
    ├── index.css         # Homepage-specific
    ├── index/
    │   ├── hero.css      # Homepage hero section
    │   └── features.css  # Homepage features section
    ├── product.css       # Product page
    ├── about.css         # About page
    └── ...               # Other pages
```

---

## ⚠️ CRITICAL: CSS Specificity & Cascade Rules

### The Problem (Solved Nov 26, 2025)

**Issue:** Hero subtitle was center-aligned instead of left-aligned at 1669px viewport width.

**Root Causes:**
1. `layout.css` (loads first as critical CSS) contains generic hero rules:
   ```css
   .hero-section {
       text-align: center;  /* Line 217 */
   }
   .hero {
       text-align: center;  /* Line 244 */
   }
   ```

2. `hero.css` (loads later as non-critical CSS) has specific rules:
   ```css
   .hero-subtitle {
       text-align: left !important;
   }
   ```

3. **The Cascade Problem:** Parent elements with `text-align: center` cascade down to all children, overriding child-specific rules even with `!important`.

### The Solution

Added nuclear override at the top of `hero.css`:

```css
/* Override generic layout.css hero rules */
#hero {
    text-align: left !important;
}

#hero * {
    text-align: inherit;
}
```

**Why This Works:**
- `#hero` ID selector has higher specificity than `.hero-section` and `.hero` classes
- `!important` ensures it overrides any other rules
- `#hero *` makes all children inherit left alignment
- Forces entire hero section to left-align from parent level down

---

## 🎯 Best Practices & Guidelines

### 1. **Avoid Generic Parent Styles**
❌ **DON'T:**
```css
/* In layout.css */
.hero-section {
    text-align: center;  /* Too generic - affects all hero sections */
}
```

✅ **DO:**
```css
/* In layout.css */
.hero-section {
    /* Only structural/layout properties */
    display: flex;
    flex-direction: column;
    /* NO text-align, color, font properties */
}
```

### 2. **Use Specific Selectors for Content Styles**
❌ **DON'T:**
```css
/* In layout.css (generic/critical) */
.hero {
    text-align: center;
    color: var(--text-primary);
}
```

✅ **DO:**
```css
/* In pages/index/hero.css (specific/non-critical) */
#hero .hero-content {
    text-align: center;
    color: var(--text-primary);
}
```

### 3. **Load Order Matters**

**Critical CSS (inlined):**
- Only structural/layout styles
- No page-specific content styles
- No text-align, colors, or typography beyond base

**Non-Critical CSS (async):**
- All component-specific styles
- All page-specific styles
- Content styles that override base

### 4. **Cascading Text Alignment**

**Parent `text-align` cascades to children:**
```css
/* Parent has text-align */
.parent {
    text-align: center;
}

/* Child inherits center alignment, even with !important */
.child {
    text-align: left !important;  /* ❌ Won't work if parent cascades */
}
```

**Solution: Override at parent level:**
```css
#parent {
    text-align: left !important;  /* ✅ Fixes parent first */
}

.child {
    text-align: inherit;  /* Inherits from parent */
}
```

### 5. **Specificity Hierarchy**

From strongest to weakest:
1. Inline styles: `style="text-align: left"` (avoid in production)
2. ID selectors: `#hero { }` (use for page-specific overrides)
3. Class selectors: `.hero-subtitle { }` (primary method)
4. Element selectors: `p { }` (base styles only)

### 6. **!important Flag Usage**

Use `!important` only when:
- Overriding third-party CSS
- Fixing cascade conflicts from parent elements
- Utility classes that must always win (`.text-left !important`)

❌ **DON'T overuse:** Creates specificity wars and maintenance nightmares.

---

## 🔧 CSS Minification

### Build Process (Fixed Nov 26, 2025)

The `build.js` minification **preserves critical syntax**:

```javascript
// Line-by-line minification
.replace(/\s+!important/g, ' !important')  // Preserve space before !important
.replace(/calc\s*\(\s*/g, 'calc(')         // Preserve calc() syntax
.replace(/\s*{\s*/g, '{')                  // Collapse braces
.replace(/\s*}\s*/g, '}')
.replace(/\s*;\s*/g, ';')
.replace(/\s*:\s*/g, ':')
```

**Why This Matters:**
- Old minification: `.replace(/\s+/g, ' ')` collapsed ALL whitespace
- This broke `!important` → `!important` (invalid CSS)
- New approach: Line-by-line with explicit preservation

---

## 📱 Responsive Breakpoints

```css
/* Mobile: < 768px */
/* Base styles outside media queries */

/* Tablet: 768px - 1023px */
@media (min-width: 768px) { }

/* Desktop: 1024px - 1439px */
@media (min-width: 1024px) { }

/* Large Desktop: 1440px+ */
@media (min-width: 1440px) { }
```

**Critical Note:** Ensure `text-align` and other cascading properties are consistent across ALL breakpoints if used on parent elements.

---

## 🚨 Common Pitfalls

### 1. **Forgetting Cascade Rules**
```css
/* ❌ This won't work as expected */
.parent { text-align: center; }
.parent .child { text-align: left; }  /* Inherits center from parent */
```

### 2. **Over-specific Critical CSS**
```css
/* ❌ DON'T put this in layout.css (critical) */
.hero-section .hero-title {
    font-size: 4rem;
    color: blue;
}

/* ✅ DO put this in pages/index/hero.css (non-critical) */
#hero .hero-title {
    font-size: 4rem;
    color: blue;
}
```

### 3. **Missing !important Across Breakpoints**
```css
/* ❌ Missing !important at 1440px+ */
.hero-subtitle { text-align: left !important; }
@media (min-width: 1440px) {
    .hero-subtitle { text-align: left; }  /* ❌ Will be overridden */
}

/* ✅ Consistent across all breakpoints */
.hero-subtitle { text-align: left !important; }
@media (min-width: 1440px) {
    .hero-subtitle { text-align: left !important; }  /* ✅ Protected */
}
```

---

## 🔍 Debugging CSS Conflicts

### Step 1: Check Load Order
```bash
# View bundled CSS order in build.js
grep -A 50 "const nonCriticalCssFiles" build.js
```

### Step 2: Inspect Computed Styles
1. Open DevTools (F12)
2. Select element
3. Check "Computed" tab
4. Look for crossed-out rules (overridden)

### Step 3: Check Parent Cascade
```javascript
// Check all parent text-align values
let el = document.querySelector('.hero-subtitle');
while (el) {
    console.log(el.className, getComputedStyle(el).textAlign);
    el = el.parentElement;
}
```

### Step 4: Search for Conflicts
```bash
# Find all text-align rules for hero elements
grep -r "text-align" public/css/ | grep -i hero
```

---

## 📝 Maintenance Checklist

When modifying CSS:

- [ ] Check if file is in critical or non-critical bundle
- [ ] Verify parent elements don't cascade conflicting properties
- [ ] Test across all responsive breakpoints (mobile, tablet, desktop, large desktop)
- [ ] Run `npm run build` and verify minification preserves syntax
- [ ] Hard refresh browser (Ctrl+F5) to clear cache
- [ ] Check DevTools for overridden styles
- [ ] Document any new specificity overrides in this file

---

## 🎓 Key Lessons Learned

### Hero Subtitle Alignment Issue (Nov 26, 2025)

**Timeline:**
1. Issue reported: Hero subtitle not left-aligned at 1669px width
2. First fix: CSS minification corrupting `!important` flags
3. Second fix: Missing `!important` on 1440px+ breakpoint
4. Final fix: Generic `.hero-section` and `.hero` in `layout.css` cascading center alignment

**Root Cause:** Parent-level `text-align: center` in generic layout styles cascaded to all children, overriding specific child rules.

**Solution:** Added `#hero { text-align: left !important; }` to override parent-level alignment.

**Takeaway:** 
- Generic layout classes should ONLY contain structural properties (display, grid, flex)
- Content properties (text-align, color, font) should be in page-specific files
- Always test at actual viewport widths, not just Chrome DevTools resize
- Parent cascade beats child specificity for inherited properties

---

## 📚 Related Documentation

- `BUILD_SYSTEM_CONFLICTS.md` - Build system architecture issues
- `BUILD_SYSTEM_FIXES_SUMMARY.md` - Build system fix documentation
- `CSS_MODULARIZATION_FINAL_REPORT.md` - CSS modularization project

---

## 🆘 When You're Lost

If you're debugging CSS and can't figure out why something isn't working:

1. **Check this file first** - Is it a known cascade issue?
2. **Check parent elements** - Use DevTools to inspect computed styles on parents
3. **Check load order** - Critical CSS (layout.css) loads before non-critical (hero.css)
4. **Check specificity** - ID > Class > Element
5. **Check cascade** - Parent `text-align`, `color`, etc. cascade to children
6. **Rebuild** - Run `npm run build` to regenerate bundles
7. **Hard refresh** - Ctrl+F5 to clear browser cache

---

**Remember:** CSS is not just about what you write, but also WHEN it loads and WHAT it inherits. 🎯
