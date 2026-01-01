import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Exact replication of ALL build script operations for blog files
console.log('=== Full Build Script Simulation ===');

// Read all templates
const templates = {};
const templateFiles = [
    'nav-main.html', 'footer.html', 'header.html', 'hero.html',
    'table-of-contents.html', 'table-of-contents-faq.html',
    'related-content.html', 'related-content-faq.html',
    'related-content-comparison.html', 'related-content-workers.html'
];

for (const tmpl of templateFiles) {
    try {
        templates[tmpl] = readFileSync(join('templates', tmpl), 'utf8');
        console.log(`${tmpl}: loaded, has emoji: ${templates[tmpl].includes('⚖️')}`);
    } catch (e) {
        console.log(`${tmpl}: not found`);
    }
}

// Adjust paths function
function adjustTemplatePaths(template, prefix) {
    if (!prefix) return template;
    return template.replace(/href="([^"]*)"/g, (match, href) => {
        if (href.startsWith('http') || href.startsWith('//') || href.startsWith('#') || href.startsWith('mailto:')) {
            return match;
        }
        return `href="${prefix}${href}"`;
    });
}

// Adjust all templates
const adjustedTemplates = {};
for (const [name, content] of Object.entries(templates)) {
    adjustedTemplates[name] = adjustTemplatePaths(content, '../');
    console.log(`${name}: adjusted, has emoji: ${adjustedTemplates[name].includes('⚖️')}`);
}

// Read source file
const sourceFile = readFileSync(join('public', 'blog', 'cloudflare-infrastructure-myth.html'), 'utf8');
let content = sourceFile;
console.log('Source file loaded, length:', content.length);

// Apply ALL the SSI replacements from build script
content = content.replace(/<!--#include file="\.\.\/templates\/nav-main\.html" -->/g, adjustedTemplates['nav-main.html'] || '');
content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/nav-main\.html" -->/g, adjustedTemplates['nav-main.html'] || '');
content = content.replace(/<!--#include file="\.\.\/templates\/footer\.html" -->/g, adjustedTemplates['footer.html'] || '');
content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/footer\.html" -->/g, adjustedTemplates['footer.html'] || '');
content = content.replace(/<!--#include file="\.\.\/templates\/header\.html" -->/g, adjustedTemplates['header.html'] || '');
content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/header\.html" -->/g, adjustedTemplates['header.html'] || '');
content = content.replace(/<!--#include file="\.\.\/templates\/hero\.html" -->/g, adjustedTemplates['hero.html'] || '');
content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/hero\.html" -->/g, adjustedTemplates['hero.html'] || '');
content = content.replace(/<!--#include file="\.\.\/templates\/table-of-contents\.html" -->/g, adjustedTemplates['table-of-contents.html'] || '');
content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/table-of-contents\.html" -->/g, adjustedTemplates['table-of-contents.html'] || '');
content = content.replace(/<!--#include file="\.\.\/templates\/table-of-contents-faq\.html" -->/g, adjustedTemplates['table-of-contents-faq.html'] || '');
content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/table-of-contents-faq\.html" -->/g, adjustedTemplates['table-of-contents-faq.html'] || '');
content = content.replace(/<!--#include file="\.\.\/templates\/related-content\.html" -->/g, adjustedTemplates['related-content.html'] || '');
content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/related-content\.html" -->/g, adjustedTemplates['related-content.html'] || '');
content = content.replace(/<!--#include file="\.\.\/templates\/related-content-faq\.html" -->/g, adjustedTemplates['related-content-faq.html'] || '');
content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/related-content-faq\.html" -->/g, adjustedTemplates['related-content-faq.html'] || '');
content = content.replace(/<!--#include file="\.\.\/templates\/related-content-comparison\.html" -->/g, adjustedTemplates['related-content-comparison.html'] || '');
content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/related-content-comparison\.html" -->/g, adjustedTemplates['related-content-comparison.html'] || '');
content = content.replace(/<!--#include file="\.\.\/templates\/related-content-workers\.html" -->/g, adjustedTemplates['related-content-workers.html'] || '');

console.log('After all SSI replacements, has emoji:', content.includes('⚖️'));

// Write result
writeFileSync('test-full-result.html', content, 'utf8');
console.log('File written');

// Read back
const readBack = readFileSync('test-full-result.html', 'utf8');
console.log('Read back, has emoji:', readBack.includes('⚖️'));

// Check for corruption
const corrupted = readBack.includes('⚖️');
console.log('Has corruption:', corrupted);