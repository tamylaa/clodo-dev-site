# Clodo Design System

A comprehensive, reusable design system for consistent styling across all Clodo Framework pages.

## 📁 Structure

```
css/framework/
├── framework.css          # Main entry point - imports all modules
├── design-tokens.css      # CSS custom properties for colors, spacing, typography
├── base.css              # Base HTML element styles and typography
├── components.css        # Reusable component classes (cards, buttons, grids)
├── utilities.css         # Utility classes for spacing, layout, colors
└── responsive.css        # Responsive design and breakpoints
```

## 🎨 Design Tokens

### Colors
- `--color-primary`: #6366f1 (Main brand color)
- `--color-secondary`: #a855f7 (Secondary brand color)
- `--color-accent`: #f59e0b (Accent color)
- `--color-white`: #ffffff
- `--color-gray-*`: Complete gray scale (50-900)

### Spacing
- `--space-xs`: 0.25rem
- `--space-sm`: 0.5rem
- `--space-md`: 1rem (base)
- `--space-lg`: 1.5rem
- `--space-xl`: 2rem
- `--space-2xl`: 3rem
- `--space-3xl`: 4rem

### Typography
- Font sizes from `--font-size-xs` (0.75rem) to `--font-size-5xl` (3rem)
- Inter font family as primary
- Consistent line-heights and weights

## 🧩 Component Classes

### Layout Components
```css
.container          /* Max-width container with responsive padding */
.content-container  /* Main content wrapper */
.article-container  /* Article content wrapper */
```

### Hero Sections
```css
.hero-section           /* Base hero styling */
.hero-section--dark     /* Dark background variant */
.hero-section--light    /* Light background variant */
.hero-content           /* Hero content wrapper */
.hero-title             /* Hero heading */
.hero-subtitle          /* Hero description */
```

### Cards & Content
```css
.card                  /* Basic card component */
.card:hover            /* Hover effects included */
.card-header           /* Card header section */
.card-title            /* Card title */
.card-subtitle         /* Card subtitle */
.card-content          /* Card content area */
```

### Buttons
```css
.btn                   /* Base button styles */
.btn--primary          /* Primary button (gradient) */
.btn--secondary        /* Secondary button (outline) */
.btn--outline          /* Outline button variant */
```

### Grids & Layout
```css
.grid                  /* CSS Grid container */
.grid--cols-1          /* 1 column grid */
.grid--cols-2          /* 2 column grid */
.grid--cols-3          /* 3 column grid */
.grid--cols-4          /* 4 column grid */
.grid--auto-fit        /* Auto-fitting grid */
```

### Tables
```css
.table-container       /* Table wrapper with overflow handling */
.table                 /* Base table styles */
.table th, .table td   /* Table cell styling */
```

### Metrics & Stats
```css
.metrics-grid          /* Grid for metric cards */
.metric-card           /* Individual metric card */
.metric-icon           /* Icon in metric card */
.metric-value          /* Large metric number */
.metric-label          /* Metric description */
```

## 🎯 Utility Classes

### Spacing
```css
.m-0, .mt-0, .mb-0, .ml-0, .mr-0     /* Margin utilities */
.p-0, .pt-0, .pb-0, .pl-0, .pr-0     /* Padding utilities */
```

### Typography
```css
.text-xs to .text-5xl                /* Font size utilities */
.font-light to .font-extrabold       /* Font weight utilities */
.text-left, .text-center, .text-right /* Text alignment */
.text-primary, .text-white, etc.     /* Color utilities */
```

### Layout
```css
.flex, .inline-flex                   /* Display utilities */
.grid                                /* Grid display */
.hidden                              /* Hide element */
.relative, .absolute, .fixed         /* Positioning */
```

### Responsive
```css
.md\\:hidden                         /* Hide on medium screens */
.mobile-stack                        /* Stack on mobile */
.desktop-hide                        /* Hide on desktop */
```

## 🚀 Usage

### 1. Import the Framework
```css
@import url('css/framework/framework.css');
```

### 2. Use Component Classes
```html
<!-- Hero Section -->
<section class="hero-section hero-section--dark">
  <div class="container">
    <div class="hero-content">
      <h1 class="hero-title">Welcome to Clodo</h1>
      <p class="hero-subtitle">Build edge applications with ease</p>
      <div class="badge-container">
        <span class="badge">New</span>
        <span class="badge">Fast</span>
      </div>
    </div>
  </div>
</section>

<!-- Content Grid -->
<div class="grid grid--cols-3 gap-lg">
  <div class="card">
    <h3 class="card-title">Feature 1</h3>
    <p class="card-content">Description here</p>
  </div>
</div>
```

### 3. Customize with Design Tokens
```css
.my-custom-component {
  background: var(--color-primary);
  padding: var(--space-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
```

## 📱 Responsive Design

- **Mobile-first approach**
- Breakpoints: 480px, 768px, 1024px, 1280px
- Fluid typography and spacing
- Touch-friendly interactions

## ♿ Accessibility

- Focus management with visible focus indicators
- Reduced motion support (`prefers-reduced-motion`)
- High contrast ratios
- Screen reader friendly utilities (`.sr-only`)

## 🎨 Advanced Features

### Animations
```css
.animate-on-scroll       /* Fade in on scroll */
.fade-in                 /* Simple fade animation */
```

### Dark Mode Support
Automatic dark mode detection with `prefers-color-scheme: dark`

### Print Styles
Optimized printing with `@media print` rules

## 🔧 Customization

### Override Design Tokens
```css
:root {
  --color-primary: #your-brand-color;
  --font-size-base: 16px;
}
```

### Add Custom Components
Create page-specific CSS files that import the framework and add custom styles.

## 📊 Benefits

1. **Consistency**: Unified design language across all pages
2. **Maintainability**: Single source of truth for design tokens
3. **Scalability**: Easy to add new components and pages
4. **Performance**: Modular CSS loading
5. **Developer Experience**: Intuitive class names and utilities
6. **Accessibility**: Built-in accessibility features
7. **Responsive**: Mobile-first responsive design

## 🔄 Migration Guide

### From Individual Page Styles

**Before:**
```css
.my-page .hero {
  background: #000;
  padding: 4rem;
}
```

**After:**
```css
@import url('css/framework/framework.css');

.my-page .hero-section {
  /* Uses framework tokens */
  --custom-bg: #000;
}
```

### Benefits of Migration
- Reduced CSS bundle size
- Consistent behavior across pages
- Easier maintenance and updates
- Better performance
- Improved accessibility

## 📝 Contributing

When adding new components:
1. Use design tokens instead of hardcoded values
2. Include responsive variants
3. Add hover/focus states
4. Document in this README
5. Test across breakpoints

## 🎯 Best Practices

1. **Use semantic class names** that describe purpose, not appearance
2. **Leverage design tokens** for consistency
3. **Combine utilities** for rapid prototyping
4. **Create component classes** for reusable patterns
5. **Test responsiveness** across all breakpoints
6. **Consider accessibility** in all interactions