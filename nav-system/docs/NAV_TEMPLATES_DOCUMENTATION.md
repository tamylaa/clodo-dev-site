# Navigation System - HTML Templates Documentation

**Purpose:** Complete reference for all HTML templates used in navigation, footers, breadcrumbs, and announcements.

**Date:** January 5, 2026  
**Files Covered:** 6 HTML template files (30.27 KB, 1,854 lines)

---

## 📋 TEMPLATES OVERVIEW

| Template | Size | Lines | Purpose |
|----------|------|-------|---------|
| nav-main.html | 5.23 KB | 184 | Main navigation bar |
| footer.html | 6.14 KB | 267 | Footer with links |
| newsletter-signup.html | 1.89 KB | 78 | Newsletter form |
| newsletter-footer.html | 2.34 KB | 104 | Footer newsletter |
| breadcrumb.html | 3.45 KB | 156 | Breadcrumb trail |
| breadcrumb-schema.json | 11.22 KB | 465 | JSON-LD schema |

---

## 🎯 TEMPLATE 1: nav-main.html

**Purpose:** Primary navigation bar component  
**Size:** 5.23 KB | **Lines:** 184  
**Location:** `nav-system/templates/nav-main.html`

### Structure

```html
<nav class="nav-main" role="navigation" aria-label="Main navigation">
  <!-- Skip links -->
  <a href="#main-content" class="skip-link">Skip to content</a>
  
  <!-- Brand/Logo -->
  <div class="nav-brand">
    <a href="/" class="logo">CLODO</a>
  </div>
  
  <!-- Primary Menu -->
  <ul class="nav-menu" role="menubar">
    <li role="none">
      <a href="/docs" role="menuitem">Documentation</a>
    </li>
    <li role="none" class="has-submenu">
      <button class="nav-toggle" aria-expanded="false">
        Resources
        <span class="icon-chevron"></span>
      </button>
      <ul class="submenu" role="menu">
        <li><a href="/blog">Blog</a></li>
        <li><a href="/guides">Guides</a></li>
      </ul>
    </li>
  </ul>
  
  <!-- Right side actions -->
  <div class="nav-actions">
    <button class="nav-search" aria-label="Search">
      <span class="icon-search"></span>
    </button>
    <button class="mobile-menu-toggle" aria-label="Toggle menu">
      <span class="hamburger"></span>
    </button>
  </div>
</nav>
```

### Data Requirements

**Props Passed to Template:**

```javascript
{
  items: [
    {
      id: 'docs',
      label: 'Documentation',
      href: '/docs',
      icon: null,
      children: []
    },
    {
      id: 'resources',
      label: 'Resources',
      href: null,
      icon: 'chevron-down',
      children: [
        { id: 'blog', label: 'Blog', href: '/blog' },
        { id: 'guides', label: 'Guides', href: '/guides' }
      ]
    }
  ],
  logo: { text: 'CLODO', href: '/' },
  activeLink: '/docs'
}
```

### CSS Classes

| Class | Purpose | Modifiers |
|-------|---------|-----------|
| `.nav-main` | Root element | - |
| `.nav-brand` | Brand/logo section | - |
| `.logo` | Logo link | - |
| `.nav-menu` | Menu list | - |
| `.nav-item` | Individual menu item | `.active`, `.has-submenu` |
| `.submenu` | Nested menu | - |
| `.nav-actions` | Action buttons | - |
| `.nav-toggle` | Dropdown toggle | `[aria-expanded]` |
| `.mobile-menu-toggle` | Mobile menu button | - |
| `.skip-link` | Screen reader link | - |

### JavaScript Interaction

```javascript
// Initialize navigation
const navComponent = new NavigationComponent({
  items: navigationData.items,
  callbacks: {
    onItemClick: (item) => {
      // Update URL
      // Close mobile menu
      // Trigger navigation
    },
    onMenuToggle: (state) => {
      // Update aria-expanded
      // Animate dropdown
    }
  }
});

navComponent.mount(document.querySelector('.nav-main'));
```

### Accessibility Features

- **ARIA roles:** `navigation`, `menubar`, `menuitem`
- **Keyboard support:** Tab, Enter, Escape, Arrow keys
- **Skip links:** `<a href="#main-content" class="skip-link">`
- **Current page:** `aria-current="page"`
- **Menu states:** `aria-expanded` on toggle buttons
- **Labels:** `aria-label` on interactive elements

### Responsive Behavior

```css
/* Desktop: Horizontal menu */
@media (min-width: 768px) {
  .nav-menu {
    display: flex;
    flex-direction: row;
  }
  .submenu {
    position: absolute;
    visibility: hidden;
    opacity: 0;
  }
  .nav-item:hover .submenu {
    visibility: visible;
    opacity: 1;
  }
}

/* Mobile: Vertical stacked menu */
@media (max-width: 767px) {
  .nav-menu {
    display: none;
    flex-direction: column;
  }
  .nav-menu.open {
    display: flex;
  }
  .mobile-menu-toggle {
    display: block;
  }
}
```

---

## 🎯 TEMPLATE 2: footer.html

**Purpose:** Footer with multiple sections, links, legal info  
**Size:** 6.14 KB | **Lines:** 267  
**Location:** `nav-system/templates/footer.html`

### Structure

```html
<footer class="footer" role="contentinfo">
  <!-- Footer content -->
  <div class="footer-container">
    <!-- Column 1: Product -->
    <section class="footer-section">
      <h3 class="footer-title">Product</h3>
      <ul class="footer-links">
        <li><a href="/features">Features</a></li>
        <li><a href="/pricing">Pricing</a></li>
        <li><a href="/security">Security</a></li>
      </ul>
    </section>
    
    <!-- Column 2: Company -->
    <section class="footer-section">
      <h3 class="footer-title">Company</h3>
      <ul class="footer-links">
        <li><a href="/about">About</a></li>
        <li><a href="/blog">Blog</a></li>
        <li><a href="/careers">Careers</a></li>
      </ul>
    </section>
    
    <!-- Column 3: Legal -->
    <section class="footer-section">
      <h3 class="footer-title">Legal</h3>
      <ul class="footer-links">
        <li><a href="/privacy">Privacy Policy</a></li>
        <li><a href="/terms">Terms of Service</a></li>
        <li><a href="/cookies">Cookie Policy</a></li>
      </ul>
    </section>
    
    <!-- Column 4: Social/Contact -->
    <section class="footer-section">
      <h3 class="footer-title">Connect</h3>
      <div class="social-links">
        <a href="https://twitter.com/..." aria-label="Twitter">
          <span class="icon-twitter"></span>
        </a>
        <a href="https://github.com/..." aria-label="GitHub">
          <span class="icon-github"></span>
        </a>
      </div>
    </section>
  </div>
  
  <!-- Newsletter section -->
  <div class="footer-newsletter">
    {% include 'newsletter-footer.html' %}
  </div>
  
  <!-- Bottom bar -->
  <div class="footer-bottom">
    <p class="copyright">&copy; 2024 CLODO. All rights reserved.</p>
    <ul class="footer-meta">
      <li><a href="/sitemap">Sitemap</a></li>
      <li><a href="/rss">RSS Feed</a></li>
    </ul>
  </div>
</footer>
```

### Data Requirements

```javascript
{
  sections: [
    {
      title: 'Product',
      links: [
        { text: 'Features', href: '/features' },
        { text: 'Pricing', href: '/pricing' }
      ]
    },
    // ... more sections
  ],
  social: [
    { platform: 'twitter', url: 'https://twitter.com/...' },
    { platform: 'github', url: 'https://github.com/...' }
  ],
  copyright: '&copy; 2024 CLODO. All rights reserved.',
  newsletter: { /* newsletter data */ }
}
```

### CSS Classes

| Class | Purpose |
|-------|---------|
| `.footer` | Root footer element |
| `.footer-container` | Main content wrapper |
| `.footer-section` | Column section |
| `.footer-title` | Section heading |
| `.footer-links` | Links list |
| `.footer-newsletter` | Newsletter section |
| `.footer-bottom` | Bottom bar |
| `.copyright` | Copyright text |
| `.social-links` | Social media icons |

### Newsletter Integration

Includes `newsletter-footer.html` template for email signup form.

### Accessibility

- **Role:** `contentinfo`
- **Semantic elements:** `<section>`, proper heading hierarchy
- **Link labels:** `aria-label` on icon links
- **Focus management:** Tab order preserved through sections

---

## 🎯 TEMPLATE 3: newsletter-signup.html

**Purpose:** Standalone newsletter signup form  
**Size:** 1.89 KB | **Lines:** 78  
**Location:** `nav-system/templates/newsletter-signup.html`

### Structure

```html
<div class="newsletter-signup">
  <h3 class="newsletter-title">Subscribe to Our Newsletter</h3>
  <p class="newsletter-subtitle">
    Get updates delivered to your inbox
  </p>
  
  <form class="newsletter-form" id="newsletter-form">
    <div class="form-group">
      <label for="email" class="sr-only">Email address</label>
      <input
        type="email"
        id="email"
        name="email"
        placeholder="Enter your email"
        required
        aria-label="Email address"
      />
    </div>
    
    <button type="submit" class="btn btn-primary">
      Subscribe
    </button>
    
    <p class="newsletter-privacy">
      We respect your privacy.
      <a href="/privacy">Privacy Policy</a>
    </p>
  </form>
  
  <div class="newsletter-status" role="status" aria-live="polite">
    <!-- Success/Error messages -->
  </div>
</div>
```

### Data Requirements

```javascript
{
  title: 'Subscribe to Our Newsletter',
  subtitle: 'Get updates delivered to your inbox',
  placeholder: 'Enter your email',
  submitText: 'Subscribe',
  privacyText: 'We respect your privacy. Privacy Policy'
}
```

### JavaScript Behavior

```javascript
// Form submission
document.getElementById('newsletter-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  
  try {
    // Send to server
    const response = await fetch('/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    if (response.ok) {
      // Show success message
      // Clear form
    } else {
      // Show error message
    }
  } catch (error) {
    // Handle error
  }
});
```

### Validation

```javascript
// Email validation
email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)

// Server-side validation (required)
```

---

## 🎯 TEMPLATE 4: newsletter-footer.html

**Purpose:** Newsletter signup in footer  
**Size:** 2.34 KB | **Lines:** 104  
**Location:** `nav-system/templates/newsletter-footer.html`

### Structure

Similar to `newsletter-signup.html` but optimized for footer:

```html
<div class="newsletter-footer">
  <div class="newsletter-content">
    <h4 class="newsletter-title">Stay Updated</h4>
    <form class="newsletter-form" id="footer-newsletter">
      <input
        type="email"
        placeholder="your@email.com"
        required
      />
      <button type="submit">Subscribe</button>
    </form>
  </div>
</div>
```

### Differences from newsletter-signup.html

| Aspect | Signup | Footer |
|--------|--------|--------|
| Title | Full description | Minimal text |
| Layout | Vertical/stacked | Inline horizontal |
| Subtitle | Yes | No |
| Privacy text | Yes | Minimal |
| Width | Full width | Flexible |

---

## 🎯 TEMPLATE 5: breadcrumb.html

**Purpose:** Breadcrumb navigation trail  
**Size:** 3.45 KB | **Lines:** 156  
**Location:** `nav-system/templates/breadcrumb.html`

### Structure

```html
<nav class="breadcrumb" aria-label="Breadcrumb">
  <ol class="breadcrumb-list">
    <li class="breadcrumb-item">
      <a href="/">Home</a>
    </li>
    <li class="breadcrumb-item">
      <a href="/blog">Blog</a>
    </li>
    <li class="breadcrumb-item active">
      <span aria-current="page">Article Title</span>
    </li>
  </ol>
  
  <!-- Schema markup -->
  <script type="application/ld+json">
    { /* breadcrumb schema */ }
  </script>
</nav>
```

### Data Generation

**Server-side generation:**

```javascript
function generateBreadcrumbs(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = [
    { label: 'Home', href: '/' }
  ];
  
  let path = '';
  segments.forEach((segment, index) => {
    path += `/${segment}`;
    const isLast = index === segments.length - 1;
    
    breadcrumbs.push({
      label: formatLabel(segment),
      href: isLast ? null : path,
      isCurrent: isLast
    });
  });
  
  return breadcrumbs;
}
```

### CSS Classes

| Class | Purpose |
|-------|---------|
| `.breadcrumb` | Root element |
| `.breadcrumb-list` | Ordered list |
| `.breadcrumb-item` | Individual item |
| `.breadcrumb-item.active` | Current page |
| `.breadcrumb-separator` | Visual separator |

### Styling

```css
/* Default separators with ::after pseudo-element */
.breadcrumb-item::after {
  content: '›';
  margin: 0 8px;
  color: var(--color-text-secondary);
}

.breadcrumb-item:last-child::after {
  content: '';
}

/* Accessible separator span */
.breadcrumb-separator {
  margin: 0 8px;
  color: var(--color-text-secondary);
  aria-hidden: true;
}
```

### Accessibility

- **ARIA:** `aria-label="Breadcrumb"`, `aria-current="page"`
- **Semantic:** `<nav>`, `<ol>`, `<li>`
- **Screen readers:** Current page marked with `aria-current`

---

## 🎯 TEMPLATE 6: breadcrumb-schema.json

**Purpose:** JSON-LD structured data for breadcrumbs  
**Size:** 11.22 KB | **Lines:** 465  
**Location:** `nav-system/templates/breadcrumb-schema.json`

### Schema Structure

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://example.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Blog",
      "item": "https://example.com/blog"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Article Title",
      "item": "https://example.com/blog/article-title"
    }
  ]
}
```

### Generation Function

```javascript
function generateBreadcrumbSchema(breadcrumbs) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": item.href || window.location.href
    }))
  };
}
```

### Embedding in HTML

```html
<script type="application/ld+json">
  {% include 'breadcrumb-schema.json' %}
</script>
```

---

## 🔄 TEMPLATE DEPENDENCIES

### Import Hierarchy

```
base.html (main layout)
├─ nav-main.html         (primary nav)
├─ footer.html           (footer)
│  └─ newsletter-footer.html (nested)
├─ breadcrumb.html       (page-specific)
│  └─ breadcrumb-schema.json (embedded script)
└─ newsletter-signup.html (opt-in section)
```

### CSS Dependencies

| Template | CSS File | Classes |
|----------|----------|---------|
| nav-main.html | header.css | `.nav-*` |
| footer.html | footer.css | `.footer-*` |
| breadcrumb.html | navigation.css | `.breadcrumb-*` |
| newsletter-*.html | footer.css | `.newsletter-*` |

### JavaScript Dependencies

| Template | JS Module | Purpose |
|----------|-----------|---------|
| nav-main.html | navigation-component.js | Rendering, interaction |
| footer.html | - | Static HTML |
| breadcrumb.html | navigation.js | Active link detection |
| newsletter-*.html | Custom handler | Form submission |

---

## 💾 DATA FLOW

### Rendering Flow

```
Config Data (navigation.json)
    ↓
Template Engine (Astro/Template processor)
    ↓
nav-main.html → Renders with config items
    ↓
NavigationComponent JS initialization
    ↓
Event listeners attached
    ↓
Navigation ready
```

### Dynamic Updates

```
User interacts (click, hover)
    ↓
JavaScript event handler
    ↓
Navigation.js updates state
    ↓
Component re-renders
    ↓
CSS classes updated
    ↓
Display updates
```

---

## 📊 STATISTICS

| Metric | Value |
|--------|-------|
| Total Template Files | 6 |
| Total Lines | 1,854 |
| Total Size | 30.27 KB |
| Reusable Templates | 3 |
| CSS Classes Defined | 45+ |
| Accessibility Features | 12+ |

---

*Navigation System - HTML Templates Documentation*  
*Version 1.0 | Created January 5, 2026*  
*Complete reference for all templates used in navigation system*
