#!/usr/bin/env node

/**
 * Validates the _redirects file for Cloudflare Pages deployment
 * Ensures critical routing rules are present to prevent deployment issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const redirectsPath = path.join(__dirname, '..', '..', 'public', '_redirects');

function validateRedirects() {
  console.log('🔍 Validating _redirects file...');

  // Check if file exists
  if (!fs.existsSync(redirectsPath)) {
    console.error('❌ _redirects file not found at:', redirectsPath);
    process.exit(1);
  }

  // Read file content
  const content = fs.readFileSync(redirectsPath, 'utf8');
  const lines = content.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));

  // Required rules that must be present
  const requiredRules = [
    {
      pattern: '/*',
      target: '/index.html',
      status: '200',
      description: 'SPA fallback for client-side routing'
    }
  ];

  const missingRules = [];

  for (const rule of requiredRules) {
    const ruleExists = lines.some(line => {
      const parts = line.split(/\s+/);
      return parts.length >= 3 &&
             parts[0] === rule.pattern &&
             parts[1] === rule.target &&
             parts[2] === rule.status;
    });

    if (!ruleExists) {
      missingRules.push(rule);
    }
  }

  if (missingRules.length > 0) {
    console.error('❌ Missing critical redirect rules:');
    missingRules.forEach(rule => {
      console.error(`   - ${rule.pattern} ${rule.target} ${rule.status} (${rule.description})`);
    });
    console.error('\n💡 This will cause canonical URL routing issues in production!');
    console.error('   All pages will serve the homepage content instead of their actual content.');
    process.exit(1);
  }

  console.log('✅ _redirects file validation passed');
  console.log(`   Found ${lines.length} redirect rules`);
  console.log('   SPA fallback rule is present');

  return true;
}

// Run validation
try {
  validateRedirects();
} catch (error) {
  console.error('❌ Error validating _redirects file:', error.message);
  process.exit(1);
}