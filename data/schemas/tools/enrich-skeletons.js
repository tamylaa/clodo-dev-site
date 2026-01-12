#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const schemasDir = path.join('data','schemas');
const publicDir = 'public';
const pageConfigPath = path.join(schemasDir, 'page-config.json');
const blogDataPath = path.join('data','blog','blog-data.json');

function listSchemaFiles() {
  return fs.readdirSync(schemasDir).filter(f => f.endsWith('-article.json'));
}

function loadJson(file) {
  return JSON.parse(fs.readFileSync(path.join(schemasDir, file), 'utf8'));
}

function saveJson(file, obj) {
  fs.writeFileSync(path.join(schemasDir, file), JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function safeReadJson(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch (e) { return null; }
}

function extractMetadataFromHtml(html) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const meta = {};
  const titleEl = doc.querySelector('title');
  meta.title = titleEl ? titleEl.textContent.trim() : null;

  const canonical = doc.querySelector('link[rel="canonical"]');
  meta.canonical = canonical ? canonical.getAttribute('href') : null;

  const description = doc.querySelector('meta[name="description"]') || doc.querySelector('meta[property="og:description"]');
  meta.description = description ? description.getAttribute('content') : null;

  const authorMeta = doc.querySelector('meta[name="author"]') || doc.querySelector('meta[property="article:author"]');
  meta.author = authorMeta ? authorMeta.getAttribute('content') : null;

  const pub = doc.querySelector('meta[property="article:published_time"]') || doc.querySelector('meta[name="date"]');
  meta.datePublished = pub ? pub.getAttribute('content') : null;

  const mod = doc.querySelector('meta[property="article:modified_time"]') || doc.querySelector('meta[name="last-modified"]');
  meta.dateModified = mod ? mod.getAttribute('content') : null;

  const image = doc.querySelector('meta[property="og:image"]') || doc.querySelector('link[rel="image_src"]') || doc.querySelector('img');
  meta.image = image ? (image.getAttribute('content') || image.getAttribute('href') || image.getAttribute('src')) : null;

  // Extract article text for word count
  let articleText = '';
  const articleEl = doc.querySelector('article');
  if (articleEl) articleText = articleEl.textContent;
  else articleText = doc.body ? doc.body.textContent : '';
  const words = articleText ? articleText.trim().split(/\s+/).filter(Boolean) : [];
  meta.wordCount = words.length;
  meta.readingTimeMinutes = Math.max(1, Math.ceil(meta.wordCount / 200));

  // keywords
  const keywordsMeta = doc.querySelector('meta[name="keywords"]');
  meta.keywords = keywordsMeta ? keywordsMeta.getAttribute('content').split(',').map(s=>s.trim()).filter(Boolean) : [];

  return meta;
}

function shouldEnrich(json) {
  return json.generated === true && json.generatedBy && json.generatedBy.startsWith('generate-skeletons');
}

// Load site metadata
const pageConfig = safeReadJson(pageConfigPath) || { pages: {} };
const blogData = safeReadJson(blogDataPath) || { authors: {} };
const authorMap = {};
if (blogData && blogData.authors) {
  for (const a of Object.keys(blogData.authors)) {
    const author = blogData.authors[a];
    authorMap[a] = author.name || a;
  }
}

const files = listSchemaFiles();
let updated = 0;
let removed = 0;
for (const f of files) {
  const json = loadJson(f);
  if (!shouldEnrich(json)) continue;

  const pageName = f.replace(/-article.json$/, '');

  // Skip verification/utility pages and experiments
  if (/^google[0-9a-f]{6,}$/i.test(pageName) || pageName === 'robots' || pageName === 'sitemap' || pageName === 'welcome' || pageName === 'analytics') {
    console.log(`Removing skeleton for utility/verification page: ${f}`);
    fs.unlinkSync(path.join(schemasDir, f));
    removed++;
    // remove page-config entry if present
    if (pageConfig.pages && pageConfig.pages[pageName]) {
      delete pageConfig.pages[pageName];
    }
    continue;
  }

  // map to public path
  let publicPath = path.join(publicDir, `${pageName}.html`);
  // also check experiments folder
  if (!fs.existsSync(publicPath)) {
    const alt = path.join(publicDir, 'experiments', `${pageName}.html`);
    if (fs.existsSync(alt)) publicPath = alt;
  }

  // If public page is missing, skip or remove based on name heuristics
  if (!fs.existsSync(publicPath)) {
    console.log(`Skipping ${f}: public page not found (${publicPath})`);
    continue;
  }

  const html = fs.readFileSync(publicPath, 'utf8');
  const meta = extractMetadataFromHtml(html);

  // If page has very little content, do not keep a schema
  if (meta.wordCount < 50) {
    console.log(`Removing skeleton for low-content page: ${f} (wordCount=${meta.wordCount})`);
    fs.unlinkSync(path.join(schemasDir, f));
    removed++;
    if (pageConfig.pages && pageConfig.pages[pageName]) delete pageConfig.pages[pageName];
    continue;
  }

  // Determine type from page-config if available
  const cfg = pageConfig.pages && pageConfig.pages[pageName] ? pageConfig.pages[pageName] : null;
  const desiredType = cfg && cfg.type ? cfg.type : (meta.wordCount > 200 ? 'Article' : 'WebPage');

  // Build enriched JSON-LD
  const enriched = {
    '@context': 'https://schema.org',
    '@type': desiredType,
    'headline': (cfg && cfg.name) || meta.title || json.headline || pageName.replace(/-/g, ' '),
    'url': (cfg && cfg.url) || meta.canonical || json.url || `https://www.clodo.dev/${pageName}`,
    'description': (cfg && cfg.description) || meta.description || json.description || undefined,
    'generatedBy': 'skeleton-enricher.js',
    'generated': false // mark as enriched, not auto-generated skeleton
  };

  // Author resolution
  let authorName = null;
  if (cfg && cfg.author) authorName = cfg.author;
  if (!authorName && meta.author) authorName = meta.author;
  // try mapping from blog authors
  if (authorName && authorMap[authorName]) authorName = authorMap[authorName];
  if (authorName) enriched.author = { '@type': 'Person', 'name': authorName };

  if (meta.datePublished) enriched.datePublished = meta.datePublished;
  if (meta.dateModified) enriched.dateModified = meta.dateModified;
  if (meta.image) enriched.image = { '@type': 'ImageObject', 'url': meta.image };
  if (meta.keywords && meta.keywords.length) enriched.keywords = meta.keywords;
  if (meta.wordCount) enriched.wordCount = meta.wordCount;
  if (meta.readingTimeMinutes) enriched.readingTime = `${meta.readingTimeMinutes} min`;

  // Merge with existing JSON to preserve extra properties like faqs if present
  const merged = Object.assign({}, json, enriched);

  saveJson(f, merged);
  console.log(`Enriched: ${f} (type=${desiredType}, wordCount=${meta.wordCount}, readingTime=${meta.readingTimeMinutes}m)`);
  updated++;
}

if (removed > 0) {
  // persist changes to page-config if we removed entries
  fs.writeFileSync(pageConfigPath, JSON.stringify(pageConfig, null, 2) + '\n', 'utf8');
}

console.log(`\nEnrichment complete — ${updated} files updated, ${removed} files removed.`);
process.exit(0);

