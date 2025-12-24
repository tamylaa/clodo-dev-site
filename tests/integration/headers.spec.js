import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8000';

test.describe('SEO & Robots checks', () => {
  test('index.html should be indexable (meta robots)', async ({ page }) => {
    await page.goto(`${BASE}/index.html`);
    const robots = await page.$eval('meta[name="robots"]', el => el.getAttribute('content'));
    expect(robots).toContain('index');
  });

  test('performance-dashboard should have noindex meta', async ({ page }) => {
    await page.goto(`${BASE}/performance-dashboard.html`);
    const robots = await page.$eval('meta[name="robots"]', el => el.getAttribute('content'));
    expect(robots).toContain('noindex');
  });

  test('subscribe page should be noindex', async ({ page }) => {
    await page.goto(`${BASE}/subscribe.html`);
    const robots = await page.$eval('meta[name="robots"]', el => el.getAttribute('content'));
    expect(robots).toContain('noindex');
  });

  test('sitemap.xml should be available and contain site root', async ({ request }) => {
    const res = await request.get(`${BASE}/sitemap.xml`);
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    // Should contain a loc entry
    expect(body).toMatch(/<loc>https?:\/\/[^<]+<\/loc>/);
  });
});