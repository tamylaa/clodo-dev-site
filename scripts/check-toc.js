(async ()=>{
  const pw = await import('playwright');
  const {chromium} = pw;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:8000/cloudflare-workers-development-guide', { waitUntil: 'networkidle' });
  
  // Find TOC elements
  const tocs = await page.$$eval('[class*="toc"], [id*="toc"], [class*="sidebar"], [class*="sticky"]', els => 
    els.map(el => ({
      tagName: el.tagName,
      id: el.id,
      class: el.className,
      text: el.textContent?.slice(0, 100)
    }))
  );
  
  console.log('Found TOC-like elements:');
  tocs.forEach((t, i) => console.log(`${i}:`, t));
  
  await browser.close();
})();
