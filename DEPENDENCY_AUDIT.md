# Codebase Dependency Audit

**Date**: November 22, 2025  
**Purpose**: Comprehensive mapping of all JavaScript, template, and CSS dependencies before modernization

---

## 1. JavaScript Dependencies

### 1.1 Script Loading Pattern

**All HTML files load script.js:**
- Pattern: `<script src="script.js" nonce="N0Nc3Cl0d0"></script>`
- Blog posts: `<script src="../script.js" nonce="N0Nc3Cl0d0"></script>`
- Total affected files: **25+ HTML files**

### 1.2 Global Functions in script.js

#### Theme Management
- `setupThemeToggle()` - Initialize theme switcher
- `applyTheme(theme)` - Apply theme to document

#### Navigation
- `setupMobileMenu()` - Mobile hamburger menu
- `setupNavDropdowns()` - Dropdown menus (Docs, About)
- `setupNavActiveState()` - Active nav highlighting
- `updateActiveNavLink(sectionId)` - Update active state
- `setPageActiveState()` - Set page-level active state

#### Forms
- `setupNewsletterForm()` - Newsletter subscription forms
- `setupContactForm()` - Contact page form
- `showFormMessage(messageEl, text, type)` - Form feedback

#### Scrolling & Navigation
- `setupSmoothScrolling()` - Smooth scroll behavior
- `handleScroll()` - Scroll event handler

#### StackBlitz Integration
- `setupStackBlitzIntegration()` - Initialize StackBlitz
- **`openStackBlitz(templateUrl)`** - CRITICAL: Called from inline onclick
- `showSetupModal()` - Setup wizard modal
- `showTryModal()` - Try it live modal
- `closeTryModal()` - Close try modal
- `window.closeModal()` - EXPOSED: Global modal closer
- `runPowerShellSetup()` - PowerShell setup
- `runJSSetup()` - JavaScript setup

#### Analytics
- `trackEvent(eventName, parameters)` - Custom event tracking
- `setupMarketingAnalytics()` - Initialize analytics
- `trackConversion(conversionType, details)` - Conversion tracking
- `trackNewsletterSignup(method)` - Newsletter tracking
- `trackDemoInteraction(demoType, success)` - Demo tracking

#### Loading States & UI
- `setupLoadingStates()` - Initialize loading system
- `setLoadingState(element, isLoading)` - Toggle loading
- `showLoadingOverlay(message)` - Full-screen overlay
- `hideLoadingOverlay()` - Hide overlay
- `showSkeletonLoading(container, type)` - Skeleton screens
- `hideSkeletonLoading(container, content)` - Hide skeleton
- `setupAsyncContentLoading()` - Async content
- `showProgressBar(container, progress)` - Progress bar
- `showIndeterminateProgress(container)` - Indeterminate progress
- `showNotification(message, type, duration)` - Toast notifications
- `removeNotification(notification)` - Remove toast

#### Micro-Interactions
- `setupMicroInteractions()` - Initialize interactions
- `setupLazyLoading()` - Image lazy loading
- `loadScript(src)` - Dynamic script loading

#### Stats & Dynamic Content
- `updateDynamicStats()` - Update homepage stats
- `setupAnnouncementBar()` - Announcement banner

---

## 2. Inline Event Handlers (Breaking Changes!)

### 2.1 Critical: Hero Section
**File**: `templates/hero.html` (line 72)
```html
<button onclick="openStackBlitz('https://stackblitz.com/github/tamylaa/clodo-starter-template?file=index.js')">
```
**Impact**: HIGH - Hero CTA on homepage
**Migration**: Convert to data attribute + event delegation

### 2.2 Demo Page
**File**: `public/demo/index.html`
- `onclick="showDemo('api')"` - Line 238
- `onclick="showDemo('database')"` - Line 248
- `onclick="showDemo('deployment')"` - Line 260
- `onclick="showDemo('security')"` - Line 270
- `onclick="runDemo()"` - Line 279
- `onclick="resetDemo()"` - Line 285
- `onclick="showCode()"` - Line 294
- `onclick="runLiveSetup()"` - Line 362
- `onclick="downloadScripts()"` - Line 368
- `onclick="visitDocs()"` - Line 376

**Impact**: MEDIUM - Demo page functionality
**Migration**: Add event delegation for `.demo-card` and `.btn` clicks

### 2.3 CSS Loading (Non-Breaking)
**File**: `public/index.html` (line 17)
```html
<link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
```
**Impact**: LOW - Standard pattern for non-blocking CSS
**Migration**: Can be left as-is or moved to script

---

## 3. Template Dependencies

### 3.1 Current Templates
- `templates/header.html` - Blog navigation
- `templates/footer.html` - Global footer
- `templates/hero.html` - Homepage hero (NEW)
- `templates/nav-main.html` - Main navigation

### 3.2 Build System Integration
**File**: `build.js`
- Uses string replacement: `<!-- HEADER_PLACEHOLDER -->`
- Manual file list management
- No automatic discovery

### 3.3 Pages Using Templates
All HTML files in `public/` except:
- `analytics.html` (Google verification)
- `google1234567890abcdef.html` (Google verification)

**Estimated**: 25+ pages

---

## 4. CSS Dependencies

### 4.1 Modular Structure (COMPLETED)
```
public/css/
├── base.css              # Design tokens, typography
├── components.css        # Buttons, cards, forms
├── layout.css            # Grid, containers
├── utilities.css         # Utility classes
├── global/
│   ├── header.css        # Header styling
│   └── footer.css        # Footer styling
└── pages/
    ├── index/            # Homepage modules
    │   ├── hero.css
    │   ├── features.css
    │   ├── benefits.css
    │   └── ...
    ├── pricing/          # Pricing page modules
    ├── subscribe/        # Subscribe page modules
    └── blog/             # Blog modules
```

### 4.2 BEM Compliance
- **Hero section**: 100% BEM compliant
- **Footer**: 100% BEM compliant
- **Header**: 100% BEM compliant
- **Components**: ~95% BEM compliant
- **Legacy classes**: < 5% need updating

---

## 5. Breaking Change Risk Matrix

| Component | Inline Events | Global Functions | Module Ready | Risk Level |
|-----------|--------------|------------------|--------------|------------|
| Hero CTA | ✓ (1) | `openStackBlitz` | ✗ | **HIGH** |
| Demo Page | ✓ (10) | Multiple | ✗ | **HIGH** |
| Navigation | ✗ | `setupMobileMenu`, `setupNavDropdowns` | ✗ | **MEDIUM** |
| Theme Toggle | ✗ | `setupThemeToggle` | ✗ | **MEDIUM** |
| Newsletter Forms | ✗ | `setupNewsletterForm` | ✗ | **MEDIUM** |
| Contact Form | ✗ | `setupContactForm` | ✗ | **LOW** |
| Analytics | ✗ | `trackEvent`, etc. | ✗ | **LOW** |

---

## 6. Migration Priority Order

### Phase 1: Foundation (No Breaking Changes)
1. ✅ Create DEPENDENCY_AUDIT.md (this document)
2. Create `public/js/main.js` entry point
3. Extract theme module
4. Extract newsletter module
5. Test parallel loading

### Phase 2: Navigation (MEDIUM Risk)
1. Extract navigation modules
2. Convert mobile menu to module
3. Convert dropdowns to module
4. Test all navigation

### Phase 3: Critical Functions (HIGH Risk)
1. Extract StackBlitz integration
2. Create global function wrappers
3. Convert hero onclick to data attribute
4. Convert demo page onclick handlers
5. Test all interactive elements

### Phase 4: Cleanup (LOW Risk)
1. Extract analytics module
2. Extract loading states module
3. Extract UI utilities
4. Remove global function wrappers
5. Final testing

---

## 7. Testing Checklist

### Before Migration
- [x] Document all dependencies
- [x] Map all inline event handlers
- [x] List all global functions
- [ ] Create backup branch
- [ ] Take screenshots of all pages

### During Migration
- [ ] Test hero CTA on every change
- [ ] Test mobile menu on every change
- [ ] Test newsletter forms on every change
- [ ] Test demo page interactivity
- [ ] Test theme toggle

### After Migration
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile device testing (iOS, Android)
- [ ] Performance testing (Lighthouse)
- [ ] Accessibility testing (axe-core)
- [ ] Visual regression testing (Percy/Playwright)

---

## 8. Rollback Plan

### Immediate Rollback
If critical functionality breaks:
```bash
git checkout master
git branch -D modernization
node build.js
```

### Partial Rollback
If specific feature breaks:
```bash
# Revert to hybrid loading
git checkout master -- public/script.js
node build.js
```

### Feature Flag Rollback
Using URL parameter:
```javascript
const useModules = new URLSearchParams(window.location.search).get('beta') === 'true';
if (useModules) {
    // Load ES6 modules
} else {
    // Load legacy script.js
}
```

---

## 9. Key Findings Summary

**Critical Dependencies:**
- 1 inline onclick in hero template (homepage CTA)
- 10 inline onclick in demo page
- 43+ global functions in script.js
- 25+ HTML files loading script.js
- window.closeModal exposed globally

**Migration Complexity:**
- **HIGH**: StackBlitz integration (inline onclick)
- **MEDIUM**: Navigation system (mobile menu, dropdowns)
- **MEDIUM**: Theme toggle
- **MEDIUM**: Form handlers
- **LOW**: Analytics and utilities

**Recommended Approach:**
1. Start with Quick Wins (no breaking changes)
2. Create parallel module system
3. Use hybrid loading during transition
4. Convert inline handlers last
5. Keep rollback plan ready

---

## 10. Next Steps

1. ✅ Complete this audit
2. Create `modernization` branch
3. Start with Quick Wins (Tasks 4-8)
4. Create `public/js/main.js` entry point
5. Extract first module (theme)
6. Test parallel loading
7. Gradually migrate remaining features

---

**Audit Completed**: November 22, 2025  
**Status**: Ready to begin Quick Wins phase  
**Risk**: Manageable with phased approach
