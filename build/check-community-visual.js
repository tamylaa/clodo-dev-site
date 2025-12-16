import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const url = 'https://www.clodo.dev/community/welcome';
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });

  const hasNav = await page.$('nav.navbar') !== null;
  const navVisible = hasNav ? await page.$eval('nav.navbar', (el) => getComputedStyle(el).getPropertyValue('display')) : 'missing';
  const skipLink = await page.$('a.skip-link') !== null;

  console.log({ url, hasNav, navVisible, skipLink });
  await browser.close();
})();
