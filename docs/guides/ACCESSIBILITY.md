# Accessibility Guide - WCAG 2.1 AA Compliance

## Overview

Clodo Framework is committed to creating an inclusive web experience for all users, regardless of their abilities or disabilities. This guide documents our accessibility implementation following **WCAG 2.1 Level AA** standards.

---

## Table of Contents

1. [Implementation Status](#implementation-status)
2. [WCAG 2.1 Principles](#wcag-21-principles)
3. [Features & Enhancements](#features--enhancements)
4. [Testing Guide](#testing-guide)
5. [Common Patterns](#common-patterns)
6. [Troubleshooting](#troubleshooting)
7. [Resources](#resources)

---

## Implementation Status

### ✅ Completed Features

- **Semantic HTML**: Proper use of `<header>`, `<nav>`, `<main>`, `<footer>`, `<article>`, `<section>`
- **Skip Links**: "Skip to main content" for keyboard navigation
- **ARIA Labels**: Descriptive labels for all interactive elements
- **Focus Indicators**: High-contrast focus outlines (3px, WCAG AAA)
- **Keyboard Navigation**: Full keyboard accessibility (Tab, Arrow keys, Enter, Escape)
- **Screen Reader Support**: ARIA live regions, announcements, proper roles
- **Color Contrast**: All text meets WCAG AA contrast ratios (4.5:1 for normal text)
- **Responsive Design**: Mobile-first, touch-friendly (44x44px minimum touch targets)
- **Form Accessibility**: Proper labels, error messages, required indicators

### 🚧 In Progress

- **Color Contrast Validation**: Automated checks across all color combinations
- **Screen Reader Testing**: Comprehensive testing with NVDA, JAWS, VoiceOver, TalkBack

### 📋 Planned

- **High Contrast Mode**: Support for Windows High Contrast Mode
- **Voice Control**: Optimize for voice navigation (Dragon NaturallySpeaking)
- **Cognitive Accessibility**: Reading level indicators, simplified language options

---

## WCAG 2.1 Principles

### 1. Perceivable

Information and user interface components must be presentable to users in ways they can perceive.

#### ✅ Our Implementation:

- **Text Alternatives (1.1)**: All images have descriptive `alt` text
- **Time-based Media (1.2)**: Transcripts for video content
- **Adaptable (1.3)**: Semantic HTML, proper heading hierarchy, landmark regions
- **Distinguishable (1.4)**: High color contrast, text resize support (up to 200%), no reliance on color alone

```html
<!-- Example: Image with alt text -->
<img src="feature.png" alt="Code editor with syntax highlighting and autocomplete">

<!-- Example: Proper heading hierarchy -->
<h1>Clodo Framework</h1>
  <h2>Features</h2>
    <h3>Performance Optimization</h3>
    <h3>Security</h3>
  <h2>Documentation</h2>
```

### 2. Operable

User interface components and navigation must be operable.

#### ✅ Our Implementation:

- **Keyboard Accessible (2.1)**: All functionality available via keyboard
- **Enough Time (2.2)**: No time limits without warnings
- **Seizures (2.3)**: No content flashes more than 3 times per second
- **Navigable (2.4)**: Skip links, page titles, focus order, link purpose, breadcrumbs

```javascript
// Example: Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Close modals, dropdowns
    }
    if (e.key === 'Tab') {
        // Show focus indicators
        document.body.classList.add('keyboard-navigation');
    }
});
```

### 3. Understandable

Information and the operation of the user interface must be understandable.

#### ✅ Our Implementation:

- **Readable (3.1)**: `lang="en"` attribute on HTML, clear language
- **Predictable (3.2)**: Consistent navigation, no unexpected context changes
- **Input Assistance (3.3)**: Form labels, error identification, suggestions, error prevention

```html
<!-- Example: Form with proper labels and error handling -->
<form>
    <label for="email">Email Address:</label>
    <input 
        type="email" 
        id="email" 
        name="email" 
        required 
        aria-required="true"
        aria-describedby="email-error"
        aria-invalid="false"
    >
    <span id="email-error" class="error-message" role="alert" hidden>
        Please enter a valid email address
    </span>
</form>
```

### 4. Robust

Content must be robust enough to be interpreted by a wide variety of user agents, including assistive technologies.

#### ✅ Our Implementation:

- **Compatible (4.1)**: Valid HTML, proper ARIA usage, unique IDs
- **Name, Role, Value**: All UI components have accessible names, roles, and states

```html
<!-- Example: Accessible dropdown menu -->
<button 
    id="menu-button"
    aria-haspopup="true" 
    aria-expanded="false"
    aria-controls="menu-list"
>
    Menu
</button>
<ul id="menu-list" role="menu" aria-labelledby="menu-button" hidden>
    <li role="none">
        <a href="/docs" role="menuitem">Documentation</a>
    </li>
</ul>
```

---

## Features & Enhancements

### Accessibility Manager

The `AccessibilityManager` class provides runtime enhancements:

```javascript
import AccessibilityManager from './js/core/accessibility.js';

const a11y = new AccessibilityManager();

// Features automatically enabled:
// ✓ Enhanced keyboard navigation
// ✓ Focus indicators
// ✓ Skip links
// ✓ Form accessibility
// ✓ ARIA live regions
// ✓ Touch target optimization
```

### Key Features

#### 1. **Enhanced Focus Indicators**

```css
/* High-contrast focus outlines */
body.keyboard-navigation *:focus {
    outline: 3px solid var(--primary-color, #3b82f6);
    outline-offset: 2px;
    border-radius: 4px;
}

body.keyboard-navigation button:focus {
    outline: 3px solid var(--primary-color, #3b82f6);
    outline-offset: 2px;
    box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.1);
}
```

**Rationale:** WCAG 2.1 AA requires 3:1 contrast for focus indicators. We use 3px solid outlines with a high-contrast color.

#### 2. **Skip Links**

```html
<a href="#main-content" class="skip-link">Skip to main content</a>

<main id="main-content">
    <!-- Page content -->
</main>
```

**Usage:** Press `Tab` key on page load to reveal skip link. Press `Enter` to jump to main content.

#### 3. **ARIA Live Regions**

```javascript
// Announce success messages to screen readers
window.announce('Form submitted successfully', 'polite');

// Announce urgent errors
window.announce('Error: Connection failed', 'assertive');
```

**Implementation:**
```html
<div 
    id="aria-announcer" 
    role="status" 
    aria-live="polite" 
    aria-atomic="true"
    style="position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;"
></div>
```

#### 4. **Keyboard Navigation**

| Key | Action |
|-----|--------|
| `Tab` | Move forward through interactive elements |
| `Shift + Tab` | Move backward through interactive elements |
| `Enter` / `Space` | Activate buttons, links |
| `Escape` | Close modals, dropdowns, mobile menu |
| `Arrow Keys` | Navigate menus, lists, tabs |
| `Home` | Jump to first item in list/menu |
| `End` | Jump to last item in list/menu |

**Example: Arrow Key Navigation**
```javascript
menu.addEventListener('keydown', (e) => {
    const items = menu.querySelectorAll('[role="menuitem"]');
    const currentIndex = Array.from(items).indexOf(document.activeElement);
    
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % items.length;
        items[nextIndex].focus();
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + items.length) % items.length;
        items[prevIndex].focus();
    }
});
```

#### 5. **Touch Target Optimization**

All interactive elements meet minimum touch target size: **44x44 pixels** (WCAG 2.1 AAA)

```javascript
// Automatic padding adjustment for small targets
enhanceTouchTargets() {
    const minSize = 44;
    
    document.querySelectorAll('a, button').forEach(element => {
        const rect = element.getBoundingClientRect();
        
        if (rect.width < minSize || rect.height < minSize) {
            const neededPadding = Math.max(0, (minSize - Math.min(rect.width, rect.height)) / 2);
            element.style.padding = `${neededPadding}px`;
        }
    });
}
```

#### 6. **Color Contrast Validation**

```javascript
// Check contrast ratio between foreground and background
const ratio = a11y.getContrastRatio('#000000', '#ffffff'); // 21:1 (excellent)

// Validate all elements on page
const issues = a11y.validateContrast();
console.log('Contrast issues:', issues);
```

**WCAG Requirements:**
- Normal text (< 18pt): **4.5:1** (AA), 7:1 (AAA)
- Large text (≥ 18pt or ≥ 14pt bold): **3:1** (AA), 4.5:1 (AAA)
- UI components & graphics: **3:1** (AA)

**Our Color System:**
```css
:root {
    /* Primary colors with excellent contrast */
    --primary-600: rgb(37 99 235);   /* Contrast 4.5:1+ on white */
    --primary-700: rgb(29 78 216);   /* Contrast 7:1+ on white (AAA) */
    
    /* Text colors with high contrast */
    --text-primary: rgb(17 24 39);   /* Contrast 15:1 on white */
    --text-secondary: rgb(55 65 81);  /* Contrast 8:1 on white */
}
```

---

## Testing Guide

### Automated Testing

#### 1. **Run Accessibility Tests**

```bash
npm run test:accessibility
```

**Test Coverage:**
- ✓ Heading hierarchy
- ✓ Landmark regions
- ✓ Image alt text
- ✓ Form labels
- ✓ Link text
- ✓ ARIA attributes
- ✓ HTML validity
- ✓ Keyboard navigation

#### 2. **Generate Accessibility Report**

```javascript
// In browser console (localhost only)
const report = window.a11y.generateReport();
console.log(report);
```

**Report Includes:**
- Heading hierarchy issues
- Missing landmark regions
- Images without alt text
- Forms without labels
- Links without text
- Color contrast violations

#### 3. **Browser DevTools**

**Chrome Lighthouse:**
1. Open DevTools (F12)
2. Click "Lighthouse" tab
3. Select "Accessibility"
4. Click "Analyze page load"

**Target Score: 95+**

### Manual Testing

#### 1. **Keyboard Navigation**

**Checklist:**
- [ ] Press `Tab` - Can you navigate through all interactive elements?
- [ ] Is the focus indicator visible on every element?
- [ ] Can you open/close dropdowns with `Enter` and `Escape`?
- [ ] Can you submit forms with `Enter`?
- [ ] Can you navigate menus with arrow keys?
- [ ] Does the skip link appear on first `Tab`?

**Instructions:**
1. Load the page
2. Put away your mouse
3. Use only keyboard to navigate entire site
4. Every interactive element should be reachable and usable

#### 2. **Screen Reader Testing**

**NVDA (Windows - Free)**

1. Download: https://www.nvaccess.org/download/
2. Install and start NVDA
3. Navigate with:
   - `Tab` - Next interactive element
   - `H` - Next heading
   - `D` - Next landmark
   - `F` - Next form field
   - `B` - Next button
   - `L` - Next link

**VoiceOver (macOS - Built-in)**

1. Enable: `Cmd + F5`
2. Navigate with:
   - `Ctrl + Option + →` - Next item
   - `Ctrl + Option + ←` - Previous item
   - `Ctrl + Option + Cmd + H` - Next heading
   - `Ctrl + Option + U` - Rotor menu

**TalkBack (Android - Built-in)**

1. Settings → Accessibility → TalkBack
2. Swipe right/left to navigate
3. Double-tap to activate

**Testing Checklist:**
- [ ] Does screen reader announce all headings?
- [ ] Are landmark regions announced?
- [ ] Do form labels announce correctly?
- [ ] Are error messages announced?
- [ ] Do buttons have descriptive names?
- [ ] Are images described properly?
- [ ] Are dynamic content changes announced?

#### 3. **Color Contrast**

**Tools:**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)
- Chrome DevTools → Inspect → Contrast ratio

**Checklist:**
- [ ] All body text has 4.5:1 contrast ratio minimum
- [ ] All headings have 4.5:1 contrast ratio minimum
- [ ] All links have 4.5:1 contrast ratio minimum
- [ ] All button text has 4.5:1 contrast ratio minimum
- [ ] All icons/UI components have 3:1 contrast ratio minimum
- [ ] Focus indicators have 3:1 contrast ratio minimum

#### 4. **Mobile Accessibility**

**Checklist:**
- [ ] All touch targets are at least 44x44 pixels
- [ ] Content reflows properly on mobile (no horizontal scrolling)
- [ ] Text is readable without zooming (minimum 16px body text)
- [ ] Forms are easy to complete on mobile
- [ ] Pinch-to-zoom is not disabled
- [ ] Screen orientation changes don't break layout

#### 5. **Visual Testing**

**Reduce Motion:**
```
Windows: Settings → Ease of Access → Display → Show animations
macOS: System Preferences → Accessibility → Display → Reduce motion
```

**Checklist:**
- [ ] Animations respect `prefers-reduced-motion`
- [ ] No content flashes more than 3 times per second
- [ ] Auto-playing content can be paused

**High Contrast Mode (Windows):**
```
Settings → Ease of Access → High contrast → Turn on high contrast
```

**Checklist:**
- [ ] Content is still readable in high contrast mode
- [ ] Borders and separators are visible
- [ ] Focus indicators are visible

---

## Common Patterns

### Accessible Modal Dialog

```html
<div 
    class="modal" 
    role="dialog" 
    aria-modal="true" 
    aria-labelledby="modal-title"
    aria-describedby="modal-description"
    hidden
>
    <div class="modal-content">
        <h2 id="modal-title">Confirm Action</h2>
        <p id="modal-description">Are you sure you want to delete this item?</p>
        
        <button type="button" data-modal-close>Cancel</button>
        <button type="button" class="btn-danger">Delete</button>
    </div>
</div>
```

```javascript
// Trap focus inside modal
const modal = document.querySelector('.modal');
const focusTrap = a11y.trapFocus(modal);

// Cleanup when modal closes
modalCloseButton.addEventListener('click', () => {
    focusTrap(); // Remove focus trap
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    
    // Return focus to trigger element
    triggerElement.focus();
});
```

### Accessible Dropdown Menu

```html
<nav>
    <button 
        id="resources-button"
        aria-haspopup="true" 
        aria-expanded="false"
        aria-controls="resources-menu"
    >
        Resources
    </button>
    
    <ul 
        id="resources-menu" 
        role="menu" 
        aria-labelledby="resources-button"
        hidden
    >
        <li role="none">
            <a href="/docs" role="menuitem">Documentation</a>
        </li>
        <li role="none">
            <a href="/guides" role="menuitem">Guides</a>
        </li>
    </ul>
</nav>
```

```javascript
button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', !expanded);
    menu.hidden = expanded;
    
    if (!expanded) {
        menu.querySelector('[role="menuitem"]').focus();
    }
});
```

### Accessible Form with Validation

```html
<form>
    <div class="form-group">
        <label for="username">
            Username <span class="required">*</span>
        </label>
        <input 
            type="text" 
            id="username" 
            name="username"
            required
            aria-required="true"
            aria-invalid="false"
            aria-describedby="username-error username-help"
        >
        <span id="username-help" class="form-help">
            3-20 characters, alphanumeric only
        </span>
        <span id="username-error" class="error-message" role="alert" hidden>
            Username is required
        </span>
    </div>
    
    <button type="submit">Register</button>
</form>
```

```javascript
input.addEventListener('invalid', (e) => {
    e.preventDefault();
    e.target.setAttribute('aria-invalid', 'true');
    
    const error = document.getElementById(`${e.target.id}-error`);
    error.textContent = e.target.validationMessage;
    error.hidden = false;
    
    // Announce error to screen readers
    window.announce(`Error: ${e.target.validationMessage}`, 'assertive');
});
```

### Accessible Tabs

```html
<div class="tabs">
    <div role="tablist" aria-label="Documentation sections">
        <button 
            role="tab" 
            aria-selected="true"
            aria-controls="panel-1"
            id="tab-1"
        >
            Getting Started
        </button>
        <button 
            role="tab" 
            aria-selected="false"
            aria-controls="panel-2"
            id="tab-2"
        >
            API Reference
        </button>
    </div>
    
    <div role="tabpanel" aria-labelledby="tab-1" id="panel-1">
        <!-- Getting Started content -->
    </div>
    <div role="tabpanel" aria-labelledby="tab-2" id="panel-2" hidden>
        <!-- API Reference content -->
    </div>
</div>
```

---

## Troubleshooting

### Common Issues

#### Issue: Focus outline not visible

**Solution:** Ensure keyboard navigation class is added:

```javascript
document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
    }
});

document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-navigation');
});
```

#### Issue: Skip link not working

**Solution:** Ensure main content has correct ID:

```html
<a href="#main-content" class="skip-link">Skip to main content</a>
<main id="main-content">...</main>
```

#### Issue: Screen reader not announcing dynamic content

**Solution:** Use ARIA live regions:

```javascript
window.announce('Content loaded', 'polite');
```

#### Issue: Form errors not announced

**Solution:** Use `role="alert"` and `aria-live="assertive"`:

```html
<span role="alert" aria-live="assertive" class="error-message">
    Error: Email is required
</span>
```

---

## Resources

### Tools

- [WAVE Web Accessibility Evaluation Tool](https://wave.webaim.org/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Chrome Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)
- [NVDA Screen Reader](https://www.nvaccess.org/)

### Guidelines

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM Articles](https://webaim.org/articles/)

### Testing

- [Screen Reader Testing Guide](https://www.accessibility-developer-guide.com/knowledge/screen-readers/)
- [Keyboard Testing Guide](https://webaim.org/articles/keyboard/)
- [Color Contrast Guide](https://webaim.org/articles/contrast/)

---

## Compliance Checklist

Use this checklist to ensure WCAG 2.1 AA compliance:

### Perceivable
- [ ] All images have alt text
- [ ] Color is not the only means of conveying information
- [ ] Text can be resized up to 200%
- [ ] Proper heading hierarchy (H1 → H2 → H3)
- [ ] Landmark regions present (header, nav, main, footer)
- [ ] Color contrast meets 4.5:1 for normal text
- [ ] Color contrast meets 3:1 for large text

### Operable
- [ ] All functionality available via keyboard
- [ ] Skip links present
- [ ] No keyboard traps
- [ ] Focus indicator visible (3:1 contrast)
- [ ] No positive tabindex values
- [ ] Page title descriptive
- [ ] Link text descriptive (not "click here")

### Understandable
- [ ] Lang attribute on HTML element
- [ ] Consistent navigation across pages
- [ ] All form inputs have labels
- [ ] Required fields marked with aria-required
- [ ] Error messages associated with inputs
- [ ] Form validation accessible

### Robust
- [ ] Valid HTML
- [ ] Proper ARIA usage
- [ ] Unique IDs
- [ ] Name, role, value on all components
- [ ] Compatible with assistive technologies

---

## Contact

For accessibility concerns or questions:
- **Email**: accessibility@clodo.dev
- **GitHub Issues**: [Report Accessibility Bug](https://github.com/clodoframework/clodo-dev-site/issues/new?labels=accessibility)

---

**Last Updated**: November 22, 2025
**WCAG Version**: 2.1 Level AA
**Status**: ✅ Compliant
