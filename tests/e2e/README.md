# E2E Testing with Playwright

Comprehensive end-to-end testing infrastructure for the Clodo Framework website.

## 📋 Overview

This testing suite provides:
- **E2E Tests**: Critical user journey validation
- **Visual Regression**: Screenshot comparison for UI consistency
- **Cross-browser Testing**: Chromium, mobile, and tablet viewports
- **Performance Monitoring**: Load time and resource validation

## 🚀 Quick Start

### Run All Tests
```bash
npm run test:e2e
```

### Run Tests with UI Mode (Recommended for Development)
```bash
npm run test:e2e:ui
```

### Run Tests in Headed Mode (See Browser)
```bash
npm run test:e2e:headed
```

### Debug Tests
```bash
npm run test:e2e:debug
```

## 📸 Visual Regression Tests

### Run Visual Tests
```bash
npm run test:visual
```

### Update Baseline Screenshots
When you intentionally change UI, update baselines:
```bash
npm run test:visual:update
```

### Review Visual Diffs
After a test failure, review diffs in:
```
tests/playwright-report/index.html
```

## 🧪 Test Structure

### Test Files

**`homepage.spec.js`**
- Homepage functionality
- Hero section rendering
- Navigation functionality
- Form submissions
- Responsive design
- Performance checks

**`user-journeys.spec.js`**
- Newsletter subscription flow
- Documentation navigation
- Example code interaction
- GitHub integration
- Mobile menu navigation
- Keyboard accessibility

**`visual-regression.spec.js`**
- Full page screenshots at multiple breakpoints
- Component-level snapshots
- Dark mode validation
- Interaction state captures (hover, focus)

## 📱 Test Projects

Tests run across multiple configurations:

- **Desktop Chrome**: Primary browser (1280x720)
- **Mobile Chrome**: Pixel 5 viewport (393x851)
- **Tablet**: iPad Pro viewport (1024x1366)

### Add More Browsers

Uncomment in `playwright.config.js`:
```javascript
// Firefox
{
  name: 'firefox',
  use: { ...devices['Desktop Firefox'] },
}

// Safari
{
  name: 'webkit',
  use: { ...devices['Desktop Safari'] },
}
```

## ⚙️ Configuration

### Playwright Config (`playwright.config.js`)

Key settings:
- **Base URL**: `http://localhost:8000`
- **Timeout**: 30s per test
- **Retries**: 2 on CI, 0 locally
- **Parallel**: Full parallelization
- **Screenshots**: On failure only
- **Trace**: On first retry
- **Video**: Retained on failure

### Web Server

Tests automatically start dev server:
```javascript
webServer: {
  command: 'node dev-server.js',
  url: 'http://localhost:8000',
  reuseExistingServer: !process.env.CI,
}
```

## 🔍 Writing Tests

### Basic Test Structure
```javascript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    
    const element = page.locator('.selector');
    await expect(element).toBeVisible();
  });
});
```

### Visual Regression Test
```javascript
test('should match snapshot', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  await expect(page).toHaveScreenshot('page-name.png', {
    fullPage: true,
    animations: 'disabled',
  });
});
```

### User Journey Test
```javascript
test('complete flow', async ({ page }) => {
  await page.goto('/');
  
  // Fill form
  await page.fill('input[type="email"]', 'test@example.com');
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Verify success
  await expect(page.locator('.success')).toBeVisible();
});
```

## 📊 Test Reports

### HTML Report
After test run:
```bash
npx playwright show-report
```

View at: `tests/playwright-report/index.html`

### JSON Report
Machine-readable results:
```
tests/playwright-report/results.json
```

## 🐛 Debugging

### Debug Specific Test
```bash
npm run test:e2e:debug -- tests/e2e/homepage.spec.js
```

### Playwright Inspector
```bash
npx playwright test --debug
```

### Trace Viewer
After a failed test with trace:
```bash
npx playwright show-trace tests/test-results/.../trace.zip
```

## 🎯 Best Practices

### 1. Use Data Attributes for Test Selectors
```html
<button data-testid="submit-btn">Submit</button>
```
```javascript
page.locator('[data-testid="submit-btn"]')
```

### 2. Wait for Network Idle
```javascript
await page.waitForLoadState('networkidle');
```

### 3. Use Explicit Expectations
```javascript
await expect(element).toBeVisible();
await expect(element).toHaveText('Expected');
```

### 4. Mask Dynamic Content in Visual Tests
```javascript
await expect(page).toHaveScreenshot('page.png', {
  mask: [page.locator('.github-stars')],
});
```

### 5. Test at Multiple Breakpoints
```javascript
await page.setViewportSize({ width: 375, height: 667 });
```

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps chromium

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: tests/playwright-report/
```

## 📈 Performance Testing

Tests include performance checks:
- Page load time budget: < 3s
- Resource hint verification
- Network waterfall analysis (via trace)

## 🚨 Troubleshooting

### Tests Timing Out
- Increase timeout in `playwright.config.js`
- Check dev server is running
- Verify network connectivity

### Visual Test Failures
- Review diffs in HTML report
- Update snapshots if changes are intentional
- Check for dynamic content causing flakiness

### Element Not Found
- Add explicit waits: `await element.waitFor()`
- Check selector specificity
- Verify element is in viewport

### CI Failures
- Enable `trace: 'on'` in config
- Review uploaded artifacts
- Check for environment-specific issues

## 📚 Resources

- [Playwright Docs](https://playwright.dev/docs/intro)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors Guide](https://playwright.dev/docs/selectors)
- [API Reference](https://playwright.dev/docs/api/class-test)

## 🎓 Next Steps

1. ✅ Infrastructure setup complete
2. ⏭️ Run first test: `npm run test:e2e:ui`
3. ⏭️ Create baseline screenshots: `npm run test:visual`
4. ⏭️ Add more test coverage as needed
5. ⏭️ Integrate with CI/CD pipeline
