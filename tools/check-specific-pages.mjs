#!/usr/bin/env node
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = process.argv[2] || 'https://www.clodo.dev';
const OUT = process.argv[3] || 'build/page-check-diagnostics';
const TIMEOUT = parseInt(process.env.PAGE_CHECK_TIMEOUT || '60000', 10);

const pages = [
  '/clodo-framework-guide.html',
  '/clodo-framework-promise-to-reality.html',
  '/clodo-vs-lambda.html',
  '/cloudflare-framework.html',
  '/cloudflare-workers-guide.html',
  '/cloudflare-workers-development-guide.html',
  '/cloudflare-workers-cold-start-optimization.html',
  '/workers-boilerplate.html',
  '/workers-vs-lambda.html',
  '/wrangler-to-clodo-migration.html',
  '/worker-scaffolding-tools.html',
  '/what-is-cloudflare-workers.html',
  '/how-to-migrate-from-wrangler.html'
];

async function run() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const results = [];
  for (const p of pages) {
    const url = BASE.replace(/\/$/, '') + p;
    const pageOut = path.join(OUT, p.replace(/\//g, '_') + '.json');
    const screenshotOut = path.join(OUT, p.replace(/\//g, '_') + '.png');
    console.log('Checking', url);
    const context = await browser.newContext();
    const page = await context.newPage();
    const consoleMsgs = [];
    page.on('console', m => consoleMsgs.push({ type: m.type(), text: m.text() }));
    let resp = null;
    try {
      resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
      const status = resp.status();
      const finalUrl = page.url();
      const body = await page.content();
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href').catch(() => null);
      await page.screenshot({ path: screenshotOut, fullPage: false });
      results.push({ url, ok: true, status, finalUrl, canonical, console: consoleMsgs.slice(), screenshot: screenshotOut });
      fs.writeFileSync(pageOut, JSON.stringify(results[results.length-1], null, 2));
    } catch (e) {
      const err = String(e.message || e);
      console.warn('Error loading', url, err);
      results.push({ url, ok: false, error: err, console: consoleMsgs.slice() });
      fs.writeFileSync(pageOut, JSON.stringify(results[results.length-1], null, 2));
    }
    await context.close();
  }
  await browser.close();
  const summary = { checked: pages.length, timestamp: new Date().toISOString(), results };
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log('Done. Outputs in', OUT);
}

run().catch(e => { console.error(e); process.exit(1); });