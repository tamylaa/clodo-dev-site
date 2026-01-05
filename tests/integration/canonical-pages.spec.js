import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8000';

const pages = [
  {
    path: '/experiments/clodo-framework-api-simplification-variant-a.html',
    expected: 'https://clodo.dev/experiments/clodo-framework-api-simplification-variant-a',
  },
  {
    path: '/experiments/clodo-framework-api-simplification-variant-b.html',
    expected: 'https://clodo.dev/experiments/clodo-framework-api-simplification-variant-b',
  },
  {
    path: '/experiments/clodo-framework-promise-to-reality-variant-a.html',
    expected: 'https://clodo.dev/experiments/clodo-framework-promise-to-reality-variant-a',
  },
  {
    path: '/experiments/clodo-framework-promise-to-reality-variant-b.html',
    expected: 'https://clodo.dev/experiments/clodo-framework-promise-to-reality-variant-b',
  },
  {
    path: '/experiments/how-to-migrate-from-wrangler-variant-a.html',
    expected: 'https://clodo.dev/experiments/how-to-migrate-from-wrangler-variant-a',
  },
  {
    path: '/experiments/how-to-migrate-from-wrangler-variant-b.html',
    expected: 'https://clodo.dev/experiments/how-to-migrate-from-wrangler-variant-b',
  },
  {
    path: '/i18n/de/clodo-framework-api-simplification.html',
    expected: 'https://clodo.dev/i18n/de/clodo-framework-api-simplification',
  },
  {
    path: '/i18n/de/clodo-framework-promise-to-reality.html',
    expected: 'https://clodo.dev/i18n/de/clodo-framework-promise-to-reality',
  },
  {
    path: '/i18n/de/how-to-migrate-from-wrangler.html',
    expected: 'https://clodo.dev/i18n/de/how-to-migrate-from-wrangler',
  },
];

test.describe('Canonical smoke checks for experiments & i18n pages', () => {
  for (const p of pages) {
    test(p.path, async ({ page }) => {
      await page.goto(`${BASE}${p.path}`);

      // Validate canonical tag
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      // Normalize by removing any trailing .html so tests don't fail on extensionless canonicals
      const canonicalNormalized = canonical ? canonical.replace(/\.html$/i, '') : canonical;
      const expectedNormalized = p.expected ? p.expected.replace(/\.html$/i, '') : p.expected;
      expect(canonicalNormalized, `canonical for ${p.path}`).toBe(expectedNormalized);

      // Ensure page has an H1 (not the homepage placeholder)
      const h1 = await page.locator('h1').first().textContent();
      expect(h1).toBeTruthy();

      // Title shouldn't be the generic homepage title
      const title = await page.title();
      expect(title).not.toBe('Clodo Framework - Pre-Flight Checker for Cloudflare Workers | Reduce Custom Software Costs by 60%');
    });
  }
});
