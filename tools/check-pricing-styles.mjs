import playwright from 'playwright';

(async () => {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => logs.push({type: msg.type(), text: msg.text()}));

  const requests = [];
  page.on('request', r => requests.push({url: r.url(), method: r.method(), resourceType: r.resourceType()}));
  const responses = [];
  page.on('response', r => responses.push({url: r.url(), status: r.status(), ok: r.ok(), resourceType: r.request().resourceType()}));

  try {
    const res = await page.goto('http://localhost:8000/pricing', { waitUntil: 'networkidle' });
    console.log('Status:', res.status());

    await page.waitForTimeout(500); // allow init scripts to run

    // CSS requests
    const cssRequests = requests.filter(r => r.resourceType === 'stylesheet' || r.url.match(/\.css$/));
    console.log('CSS requests:', cssRequests.length);
    cssRequests.forEach(r => console.log('  -', r.url));

    const cssResponses = responses.filter(r => r.url.match(/\.css$/));
    console.log('CSS responses:');
    cssResponses.forEach(r => console.log(`  - ${r.status} ${r.url}`));

    // Check for 404s on CSS
    const notFoundCss = cssResponses.filter(r => r.status === 404);

    // Snapshot document.styleSheets count and titles
    const styleInfo = await page.evaluate(() => {
      const sheets = Array.from(document.styleSheets).map(s => ({href: s.href || 'inline', disabled: s.disabled}));
      return {count: document.styleSheets.length, sheets};
    });

    console.log('Document.styleSheets count:', styleInfo.count);
    console.log('styleSheets:', styleInfo.sheets);

    // Check for body computed style to see if CSS applied (e.g., background-color expected)
    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    console.log('Computed body background-color:', bodyBg);

    // Print recent console logs
    console.log('\nConsole messages (recent 20):');
    logs.slice(-20).forEach(l => console.log(l.type + ':', l.text));

    if (notFoundCss.length > 0) {
      console.error('❌ CSS 404s detected');
      notFoundCss.forEach(r => console.error('  -', r.url));
      process.exit(2);
    }

    if (styleInfo.count === 0) {
      console.error('❌ No stylesheets applied (document.styleSheets === 0)');
      process.exit(3);
    }

    console.log('✅ Pricing page styles appear loaded (no CSS 404s and styles applied)');
    process.exit(0);
  } catch (e) {
    console.error('Error running pricing styles check:', e);
    process.exit(4);
  } finally {
    await browser.close();
  }
})();