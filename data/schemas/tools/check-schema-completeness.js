#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const schemasDir = path.join('data','schemas');

function collectJsonFiles(dir, base = ''){
  const items = fs.readdirSync(dir, { withFileTypes: true });
  const out = [];
  for(const it of items){
    const p = path.join(dir, it.name);
    const rel = base ? `${base}/${it.name}` : it.name;
    if(it.isDirectory()) out.push(...collectJsonFiles(p, rel));
    else if(it.isFile() && it.name.endsWith('.json')) out.push(rel);
  }
  return out;
}

const files = collectJsonFiles(schemasDir).filter(f => f.endsWith('.json'));

const requiredFieldsByType = {
  'Article': ['headline','datePublished'], // url is injected during build from canonical tag
  'WebPage': ['headline','url','description','keywords'],
  'FAQPage': ['mainEntity'], // FAQPage uses mainEntity array containing Question/Answer pairs
  'SoftwareApplication': ['name','description','url'],
  'Product': ['name','description','url','offers'],
  'BreadcrumbList': ['itemListElement'] // minimal requirement for breadcrumbs
};

function checkFile(file) {
  const p = path.join(schemasDir, file);
  try {
    const json = JSON.parse(fs.readFileSync(p, 'utf8'));
    const type = json['@type'] || json.type || 'Unknown';
    const result = { file, type, generated: !!json.generated, generatedBy: json.generatedBy || null, present: {} };
    const keys = Object.keys(json);
    result.keyCount = keys.length;

    const required = requiredFieldsByType[type];
    if (required) {
      result.missing = required.filter(f => !(f in json));
    } else {
      result.missing = [];
    }

    // checks for minimal skeletons: very few keys or only headline/url
    result.isMinimal = (result.keyCount <= 4) || (Object.keys(json).length <= 3);

    // compute content richness indicators
    result.hasArticleBody = !!json.articleBody || !!json.wordCount;
    result.hasKeywords = Array.isArray(json.keywords) && json.keywords.length>0;
    result.hasAuthor = !!json.author;

    return result;
  } catch (e) {
    return { file, error: e.message };
  }
}

const results = files.map(checkFile);
const total = results.length;
const minimal = results.filter(r => r.isMinimal || r.generated).length;
const missingImportant = results.filter(r => r.missing && r.missing.length>0).length;

console.log('Schema completeness scan report\n--------------------------------');
console.log(`Total schema files: ${total}`);
console.log(`Potential minimal/generated skeletons: ${minimal}`);
console.log(`Files missing required fields (per type): ${missingImportant}\n`);

console.log('Top 30 files missing fields or minimal:');
results
  .filter(r => r.isMinimal || (r.missing && r.missing.length>0) || r.generated)
  .slice(0,30)
  .forEach(r => {
    if (r.error) console.log(` - ${r.file}: ERROR ${r.error}`);
    else console.log(` - ${r.file}: type=${r.type} keys=${r.keyCount} generated=${r.generated} missing=[${r.missing.join(', ')}] minimal=${r.isMinimal}`);
  });

// Write a JSON report for review
fs.writeFileSync(path.join(schemasDir, 'completeness-report.json'), JSON.stringify({ total, minimal, missingImportant, details: results }, null, 2)+"\n");
console.log('\nWrote report to data/schemas/completeness-report.json');
process.exit(0);
