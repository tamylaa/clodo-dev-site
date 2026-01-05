# Navigation System - Data Flow & Architecture

**Purpose:** Complete documentation of how data flows through the navigation system, from config to display.

**Date:** January 5, 2026

---

## 🔄 COMPLETE DATA FLOW DIAGRAM

```
┌──────────────────────────────────────────────────────────────────┐
│                      CONFIGURATION LAYER                          │
├──────────────────────────────────────────────────────────────────┤
│  navigation.json         announcements.json      blog-data.json   │
│  (Menu structure)        (Site notices)         (Blog metadata)   │
└─────────┬───────────────────┬────────────────────────┬───────────┘
          │                   │                        │
          └───────────────────┼────────────────────────┘
                              ▼
                ┌─────────────────────────────┐
                │   Template Engine           │
                │   (Astro/SSG Processor)     │
                └──────────┬──────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                   ▼
   ┌──────────┐  ┌──────────────┐  ┌─────────────┐
   │ nav-main │  │footer.html   │  │breadcrumb   │
   │.html     │  │              │  │.html        │
   └────┬─────┘  └──────┬───────┘  └──────┬──────┘
        │               │                  │
        └───────────────┼──────────────────┘
                        ▼
        ┌──────────────────────────────────┐
        │   CSS Layer (Styling)            │
        │  ├─ header.css                   │
        │  ├─ footer.css                   │
        │  ├─ navigation.css               │
        │  └─ CSS Variables                │
        └────────────┬─────────────────────┘
                     ▼
        ┌──────────────────────────────────┐
        │   HTML Rendered (Browser)        │
        │  All elements with classes       │
        └────────────┬─────────────────────┘
                     ▼
        ┌──────────────────────────────────┐
        │   JavaScript Initialization      │
        │  ├─ navigation.js (core)         │
        │  ├─ navigation-component.js (UI) │
        │  └─ component-nav.js (helpers)   │
        └────────────┬─────────────────────┘
                     ▼
        ┌──────────────────────────────────┐
        │   Event Listeners Attached       │
        │  Ready for user interaction      │
        └──────────────────────────────────┘
```

---

## 📊 DETAILED DATA FLOW STEPS

### STEP 1: Configuration Loading

```
navigation.json (config file)
│
├─ Menu items array
│  ├─ { id, label, href, icon, children }
│  ├─ { id, label, href, icon, children }
│  └─ { id, label, href, icon, children }
│
├─ Metadata
│  ├─ activeLink (current page)
│  └─ branding (logo, company name)
│
└─ Settings
   ├─ mobileBreakpoint
   ├─ maxLevels
   └─ scrollBehavior
```

**File:** [nav-system/configs/navigation.json](../configs/navigation.json)

**Sample:**
```json
{
  "items": [
    {
      "id": "docs",
      "label": "Documentation",
      "href": "/docs",
      "icon": null,
      "children": []
    },
    {
      "id": "resources",
      "label": "Resources",
      "href": null,
      "icon": "chevron-down",
      "children": [
        { "id": "blog", "label": "Blog", "href": "/blog" },
        { "id": "guides", "label": "Guides", "href": "/guides" }
      ]
    }
  ]
}
```

---

### STEP 2: Template Processing

```
Astro/Template Engine
│
├─ Read configuration
│
├─ Process templates
│  ├─ Inject config data
│  ├─ Generate HTML
│  └─ Resolve imports
│
└─ Output HTML
```

**Templates Generated:**

```html
<!-- Generated HTML -->
<nav class="nav-main" role="navigation">
  <!-- nav-main.html processes config.items -->
  <ul class="nav-menu">
    <li><a href="/docs">Documentation</a></li>
    <li class="has-submenu">
      <button class="nav-toggle">Resources</button>
      <ul class="submenu">
        <li><a href="/blog">Blog</a></li>
        <li><a href="/guides">Guides</a></li>
      </ul>
    </li>
  </ul>
</nav>
```

---

### STEP 3: CSS Application

```
CSS Cascade
│
├─ Inheritance
│  ├─ Font family: sans-serif
│  ├─ Color: #333
│  └─ Line height: 1.5
│
├─ Specificity Resolution
│  ├─ Element selector (.nav-main)
│  ├─ Class selector (.nav-item)
│  └─ ID selector (#main-nav)
│
├─ Media Queries
│  ├─ Desktop (≥768px)
│  │  └─ Horizontal layout
│  └─ Mobile (<768px)
│     └─ Vertical stacked layout
│
└─ Output: Styled HTML
```

**Files:** [header.css](../css/header.css), [footer.css](../css/footer.css)

**Class Application:**
```css
/* header.css */
.nav-main {
  background-color: var(--color-header-bg);
  padding: var(--spacing-lg);
  display: flex;
  justify-content: space-between;
}

.nav-menu {
  display: flex;
  list-style: none;
  gap: var(--spacing-md);
}

.nav-item.active > a {
  color: var(--color-active);
  border-bottom: 2px solid var(--color-active);
}

@media (max-width: 767px) {
  .nav-menu {
    flex-direction: column;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    display: none;
  }
  
  .nav-menu.open {
    display: flex;
  }
}
```

---

### STEP 4: Browser Rendering

```
HTML + CSS → Computed Styles
│
├─ Parse HTML
├─ Build DOM tree
├─ Apply CSS rules
├─ Calculate layouts
└─ Paint to screen
```

**Result:** Visual navigation UI in browser

---

### STEP 5: JavaScript Initialization

```
JavaScript Execution
│
├─ Load navigation.js
│  ├─ State initialization
│  └─ Function definitions
│
├─ Load navigation-component.js
│  ├─ Class definition
│  └─ Method definitions
│
├─ Application code
│  ├─ const nav = new NavigationComponent(config)
│  ├─ nav.mount(container)
│  ├─ nav.on('itemClick', handler)
│  └─ await Navigation.init(options)
│
└─ Ready state
```

---

### STEP 6: Event Listener Attachment

```
Event System
│
├─ DOM Event Listeners
│  ├─ click → item activation
│  ├─ hover → submenu visibility
│  ├─ keyboard → accessibility
│  └─ resize → responsive behavior
│
├─ Custom Event Listeners (via Navigation.on())
│  ├─ beforeNavigate
│  ├─ afterNavigate
│  ├─ scrollRestored
│  └─ linkHighlighted
│
└─ Ready for user interaction
```

---

### STEP 7: User Interaction

```
User Action
│
├─ Click on navigation link
│  │
│  ├─ Browser captures click
│  │
│  ├─ JavaScript event handler fires
│  │  ├─ Trigger: beforeNavigate
│  │  ├─ Update URL (history.pushState)
│  │  ├─ Trigger: afterNavigate
│  │  └─ Update active link
│  │
│  ├─ CSS class changes
│  │  ├─ Remove active from old link
│  │  └─ Add active to new link
│  │
│  └─ Browser repaints
│     ├─ Visual update to navigation
│     └─ User sees active state
│
└─ Navigation complete
```

---

## 🔗 ACTIVE LINK DETECTION FLOW

```
Current Page URL
│
├─ Navigation.getCurrentPath()
│  └─ window.location.pathname
│
├─ Match against menu items
│  ├─ navigation.js → updateActiveLinks()
│  └─ Compare path with item.href
│
├─ Apply active state
│  ├─ Add class: .active
│  ├─ Add attribute: aria-current="page"
│  └─ Update parent items
│
└─ Update CSS
   └─ .nav-item.active { color: highlight }
```

**Example:**

```javascript
// Current page: /blog/post-1

// Menu items:
const items = [
  { href: '/', label: 'Home' },
  { href: '/docs', label: 'Docs' },
  { href: '/blog', label: 'Blog' },
  { href: '/guides', label: 'Guides' }
];

// Match logic
function updateActiveLinks(pathname) {
  items.forEach(item => {
    if (pathname.startsWith(item.href)) {
      // /blog/post-1 starts with /blog
      element.classList.add('active');
      element.setAttribute('aria-current', 'page');
    }
  });
}

// Result: Blog link marked active
```

---

## 🔄 BREADCRUMB GENERATION FLOW

```
Page URL
│
├─ /blog/my-article
│
├─ Parse segments
│  ├─ ['blog', 'my-article']
│
├─ Generate breadcrumbs
│  ├─ / → Home
│  ├─ /blog → Blog
│  ├─ /blog/my-article → My Article (current)
│
├─ Render breadcrumb.html
│  ├─ Home > Blog > My Article
│  └─ Add schema.json markup
│
└─ Display
   └─ <nav class="breadcrumb">...</nav>
```

**Generation Function:**

```javascript
function generateBreadcrumbs(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = [
    { label: 'Home', href: '/', isCurrent: false }
  ];
  
  let path = '';
  segments.forEach((segment, index) => {
    path += `/${segment}`;
    const isLast = index === segments.length - 1;
    const label = formatLabel(segment);
    
    breadcrumbs.push({
      label,
      href: isLast ? null : path,
      isCurrent: isLast
    });
  });
  
  return breadcrumbs;
}

// Example result:
// [
//   { label: 'Home', href: '/', isCurrent: false },
//   { label: 'Blog', href: '/blog', isCurrent: false },
//   { label: 'My Article', href: null, isCurrent: true }
// ]
```

---

## 📨 NEWSLETTER FLOW

```
Newsletter Signup
│
├─ User enters email
│  ├─ newsletter-signup.html
│  └─ newsletter-footer.html
│
├─ Client-side validation
│  ├─ Email format check
│  ├─ Non-empty validation
│  └─ Visual feedback
│
├─ Submit to server
│  ├─ POST /api/newsletter/subscribe
│  ├─ { email: "user@example.com" }
│
├─ Server-side validation
│  ├─ Email validation
│  ├─ Duplicate check
│  └─ List management
│
└─ Response
   ├─ Success
   │  ├─ Clear form
   │  └─ Show success message
   └─ Error
      └─ Show error message
```

---

## 🎯 RESPONSIVE BEHAVIOR FLOW

```
Page Load
│
├─ Get viewport width
│  └─ window.innerWidth
│
├─ Check breakpoint
│  ├─ < 768px → Mobile
│  └─ ≥ 768px → Desktop
│
├─ Apply layout
│  ├─ Mobile
│  │  ├─ Hamburger menu
│  │  ├─ Vertical stack
│  │  └─ Collapse dropdowns
│  └─ Desktop
│     ├─ Horizontal menu
│     ├─ Hover dropdowns
│     └─ Full navigation
│
├─ Listen to resize
│  ├─ Calculate new width
│  ├─ Compare with breakpoint
│  └─ If changed, re-apply layout
│
└─ Continuous responsiveness
```

---

## 🔍 SEARCH INTERACTION FLOW

```
User clicks search
│
├─ Show search input
│  ├─ Focus input
│  └─ Clear previous query
│
├─ User types query
│  ├─ Debounce (300ms)
│  ├─ Send request
│  └─ Show results
│
├─ Results display
│  ├─ Search results panel
│  ├─ Highlighted matches
│  └─ Result count
│
├─ User selects result
│  ├─ Navigate to page
│  ├─ Close search
│  └─ Trigger navigation flow
│
└─ Search complete
```

---

## 🔐 ANNOUNCEMENT FLOW

```
announcements.json
│
├─ Announcement data
│  ├─ id
│  ├─ type (info, warning, alert)
│  ├─ message
│  ├─ link
│  └─ dismissible
│
├─ Template processes
│  ├─ Check display conditions
│  └─ Render announcement bar
│
├─ CSS styling
│  ├─ Color based on type
│  ├─ Position (sticky top)
│  └─ Dismiss button styling
│
├─ JavaScript behavior
│  ├─ Listen for dismiss
│  ├─ Save to localStorage
│  └─ Don't show again
│
└─ Display
   └─ Show to user (if not dismissed)
```

---

## 📱 MOBILE MENU FLOW

```
Mobile Menu Interaction
│
├─ User clicks hamburger
│  ├─ Trigger toggleMobileMenu()
│  └─ Toggle: show/hide
│
├─ Menu transitions
│  ├─ Slide animation
│  ├─ Backdrop fade
│  └─ 300ms duration
│
├─ User navigates
│  ├─ Click item
│  ├─ Trigger navigation
│  ├─ Close menu
│  └─ Hide backdrop
│
├─ Escape key
│  ├─ Close menu
│  └─ Return focus
│
└─ Click outside
   ├─ Close menu
   └─ Return focus
```

---

## 🎨 THEME APPLICATION FLOW

```
CSS Variables (design tokens)
│
├─ Color palette
│  ├─ --color-primary: #007acc
│  ├─ --color-secondary: #f0f0f0
│  ├─ --color-text: #333
│  └─ --color-text-light: #666
│
├─ Spacing system
│  ├─ --spacing-xs: 4px
│  ├─ --spacing-sm: 8px
│  ├─ --spacing-md: 16px
│  ├─ --spacing-lg: 24px
│  └─ --spacing-xl: 32px
│
├─ Typography
│  ├─ --font-family-base: -apple-system, ...
│  ├─ --font-size-base: 16px
│  ├─ --font-size-lg: 18px
│  └─ --line-height-base: 1.5
│
├─ Applied in CSS
│  ├─ background: var(--color-primary)
│  ├─ padding: var(--spacing-lg)
│  └─ font-family: var(--font-family-base)
│
└─ Consistent design
   └─ All components themed uniformly
```

---

## 📊 STATISTICS

| Metric | Value |
|--------|-------|
| Configuration files | 2 |
| Template files | 6 |
| CSS files | 3 |
| JavaScript modules | 3 core, 3 tools, 5 tests |
| Data points per config | 20-50 |
| CSS variables | 30+ |
| Event types | 6+ |
| Responsive breakpoints | 3+ |

---

*Navigation System - Data Flow & Architecture*  
*Version 1.0 | Created January 5, 2026*  
*Complete guide to how data flows through the navigation system*
