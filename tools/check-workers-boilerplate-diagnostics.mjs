import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

(async function main(){
  const outDir = path.resolve(process.cwd(), 'build', 'page-check-diagnostics');
  if(!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const results = {
    url: 'https://www.clodo.dev/workers-boilerplate',
    cssRequests: [],
    styleSheets: [],
    computedStyles: {},
    console: []
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => results.console.push({type: msg.type(), text: msg.text()}));

  page.on('response', async response => {
    try {
      const req = response.request();
      if(req.resourceType() === 'stylesheet' || response.headers()['content-type']?.includes('text/css')){
        const url = response.url();
        const status = response.status();
        const length = Number(response.headers()['content-length'] || 0);
        let bodySnippet = '';
        try{
          const body = await response.text();
          bodySnippet = body.slice(0, 1000);
        }catch(e){ bodySnippet = `unable to read body: ${String(e)}` }
        results.cssRequests.push({ url, status, length, snippet: bodySnippet.slice(0,500) });
      }
    }catch(e){ /* ignore */ }
  });

  await page.goto(results.url, { waitUntil: 'load', timeout: 60000 });

  // capture document.styleSheets
  results.styleSheets = await page.evaluate(() => {
    return Array.from(document.styleSheets || []).map(s => ({ href: s.href || null, ownerNode: s.ownerNode?.nodeName || null }));
  });

  // compute styles for key elements
  results.computedStyles = await page.evaluate(() => {
    const getStyles = sel => {
      const el = document.querySelector(sel);
      if(!el) return null;
      const cs = getComputedStyle(el);
      return {
        display: cs.display,
        backgroundColor: cs.backgroundColor,
        color: cs.color,
        borderTopColor: cs.borderTopColor,
        position: cs.position
      };
    };
    return {
      toc: getStyles('.table-of-contents'),
      comparison: getStyles('.comparison-table'),
      hero: getStyles('.hero'),
      card: getStyles('.boilerplate-card')
    };
  });

  const screenshotPath = path.join(outDir, '_workers-boilerplate-network.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });

  results.screenshot = screenshotPath;

  const outFile = path.join(outDir, '_workers-boilerplate-network.json');
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2));

  await browser.close();
  console.log('Wrote diagnostics:', outFile);
})();