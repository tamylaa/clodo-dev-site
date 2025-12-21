import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8000';

test('Blog index links navigate to absolute /blog/<slug> path and load article', async ({ page }) => {
    // Visit the blog index (source of many links)
    await page.goto(`${BASE}/blog/index.html`);

    // Find the specific link by href and click it
    const selector = 'a[href="/blog/cloudflare-infrastructure-myth"]';
    await page.waitForSelector(selector);

    await Promise.all([
        page.waitForNavigation({ waitUntil: 'load' }),
        page.click(selector),
    ]);

    // Assert final URL and presence of article title
    expect(page.url()).toContain('/blog/cloudflare-infrastructure-myth');

    const title = await page.locator('h1').first().innerText();
    expect(title.toLowerCase()).toContain('cloudflare');
});
