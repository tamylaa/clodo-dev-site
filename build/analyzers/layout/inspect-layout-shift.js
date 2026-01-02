import { chromium } from 'playwright';
import { getBaseUrl } from '../config/tooling.config.js';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const url = `${getBaseUrl()}/blog/`;
  console.log('Inspecting', url);
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  function snapshot() {
    const nodes = Array.from(document.body.children).map((el, i) => {
      const rect = el.getBoundingClientRect();
      return { idx: i, tag: el.tagName, class: el.className, h: rect.height, top: rect.top };
    });
    return nodes;
  }

  const now = await page.evaluate(snapshot);
  console.log('DOMContentLoaded snapshot:', now);

  // snapshot of main children
  const mainNow = await page.evaluate(() => {
    const main = document.querySelector('main');
    if (!main) return [];
    const container = main.querySelector('.container');
    const containerChildren = container ? Array.from(container.children).map(el => ({ tag: el.tagName, class: el.className, h: el.getBoundingClientRect().height, top: el.getBoundingClientRect().top })) : [];
    return { containerTop: container ? container.getBoundingClientRect().top : null, containerChildren };
  });
  console.log('DOMContentLoaded main.container snapshot:', mainNow);

  await page.waitForTimeout(2000);
  const later = await page.evaluate(snapshot);
  console.log('2s snapshot:', later);

  const mainLater = await page.evaluate(() => {
    const main = document.querySelector('main');
    if (!main) return [];
    const container = main.querySelector('.container');
    const containerChildren = container ? Array.from(container.children).map(el => ({ tag: el.tagName, class: el.className, h: el.getBoundingClientRect().height, top: el.getBoundingClientRect().top })) : [];
    return { containerTop: container ? container.getBoundingClientRect().top : null, containerChildren };
  });
  console.log('2s main.container snapshot:', mainLater);

  // Compare
  const diffs = [];
  for (let i = 0; i < Math.max(now.length, later.length); i++) {
    const a = now[i] || null;
    const b = later[i] || null;
    if (!a || !b || a.h !== b.h || a.top !== b.top) {
      diffs.push({ index: i, before: a, after: b });
    }
  }

  console.log('Diffs for top-level body children:', diffs);

  // Compare main children diffs
  const mainDiffs = [];
  for (let i = 0; i < Math.max(mainNow.length, mainLater.length); i++) {
    const a = mainNow[i] || null;
    const b = mainLater[i] || null;
    if (!a || !b || a.h !== b.h || a.top !== b.top) {
      mainDiffs.push({ index: i, before: a, after: b });
    }
  }
  console.log('Diffs for main children:', mainDiffs);
  await browser.close();
})();