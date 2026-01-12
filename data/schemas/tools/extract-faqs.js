#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const publicDir = 'public';
const schemasDir = path.join('data','schemas');
const pageConfigPath = path.join(schemasDir, 'page-config.json');

function findHtmlFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...findHtmlFiles(p));
    else if (e.isFile() && p.endsWith('.html')) files.push(p);
  }
  return files;
}

function loadPageConfig() {
  try { return JSON.parse(fs.readFileSync(pageConfigPath, 'utf8')); }
  catch (e) { return { pages: {} }; }
}

function savePageConfig(cfg) {
  fs.writeFileSync(pageConfigPath, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
}

function extractFaqsFromHtml(html) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // Find sections with headings that contain FAQ
  const headings = Array.from(doc.querySelectorAll('h1,h2,h3'));
  const faqHead = headings.find(h => /faq/i.test(h.textContent));
  if (!faqHead) return [];

  // Collect nodes until next top-level heading
  const nodes = [];
  for (let n = faqHead.nextElementSibling; n; n = n.nextElementSibling) {
    if (n.tagName && /H1|H2/.test(n.tagName)) break;
    nodes.push(n);
  }

  const faqs = [];

  // Strategy: look for dl dt/dd pairs
  const dls = nodes.flatMap(n => Array.from(n.querySelectorAll ? n.querySelectorAll('dl') : []));
  for (const dl of dls) {
    const dts = dl.querySelectorAll('dt');
    for (const dt of dts) {
      const dd = dt.nextElementSibling && dt.nextElementSibling.tagName === 'DD' ? dt.nextElementSibling : null;
      faqs.push({ name: dt.textContent.trim(), acceptedAnswer: (dd ? dd.textContent.trim() : '') });
    }
  }

  // Strategy: look for pairs of heading (h3/h4) + p
  for (const n of nodes) {
    const qElems = Array.from(n.querySelectorAll ? n.querySelectorAll('h3,h4') : []);
    for (const q of qElems) {
      let a = q.nextElementSibling;
      while (a && a.tagName && /H3|H4/.test(a.tagName)) a = a.nextElementSibling;
      const answer = a ? a.textContent.trim() : '';
      faqs.push({ name: q.textContent.trim(), acceptedAnswer: answer });
    }
  }

  // Strategy: list items with bold/question prefix inside ul/li
  for (const n of nodes) {
    const lis = Array.from(n.querySelectorAll ? n.querySelectorAll('li') : []);
    for (const li of lis) {
      const strong = li.querySelector('strong') || li.querySelector('b');
      if (strong) {
        const q = strong.textContent.trim();
        const a = li.textContent.replace(strong.textContent, '').trim();
        if (q && a) faqs.push({ name: q, acceptedAnswer: a });
      }
    }
  }

  // De-duplicate
  const seen = new Set();
  const unique = [];
  for (const f of faqs) {
    const key = (f.name + '|' + (f.acceptedAnswer || '')).slice(0,200);
    if (!seen.has(key) && f.name) {
      seen.add(key);
      unique.push(f);
    }
  }

  return unique;
}

function writeFaqSchema(pageName, faqs) {
  if (!faqs || faqs.length === 0) return false;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(f => ({ '@type': 'Question', 'name': f.name, 'acceptedAnswer': { '@type': 'Answer', 'text': f.acceptedAnswer } }))
  };
  const outPath = path.join(schemasDir, `${pageName}-faq.json`);
  fs.writeFileSync(outPath, JSON.stringify(schema, null, 2) + '\n', 'utf8');
  return true;
}

// Run
const htmlFiles = findHtmlFiles(publicDir);
const pageConfig = loadPageConfig();
let created = 0;
let updated = 0;
for (const f of htmlFiles) {
  const name = path.basename(f).replace(/\.html$/, '');
  const html = fs.readFileSync(f, 'utf8');
  const faqs = extractFaqsFromHtml(html);
  if (faqs.length === 0) continue;

  const wrote = writeFaqSchema(name, faqs);
  if (!wrote) continue;

  // add requirement to page-config if present
  if (!pageConfig.pages) pageConfig.pages = {};
  if (!pageConfig.pages[name]) pageConfig.pages[name] = { type: 'WebPage', requiredSchemas: ['WebSite','BreadcrumbList'] };
  const req = pageConfig.pages[name].requiredSchemas || [];
  if (!req.includes('FAQPage')) req.push('FAQPage');
  pageConfig.pages[name].requiredSchemas = req;

  console.log(`Created FAQ schema for ${name} (${faqs.length} entries)`);
  created++;
}

if (created > 0) {
  savePageConfig(pageConfig);
  console.log(`Saved page-config changes.`);
}

console.log(`\nDone. FAQ schemas created: ${created}`);
process.exit(0);
