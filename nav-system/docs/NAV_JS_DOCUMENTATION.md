# Navigation System - JavaScript Documentation

**Purpose:** Complete documentation of JavaScript modules, functions, interfaces, and how components interact.

**Date:** January 5, 2026  
**Files Covered:** 11 JavaScript files (152.29 KB, 5,106 lines)  
**Categories:** Core logic, UI components, tools, tests

---

## 🏗️ ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────┐
│  Configuration Layer                    │
│  (navigation.json, announcements.json)  │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
   ┌──────────────┐   ┌─────────────────┐
   │ Core Logic   │   │ UI Component    │
   │ navigation   │   │ navigation-     │
   │ .js          │   │ component.js    │
   └──────┬───────┘   └────────┬────────┘
          │                    │
          └─────────┬──────────┘
                    ▼
          ┌──────────────────┐
          │ Helper           │
          │ component-nav.js │
          └──────────────────┘
```

---

## 📦 MODULE 1: CORE NAVIGATION (navigation.js)

**File Size:** 11.16 KB | **Lines:** 454 | **Type:** ES Module

### Purpose
Central navigation coordinator handling page transitions, scroll management, active link highlighting, and event system.

### Configuration Object
```javascript
const config = {
  scrollBehavior: 'smooth',      // 'smooth' | 'instant' | 'auto'
  scrollOffset: 80,               // Offset for fixed headers (px)
  enableTransitions: true,        // Enable page transitions
  transitionDuration: 300,        // Duration in ms
  enablePrefetch: true,          // Prefetch links on hover
  prefetchDelay: 100,            // Delay before prefetch
  activeClass: 'active',         // Class for active links
  exactMatch: false,             // Exact URL matching
  saveScrollPosition: true,      // Save scroll on navigation
  restoreScrollPosition: true    // Restore on back
};
```

### State Management
```javascript
const state = {
  currentPath: window.location.pathname,
  scrollPositions: new Map(),    // path → scroll position
  isTransitioning: false,        // Navigation in progress
  prefetchTimers: new Map(),     // link → timer ID
  observers: []                  // Observer instances
};
```

### Core Functions

#### Initialization
```javascript
/**
 * Initialize navigation system
 * @param {Object} options - Configuration options
 * @returns {Promise<void>}
 */
export async function init(options = {}) {
  // Merge options with config
  // Setup event listeners
  // Initialize observers
  // Return ready promise
}
```

#### Navigation
```javascript
/**
 * Navigate to path with transitions
 * @param {string} path - Target path
 * @param {Object} options - Navigation options
 * @returns {Promise<void>}
 */
export async function navigateTo(path, options = {}) {
  // Trigger beforeNavigate event
  // Save current scroll position
  // Update URL
  // Load new page content
  // Update active links
  // Restore scroll/smooth scroll
  // Trigger afterNavigate event
}

/**
 * Go back to previous page
 * @returns {Promise<void>}
 */
export async function goBack() {
  window.history.back();
}

/**
 * Go forward to next page
 * @returns {Promise<void>}
 */
export async function goForward() {
  window.history.forward();
}
```

#### Active Link Management
```javascript
/**
 * Update active link highlighting
 * @param {string} pathname - Current pathname
 */
export function updateActiveLinks(pathname) {
  // Find all nav links
  // Compare with current path
  // Apply/remove active class
  // Update aria-current
}

/**
 * Highlight element as active
 * @param {HTMLElement} element - Element to highlight
 */
export function highlightActiveLink(element) {
  // Remove active from siblings
  // Add active to element
  // Update attributes
}
```

#### Scroll Management
```javascript
/**
 * Save scroll position for path
 * @param {string} path - Path key
 * @param {number} position - Scroll Y position
 */
export function saveScrollPosition(path, position) {
  state.scrollPositions.set(path, position);
}

/**
 * Restore scroll position for path
 * @param {string} path - Path key
 * @returns {Promise<void>}
 */
export async function restoreScrollPosition(path) {
  const position = state.scrollPositions.get(path);
  if (position !== undefined) {
    // Smooth scroll or instant
    await smoothScroll(null, position);
    trigger('scrollRestored', { path, position });
  }
}

/**
 * Smooth scroll to target
 * @param {string|HTMLElement} target - Target element or ID
 * @param {number} offset - Additional offset (px)
 * @returns {Promise<void>}
 */
export function smoothScroll(target, offset = 0) {
  // Calculate target position
  // Apply offset
  // Animate scroll
  // Return promise when complete
}
```

#### Event System
```javascript
// Internal event listeners
const listeners = new Map(); // event → [callback1, callback2, ...]

/**
 * Listen to navigation event
 * @param {string} event - Event name
 * @param {Function} callback - Event handler
 */
export function on(event, callback) {
  if (!listeners.has(event)) {
    listeners.set(event, []);
  }
  listeners.get(event).push(callback);
}

/**
 * Remove event listener
 * @param {string} event - Event name
 * @param {Function} callback - Event handler
 */
export function off(event, callback) {
  if (!listeners.has(event)) return;
  const callbacks = listeners.get(event);
  const index = callbacks.indexOf(callback);
  if (index > -1) callbacks.splice(index, 1);
}

/**
 * Trigger navigation event
 * @param {string} event - Event name
 * @param {*} data - Event data
 */
export function trigger(event, data) {
  if (!listeners.has(event)) return;
  listeners.get(event).forEach(callback => {
    try {
      callback(data);
    } catch (error) {
      console.error(`Error in event listener for "${event}":`, error);
    }
  });
}
```

**Available Events:**
- `beforeNavigate` - Before page transition
- `afterNavigate` - After page transition
- `scrollRestored` - Scroll position restored
- `linkHighlighted` - Link marked active

#### Prefetching
```javascript
/**
 * Prefetch link for faster loading
 * @param {string} url - URL to prefetch
 */
export function prefetchLink(url) {
  // Create <link rel="prefetch">
  // Add to document head
  // Cache fetch hints
}

/**
 * Enable prefetch on hover
 */
export function enablePrefetch() {
  config.enablePrefetch = true;
  // Add hover listeners to links
}

/**
 * Disable prefetch
 */
export function disablePrefetch() {
  config.enablePrefetch = false;
  // Remove hover listeners
}
```

#### State Accessors
```javascript
/**
 * Get current pathname
 * @returns {string}
 */
export function getCurrentPath() {
  return state.currentPath;
}

/**
 * Get all saved scroll positions
 * @returns {Map<string, number>}
 */
export function getScrollPositions() {
  return new Map(state.scrollPositions);
}

/**
 * Get complete navigation state
 * @returns {Object}
 */
export function getState() {
  return {
    currentPath: state.currentPath,
    scrollPositions: getScrollPositions(),
    isTransitioning: state.isTransitioning,
    config: { ...config }
  };
}
```

---

## 📦 MODULE 2: UI COMPONENT (navigation-component.js)

**File Size:** 19.21 KB | **Lines:** 722 | **Type:** ES Module (Class)

### Purpose
Primary UI component for rendering and managing navigation interface with dropdowns, mobile menu, and accessibility.

### Class: NavigationComponent

```javascript
export class NavigationComponent {
  /**
   * Create navigation component
   * @param {Object} config - Configuration
   * @param {Array} config.items - Menu items array
   * @param {number} config.level - Nesting level
   * @param {number} config.maxLevels - Max nesting depth
   * @param {number} config.mobileBreakpoint - Mobile breakpoint px
   * @param {Object} config.classes - CSS class names
   * @param {Object} config.callbacks - Event callbacks
   */
  constructor(config = {})
}
```

### Configuration Interface
```javascript
{
  items: [
    {
      id: 'unique-id',
      label: 'Menu Item',
      href: '/path',
      icon: 'icon-name',
      title: 'Tooltip text',
      children: [
        { /* nested item */ }
      ],
      metadata: { /* custom data */ }
    }
  ],
  level: 0,
  maxLevels: 3,
  mobileBreakpoint: 768,
  classes: {
    root: 'nav-component',
    item: 'nav-item',
    link: 'nav-link',
    dropdown: 'nav-dropdown',
    active: 'active',
    mobile: 'mobile-nav',
    toggle: 'nav-toggle'
  },
  callbacks: {
    onItemClick: (item) => { },
    onMenuToggle: (state) => { },
    onResize: (width) => { }
  }
}
```

### Lifecycle Methods

```javascript
/**
 * Mount component to DOM element
 * @param {string|HTMLElement} container - Mount point
 */
mount(container)

/**
 * Unmount component from DOM
 */
unmount()

/**
 * Render component to HTML
 * @returns {HTMLElement}
 */
render()

/**
 * Cleanup and destroy component
 */
destroy()
```

### State Management

```javascript
/**
 * Update component state
 * @param {Object} newState - State updates
 */
setState(newState)

/**
 * Get current component state
 * @returns {Object}
 */
getState()
```

**State Structure:**
```javascript
{
  isOpen: false,
  isMobile: false,
  activeItem: null,
  expandedItems: Set(),
  focusedIndex: -1,
  width: window.innerWidth
}
```

### Menu Operations

```javascript
/**
 * Open menu/dropdown
 */
openMenu()

/**
 * Close menu/dropdown
 */
closeMenu()

/**
 * Toggle menu open/closed
 */
toggleMenu()

/**
 * Show mobile menu
 */
showMobileMenu()

/**
 * Hide mobile menu
 */
hideMobileMenu()

/**
 * Toggle mobile menu
 */
toggleMobileMenu()

/**
 * Expand menu item
 * @param {string} itemId - Item to expand
 */
expandItem(itemId)

/**
 * Collapse menu item
 * @param {string} itemId - Item to collapse
 */
collapseItem(itemId)
```

### Accessibility

```javascript
/**
 * Set ARIA label
 * @param {string} label - Accessibility label
 */
setAriaLabel(label)

/**
 * Enable keyboard navigation
 * Activates: Tab, Enter, Escape, Arrow keys
 */
enableKeyboardNav()

/**
 * Disable keyboard navigation
 */
disableKeyboardNav()

/**
 * Update focus to index
 * @param {number} index - Focused item index
 */
setFocus(index)
```

**Keyboard Support:**
- `Tab` - Move between items
- `Enter/Space` - Activate item
- `Escape` - Close dropdown
- `ArrowUp/Down` - Navigate items
- `ArrowLeft/Right` - Expand/collapse

### Event System

```javascript
/**
 * Listen to component event
 * @param {string} event - Event name
 * @param {Function} callback - Handler
 */
on(event, callback)

/**
 * Remove event listener
 * @param {string} event - Event name
 * @param {Function} callback - Handler
 */
off(event, callback)

/**
 * Trigger component event
 * @param {string} event - Event name
 * @param {*} data - Event data
 */
trigger(event, data)
```

**Events:**
- `itemClick` - Menu item clicked
- `menuOpen` - Menu opened
- `menuClose` - Menu closed
- `itemHover` - Item hovered
- `focusChange` - Focus moved
- `stateChange` - State updated

---

## 📦 MODULE 3: COMPONENT NAV HELPER (component-nav.js)

**File Size:** 1.18 KB | **Lines:** 38 | **Type:** ES Module (Utility)

### Functions

```javascript
/**
 * Setup event delegation for nav clicks
 * @param {HTMLElement} container - Container element
 * @param {Function} callback - Click handler
 * @returns {Function} Cleanup function
 */
export function delegateNavClick(container, callback)

/**
 * Get navigation target from element
 * @param {HTMLElement} element - Element to check
 * @returns {HTMLElement|null}
 */
export function getNavTarget(element)

/**
 * Check if element is navigation element
 * @param {HTMLElement} element - Element to check
 * @returns {boolean}
 */
export function isNavElement(element)
```

---

## 🛠️ TOOLS (3 files)

### Tool 1: analyze-navigation-system.js
**Purpose:** Analyze system structure and generate reports

```bash
node nav-system/js/tools/analyze-navigation-system.js
```

**Analyzes:**
- File structure and organization
- Component relationships
- Complexity metrics
- Performance metrics
- Optimization suggestions

### Tool 2: audit-nav-files.js
**Purpose:** Audit all navigation files and create inventory

```bash
node nav-system/js/tools/audit-nav-files.js
```

**Outputs:**
- `NAV_FILES_AUDIT.md` - Detailed report
- `nav-system-audit.json` - Machine-readable inventory

### Tool 3: generate-navigation-config.js
**Purpose:** Generate or validate navigation configuration

```bash
node nav-system/js/tools/generate-navigation-config.js
```

---

## 🧪 TESTS (5 files)

### Test Coverage

| Test Suite | Lines | Coverage | Focus |
|-----------|-------|----------|-------|
| navigation.test.js | 221 | ~90% functions | Core logic |
| navigation-component.test.js | 236 | ~88% methods | UI component |
| navigation-test.js | 156 | ~75% | Integration |
| test-navigation-static.js | 128 | ~70% | Static |

### Running Tests

```bash
npm run test:nav                              # All tests
node nav-system/js/tests/run-navigation-tests.js  # Test runner
```

---

## 🔗 DEPENDENCIES & IMPORTS

### Import Chain

```
navigation.js (core)
  ├─ No external dependencies (vanilla JS)
  
navigation-component.js (UI)
  ├─ Imports: navigation.js
  ├─ Imports: component-nav.js
  └─ Used by: Templates (nav-main.html)
  
component-nav.js (utility)
  ├─ No external dependencies
  └─ Used by: navigation-component.js
```

### External Dependencies

✅ **None required** - All modules are vanilla JavaScript

### Test Dependencies

- Custom test framework (no external test library required)

---

## 💡 USAGE EXAMPLES

### Basic Initialization

```javascript
import * as Navigation from './nav-system/js/core/navigation.js';

// Initialize with defaults
await Navigation.init();

// Or with options
await Navigation.init({
  scrollBehavior: 'smooth',
  enablePrefetch: true,
  scrollOffset: 100
});
```

### Listen to Events

```javascript
Navigation.on('beforeNavigate', (data) => {
  console.log('Before navigation to:', data.path);
});

Navigation.on('afterNavigate', (data) => {
  console.log('Navigated to:', data.path);
});

Navigation.on('scrollRestored', (data) => {
  console.log('Scroll restored to:', data.position);
});
```

### Render Component

```javascript
import { NavigationComponent } from './nav-system/js/ui/navigation-component.js';

const config = {
  items: [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' },
    { label: 'Guides', href: '/guides' }
  ]
};

const nav = new NavigationComponent(config);
nav.mount(document.querySelector('nav'));

nav.on('itemClick', (item) => {
  console.log('Clicked:', item.label);
});
```

### Handle Navigation

```javascript
// Programmatic navigation
await Navigation.navigateTo('/blog');

// Go back/forward
Navigation.goBack();
Navigation.goForward();

// Get current state
const path = Navigation.getCurrentPath();
const state = Navigation.getState();
```

---

## 📊 STATISTICS

| Metric | Value |
|--------|-------|
| Total JS Files | 11 |
| Total Lines | 5,106 |
| Total Size | 152.29 KB |
| Functions | 40+ |
| Classes | 1 |
| Events | 6+ |
| Test Coverage | ~85% |

---

*Navigation System - JavaScript Documentation*  
*Version 1.0 | Created January 5, 2026*  
*Complete guide to JavaScript modules and functions*
