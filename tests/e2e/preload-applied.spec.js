import { test, expect } from '@playwright/test';

test.describe('preload -> stylesheet mapping', () => {
  test('preloaded styles become applied styles and no console syntax errors', async ({ page }) => {
    const url = process.env.TEST_BASE_URL || 'http://localhost:8000/cloudflare-top-10-saas-edge-computing-workers-case-study-docs';

    const consoleMessages = [];
    const networkErrors = [];
    page.on('console', msg => consoleMessages.push({ type: msg.type(), text: msg.text() }));
    page.on('response', response => {
      try {
        const status = response.status();
        const url = response.url();
        const type = response.request().resourceType();
        if (status >= 400 && type === 'stylesheet') {
          networkErrors.push({ url, status });
        }
      } catch (e) { /* ignore */ }
    });

    await page.goto(url, { waitUntil: 'load' });

    // Gather preloaded style hrefs
    const preloadHrefs = await page.$$eval('link[rel="preload"][as="style"]', els => els.map(e => e.href));

    // Allow small time for init-preload/defer-css to convert/apply styles
    await page.waitForTimeout(600);

    const styleSheetHrefs = await page.evaluate(() => Array.from(document.styleSheets || []).map(s => s.href).filter(Boolean));

    // Ensure no critical console errors (syntax/runtime) were emitted
    const errors = consoleMessages.filter(m => m.type === 'error');
    const critical = errors.filter(e => /SyntaxError|Uncaught|Invalid regular expression|ReferenceError/i.test(e.text));
    expect(critical.length, `critical console errors: ${JSON.stringify(critical)}`).toBe(0);

    // Ensure no stylesheet network 4xx/5xx responses
    expect(networkErrors.length, `network stylesheet errors: ${JSON.stringify(networkErrors)}`).toBe(0);

    // For each preload href, ensure there's a matching applied stylesheet (either same href or same filename/hash suffix)
    for (const href of preloadHrefs) {
      const urlName = (new URL(href)).pathname.split('/').pop();
      const match = styleSheetHrefs.find(s => {
        const sName = s ? (new URL(s)).pathname.split('/').pop() : '';
        return s === href || sName === urlName || sName.endsWith(urlName) || urlName.endsWith(sName);
      });
      expect(match, `Preload ${href} did not result in an applied stylesheet (found: ${JSON.stringify(styleSheetHrefs)})`).toBeTruthy();
    }
  });

  test('falls back to fetching external manifest when inline manifest missing', async ({ page }) => {
    // TODO: Fix flakiness caused by CSP/environment differences. Currently skipped until we can reliably simulate
    // inline manifest removal without CSP blocking local asset loads.
    const url = process.env.TEST_BASE_URL || 'http://localhost:8000/cloudflare-top-10-saas-edge-computing-workers-case-study-docs';

    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push({ type: msg.type(), text: msg.text() }));

    // Intercept the HTML response and strip the inline manifest script to simulate a deployment transform
    await page.route('**/cloudflare-top-10-saas-edge-computing-workers-case-study-docs', async (route) => {
      const res = await route.fetch();
      let text = await res.text();
      // Remove any inline manifest script tags (match across lines)
      text = text.replace(/<script[^>]*>[\s\S]*?window\.__assetManifest__[\s\S]*?<\/script>/ig, '');
      // Normalize absolute production hosts to the test host so CSP 'self' allows stylesheet fetches
      text = text.replace(/https:\/\/www\.clodo\.dev/g, '');
      text = text.replace(/https:\/\/clodo\.dev/g, '');
      // Also ensure any inlined JSON-LD or other scripts that accidentally set the manifest are removed
      text = text.replace(/window\.__assetManifest__\s*=\s*\{[\s\S]*?\};?/ig, '');
      const headers = Object.assign({}, res.headers());
      // Remove CSP to avoid blocking our test-host asset fetches when normalizing hosts
      delete headers['content-security-policy'];
      delete headers['Content-Security-Policy'];
      await route.fulfill({
        status: res.status(),
        headers,
        body: text
      });
    });

    await page.goto(url, { waitUntil: 'load' });

    // Wait for scripts to run and attempt fallback
    await page.waitForTimeout(1000);

    // Ensure inline manifest was actually removed in our modified response
    const inlineManifest = await page.evaluate(() => window.__assetManifest__ || null);
    expect(inlineManifest === null || (typeof inlineManifest === 'object' && Object.keys(inlineManifest).length === 0), 'Expected inline window.__assetManifest__ to be missing or empty after our interception').toBeTruthy();

    // Check console for manifest fallback logs from either init-preload or defer-css
    const found = consoleMessages.some(m => /Fetched asset manifest fallback|Attempting to fetch \/asset-manifest.json/i.test(m.text));
    expect(found, `Expected manifest fallback logs in console, got: ${JSON.stringify(consoleMessages)}`).toBeTruthy();

    // Ensure the page-specific stylesheet was applied
    const styleSheetHrefs = await page.evaluate(() => Array.from(document.styleSheets || []).map(s => s.href).filter(Boolean));
    const expectedPartial = 'styles-cloudflare-top-10-saas-edge-computing-workers-case-study-docs';
    const hasPageCss = styleSheetHrefs.some(h => h && h.includes(expectedPartial));
    expect(hasPageCss, `Expected page-specific CSS to be present in document.styleSheets: ${JSON.stringify(styleSheetHrefs)}`).toBeTruthy();
  });
});
