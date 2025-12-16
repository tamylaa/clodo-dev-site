import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const url = 'https://www.clodo.dev/blog/building-developer-communities';
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });

  const links = await page.$$eval('link', (nodes) => nodes.map(n => ({rel: n.rel, href: n.getAttribute('href')})));
  const linksCount = links.length;
  const scriptCount = await page.$$eval('script[src]', (n) => n.length);
  let headerDisplay = 'missing';
  try {
    headerDisplay = await page.$eval('.blog-post__header', (el) =>
      getComputedStyle(el).getPropertyValue('display')
    );
  } catch (e) {}

  const headHTML = await page.$eval('head', h => h.innerHTML.slice(0,2000));

  console.log({ url, linksCount, links, scriptCount, headerDisplay });
  console.log('HEAD SNIPPET:\n', headHTML);
  await browser.close();
})();
