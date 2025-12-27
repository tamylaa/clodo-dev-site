import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Simulate the build process for the blog post
const srcPath = join('public', 'blog', 'cloudflare-infrastructure-myth.html');
let content = readFileSync(srcPath, 'utf8');

console.log('Original content contains scale emoji:', content.includes('⚖️'));

// Read templates
const navMainTemplate = readFileSync(join('templates', 'nav-main.html'), 'utf8');
const footerTemplate = readFileSync(join('templates', 'footer.html'), 'utf8');

console.log('Nav template contains scale emoji:', navMainTemplate.includes('⚖️'));
console.log('Footer template contains scale emoji:', footerTemplate.includes('⚖️'));

// Adjust paths
function adjustTemplatePaths(template, prefix) {
    if (!prefix) return template;
    return template.replace(/href="([^"]*)"/g, (match, href) => {
        if (href.startsWith('http') || href.startsWith('//') || href.startsWith('#') || href.startsWith('mailto:')) {
            return match;
        }
        return `href="${prefix}${href}"`;
    });
}

const adjustedNavMainTemplate = adjustTemplatePaths(navMainTemplate, '../');
const adjustedFooterTemplate = adjustTemplatePaths(footerTemplate, '../');

console.log('Adjusted nav contains scale emoji:', adjustedNavMainTemplate.includes('⚖️'));
console.log('Adjusted footer contains scale emoji:', adjustedFooterTemplate.includes('⚖️'));

// Replace SSI includes
content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/nav-main\.html" -->/g, adjustedNavMainTemplate);
content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/footer\.html" -->/g, adjustedFooterTemplate);

console.log('Content after SSI replacement contains scale emoji:', content.includes('⚖️'));

// Write the file
const destPath = join('test-output.html');
writeFileSync(destPath, content, 'utf8');

console.log('File written. Reading back to check...');
const writtenContent = readFileSync(destPath, 'utf8');
console.log('Written content contains scale emoji:', writtenContent.includes('⚖️'));