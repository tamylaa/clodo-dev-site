/**
 * Performance Dashboard Integration Tests
 *
 * Tests the performance dashboard page (now a documentation page).
 * NOTE: Performance monitoring is now provided as a shim for compatibility.
 */

import { test, expect } from '@playwright/test';

test.describe('Performance Dashboard Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/performance-dashboard.html');
        await page.waitForLoadState('networkidle');
        // Wait for dashboard to render - reduced from 3000ms
        await page.waitForTimeout(1000);
    });

    test('should load performance dashboard page', async ({ page }) => {
        const title = await page.title();
        expect(title).toContain('Performance Dashboard');
    });

    test('should have noindex meta tag (admin page)', async ({ page }) => {
        const noindex = await page.$eval(
            'meta[name="robots"]',
            el => el.content
        );

        expect(noindex).toContain('noindex');
        expect(noindex).toContain('nofollow');
    });

    test('should display dashboard structure', async ({ page }) => {
        // Check for main dashboard elements that exist in the HTML
        const heroHeading = await page.$('h1:has-text("Performance Dashboard")');
        expect(heroHeading).toBeTruthy();

        const refreshButton = await page.$('button:has-text("Refresh Metrics")');
        expect(refreshButton).toBeTruthy();

        // Check that dashboard sections exist
        const metricsGrid = await page.$('#metrics-grid');
        expect(metricsGrid).toBeTruthy();

        console.log('Performance dashboard structure loaded');
    });

    test.skip('should show LCP metric', async ({ page }) => {
        // Skipped: Performance monitoring is now a shim
        console.log('LCP metric test skipped - performance monitoring shim active');
    });

    test.skip('should show FID metric', async ({ page }) => {
        // Skipped: Performance monitoring is now a shim
        console.log('FID metric test skipped - performance monitoring shim active');
    });

    test.skip('should show CLS metric', async ({ page }) => {
        // Skipped: Performance monitoring is now a shim
        console.log('CLS metric test skipped - performance monitoring shim active');
    });

    test('should display network information (shim)', async ({ page }) => {
        const networkInfo = await page.$('#network-info');
        expect(networkInfo).toBeTruthy();

        const text = await networkInfo.textContent();
        // With shim, network info will be empty or show "not available"
        expect(text.length).toBeGreaterThan(0);
        console.log('Network info (shim):', text);
    });

    test('should show errors list (shim)', async ({ page }) => {
        const errorsList = await page.$('#errors-list');
        expect(errorsList).toBeTruthy();

        // Wait a bit for JavaScript to potentially populate
        await page.waitForTimeout(3000);

        const text = await errorsList.textContent();
        // With shim, may be empty or show placeholder text
        expect(text !== null).toBeTruthy();
        console.log('Errors section (shim):', text.substring(0, 100));
    });

    test('should show slow resources section (shim)', async ({ page }) => {
        const slowResources = await page.$('#slow-resources');
        expect(slowResources).toBeTruthy();

        // Wait a bit for JavaScript to potentially populate
        await page.waitForTimeout(3000);

        const text = await slowResources.textContent();
        // With shim, may be empty or show placeholder text
        expect(text !== null).toBeTruthy();
        console.log('Slow resources (shim):', text.substring(0, 100));
    });

    test('should show session info (shim)', async ({ page }) => {
        const sessionInfo = await page.$('#session-info');
        expect(sessionInfo).toBeTruthy();

        // With shim, session info may be empty or minimal
        const text = await sessionInfo.textContent();
        expect(text.length).toBeGreaterThan(0);
        console.log('Session info (shim):', text.substring(0, 150));
    });

    test('should have refresh button (non-functional with shim)', async ({ page }) => {
        const refreshButton = await page.$('button:has-text("Refresh Metrics")');
        expect(refreshButton).toBeTruthy();

        // Button exists but clicking won't do anything meaningful with shim
        // We don't test functionality since it's now a documentation page
    });

    test.skip('should auto-refresh every 5 seconds (skipped with shim)', async ({ page }) => {
        // Skipped: Auto-refresh doesn't work meaningfully with performance monitoring shim
        console.log('Auto-refresh test skipped - performance monitoring shim active');
    });

    test.skip('should color-code metrics by rating (skipped with shim)', async ({ page }) => {
        // Skipped: No metrics to color-code with performance monitoring shim
        console.log('Color-coding test skipped - performance monitoring shim active');
    });

    test('should work without JavaScript (basic HTML)', async ({ browser }) => {
        const context = await browser.newContext({ javaScriptEnabled: false });
        const page = await context.newPage();

        const response = await page.goto('/performance-dashboard.html');
        expect(response.status()).toBe(200);

        // Basic structure should be present
        const body = await page.textContent('body');
        expect(body).toContain('Performance Dashboard');

        await page.close();
    });
});
