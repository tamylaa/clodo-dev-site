#!/usr/bin/env node
/**
 * SEO URL checker (ESM)
 * Usage: node scripts/seo-checker.mjs --input data/seo-urls.txt --config config/seo-checker.json --output reports/seo-report.csv
 * Requires Node.js 18+ (for global fetch)
 */

import fs from 'fs';
import { readFile as _readFile, writeFile as _writeFile, mkdir as _mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_CONFIG_PATH = path.resolve(__dirname, '..', 'config', 'seo-checker.json');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { flags: {} };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.replace(/^--/, '');
      const val = args[i+1] && !args[i+1].startsWith('--') ? args[++i] : true;
      out.flags[key] = val;
    }
  }
  return out.flags;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function loadConfig(file) {
  const p = file ? path.resolve(process.cwd(), file) : DEFAULT_CONFIG_PATH;
  try {
    const raw = await _readFile(p, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.warn('No config found at', p, '- using defaults');
    return {
      maxRedirects: 10,
      concurrency: 6,
      rewriteRules: [],
      userAgent: 'Clodo-SEO-Checker/1.0 (+https://clodo.dev)'
    };
  }
}

function readUrls(file) {
  const raw = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
  return raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean).filter(s => !s.startsWith('#'));
}

function normalizeForCompare(url) {
  try {
    const u = new URL(url);
    u.hash = '';
    if (u.pathname !== '/') u.pathname = u.pathname.replace(/\/$/, '');
    return u.toString().replace(/:\d+\//, '/');
  } catch (e) {
    return url;
  }
}

async function fetchHead(url, userAgent) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'manual', headers: { 'user-agent': userAgent } });
    return res;
  } catch (e) {
    try {
      return await fetch(url, { method: 'GET', redirect: 'manual', headers: { 'user-agent': userAgent } });
    } catch (err) {
      throw err;
    }
  }
}

async function getRedirectChain(startUrl, config) {
  const chain = [];
  let url = startUrl;
  let redirects = 0;
  const ua = config.userAgent || 'Clodo-SEO-Checker/1.0';
  while (redirects <= (config.maxRedirects || 10)) {
    let res;
    try {
      res = await fetchHead(url, ua);
    } catch (e) {
      chain.push({ url, status: 'ERR', message: e.message });
      return { chain, final: url, finalRes: null };
    }
    const status = res.status;
    const location = res.headers.get('location');
    chain.push({ url, status, location });
    if (location && (status >= 300 && status < 400)) {
      try { url = new URL(location, url).toString(); } catch (e) { url = location; }
      redirects++;
      continue;
    }
    return { chain, final: url, finalRes: res };
  }
  chain.push({ url, status: 'ERR', message: 'Too many redirects' });
  return { chain, final: url, finalRes: null };
}

function extractCanonicalAndMeta(html) {
  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i);
  let canonical = null;
  if (canonicalMatch) {
    const hrefMatch = canonicalMatch[0].match(/href=["']([^"']+)["']/i);
    if (hrefMatch) canonical = hrefMatch[1];
  }
  const metaRobotsMatch = html.match(/<meta[^>]+name=["']robots["'][^>]*>/i);
  let metaRobots = null;
  if (metaRobotsMatch) {
    const contentMatch = metaRobotsMatch[0].match(/content=["']([^"']+)["']/i);
    if (contentMatch) metaRobots = contentMatch[1];
  }
  return { canonical, metaRobots };
}

function applyRewriteRules(url, rules) {
  if (!url || !rules || !rules.length) return url;
  let out = url;
  for (const r of rules) {
    try {
      const re = new RegExp(r.pattern);
      out = out.replace(re, r.replacement);
    } catch (e) {
      // ignore bad rule
    }
  }
  return out;
}

async function fetchFinalHtmlIfNeeded(finalUrl, res, config) {
  try {
    if (res) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('text/html')) {
        const r = await fetch(finalUrl, { headers: { 'user-agent': config.userAgent } });
        const text = await r.text();
        return { html: text, headers: r.headers };
      }
    }
    const r = await fetch(finalUrl, { headers: { 'user-agent': config.userAgent } });
    const ct = r.headers.get('content-type') || '';
    const text = ct.includes('text/html') ? await r.text() : '';
    return { html: text, headers: r.headers };
  } catch (e) {
    return { html: '', headers: new Map() };
  }
}

async function processUrl(url, config) {
  const result = {
    inputUrl: url,
    timestamp: new Date().toISOString(),
    redirectChain: [],
    finalUrl: null,
    finalStatus: null,
    canonical: null,
    canonicalAfterRules: null,
    canonicalMatchesFinal: false,
    metaRobots: null,
    xRobotsTag: null,
    contentType: null,
    notes: null
  };
  try {
    const { chain, final, finalRes } = await getRedirectChain(url, config);
    result.redirectChain = chain;
    result.finalUrl = final;
    if (finalRes) result.finalStatus = finalRes.status;
    const finalFetch = await fetchFinalHtmlIfNeeded(final, finalRes, config);
    const ct = finalFetch.headers && (finalFetch.headers.get ? finalFetch.headers.get('content-type') : finalFetch.headers['content-type']) || '';
    result.contentType = ct;
    const xRobotsTag = finalFetch.headers && finalFetch.headers.get ? finalFetch.headers.get('x-robots-tag') : null;
    result.xRobotsTag = xRobotsTag;
    if (finalFetch.html) {
      const { canonical, metaRobots } = extractCanonicalAndMeta(finalFetch.html);
      result.canonical = canonical;
      result.metaRobots = metaRobots;
      result.canonicalAfterRules = applyRewriteRules(canonical, config.rewriteRules || []);
      const normFinal = normalizeForCompare(final);
      const normCanon = result.canonicalAfterRules ? normalizeForCompare(result.canonicalAfterRules) : (result.canonical ? normalizeForCompare(result.canonical) : null);
      result.canonicalMatchesFinal = normCanon ? (normCanon === normFinal) : false;
    }
  } catch (e) {
    result.notes = e.message;
  }
  return result;
}

async function runBatch(urls, config, outPath) {
  const concurrency = Number(config.concurrency || 6);
  const results = [];
  let index = 0;
  const ensureDir = path.dirname(outPath);
  try { await _mkdir(ensureDir, { recursive: true }); } catch (e) {}

  const runner = async () => {
    while (index < urls.length) {
      const i = index++;
      const u = urls[i];
      process.stdout.write(`Checking ${i+1}/${urls.length}: ${u}\r`);
      const r = await processUrl(u, config);
      results.push(r);
    }
  };

  const workers = new Array(concurrency).fill(0).map(runner);
  await Promise.all(workers);
  const csvRows = [];
  const headers = [
    'inputUrl','timestamp','finalUrl','finalStatus','redirectChain','canonical','canonicalAfterRules','canonicalMatchesFinal','metaRobots','xRobotsTag','contentType','notes'
  ];
  csvRows.push(headers.join(','));
  for (const r of results) {
    const row = headers.map(h => {
      const val = r[h] === undefined || r[h] === null ? '' : (typeof r[h] === 'object' ? JSON.stringify(r[h]).replace(/"/g,'""') : String(r[h]));
      if (val.includes(',') || val.includes('\n') || val.includes('\r') || val.includes('"')) return `"${val.replace(/"/g,'""')}"`;
      return val;
    }).join(',');
    csvRows.push(row);
  }
  await _writeFile(outPath, csvRows.join('\n'), 'utf8');
  const jsonPath = outPath.replace(/\.csv$/i, '.json');
  await _writeFile(jsonPath, JSON.stringify(results, null, 2), 'utf8');
  console.log('\nReport written to', outPath, 'and', jsonPath);
  return { results, csv: outPath, json: jsonPath };
}

async function main() {
  const flags = parseArgs();
  const input = flags.input || 'data/seo-urls-sample.txt';
  const out = flags.output || `reports/seo-report-${Date.now()}.csv`;
  const configFile = flags.config || undefined;
  const loopSeconds = Number(flags['loop-seconds'] || 0);
  const runOnce = flags['run-once'] !== undefined ? true : false;

  const config = await loadConfig(configFile);
  const urls = readUrls(input);
  if (!urls.length) {
    console.error('No URLs found in', input);
    process.exit(1);
  }

  if (loopSeconds > 0) {
    while (true) {
      await runBatch(urls, config, out);
      console.log(`Sleeping ${loopSeconds} seconds before next run...`);
      await sleep(loopSeconds * 1000);
    }
  } else {
    await runBatch(urls, config, out);
    if (!runOnce) console.log('Done (run-once). Use --loop-seconds N for periodic checks.');
  }
}

if (process.argv[1] && process.argv[1].endsWith('seo-checker.mjs')) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
