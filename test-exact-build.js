import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Simulate exactly what the build script does
const srcPath = join('public', 'blog', 'cloudflare-infrastructure-myth.html');
let content = readFileSync(srcPath, 'utf8');

// Read templates exactly as build script does
const navMainTemplate = readFileSync(join('templates', 'nav-main.html'), 'utf8');
const footerTemplate = readFileSync(join('templates', 'footer.html'), 'utf8');

// Adjust paths exactly as build script does
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

// Replace SSI includes exactly as build script does
content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/nav-main\.html" -->/g, adjustedNavMainTemplate);
content = content.replace(/<!--#include file="\.\.\/\.\.\/templates\/footer\.html" -->/g, adjustedFooterTemplate);

// Check emoji status at each step
console.log('Original nav template has scale emoji:', navMainTemplate.includes('⚖️'));
console.log('Adjusted nav template has scale emoji:', adjustedNavMainTemplate.includes('⚖️'));
console.log('Content after replacement has scale emoji:', content.includes('⚖️'));

// Write exactly as build script does
const destPath = join('test-exact-build.html');
writeFileSync(destPath, content, 'utf8');

// Read back
const writtenContent = readFileSync(destPath, 'utf8');
console.log('Written file has scale emoji:', writtenContent.includes('⚖️'));

// Check for corruption
const corruptedMatches = writtenContent.match(/⚖️/g);
console.log('Corrupted emojis found:', corruptedMatches ? corruptedMatches.length : 0);