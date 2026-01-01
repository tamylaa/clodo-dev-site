import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Exact replication of build script logic
console.log('=== Testing Build Script Logic ===');

// Read templates
const navTemplate = readFileSync(join('templates', 'nav-main.html'), 'utf8');
const footerTemplate = readFileSync(join('templates', 'footer.html'), 'utf8');
console.log('1. Templates loaded, nav has emoji:', navTemplate.includes('⚖️'), 'footer has emoji:', footerTemplate.includes('⚖️'));

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

const adjustedNav = adjustTemplatePaths(navTemplate, '../');
const adjustedFooter = adjustTemplatePaths(footerTemplate, '../');
console.log('2. After path adjustment, nav has emoji:', adjustedNav.includes('⚖️'), 'footer has emoji:', adjustedFooter.includes('⚖️'));

// Read source file
const sourceFile = readFileSync(join('public', 'blog', 'cloudflare-infrastructure-myth.html'), 'utf8');
console.log('3. Source file loaded, length:', sourceFile.length);

// Replace SSI includes (both nav and footer)
let result = sourceFile.replace(/<!--#include file="\.\.\/\.\.\/templates\/nav-main\.html" -->/, adjustedNav);
result = result.replace(/<!--#include file="\.\.\/\.\.\/templates\/footer\.html" -->/, adjustedFooter);
console.log('4. After SSI replacements, has emoji:', result.includes('⚖️'));

// Write result
writeFileSync('test-result.html', result, 'utf8');
console.log('5. File written');

// Read back
const readBack = readFileSync('test-result.html', 'utf8');
console.log('6. Read back, has emoji:', readBack.includes('⚖️'));

// Check for corruption
const corrupted = readBack.includes('⚖️');
console.log('7. Has corruption:', corrupted);