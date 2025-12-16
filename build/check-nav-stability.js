import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Allow overriding base URL via CLI arg: `node build/check-nav-stability.js http://localhost:8000`
  const base = process.argv[2] || process.env.BASE_URL || 'https://www.clodo.dev';
  const urls = [
    `${base}/`,
    `${base}/community/welcome`,
    `${base}/blog/`,
    `${base}/blog/stackblitz-integration-journey`
  ];

  // Helper to sample breadcrumb style (if present)
  async function sampleBreadcrumbStyle(page) {
    const exists = await page.$('.breadcrumbs') !== null;
    if (!exists) return { exists: false };
    const color = await page.$eval('.breadcrumbs', el => getComputedStyle(el).getPropertyValue('color'));
    const fontSize = await page.$eval('.breadcrumbs', el => getComputedStyle(el).getPropertyValue('font-size'));
    return { exists: true, color, fontSize };
  }

  const failures = [];

  for (const url of urls) {
    try {
      // Navigate and wait only for DOMContentLoaded to capture early paint state
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      const status = resp ? resp.status() : 'no-response';

      // Sample nav style immediately after DOMContentLoaded
      const navExists = await page.$('nav.navbar') !== null;
      const navStyleNow = navExists ? await page.$eval('nav.navbar', (el) => getComputedStyle(el).getPropertyValue('background-color')) : 'missing';

      // Sample breadcrumbs at same cadences
      const breadcrumbNow = await sampleBreadcrumbStyle(page);

      // Check font loading state (may cause layout shifts when fonts swap)
      const fontsNow = await page.evaluate(() => ({ status: document.fonts && document.fonts.status ? document.fonts.status : 'unsupported', interLoaded: document.fonts ? document.fonts.check('1rem Inter') : false }));

      // Sample header/main positions for layout stability (guard against missing elements)
      const headerExists = await page.$('header') !== null;
      const headerRectNow = headerExists ? await page.$eval('header', el => { const r = el.getBoundingClientRect(); return { height: r.height, top: r.top }; }) : null;
      const mainExists = await page.$('#main-content') !== null;
      const mainNow = mainExists ? await page.$eval('#main-content', el => { const r = el.getBoundingClientRect(); return { top: r.top }; }) : null;

      await page.waitForTimeout(500);
      const navStyle500 = navExists ? await page.$eval('nav.navbar', (el) => getComputedStyle(el).getPropertyValue('background-color')) : 'missing';
      const breadcrumb500 = await sampleBreadcrumbStyle(page);
      const headerRect500 = headerExists ? await page.$eval('header', el => { const r = el.getBoundingClientRect(); return { height: r.height, top: r.top }; }) : null;
      const main500 = mainExists ? await page.$eval('#main-content', el => { const r = el.getBoundingClientRect(); return { top: r.top }; }) : null;

      await page.waitForTimeout(1500);
      const navStyle2000 = navExists ? await page.$eval('nav.navbar', (el) => getComputedStyle(el).getPropertyValue('background-color')) : 'missing';
      const breadcrumb2000 = await sampleBreadcrumbStyle(page);
      const headerRect2000 = headerExists ? await page.$eval('header', el => { const r = el.getBoundingClientRect(); return { height: r.height, top: r.top }; }) : null;
      const main2000 = mainExists ? await page.$eval('#main-content', el => { const r = el.getBoundingClientRect(); return { top: r.top }; }) : null;
      const fonts2000 = await page.evaluate(() => ({ status: document.fonts && document.fonts.status ? document.fonts.status : 'unsupported', interLoaded: document.fonts ? document.fonts.check('1rem Inter') : false }));

      const result = { url, status, navExists, navStyleNow, navStyle500, navStyle2000, headerRectNow, headerRect500, headerRect2000, mainNow, main500, main2000, breadcrumbNow, breadcrumb500, breadcrumb2000, fontsNow, fonts2000 };
      console.log(result);

      // Run assertions - record any failures
      const pageFailures = [];

      // 1) nav should stabilize within 500ms
      if (navStyleNow !== navStyle500 || navStyle500 !== navStyle2000) {
        pageFailures.push('Nav style unstable across time samples');
      }

      // 2) Fonts should be loaded by 2s (to avoid FOUT/CLS)
      if (fontsNow.status !== 'loaded' || fonts2000.status !== 'loaded') {
        pageFailures.push(`Font loading not completed (now=${fontsNow.status}, 2s=${fonts2000.status})`);
      }

      // 3) Breadcrumbs expected for blog and community pages
      if ((url.includes('/blog') || url.includes('/community')) && !breadcrumb2000.exists) {
        pageFailures.push('Expected breadcrumb not present after 2s');
      }

      // 4) Header layout should not change (height/top) by more than 12px (tolerate small layout differences)
      if (headerRectNow && headerRect2000) {
        const dh = Math.abs(headerRectNow.height - headerRect2000.height);
        const dtop = Math.abs((headerRectNow.top || 0) - (headerRect2000.top || 0));
        if (dh > 12 || dtop > 12) pageFailures.push(`Header layout shifted (dh=${dh}, dtop=${dtop})`);
      }

      if (pageFailures.length) {
        console.error('❌ Page failed stability checks:', url, pageFailures);
        failures.push({ url, failures: pageFailures, details: result });
      } else {
        console.log('✅ Page passed stability checks:', url);
      }
    } catch (e) {
      console.error('Error checking', url, e && e.message);
    }
  }

  await browser.close();

  if (failures.length > 0) {
    console.error('\nSummary: stability failures detected on the following pages:');
    failures.forEach(f => console.error(f.url, f.failures));
    process.exit(1);
  }

  process.exit(0);
})();