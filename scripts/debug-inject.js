import { readFileSync } from 'fs';
import { join } from 'path';

const file = 'public/saas-product-startups-cloudflare-case-studies.html';
const content = readFileSync(file, 'utf8');
console.log('has hero-visual:', content.includes('<div class="hero-visual">'));
const pageConfig = JSON.parse(readFileSync(join('data','schemas','page-config.json'), 'utf8'));
const fileName = 'saas-product-startups-cloudflare-case-studies.html';
let config = pageConfig.pagesByPath && pageConfig.pagesByPath[fileName] ? pageConfig.pagesByPath[fileName] : null;
if (!config && pageConfig.pages && pageConfig.pages[fileName.replace('.html','')]) config = pageConfig.pages[fileName.replace('.html','')];
if (!config && pageConfig.caseStudies && pageConfig.caseStudies[fileName]) config = pageConfig.caseStudies[fileName];
console.log('config found:', !!config);
console.log('config:', JSON.stringify(config, null, 2));
console.log('images array present:', Array.isArray(config && config.images));
const imagesManifest = JSON.parse(readFileSync(join('data','images','seo','images.json'), 'utf8'));
const imagesArr = config && config.images ? config.images : [];
const entries = imagesArr.map(id=>imagesManifest.find(i=>i.id===id)).filter(Boolean);
console.log('entries found:', entries.length);
console.log('first entry id:', entries[0] && entries[0].id);

// Simulate standalone injection logic
const pageConfigStandalone = JSON.parse(readFileSync(join('data','schemas','page-config.json'),'utf8'));
let configStandalone = pageConfigStandalone.pagesByPath && pageConfigStandalone.pagesByPath[fileName] ? pageConfigStandalone.pagesByPath[fileName] : null;
if (!configStandalone && pageConfigStandalone.pages && pageConfigStandalone.pages[fileName.replace('.html','')]) configStandalone = pageConfigStandalone.pages[fileName.replace('.html','')];
if (configStandalone && (!Array.isArray(configStandalone.images) || !configStandalone.images.length) && pageConfigStandalone.caseStudies && pageConfigStandalone.caseStudies[fileName]) {
    console.log('Would fallback to caseStudies for standalone');
    configStandalone = pageConfigStandalone.caseStudies[fileName];
}
if (!configStandalone && pageConfigStandalone.caseStudies && pageConfigStandalone.caseStudies[fileName]) configStandalone = pageConfigStandalone.caseStudies[fileName];
console.log('standalone config images:', configStandalone && configStandalone.images);
if (configStandalone && Array.isArray(configStandalone.images) && configStandalone.images.length && content.includes('<div class="hero-visual">')){
    const imagesManifestStandalone = JSON.parse(readFileSync(join('data','images','seo','images.json'),'utf8'));
    const entriesStandalone = configStandalone.images.map(id=>imagesManifestStandalone.find(i=>i.id===id)).filter(Boolean);
    console.log('standalone entries found:', entriesStandalone.length, entriesStandalone.map(e=>e.id));
}

