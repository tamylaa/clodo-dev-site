import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8000';

const ampPages = [
  '/amp/en/blog/building-developer-communities.amp.html',
  '/amp/en/blog/clodo-framework-enterprise-roi.amp.html',
  '/amp/en/blog/cloudflare-infrastructure-myth.amp.html',
  '/amp/en/blog/cloudflare-workers-tutorial-beginners.amp.html',
  '/amp/en/blog/debugging-silent-build-failures.amp.html',
  '/amp/en/blog/index.amp.html',
  '/amp/en/blog/instant-try-it-impact.amp.html',
  '/amp/en/blog/stackblitz-integration-journey.amp.html',
  '/amp/en/blog/v8-isolates-comprehensive-guide.amp.html'
];

test.describe('AMP canonical checks', () => {
  for (const p of ampPages) {
    test(`${p} should have canonical pointing to non-AMP`, async ({ page }) => {
      await page.goto(`${BASE}${p}`);
      const canonical = await page.$eval('link[rel="canonical"]', el => el.getAttribute('href'));
expect(canonical).toMatch(/^https:\/\/www\.clodo\.dev\/blog/);
      expect(canonical).not.toContain('/amp');
    });
  }
});
