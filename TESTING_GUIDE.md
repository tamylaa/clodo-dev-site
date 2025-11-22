# Website Testing Guide

## 🚀 Development Server Running

**URL:** http://localhost:8000/

The Vite dev server is currently running with hot module replacement (HMR) enabled.

---

## ✅ What to Test

### 1. **Homepage (index.html)**
- Hero section with responsive layout
- "Production Ready" badge
- "Trusted by 500+ companies" topbar
- Code preview window
- CTA buttons ("Try It Live", "View Documentation")
- Features grid
- Benefits section

### 2. **Navigation Component** (NEW ✨)
Located in: `public/js/ui/navigation-component.js`

**Desktop:**
- Hover over navigation items to see dropdowns
- Click dropdown items to navigate

**Mobile (resize to <768px):**
- Click hamburger menu to toggle mobile navigation
- Click dropdown toggles to expand/collapse menus
- Click outside to close menu
- Press ESC to close menu

**Keyboard Navigation:**
- Tab through navigation items
- Press ESC to close mobile menu
- Arrow keys work in dropdowns

### 3. **Modal Component** (NEW ✨)
Located in: `public/js/ui/modal.js`

**To Test:**
Open browser console and run:
```javascript
// Quick modal test
Modal.open({ 
    content: '<h2>Test Modal</h2><p>This is a test modal with focus trap and scroll locking.</p>' 
});
```

**Features to verify:**
- Modal opens with animation
- Background is locked (can't scroll)
- Focus is trapped inside modal
- ESC key closes modal
- Click backdrop to close
- Focus returns to trigger element

### 4. **Tabs Component** (NEW ✨)
Located in: `public/js/ui/tabs.js`

**To Test:**
If there are tabs on any page, try:
- Click tab headers to switch
- Use Arrow keys (left/right) to navigate
- Press Home/End to jump to first/last tab
- Check if URL hash updates (if enabled)

### 5. **Tooltip Component** (NEW ✨)
Located in: `public/js/ui/tooltip.js`

**To Test:**
Open browser console and add a test tooltip:
```javascript
// Create test element with tooltip
const btn = document.querySelector('.cta-primary');
if (btn) {
    Tooltip.init(btn, { 
        content: 'Click to try the live demo',
        placement: 'top',
        showDelay: 200 
    });
}
```

**Features to verify:**
- Hover shows tooltip after 200ms delay
- Tooltip positions correctly (stays in viewport)
- Focus also shows tooltip
- Touch devices can tap to toggle
- Tooltip has arrow indicator

---

## 🧪 Component Testing in Console

Open browser DevTools (F12) and try these commands:

### Navigation Component
```javascript
// Get navigation state
NavigationComponent.getState();

// Toggle mobile menu programmatically
NavigationComponent.toggleMobileMenu();

// Close all dropdowns
NavigationComponent.closeAllDropdowns();
```

### Modal Component
```javascript
// Open a modal
const modal = Modal.open({ 
    content: '<h2>Hello World</h2>',
    closeOnBackdrop: true,
    animation: true 
});

// Close it
modal.close();

// Multiple modals
Modal.open({ content: 'Modal 1' });
Modal.open({ content: 'Modal 2' });
Modal.closeAll();
```

### Tabs Component
```javascript
// Initialize tabs on an element
const tabs = Tabs.init(document.querySelector('[role="tablist"]'), {
    orientation: 'horizontal',
    urlHash: true
});

// Navigate programmatically
tabs.activate(1);
tabs.next();
tabs.previous();
```

### Tooltip Component
```javascript
// Initialize tooltips on all elements with data-tooltip
Tooltip.initAll('[data-tooltip]');

// Get tooltip state
Tooltip.getState();

// Hide all tooltips
Tooltip.hideAll();

// Enable debug mode
Tooltip.enableDebug();
```

---

## 📱 Responsive Testing

### Breakpoints to Test:
- **Mobile:** < 768px
- **Tablet:** 768px - 1023px  
- **Desktop:** ≥ 1024px

### Chrome DevTools:
1. Press F12 to open DevTools
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select different devices or custom dimensions

### Test in Each Breakpoint:
- Navigation menu behavior
- Hero section layout
- Features grid columns
- Typography sizing
- Button placement
- Footer layout

---

## ♿ Accessibility Testing

### Keyboard Navigation:
- Tab through all interactive elements
- Shift+Tab to go backwards
- Enter/Space to activate buttons
- Arrow keys in dropdowns/tabs
- ESC to close modals/menus

### Screen Reader Testing (Optional):
- **Windows:** Use NVDA (free)
- **Mac:** Use VoiceOver (built-in, Cmd+F5)

### ARIA Checks:
All components include proper ARIA attributes:
- `role` attributes
- `aria-label`, `aria-labelledby`
- `aria-expanded`, `aria-selected`
- `aria-describedby` (tooltips)
- `aria-modal="true"` (modals)

---

## 🎨 Visual Inspection

### Check These Elements:
- [ ] Hero section displays correctly
- [ ] Code preview window shows syntax highlighting
- [ ] Benefits cards have hover effects
- [ ] Features grid is aligned
- [ ] Footer is consistent across pages
- [ ] Buttons have hover/focus states
- [ ] Typography is readable
- [ ] Colors match design system
- [ ] Spacing is consistent

---

## 🔍 Browser DevTools Inspection

### Network Tab:
- Check CSS bundle size
- Verify JS modules load
- Check for 404 errors

### Console Tab:
- Look for JavaScript errors
- Check component initialization messages (if debug enabled)

### Lighthouse Audit:
1. Open DevTools (F12)
2. Go to "Lighthouse" tab
3. Run audit for:
   - Performance
   - Accessibility
   - Best Practices
   - SEO

---

## 📄 Pages to Visit

Navigate through these pages to test:

- [Homepage](http://localhost:8000/)
- [About](http://localhost:8000/about.html)
- [Documentation](http://localhost:8000/docs.html)
- [Components](http://localhost:8000/components.html)
- [Examples](http://localhost:8000/examples.html)
- [Pricing](http://localhost:8000/pricing.html)
- [Blog](http://localhost:8000/blog.html)

---

## 🐛 Known Issues to Check

Based on recent work:
1. ✅ Footer consolidation - verify footer is consistent
2. ✅ Hero section ordering - check mobile layout
3. ✅ CSS modularization - verify no missing styles
4. ⚠️ Test framework - tests written but need Jest/Vitest config

---

## 🛠️ Development Commands

While testing, you can use:

```powershell
# Rebuild project
node build.js

# Run tests
npm test

# Run accessibility tests
npm run test:accessibility

# Run E2E tests
npm run test:e2e

# Check for errors
npm run lint
```

---

## 📊 Build Verification

The build is currently showing:
- ✅ 22 JS modules copied
- ✅ All 4 UI components building
- ✅ CSS bundling (34KB critical + 153KB non-critical)
- ✅ HTML templates processed
- ✅ Assets copied

---

## 🎯 What's Working

### Completed Features:
1. **Module System** - ES6 modules with proper imports/exports
2. **Build System** - Custom Node.js build with CSS bundling
3. **Navigation Component** - Mobile menu, dropdowns, keyboard nav
4. **Modal Component** - Focus trap, scroll lock, animations
5. **Tabs Component** - ARIA tabs, keyboard nav, URL hash
6. **Tooltip Component** - Smart positioning, delays, touch support
7. **Responsive Design** - Mobile-first with breakpoints
8. **Accessibility** - Full ARIA compliance, keyboard support

### Progress: 23/100 tasks (23%)

---

## 💡 Testing Tips

1. **Use Browser DevTools Console** - Components expose APIs for testing
2. **Enable Debug Mode** - Most components have `enableDebug()` method
3. **Test on Real Devices** - Use your phone/tablet if possible
4. **Check Multiple Browsers** - Chrome, Firefox, Edge, Safari
5. **Test Slow Networks** - DevTools > Network > Throttling
6. **Test with JavaScript Disabled** - Verify graceful degradation

---

## 📝 Report Issues

If you find issues, note:
- Browser and version
- Device/screen size
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)

---

**Happy Testing! 🎉**

The dev server is running at http://localhost:8000/ with hot reload enabled.
Changes to files will automatically refresh the browser.
