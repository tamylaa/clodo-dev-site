# Navigation System - Dependencies & Integration Map

**Purpose:** Complete mapping of dependencies, imports, and integration points across the navigation system.

**Date:** January 5, 2026

---

## 🗺️ DEPENDENCY GRAPH

```
┌─────────────────────────────────────────┐
│     Configuration Layer                 │
├─────────────────────────────────────────┤
│  navigation.json   announcements.json    │
│  blog-data.json    breadcrumb.schema.json│
└────────────────┬──────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
   ┌──────────┐    ┌──────────────┐
   │ Templates│    │ CSS          │
   │ (HTML)   │    │ (Styling)    │
   └────┬─────┘    └──────┬───────┘
        │                 │
        │    ┌────────────┘
        │    │
        └────┴─────────┬──────────────┐
                       ▼              ▼
                   ┌──────────────────────────┐
                   │ Browser DOM              │
                   │ (Rendered HTML + Styles) │
                   └────────────┬─────────────┘
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
         ┌─────────────┐            ┌──────────────────┐
         │ JavaScript  │            │ Event Listeners  │
         │ Modules     │            │ & Interactions   │
         └─────┬───────┘            └──────────────────┘
               │
       ┌───────┼────────┐
       ▼       ▼        ▼
    Core    UI Comp   Helpers
    Nav     Component  Nav
```

---

## 📦 INTERNAL DEPENDENCIES

### JavaScript Module Imports

#### Core Module: navigation.js

```javascript
// navigation.js - NO EXTERNAL DEPENDENCIES
// Uses only vanilla JavaScript APIs:
// - window.location, window.history
// - document.querySelector, etc.
// - localStorage
// - Event system
```

**Functions exposed:**
- `init(options)`
- `navigateTo(path, options)`
- `goBack()`
- `goForward()`
- `on(event, callback)`
- `off(event, callback)`
- `smoothScroll(target, offset)`
- `getCurrentPath()`
- `getState()`

**Used by:**
- `navigation-component.js` (as parent module)
- Test files (for testing)
- Application code (for initialization)

---

#### UI Component: navigation-component.js

```javascript
// navigation-component.js
import * as Navigation from './navigation.js';          // ✓ Internal
import { getNavTarget, isNavElement } from './component-nav.js'; // ✓ Internal
// NO external dependencies
```

**Imports:**
1. `navigation.js` - Core navigation logic
2. `component-nav.js` - Utility functions

**Exports:**
- Class: `NavigationComponent`
- Methods: constructor, mount, unmount, render, setState, etc.

**Used by:**
- Application initialization code
- Templates (indirectly through script tags)

---

#### Helper Module: component-nav.js

```javascript
// component-nav.js
// NO IMPORTS - Pure utility module
// Exports only functions:
// - delegateNavClick()
// - getNavTarget()
// - isNavElement()
```

**Dependencies:** None (vanilla JS utilities)

**Used by:**
- `navigation-component.js`

---

### Tool Dependencies

#### Tool 1: analyze-navigation-system.js

```javascript
// analyze-navigation-system.js
import * as fs from 'fs';                        // Node.js built-in
import * as path from 'path';                    // Node.js built-in

// Analyzes:
// - file structure
// - component relationships
// - complexity metrics
```

**Dependencies:**
- Node.js `fs` module
- Node.js `path` module

**Output:**
- Console reports
- JSON analysis

---

#### Tool 2: audit-nav-files.js

```javascript
// audit-nav-files.js
import * as fs from 'fs';                        // Node.js built-in
import * as path from 'path';                    // Node.js built-in
// Generates inventory of all files
```

**Dependencies:**
- Node.js `fs` module
- Node.js `path` module

---

#### Tool 3: generate-navigation-config.js

```javascript
// generate-navigation-config.js
// Creates or validates navigation config
// No external dependencies
```

---

### Test Dependencies

#### Test Framework Setup

```javascript
// navigation.test.js
// Uses simple custom test framework
// NO external dependencies (Jest, Mocha, etc.)

// Test utilities:
// - describe(name, tests)
// - it(name, test)
// - expect(value).toBe(expected)
// - before/after hooks
```

**Test files:**
1. `navigation.test.js` - Tests for core module
2. `navigation-component.test.js` - Tests for UI component
3. `navigation-test.js` - Integration tests
4. `test-navigation-static.js` - Static tests
5. `run-navigation-tests.js` - Test runner

---

## 🎯 CSS DEPENDENCIES

### CSS Import Chain

```
header.css
├─ Import or reference to:
│  ├─ CSS variables (--color-*, --spacing-*)
│  ├─ Font files
│  └─ Icon fonts
│
├─ Applies to:
│  ├─ .nav-main
│  ├─ .nav-menu
│  ├─ .nav-item
│  ├─ .submenu
│  └─ Mobile-specific selectors
│
└─ Used in:
   └─ nav-main.html (via <link> tag)


footer.css
├─ Applies to:
│  ├─ .footer
│  ├─ .footer-section
│  ├─ .footer-links
│  ├─ .newsletter-*
│  └─ Mobile-specific selectors
│
└─ Used in:
   ├─ footer.html
   └─ newsletter-footer.html


blog/header.css (if exists)
├─ Blog-specific header styling
└─ Extends base header styles
```

### CSS Variable Dependencies

**Design Tokens Used:**

```css
:root {
  /* Colors */
  --color-primary: #007acc;
  --color-secondary: #f0f0f0;
  --color-text: #333;
  --color-text-light: #666;
  --color-border: #e0e0e0;
  --color-active: #007acc;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Typography */
  --font-family-base: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --line-height-base: 1.5;
  
  /* Transitions */
  --transition-duration: 200ms;
  --transition-easing: ease-in-out;
}
```

**CSS files referencing variables:**
- `header.css` - Uses color, spacing, font variables
- `footer.css` - Uses color, spacing, font variables
- `navigation.css` - Uses transition, color variables

---

## 🔗 TEMPLATE DEPENDENCIES

### Template Inheritance Chain

```
base.html (parent)
├─ Defines: <html>, <head>, <body> structure
├─ Includes: External CSS/JS
│
├─ nav-main.html (included)
│  ├─ Requires: header.css
│  ├─ Requires: navigation.js
│  ├─ Requires: navigation-component.js
│  └─ Data: navigation.json items
│
├─ footer.html (included)
│  ├─ Requires: footer.css
│  ├─ Includes: newsletter-footer.html (nested)
│  └─ Data: footer.json (if exists)
│
├─ breadcrumb.html (included on specific pages)
│  ├─ Requires: navigation.css
│  ├─ Data: Generated breadcrumbs
│  └─ Embedded: breadcrumb-schema.json
│
└─ Content region
   └─ Page-specific content
```

### Data Requirements per Template

```javascript
// nav-main.html requires:
{
  items: Array<MenuItem>,           // From navigation.json
  logo: { text, href },
  activeLink: string,               // Current path
  showSearch: boolean,
  isMobile: boolean                 // Viewport detection
}

// footer.html requires:
{
  sections: Array<FooterSection>,   // From footer.json or static
  social: Array<SocialLink>,
  copyright: string,
  newsletter: NewsletterConfig      // For nested template
}

// newsletter-signup.html requires:
{
  title: string,
  subtitle: string,
  placeholder: string,
  submitText: string,
  formAction: string                // API endpoint
}

// breadcrumb.html requires:
{
  breadcrumbs: Array<Breadcrumb>,   // Generated from URL
  showSchema: boolean               // Include JSON-LD
}
```

---

## 📊 CONFIGURATION FILE DEPENDENCIES

### navigation.json

```json
{
  "items": [
    {
      "id": "string",
      "label": "string",
      "href": "string|null",
      "icon": "string|null",
      "children": "array|undefined"
    }
  ],
  "settings": {
    "mobileBreakpoint": "number (px)",
    "maxLevels": "number",
    "activeClass": "string",
    "scrollOffset": "number (px)"
  }
}
```

**Used by:**
- `nav-main.html` (template rendering)
- `navigation-component.js` (initialization)
- Tests (fixture data)

**Depends on:**
- Valid URL paths (internal or absolute)
- Icon names (matching CSS icon font)
- Unique IDs (for tracking/events)

---

### announcements.json

```json
{
  "items": [
    {
      "id": "string",
      "type": "info|warning|alert",
      "message": "string",
      "link": "string|null",
      "dismissible": "boolean",
      "activeFrom": "ISO date string",
      "activeTo": "ISO date string"
    }
  ]
}
```

**Used by:**
- Announcement display logic
- Templates (if included)

**Depends on:**
- Valid URLs for links
- Valid date formats
- Type values matching CSS classes

---

### blog-data.schema.json

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "title": { "type": "string" },
    "slug": { "type": "string" },
    "content": { "type": "string" },
    "date": { "type": "string", "format": "date" },
    "author": { "type": "string" },
    "tags": { "type": "array", "items": { "type": "string" } }
  }
}
```

**Used by:**
- Blog post validation
- Metadata extraction
- Schema definition for IDEs

---

### breadcrumb-schema.json

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": "number",
      "name": "string",
      "item": "string (URL)"
    }
  ]
}
```

**Used by:**
- SEO - Search engine indexing
- Rich snippets in search results
- Breadcrumb navigation display

---

## 🎛️ CONFIGURATION & ENVIRONMENT DEPENDENCIES

### Build Configuration

```javascript
// vite.config.js
// Configures: module bundling, dev server, build output
// Used by: Build process, Dev server

// postcss.config.js
// Configures: CSS processing, autoprefixing
// Used by: CSS pipeline

// tsconfig.json (if TypeScript)
// Configures: TypeScript compilation
// Used by: TypeScript compiler

// playwright.config.js
// Configures: Test runner
// Used by: Test execution
```

### Runtime Environment

```
window object (Browser API)
├─ location - Current URL info
├─ history - Navigation history
├─ localStorage - Persistent storage
└─ document - DOM access

Node.js (Tools/Build)
├─ fs - File system
├─ path - Path utilities
└─ module system - Import/require
```

---

## 🔄 CIRCULAR DEPENDENCY CHECK

**Result: ✅ NO CIRCULAR DEPENDENCIES**

```
navigation.js
    ↓
    No imports
    ✓ Safe

navigation-component.js
    ↓
    Imports: navigation.js, component-nav.js
    ✓ No back-references

component-nav.js
    ↓
    No imports
    ✓ Safe

Templates
    ↓
    No imports (HTML)
    ✓ Safe

CSS
    ↓
    No imports/dependencies
    ✓ Safe
```

---

## 🔌 INTEGRATION POINTS

### Browser Runtime Integration

```javascript
// Global object exposure
window.Navigation = {
  init,
  navigateTo,
  goBack,
  goForward,
  on,
  off,
  smoothScroll
};

// DOM Integration
document.addEventListener('DOMContentLoaded', () => {
  // Initialize navigation
});

// Event System
window.addEventListener('popstate', () => {
  // Handle browser back/forward
});

window.addEventListener('resize', () => {
  // Handle responsive changes
});
```

### Template Integration

```html
<!-- CSS -->
<link rel="stylesheet" href="/css/header.css">
<link rel="stylesheet" href="/css/footer.css">

<!-- Navigation component -->
<nav class="nav-main"></nav>

<!-- JavaScript modules -->
<script type="module" src="/js/navigation.js"></script>
<script type="module" src="/js/navigation-component.js"></script>

<!-- Initialization -->
<script type="module">
  import * as Navigation from './navigation.js';
  import { NavigationComponent } from './navigation-component.js';
  
  await Navigation.init();
</script>
```

---

## 📦 EXTERNAL DEPENDENCIES

**Result: ✅ ZERO EXTERNAL DEPENDENCIES**

Navigation system uses only:
- ✓ Vanilla JavaScript (ES6+)
- ✓ Browser APIs (DOM, History, localStorage)
- ✓ Node.js built-ins (for tools)
- ✓ CSS (no preprocessors required)
- ✓ HTML5 semantic elements

**No npm packages required** for core functionality!

---

## 🧪 TEST DEPENDENCIES

### Test Framework

**Custom built-in framework:**
```javascript
// No external test library needed
function describe(name, tests) { }
function it(name, test) { }
function expect(actual) {
  return {
    toBe(expected) { },
    toEqual(expected) { },
    toContain(item) { }
  }
}
```

### Test Files

```
tests/
├─ navigation.test.js (221 lines)
├─ navigation-component.test.js (236 lines)
├─ navigation-test.js (156 lines)
├─ test-navigation-static.js (128 lines)
└─ run-navigation-tests.js (runner)
```

---

## 🚀 DEPLOYMENT DEPENDENCIES

### Production Build

```
Source Files
├─ *.js (ES6 modules)
├─ *.html (templates)
├─ *.css (stylesheets)
└─ *.json (configs)

Build Process (Vite/Astro)
├─ Bundle modules
├─ Minify code
├─ Optimize images
├─ Generate source maps
└─ Output to /dist

Deployment
└─ Static files ready
   ├─ No runtime dependencies
   ├─ No server required
   └─ Works on any static host
```

---

## 📋 DEPENDENCY CHECKLIST

| Component | Internal Deps | External Deps | Browser APIs | Status |
|-----------|---------------|---------------|--------------|--------|
| navigation.js | None | None | DOM, History, localStorage | ✅ Ready |
| navigation-component.js | navigation.js, component-nav.js | None | DOM | ✅ Ready |
| component-nav.js | None | None | DOM | ✅ Ready |
| Templates | - | None | - | ✅ Ready |
| CSS | None | None | - | ✅ Ready |
| Tools | Node.js fs, path | None | - | ✅ Ready |
| Tests | Custom framework | None | - | ✅ Ready |

---

## 💡 DEPENDENCY MANAGEMENT BEST PRACTICES

1. **Keep modules independent** - Each module handles one concern
2. **No circular dependencies** - Always one-way dependency flow
3. **Use configuration objects** - Pass data, not instances
4. **Export clean interfaces** - Hide implementation details
5. **Document all dependencies** - Make integration clear
6. **Test in isolation** - Each module can be tested alone
7. **Minimize external dependencies** - Reduces complexity and security risk

---

*Navigation System - Dependencies & Integration Map*  
*Version 1.0 | Created January 5, 2026*  
*Complete reference for all dependencies and integration patterns*
