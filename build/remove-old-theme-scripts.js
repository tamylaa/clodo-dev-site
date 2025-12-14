import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getHtmlFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile() && entry.name.endsWith('.html')) {
            files.push(fullPath);
        } else if (entry.isDirectory() && !entry.name.startsWith('.')) {
            files.push(...getHtmlFiles(fullPath));
        }
    }
    return files;
}

function removeOldThemeScript(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Check if file has the old theme script (with system preference check)
    if (!content.includes("window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'")) {
        return { modified: false, reason: 'No old theme script found' };
    }

    // Find and remove the theme script block
    const lines = content.split('\n');
    const newLines = [];
    let inThemeScript = false;
    let themeScriptStart = -1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check for start of theme script
        if (line.includes('<!-- Critical Theme Script') && line.includes('FOUC')) {
            inThemeScript = true;
            themeScriptStart = i;
            continue;
        }

        // Check for end of theme script
        if (inThemeScript && line.includes('</script>') && i > themeScriptStart) {
            // Skip this line and the next few lines until we find a non-empty line or next HTML tag
            let skipCount = 1;
            while (i + skipCount < lines.length && (lines[i + skipCount].trim() === '' || lines[i + skipCount].includes('<!--'))) {
                skipCount++;
            }
            i += skipCount - 1; // -1 because the loop will increment i
            inThemeScript = false;
            continue;
        }

        if (!inThemeScript) {
            newLines.push(line);
        }
    }

    const newContent = newLines.join('\n');
    if (newContent === content) {
        return { modified: false, reason: 'Could not remove theme script' };
    }

    fs.writeFileSync(filePath, newContent);
    return { modified: true, reason: 'Old theme script removed' };
}

// Process all HTML files
const publicDir = path.join(__dirname, '../public');
const htmlFiles = getHtmlFiles(publicDir);
console.log(`\n🧹 Removing old theme scripts from ${htmlFiles.length} HTML files...\n`);

let modified = 0;
let skipped = 0;

for (const file of htmlFiles) {
    const result = removeOldThemeScript(file);
    const relative = path.relative(publicDir, file);

    if (result.modified) {
        console.log(`✅ ${relative}`);
        modified++;
    } else {
        console.log(`⏭️  ${relative} - ${result.reason}`);
        skipped++;
    }
}

console.log(`\n📊 Summary: ${modified} modified, ${skipped} skipped`);
