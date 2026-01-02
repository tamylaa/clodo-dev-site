import { chromium } from 'playwright';
import { getBaseUrl } from '../config/tooling.config.js';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/analytics`;
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });

  const links = await page.$$eval('link', (nodes) =>
    nodes.map((n) => ({ rel: n.rel, href: n.getAttribute('href'), as: n.getAttribute('as'), onload: n.getAttribute('onload') }))
  );

  const sheetCount = await page.evaluate(() => document.styleSheets.length);
  const preloadStyles = await page.$$eval('link[rel="preload"][as="style"]', (n) => n.map((l) => l.getAttribute('href')));

  console.log({ url, links, sheetCount, preloadStyles });
  await browser.close();
})();
