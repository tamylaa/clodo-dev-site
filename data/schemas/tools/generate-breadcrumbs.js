#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

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

function saveBreadcrumb(pageName, crumbs) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': crumbs.map((c, i) => ({ '@type': 'ListItem', 'position': i+1, 'name': c.name, 'item': c.url }))
  };
  const outPath = path.join(schemasDir, `${pageName}-breadcrumbs.json`);
  fs.writeFileSync(outPath, JSON.stringify(schema, null, 2) + '\n', 'utf8');
}

function slugToName(slug) {
  return slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

const htmlFiles = findHtmlFiles(publicDir);
const pageConfig = loadPageConfig();
let created = 0;
for (const f of htmlFiles) {
  const rel = path.relative(publicDir, f).replace(/\\/g, '/');
  const parts = rel.split('/');
  const name = parts[parts.length-1].replace(/\.html$/, '');

  // skip top-level utility files
  if (/^(google|robots|sitemap|_headers|_redirects)/.test(name)) continue;

  // build crumbs: Home + each directory + page
  const crumbs = [];
  crumbs.push({ name: 'Home', url: 'https://www.clodo.dev' });

  // accumulate path
  let prefix = '';
  for (let i=0;i<parts.length-1;i++) {
    prefix = prefix ? prefix + '/' + parts[i] : parts[i];
    const slug = parts[i];
    const pageEntry = pageConfig.pages && pageConfig.pages[slug] ? pageConfig.pages[slug] : null;
    const crumbName = pageEntry && pageEntry.name ? pageEntry.name : slugToName(slug);
    crumbs.push({ name: crumbName, url: `https://www.clodo.dev/${prefix}` });
  }

  // finally the page itself
  const pageEntry = pageConfig.pages && pageConfig.pages[name] ? pageConfig.pages[name] : null;
  const pageName = (pageEntry && (pageEntry.title || pageEntry.name)) || slugToName(name);
  crumbs.push({ name: pageName, url: `https://www.clodo.dev/${name}` });

  saveBreadcrumb(name, crumbs);

  // ensure breadcrumb requirement in page-config
  if (!pageConfig.pages) pageConfig.pages = {};
  if (!pageConfig.pages[name]) pageConfig.pages[name] = { type: 'WebPage', requiredSchemas: ['WebSite'] };
  const req = pageConfig.pages[name].requiredSchemas || [];
  if (!req.includes('BreadcrumbList')) req.push('BreadcrumbList');
  pageConfig.pages[name].requiredSchemas = req;

  created++;
}

if (created > 0) {
  fs.writeFileSync(pageConfigPath, JSON.stringify(pageConfig, null, 2) + '\n', 'utf8');
}

console.log(`Generated breadcrumbs for ${created} pages.`);
process.exit(0);
