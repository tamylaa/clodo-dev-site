#!/usr/bin/env node

/**
 * Remove Inline Schemas from Source Files
 * 
 * Removes all <script type="application/ld+json"> blocks from public/ files
 * since they are now auto-generated during build process.
 * 
 * This is a cleanup script for source code maintenance.
 * The dist/ folder will have fresh, auto-generated schemas from the build.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

let filesProcessed = 0;
let schemasRemoved = 0;

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    // Remove all <script type="application/ld+json"> blocks
    // This regex captures the entire script tag including closing tag
    const schemaRegex = /<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/g;
    
    const matches = content.match(schemaRegex);
    const count = matches ? matches.length : 0;
    
    if (count > 0) {
      content = content.replace(schemaRegex, '');
      fs.writeFileSync(filePath, content, 'utf-8');
      
      filesProcessed++;
      schemasRemoved += count;
      
      console.log(`✓ ${path.relative(publicDir, filePath)}: ${count} schemas removed`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}: ${error.message}`);
  }
}

function walkDir(dir) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.html')) {
        processFile(filePath);
      }
    });
  } catch (error) {
    console.error(`Error reading directory ${dir}: ${error.message}`);
  }
}

console.log('🔍 Removing inline schemas from public/ folder...\n');
walkDir(publicDir);

console.log('\n📊 Summary:');
console.log(`   Files processed: ${filesProcessed}`);
console.log(`   Schemas removed: ${schemasRemoved}`);
console.log('\n✅ Cleanup complete. Source files now clean of inline schemas.');
console.log('   The dist/ folder will contain fresh, auto-generated schemas from build.\n');
