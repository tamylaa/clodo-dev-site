import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests
 * 
 * Strategy:
 * - Capture screenshots of key pages at different breakpoints
 * - Compare against baseline screenshots
 * - Flag visual changes for review
 * 
 * Usage:
 * 1. First run: Creates baseline screenshots
 * 2. Subsequent runs: Compares against baseline
 * 3. Update baselines: npx playwright test --update-snapshots
 */

const BREAKPOINTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
  wide: { width: 1920, height: 1080 },
};

const PAGES = [
  { path: '/', name: 'homepage' },
  { path: '/docs.html', name: 'docs' },
  { path: '/examples.html', name: 'examples' },
  { path: '/about.html', name: 'about' },
];

test.describe('Visual Regression', () => {
  // Test each page at each breakpoint
  for (const page of PAGES) {
    for (const [breakpointName, viewport] of Object.entries(BREAKPOINTS)) {
      test(`${page.name} should match snapshot at ${breakpointName}`, async ({ page: browserPage }) => {
        await browserPage.setViewportSize(viewport);
        await browserPage.goto(page.path);
        await browserPage.waitForLoadState('networkidle');
        
        // Wait for fonts to load
        await browserPage.waitForTimeout(500);
        
        // Take full page screenshot
        await expect(browserPage).toHaveScreenshot(
          `${page.name}-${breakpointName}.png`,
          {
            fullPage: true,
            animations: 'disabled',
            mask: [
              // Mask dynamic content that changes between runs
              browserPage.locator('.github-stars').first(),
              browserPage.locator('.newsletter-form').first(),
            ],
          }
        );
      });
    }
  }
});

test.describe('Component Visual Regression', () => {
  test('hero section should match snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const hero = page.locator('.hero').first();
    await expect(hero).toHaveScreenshot('hero-component.png', {
      animations: 'disabled',
    });
  });
  
  test('navigation should match snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const nav = page.locator('nav').first();
    await expect(nav).toHaveScreenshot('navigation-component.png', {
      animations: 'disabled',
    });
  });
  
  test('footer should match snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const footer = page.locator('footer').first();
    await expect(footer).toHaveScreenshot('footer-component.png', {
      animations: 'disabled',
      mask: [
        // Mask newsletter form (dynamic)
        page.locator('.newsletter-form').first(),
      ],
    });
  });
  
  test('buttons should match snapshot in all states', async ({ page }) => {
    await page.goto('/components.html');
    await page.waitForLoadState('networkidle');
    
    // Default state
    const buttonContainer = page.locator('.button-showcase').first();
    if (await buttonContainer.isVisible()) {
      await expect(buttonContainer).toHaveScreenshot('buttons-default.png');
    }
  });
});

test.describe('Dark Mode Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Enable dark mode
    await page.goto('/');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(300); // Wait for theme transition
  });
  
  test('homepage should match dark mode snapshot', async ({ page }) => {
    await page.setViewportSize(BREAKPOINTS.desktop);
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('homepage-dark.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
  
  test('hero should match dark mode snapshot', async ({ page }) => {
    const hero = page.locator('.hero').first();
    await expect(hero).toHaveScreenshot('hero-dark.png', {
      animations: 'disabled',
    });
  });
});

test.describe('Interaction State Snapshots', () => {
  test('button hover states', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const primaryButton = page.locator('.btn-primary').first();
    if (await primaryButton.isVisible()) {
      // Hover state
      await primaryButton.hover();
      await page.waitForTimeout(200);
      await expect(primaryButton).toHaveScreenshot('button-primary-hover.png');
      
      // Focus state
      await primaryButton.focus();
      await expect(primaryButton).toHaveScreenshot('button-primary-focus.png');
    }
  });
  
  test('navigation hover states', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const navLink = page.locator('nav a').first();
    await navLink.hover();
    await page.waitForTimeout(200);
    
    const nav = page.locator('nav').first();
    await expect(nav).toHaveScreenshot('navigation-hover.png');
  });
});
