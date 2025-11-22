# Component System Implementation Guide

## 🎯 Goal
Create a reusable, parameterized component library for consistent design across all pages

---

## 🏗️ Architecture Overview

```
templates/
├── components/          # Reusable UI components
│   ├── buttons/
│   ├── cards/
│   ├── forms/
│   └── sections/
│
├── layouts/            # Page layout templates
│   ├── base.html
│   ├── page-with-sidebar.html
│   └── landing-page.html
│
└── partials/           # Global reusable parts
    ├── header.html
    ├── footer.html
    └── nav-main.html
```

---

## 📦 Component Template System

### Option 1: Handlebars (Recommended)

Install:
```bash
npm install handlebars --save-dev
```

### Option 2: Custom Template Engine

Simple placeholder replacement (current approach enhanced)

---

## 🎨 Component Examples

### 1. Button Component

**File**: `templates/components/buttons/button.html`

```handlebars
{{!-- 
  Button Component
  
  Usage:
    {{> buttons/button 
      text="Get Started" 
      variant="primary" 
      size="lg"
      icon="arrow-right"
      href="/docs.html"
    }}
    
  Props:
    - text (required): Button label
    - variant: primary|secondary|outline|hero (default: primary)
    - size: sm|md|lg (default: md)
    - icon: Icon name (optional)
    - href: Link destination (makes it an <a> tag)
    - type: submit|button|reset (for <button> tag)
    - disabled: boolean
    - loading: boolean
    - id: Element ID (optional)
--}}

{{#if href}}
  <a 
    href="{{href}}"
    class="btn btn--{{variant}} btn--{{size}} {{#if loading}}btn--loading{{/if}}"
    {{#if id}}id="{{id}}"{{/if}}
    {{#if ariaLabel}}aria-label="{{ariaLabel}}"{{/if}}
  >
    {{#if icon}}
      <svg class="btn__icon btn__icon--left" width="20" height="20">
        <use href="/icons/sprite.svg#{{icon}}"></use>
      </svg>
    {{/if}}
    
    <span class="btn__text">{{text}}</span>
    
    {{#if loading}}
      <span class="btn__spinner" aria-hidden="true"></span>
    {{/if}}
  </a>
{{else}}
  <button 
    type="{{type}}"
    class="btn btn--{{variant}} btn--{{size}} {{#if loading}}btn--loading{{/if}}"
    {{#if id}}id="{{id}}"{{/if}}
    {{#if disabled}}disabled{{/if}}
    {{#if ariaLabel}}aria-label="{{ariaLabel}}"{{/if}}
  >
    {{#if icon}}
      <svg class="btn__icon btn__icon--left" width="20" height="20">
        <use href="/icons/sprite.svg#{{icon}}"></use>
      </svg>
    {{/if}}
    
    <span class="btn__text">{{text}}</span>
    
    {{#if loading}}
      <span class="btn__spinner" aria-hidden="true"></span>
    {{/if}}
  </button>
{{/if}}
```

**CSS**: `public/css/components/buttons.css`

```css
/* Extract from components.css */

/* Base button styles */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-lg);
    min-height: 44px;
    font-weight: 500;
    font-size: 0.875rem;
    line-height: 1.5;
    text-decoration: none;
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    cursor: pointer;
    transition: all var(--transition-fast);
    white-space: nowrap;
    position: relative;
    overflow: hidden;
}

/* Variants */
.btn--primary {
    background-color: var(--primary-color);
    color: var(--color-white);
    border-color: var(--primary-color);
}

.btn--primary:hover:not(:disabled) {
    background-color: var(--primary-dark);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
}

.btn--secondary {
    background-color: transparent;
    color: var(--text-primary);
    border-color: var(--border-color);
}

.btn--secondary:hover:not(:disabled) {
    background-color: var(--bg-secondary);
    border-color: var(--text-secondary);
}

.btn--outline {
    background-color: transparent;
    color: var(--primary-color);
    border-color: var(--primary-color);
}

.btn--outline:hover:not(:disabled) {
    background-color: var(--primary-color);
    color: var(--color-white);
}

/* Sizes */
.btn--sm {
    padding: var(--spacing-xs) var(--spacing-md);
    font-size: 0.75rem;
    min-height: 32px;
}

.btn--md {
    /* Default size - already defined in .btn */
}

.btn--lg {
    padding: var(--spacing-md) var(--spacing-xl);
    font-size: 1rem;
    min-height: 52px;
}

/* States */
.btn--loading .btn__text {
    opacity: 0;
}

.btn--loading .btn__spinner {
    display: block;
}

.btn__spinner {
    display: none;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
}

.btn:focus-visible {
    outline: 3px solid var(--primary-color);
    outline-offset: 2px;
}
```

---

### 2. Hero Section Components

**Base Template**: `templates/components/sections/hero-base.html`

```handlebars
{{!--
  Base Hero Section Template
  Parent template for all hero variants
--}}

<section 
  id="hero" 
  class="hero hero--{{variant}}"
  aria-labelledby="hero-title"
>
  <div class="hero__container">
    {{#if badge}}
      <div class="hero__topbar">
        {{> components/badge badge}}
      </div>
    {{/if}}

    {{#if visual}}
      <div class="hero__visual">
        {{> (lookup . 'visualPartial') visual}}
      </div>
    {{/if}}

    <div class="hero__content">
      <h1 id="hero-title" class="hero__title">
        {{{title}}}
        {{#if highlight}}
          <span class="hero__title-highlight">{{highlight}}</span>
        {{/if}}
      </h1>

      {{#if subtitle}}
        <p class="hero__subtitle">{{{subtitle}}}</p>
      {{/if}}

      {{#if description}}
        <div class="hero__description">
          {{{description}}}
        </div>
      {{/if}}

      {{#if actions}}
        <div class="hero__actions">
          {{#each actions}}
            {{> components/buttons/button this}}
          {{/each}}
        </div>
      {{/if}}
    </div>
  </div>
</section>
```

**Premium Hero**: `templates/components/sections/hero-premium.html`

```handlebars
{{!--
  Premium Hero with Code Preview
  Used on homepage
--}}

{{#with (lookup data 'hero')}}
  {{> components/sections/hero-base 
    variant="premium"
    badge=(lookup . 'badge')
    visual=(lookup . 'visual')
    visualPartial="components/visuals/code-preview"
    title=title
    highlight=highlight
    subtitle=subtitle
    actions=actions
  }}
{{/with}}
```

**Simple Hero**: `templates/components/sections/hero-simple.html`

```handlebars
{{!--
  Simple Hero without Visual
  Used on docs, about, etc.
--}}

{{#with (lookup data 'hero')}}
  {{> components/sections/hero-base 
    variant="simple"
    title=title
    subtitle=subtitle
    actions=actions
  }}
{{/with}}
```

---

### 3. Card Component

**File**: `templates/components/cards/card.html`

```handlebars
{{!--
  Generic Card Component
  
  Usage:
    {{> components/cards/card
      title="Feature Title"
      description="Feature description"
      icon="check-circle"
      variant="default"
      href="/learn-more"
    }}
--}}

<div class="card card--{{variant}} {{#if hoverable}}card--hoverable{{/if}}">
  {{#if header}}
    <div class="card__header">
      {{#if icon}}
        <div class="card__icon card__icon--{{iconVariant}}">
          <svg width="24" height="24">
            <use href="/icons/sprite.svg#{{icon}}"></use>
          </svg>
        </div>
      {{/if}}
      
      {{#if badge}}
        <span class="card__badge card__badge--{{badge.variant}}">
          {{badge.text}}
        </span>
      {{/if}}
    </div>
  {{/if}}

  <div class="card__body">
    {{#if title}}
      <h3 class="card__title">{{title}}</h3>
    {{/if}}

    {{#if subtitle}}
      <p class="card__subtitle">{{subtitle}}</p>
    {{/if}}

    {{#if description}}
      <div class="card__description">
        {{{description}}}
      </div>
    {{/if}}

    {{#if features}}
      <ul class="card__features">
        {{#each features}}
          <li class="card__feature">
            <svg class="card__feature-icon" width="16" height="16">
              <use href="/icons/sprite.svg#check"></use>
            </svg>
            <span>{{this}}</span>
          </li>
        {{/each}}
      </ul>
    {{/if}}
  </div>

  {{#if footer}}
    <div class="card__footer">
      {{#if href}}
        <a href="{{href}}" class="card__link">
          {{footerText}}
          <svg class="card__link-icon" width="16" height="16">
            <use href="/icons/sprite.svg#arrow-right"></use>
          </svg>
        </a>
      {{/if}}

      {{#if actions}}
        <div class="card__actions">
          {{#each actions}}
            {{> components/buttons/button this}}
          {{/each}}
        </div>
      {{/if}}
    </div>
  {{/if}}
</div>
```

---

## 📄 Page Data Configuration

**File**: `data/pages.json`

```json
{
  "index.html": {
    "hero": {
      "variant": "premium",
      "badge": {
        "text": "Production Ready",
        "icon": "star"
      },
      "visual": {
        "type": "code-preview",
        "code": "npx create-clodo-service my-service"
      },
      "title": "Enterprise SaaS Development,",
      "highlight": "Reimagined",
      "subtitle": "Transform 6-month development cycles into 2-week deployments.",
      "actions": [
        {
          "text": "Try It Live",
          "variant": "hero-primary",
          "size": "lg",
          "icon": "zap",
          "id": "try-live-btn"
        },
        {
          "text": "View Documentation",
          "variant": "hero-secondary",
          "size": "lg",
          "icon": "book",
          "href": "/docs.html"
        }
      ]
    },
    "features": [
      {
        "icon": "zap",
        "title": "Zero Cold Starts",
        "description": "Instant response times with edge computing"
      }
    ]
  },
  
  "docs.html": {
    "hero": {
      "variant": "simple",
      "title": "Documentation",
      "subtitle": "Everything you need to build with Clodo Framework",
      "actions": [
        {
          "text": "Quick Start",
          "variant": "primary",
          "href": "#getting-started"
        }
      ]
    }
  }
}
```

---

## 🔧 Build System Integration

**File**: `build-with-components.js`

```javascript
import Handlebars from 'handlebars';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Load page data
const pageData = JSON.parse(readFileSync('data/pages.json', 'utf8'));

// Register all partials
function registerPartials(dir) {
    const files = readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
        const fullPath = join(dir, file.name);
        
        if (file.isDirectory()) {
            registerPartials(fullPath);
        } else if (file.name.endsWith('.html')) {
            const content = readFileSync(fullPath, 'utf8');
            const partialName = fullPath
                .replace('templates/', '')
                .replace('.html', '');
            
            Handlebars.registerPartial(partialName, content);
            console.log(`Registered partial: ${partialName}`);
        }
    });
}

// Register helpers
Handlebars.registerHelper('lookup', (obj, field) => obj[field]);

Handlebars.registerHelper('eq', (a, b) => a === b);

Handlebars.registerHelper('or', (...args) => {
    args.pop(); // Remove options object
    return args.some(Boolean);
});

// Build pages
function buildPages() {
    registerPartials('templates');
    
    Object.entries(pageData).forEach(([filename, data]) => {
        console.log(`Building ${filename}...`);
        
        // Read page template
        const pageTemplate = readFileSync(
            join('public', filename),
            'utf8'
        );
        
        // Compile and render
        const template = Handlebars.compile(pageTemplate);
        const output = template({ data });
        
        // Write to dist
        writeFileSync(join('dist', filename), output);
        console.log(`✓ Built ${filename}`);
    });
}

buildPages();
```

---

## 🎨 Component CSS Organization

```
public/css/
├── components/
│   ├── buttons.css
│   ├── cards.css
│   ├── forms.css
│   ├── badges.css
│   ├── icons.css
│   └── sections/
│       ├── hero.css
│       ├── features.css
│       └── cta.css
│
├── base.css           # Design tokens, resets
├── layout.css         # Grid, containers
└── utilities.css      # Utility classes
```

---

## 📚 Component Documentation

**File**: `docs/components/button.md`

```markdown
# Button Component

## Overview
Flexible button component supporting multiple variants, sizes, and states.

## Usage

### Basic Button
```handlebars
{{> components/buttons/button 
  text="Click Me" 
  variant="primary"
}}
```

### Button with Icon
```handlebars
{{> components/buttons/button 
  text="Get Started" 
  variant="primary"
  icon="arrow-right"
}}
```

### Link Button
```handlebars
{{> components/buttons/button 
  text="Learn More" 
  variant="secondary"
  href="/docs.html"
}}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | string | **required** | Button label text |
| `variant` | string | `primary` | `primary`, `secondary`, `outline`, `hero` |
| `size` | string | `md` | `sm`, `md`, `lg` |
| `icon` | string | - | Icon name from sprite |
| `href` | string | - | Makes button a link |
| `type` | string | `button` | `button`, `submit`, `reset` |
| `disabled` | boolean | `false` | Disabled state |
| `loading` | boolean | `false` | Loading state |
| `id` | string | - | Element ID |
| `ariaLabel` | string | - | Accessibility label |

## Variants

### Primary
Main CTAs, most important actions.
- **Background**: Brand blue
- **Use case**: "Get Started", "Sign Up"

### Secondary
Secondary actions.
- **Background**: Transparent with border
- **Use case**: "Learn More", "Cancel"

### Outline
Tertiary actions.
- **Background**: Transparent
- **Border**: Brand blue
- **Use case**: Alternative CTAs

### Hero
Special variant for hero sections.
- **Enhanced effects**: Gradients, animations
- **Use case**: Homepage hero buttons

## Sizes

- **Small (`sm`)**: 32px height, compact padding
- **Medium (`md`)**: 44px height, standard (default)
- **Large (`lg`)**: 52px height, prominent

## States

### Loading
Shows spinner, hides text.
```handlebars
{{> components/buttons/button 
  text="Saving..." 
  loading=true
}}
```

### Disabled
Grayed out, not interactive.
```handlebars
{{> components/buttons/button 
  text="Unavailable" 
  disabled=true
}}
```

## Accessibility

- Minimum touch target: 44×44px
- Focus indicators: 3px outline
- ARIA labels supported
- Screen reader friendly

## Examples

See [Button Examples](/examples/buttons.html) for live demos.
```

---

## ✅ Implementation Checklist

### Phase 1: Setup
- [ ] Install Handlebars
- [ ] Create directory structure
- [ ] Setup build script
- [ ] Register partials system

### Phase 2: Core Components
- [ ] Button component
- [ ] Card component
- [ ] Badge component
- [ ] Icon system

### Phase 3: Section Components
- [ ] Hero variants (premium, simple, minimal)
- [ ] Feature section
- [ ] CTA section
- [ ] Testimonial section

### Phase 4: Form Components
- [ ] Input component
- [ ] Textarea component
- [ ] Checkbox/Radio
- [ ] Form group wrapper

### Phase 5: Documentation
- [ ] Component usage docs
- [ ] Live examples page
- [ ] Storybook setup (optional)

### Phase 6: Migration
- [ ] Migrate index.html
- [ ] Migrate docs.html
- [ ] Migrate pricing.html
- [ ] Migrate remaining pages

---

## 🎯 Benefits

✅ **Consistency**: Single source of truth for components  
✅ **Maintainability**: Update once, applies everywhere  
✅ **Developer Speed**: Faster page development  
✅ **Quality**: Less room for errors  
✅ **Scalability**: Easy to add new pages  
✅ **Testing**: Easier to test isolated components  

---

## 🚀 Next Steps

1. Start with Button component (most used)
2. Test thoroughly before moving to next
3. Document each component as you build
4. Migrate pages one at a time
5. Remove old inline code
6. Consider Storybook for visual testing
