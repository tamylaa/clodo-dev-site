import { chromium } from 'playwright';
import { getBaseUrl } from '../config/tooling.config.js';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const url = `${getBaseUrl()}/blog/`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  async function sampleHeader() {
    const exists = await page.$('header.blog-index__header') !== null;
    if (!exists) return null;
    return await page.$eval('header.blog-index__header', el => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { h: r.height, top: r.top, paddingTop: cs.getPropertyValue('padding-top'), paddingBottom: cs.getPropertyValue('padding-bottom'), marginTop: cs.getPropertyValue('margin-top'), marginBottom: cs.getPropertyValue('margin-bottom'), fontSize: cs.getPropertyValue('font-size'), lineHeight: cs.getPropertyValue('line-height') };
    });
  }

  console.log('Sampling header at 0ms');
  console.log(await sampleHeader());

  for (let t = 100; t <= 2200; t += 100) {
    await page.waitForTimeout(100);
    console.log(`Sampling header at ${t}ms`, await sampleHeader());
  }

  await browser.close();
})();