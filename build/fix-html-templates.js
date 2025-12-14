#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const themeScript = `    <!-- Critical Theme Script - Prevents FOUC (Flash of Unstyled Content) -->
<!-- ⚠️ MUST be inline in <head> before CSS loads (performance blocker prevention) -->
<!-- Uses localStorage key 'clodo-theme' (matches ThemeManager THEME_KEY) -->
<script>
(function() {
    try {
        // Get stored theme (matches ThemeManager's THEME_KEY)
        const t = localStorage.getItem('clodo-theme') || 
                  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        // Apply BEFORE CSS renders to prevent FOUC
        document.documentElement.setAttribute('data-theme', t);
        document.documentElement.style.colorScheme = t;
    } catch (e) { 
        // Fail silently - CSS defaults to light theme
    }
})();
</script>
`;

const deferredScripts = `
    <!-- Defer JavaScript - load after LCP for better performance -->
    <script src="js/init-systems.js" defer="" nonce="N0Nc3Cl0d0"></script>
    <script src="js/config/features.js" nonce="N0Nc3Cl0d0"></script>
    <script type="module" src="js/main.js" nonce="N0Nc3Cl0d0"></script>
    
    <!-- Lazy load below-the-fold CSS to improve LCP -->
    <script src="js/defer-css.js" defer="" nonce="N0Nc3Cl0d0"></script>
    
    <!-- Navigation component for mobile menu -->
    <script type="module" src="js/ui/navigation-component.js" nonce="N0Nc3Cl0d0"></script>
    
    <!-- Professional analytics: Loads after LCP with zero impact on Core Web Vitals -->
    <!-- This replaces Cloudflare auto-injection with optimized manual control -->
    <script src="js/analytics.js" defer="" nonce="N0Nc3Cl0d0"></script>
`;

function walkDir(dir) {
    const files = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            files.push(...walkDir(fullPath));
        } else if (item.name.endsWith('.html')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

function fixHtmlFiles() {
    try {
        // Get all HTML files
        const files = walkDir('public');
        
        let fixedCount = 0;
        let skipped = 0;

        for (const file of files) {
            let content = fs.readFileSync(file, 'utf8');
            let modified = false;

            // Skip if already has theme script
            if (content.includes('prefers-color-scheme: dark')) {
                console.log(`✓ Skipping ${file} (already has theme script)`);
                skipped++;
                continue;
            }

            // 1. Add theme script before </head>
            if (!content.includes('Critical Theme Script')) {
                content = content.replace('</head>', `${themeScript}</head>`);
                modified = true;
            }

            // 2. Remove indentation from SSI includes
            content = content.replace(/\s+<!--#include file=/g, '<!--#include file=');
            
            // 3. Replace old script.js with deferred scripts
            if (content.includes('<script src="script.js"')) {
                content = content.replace(/<script src="script\.js" nonce="N0Nc3Cl0d0"><\/script>/g, deferredScripts);
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(file, content, 'utf8');
                console.log(`✅ Fixed ${file}`);
                fixedCount++;
            } else {
                console.log(`~ No changes needed for ${file}`);
            }
        }

        console.log(`\n📊 Summary:`);
        console.log(`✅ Fixed: ${fixedCount} files`);
        console.log(`⏭️  Skipped: ${skipped} files (already have theme script)`);
        console.log(`📁 Total: ${files.length} files processed`);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixHtmlFiles();
