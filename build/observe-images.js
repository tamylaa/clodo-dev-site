import { chromium } from 'playwright';
import { getBaseUrl } from '../config/tooling.config.js';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${getBaseUrl()}/blog/`, { waitUntil: 'domcontentloaded' });

  async function snapshot() {
    return await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('main .container img'));
      return imgs.map(img => ({ src: img.currentSrc || img.src, complete: img.complete, naturalH: img.naturalHeight, h: img.getBoundingClientRect().height, top: img.getBoundingClientRect().top }));
    });
  }

  console.log('image snapshot at 0ms', await snapshot());
  for (let t = 100; t <= 2200; t += 200) {
    await page.waitForTimeout(200);
    console.log(`image snapshot at ${t}ms`, await snapshot());
  }

  await browser.close();
})();