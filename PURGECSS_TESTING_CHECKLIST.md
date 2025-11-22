# PURGECSS TESTING CHECKLIST
## Manual Testing Before Production Deploy

**Date:** November 19, 2025  
**PurgeCSS Savings:** 56.6% (0.67 KB saved from styles.css)

---

## ⚠️ IMPORTANT NOTE

The test only processed `styles.css` (1.19 KB), which is the main orchestrator file with `@import` statements. The actual CSS bundle is **317.74 KB** across 35 files in `public/css/`.

**To get accurate results, we need to:**
1. Process ALL CSS files (not just styles.css)
2. OR inline all @imports before running PurgeCSS

**Next step:** Update build process to handle @imports correctly.

---

## Testing Workflow

### Phase 1: Visual Inspection ✅

After running `npm run build:css:debug`, test the purged CSS:

#### 1. Start Dev Server with Purged CSS
```bash
# Temporarily swap purged CSS for testing
npm run serve
# In browser, manually change CSS link to dist/styles.purged.css
```

#### 2. Navigation Testing
- [ ] Desktop navbar displays correctly
- [ ] Mobile hamburger menu opens/closes
- [ ] Dropdown menus work (if any)
- [ ] Active link highlighting works
- [ ] Hover states on all navigation items

#### 3. Hero Section
- [ ] Hero background/gradient displays
- [ ] Headline typography correct
- [ ] Subheadline styling intact
- [ ] CTA buttons styled correctly
- [ ] Button hover effects work
- [ ] Hero image/illustration displays

#### 4. Form Elements
- [ ] Input fields styled correctly
- [ ] Placeholder text visible
- [ ] Focus states work
- [ ] Error messages display correctly
- [ ] Success messages styled
- [ ] Submit button styling intact
- [ ] Form validation UI works

#### 5. Cards & Components
- [ ] Feature cards display correctly
- [ ] Pricing cards styled
- [ ] Testimonial cards intact
- [ ] Blog post cards work
- [ ] Stat counters styled
- [ ] Icon styling preserved

#### 6. Animations
- [ ] Scroll animations trigger
- [ ] Fade-in effects work
- [ ] Slide-in animations function
- [ ] Hover animations smooth
- [ ] Loading spinners display
- [ ] Ripple effects on buttons

#### 7. Footer
- [ ] Footer layout correct
- [ ] Social icons styled
- [ ] Footer links styled
- [ ] Newsletter form works
- [ ] Footer responsive on mobile

#### 8. Modals & Overlays
- [ ] Modal opens with correct styling
- [ ] Backdrop overlay visible
- [ ] Modal close button styled
- [ ] Modal content formatted
- [ ] Modal animations work

#### 9. Dynamic Content
- [ ] Lazy-loaded images display
- [ ] GitHub integration stats styled
- [ ] Loading states show correctly
- [ ] Error states styled
- [ ] Success notifications work

---

## Phase 2: Responsive Testing 📱

Test at multiple breakpoints:

### Mobile (320px - 767px)
- [ ] Navigation hamburger menu
- [ ] Mobile-optimized typography
- [ ] Touch-friendly buttons (44px min)
- [ ] Single column layouts
- [ ] Mobile footer layout

### Tablet (768px - 1023px)
- [ ] Two-column layouts
- [ ] Medium typography
- [ ] Navigation transitions
- [ ] Tablet-optimized spacing

### Desktop (1024px+)
- [ ] Full navigation bar
- [ ] Multi-column layouts
- [ ] Large typography
- [ ] Desktop spacing
- [ ] Wide-screen optimizations

---

## Phase 3: Cross-Browser Testing 🌐

Test in multiple browsers:

### Chrome/Edge (Chromium)
- [ ] All styles render correctly
- [ ] Animations smooth
- [ ] Fonts load properly

### Firefox
- [ ] Layout identical to Chrome
- [ ] CSS Grid/Flexbox work
- [ ] Custom properties render

### Safari (macOS/iOS)
- [ ] Webkit-specific styles work
- [ ] Backdrop filters render
- [ ] Touch interactions smooth

### Mobile Browsers
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Samsung Internet

---

## Phase 4: Accessibility Testing ♿

### Keyboard Navigation
- [ ] Tab order logical
- [ ] Focus indicators visible
- [ ] Skip links work
- [ ] Dropdown navigation via keyboard
- [ ] Modal closes with Escape key

### Screen Reader
- [ ] ARIA labels present
- [ ] Hidden elements truly hidden (.sr-only)
- [ ] Form labels associated
- [ ] Error messages announced

### Color Contrast
- [ ] Text meets WCAG AA (4.5:1)
- [ ] Links distinguishable
- [ ] Focus indicators visible
- [ ] Error states clear

### Reduced Motion
- [ ] Animations respect `prefers-reduced-motion`
- [ ] No jarring transitions
- [ ] Essential animations only

---

## Phase 5: Performance Validation 🚀

### Lighthouse Audit
```bash
# Run Lighthouse in Chrome DevTools
# Performance tab > Lighthouse > Generate report
```

**Targets:**
- [ ] Performance: 90+
- [ ] Accessibility: 95+
- [ ] Best Practices: 100
- [ ] SEO: 100

### Core Web Vitals
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1

### Bundle Size
```bash
npm run analyze:css
```
- [ ] CSS size reduced by 40-60%
- [ ] No duplicate selectors
- [ ] @imports resolved correctly

---

## Known Safe Removals ✅

These can be safely removed (dead code):

### Old/Deprecated Classes
- Old color scheme classes (if redesigned)
- Unused utility classes
- Deprecated component variants
- Development-only helpers

### Framework Bloat
- Unused Bootstrap/Tailwind utilities
- Vendor prefixes for old browsers
- Polyfill styles for IE11

---

## Known Required Classes ⚠️

**DO NOT REMOVE** (safelist already includes these):

### JavaScript-Added Classes
```javascript
// From script.js
'active'              // Nav links
'show', 'hide'        // Modals, notifications
'loading'             // Form states
'state-loading'       // GitHub integration
'form-group--focused' // Form focus
'lazy-loaded'         // Images

// From scroll-animations.js
'fade-in-up'          // Scroll reveals
'fade-in-left'
'fade-in-right'

// From component-nav.js
'active'              // Component navigation
```

### Dynamic Patterns
```css
.btn-*                /* All button variants */
.icon-*               /* All icon classes */
.bg-*                 /* Background utilities */
.text-*               /* Text utilities */
.hover:*, .focus:*    /* Pseudo-class utilities */
```

---

## Rollback Plan 🔄

If issues are found:

### Quick Rollback
```bash
# Restore original CSS
cp public/styles.css.backup public/styles.css

# Or use git
git checkout public/styles.css
```

### Fix Safelist
```javascript
// Edit postcss.config.js
safelist: {
  standard: [
    'missing-class-name',  // Add found missing class
    // ...
  ]
}

# Rebuild
npm run build:css:debug
```

---

## Sign-Off Checklist ✍️

Before deploying to production:

- [ ] All visual tests passed
- [ ] All responsive tests passed
- [ ] All browser tests passed
- [ ] All accessibility tests passed
- [ ] Lighthouse score meets targets
- [ ] Bundle size reduction confirmed
- [ ] Rollback plan ready
- [ ] Backup created
- [ ] Staging environment tested
- [ ] Monitoring alerts configured

---

## Next Steps

1. **Fix @import handling** - PurgeCSS needs to see all CSS, not just orchestrator
2. **Full bundle test** - Process all 317 KB of CSS, not just 1.19 KB
3. **Update build.js** - Integrate PurgeCSS into main build process
4. **Deploy to staging** - Test full site with purged CSS
5. **Monitor metrics** - Track performance improvements

---

## Notes

- Current test only processed main orchestrator (1.19 KB)
- Real CSS bundle is 317.74 KB across 35 files
- Expected real savings: 140-160 KB (45-50% reduction)
- Safelist is conservative (protects all dynamic classes)
