import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../public');

const themeScript = `    <!-- Critical Theme Script - Prevents FOUC -->
    <script>
    (function() {
        try {
            const t = localStorage.getItem('clodo-theme') || 
                      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
            document.documentElement.setAttribute('data-theme', t);
            document.documentElement.style.colorScheme = t;
        } catch (e) {}
    })();
    </script>
    `;

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

function injectThemeScript(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Check if theme script already exists
    if (content.includes('clodo-theme')) {
        return { modified: false, reason: 'Already has theme script' };
    }
    
    // Find <head> and inject after <head>
    const headMatch = content.match(/(<head[^>]*>)/i);
    if (!headMatch) {
        return { modified: false, reason: 'No <head> tag found' };
    }
    
    const headTag = headMatch[1];
    const injectedContent = content.replace(headTag, headTag + '\n' + themeScript);
    
    fs.writeFileSync(filePath, injectedContent);
    return { modified: true, reason: 'Theme script injected' };
}

// Process all HTML files
const htmlFiles = getHtmlFiles(publicDir);
console.log(`\n📝 Injecting theme script into ${htmlFiles.length} HTML files...\n`);

let modified = 0;
let skipped = 0;

for (const file of htmlFiles) {
    const result = injectThemeScript(file);
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
