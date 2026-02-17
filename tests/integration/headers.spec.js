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

  test('subscribe page should be indexable (meta robots)', async ({ page }) => {
    await page.goto(`${BASE}/subscribe.html`);
    const robots = await page.$eval('meta[name="robots"]', el => el.getAttribute('content'));
    expect(robots).toContain('index');
  });

  test('thank-you and 404 pages should be noindex and have explicit _headers entry', async ({ request }) => {
    const fs = await import('fs');
    const headersFile = fs.readFileSync('public/_headers', 'utf8');
    const paths = ['/subscribe/thanks.html', '/download/thanks/index.html', '/404.html'];
    for (const p of paths) {
      const res = await request.get(`${BASE}${p}`);
      expect(res.ok()).toBeTruthy();

      // page-level meta must be noindex
      const pageText = await res.text();
      expect(pageText).toMatch(/<meta[^>]*name=(?:"|')robots(?:"|')[^>]*content=(?:"|')[^"']*noindex/);

      // repo-level _headers should include explicit X-Robots-Tag for that path
      expect(headersFile).toContain(p);
      expect(headersFile).toMatch(/X-Robots-Tag:\s*noindex/);
    }
  });

  test('sitemap.xml should be available and contain site root; list indexable URLs', async ({ request }) => {
    const res = await request.get(`${BASE}/sitemap.xml`);
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain('https://www.clodo.dev/');
    expect(body).toContain('https://www.clodo.dev/subscribe');

    // ensure sitemap URLs are indexable (no meta noindex)
    const urlMatches = body.match(/<loc>(.*?)<\/loc>/g) || [];
    const urls = urlMatches.map(m => m.replace(/<loc>|<\/loc>/g, ''));
    for (const u of urls) {
      const path = u.replace('https://www.clodo.dev', '');
      const pageRes = await request.get(`${BASE}${path}`);
      const pageText = await pageRes.text();
      expect(pageText).not.toMatch(/<meta[^>]*name=(?:\"|\')robots(?:\"|\')[^>]*content=(?:\"|\')[^\"']*noindex/);
    }
  });
});