#!/usr/bin/env node
/**
 * Audit structured data (schema.org) across indexed pages
 * Checks for JSON-LD, microdata, and other schema markup
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'config', 'pages-manifest.json'), 'utf8')
);

console.log('\n📊 STRUCTURED DATA AUDIT\n');

// Get indexed pages only
const indexed = manifest.filter(e => e.indexed && e.file);

const audit = {
  total: indexed.length,
  withSchema: 0,
  byType: {},
  missingSchema: [],
  samples: {
    withSchema: [],
    withoutSchema: [],
  },
};

console.log(`Scanning ${indexed.length} indexed pages for schema.org markup...\n`);

for (const entry of indexed) {
  const filePath = path.join(__dirname, '..', 'dist', entry.file);
  
  if (!fs.existsSync(filePath)) continue;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for various schema types
    const hasSchema = content.includes('"@type"') || 
                     content.includes("'@type'") ||
                     content.includes('schema.org');
    
    const schemaTypes = [];
    const schemaMatches = content.match(/"@type"\s*:\s*"([^"]+)"/g) || [];
    schemaMatches.forEach(match => {
      const type = match.match(/"([^"]+)"$/)[1];
      if (type && !schemaTypes.includes(type)) {
        schemaTypes.push(type);
      }
    });
    
    if (hasSchema) {
      audit.withSchema++;
      
      schemaTypes.forEach(type => {
        audit.byType[type] = (audit.byType[type] || 0) + 1;
      });
      
      if (audit.samples.withSchema.length < 3) {
        audit.samples.withSchema.push({
          path: entry.path,
          types: schemaTypes,
          file: entry.file,
        });
      }
    } else {
      audit.missingSchema.push({
        path: entry.path,
        type: entry.type,
      });
      
      if (audit.samples.withoutSchema.length < 3) {
        audit.samples.withoutSchema.push({
          path: entry.path,
          file: entry.file,
        });
      }
    }
  } catch (e) {
    // ignore read errors
  }
}

// Report
console.log('═'.repeat(80));
console.log('📈 FINDINGS:');
console.log(`   Pages with schema: ${audit.withSchema}/${audit.total} (${((audit.withSchema/audit.total)*100).toFixed(1)}%)`);
console.log(`   Pages without schema: ${audit.missingSchema.length}/${audit.total} (${((audit.missingSchema.length/audit.total)*100).toFixed(1)}%)\n`);

if (Object.keys(audit.byType).length > 0) {
  console.log('📋 SCHEMA TYPES FOUND:');
  Object.entries(audit.byType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`   • ${type}: ${count} pages`);
    });
  console.log('');
}

console.log('═'.repeat(80));
console.log('📍 SAMPLE PAGES WITH SCHEMA:\n');
audit.samples.withSchema.forEach(p => {
  console.log(`   ${p.path}`);
  console.log(`   └─ Types: ${p.types.join(', ')}`);
});

console.log('\n📍 SAMPLE PAGES WITHOUT SCHEMA:\n');
audit.samples.withoutSchema.forEach(p => {
  console.log(`   ${p.path}`);
});

console.log('\n' + '═'.repeat(80));
console.log('❓ IMPACT ON RANKING:\n');

// Analysis
const coverage = ((audit.withSchema / audit.total) * 100).toFixed(1);

if (coverage >= 80) {
  console.log('✅ GOOD: Most pages have schema markup');
  console.log('   Impact: Rich snippets likely, good SEO signal');
} else if (coverage >= 50) {
  console.log('⚠️  PARTIAL: About half your pages have schema');
  console.log('   Impact: Some rich snippets, inconsistent SEO signals');
} else if (coverage > 0) {
  console.log('⚠️  LOW: Few pages have schema markup');
  console.log('   Impact: Limited rich snippets, missed SEO opportunities');
} else {
  console.log('❌ NONE: No schema.org markup detected');
  console.log('   Impact: No rich snippets, basic text results only');
}

console.log('\n💡 RANKING IMPACT BREAKDOWN:\n');
console.log('Direct Ranking Impact:');
console.log('  • Schema does NOT directly boost rankings');
console.log('  • Google ranks on content quality, relevance, links, UX');
console.log('  • Schema helps Google UNDERSTAND content better\n');

console.log('Indirect Ranking Benefits:');
console.log('  • Rich snippets = higher CTR (better visibility)');
console.log('  • Higher CTR = indirect ranking boost');
console.log('  • Featured snippets = top position visibility');
console.log('  • Knowledge graph = brand authority signals\n');

console.log('Must-Have Schema Types:');
console.log('  ✅ Article/BlogPosting (for blog posts)');
console.log('  ✅ Organization (homepage)');
console.log('  ✅ BreadcrumbList (navigation)');
console.log('  ✅ FAQPage (if you have FAQs)\n');

console.log('═'.repeat(80));
console.log('\n🎯 RECOMMENDATION:\n');

if (audit.withSchema === 0) {
  console.log('PRIORITY: HIGH');
  console.log('Your pages have NO structured data.');
  console.log('You\'re missing 10-30% CTR improvement opportunity.\n');
  console.log('Add basic schema to:');
  console.log('  1. Homepage (Organization schema)');
  console.log('  2. Blog posts (Article schema + BreadcrumbList)');
  console.log('  3. Main pages (BreadcrumbList at minimum)\n');
} else if (audit.withSchema < audit.total * 0.5) {
  console.log('PRIORITY: MEDIUM');
  console.log(`Only ${coverage}% of pages have schema.`);
  console.log('Add schema to high-value pages:\n');
  console.log('  1. Blog posts (biggest CTR impact)');
  console.log('  2. Landing pages');
  console.log('  3. Documentation\n');
} else if (audit.withSchema < audit.total * 0.9) {
  console.log('PRIORITY: LOW');
  console.log(`Good coverage at ${coverage}%.`);
  console.log('Fill in remaining gaps:\n');
  console.log(`  ${audit.missingSchema.length} pages still need schema\n`);
} else {
  console.log('PRIORITY: NONE - Well done on schema coverage!');
  console.log(`${coverage}% of pages have schema markup.\n`);
}

console.log('═'.repeat(80) + '\n');
