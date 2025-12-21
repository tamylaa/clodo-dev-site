#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import minimist from 'minimist';

const args = minimist(process.argv.slice(2));
const dir = args.reportsDir || path.join(process.cwd(), 'reports', 'lighthouse');
const files = await fs.readdir(dir).catch(() => []);
const threshold = {
  serverResponseTime: args.serverThreshold ? Number(args.serverThreshold) : 1000, // ms
  redirectDuration: args.redirectThreshold ? Number(args.redirectThreshold) : 200, // ms
  lcp: args.lcpThreshold ? Number(args.lcpThreshold) : 3000 // ms
};

let failed = false;
for (const f of files) {
  // Skip legacy reports that include the request URL suffix (.html) to avoid evaluating older runs
  if (!f.endsWith('.report.json') || f.includes('_html.report.json')) continue;
  const full = path.join(dir, f);
  const raw = await fs.readFile(full, 'utf8');
  let json;
  try { json = JSON.parse(raw); } catch(e) { console.error('Invalid JSON', f); failed = true; continue; }
  const url = json.finalUrl || json.requestedUrl || f;
  const doc = json.audits && json.audits['document-latency-insight'];
  const lcp = json.audits && json.audits['largest-contentful-paint'] && json.audits['largest-contentful-paint'].numericValue;
  const serverTime = doc && doc.details && doc.details.debugData && doc.details.debugData.serverResponseTime;
  const redirect = doc && doc.details && doc.details.debugData && doc.details.debugData.redirectDuration;

  if (serverTime && serverTime > threshold.serverResponseTime) {
    console.error(`✖ ${url} serverResponseTime ${serverTime}ms > ${threshold.serverResponseTime}ms`);
    failed = true;
  }
  if (redirect && redirect > threshold.redirectDuration) {
    console.error(`✖ ${url} redirectDuration ${redirect}ms > ${threshold.redirectDuration}ms`);
    failed = true;
  }
  if (lcp && lcp > threshold.lcp) {
    console.error(`✖ ${url} LCP ${lcp}ms > ${threshold.lcp}ms`);
    failed = true;
  }
  if (!serverTime && !lcp) {
    console.warn(`⚠ ${url}: missing metrics in report (skipping)`);
  }
}

if (failed) {
  console.error('Lighthouse smoke checks failed');
  process.exit(2);
}
console.log('Lighthouse smoke checks passed');
