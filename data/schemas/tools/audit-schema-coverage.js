#!/usr/bin/env node
/**
 * Audit schema coverage across public HTML files and data/schemas JSON files
 * Classifies pages into categories:
 *  - no-structured-data
 *  - inline-structured-data-only
 *  - separate-schemas-not-in-page-config
 *  - comprehensive-schemas-not-in-page-config
 *  - configured-and-included (good)
 *
 * Usage: node data/schemas/tools/audit-schema-coverage.js [publicPath]
 */
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';

const publicPath = process.argv[2] || 'public';
const schemasDir = join('data','schemas');

function findHtmlFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) files.push(...findHtmlFiles(p));
    else if (e.isFile() && extname(e.name) === '.html') files.push(p);
  }
  return files;
}

function extractInlineSchemas(html) {
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const items = [];
  let m;
  while ((m = regex.exec(html)) !== null) {
    try {
      const json = JSON.parse(m[1]);
      items.push(json);
    } catch (e) {
      items.push({ _invalid: true });
    }
  }
  return items;
}

function hasFaqMarkup(html){
  return /class=["']?faq-item["']?/i.test(html) || /id=["']?product-faq["']?/i.test(html);
}

function loadPageConfig(){
  const path = join(schemasDir,'page-config.json');
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path,'utf8'));
}

function collectSchemaFiles(){
  if (!existsSync(schemasDir)) return [];

  function collect(dir, base=''){
    const items = readdirSync(dir, { withFileTypes: true });
    const out = [];
    for(const it of items){
      const p = join(dir, it.name);
      const rel = base ? `${base}/${it.name}` : it.name;
      if(it.isDirectory()) out.push(...collect(p, rel));
      else if(it.isFile() && it.name.endsWith('.json')) out.push(rel);
    }
    return out;
  }

  return collect(schemasDir);
}

function runAudit(){
  const htmlFiles = findHtmlFiles(publicPath);
  const schemaFiles = collectSchemaFiles();
  const pageConfig = loadPageConfig();

  const report = {
    noStructuredData: [],
    inlineOnly: [],
    separateNotInConfig: [],
    comprehensiveNotInConfig: [],
    configuredAndIncluded: []
  };

  for (const f of htmlFiles){
    const name = basename(f).replace('.html','');
    const html = readFileSync(f,'utf8');
    const inline = extractInlineSchemas(html);
    const hasInline = inline.length > 0;
    const hasFaq = hasFaqMarkup(html);
    const pageSchemasFiles = schemaFiles.filter(s => s.startsWith(`${name}-`) || s === `${name}.json`);
    const hasSchemaFiles = pageSchemasFiles.length > 0;

    // Heuristic: if pageConfig.pages includes config for this page, it's configured
    const configForPage = pageConfig.pages && pageConfig.pages[name];

    // Heuristic: detect comprehensive structured data if schema files include Article/FAQ/Breadcrumbs etc
    let comprehensive = false;
    if (hasSchemaFiles){
      for (const sf of pageSchemasFiles){
        try{
          const data = JSON.parse(readFileSync(join(schemasDir,sf),'utf8'));
          const t = data['@type'] || data['@graph'] && data['@graph'][0] && data['@graph'][0]['@type'];
          if (t && (t === 'Article' || t === 'FAQPage' || t === 'BreadcrumbList' || t === 'SoftwareApplication')) comprehensive = true;
        }catch(e){ void 0; }
      }
    }

    if (!hasInline && !hasSchemaFiles){
      report.noStructuredData.push({ page: name, path: f });
    } else if (hasInline && !hasSchemaFiles){
      report.inlineOnly.push({ page: name, path: f, inlineCount: inline.length, hasFaq });
    } else if (!hasInline && hasSchemaFiles && !configForPage){
      if (comprehensive) report.comprehensiveNotInConfig.push({ page: name, schemaFiles: pageSchemasFiles });
      else report.separateNotInConfig.push({ page: name, schemaFiles: pageSchemasFiles });
    } else if ((hasInline || hasSchemaFiles) && configForPage){
      report.configuredAndIncluded.push({ page: name, configured: true, schemaFiles: pageSchemasFiles, inlineCount: inline.length });
    } else {
      // fallback bucket
      report.separateNotInConfig.push({ page: name, schemaFiles: pageSchemasFiles, inlineCount: inline.length });
    }
  }

  return report;
}

function printReport(rep){
  console.log('\nSchema Coverage Audit Report');
  console.log('--------------------------------');
  console.log(`\nNo structured data (${rep.noStructuredData.length}):`);
  rep.noStructuredData.forEach(i=>console.log(' -',i.page));

  console.log(`\nInline-only structured data (${rep.inlineOnly.length}):`);
  rep.inlineOnly.forEach(i=>console.log(' -',i.page, `(inline scripts: ${i.inlineCount})`));

  console.log(`\nSeparate schema files not in page-config (${rep.separateNotInConfig.length}):`);
  rep.separateNotInConfig.forEach(i=>console.log(' -',i.page, i.schemaFiles.join(',')));

  console.log(`\nComprehensive schema files not in page-config (${rep.comprehensiveNotInConfig.length}):`);
  rep.comprehensiveNotInConfig.forEach(i=>console.log(' -',i.page, i.schemaFiles.join(',')));

  console.log(`\nConfigured & included (${rep.configuredAndIncluded.length}):`);
  rep.configuredAndIncluded.forEach(i=>console.log(' -', i.page, `(schemas: ${i.schemaFiles.join(',') || 'none'}, inline: ${i.inlineCount})`));
}

const rep = runAudit();
printReport(rep);

// Optionally write report to file
try{ const out = JSON.stringify(rep,null,2); require('fs').writeFileSync(join('build','schema-audit-report.json'), out); console.log('\nSaved report to build/schema-audit-report.json'); }catch(e){/* ignore */}

process.exit(0);
