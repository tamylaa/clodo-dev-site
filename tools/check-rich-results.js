#!/usr/bin/env node
/**
 * Lightweight Rich Results validator (local)
 * Checks presence and required properties for: HowTo, FAQPage, Article/BlogPosting
 * Usage: node tools/check-rich-results.js [path]
 */
const fs = require('fs');
const path = require('path');
const file = process.argv[2] || path.join('dist', 'edge-vs-cloud-computing.html');
let html = '';
try { html = fs.readFileSync(file, 'utf8'); } catch (e) { console.error('ERROR: failed to read', file, e.message); process.exit(2); }
const rx = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
let m; const schemas = [];
while ((m = rx.exec(html)) !== null) {
  const txt = m[1].trim();
  try {
    const parsed = JSON.parse(txt);
    if (Array.isArray(parsed)) parsed.forEach(i => schemas.push(i));
    else if (parsed['@graph'] && Array.isArray(parsed['@graph'])) parsed['@graph'].forEach(i => schemas.push(i));
    else schemas.push(parsed);
  } catch (err) {
    schemas.push({ __invalid: true, error: err.message, raw: txt.slice(0, 200) });
  }
}
function find(type){ return schemas.find(s=>s && (s['@type']===type || (Array.isArray(s['@type']) && s['@type'].includes(type)))); }
function exists(o,p){ try { return p.split('.').reduce((a,k)=>a&&a[k], o)!==undefined } catch(e){return false} }
const report = { HowTo: {eligible:false,warnings:[]}, FAQPage:{eligible:false,warnings:[]}, Article:{eligible:false,warnings:[]} };
// HowTo
const how = find('HowTo');
if (how) {
  if (!how.name) report.HowTo.warnings.push('missing name');
  if (!Array.isArray(how.step) || how.step.length===0) report.HowTo.warnings.push('missing/empty step array');
  else how.step.forEach((st,i)=>{
    if (!st['@type'] || st['@type']!=='HowToStep') report.HowTo.warnings.push(`step ${i+1} missing @type HowToStep`);
    if (!st.name) report.HowTo.warnings.push(`step ${i+1} missing name`);
    if (!st.text && !st.url) report.HowTo.warnings.push(`step ${i+1} missing text or url`);
  });
  if (report.HowTo.warnings.length===0) report.HowTo.eligible = true;
}
// FAQPage
const faq = find('FAQPage');
if (faq) {
  if (!Array.isArray(faq.mainEntity) || faq.mainEntity.length===0) report.FAQPage.warnings.push('missing or empty mainEntity');
  else faq.mainEntity.forEach((q,i)=>{
    if (!q.name) report.FAQPage.warnings.push(`Q${i+1} missing name`);
    if (!q.acceptedAnswer || !q.acceptedAnswer.text) report.FAQPage.warnings.push(`Q${i+1} missing acceptedAnswer.text`);
  });
  if (report.FAQPage.warnings.length===0) report.FAQPage.eligible = true;
}
// Article / BlogPosting
const art = find('Article') || find('BlogPosting') || find('TechArticle');
if (art) {
  if (!art.headline) report.Article.warnings.push('missing headline');
  const hasImage = art.image || (Array.isArray(art.image) && art.image.length) || (art.image && art.image.url);
  if (!hasImage) report.Article.warnings.push('missing image');
  if (!art.datePublished) report.Article.warnings.push('missing datePublished');
  if (!art.author) report.Article.warnings.push('missing author');
  if (report.Article.warnings.length===0) report.Article.eligible = true;
}
// Output
console.log('\n=== Rich Results (local validation) ===\n');
console.log('Source:', file);
['HowTo','FAQPage','Article'].forEach(k=>{
  const r = report[k];
  console.log(`\n• ${k}: ${r.eligible ? 'ELIGIBLE ✅' : 'NOT ELIGIBLE ❌'}`);
  if (r.warnings.length) console.log('  Warnings: ' + r.warnings.join('; '));
});
console.log('\nDetected schema types:', schemas.map(s=>s && s['@type'] ? s['@type'] : (s && s.__invalid ? '[INVALID JSON-LD]' : '[unknown]')).join(', '));
console.log('\nValidation complete. This is a local eligibility check (not Google API).');
if (!report.HowTo.eligible || !report.FAQPage.eligible) process.exit(3); else process.exit(0);
