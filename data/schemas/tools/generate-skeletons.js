#!/usr/bin/env node
/**
 * Generate skeleton page configs and minimal JSON-LD article files for pages missing structured data.
 * Usage:
 *   node data/schemas/tools/generate-skeletons.js --pilot 20
 *   node data/schemas/tools/generate-skeletons.js --all
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, basename } from 'path';

const publicDir = process.argv.includes('--public') ? process.argv[process.argv.indexOf('--public') + 1] : 'public';
const schemasDir = join('data','schemas');
const pageConfigPath = join(schemasDir, 'page-config.json');
const pilotArgIndex = process.argv.indexOf('--pilot');
const pilotCount = pilotArgIndex !== -1 ? parseInt(process.argv[pilotArgIndex + 1], 10) : 20;
const doAll = process.argv.includes('--all');

function findHtmlFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) files.push(...findHtmlFiles(p));
    else if (e.isFile() && p.endsWith('.html') && !p.includes('/amp/') && !p.includes('amp\\')) files.push(p);
  }
  return files;
}

function extractTitleAndCanonical(html) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const canonicalMatch = html.match(/<link rel=["']canonical["'] href=["']([^"']+)["']\s*\/>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;
  const canonical = canonicalMatch ? canonicalMatch[1] : null;
  return { title, canonical };
}

function looksLikeArticle(html) {
  return /<article[\s>]/i.test(html) || /property=["']og:type["']\s+content=["']article["']/i.test(html);
}

function loadPageConfig() {
  try { return JSON.parse(readFileSync(pageConfigPath, 'utf8')); }
  catch (e) { return { blogPosts: {}, caseStudies: {}, pages: {} }; }
}

function savePageConfig(cfg) {
  writeFileSync(pageConfigPath, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
}

function pageHasSchemaFiles(pageName) {
  try {
    const files = readdirSync(schemasDir);
    return files.some(f => f.startsWith(`${pageName}-`) || f === `${pageName}.json`);
  } catch (e) { return false; }
}

// Collect candidates
const htmlFiles = findHtmlFiles(publicDir);
const pageConfig = loadPageConfig();
const missingPages = [];
for (const f of htmlFiles) {
  const name = basename(f).replace(/\.html$/, '');

  // Skip experimental variant pages (A/B tests) and standalone experiment pages
  const isExperiment = f.includes('/experiments/') || f.includes('\\experiments\\');
  if (name.includes('-variant-') || isExperiment) {
    console.log(`Skipping experiment/variant page: ${name}`);
    continue;
  }

  if (pageConfig.pages?.[name] || pageConfig.blogPosts?.[`${name}.html`] || pageConfig.caseStudies?.[`${name}.html`]) continue;
  if (pageHasSchemaFiles(name)) continue;
  missingPages.push({ name, path: f });
}

if (missingPages.length === 0) {
  console.log('No pages missing schema skeletons.');
  process.exit(0);
}

const count = doAll ? missingPages.length : Math.min(pilotCount, missingPages.length);
const chosen = missingPages.slice(0, count);

console.log(`Selected ${chosen.length} pages for skeleton generation (${doAll ? 'all' : 'pilot'})`);

for (const p of chosen) {
  const html = readFileSync(p.path, 'utf8');
  const { title, canonical } = extractTitleAndCanonical(html);
  const isArticle = looksLikeArticle(html);
  const pageName = p.name;

  // Add to page-config if missing
  if (!pageConfig.pages) pageConfig.pages = {};
  if (!pageConfig.pages[pageName]) {
    const type = isArticle ? 'Article' : 'WebPage';
    pageConfig.pages[pageName] = {
      type,
      requiredSchemas: isArticle ? ['Article', 'BreadcrumbList'] : ['WebSite', 'BreadcrumbList']
    };
    console.log(`Added page-config entry: ${pageName} -> ${type}`);
  }

  // Create minimal page-level schema file if none exists
  const schemaFile = join(schemasDir, `${pageName}-article.json`);
  if (!existsSync(schemaFile)) {
    const article = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': title || pageName.replace(/-/g, ' '),
      'url': canonical || `https://www.clodo.dev/${pageName}`,
      'generatedBy': 'generate-skeletons.js',
      'generated': true
    };
    writeFileSync(schemaFile, JSON.stringify(article, null, 2) + '\n', 'utf8');
    console.log(`Created schema file: data/schemas/${pageName}-article.json`);
  } else {
    console.log(`Schema file already exists for ${pageName}, skipping file creation`);
  }
}

// Persist page-config
savePageConfig(pageConfig);

console.log('\nDone. Run the audit and build to verify:');
console.log('  node data/schemas/tools/audit-schema-coverage.js public');
console.log('  npm run build');
console.log('Files created for review. Please inspect and commit any desired changes.');

process.exit(0);
