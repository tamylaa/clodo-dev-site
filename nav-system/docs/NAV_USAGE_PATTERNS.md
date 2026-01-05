# Navigation System - Usage Patterns & Examples

**Purpose:** Common patterns for using navigation system across different page types and scenarios.

**Date:** January 5, 2026

---

## 🏠 PATTERN 1: HOMEPAGE NAVIGATION

**Scenario:** Homepage with primary navigation and featured links

### Page Structure

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="/css/header.css">
  <link rel="stylesheet" href="/css/footer.css">
</head>
<body>
  <!-- Primary Navigation -->
  {% include 'nav-main.html' %}
  
  <!-- Hero Section -->
  <section class="hero">
    <h1>Welcome to CLODO</h1>
    <p>Build amazing things</p>
  </section>
  
  <!-- Featured Links -->
  <section class="featured-links">
    <h2>Quick Links</h2>
    <ul>
      <li><a href="/docs/getting-started">Getting Started</a></li>
      <li><a href="/docs/guides">Guides</a></li>
      <li><a href="/blog">Latest from Blog</a></li>
    </ul>
  </section>
  
  <!-- Newsletter -->
  <section class="newsletter">
    {% include 'newsletter-signup.html' %}
  </section>
  
  <!-- Footer -->
  {% include 'footer.html' %}
  
  <script type="module" src="/js/navigation.js"></script>
  <script type="module" src="/js/navigation-component.js"></script>
</body>
</html>
```

### Data Context

```javascript
// In server-side template context
{
  nav: navigationData,
  currentPath: '/',
  isHomepage: true,
  announcement: {
    type: 'info',
    message: 'Welcome! Explore our new documentation.'
  }
}
```

### JavaScript Setup

```javascript
// Initialize navigation for homepage
import * as Navigation from '/js/navigation.js';

Navigation.init({
  scrollBehavior: 'smooth',
  enablePrefetch: true,
  activeClass: 'active'
});

// Track homepage views
Navigation.on('pageLoaded', () => {
  console.log('Homepage loaded');
});
```

---

## 📚 PATTERN 2: DOCUMENTATION PAGE

**Scenario:** Documentation with sidebar navigation and breadcrumbs

### Page Structure

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="/css/header.css">
  <link rel="stylesheet" href="/css/footer.css">
</head>
<body>
  <!-- Top Navigation -->
  {% include 'nav-main.html' %}
  
  <!-- Breadcrumb Trail -->
  {% include 'breadcrumb.html' %}
  
  <div class="page-container">
    <!-- Sidebar Navigation -->
    <aside class="sidebar">
      <nav class="doc-nav">
        <ul>
          <li><a href="/docs">Overview</a></li>
          <li><a href="/docs/installation" class="active">Installation</a></li>
          <li class="has-children">
            <a href="/docs/guides">Guides</a>
            <ul>
              <li><a href="/docs/guides/getting-started">Getting Started</a></li>
              <li><a href="/docs/guides/advanced">Advanced</a></li>
            </ul>
          </li>
          <li><a href="/docs/api">API Reference</a></li>
        </ul>
      </nav>
    </aside>
    
    <!-- Main Content -->
    <main>
      <h1>Installation</h1>
      <p>Installation instructions...</p>
      
      <!-- Table of Contents (from page content) -->
      <nav class="toc">
        <h3>On this page</h3>
        <ul>
          <li><a href="#prerequisites">Prerequisites</a></li>
          <li><a href="#installation-steps">Installation Steps</a></li>
          <li><a href="#troubleshooting">Troubleshooting</a></li>
        </ul>
      </nav>
    </main>
  </div>
  
  <!-- Footer -->
  {% include 'footer.html' %}
</body>
</html>
```

### Breadcrumb Generation

```javascript
// Generate breadcrumbs for /docs/guides/getting-started
const breadcrumbs = [
  { label: 'Home', href: '/', isCurrent: false },
  { label: 'Docs', href: '/docs', isCurrent: false },
  { label: 'Guides', href: '/docs/guides', isCurrent: false },
  { label: 'Getting Started', href: null, isCurrent: true }
];

// Render with breadcrumb.html
```

### Sidebar Active Link

```javascript
// Mark current page in sidebar
const currentPath = window.location.pathname;
const sidebarLinks = document.querySelectorAll('.doc-nav a');

sidebarLinks.forEach(link => {
  if (link.href === window.location.href) {
    link.classList.add('active');
    link.setAttribute('aria-current', 'page');
  }
});
```

### Smooth Scroll to Anchors

```javascript
import * as Navigation from '/js/navigation.js';

// Smooth scroll to on-page anchors
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = link.getAttribute('href');
    Navigation.smoothScroll(target, 80); // 80px offset for header
  });
});
```

---

## 📝 PATTERN 3: BLOG PAGE

**Scenario:** Blog post with navigation, breadcrumbs, and related posts

### Page Structure

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="/css/header.css">
  <link rel="stylesheet" href="/css/footer.css">
</head>
<body>
  <!-- Navigation -->
  {% include 'nav-main.html' %}
  
  <!-- Breadcrumb -->
  {% include 'breadcrumb.html' %}
  
  <!-- Blog Post -->
  <article class="blog-post">
    <header>
      <h1>{{ title }}</h1>
      <div class="meta">
        <time datetime="{{ publishDate }}">{{ formattedDate }}</time>
        <span class="author">By {{ author }}</span>
      </div>
    </header>
    
    <!-- Table of Contents -->
    <nav class="toc">
      <h3>Contents</h3>
      <ul>
        <li><a href="#introduction">Introduction</a></li>
        <li><a href="#main-section">Main Section</a></li>
        <li><a href="#conclusion">Conclusion</a></li>
      </ul>
    </nav>
    
    <!-- Post Content -->
    <div class="content">
      {{ content }}
    </div>
  </article>
  
  <!-- Related Posts Navigation -->
  <nav class="related-posts">
    <h3>Related Articles</h3>
    <ul>
      <li><a href="/blog/related-1">Related Article 1</a></li>
      <li><a href="/blog/related-2">Related Article 2</a></li>
      <li><a href="/blog/related-3">Related Article 3</a></li>
    </ul>
  </nav>
  
  <!-- Newsletter -->
  <section class="post-newsletter">
    {% include 'newsletter-signup.html' %}
  </section>
  
  <!-- Footer -->
  {% include 'footer.html' %}
</body>
</html>
```

### Blog Navigation Logic

```javascript
import * as Navigation from '/js/navigation.js';

// Setup blog post navigation
Navigation.init({
  scrollBehavior: 'smooth',
  scrollOffset: 80, // Account for fixed header
  saveScrollPosition: true,
  restoreScrollPosition: true
});

// Enable prefetching for related posts
document.querySelectorAll('.related-posts a').forEach(link => {
  Navigation.prefetchLink(link.href);
});

// Track article engagement
Navigation.on('scrollRestored', () => {
  console.log('User returned to article');
});
```

### Blog Data Schema

```json
{
  "id": "my-article",
  "title": "Getting Started with CLODO",
  "slug": "/blog/getting-started-clodo",
  "date": "2024-01-15",
  "author": "Jane Doe",
  "category": "tutorial",
  "tags": ["getting-started", "tutorial"],
  "excerpt": "Learn how to get started with CLODO...",
  "readingTime": "5 min read",
  "relatedPosts": [
    "installation-guide",
    "configuration-tutorial",
    "advanced-usage"
  ]
}
```

---

## 🏢 PATTERN 4: MULTI-LEVEL NAVIGATION

**Scenario:** Complex site with nested menus and dropdowns

### Configuration

```json
{
  "items": [
    {
      "id": "products",
      "label": "Products",
      "href": null,
      "icon": "chevron-down",
      "children": [
        {
          "id": "core",
          "label": "Core Products",
          "href": "/products/core",
          "children": [
            { "id": "web", "label": "Web Platform", "href": "/products/core/web" },
            { "id": "mobile", "label": "Mobile App", "href": "/products/core/mobile" }
          ]
        },
        {
          "id": "enterprise",
          "label": "Enterprise",
          "href": "/products/enterprise",
          "children": [
            { "id": "support", "label": "Support", "href": "/products/enterprise/support" },
            { "id": "consulting", "label": "Consulting", "href": "/products/enterprise/consulting" }
          ]
        }
      ]
    }
  ],
  "maxLevels": 3
}
```

### Rendering Logic

```javascript
function renderMenuRecursive(items, level = 0) {
  if (level >= config.maxLevels) return '';
  
  return `<ul class="menu-level-${level}">
    ${items.map(item => `
      <li class="${item.children ? 'has-submenu' : ''}">
        <a href="${item.href || '#'}" data-id="${item.id}">
          ${item.label}
          ${item.children ? '<span class="icon-chevron"></span>' : ''}
        </a>
        ${item.children ? renderMenuRecursive(item.children, level + 1) : ''}
      </li>
    `).join('')}
  </ul>`;
}
```

### Keyboard Navigation

```javascript
// Navigate nested menus with keyboard
function setupKeyboardNav() {
  document.querySelectorAll('.nav-menu').forEach(menu => {
    let focusedIndex = -1;
    const items = Array.from(menu.querySelectorAll('a, button'));
    
    menu.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        focusedIndex = (focusedIndex + 1) % items.length;
        items[focusedIndex].focus();
      } else if (e.key === 'ArrowUp') {
        focusedIndex = (focusedIndex - 1 + items.length) % items.length;
        items[focusedIndex].focus();
      } else if (e.key === 'ArrowRight') {
        // Open submenu if exists
        const submenu = e.target.parentElement.querySelector('ul');
        if (submenu) submenu.classList.add('open');
      } else if (e.key === 'ArrowLeft') {
        // Close submenu
        const submenu = e.target.parentElement.querySelector('ul');
        if (submenu) submenu.classList.remove('open');
      }
    });
  });
}
```

---

## 📱 PATTERN 5: MOBILE-FIRST NAVIGATION

**Scenario:** Mobile-first site with responsive navigation

### Mobile-First CSS

```css
/* Mobile first (< 768px) */
.nav-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
}

.nav-menu {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  flex-direction: column;
  background: white;
  z-index: 999;
}

.nav-menu.open {
  display: flex;
}

.mobile-menu-toggle {
  display: block;
  background: none;
  border: none;
  cursor: pointer;
}

/* Desktop enhancement (≥ 768px) */
@media (min-width: 768px) {
  .nav-menu {
    display: flex !important;
    position: static;
    flex-direction: row;
    background: transparent;
    gap: var(--spacing-lg);
  }
  
  .mobile-menu-toggle {
    display: none;
  }
  
  .submenu {
    position: absolute;
    visibility: hidden;
    opacity: 0;
    top: 100%;
    left: 0;
    min-width: 200px;
    background: white;
    border: 1px solid var(--color-border);
    transition: opacity 200ms;
  }
  
  .nav-item:hover .submenu {
    visibility: visible;
    opacity: 1;
  }
}
```

### Responsive JavaScript

```javascript
import * as Navigation from '/js/navigation.js';

// Mobile-aware initialization
function initResponsive() {
  const isMobile = window.innerWidth < 768;
  
  Navigation.init({
    scrollBehavior: isMobile ? 'instant' : 'smooth',
    enablePrefetch: !isMobile, // Don't prefetch on mobile
    transitionDuration: isMobile ? 200 : 300
  });
}

// Reinitialize on resize
window.addEventListener('resize', () => {
  const isMobile = window.innerWidth < 768;
  // Update navigation mode
});

initResponsive();
```

---

## 🌍 PATTERN 6: LANGUAGE/LOCALE SWITCHING

**Scenario:** Multi-language site with language selector in navigation

### Configuration with Locales

```json
{
  "items": [
    {
      "id": "docs",
      "label": { "en": "Documentation", "es": "Documentación", "fr": "Documentation" },
      "href": "/docs",
      "children": []
    }
  ],
  "locales": ["en", "es", "fr"],
  "currentLocale": "en"
}
```

### Language Switcher in Navigation

```html
<!-- In nav-main.html -->
<nav class="nav-main">
  <!-- Navigation items -->
  
  <!-- Language Selector -->
  <div class="language-selector">
    <button class="language-toggle" aria-label="Select language">
      {{ currentLanguage }}
      <span class="icon-chevron"></span>
    </button>
    <ul class="language-menu" role="menu">
      <li><a href="/en{{ currentPath }}" hreflang="en">English</a></li>
      <li><a href="/es{{ currentPath }}" hreflang="es">Español</a></li>
      <li><a href="/fr{{ currentPath }}" hreflang="fr">Français</a></li>
    </ul>
  </div>
</nav>
```

### Language Switching Logic

```javascript
function switchLanguage(locale) {
  // Build new URL with locale
  const currentPath = window.location.pathname;
  const pathWithoutLocale = currentPath.replace(/^\/(en|es|fr)/, '');
  const newPath = `/${locale}${pathWithoutLocale}`;
  
  // Save preference
  localStorage.setItem('preferredLanguage', locale);
  
  // Navigate
  Navigation.navigateTo(newPath);
}
```

---

## 🔔 PATTERN 7: ANNOUNCEMENT BANNER

**Scenario:** Site-wide announcement at top of navigation

### Configuration

```json
{
  "announcements": [
    {
      "id": "maintenance",
      "type": "warning",
      "message": "Scheduled maintenance on Sunday 2-4 AM EST",
      "link": "/status",
      "dismissible": true,
      "activeFrom": "2024-01-20T00:00:00Z",
      "activeTo": "2024-01-21T06:00:00Z"
    }
  ]
}
```

### Announcement Display

```javascript
function shouldShowAnnouncement(announcement) {
  // Check if dismissed
  const dismissed = localStorage.getItem(`announcement-${announcement.id}`);
  if (dismissed && announcement.dismissible) return false;
  
  // Check active dates
  const now = new Date();
  const from = new Date(announcement.activeFrom);
  const to = new Date(announcement.activeTo);
  return now >= from && now <= to;
}

function setupAnnouncement(announcement) {
  if (!shouldShowAnnouncement(announcement)) return;
  
  const banner = document.createElement('div');
  banner.className = `announcement announcement-${announcement.type}`;
  banner.innerHTML = `
    <div class="announcement-content">
      <p>${announcement.message}</p>
      ${announcement.link ? `<a href="${announcement.link}">Learn more</a>` : ''}
    </div>
    ${announcement.dismissible ? `
      <button class="announcement-close" aria-label="Close">
        <span class="icon-close"></span>
      </button>
    ` : ''}
  `;
  
  document.body.insertBefore(banner, document.body.firstChild);
  
  // Handle dismiss
  if (announcement.dismissible) {
    banner.querySelector('.announcement-close').addEventListener('click', () => {
      localStorage.setItem(`announcement-${announcement.id}`, 'true');
      banner.remove();
    });
  }
}
```

---

## 🔐 PATTERN 8: USER PROFILE DROPDOWN

**Scenario:** Navigation with user profile menu

### Profile Menu HTML

```html
<!-- In nav-main.html -->
<nav class="nav-main">
  <!-- Main navigation items -->
  
  <!-- User Profile Dropdown -->
  {% if user %}
  <div class="profile-dropdown">
    <button class="profile-toggle" aria-expanded="false">
      <img src="{{ user.avatar }}" alt="" class="avatar">
      <span>{{ user.name }}</span>
      <span class="icon-chevron"></span>
    </button>
    <ul class="profile-menu" role="menu">
      <li><a href="/profile">Profile</a></li>
      <li><a href="/settings">Settings</a></li>
      <li><hr></li>
      <li><a href="/logout">Logout</a></li>
    </ul>
  </div>
  {% else %}
  <a href="/login" class="btn btn-primary">Login</a>
  {% endif %}
</nav>
```

### Profile Dropdown Logic

```javascript
const profileToggle = document.querySelector('.profile-toggle');
const profileMenu = document.querySelector('.profile-menu');

profileToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = profileToggle.getAttribute('aria-expanded') === 'true';
  profileToggle.setAttribute('aria-expanded', !isOpen);
  profileMenu.classList.toggle('open');
});

// Close on click outside
document.addEventListener('click', () => {
  profileToggle.setAttribute('aria-expanded', 'false');
  profileMenu.classList.remove('open');
});

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    profileToggle.setAttribute('aria-expanded', 'false');
    profileMenu.classList.remove('open');
  }
});
```

---

## 📊 PATTERN SUMMARY TABLE

| Pattern | Use Case | Complexity | Files Involved |
|---------|----------|-----------|----------------|
| Homepage | Static site home | Low | nav-main, footer, newsletter |
| Documentation | Multi-level docs | Medium | nav-main, sidebar-nav, breadcrumb |
| Blog | Content pages | Medium | nav-main, breadcrumb, related-links |
| Multi-level | Complex sites | High | nav-main, nested-menus, keyboard-nav |
| Mobile-first | Responsive design | Medium | nav-main, responsive CSS, hamburger |
| Language | Multi-language sites | Medium | nav-main, language-selector, locale-handling |
| Announcements | Site notices | Low | nav-main, announcement-banner, dismissal |
| User Profile | Authenticated sites | Medium | nav-main, profile-dropdown, user-menu |

---

*Navigation System - Usage Patterns & Examples*  
*Version 1.0 | Created January 5, 2026*  
*Complete guide to common navigation patterns and implementation examples*
