# Navigation Test Suite

Automated tests for validating mobile/desktop navigation behavior across all pages and breakpoints.

## Quick Start

### Option 1: Full Test (Build + Server + Tests)
```bash
npm run test:navigation:full
```

This will:
1. Build the project
2. Start the dev server
3. Run all navigation tests
4. Stop the server
5. Report results

### Option 2: Manual Test (Server Already Running)
```bash
# Terminal 1: Start server
npm run serve:dist

# Terminal 2: Run tests
npm run test:navigation
```

## What Gets Tested

### Pages
- Landing page (`/`)
- Blog index (`/blog/`)
- Documentation (`/docs.html`)
- Pricing (`/pricing.html`)

### Viewports
- **Mobile**: 375px (iPhone SE), 414px (iPhone 11)
- **Tablet**: 768px (iPad)
- **Desktop**: 1024px, 1440px

### Test Cases

#### 1. Element Presence
- ✓ Mobile menu toggle button exists
- ✓ Mobile menu element exists
- ✓ Required IDs are present

#### 2. Initial State
- ✓ Mobile (< 768px): Menu starts hidden
  - `aria-expanded="false"`
  - `data-visible="false"`
  - CSS `display: none`
- ✓ Desktop (≥ 768px): Menu always visible
  - CSS override shows menu

#### 3. Toggle Functionality (Mobile Only)
- ✓ Click opens menu
  - Sets `aria-expanded="true"`
  - Sets `data-visible="true"`
  - Makes menu visible
- ✓ Click closes menu
  - Sets `aria-expanded="false"`
  - Sets `data-visible="false"`
  - Hides menu

#### 4. CSS Consistency
- ✓ `.nav-menu` base rule exists
- ✓ `[data-visible="true"]` rule exists
- ⚠️  `[data-visible="false"]` rule exists (defensive)

#### 5. JavaScript Execution
- ✓ Navigation component initializes
- ✓ ARIA attributes are managed
- ✓ Event listeners attached

## Test Output

### Success
```
✅ [iPhone SE] Landing Page - Elements Present: PASS
✅ [iPhone SE] Landing Page - Initial State: PASS
✅ [iPhone SE] Landing Page - Toggle Functionality: PASS
✅ [Desktop] Landing Page - Initial State: PASS

📊 TEST SUMMARY
Total Tests: 80
✅ Passed: 80
❌ Failed: 0
⚠️  Warnings: 0
```

### Failure
```
❌ [iPhone SE] Blog Index - Initial State: FAIL
   Menu visible on mobile when should be hidden

❌ FAILED TESTS:
  • [iPhone SE] Blog Index - Initial State
    aria-expanded=false, data-visible=null
```

## Debugging

### Run in Headed Mode
Edit `tests/navigation-test.js`:
```javascript
const browser = await chromium.launch({
    headless: false // Watch browser run tests
});
```

### Check Specific Page
Modify `TEST_PAGES` array:
```javascript
const TEST_PAGES = [
    { path: '/blog/', name: 'Blog Index' } // Test only blog
];
```

### Check Specific Viewport
Modify `VIEWPORTS` object:
```javascript
const VIEWPORTS = {
    mobile: { width: 375, height: 667, name: 'iPhone SE' }
    // Test only mobile
};
```

## Performance Impact

Tests run in headless mode and:
- ✓ Don't affect production builds
- ✓ Don't modify source files
- ✓ Run in ~30 seconds for full suite
- ✓ Can run in CI/CD pipelines

## Integration with CI

Add to your CI pipeline (GitHub Actions example):
```yaml
- name: Run Navigation Tests
  run: |
    npm run build
    npm run serve &
    sleep 5
    npm run test:navigation
```

## Troubleshooting

### Server not starting
- Ensure port 8002 is available
- Check `build/dev-server.js` logs
- Try `npm run clean` then rebuild

### Tests timing out
- Increase `waitForTimeout` values
- Check network speed
- Verify server is actually running

### False negatives
- Clear browser cache: `npm run clean`
- Rebuild: `npm run build`
- Check for console errors in actual browser

## Maintenance

When adding new pages, update `TEST_PAGES`:
```javascript
const TEST_PAGES = [
    // ... existing pages
    { path: '/new-page.html', name: 'New Page' }
];
```

When changing breakpoints, update `VIEWPORTS` and CSS media queries together.

## Related Files

- `tests/navigation-test.js` - Main test suite
- `tests/run-navigation-tests.js` - Automated runner
- `public/js/ui/navigation-component.js` - Navigation logic
- `public/css/global/header.css` - Navigation styles
- `templates/nav-main.html` - Landing page nav
- `templates/header.html` - Other pages nav
