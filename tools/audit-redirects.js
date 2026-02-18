#!/usr/bin/env node
/**
 * Audit redirect chains and loops
 * Detects potential redirect problems that cause indexability issues
 * 
 * Usage: node tools/audit-redirects.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('\n📍 REDIRECT CHAIN & LOOP AUDIT\n');
console.log('════════════════════════════════════════════════════════════════\n');

const redirectsFile = path.join(__dirname, '..', 'public', '_redirects');
const redirectsContent = fs.readFileSync(redirectsFile, 'utf8');

// Parse redirect rules
const rules = redirectsContent
  .split('\n')
  .filter(line => line.trim() && !line.startsWith('#'))
  .map(line => {
    const parts = line.trim().split(/\s+/);
    return {
      from: parts[0],
      to: parts[1],
      status: parts[2] || '301',
      raw: line
    };
  });

console.log(`📋 Parsed ${rules.length} redirect rules\n`);

// Check for potential chains
console.log('🔍 CHAIN DETECTION\n');
let potentialChains = 0;

for (let i = 0; i < rules.length; i++) {
  const rule = rules[i];
  
  // Check if any DESTINATION matches another SOURCE
  for (let j = 0; j < rules.length; j++) {
    if (i === j) continue;
    
    const otherRule = rules[j];
    
    // If rule's destination matches another rule's source
    if (rule.to && otherRule.from) {
      // Handle wildcard matching
      const toPattern = rule.to.replace(/\*|:\splat/g, '.*');
      const regex = new RegExp(`^${toPattern}$`);
      
      if (regex.test(otherRule.from) || rule.to === otherRule.from || rule.to.startsWith(otherRule.from)) {
        potentialChains++;
        console.log(`⚠️  Potential chain detected:`);
        console.log(`   Chain link 1: ${rule.raw}`);
        console.log(`   Chain link 2: ${otherRule.raw}\n`);
      }
    }
  }
}

if (potentialChains === 0) {
  console.log('✓ No redirect chains detected\n');
}

// Check for loops
console.log('🔁 LOOP DETECTION\n');
let loops = 0;

// Check obvious loops (A→B→A)
for (let i = 0; i < rules.length; i++) {
  for (let j = i + 1; j < rules.length; j++) {
    const rule1 = rules[i];
    const rule2 = rules[j];
    
    if (rule1.to === rule2.from && rule2.to === rule1.from) {
      loops++;
      console.log(`❌ LOOP DETECTED:`);
      console.log(`   ${rule1.raw}`);
      console.log(`   ${rule2.raw}\n`);
    }
  }
}

if (loops === 0) {
  console.log('✓ No redirect loops detected\n');
}

// Domain canonicalization check
console.log('🌐 DOMAIN CANONICALIZATION\n');
const domainRules = rules.filter(r => 
  r.from.includes('clodo.dev') || r.from.includes('*clodo') || r.to.includes('clodo.dev')
);

if (domainRules.length > 0) {
  console.log(`✓ Found ${domainRules.length} domain canonicalization rules:`);
  domainRules.slice(0, 5).forEach(r => {
    console.log(`   ${r.from} → ${r.to}`);
  });
  console.log();
} else {
  console.log('⚠️  No domain canonicalization rules found\n');
}

// Extension handling
console.log('📄 EXTENSION NORMALIZATION\n');
const extensionRules = rules.filter(r => r.from.includes('.html') || r.from.includes('.amp'));
console.log(`✓ Found ${extensionRules.length} extension normalization rules`);
console.log('   Examples:');
extensionRules.slice(0, 3).forEach(r => {
  console.log(`   ${r.from} → ${r.to}`);
});
console.log();

// Summary
console.log('════════════════════════════════════════════════════════════════');
console.log('\n📊 REDIRECT HEALTH SUMMARY\n');
console.log(`   Total rules: ${rules.length}`);
console.log(`   Chains detected: ${potentialChains}`);
console.log(`   Loops detected: ${loops}`);
console.log(`   Domain rules: ${domainRules.length}`);
console.log(`   Extension rules: ${extensionRules.length}`);

if (potentialChains > 0 || loops > 0) {
  console.log('\n⚠️  ACTION REQUIRED: Review chains/loops above\n');
} else {
  console.log('\n✅ REDIRECT CONFIGURATION HEALTHY\n');
}

console.log('════════════════════════════════════════════════════════════════\n');
