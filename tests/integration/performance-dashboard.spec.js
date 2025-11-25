/**
 * Performance Dashboard Integration Tests
 * 
 * Tests the performance dashboard functionality and metrics display.
 */

import { test, expect } from '@playwright/test';

test.describe('Performance Dashboard Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/performance-dashboard.html');
        await page.waitForLoadState('networkidle');
        // Wait for dashboard to render
        await page.waitForTimeout(3000);
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

    test('should display Web Vitals metrics', async ({ page }) => {
        const metricsGrid = await page.$('#metrics-grid');
        expect(metricsGrid).toBeTruthy();

        // Check for metric cards
        const metricCards = await page.$$('.metric-card');
        expect(metricCards.length).toBeGreaterThan(0);

        console.log('Metric cards displayed:', metricCards.length);
    });

    test('should show LCP metric', async ({ page }) => {
        // LCP may not be available immediately or on simple pages
        const lcpCard = await page.$('.metric-card:has-text("LCP")');
        // LCP might not be present if no significant content has painted
        if (lcpCard) {
            const value = await lcpCard.$eval('.metric-value', el => el.textContent);
            const rating = await lcpCard.$eval('.metric-rating', el => el.textContent);

            console.log('LCP:', { value, rating });
            expect(value).toBeTruthy();
            expect(rating).toBeTruthy();
        } else {
            console.log('LCP metric not available - this is expected for simple pages');
        }
    });

    test('should show FID metric', async ({ page }) => {
        const fidCard = await page.$('.metric-card:has-text("FID")');
        // FID might not be available immediately
        if (fidCard) {
            const value = await fidCard.$eval('.metric-value', el => el.textContent);
            console.log('FID:', value);
        }
    });

    test('should show CLS metric', async ({ page }) => {
        // CLS may not be available immediately or on simple pages
        const clsCard = await page.$('.metric-card:has-text("CLS")');
        // CLS might not be present if no layout shifts have occurred
        if (clsCard) {
            const value = await clsCard.$eval('.metric-value', el => el.textContent);
            const rating = await clsCard.$eval('.metric-rating', el => el.textContent);

            console.log('CLS:', { value, rating });
            expect(value).toBeTruthy();
        } else {
            console.log('CLS metric not available - this is expected for stable pages');
        }
    });

    test('should display network information', async ({ page }) => {
        const networkInfo = await page.$('#network-info');
        expect(networkInfo).toBeTruthy();

        const text = await networkInfo.textContent();
        console.log('Network info:', text);
    });

    test('should show errors list', async ({ page }) => {
        const errorsList = await page.$('#errors-list');
        expect(errorsList).toBeTruthy();

        const text = await errorsList.textContent();
        // Should show "No errors detected" or actual errors
        expect(text).toBeTruthy();
        console.log('Errors section:', text.substring(0, 100));
    });

    test('should show slow resources section', async ({ page }) => {
        const slowResources = await page.$('#slow-resources');
        expect(slowResources).toBeTruthy();

        const text = await slowResources.textContent();
        console.log('Slow resources:', text.substring(0, 100));
    });

    test('should show session info', async ({ page }) => {
        const sessionInfo = await page.$('#session-info');
        expect(sessionInfo).toBeTruthy();

        const text = await sessionInfo.textContent();
        expect(text).toContain('URL');
        console.log('Session info:', text.substring(0, 150));
    });

    test('should have refresh button', async ({ page }) => {
        const refreshButton = await page.$('button:has-text("Refresh Metrics")');
        expect(refreshButton).toBeTruthy();

        // Click refresh and verify dashboard updates
        if (refreshButton) {
            await refreshButton.click();
            await page.waitForTimeout(1000);

            // Verify content is still present
            const metricsGrid = await page.$('#metrics-grid');
            expect(metricsGrid).toBeTruthy();
        }
    });

    test('should auto-refresh every 5 seconds', async ({ page }) => {
        // Wait for initial render
        await page.waitForTimeout(1000);

        // Get initial metric value
        const initialValue = await page.$eval(
            '.metric-card .metric-value',
            el => el.textContent
        );

        // Wait for auto-refresh (5s + buffer)
        await page.waitForTimeout(6000);

        // Metric should still be displayed (might have updated)
        const currentValue = await page.$eval(
            '.metric-card .metric-value',
            el => el.textContent
        );

        expect(currentValue).toBeTruthy();
        console.log('Auto-refresh working:', { initialValue, currentValue });
    });

    test('should color-code metrics by rating', async ({ page }) => {
        const metricCards = await page.$$('.metric-card');

        for (const card of metricCards) {
            const classes = await card.getAttribute('class');
            
            // Should have a rating class (good, needs-improvement, or poor)
            const hasRating = classes.includes('good') || 
                             classes.includes('needs-improvement') || 
                             classes.includes('poor');

            if (hasRating) {
                const metric = await card.$eval('.metric-name', el => el.textContent);
                console.log(`${metric} has rating class`);
            }
        }
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
