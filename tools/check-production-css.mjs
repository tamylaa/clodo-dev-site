#!/usr/bin/env node
import fetch from 'node-fetch';
import { argv } from 'process';

async function main() {
  const url = argv[2] || 'https://www.clodo.dev/pricing';
  console.log(`Checking production URL: ${url}`);

  // Helper to fetch with retries for transient errors (403/429/5xx or network errors)
  async function fetchWithRetry(target, options = {}, attempts = 5, delayMs = 2000) {
    const ua = { 'User-Agent': 'Clodo-Site-Checks/1.0 (+https://github.com/tamylaa/clodo-dev-site)' };
    const opts = { ...options, headers: { ...(options.headers || {}), ...ua } };
    for (let i = 1; i <= attempts; i++) {
      try {
        const res = await fetch(target, opts);
        if (res.ok) return res;

        // Treat 403/429/5xx as transient and retry
        const status = res.status;
        if ((status === 403 || status === 429 || (status >= 500 && status < 600)) && i < attempts) {
          console.warn(`Fetch returned status ${status}, retrying (${i}/${attempts}) after ${delayMs}ms...`);
          await new Promise(r => setTimeout(r, delayMs));
          delayMs *= 2;
          continue;
        }

        // Non-retriable or final attempt
        return res;
      } catch (err) {
        if (i < attempts) {
          console.warn(`Fetch error (${err.message}), retrying (${i}/${attempts}) after ${delayMs}ms...`);
          await new Promise(r => setTimeout(r, delayMs));
          delayMs *= 2;
          continue;
        }
        throw err;
      }
    }
  }

  const pageRes = await fetchWithRetry(url, { timeout: 15000 });
  if (!pageRes) throw new Error('Failed to fetch page: no response');
  if (!pageRes.ok) {
    const snippet = (await pageRes.text()).slice(0, 200);
    throw new Error(`Failed to fetch page: ${pageRes.status}. Response snippet: ${snippet}`);
  }
  const html = await pageRes.text();

  // Find the first styles-pricing link (supports hashed filename like styles-pricing.<hash>.css)
  const match = html.match(/href=["']([^"']*styles-pricing(?:\.[0-9a-f]{6,})?\.css[^"']*)["']/i);
  if (!match) throw new Error('No styles-pricing CSS link found in page HTML');
  const cssUrl = match[1].startsWith('http') ? match[1] : new URL(match[1], url).toString();
  console.log(`Found CSS link: ${cssUrl}`);

  // Accept either a cache-busting query param or a content-hashed filename
  if (!/styles-pricing\.css\?v=/i.test(cssUrl) && !/styles-pricing\.[0-9a-f]{6,}\.css/i.test(cssUrl)) {
    throw new Error('CSS link does not include cache-busting query param (?v=) or a content-hashed filename, deploy may not have applied cache-busting');
  }

  // Fetch the CSS
  const cssRes = await fetch(cssUrl, { timeout: 15000 });
  if (!cssRes.ok) throw new Error(`Failed to fetch CSS: ${cssRes.status}`);
  const css = await cssRes.text();

  // Check for expected selectors added by the change
  const expected = ['.social-proof-section', '.stat-card', '.testimonial-card'];
  const found = expected.filter(s => css.includes(s));

  if (found.length === 0) {
    throw new Error('Deployed CSS does not contain expected social-proof selectors');
  }

  console.log(`Success: found selectors: ${found.join(', ')}`);
  process.exit(0);
}

main().catch(err => {
  console.error('Smoke check failed:', err.message);
  process.exit(1);
});
