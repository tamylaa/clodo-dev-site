#!/usr/bin/env node
/**
 * run_webpagetest.js (ESM)
 * - Requires WEBPAGETEST_API_KEY env var. Uses webpagetest locations to run tests from multiple regions.
 * - Usage: node scripts/perf/run_webpagetest.js --url=https://www.example.com/page
 * - Example locations: Dulles: "Dulles:Chrome"; Frankfurt: "Frankfurt:Chrome"; Mumbai: "Mumbai:Chrome"; SaoPaulo: "SAO:Chrome"
 */
import minimist from 'minimist';
import { ANALYZER_CONFIG } from '../config.js';

const args = minimist(process.argv.slice(2));
const url = args.url;
if (!url) { console.error('Usage: --url=https://...'); process.exit(1); }
const wptKey = ANALYZER_CONFIG.webpagetest.apiKey;
if (!wptKey) { console.error('Set WEBPAGETEST_API_KEY in env'); process.exit(1); }

const mod = await import('webpagetest').catch(err => { console.error('Failed to import webpagetest:', err); process.exit(1); });
const WebPageTest = mod.default || mod;
const wpt = new WebPageTest(ANALYZER_CONFIG.urls.webpagetest, wptKey);
const locations = ANALYZER_CONFIG.webpagetest.locations;
for (const location of locations) {
  console.log('Starting WPT run for', url, 'from', location);
  wpt.runTest(url, { location }, function(err, result) {
    if (err) { console.error('WPT error', err); return; }
    console.log('WPT started:', result.data.id, 'for location', location);
  });
}
console.log('Requested WPT runs.');
