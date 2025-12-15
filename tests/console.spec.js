import { test, expect } from '@playwright/test';

const pagesToTest = [
  '/',
  '/examples/',
  '/components/',
  '/cloudflare-workers-guide/',
  '/clodo-framework-guide/',
  '/product/',
  '/pricing/',
  '/migrate/',
    // '/index/' intentionally omitted; use '/' for homepage
];

test.describe('Console errors on key pages', () => {
  const base = process.env.PW_BASE_URL || process.env.BASE_URL || 'http://localhost:8000';
  for (const path of pagesToTest) {
    test(`No console errors on ${path}`, async ({ page }) => {
      const errors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push({ text: msg.text(), location: msg.location() });
        }
      });

      // Navigate to absolute URL built from base server URL
      await page.goto(base + path);
      // Wait a bit for scripts to run and async logs
      await page.waitForTimeout(500);

      expect(errors, `Found console errors on ${path}: ${errors.map(e => e.text).join('; ')}`).toEqual([]);
    });
  }
});
