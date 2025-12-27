import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapping of garbled emoji sequences to proper Unicode emojis
const emojiFixes = {
    'ðŸ"‘': '📑',
    'ðŸ"¥': '🔥',
    'ðŸ"¬': '📬',
    'ðŸŽ¯': '🎯',
    'ðŸ”„': '🔄',
    'ðŸ—„ï¸': '🗄️',
    'ðŸ“¦': '📦',
    'ðŸ“¨': '📨',
    'ðŸ”‘': '🔑',
    'ðŸ”¤': '🔤',
    'â±ï¸': '±',
    'ðŸ§©': '🧩',
    'âŒ': '❌',
    'âœ…': '✅',
    'ðŸ“Š': '📊',
    'ðŸš€': '🚀',
    'ðŸ“‹': '📋',
    'ðŸ“š': '📚',
    'ðŸ’¬': '💬',
    'ðŸ“': '📝',
    'ðŸ”¥': '🔥',
    'ðŸ“¬': '📬',
    'ðŸ"š': '📚',
    'âš–ï¸': '⚖️',
    'ðŸ’¡': '💡',
    'â“': '📝',
    'ðŸ“ˆ': '📈',
    'ðŸ—ï¸': '🗄️',
    'ðŸ›¡ï¸': '🚛'
};

console.log('Starting emoji fix process...');

// Function to recursively find HTML files
function findHtmlFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && !fullPath.includes('node_modules')) {
            findHtmlFiles(fullPath, files);
        } else if (stat.isFile() && item.endsWith('.html')) {
            files.push(fullPath);
        }
    }
    return files;
}

// Get all HTML files
const htmlFiles = findHtmlFiles('./public');
let filesFixed = 0;
let replacementsMade = 0;

for (const filePath of htmlFiles) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fileChanged = false;

    // First, let's find all garbled sequences and print them
    const garbledPattern = /├░[^']+/g;
    const matches = content.match(garbledPattern);
    if (matches) {
        console.log(`File: ${filePath}`);
        console.log('Found garbled sequences:', matches.slice(0, 5)); // Show first 5
    }

    for (const [garbled, replacement] of Object.entries(emojiFixes)) {
        if (content.includes(garbled)) {
            content = content.replace(new RegExp(garbled.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
            fileChanged = true;
            replacementsMade++;
            console.log(`  Fixed: ${garbled} -> ${replacement}`);
        }
    }

    if (fileChanged) {
        fs.writeFileSync(filePath, content, 'utf8');
        filesFixed++;
        console.log(`Fixed file: ${filePath}`);
    }
}

console.log(`\nEmoji fix complete!`);
console.log(`Files fixed: ${filesFixed}`);
console.log(`Total replacements: ${replacementsMade}`);