#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const publicDir = 'public';
const schemasDir = path.join('data','schemas');
const candidatesDir = path.join(schemasDir, 'candidates');
const pageConfigPath = path.join(schemasDir, 'page-config.json');

if (!fs.existsSync(candidatesDir)) fs.mkdirSync(candidatesDir, { recursive: true });

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

function safeReadJson(p) {
  try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch (e) { return null; }
}

function loadPageConfig() {
  return safeReadJson(pageConfigPath) || { pages: {} };
}

function extractFaqCandidatesFromHtml(html) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const candidates = [];

  // 1) Look for sections with FAQ-like headings
  const faqHeadings = Array.from(doc.querySelectorAll('h1,h2,h3,h4')).filter(h => /faq|frequently asked|q&a|questions?/i.test(h.textContent));
  for (const head of faqHeadings) {
    const nodes = [];
    for (let n = head.nextElementSibling; n; n = n.nextElementSibling) {
      if (n.tagName && /H1|H2/i.test(n.tagName)) break;
      nodes.push(n);
    }
    candidates.push(...collectQAPairs(nodes));
  }

  // 2) Global heading Q/A pairs (h3/h4 that look like questions across document)
  const qHeadings = Array.from(doc.querySelectorAll('h3,h4')).filter(h => /\?$/.test(h.textContent.trim()));
  for (const q of qHeadings) {
    const a = collectAnswerForQuestion(q);
    candidates.push({ name: q.textContent.trim(), acceptedAnswer: a });
  }

  // 3) Bolded question patterns inside lists
  const bolded = Array.from(doc.querySelectorAll('li strong, li b'));
  for (const b of bolded) {
    const li = b.closest('li');
    const q = b.textContent.trim();
    const a = li ? li.textContent.replace(b.textContent, '').trim() : '';
    if (q && a) candidates.push({ name: q, acceptedAnswer: a });
  }

  // 4) Q: / A: patterns
  const textNodes = Array.from(doc.querySelectorAll('p, div'));
  for (const tn of textNodes) {
    const text = tn.textContent.trim();
    const lines = text.split(/\n+/).map(l=>l.trim()).filter(Boolean);
    for (let i=0;i<lines.length;i++) {
      const line = lines[i];
      const qMatch = line.match(/^Q[:\s]+(.+)/i);
      if (qMatch) {
        const q = qMatch[1].trim();
        const aLine = lines[i+1] || '';
        const aMatch = aLine.match(/^A[:\s]+(.+)/i);
        const a = aMatch ? aMatch[1].trim() : '';
        candidates.push({ name: q, acceptedAnswer: a });
      }
    }
  }

  // 5) Microdata / roles
  const qEls = Array.from(doc.querySelectorAll('[role~="question"],[itemprop~="name"],[itemprop~="question"]')).slice(0,200);
  for (const q of qEls) {
    const a = q.nextElementSibling ? q.nextElementSibling.textContent.trim() : '';
    candidates.push({ name: q.textContent.trim(), acceptedAnswer: a });
  }

  // De-duplicate and normalize
  const seen = new Set();
  const unique = [];
  for (const c of candidates) {
    const k = (c.name || '').replace(/\s+/g,' ').trim().slice(0,200) + '|' + (c.acceptedAnswer||'').slice(0,200);
    if (c.name && !seen.has(k)) { seen.add(k); unique.push({ name: c.name.trim(), acceptedAnswer: (c.acceptedAnswer||'').trim() }); }
  }

  // Filter noise: remove nav labels and trivial items, prefer Q/A-like candidates
  const stopLabels = new Set(['home','blog','about','contact','docs','getting started','index','read the docs']);
  function isQuestionLike(text) {
    if (!text) return false;
    const t = text.toLowerCase();
    if (t.length < 3) return false;
    if (t.endsWith('?')) return true;
    if (/\b(what|why|how|when|where|who|is|are|do|does|can|should|which)\b/i.test(t)) return true;
    return false;
  }

  const filtered = unique.filter(c => {
    const name = c.name.trim();
    if (!name) return false;
    const lname = name.toLowerCase().replace(/[\s]+/g,' ');
    if (stopLabels.has(lname)) return false;
    // if has answer, keep (but avoid extremely short answers)
    if (c.acceptedAnswer && c.acceptedAnswer.trim().length >= 10) return true;
    // otherwise keep if question-like
    if (isQuestionLike(name)) return true;
    return false;
  });

  return filtered;
}

function collectQAPairs(nodes) {
  const out = [];
  for (const n of nodes) {
    // dt dd
    if (n.querySelector) {
      const dts = n.querySelectorAll('dt');
      if (dts && dts.length) {
        dts.forEach(dt=>{
          const dd = dt.nextElementSibling && dt.nextElementSibling.tagName==='DD' ? dt.nextElementSibling : null;
          out.push({ name: dt.textContent.trim(), acceptedAnswer: dd ? dd.textContent.trim() : '' });
        });
      }

      // heading + paragraphs
      const headings = n.querySelectorAll('h3,h4');
      headings.forEach(h=>{
        const a = collectAnswerForQuestion(h);
        out.push({ name: h.textContent.trim(), acceptedAnswer: a });
      });

      // li strong
      const bis = n.querySelectorAll('li');
      bis.forEach(li=>{
        const s = li.querySelector('strong, b');
        if (s) out.push({ name: s.textContent.trim(), acceptedAnswer: li.textContent.replace(s.textContent,'').trim() });
      });
    }
  }
  return out;
}

function collectAnswerForQuestion(qEl) {
  let node = qEl.nextElementSibling;
  const parts = [];
  while (node && !(node.tagName && /H[1-4]/i.test(node.tagName))) {
    if (node.tagName === 'P' || node.tagName === 'UL' || node.tagName === 'OL' || node.tagName === 'DIV') parts.push(node.textContent.trim());
    if (parts.join(' ').length > 2000) break;
    node = node.nextElementSibling;
  }
  return parts.join('\n\n').trim();
}

function scoreCandidates(candidates, hasFaqHeading) {
  // simple scoring: base on count + presence of FAQ heading
  const n = candidates.length;
  let score = Math.min(1, (n / 10));
  if (hasFaqHeading) score = Math.min(1, score + 0.4);
  // boost when we detect dt/dd or roles in names
  const roleHints = candidates.some(c => /\b(role=|itemprop)/i.test(c.name));
  if (roleHints) score = Math.min(1, score + 0.1);
  return Math.round(score * 100) / 100;
}

function writeCandidate(pageName, candidates, score) {
  const out = { page: pageName, count: candidates.length, confidence: score, generatedAt: (new Date()).toISOString(), candidates };
  const outPath = path.join(candidatesDir, `${pageName}-faq-candidate.json`);
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
}

// Run
const htmlFiles = findHtmlFiles(publicDir);
const _pageConfig = loadPageConfig();
const report = [];
for (const f of htmlFiles) {
  const name = path.basename(f).replace(/\.html$/, '');
  // skip pages that already have manual FAQ
  const manualFaqPath = path.join(schemasDir, `${name}-faq.json`);
  if (fs.existsSync(manualFaqPath)) {
    // record skip
    report.push({ page: name, status: 'manual', reason: 'manual faq exists' });
    continue;
  }

  const html = fs.readFileSync(f, 'utf8');
  const dom = new JSDOM(html);
  const hasFaqHeading = /faq|frequently asked|q&a|questions?/i.test(dom.window.document.body.textContent);
  const candidates = extractFaqCandidatesFromHtml(html);

  if (!candidates || candidates.length === 0) { report.push({ page: name, status: 'none' }); continue; }

  const score = scoreCandidates(candidates, hasFaqHeading);
  // write candidate file only if there is measurable confidence
  if (score >= 0.35) writeCandidate(name, candidates, score);
  report.push({ page: name, status: score>=0.35 ? 'candidate' : 'low-confidence', confidence: score, count: candidates.length });
}

// write report
fs.writeFileSync(path.join(schemasDir, 'faq-candidates-report.json'), JSON.stringify({ generatedAt: (new Date()).toISOString(), results: report }, null, 2) + '\n', 'utf8');
console.log('FAQ candidate run complete — wrote faq-candidates-report.json and candidate files to data/schemas/candidates/');
process.exit(0);
