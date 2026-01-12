#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const candidatesDir = path.join('data','schemas','candidates');
const schemasDir = path.join('data','schemas');
const faqsDir = path.join(schemasDir, 'faqs');
if (!fs.existsSync(faqsDir)) try { fs.mkdirSync(faqsDir, { recursive: true }); } catch(e){}
const pageConfigPath = path.join(schemasDir, 'page-config.json');

function safeReadJson(p){ try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch(e){ return null } }
const pageConfig = safeReadJson(pageConfigPath) || { pages: {} };

function isQuestionLike(text){ if(!text) return false; const t=text.trim(); if(t.endsWith('?')) return true; if(/\b(what|why|how|when|where|who|is|are|do|does|can|should|which)\b/i.test(t)) return true; return false }

const files = fs.readdirSync(candidatesDir).filter(f=>f.endsWith('-faq-candidate.json'));
let applied=0; const appliedList=[]; const skipped=[];
for(const f of files){
  const p = path.join(candidatesDir, f);
  const data = safeReadJson(p);
  if(!data) continue;
  const page = data.page;
  const conf = data.confidence || 0;
  if(conf < 0.8){ skipped.push({page, reason:'low-confidence', confidence: conf}); continue; }

  // safety check: ensure at least one candidate Q is question-like OR answer length >=40
  const candidates = (data.candidates||[]).filter(c=>c.name && c.name.trim());
  const hasGood = candidates.some(c => isQuestionLike(c.name) || (c.acceptedAnswer && c.acceptedAnswer.length >= 40));
  if(!hasGood){ skipped.push({page, reason:'no-question-like-or-long-answer', confidence: conf}); continue; }

  // Build FAQ schema selecting only reasonable QAs
  const qa = candidates.filter(c=>{
    if(!c.name || !c.name.trim()) return false;
    if(/^(home|blog|index|read the docs|subscribe)$/i.test(c.name.trim())) return false;
    if(c.acceptedAnswer && c.acceptedAnswer.trim().length < 10 && !isQuestionLike(c.name)) return false;
    return true;
  }).slice(0,50); // cap

  if(qa.length === 0){ skipped.push({page, reason:'filtered-out', confidence: conf}); continue; }

  const schema = { '@context':'https://schema.org','@type':'FAQPage','mainEntity': qa.map(q=>({ '@type':'Question','name': q.name.trim(), 'acceptedAnswer': { '@type':'Answer', 'text': q.acceptedAnswer ? q.acceptedAnswer.trim() : '' } })) };
  const outPath = path.join(faqsDir, `${page}-faq.json`);
  // Check for manual faq in new location or legacy location
  const legacyPath = path.join(schemasDir, `${page}-faq.json`);
  if(fs.existsSync(outPath) || fs.existsSync(legacyPath)){ skipped.push({page, reason:'manual-faq-exists', confidence:conf}); continue; }
  fs.writeFileSync(outPath, JSON.stringify(schema, null, 2) + '\n', 'utf8');

  // update page-config requiredSchemas
  if(!pageConfig.pages) pageConfig.pages = {};
  if(!pageConfig.pages[page]) pageConfig.pages[page] = { type: 'WebPage', requiredSchemas: ['WebSite','BreadcrumbList'] };
  const req = pageConfig.pages[page].requiredSchemas || [];
  if(!req.includes('FAQPage')) req.push('FAQPage');
  pageConfig.pages[page].requiredSchemas = req;

  applied++;
  appliedList.push(page);
  console.log(`Applied FAQ for page: ${page} (confidence=${conf}, items=${qa.length})`);
}

if(applied > 0){ fs.writeFileSync(pageConfigPath, JSON.stringify(pageConfig, null, 2) + '\n', 'utf8'); }
fs.writeFileSync(path.join(schemasDir, 'faq-apply-report.json'), JSON.stringify({ applied, appliedList, skipped, generatedAt: (new Date()).toISOString() }, null, 2) + '\n', 'utf8');
console.log(`\nDone. Applied ${applied} FAQ(s). Report: data/schemas/faq-apply-report.json`);
process.exit(0);
