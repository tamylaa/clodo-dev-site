(async ()=>{
  const pw = await import('playwright');
  const { chromium } = pw;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:8000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  
  const menus = await page.$$eval('.nav-dropdown-menu', m => m.map(x => ({
    display: window.getComputedStyle(x).display,
    ariaExpanded: x.closest('.nav-dropdown')?.querySelector('[aria-expanded]')?.getAttribute('aria-expanded')
  })));
  
  console.log('Initial page load - Dropdown states:');
  menus.forEach((m, i) => console.log(`  ${i}:`, m));
  
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  
  const menus2 = await page.$$eval('.nav-dropdown-menu', m => m.map(x => ({
    display: window.getComputedStyle(x).display,
    ariaExpanded: x.closest('.nav-dropdown')?.querySelector('[aria-expanded]')?.getAttribute('aria-expanded')
  })));
  
  console.log('\nAfter page reload - Dropdown states:');
  menus2.forEach((m, i) => console.log(`  ${i}:`, m));
  
  await browser.close();
})();
