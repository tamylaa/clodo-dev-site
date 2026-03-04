import { chromium } from 'playwright';

(async ()=>{
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8001/cloudflare-stream-complete-guide', { waitUntil: 'load' });
  await page.waitForTimeout(250);

  const report = await page.evaluate(()=>{
    const cg = document.querySelector('.content-grid');
    const cgRect = cg ? cg.getBoundingClientRect() : {right: innerWidth};
    const els = Array.from(document.querySelectorAll('.main-content *'));
    const offenders = [];
    for(const el of els){
      const r = el.getBoundingClientRect();
      if(r.right > cgRect.right + 1){
        offenders.push({tag: el.tagName.toLowerCase(), class: el.className, id: el.id || null, right: r.right, left: r.left, width: r.width, html: el.outerHTML.slice(0,200)});
      }
    }
    return { cgRect, offenders: offenders.slice(0,30) };
  });

  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})();