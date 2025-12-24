import { chromium } from 'playwright';
import { getBaseUrl } from '../config/tooling.config.js';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const baseUrl = getBaseUrl();
  await page.goto(`${baseUrl}/`, { waitUntil: 'load', timeout: 60000 });

  const links = await page.$$eval('link', (nodes) =>
    nodes.map((n) => ({ rel: n.rel, href: n.getAttribute('href'), as: n.getAttribute('as'), onload: n.getAttribute('onload') }))
  );
  const styleCount = await page.$$eval('link[rel=stylesheet]', (n) => n.length);
  let heroDisplay = 'missing';
  try {
    heroDisplay = await page.$eval('#hero-title', (el) => getComputedStyle(el).getPropertyValue('display'));
  } catch (e) { void e; }

  console.log({ links, styleCount, heroDisplay });
  await browser.close();
})();
