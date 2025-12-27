import { readFileSync } from 'fs';
import { join } from 'path';

// Test if reading templates corrupts emojis
const headerTemplate = readFileSync(join('templates', 'header.html'), 'utf8');
console.log('Header template contains scale emoji:', headerTemplate.includes('⚖️'));
console.log('Header template length:', headerTemplate.length);

// Test the adjustTemplatePaths function
function adjustTemplatePaths(template, prefix) {
    if (!prefix) return template;
    return template.replace(/href="([^"]*)"/g, (match, href) => {
        if (href.startsWith('http') || href.startsWith('//') || href.startsWith('#') || href.startsWith('mailto:')) {
            return match;
        }
        return `href="${prefix}${href}"`;
    });
}

const adjusted = adjustTemplatePaths(headerTemplate, '../');
console.log('Adjusted template contains scale emoji:', adjusted.includes('⚖️'));
console.log('Adjusted template length:', adjusted.length);

// Check if the emoji is still there
const emojiMatch = adjusted.match(/⚖️/);
console.log('Emoji match:', emojiMatch);