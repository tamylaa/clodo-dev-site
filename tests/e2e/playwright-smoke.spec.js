import fs from 'fs';
import { test } from '@playwright/test';

test('smoke screenshots for Stream page (desktop & mobile)', async ({ page, browserName }, testInfo) => {
  // Navigate to the Stream guide (baseURL is provided by Playwright config)
  await page.goto('/cloudflare-stream-complete-guide');
  await page.waitForLoadState('networkidle');

  // Ensure output directory exists
  const outDir = 'tests/playwright-screenshots';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Save screenshot to file for easy inspection
  const filename = `${outDir}/${browserName}.png`;
  await page.screenshot({ path: filename, fullPage: true });

  // Attach screenshot to Playwright report
  await testInfo.attach(`${browserName}-screenshot`, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
});
