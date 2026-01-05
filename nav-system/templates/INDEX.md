# Navigation System - HTML Templates Index

**Location:** `nav-system/templates/`  
**Total Template Files:** 6  
**Total Size:** 30.27 KB  
**Total Lines:** 515  

---

## 📋 HTML Template Files Overview

### Main Navigation Templates

#### 1. Main Navigation Template
**File:** `nav-system/templates/nav-main.html`  
**Original:** `templates/nav-main.html`  
**Size:** 12.04 KB | **Lines:** 160  
**Status:** ACTIVE

**Purpose:**
Primary site navigation menu template rendered in `<header>` with support for desktop dropdowns and mobile hamburger menu.

**Components:**
- Navigation bar container
- Logo/brand link
- Main menu items with dropdown support
- Mobile menu toggle button
- Search/action buttons area

**Data Requirements:**
```javascript
{
  logo: { text: 'Clodo', href: '/' },
  items: [
    { 
      label: 'Home', 
      href: '/',
      icon?: 'home'
    },
    { 
      label: 'Blog', 
      href: '/blog',
      children: [
        { label: 'All Posts', href: '/blog' },
        { label: 'Categories', href: '/blog/categories' }
      ]
    }
  ],
  search?: true,
  actions?: [{ label: 'Sign Up', href: '/signup' }]
}
```

**CSS Dependencies:**
- `nav-system/css/global/header.css`

**JavaScript Dependencies:**
- `nav-system/js/core/navigation.js` (for navigation logic)
- `nav-system/js/ui/navigation-component.js` (for rendering)

**Usage Context:**
Included in `<header>` of main layout template, typically via SSI or build-time inclusion.

**Responsive Behavior:**
- Full menu on desktop (>= 768px)
- Hamburger menu on mobile (< 768px)
- Touch-friendly menu items

---

#### 2. Footer Template
**File:** `nav-system/templates/footer.html`  
**Original:** `templates/footer.html`  
**Size:** 9.11 KB | **Lines:** 131  
**Status:** ACTIVE

**Purpose:**
Site footer component with links, newsletter signup, social media, and copyright information.

**Components:**
- Footer sections (multiple columns)
- Link lists (Products, Company, Resources, etc.)
- Newsletter subscription form
- Social media links
- Copyright/legal information
- Back-to-top button

**Data Requirements:**
```javascript
{
  sections: [
    {
      title: 'Products',
      links: [
        { label: 'CLI', href: '/cli' },
        { label: 'Guide', href: '/guide' }
      ]
    },
    {
      title: 'Company',
      links: [...]
    }
  ],
  newsletter: {
    enabled: true,
    title: 'Stay updated',
    description: 'Subscribe to our newsletter'
  },
  social: [
    { platform: 'twitter', url: 'https://twitter.com/...' },
    { platform: 'github', url: 'https://github.com/...' }
  ],
  copyright: 'Copyright © 2026 Clodo'
}
```

**CSS Dependencies:**
- `nav-system/css/global/footer.css`

**JavaScript Dependencies:**
- Newsletter form handling (client-side)
- Analytics tracking

**Usage Context:**
Included in `<footer>` of main layout template, typically via SSI or build-time inclusion.

**Features:**
- Multi-column layout
- Newsletter CTA component
- Social links
- Legal/copyright info
- Responsive column stacking on mobile

---

#### 3. Content Cluster Navigation
**File:** `nav-system/templates/content-cluster-nav.html`  
**Original:** `templates/content-cluster-nav.html`  
**Size:** 3.36 KB | **Lines:** 50  
**Status:** ACTIVE

**Purpose:**
Contextual navigation for related content clusters (e.g., related blog posts, guide sections).

**Components:**
- Cluster title
- Related content list
- Links to related items
- Item metadata (category, date, etc.)

**Data Requirements:**
```javascript
{
  title: 'Related Posts',
  items: [
    {
      title: 'Getting Started',
      href: '/blog/getting-started',
      date: '2026-01-01',
      category: 'Tutorial'
    }
  ]
}
```

**CSS Dependencies:**
- `nav-system/css/global/header.css` (for general styling)
- Page-specific CSS

**JavaScript Dependencies:**
- None (static component)

**Usage Context:**
Included in sidebars or content areas of blog/guide pages.

---

### Component Templates

#### 4. Newsletter CTA Blog Footer
**File:** `nav-system/templates/components/newsletter-cta-blog-footer.html`  
**Original:** `templates/components/newsletter-cta-blog-footer.html`  
**Size:** 2.14 KB | **Lines:** 32  
**Status:** ACTIVE

**Purpose:**
Call-to-action component for newsletter signup positioned at end of blog articles.

**Components:**
- Headline/description
- Email input field
- Subscribe button
- Optional: checkbox for consent

**Data Requirements:**
```javascript
{
  headline: 'Subscribe to our blog',
  description: 'Get updates on web performance',
  placeholder: 'Enter your email',
  buttonText: 'Subscribe'
}
```

**CSS Dependencies:**
- `nav-system/css/global/footer.css`

**JavaScript Dependencies:**
- Form submission handler
- Email validation

---

#### 5. Newsletter Form Footer
**File:** `nav-system/templates/components/newsletter-form-footer.html`  
**Original:** `templates/components/newsletter-form-footer.html`  
**Size:** 2.89 KB | **Lines:** 45  
**Status:** ACTIVE

**Purpose:**
Newsletter subscription form component for footer with full validation and styling.

**Components:**
- Form container
- Name input (optional)
- Email input (required)
- Submit button
- Success/error messaging
- Privacy notice

**Data Requirements:**
```javascript
{
  formId: 'newsletter-footer',
  fields: [
    { name: 'email', required: true, type: 'email' },
    { name: 'name', required: false, type: 'text' }
  ],
  submitText: 'Sign Up'
}
```

**CSS Dependencies:**
- `nav-system/css/global/footer.css`

**JavaScript Dependencies:**
- Form validation
- API endpoint: `/api/newsletter/subscribe`

---

#### 6. Breadcrumbs Schema Snippets
**File:** `nav-system/templates/components/breadcrumbs-schema.html`  
**Original:** `docs/SCHEMA_SNIPPETS_BREADCRUMBS.html`  
**Size:** 1.73 KB | **Lines:** 54  
**Status:** ACTIVE

**Purpose:**
Schema.org breadcrumb structured data for SEO, improving search result presentation and enabling breadcrumb display in search results.

**Components:**
- BreadcrumbList schema
- ListItem elements for each breadcrumb
- Position and name attributes
- URL references

**Schema Structure:**
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://example.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Blog",
      "item": "https://example.com/blog"
    }
  ]
}
```

**Usage Context:**
Included in `<head>` or as JSON-LD script tag on pages with breadcrumb navigation.

---

## 🔗 Template Dependencies & Includes

### Template Hierarchy:
```
Main Layout
├── nav-main.html (header navigation)
├── content (page-specific)
├── footer.html (site footer)
│   ├── newsletter-form-footer.html
│   └── social links
└── breadcrumbs-schema.html (SEO schema)

Blog Article Layout
├── nav-main.html
├── article content
├── breadcrumbs-schema.html
├── content-cluster-nav.html (related posts)
├── newsletter-cta-blog-footer.html
└── footer.html
```

### CSS Dependencies:
```
header.css
├── nav-main.html
└── nav-main.html (blog-specific)

footer.css
├── footer.html
├── newsletter-form-footer.html
└── newsletter-cta-blog-footer.html
```

### JavaScript Dependencies:
```
navigation.js → nav-main.html
navigation-component.js → nav-main.html

(Form handlers) → newsletter-form-footer.html
                → newsletter-cta-blog-footer.html
```

---

## 📱 Template Responsive Behavior

| Template | Mobile | Tablet | Desktop | Notes |
|---|---|---|---|---|
| nav-main.html | Hamburger | Menu | Full Menu | Adaptive |
| footer.html | 1 col | 2 col | 4 col | Grid layout |
| content-cluster-nav.html | Stack | Stack | Side | Variable |
| newsletter-form-footer.html | Full width | Full width | Constrained | Form input |
| breadcrumbs-schema.html | - | - | - | Not visible (schema only) |

---

## 🔧 How to Modify Templates

### Add New Navigation Item:
1. Edit `nav-main.html`
2. Add to `items` array in data
3. Ensure CSS classes match header.css

### Modify Footer Links:
1. Edit `footer.html`
2. Update link sections
3. Test responsive layout

### Update Newsletter Form:
1. Edit `newsletter-form-footer.html`
2. Add/remove fields
3. Update validation rules

### Add New Breadcrumb:
1. Edit `breadcrumbs-schema.html`
2. Add ListItem to itemListElement array
3. Update position and name

---

## ✅ Template Checklist

- [x] All templates organized in nav-system/templates/
- [x] Components separated into subdirectories
- [x] CSS dependencies documented
- [x] JavaScript dependencies documented
- [x] Data requirements specified
- [x] Responsive behavior documented
- [x] Schema markup included
- [x] Backwards compatible

---

## 📝 Notes

**Inclusion Methods:**
- Server-Side Includes (SSI) - `<!--#include virtual="..." -->`
- Build-time includes - Webpack/build process
- Runtime includes - JavaScript template loading

**Backwards Compatibility:**
- Original templates remain in `templates/`
- New copies in `nav-system/templates/` are identical
- Can reference either location during transition

**Future Enhancements:**
1. Componentize templates (React/Vue)
2. Add template inheritance/blocks
3. Add i18n support for translations
4. Add A/B testing variations
5. Add analytics tracking

---

*Navigation System - HTML Templates Index*  
*Created: January 5, 2026*  
*Files: 6 template files | 515 lines | 30.27 KB*
