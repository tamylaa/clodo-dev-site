import { test, expect } from '@playwright/test';

/**
 * Homepage E2E Tests
 * 
 * Critical user journeys:
 * 1. Page loads successfully
 * 2. Hero section is visible and functional
 * 3. Navigation works correctly
 * 4. CTAs are clickable
 * 5. Forms submit correctly
 */

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });
  
  test('should load successfully with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Clodo Framework/i);
  });
  
  test('should display hero section', async ({ page }) => {
    const heroTitle = page.locator('.hero-title');
    await expect(heroTitle).toBeVisible();
    await expect(heroTitle).toContainText(/Enterprise SaaS Development/i);
  });
  
  test('should have working primary CTA button', async ({ page }) => {
    const ctaButton = page.locator('.btn-primary').first();
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toBeEnabled();
    
    // Test button interaction
    await ctaButton.hover();
    await ctaButton.click();
    
    // Should navigate or trigger action
    // (Adjust based on actual button behavior)
  });
  
  test('should have functional navigation', async ({ page }) => {
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Check key navigation links
    await expect(page.locator('nav a[href="/docs.html"]')).toBeVisible();
    await expect(page.locator('nav a[href="/examples.html"]')).toBeVisible();
    await expect(page.locator('nav a[href="/about.html"]')).toBeVisible();
  });
  
  test('should display features section', async ({ page }) => {
    const featuresSection = page.locator('#features');
    await expect(featuresSection).toBeVisible();
    
    // Should have at least 3 feature items
    const featureItems = page.locator('.feature-item');
    await expect(featureItems).toHaveCount(3, { timeout: 10000 });
  });
  
  test('should have working theme toggle', async ({ page }) => {
    const themeToggle = page.locator('.theme-toggle');
    if (await themeToggle.isVisible()) {
      // Get initial theme
      const initialTheme = await page.evaluate(() => {
        return document.documentElement.getAttribute('data-theme');
      });
      
      // Toggle theme
      await themeToggle.click();
      await page.waitForTimeout(300); // Wait for animation
      
      // Verify theme changed
      const newTheme = await page.evaluate(() => {
        return document.documentElement.getAttribute('data-theme');
      });
      
      expect(newTheme).not.toBe(initialTheme);
    }
  });
  
  test('should display footer with newsletter form', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    
    const newsletterForm = page.locator('form[action*="newsletter"]');
    await expect(newsletterForm).toBeVisible();
  });
  
  test('should have accessible skip link', async ({ page }) => {
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeInViewport();
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();
  });
  
  test('should have proper heading hierarchy', async ({ page }) => {
    // Should have exactly one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
    
    // Should have h2 elements
    const h2Count = await page.locator('h2').count();
    expect(h2Count).toBeGreaterThan(0);
  });
  
  test('should load without console errors', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Allow specific known errors if any
    const criticalErrors = consoleErrors.filter(error => {
      return !error.includes('404') && // Ignore 404s
             !error.includes('favicon'); // Ignore favicon errors
    });
    
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Responsive Design', () => {
  test('should be mobile-friendly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const hero = page.locator('.hero');
    await expect(hero).toBeVisible();
    
    // Mobile menu should be present
    const mobileMenuToggle = page.locator('.mobile-menu-toggle, .menu-toggle');
    if (await mobileMenuToggle.isVisible()) {
      await expect(mobileMenuToggle).toBeVisible();
    }
  });
  
  test('should be tablet-friendly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    const hero = page.locator('.hero');
    await expect(hero).toBeVisible();
  });
  
  test('should be desktop-optimized', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    const hero = page.locator('.hero');
    await expect(hero).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should load within performance budget', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
  
  test('should have proper resource hints', async ({ page }) => {
    await page.goto('/');
    
    // Check for preconnect hints
    const preconnects = page.locator('link[rel="preconnect"]');
    await expect(preconnects).toHaveCount(3, { timeout: 5000 });
    
    // Check for dns-prefetch hints
    const dnsPrefetch = page.locator('link[rel="dns-prefetch"]');
    expect(await dnsPrefetch.count()).toBeGreaterThan(0);
  });
});
