#!/usr/bin/env node
/**
 * Heading Hierarchy Validator & Fixer
 * Validates H1→H2→H3→H4 structure, detects orphaned headings
 * 
 * Usage: node scripts/seo/heading-validator.mjs --dir public --fix --strict
 */

import fs from 'fs';
import path from 'path';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { flags: {} };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.replace(/^--/, '');
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
      result.flags[key] = value;
    }
  }
  return result.flags;
}

function analyzeHeadings(html) {
  const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi;
  const headings = [];
  let match;
  
  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1]);
    const text = match[2].replace(/<[^>]+>/g, '').trim();
    
    headings.push({
      level,
      text,
      position: match.index,
      html: match[0]
    });
  }
  
  return headings;
}

function validateHeadingStructure(headings) {
  const issues = [];
  let previousLevel = 0;
  
  headings.forEach((heading, index) => {
    const { level, text } = heading;
    
    // Check for multiple H1s
    if (level === 1 && index > 0) {
      issues.push({
        severity: 'ERROR',
        heading: index + 1,
        text,
        issue: 'Multiple H1 tags detected',
        suggestion: 'Should only have one H1 per page (typically page title)'
      });
    }
    
    // Check for skipped levels
    if (previousLevel > 0 && level > previousLevel + 1) {
      issues.push({
        severity: 'WARNING',
        heading: index + 1,
        text,
        issue: `Skipped heading level: H${previousLevel} → H${level}`,
        suggestion: `Use H${previousLevel + 1} instead`
      });
    }
    
    // Check for orphaned H4+
    if (level >= 4 && !headings.slice(0, index).some(h => h.level === level - 1)) {
      issues.push({
        severity: 'WARNING',
        heading: index + 1,
        text,
        issue: `H${level} without parent H${level - 1}`,
        suggestion: `Ensure proper heading hierarchy before H${level}`
      });
    }
    
    previousLevel = level;
  });
  
  return {
    headings,
    issues,
    isValid: issues.filter(i => i.severity === 'ERROR').length === 0
  };
}

function fixHeadingStructure(html) {
  const validation = analyzeHeadingStructure(analyzeHeadings(html));
  
  if (validation.isValid) {
    return html;
  }
  
  let fixed = html;
  const fixes = [];
  
  // Fix multiple H1s - convert extras to H2
  const h1Count = (html.match(/<h1/gi) || []).length;
  if (h1Count > 1) {
    let firstH1Found = false;
    fixed = fixed.replace(/<h1([^>]*)>/gi, (match) => {
      if (!firstH1Found) {
        firstH1Found = true;
        return match;
      }
      fixes.push('Converted extra H1 to H2');
      return '<h2$1>';
    });
    
    fixed = fixed.replace(/<\/h1>/gi, (match) => {
      if (h1Count > 1 && fixed.match(/<h2([^>]*>[^<]*)<\/h1>/)) {
        h1Count--;
        return '</h2>';
      }
      return match;
    });
  }
  
  return { fixed, fixes, modified: fixed !== html };
}

function generateHeadingMap(headings) {
  const map = [];
  headings.forEach((heading, index) => {
    map.push({
      index: index + 1,
      level: heading.level,
      text: heading.text.substring(0, 50) + (heading.text.length > 50 ? '...' : ''),
      valid: index === 0 && heading.level === 1
    });
  });
  return map;
}

async function processFile(filePath, fix = false, strict = false) {
  try {
    const html = await readFile(filePath, 'utf8');
    const validation = analyzeHeadingStructure(analyzeHeadings(html));
    
    let modified = false;
    let newHtml = html;
    let fixDetails = { count: 0, issues: [] };
    
    if (fix && !validation.isValid) {
      const { fixed, fixes, modified: wasModified } = fixHeadingStructure(html);
      newHtml = fixed;
      modified = wasModified;
      fixDetails = { count: fixes.length, issues: fixes };
      
      if (modified) {
        await writeFile(filePath, newHtml, 'utf8');
      }
    }
    
    const errorCount = validation.issues.filter(i => i.severity === 'ERROR').length;
    const warningCount = validation.issues.filter(i => i.severity === 'WARNING').length;
    
    return {
      file: filePath,
      headingCount: validation.headings.length,
      errors: errorCount,
      warnings: warningCount,
      headingMap: generateHeadingMap(validation.headings),
      issues: validation.issues,
      modified,
      fixDetails,
      status: validation.isValid ? 'valid' : 'invalid'
    };
  } catch (e) {
    return {
      file: filePath,
      error: e.message,
      status: 'error'
    };
  }
}

async function main() {
  const flags = parseArgs();
  const dir = flags.dir || 'public';
  const fix = flags.fix === true;
  const strict = flags.strict === true;
  const output = flags.output || 'reports/heading-audit.json';
  
  console.log(`🎯 Heading Hierarchy Validator`);
  console.log(`📁 Scanning: ${dir}`);
  if (fix) console.log(`🔧 Fix mode: ENABLED`);
  if (strict) console.log(`⚠️  Strict mode: ENABLED`);
  
  const results = [];
  
  function walkDir(currentPath) {
    const files = fs.readdirSync(currentPath);
    files.forEach(file => {
      const fullPath = path.join(currentPath, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'i18n') {
        walkDir(fullPath);
      } else if (file.endsWith('.html')) {
        const result = processFile(fullPath, fix, strict);
        results.push(result);
      }
    });
  }
  
  walkDir(dir);
  
  // Summarize
  const summary = {
    total: results.filter(r => r.status !== 'error').length,
    valid: results.filter(r => r.status === 'valid').length,
    invalid: results.filter(r => r.status === 'invalid').length,
    errors: results.filter(r => r.status === 'invalid').reduce((sum, r) => sum + r.errors, 0),
    warnings: results.filter(r => r.status === 'invalid').reduce((sum, r) => sum + r.warnings, 0),
    fixed: results.filter(r => r.modified).length,
    results: results.filter(r => r.status !== 'error' || r.status === 'error')
  };
  
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(summary, null, 2));
  
  console.log(`\n✅ Heading Validation Complete`);
  console.log(`   Total files: ${summary.total}`);
  console.log(`   Valid: ${summary.valid}`);
  console.log(`   Invalid: ${summary.invalid}`);
  console.log(`   Errors: ${summary.errors}`);
  console.log(`   Warnings: ${summary.warnings}`);
  if (fix) console.log(`   Fixed: ${summary.fixed}`);
  
  // Show issues by type
  const allIssues = results.flatMap(r => r.issues || []);
  const issueTypes = {};
  allIssues.forEach(issue => {
    issueTypes[issue.issue] = (issueTypes[issue.issue] || 0) + 1;
  });
  
  if (Object.keys(issueTypes).length > 0) {
    console.log(`\n⚠️  Common Issues:`);
    Object.entries(issueTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([issue, count]) => {
        console.log(`   ${count} pages: ${issue}`);
      });
  }
  
  console.log(`\n📊 Report saved: ${output}`);
}

main().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
