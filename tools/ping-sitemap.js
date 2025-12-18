#!/usr/bin/env node
/*
 * Simple sitemap pinger
 * - Verifies sitemap URL is reachable (200)
 * - Sends GET requests to Google and Bing ping endpoints
 * - Exits non-zero if sitemap is not reachable
 */

const SITEMAP = process.env.SITEMAP_URL || 'https://www.clodo.dev/sitemap.xml';
const TIMEOUT = parseInt(process.env.PING_TIMEOUT || '15000', 10);

async function fetchWithTimeout(url, opts = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const resp = await fetch(url, { signal: controller.signal, ...opts });
    clearTimeout(id);
    return resp;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

async function main() {
  console.log(`📡 Pinging sitemap: ${SITEMAP}`);

  try {
    const sitemapResp = await fetchWithTimeout(SITEMAP);
    if (!sitemapResp.ok) {
      console.error(`❌ Sitemap not reachable: ${sitemapResp.status} ${sitemapResp.statusText}`);
      process.exitCode = 2;
      return;
    }
    console.log(`✅ Sitemap reachable (${sitemapResp.status})`);
  } catch (e) {
    console.error('❌ Error fetching sitemap:', e.message || e);
    process.exitCode = 3;
    return;
  }

  const googlePing = `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP)}`;
  const bingPing = `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP)}`;

  async function ping(name, url) {
    try {
      const r = await fetchWithTimeout(url, { method: 'GET' });
      console.log(`↗️ ${name} ping: ${r.status} ${r.statusText}`);
      return r.ok;
    } catch (e) {
      console.warn(`⚠️ ${name} ping failed: ${e.message || e}`);
      return false;
    }
  }

  const g = await ping('Google', googlePing);
  const b = await ping('Bing', bingPing);

  if (!g && !b) {
    console.warn('⚠️ Both pings failed; check connectivity or if endpoints blocked');
    // Do not fail CI because pings sometimes fail transiently — keep it as a warning
  }

  console.log('✅ Sitemap ping completed');
}

main();
