#!/usr/bin/env node
/**
 * run_webpagetest.cjs
 * - Requires WEBPAGETEST_API_KEY env var. Uses webpagetest locations to run tests from multiple regions.
 * - Usage: node scripts/perf/run_webpagetest.cjs --url=https://www.clodo.dev/how-to-migrate-from-wrangler
 * - Example locations: Dulles: "Dulles:Chrome"; Frankfurt: "Frankfurt:Chrome"; Mumbai: "Mumbai:Chrome"; SaoPaulo: "SAO:Chrome"
 */
const WebPageTest = require('webpagetest');
const args = require('minimist')(process.argv.slice(2));
const url = args.url;
if (!url) { console.error('Usage: --url=https://...'); process.exit(1); }
const wptKey = process.env.WEBPAGETEST_API_KEY;
if (!wptKey) { console.error('Set WEBPAGETEST_API_KEY in env'); process.exit(1); }
const wpt = new WebPageTest('https://www.webpagetest.org', wptKey);
const locations = ['Dulles:Chrome', 'Frankfurt:Chrome', 'Mumbai:Chrome', 'SAO:Chrome'];
for (const location of locations) {
  console.log('Starting WPT run for', url, 'from', location);
  wpt.runTest(url, { location }, function(err, result) {
    if (err) { console.error('WPT error', err); return; }
    console.log('WPT started:', result.data.id, 'for location', location);
  });
}
console.log('Requested WPT runs.');
