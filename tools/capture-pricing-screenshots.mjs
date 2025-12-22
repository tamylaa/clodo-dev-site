import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const outDir = '.test-output/screenshots/pricing';
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Relay page console messages to the node console for diagnostics
  page.on('console', msg => {
    try { console.log(`[page.${msg.type()}] ${msg.text()}`); } catch (e) { console.log('[page.console] (failed to read message)'); }
  });

  // Load the local dist HTML directly into the page to avoid network/server issues
  const html = fs.readFileSync('./dist/pricing.html', 'utf8');
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(300); // allow initial scripts to run (if any)

  const viewports = [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1366, height: 768 }
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });

    const path = `${outDir}/${vp.name}.png`;

    try {
      await page.waitForTimeout(500); // allow minor animations to settle
      await page.screenshot({ path, fullPage: false });
      console.log('Saved screenshot:', path);
    } catch (errVp) {
      console.warn('Screenshot failed for', vp.name, errVp.message);
      // continue with next viewport
      continue;
    }
  }

  await browser.close();
})();