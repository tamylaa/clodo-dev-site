Performance testing helpers

- `run_lighthouse.js` - runs Lighthouse for given URLs and saves JSON reports to `reports/lighthouse`.
  - Requires Chrome installed and `npm i -D lighthouse`.
  - Example: `node scripts/perf/run_lighthouse.js --urls=public/how-to-migrate-from-wrangler.html`

- `run_webpagetest.js` - submits tests to WebPageTest for multiple regions.
  - Requires `npm i webpagetest` and `WEBPAGETEST_API_KEY` env var.
  - Example: `WEBPAGETEST_API_KEY=xxx node scripts/perf/run_webpagetest.js --url=https://www.clodo.dev/how-to-migrate-from-wrangler`

Notes
-----
- WPT is the recommended way to get geographically-distributed metrics (FR/DE/IN/SA should approximate Germany, US, India, and Paraguay/LatAm).
- We will use the generated reports to identify region-specific LCP issues and caching tweaks.
