const { test, expect } = require('@playwright/test');

const pagesToTest = [
  '/',
  '/examples/',
  '/components/',
  '/cloudflare-workers-guide/',
  '/clodo-framework-guide/',
  '/product/',
  '/pricing/',
  '/migrate/',
  '/index/'
];

test.describe('Console errors on key pages', () => {
  for (const path of pagesToTest) {
    test(`No console errors on ${path}`, async ({ page, baseURL }) => {
      const errors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push({ text: msg.text(), location: msg.location() });
        }
      });

      await page.goto(baseURL + path);
      // Wait a bit for scripts to run and async logs
      await page.waitForTimeout(500);

      expect(errors, `Found console errors on ${path}: ${errors.map(e => e.text).join('; ')}`).toEqual([]);
    });
  }
});
