import { chromium } from 'playwright';
import { getBaseUrl } from '../config/tooling.config.js';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${getBaseUrl()}/blog/`, { waitUntil: 'domcontentloaded' });

  const mutations = await page.evaluate(() => {
    return new Promise((resolve) => {
      const log = [];
      const observer = new MutationObserver((records) => {
        records.forEach(r => {
          log.push({ type: r.type, target: r.target && r.target.className ? r.target.className : r.target ? r.target.tagName : null, added: r.addedNodes ? Array.from(r.addedNodes).map(n => ({tag: n.tagName, class: n.className})) : [] });
        });
      });
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeOldValue: true });
      setTimeout(() => { observer.disconnect(); resolve(log); }, 2300);
    });
  });

  // Filter interesting mutations
  const interesting = mutations.filter(m => m.added && m.added.length > 0 || m.type === 'attributes');
  console.log('Interesting mutations:', interesting.slice(0,50));

  await browser.close();
})();