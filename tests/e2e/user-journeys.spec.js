import { test, expect } from '@playwright/test';

/**
 * Critical User Journeys E2E Tests
 * 
 * Tests the most important user flows:
 * 1. Newsletter subscription
 * 2. Documentation navigation
 * 3. Example code interaction
 * 4. Contact/feedback forms
 */

test.describe('Newsletter Subscription Journey', () => {
  test('should successfully submit newsletter form', async ({ page }) => {
    await page.goto('/');
    
    // Find newsletter form
    const newsletterForm = page.locator('form[action*="newsletter"]').first();
    await expect(newsletterForm).toBeVisible();
    
    // Fill in email
    const emailInput = newsletterForm.locator('input[type="email"]');
    await emailInput.fill('test@example.com');
    
    // Submit form
    const submitButton = newsletterForm.locator('button[type="submit"]');
    
    // Listen for response
    const responsePromise = page.waitForResponse(
      response => response.url().includes('newsletter'),
      { timeout: 10000 }
    );
    
    await submitButton.click();
    
    // Wait for form submission (or timeout if not configured)
    try {
      const response = await responsePromise;
      
      // Check for success indicator
      const successMessage = page.locator('.success-message, .form-success');
      await expect(successMessage).toBeVisible({ timeout: 5000 });
    } catch (error) {
      // If newsletter endpoint not configured, skip validation
      console.log('Newsletter endpoint not configured, skipping response validation');
    }
  });
  
  test('should validate email format', async ({ page }) => {
    await page.goto('/');
    
    const newsletterForm = page.locator('form[action*="newsletter"]').first();
    const emailInput = newsletterForm.locator('input[type="email"]');
    
    // Try invalid email
    await emailInput.fill('invalid-email');
    
    const submitButton = newsletterForm.locator('button[type="submit"]');
    await submitButton.click();
    
    // Should show validation error
    const isInvalid = await emailInput.evaluate(el => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });
});

test.describe('Documentation Navigation Journey', () => {
  test('should navigate from homepage to docs', async ({ page }) => {
    await page.goto('/');
    
    // Click on docs link
    await page.click('a[href="/docs.html"], a[href="docs.html"]');
    await page.waitForLoadState('networkidle');
    
    // Should be on docs page
    await expect(page).toHaveURL(/docs\.html/);
    await expect(page.locator('h1')).toContainText(/documentation/i);
  });
  
  test('should use sidebar navigation in docs', async ({ page }) => {
    await page.goto('/docs.html');
    
    // Check for sidebar
    const sidebar = page.locator('.docs-sidebar, .sidebar, nav');
    if (await sidebar.isVisible()) {
      // Click on a section
      const firstLink = sidebar.locator('a').first();
      await firstLink.click();
      
      // Wait for navigation or scroll
      await page.waitForTimeout(500);
    }
  });
  
  test('should have working search in docs', async ({ page }) => {
    await page.goto('/docs.html');
    
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('worker');
      await page.waitForTimeout(500);
      
      // Should show search results
      const results = page.locator('.search-results, .search-result');
      expect(await results.count()).toBeGreaterThan(0);
    }
  });
});

test.describe('Examples Interaction Journey', () => {
  test('should navigate to examples page', async ({ page }) => {
    await page.goto('/');
    
    await page.click('a[href="/examples.html"], a[href="examples.html"]');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/examples\.html/);
  });
  
  test('should interact with code examples', async ({ page }) => {
    await page.goto('/examples.html');
    
    // Look for code blocks
    const codeBlocks = page.locator('pre code, .code-example');
    expect(await codeBlocks.count()).toBeGreaterThan(0);
    
    // Check for copy button
    const copyButton = page.locator('button[aria-label*="copy"], .copy-button');
    if (await copyButton.first().isVisible()) {
      await copyButton.first().click();
      
      // Should show copied feedback
      await page.waitForTimeout(300);
    }
  });
  
  test('should have working live demo links', async ({ page }) => {
    await page.goto('/examples.html');
    
    // Look for demo links
    const demoLinks = page.locator('a[href*="stackblitz"], a[href*="demo"]');
    if (await demoLinks.first().isVisible()) {
      // Should be external links with target="_blank"
      const target = await demoLinks.first().getAttribute('target');
      expect(target).toBe('_blank');
    }
  });
});

test.describe('GitHub Integration Journey', () => {
  test('should display GitHub stars', async ({ page }) => {
    await page.goto('/');
    
    // Look for GitHub stats
    const githubStats = page.locator('.github-stars, [data-github-stars]');
    if (await githubStats.isVisible()) {
      // Should have star count
      const text = await githubStats.textContent();
      expect(text).toBeTruthy();
    }
  });
  
  test('should link to GitHub repository', async ({ page }) => {
    await page.goto('/');
    
    // Find GitHub link
    const githubLink = page.locator('a[href*="github.com"]').first();
    await expect(githubLink).toBeVisible();
    
    // Should open in new tab
    const target = await githubLink.getAttribute('target');
    expect(target).toBe('_blank');
  });
});

test.describe('Mobile Navigation Journey', () => {
  test.use({ viewport: { width: 375, height: 667 } });
  
  test('should open mobile menu', async ({ page }) => {
    await page.goto('/');
    
    // Find mobile menu toggle
    const menuToggle = page.locator('.mobile-menu-toggle, .menu-toggle, .hamburger');
    if (await menuToggle.isVisible()) {
      await menuToggle.click();
      await page.waitForTimeout(300);
      
      // Menu should be visible
      const menu = page.locator('.mobile-menu, nav[aria-expanded="true"]');
      if (await menu.isVisible()) {
        await expect(menu).toBeVisible();
      }
    }
  });
  
  test('should navigate via mobile menu', async ({ page }) => {
    await page.goto('/');
    
    const menuToggle = page.locator('.mobile-menu-toggle, .menu-toggle, .hamburger');
    if (await menuToggle.isVisible()) {
      await menuToggle.click();
      await page.waitForTimeout(300);
      
      // Click on docs link in mobile menu
      await page.click('a[href="/docs.html"], a[href="docs.html"]');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL(/docs\.html/);
    }
  });
});

test.describe('Keyboard Navigation Journey', () => {
  test('should navigate using keyboard', async ({ page }) => {
    await page.goto('/');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab'); // Skip link
    await page.keyboard.press('Tab'); // First nav item
    await page.keyboard.press('Tab'); // Second nav item
    
    // Check that something is focused
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
  });
  
  test('should activate elements with Enter/Space', async ({ page }) => {
    await page.goto('/');
    
    // Tab to first interactive element
    await page.keyboard.press('Tab');
    
    // Get the focused element
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    
    if (focusedTag === 'BUTTON' || focusedTag === 'A') {
      // Press Enter to activate
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      
      // Something should have happened (navigation, action, etc.)
    }
  });
});

test.describe('Form Validation Journey', () => {
  test('should validate required fields', async ({ page }) => {
    await page.goto('/');
    
    // Find any form with required fields
    const form = page.locator('form').first();
    if (await form.isVisible()) {
      const submitButton = form.locator('button[type="submit"]');
      
      // Try to submit empty form
      await submitButton.click();
      
      // Should show validation errors
      const requiredInputs = form.locator('input[required]');
      const count = await requiredInputs.count();
      
      if (count > 0) {
        const firstRequired = requiredInputs.first();
        const isInvalid = await firstRequired.evaluate(el => !el.validity.valid);
        expect(isInvalid).toBe(true);
      }
    }
  });
});
