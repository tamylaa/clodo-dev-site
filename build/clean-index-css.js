import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const indexCssPath = path.join(__dirname, 'public', 'css', 'pages', 'index.css');
const content = fs.readFileSync(indexCssPath, 'utf8');
const lines = content.split('\n');

const output = [];

// Keep lines 1-21 (header + @imports + section comments)
for (let i = 0; i < 21 && i < lines.length; i++) {
    output.push(lines[i]);
}

// Add a blank line
output.push('');

// Skip lines 22-604 (duplicate CSS from old hero/benefits/features)
// Resume at line 605 (CLOUDFLARE EDGE SECTION - the real one)
for (let i = 604; i < lines.length; i++) {
    output.push(lines[i]);
}

// Write the cleaned content
const outputContent = output.join('\n');
fs.writeFileSync(indexCssPath, outputContent, 'utf8');

console.log('✅ Cleaned index.css - removed duplicate hero, benefits, and features sections');
console.log(`📊 Lines: ${lines.length} → ${output.length} (removed ${lines.length - output.length} lines)`);
