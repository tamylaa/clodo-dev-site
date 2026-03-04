import { chromium } from 'playwright';
(async ()=>{
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8001/cloudflare-stream-complete-guide', { waitUntil: 'load' });
  await page.waitForTimeout(200);
  const rpt = await page.evaluate(()=>{
    const els = Array.from(document.querySelectorAll('.main-content *'));
    const out = [];
    for(const el of els){
      const cw = el.clientWidth || 0;
      const sw = el.scrollWidth || 0;
      if(sw > cw + 10){
        out.push({tag: el.tagName.toLowerCase(), class: el.className, id: el.id||null, clientWidth: cw, scrollWidth: sw, outerHTML: el.outerHTML.slice(0,200)});
      }
    }
    return out.slice(0,60);
  });
  console.log(JSON.stringify(rpt,null,2));
  await browser.close();
})();