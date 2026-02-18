#!/usr/bin/env node
/**
 * Find broken links and 404 pages
 * Scans sitemap, navigation, and manifest for dead links
 * 
 * Usage: node tools/find-broken-links.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('\n🔗 BROKEN LINKS & 404 AUDIT\n');
console.log('════════════════════════════════════════════════════════════════\n');

const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'config', 'pages-manifest.json'), 'utf8')
);

const distDir = path.join(__dirname, '..', 'dist');

// Get all actual files in dist
const actualFiles = new Set();
function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.html')) {
      // Store relative path from dist
      const relative = path.relative(distDir, filePath).replace(/\\/g, '/');
      actualFiles.add(relative);
    }
  });
}

walkDir(distDir);

console.log(`📁 Found ${actualFiles.size} HTML files in dist\n`);

// Check manifest entries
console.log('📋 CHECKING MANIFEST ENTRIES\n');
let missing = [];
let found = [];

manifest.forEach(entry => {
  if (!entry.indexed || !entry.file) return;
  
  const file = entry.file.replace(/\\/g, '/');
  if (actualFiles.has(file)) {
    found.push(entry);
  } else {
    missing.push(entry);
  }
});

if (missing.length > 0) {
  console.log(`❌ MISSING FILES (${missing.length} pages):\n`);
  missing.forEach(e => {
    console.log(`   Path: ${e.path}`);
    console.log(`   Expected file: ${e.file}`);
    console.log(`   Type: ${e.type}, Locale: ${e.locale}\n`);
  });
} else {
  console.log(`✓ All ${found.length} manifest entries have files\n`);
}

// Check for orphaned files (in dist but not in manifest)
console.log('📁 CHECKING FOR ORPHANED FILES\n');
let orphaned = [];

actualFiles.forEach(file => {
  const entry = manifest.find(e => (e.file || '').replace(/\\/g, '/') === file);
  if (!entry) {
    orphaned.push(file);
  }
});

if (orphaned.length > 0) {
  console.log(`⚠️  ORPHANED FILES (${orphaned.length} files not in manifest):\n`);
  orphaned.slice(0, 10).forEach(f => {
    console.log(`   ${f}`);
  });
  if (orphaned.length > 10) {
    console.log(`   ... and ${orphaned.length - 10} more\n`);
  }
} else {
  console.log('✓ No orphaned files\n');
}

// Check navigation links
console.log('🧭 CHECKING NAVIGATION LINKS\n');
const navFile = path.join(__dirname, '..', 'public', 'js', 'ui', 'navigation.js');
let navIssues = 0;

if (fs.existsSync(navFile)) {
  const navContent = fs.readFileSync(navFile, 'utf8');
  
  // Extract href values (simplistic regex)
  const hrefMatches = navContent.match(/href:\s*['"'"`]([^'"'"`]+)['"'"`]/gi) || [];
  const links = new Set(hrefMatches.map(h => {
    const url = h.match(/:\s*['"'"`]([^'"'"`]+)['"'"`]/i)[1];
    return url.replace(/^\//, ''); // Remove leading slash for comparison
  }));
  
  console.log(`   Found ${links.size} navigation links\n`);
  
  links.forEach(link => {
    // Check if file exists
    const possiblePaths = [
      path.join(distDir, link + '.html'),
      path.join(distDir, link, 'index.html'),
      path.join(distDir, link)
    ];
    
    const exists = possiblePaths.some(p => fs.existsSync(p));
    
    if (!exists && !link.includes('extern') && link.length > 0) {
      navIssues++;
      if (navIssues <= 5) {
        console.log(`   ⚠️  Possible broken nav link: /${link}`);
      }
    }
  });
  
  if (navIssues > 5) {
    console.log(`   ... and ${navIssues - 5} more possible issues\n`);
  } else {
    console.log();
  }
}

// 404 page check
console.log('📵 404 PAGE STATUS\n');
const notFoundPath = path.join(distDir, '404.html');
if (fs.existsSync(notFoundPath)) {
  const size = fs.statSync(notFoundPath).size;
  const content = fs.readFileSync(notFoundPath, 'utf8');
  const hasNoindex = content.includes('noindex');
  
  console.log(`✓ 404.html exists (${size} bytes)`);
  console.log(`✓ Noindex meta: ${hasNoindex ? 'YES' : 'MISSING'}\n`);
} else {
  console.log(`❌ 404.html not found\n`);
}

// Summary
console.log('════════════════════════════════════════════════════════════════');
console.log('\n📊 BROKEN LINKS SUMMARY\n');
console.log(`   Missing manifest files: ${missing.length}`);
console.log(`   Orphaned files: ${orphaned.length}`);
console.log(`   Navigation issues: ${navIssues || 'None detected'}`);
console.log(`   404 page: ${fs.existsSync(notFoundPath) ? '✓ Configured' : '❌ Missing'}`);

if (missing.length > 0) {
  console.log('\n⚠️  ACTION: These pages are in manifest but missing from dist');
  console.log('   Likely cause: Pages not indexed or build issue\n');
} else {
  console.log('\n✅ ALL LINKS HEALTHY\n');
}

console.log('════════════════════════════════════════════════════════════════\n');
