#!/usr/bin/env node
import fs from 'fs';
const [,, jsonPath] = process.argv;
if (!jsonPath) { console.error('Usage: node check-lighthouse-ci.mjs <path-to-lighthouse-json>'); process.exit(2); }
const raw = fs.readFileSync(jsonPath, 'utf8');
const r = JSON.parse(raw);
// Detect Chrome interstitial redirect (chrome-error://chromewebdata) which indicates network/edge blocking
if (r && r.finalUrl && typeof r.finalUrl === 'string' && r.finalUrl.indexOf('chrome-error://') === 0) {
  console.error('Lighthouse run redirected to chrome-error://chromewebdata; this usually means a network interstitial (Cloudflare/WAF) blocked the navigation.');
  console.error('Suggested actions: 1) Run Lighthouse with host-resolver-rules mapping the production host to localhost, or 2) investigate Cloudflare/WAF logs for challenged requests (UA: HeadlessChrome/Lighthouse).');
  process.exit(4);
}

const bp = r.categories && r.categories['best-practices'];
if (!bp) { console.error('No Best Practices category found'); process.exit(1); }
const audits = r.audits;
const failing = [];
for (const ref of bp.auditRefs) {
  const a = audits[ref.id];
  if (!a) continue;
  if (a.score === 0 || (typeof a.score === 'number' && a.score < 1)) {
    failing.push({ id: ref.id, title: a.title, score: a.score, display: a.scoreDisplayMode });
  }
}
// Additionally fail if there are any console errors
const consoleAudit = audits['errors-in-console'];
if (consoleAudit && consoleAudit.score === 0) failing.push({ id: 'errors-in-console', title: consoleAudit.title });

if (failing.length > 0) {
  console.error('Lighthouse Best Practices checks failed:');
  failing.forEach(f=>console.error(` - ${f.id}: ${f.title} (score: ${f.score})`));
  process.exit(3);
}
console.log('Lighthouse Best Practices checks passed');
