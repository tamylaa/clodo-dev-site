import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8000';

// Load site config for expected canonical base
let CANONICAL_BASE = 'https://www.example.com';
try {
  const configModule = await import('../../config/site.config.js');
  CANONICAL_BASE = configModule.default?.url || CANONICAL_BASE;
} catch (e) {
  // Use default
}

// Configure test pages here - adjust paths and expected canonicals for your site
const pages = [
  {
    path: '/index.html',
    expected: `${CANONICAL_BASE}/`,
  },
  {
    path: '/about.html',
    expected: `${CANONICAL_BASE}/about`,
  },
  {
    path: '/pricing.html',
    expected: `${CANONICAL_BASE}/pricing`,
  },
  // Add more pages as needed
];

test.describe('Canonical smoke checks for pages', () => {
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
