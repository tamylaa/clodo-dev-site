import { chromium } from 'playwright';
(async ()=>{
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8001/cloudflare-stream-complete-guide', { waitUntil: 'load' });
  await page.waitForTimeout(200);
  const cs = await page.evaluate(()=>{
    const el = document.querySelector('.main-content');
    if(!el) return null;
    const s = getComputedStyle(el);
    return {
      width: s.width,
      minWidth: s.minWidth,
      maxWidth: s.maxWidth,
      display: s.display,
      position: s.position,
      boxSizing: s.boxSizing,
      transform: s.transform,
      whiteSpace: s.whiteSpace,
      overflow: s.overflow,
      marginLeft: s.marginLeft,
      marginRight: s.marginRight,
      paddingLeft: s.paddingLeft,
      paddingRight: s.paddingRight
    };
  });
  console.log(JSON.stringify(cs,null,2));
  await browser.close();
})();