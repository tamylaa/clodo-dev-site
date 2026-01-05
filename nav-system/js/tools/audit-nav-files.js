#!/usr/bin/env node

/**
 * Navigation System File Audit
 * 
 * Scans entire codebase to locate all navigation-related files
 * Categorizes them by purpose and current location
 * Generates comprehensive inventory report
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// File patterns to search for
const patterns = {
  CSS: [
    /.*nav.*\.css$/i,
    /.*breadcrumb.*\.css$/i,
    /.*footer.*\.css$/i,
    /.*menu.*\.css$/i,
    /.*header.*\.css$/i,
  ],
  JS: [
    /.*nav.*\.js$/i,
    /.*navigation.*\.js$/i,
    /.*breadcrumb.*\.js$/i,
    /.*footer.*\.js$/i,
    /.*menu.*\.js$/i,
  ],
  HTML: [
    /.*nav.*\.html$/i,
    /.*breadcrumb.*\.html$/i,
    /.*footer.*\.html$/i,
    /.*menu.*\.html$/i,
  ],
  Config: [
    /navigation\.json$/i,
    /nav\.json$/i,
    /announcements\.json$/i,
  ],
  Schema: [
    /.*breadcrumb.*\.json$/i,
    /.*schema.*\.json$/i,
  ],
};

const inventory = {
  CSS: [],
  JS: [],
  HTML: [],
  Config: [],
  Schema: [],
  Other: [],
};

/**
 * Walk directory recursively
 */
async function walkDir(dir, callback) {
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, dist, .git, etc.
        if (!['node_modules', 'dist', '.git', '.vscode', 'build'].includes(file)) {
          await walkDir(fullPath, callback);
        }
      } else {
        await callback(fullPath, file);
      }
    }
  } catch (err) {
    // Silently skip inaccessible directories
  }
}

/**
 * Check if file matches any pattern
 */
function categorizeFile(filename) {
  for (const [category, patternList] of Object.entries(patterns)) {
    for (const pattern of patternList) {
      if (pattern.test(filename)) {
        return category;
      }
    }
  }
  return 'Other';
}

/**
 * Get file size in KB
 */
function getFileSize(filepath) {
  try {
    const stat = fs.statSync(filepath);
    return (stat.size / 1024).toFixed(2);
  } catch {
    return 'N/A';
  }
}

/**
 * Count lines in file
 */
function countLines(filepath) {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    return content.split('\n').length;
  } catch {
    return 0;
  }
}

/**
 * Get brief preview of file content
 */
function getFilePreview(filepath) {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const lines = content.split('\n');
    const preview = lines.slice(0, 3).join(' ').substring(0, 100);
    return preview.replace(/\s+/g, ' ');
  } catch {
    return 'N/A';
  }
}

/**
 * Main audit function
 */
async function auditNavigationFiles() {
  console.log('🔍 Scanning for navigation-related files...\n');

  await walkDir(rootDir, (fullPath, filename) => {
    const category = categorizeFile(filename);
    const relativePath = path.relative(rootDir, fullPath);
    const size = getFileSize(fullPath);
    const lines = countLines(fullPath);
    const preview = getFilePreview(fullPath);

    const fileInfo = {
      name: filename,
      path: relativePath,
      fullPath: fullPath,
      size: size,
      lines: lines,
      category: category,
      preview: preview,
    };

    if (category === 'Other') {
      inventory.Other.push(fileInfo);
    } else {
      inventory[category].push(fileInfo);
    }
  });

  // Sort each category
  for (const category of Object.keys(inventory)) {
    inventory[category].sort((a, b) => a.path.localeCompare(b.path));
  }

  return inventory;
}

/**
 * Generate report
 */
function generateReport(inventory) {
  let report = `# Navigation System File Audit Report

**Generated:** ${new Date().toISOString()}

---

## Executive Summary

This audit scans the entire codebase to locate and categorize all navigation-related files by their purpose and current location.

### Statistics

| Category | Count | Total Size (KB) | Total Lines |
|----------|-------|-----------------|-------------|
`;

  let totalFiles = 0;
  let totalSize = 0;
  let totalLines = 0;

  for (const [category, files] of Object.entries(inventory)) {
    if (files.length === 0) continue;
    
    const categorySize = files.reduce((sum, f) => {
      const s = parseFloat(f.size);
      return sum + (isNaN(s) ? 0 : s);
    }, 0);
    
    const categoryLines = files.reduce((sum, f) => sum + f.lines, 0);
    
    report += `| ${category} | ${files.length} | ${categorySize.toFixed(2)} | ${categoryLines} |\n`;
    
    totalFiles += files.length;
    totalSize += categorySize;
    totalLines += categoryLines;
  }

  report += `| **TOTAL** | **${totalFiles}** | **${totalSize.toFixed(2)}** | **${totalLines}** |\n`;

  report += `

---

## Detailed File Inventory

`;

  // CSS Files
  if (inventory.CSS.length > 0) {
    report += `### CSS Files (Styling)

**Count:** ${inventory.CSS.length} files

\`\`\`
${inventory.CSS.map(f => `${f.path}
  └─ Size: ${f.size} KB | Lines: ${f.lines}
     Preview: ${f.preview}`).join('\n\n')}
\`\`\`

`;
  }

  // JS Files
  if (inventory.JS.length > 0) {
    report += `### JavaScript Files (Scripting)

**Count:** ${inventory.JS.length} files

\`\`\`
${inventory.JS.map(f => `${f.path}
  └─ Size: ${f.size} KB | Lines: ${f.lines}
     Preview: ${f.preview}`).join('\n\n')}
\`\`\`

`;
  }

  // HTML Files
  if (inventory.HTML.length > 0) {
    report += `### HTML Files (Templates/Rendering)

**Count:** ${inventory.HTML.length} files

\`\`\`
${inventory.HTML.map(f => `${f.path}
  └─ Size: ${f.size} KB | Lines: ${f.lines}
     Preview: ${f.preview}`).join('\n\n')}
\`\`\`

`;
  }

  // Config Files
  if (inventory.Config.length > 0) {
    report += `### Configuration Files (Organization)

**Count:** ${inventory.Config.length} files

\`\`\`
${inventory.Config.map(f => `${f.path}
  └─ Size: ${f.size} KB | Lines: ${f.lines}
     Preview: ${f.preview}`).join('\n\n')}
\`\`\`

`;
  }

  // Schema Files
  if (inventory.Schema.length > 0) {
    report += `### Schema Files (Structured Data)

**Count:** ${inventory.Schema.length} files

\`\`\`
${inventory.Schema.map(f => `${f.path}
  └─ Size: ${f.size} KB | Lines: ${f.lines}
     Preview: ${f.preview}`).join('\n\n')}
\`\`\`

`;
  }

  // Other Files
  if (inventory.Other.length > 0) {
    report += `### Other Navigation-Related Files

**Count:** ${inventory.Other.length} files

\`\`\`
${inventory.Other.map(f => `${f.path}
  └─ Size: ${f.size} KB | Lines: ${f.lines}`).join('\n\n')}
\`\`\`

`;
  }

  report += `
---

## File Organization by Current Location

`;

  // Group by directory
  const byDirectory = {};
  for (const files of Object.values(inventory)) {
    for (const file of files) {
      const dir = path.dirname(file.path);
      if (!byDirectory[dir]) {
        byDirectory[dir] = [];
      }
      byDirectory[dir].push(file);
    }
  }

  const sortedDirs = Object.keys(byDirectory).sort();
  for (const dir of sortedDirs) {
    const dirFiles = byDirectory[dir];
    report += `
### ${dir}
\`\`\`
${dirFiles.map(f => `${f.name}`).join('\n')}
\`\`\`

`;
  }

  report += `
---

## Categorization by Purpose

### Styling (CSS)
Files responsible for navigation visual appearance and layout.

\`\`\`
${inventory.CSS.length > 0 ? inventory.CSS.map(f => f.path).join('\n') : 'None found'}
\`\`\`

### Scripting (JavaScript)
Files containing navigation logic, interactions, and behavior.

\`\`\`
${inventory.JS.length > 0 ? inventory.JS.map(f => f.path).join('\n') : 'None found'}
\`\`\`

### Rendering (HTML Templates)
Files that define navigation structure and markup.

\`\`\`
${inventory.HTML.length > 0 ? inventory.HTML.map(f => f.path).join('\n') : 'None found'}
\`\`\`

### Organization (Config Files)
Files that store navigation data and configuration.

\`\`\`
${inventory.Config.length > 0 ? inventory.Config.map(f => f.path).join('\n') : 'None found'}
\`\`\`

### Schemas (Structured Data)
Files containing semantic data and structured markup.

\`\`\`
${inventory.Schema.length > 0 ? inventory.Schema.map(f => f.path).join('\n') : 'None found'}
\`\`\`

---

## Summary Statistics

- **Total Navigation Files:** ${totalFiles}
- **Total Size:** ${totalSize.toFixed(2)} KB
- **Total Lines of Code:** ${totalLines}
- **Average File Size:** ${(totalSize / totalFiles).toFixed(2)} KB
- **Average Lines per File:** ${Math.round(totalLines / totalFiles)}

---

## Next Steps

1. Review this audit to understand current file organization
2. Use these lists to plan reorganization into nav-system/ structure
3. Refer to file paths when moving/copying files
4. Create mapping document for old-to-new locations

---

*Generated by Navigation System File Audit*
*${new Date().toISOString()}*
`;

  return report;
}

/**
 * Save JSON inventory
 */
function saveInventory(inventory) {
  const inventoryPath = path.join(rootDir, 'nav-system-audit.json');
  fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2), 'utf8');
  console.log(`✅ Inventory JSON: ${inventoryPath}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🚀 Navigation System File Audit\n');
  console.log('=' .repeat(60) + '\n');

  try {
    const inventory = await auditNavigationFiles();
    const report = generateReport(inventory);

    // Save report
    const reportPath = path.join(rootDir, 'reports', 'NAV_FILES_AUDIT.md');
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    fs.writeFileSync(reportPath, report, 'utf8');
    console.log(`✅ Audit Report: ${reportPath}`);

    // Save JSON
    saveInventory(inventory);

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Audit Summary:\n');
    console.log(`   CSS Files:      ${inventory.CSS.length}`);
    console.log(`   JS Files:       ${inventory.JS.length}`);
    console.log(`   HTML Files:     ${inventory.HTML.length}`);
    console.log(`   Config Files:   ${inventory.Config.length}`);
    console.log(`   Schema Files:   ${inventory.Schema.length}`);
    console.log(`   Other Files:    ${inventory.Other.length}`);

    const totalSize = Object.values(inventory).flat().reduce((sum, f) => {
      const s = parseFloat(f.size);
      return sum + (isNaN(s) ? 0 : s);
    }, 0);
    const totalLines = Object.values(inventory).flat().reduce((sum, f) => sum + f.lines, 0);

    console.log(`\n   Total Files:    ${Object.values(inventory).flat().length}`);
    console.log(`   Total Size:     ${totalSize.toFixed(2)} KB`);
    console.log(`   Total Lines:    ${totalLines}`);

    console.log('\n✨ Audit complete!\n');

  } catch (error) {
    console.error('❌ Error during audit:', error);
    process.exit(1);
  }
}

main();
