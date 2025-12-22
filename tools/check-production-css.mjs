#!/usr/bin/env node
import fetch from 'node-fetch';
import { argv } from 'process';

async function main() {
  const url = argv[2] || 'https://www.clodo.dev/pricing';
  console.log(`Checking production URL: ${url}`);

  const pageRes = await fetch(url, { timeout: 15000 });
  if (!pageRes.ok) throw new Error(`Failed to fetch page: ${pageRes.status}`);
  const html = await pageRes.text();

  // Find the first styles-pricing.css link
  const match = html.match(/href=["']([^"']*styles-pricing\.css[^"']*)["']/i);
  if (!match) throw new Error('No styles-pricing.css link found in page HTML');
  const cssUrl = match[1].startsWith('http') ? match[1] : new URL(match[1], url).toString();
  console.log(`Found CSS link: ${cssUrl}`);

  if (!/styles-pricing\.css\?v=/i.test(cssUrl)) {
    throw new Error('CSS link does not include cache-busting query param (?v=), deploy may not have applied cache-busting');
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
