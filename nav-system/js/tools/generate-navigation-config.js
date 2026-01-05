#!/usr/bin/env node

/**
 * Navigation Structure Generator
 * 
 * Creates a unified navigation configuration from analyzed data
 * and generates example implementations for consistent categorization
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '..');
const configDir = path.join(rootDir, 'config');

/**
 * Unified Navigation Configuration
 */
const navigationConfig = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  
  // Content type taxonomy
  contentTypes: {
    educational: {
      icon: '📚',
      description: 'Conceptual, beginner-friendly content',
      color: '#6366f1'
    },
    comparison: {
      icon: '⚖️',
      description: 'Comparative analysis between technologies',
      color: '#8b5cf6'
    },
    guide: {
      icon: '🚀',
      description: 'Comprehensive guides and how-tos',
      color: '#06b6d4'
    },
    tutorial: {
      icon: '👨‍🏫',
      description: 'Step-by-step tutorials',
      color: '#10b981'
    },
    framework: {
      icon: '⚙️',
      description: 'Framework-specific content',
      color: '#f59e0b'
    },
    examples: {
      icon: '💡',
      description: 'Code examples and templates',
      color: '#ec4899'
    },
    documentation: {
      icon: '📖',
      description: 'API/technical documentation',
      color: '#3b82f6'
    },
    tool: {
      icon: '🛠️',
      description: 'Interactive tools and dashboards',
      color: '#ef4444'
    },
    caseStudy: {
      icon: '📊',
      description: 'Real-world case studies',
      color: '#14b8a6'
    },
    blog: {
      icon: '📝',
      description: 'Blog posts and articles',
      color: '#f97316'
    }
  },

  // Navigation categories
  categories: {
    product: {
      label: 'Product',
      icon: '📦',
      order: 1
    },
    learn: {
      label: 'Learn',
      icon: '🎓',
      order: 2
    },
    resources: {
      label: 'Resources',
      icon: '📚',
      order: 3
    },
    company: {
      label: 'Company',
      icon: '🏢',
      order: 4
    },
    community: {
      label: 'Community',
      icon: '👥',
      order: 5
    }
  },

  // Main navigation structure
  mainNav: [
    {
      id: 'home',
      label: 'Home',
      href: '/',
      icon: '🏠',
      type: 'link'
    },
    {
      id: 'product',
      label: 'Product',
      href: '/product',
      icon: '📦',
      type: 'dropdown',
      category: 'product',
      children: [
        {
          id: 'product-overview',
          label: 'Overview',
          href: '/product',
          contentType: 'educational'
        },
        {
          id: 'product-migrate',
          label: 'Migrate',
          href: '/migrate',
          contentType: 'guide'
        },
        {
          id: 'product-community',
          label: 'Community',
          href: '/community/welcome',
          contentType: 'educational'
        },
        {
          section: 'Comparisons',
          icon: '⚖️',
          children: [
            {
              id: 'comp-edge-vs-cloud',
              label: 'Edge vs Cloud Computing',
              href: '/edge-vs-cloud-computing',
              contentType: 'comparison'
            },
            {
              id: 'comp-workers-vs-lambda',
              label: 'Workers vs Lambda',
              href: '/workers-vs-lambda',
              contentType: 'comparison'
            },
            {
              id: 'comp-clodo-vs-lambda',
              label: 'Clodo vs AWS Lambda',
              href: '/clodo-vs-lambda',
              contentType: 'comparison'
            },
            {
              id: 'comp-what-is-workers',
              label: 'What is Cloudflare Workers',
              href: '/what-is-cloudflare-workers',
              contentType: 'educational'
            },
            {
              id: 'comp-what-is-edge',
              label: 'What is Edge Computing',
              href: '/what-is-edge-computing',
              contentType: 'educational'
            }
          ]
        }
      ]
    },
    {
      id: 'learn',
      label: 'Learn',
      href: '#',
      icon: '🎓',
      type: 'dropdown',
      category: 'learn',
      children: [
        {
          section: 'Documentation',
          icon: '📚',
          href: '/docs',
          children: [
            {
              id: 'learn-docs-getting-started',
              label: 'Getting Started',
              href: '/docs',
              contentType: 'documentation'
            },
            {
              id: 'learn-docs-components',
              label: 'Components',
              href: '/components',
              contentType: 'documentation'
            },
            {
              id: 'learn-docs-deployment',
              label: 'Development & Deployment',
              href: '/development-deployment-guide',
              contentType: 'guide'
            },
            {
              id: 'learn-docs-api',
              label: 'API Simplification',
              href: '/clodo-framework-api-simplification',
              contentType: 'documentation'
            }
          ]
        },
        {
          section: 'Guides',
          icon: '🚀',
          children: [
            {
              id: 'learn-guide-workers',
              label: 'Cloudflare Workers Guide',
              href: '/cloudflare-workers-guide',
              contentType: 'guide'
            },
            {
              id: 'learn-guide-edge',
              label: 'Edge Computing Guide',
              href: '/edge-computing-guide',
              contentType: 'guide'
            },
            {
              id: 'learn-guide-framework',
              label: 'Cloudflare Framework Guide',
              href: '/cloudflare-framework',
              contentType: 'guide'
            },
            {
              id: 'learn-guide-boilerplate',
              label: 'Workers Boilerplates',
              href: '/workers-boilerplate',
              contentType: 'examples'
            },
            {
              id: 'learn-guide-migration',
              label: 'Migration Guide',
              href: '/how-to-migrate-from-wrangler',
              contentType: 'guide'
            }
          ]
        },
        {
          section: 'Examples',
          icon: '💡',
          href: '/examples',
          children: [
            {
              id: 'learn-examples-all',
              label: 'Code Examples & Templates',
              href: '/examples',
              contentType: 'examples'
            }
          ]
        },
        {
          section: 'Help & Support',
          icon: '❓',
          children: [
            {
              id: 'learn-help-faq',
              label: 'Frequently Asked Questions',
              href: '/faq',
              contentType: 'documentation'
            }
          ]
        }
      ]
    },
    {
      id: 'about',
      label: 'About',
      href: '/about',
      icon: '🏢',
      type: 'dropdown',
      category: 'company',
      children: [
        {
          id: 'about-us',
          label: 'About Us',
          href: '/about',
          contentType: 'educational'
        },
        {
          id: 'about-team',
          label: 'Our Team',
          href: '/about#team',
          contentType: 'educational'
        },
        {
          id: 'about-careers',
          label: 'Careers',
          href: '/about#careers',
          contentType: 'educational'
        }
      ]
    },
    {
      id: 'pricing',
      label: 'Pricing',
      href: '/pricing',
      type: 'link',
      category: 'product'
    }
  ],

  // Footer navigation structure
  footer: [
    {
      category: 'product',
      title: 'Product',
      titleId: 'footer-product',
      links: [
        { label: 'Product Overview', href: '/product', contentType: 'educational' },
        { label: 'Documentation', href: '/docs', contentType: 'documentation' },
        { label: 'Code Examples', href: '/examples', contentType: 'examples' },
        { label: 'Pricing', href: '/pricing', contentType: 'educational' },
        { label: 'Migration Guide', href: '/migrate', contentType: 'guide' },
        { label: 'Clodo vs AWS Lambda', href: '/clodo-vs-lambda', contentType: 'comparison' },
        { label: 'GitHub', href: 'https://github.com/tamylaa/clodo-framework', external: true },
        { label: 'API Reference', href: '/docs#api', contentType: 'documentation' },
        { label: 'Expert Review', href: '/product#expert-assessment', contentType: 'educational' }
      ]
    },
    {
      category: 'developers',
      title: 'Developers',
      titleId: 'footer-developers',
      links: [
        { label: 'Getting Started', href: '/docs#getting-started', contentType: 'documentation' },
        { label: 'Deployment', href: '/docs#deployment', contentType: 'guide' },
        { label: 'Security Guide', href: '/docs#security', contentType: 'documentation' },
        { label: 'Troubleshooting', href: '/docs#troubleshooting', contentType: 'documentation' },
        { label: 'Example Projects', href: '/examples', contentType: 'examples' },
        { label: 'Release Notes', href: 'https://github.com/tamylaa/clodo-framework/releases', external: true }
      ]
    },
    {
      category: 'resources',
      title: 'Resources',
      titleId: 'footer-blog',
      links: [
        { label: 'Blog', href: '/blog/', contentType: 'blog' },
        { label: 'Infrastructure Revolution', href: '/blog/cloudflare-infrastructure-myth', contentType: 'blog' },
        { label: 'Case Studies', href: '/case-studies/', contentType: 'caseStudy' },
        { label: 'Cloudflare Framework Guide', href: '/cloudflare-framework', contentType: 'guide' },
        { label: 'From Promise to Reality', href: '/clodo-framework-promise-to-reality', contentType: 'blog' },
        { label: 'API Complexity Crisis', href: '/clodo-framework-api-simplification', contentType: 'blog' },
        { label: 'Frequently Asked Questions', href: '/faq', contentType: 'documentation' },
        { label: 'Our Story', href: '/about#game-changer', contentType: 'educational' },
        { label: 'Product Roadmap', href: '/about#roadmap', contentType: 'educational' }
      ]
    },
    {
      category: 'company',
      title: 'Company',
      titleId: 'footer-company',
      links: [
        { label: 'About Us', href: '/about', contentType: 'educational' },
        { label: 'Our Mission', href: '/about#vision', contentType: 'educational' },
        { label: 'Roadmap', href: '/about#roadmap', contentType: 'educational' },
        { label: 'Our Story', href: '/about#game-changer', contentType: 'educational' },
        { label: 'Contact', href: '/pricing#contact', contentType: 'educational' },
        { label: 'Team', href: '/about#team', contentType: 'educational' },
        { label: 'Careers', href: '/about#careers', contentType: 'educational' }
      ]
    },
    {
      category: 'community',
      title: 'Community',
      titleId: 'footer-community',
      links: [
        { label: 'Community Welcome', href: '/community/welcome', contentType: 'educational' },
        { label: 'GitHub Discussions', href: 'https://github.com/tamylaa/clodo-framework/discussions', external: true },
        { label: 'Twitter', href: 'https://twitter.com/clodoframework', external: true },
        { label: 'Report Issues', href: 'https://github.com/tamylaa/clodo-framework/issues', external: true },
        { label: 'Email Support', href: '/about#contact', contentType: 'educational' },
        { label: 'Contribute', href: 'https://github.com/tamylaa/clodo-framework/blob/main/CONTRIBUTING.md', external: true }
      ]
    }
  ],

  // Breadcrumb patterns
  breadcrumbs: {
    home: { label: 'Home', href: '/' },
    patterns: {
      product: [
        { label: 'Home', href: '/' },
        { label: 'Product', href: '/product' }
      ],
      docs: [
        { label: 'Home', href: '/' },
        { label: 'Learn', href: '/docs' }
      ],
      blog: [
        { label: 'Home', href: '/' },
        { label: 'Blog', href: '/blog/' }
      ]
    }
  }
};

/**
 * Generate documentation
 */
function generateImplementationGuide() {
  return `# Navigation Implementation Guide

## Overview

This guide provides consistent categorization and implementation patterns for all navigation components across the Clodo dev site.

## Content Type Taxonomy

All navigation items should be classified with a content type:

${Object.entries(navigationConfig.contentTypes).map(([key, type]) => 
  `### ${type.icon} ${key}
- **Description:** ${type.description}
- **Color:** ${type.color}
- **Usage:** Use for pages, guides, and resources of this type`
).join('\n\n')}

## Navigation Hierarchy

\`\`\`
Main Navigation (Header)
├── Home (link)
├── Product (dropdown)
│   ├── Product pages
│   └── Comparisons section
├── Learn (dropdown)
│   ├── Documentation section
│   ├── Guides section
│   ├── Examples section
│   └── Help section
└── About (dropdown)

Footer Navigation
├── Product Links (9 items)
├── Developers Links (6 items)
├── Resources Links (9 items)
├── Company Links (7 items)
└── Community Links (6 items)

Page-level Navigation
├── Breadcrumbs (contextual path)
├── Content Cluster Nav (section-specific)
└── Table of Contents (for long pages)
\`\`\`

## Implementation Patterns

### 1. Main Navigation Component

**HTML Structure:**
\`\`\`html
<nav class="navbar" aria-label="Main navigation">
  <div class="nav-container">
    <a href="/" class="logo">...</a>
    <button class="mobile-menu-toggle">...</button>
    <ul class="nav-menu" role="menu">
      <!-- Items from navigationConfig.mainNav -->
    </ul>
  </div>
</nav>
\`\`\`

**Data Source:** \`navigationConfig.mainNav\`

### 2. Footer Navigation Component

**HTML Structure:**
\`\`\`html
<footer>
  <div class="footer-content">
    <!-- For each section in navigationConfig.footer -->
    <nav class="footer-section" aria-labelledby="footer-{category}">
      <h4 id="footer-{category}">{title}</h4>
      <ul role="list">
        <!-- Items from section.links -->
      </ul>
    </nav>
  </div>
</footer>
\`\`\`

**Data Source:** \`navigationConfig.footer\`

### 3. Breadcrumb Component

**HTML Structure:**
\`\`\`html
<nav class="breadcrumbs" aria-label="Breadcrumb">
  <ol>
    <!-- Items from navigationConfig.breadcrumbs.patterns[pageType] -->
    <li><a href="/">Home</a></li>
    <li><a href="/section">Section</a></li>
    <li aria-current="page">Current Page</li>
  </ol>
</nav>
\`\`\`

**Schema Markup:**
\`\`\`html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://clodo.dev/"},
    {"@type": "ListItem", "position": 2, "name": "Section", "item": "https://clodo.dev/section"}
  ]
}
</script>
\`\`\`

### 4. Content Metadata

All navigation items should include:

\`\`\`javascript
{
  id: 'unique-identifier',           // For tracking and references
  label: 'Display Label',            // User-facing text
  href: '/path-or-url',              // Destination
  contentType: 'guide',              // From taxonomy
  icon: '🚀',                        // Optional emoji/icon
  category: 'product',               // Section category
  external: false,                   // true for external links
  target: '_self',                   // _blank for new tab
  children: [],                      // For dropdowns
  section: 'Optional Section Label'  // For grouped items
}
\`\`\`

## CSS Naming Conventions

Use consistent class naming:

\`\`\`
Navigation: .navbar, .nav-{component}
Dropdowns: .nav-dropdown, .nav-dropdown-menu, .nav-dropdown-toggle
Breadcrumbs: .breadcrumbs, .breadcrumb-item, .breadcrumb-separator
Links: .nav-link, .nav-dropdown-link
State: .active, .expanded, .disabled
\`\`\`

## JavaScript Utilities

Create reusable functions:

\`\`\`javascript
// Navigation utilities
export function getNavItem(id) { }
export function filterNavByContentType(navItems, type) { }
export function buildBreadcrumb(pathname) { }
export function isNavItemActive(navItem, currentPath) { }
export function getNavItemsByCategory(category) { }
\`\`\`

## Consistency Checklist

- [ ] All nav items have unique \\\`id\\\` values
- [ ] All nav items have \\\`contentType\\\` from defined taxonomy
- [ ] All dropdowns have \\\`aria-haspopup="true"\\\`
- [ ] All breadcrumbs use \\\`<ol>\\\` and proper schema markup
- [ ] All external links have \\\`rel="noopener"\\\` and \\\`target="_blank"\\\`
- [ ] Footer sections use proper \\\`aria-labelledby\\\` attributes
- [ ] Mobile menu has proper ARIA attributes
- [ ] Active links use \\\`.active\\\` class consistently

## Migration Path

1. **Phase 1:** Create navigation config (config/navigation.json)
2. **Phase 2:** Update main navigation template to use config
3. **Phase 3:** Update footer template to use config
4. **Phase 4:** Consolidate CSS into global/navigation.css
5. **Phase 5:** Create unified JavaScript utilities
6. **Phase 6:** Implement breadcrumb generation from config
7. **Phase 7:** Add analytics tracking with content types
`;
}

/**
 * Generate example components
 */
function generateExampleComponents() {
  return `# Navigation Component Examples

## React/Vue Component Usage

### NavBar Component

\`\`\`javascript
import { navigationConfig } from './config/navigation.js';

export function NavBar() {
  return (
    <nav className="navbar" aria-label="Main navigation">
      <div className="nav-container">
        <a href="/" className="logo">Clodo</a>
        <ul className="nav-menu">
          {navigationConfig.mainNav.map(item => (
            <NavItem key={item.id} item={item} />
          ))}
        </ul>
      </div>
    </nav>
  );
}

function NavItem({ item }) {
  if (item.type === 'dropdown') {
    return (
      <li className="nav-dropdown">
        <a href={item.href} className="nav-link">
          {item.label}
        </a>
        <ul className="nav-dropdown-menu">
          {item.children.map(child => (
            child.section ? (
              <DropdownSection key={child.section} section={child} />
            ) : (
              <li key={child.id}>
                <a href={child.href} className="nav-dropdown-link">
                  {child.label}
                </a>
              </li>
            )
          ))}
        </ul>
      </li>
    );
  }
  
  return (
    <li>
      <a href={item.href} className="nav-link">
        {item.label}
      </a>
    </li>
  );
}
\`\`\`

### Footer Component

\`\`\`javascript
export function Footer() {
  return (
    <footer>
      <div className="footer-content">
        {navigationConfig.footer.map(section => (
          <nav 
            key={section.category}
            className="footer-section"
            aria-labelledby={\`footer-\${section.category}\`}
          >
            <h4 id={\`footer-\${section.category}\`}>
              {section.title}
            </h4>
            <ul role="list">
              {section.links.map(link => (
                <li key={link.href}>
                  <a 
                    href={link.href}
                    target={link.external ? '_blank' : '_self'}
                    rel={link.external ? 'noopener' : undefined}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </footer>
  );
}
\`\`\`

### Breadcrumb Component

\`\`\`javascript
export function Breadcrumb({ pathname }) {
  const breadcrumbs = generateBreadcrumbs(pathname);
  
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {breadcrumbs.map((crumb, idx) => (
          <li key={crumb.href}>
            {idx === breadcrumbs.length - 1 ? (
              <span aria-current="page">{crumb.label}</span>
            ) : (
              <a href={crumb.href}>{crumb.label}</a>
            )}
          </li>
        ))}
      </ol>
      <BreadcrumbSchema breadcrumbs={breadcrumbs} />
    </nav>
  );
}

function generateBreadcrumbs(pathname) {
  // Logic to generate breadcrumbs from pathname
  const patterns = navigationConfig.breadcrumbs.patterns;
  const home = navigationConfig.breadcrumbs.home;
  
  // Match pathname to pattern
  for (const [key, pattern] of Object.entries(patterns)) {
    if (pathname.startsWith(key)) {
      return [...pattern];
    }
  }
  
  return [home];
}

function BreadcrumbSchema({ breadcrumbs }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: crumb.label,
      item: crumb.href
    }))
  };
  
  return (
    <script 
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
\`\`\`

## Content Type Filter Example

\`\`\`javascript
export function NavByContentType(contentType) {
  const items = [];
  
  function traverse(navItems) {
    for (const item of navItems) {
      if (item.contentType === contentType) {
        items.push(item);
      }
      if (item.children) {
        traverse(item.children);
      }
    }
  }
  
  traverse(navigationConfig.mainNav);
  traverse(navigationConfig.footer.flatMap(s => s.links));
  
  return items;
}

// Usage: Find all "guide" content
const guides = NavByContentType('guide');
\`\`\`

## Analytics Integration

\`\`\`javascript
export function trackNavClick(navItem) {
  if (window.gtag) {
    gtag('event', 'navigation_click', {
      nav_id: navItem.id,
      nav_label: navItem.label,
      content_type: navItem.contentType,
      category: navItem.category,
      destination: navItem.href
    });
  }
}

// Attach to nav links
document.querySelectorAll('.nav-link, .nav-dropdown-link').forEach(link => {
  link.addEventListener('click', function() {
    const navItem = findNavItemById(this.dataset.navId);
    trackNavClick(navItem);
  });
});
\`\`\`
`;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Generating Navigation Configuration and Guides\n');

  try {
    // Ensure config directory exists
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Save navigation config
    const configPath = path.join(configDir, 'navigation.json');
    fs.writeFileSync(
      configPath,
      JSON.stringify(navigationConfig, null, 2),
      'utf8'
    );
    console.log(`✅ Navigation config saved: ${configPath}`);

    // Save implementation guide
    const guidePath = path.join(rootDir, 'docs', 'NAVIGATION_IMPLEMENTATION_GUIDE.md');
    const guideDir = path.dirname(guidePath);
    if (!fs.existsSync(guideDir)) {
      fs.mkdirSync(guideDir, { recursive: true });
    }
    fs.writeFileSync(guidePath, generateImplementationGuide(), 'utf8');
    console.log(`✅ Implementation guide saved: ${guidePath}`);

    // Save example components
    const examplesPath = path.join(rootDir, 'docs', 'NAVIGATION_COMPONENT_EXAMPLES.md');
    fs.writeFileSync(examplesPath, generateExampleComponents(), 'utf8');
    console.log(`✅ Component examples saved: ${examplesPath}`);

    console.log('\n✨ Navigation configuration generated successfully!\n');
    console.log('📂 Generated files:');
    console.log(`   - config/navigation.json (centralized navigation config)`);
    console.log(`   - docs/NAVIGATION_IMPLEMENTATION_GUIDE.md (best practices)`);
    console.log(`   - docs/NAVIGATION_COMPONENT_EXAMPLES.md (code examples)`);
    console.log('\n💡 Next steps:');
    console.log('   1. Review config/navigation.json');
    console.log('   2. Read NAVIGATION_IMPLEMENTATION_GUIDE.md');
    console.log('   3. Implement components using NAVIGATION_COMPONENT_EXAMPLES.md');

  } catch (error) {
    console.error('❌ Error generating configuration:', error);
    process.exit(1);
  }
}

main();
