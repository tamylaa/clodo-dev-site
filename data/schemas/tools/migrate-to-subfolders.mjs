import { readdirSync, renameSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const schemasDir = join('data','schemas');
const pagesDir = join(schemasDir, 'pages');
const breadcrumbsDir = join(schemasDir, 'breadcrumbs');
const faqsDir = join(schemasDir, 'faqs');

[pagesDir, breadcrumbsDir, faqsDir].forEach(d => { if(!existsSync(d)) mkdirSync(d, { recursive: true }); });

const entries = readdirSync(schemasDir, { withFileTypes: true });
let moved = 0;
for(const e of entries){
  if(!e.isFile()) continue;
  const name = e.name;
  const src = join(schemasDir, name);

  if(/-article\.json$/i.test(name)){
    const dest = join(pagesDir, name);
    renameSync(src, dest);
    console.log(`Moved ${name} -> pages/`);
    moved++;
    continue;
  }
  if(/-breadcrumbs\.json$/i.test(name) || /\.amp-breadcrumbs\.json$/i.test(name)){
    const dest = join(breadcrumbsDir, name);
    renameSync(src, dest);
    console.log(`Moved ${name} -> breadcrumbs/`);
    moved++;
    continue;
  }
  if(/-faq\.json$/i.test(name) || /\.amp-faq\.json$/i.test(name)){
    const dest = join(faqsDir, name);
    renameSync(src, dest);
    console.log(`Moved ${name} -> faqs/`);
    moved++;
    continue;
  }
}

console.log(`Migration complete — moved ${moved} files.`);
process.exit(0);
