#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const schemasDir = path.join('data','schemas');
const stopwords = new Set([
  'the','and','for','with','that','this','from','into','into','how','learn','guide','best','our','using','use','on','in','to','a','an','of','by','as','is','are','it','site'
]);

function listJsonFiles() {
  return fs.readdirSync(schemasDir).filter(f => f.endsWith('.json'));
}

function tokenizeText(s) {
  if (!s) return [];
  return s
    .toLowerCase()
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/[\W_]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter(w => w.length > 3 && !/^[0-9]+$/.test(w) && !stopwords.has(w));
}

function topNWords(words, n=6) {
  const freq = {};
  for (const w of words) freq[w] = (freq[w]||0)+1;
  return Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,n).map(x=>x[0]);
}

const files = listJsonFiles();
let updated = 0;
for (const f of files) {
  const p = path.join(schemasDir, f);
  let json;
  try { json = JSON.parse(fs.readFileSync(p,'utf8')); }
  catch (e) { continue; }

  const type = json['@type'] || json.type;
  if (!type || !(type === 'Article' || type === 'WebPage')) continue;
  if (json.keywords && Array.isArray(json.keywords) && json.keywords.length > 0) continue; // skip if already has keywords

  // Gather candidate text
  const candidates = [];
  if (json.headline) candidates.push(json.headline);
  if (json.title) candidates.push(json.title);
  if (json.description) candidates.push(json.description);
  if (json.articleBody) candidates.push(json.articleBody.slice(0, 1000));
  if (json.url && /cloudflare/i.test(json.url)) candidates.push('cloudflare workers');

  const tokens = candidates.flatMap(tokenizeText);
  const words = topNWords(tokens, 6);

  // Boost Cloudflare Workers if page mentions cloudflare or workers
  const lowerText = (candidates.join(' ')||'').toLowerCase();
  if (/(cloudflare|workers)/.test(lowerText) && !words.includes('cloudflare')) words.unshift('Cloudflare');
  if (/(cloudflare|workers)/.test(lowerText) && !words.includes('workers')) words.unshift('Workers');

  // Format keywords (Title-case multi-word known phrase insertion)
  const keywords = [];
  if (/(cloudflare|workers)/.test(lowerText) && !keywords.includes('Cloudflare Workers')) keywords.push('Cloudflare Workers');

  for (const w of words) {
    const kw = w.split(/\s+/).map(s=>s.charAt(0).toUpperCase()+s.slice(1)).join(' ');
    if (!keywords.includes(kw) && kw.length>0) keywords.push(kw);
    if (keywords.length >= 8) break;
  }

  // Always include site-level brand as fallback
  if (!keywords.includes('Clodo Framework')) keywords.push('Clodo Framework');

  json.keywords = keywords;
  fs.writeFileSync(p, JSON.stringify(json, null, 2) + '\n', 'utf8');
  console.log(`Added keywords to ${f}: ${keywords.join(', ')}`);
  updated++;
}

console.log(`\nKeyword provisioning complete — ${updated} files updated.`);
process.exit(0);
