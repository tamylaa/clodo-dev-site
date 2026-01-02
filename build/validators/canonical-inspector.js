#!/usr/bin/env node
const url = process.argv[2];
if (!url) { console.error('Usage: node build/inspect-canonical.js <url>'); process.exit(2); }
(async ()=>{
  try {
    const res = await fetch(url);
    const html = await res.text();
    const m = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i);
    if (!m) { console.log('NO_CANONICAL'); process.exit(0); }
    console.log(m[0]);
  } catch (e) {
    console.error('ERROR', e.message || e);
    process.exit(1);
  }
})();