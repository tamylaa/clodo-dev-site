#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const schemasDir = path.join('data','schemas');
const pagesDir = path.join(schemasDir, 'pages');
const breadcrumbsDir = path.join(schemasDir, 'breadcrumbs');
const faqsDir = path.join(schemasDir, 'faqs');

[pagesDir, breadcrumbsDir, faqsDir].forEach(d => { if(!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

const entries = fs.readdirSync(schemasDir, { withFileTypes: true });
let moved = 0;
for(const e of entries){
  if(!e.isFile()) continue;
  const name = e.name;
  const src = path.join(schemasDir, name);

  if(/-article\.json$/i.test(name)){
    const dest = path.join(pagesDir, name);
    fs.renameSync(src, dest);
    console.log(`Moved ${name} -> pages/`);
    moved++;
    continue;
  }
  if(/-breadcrumbs\.json$/i.test(name) || /\.amp-breadcrumbs\.json$/i.test(name)){
    const dest = path.join(breadcrumbsDir, name);
    fs.renameSync(src, dest);
    console.log(`Moved ${name} -> breadcrumbs/`);
    moved++;
    continue;
  }
  if(/-faq\.json$/i.test(name) || /\.amp-faq\.json$/i.test(name)){
    const dest = path.join(faqsDir, name);
    fs.renameSync(src, dest);
    console.log(`Moved ${name} -> faqs/`);
    moved++;
    continue;
  }
}

console.log(`Migration complete — moved ${moved} files.`);
process.exit(0);
