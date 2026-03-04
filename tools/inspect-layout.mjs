import { chromium } from 'playwright';

(async ()=>{
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const url = 'http://localhost:8001/cloudflare-stream-complete-guide';
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(500);

  const metrics = await page.evaluate(()=>{
    const getRect = sel => {
      const el = document.querySelector(sel);
      if(!el) return null;
      const r = el.getBoundingClientRect();
      return { sel, width: r.width, height: r.height, left: r.left, right: r.right, top: r.top };
    };
    const body = getRect('body');
    const html = getRect('html');
    const contentGrid = getRect('.content-grid');
    const mainContent = getRect('.main-content');
    const firstImg = (()=>{
      const img = document.querySelector('.main-content img');
      if(!img) return null;
      const r = img.getBoundingClientRect();
      return { src: img.currentSrc || img.src, width: r.width, naturalWidth: img.naturalWidth, left: r.left, right: r.right };
    })();
    return { body, html, contentGrid, mainContent, firstImg, viewport: { w: innerWidth, h: innerHeight } };
  });

  console.log(JSON.stringify(metrics, null, 2));
  await browser.close();
})();