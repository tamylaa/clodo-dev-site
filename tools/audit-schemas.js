#!/usr/bin/env node

/**
 * Schema Audit Tool - Check structured data on any site
 * 
 * Usage:
 *   npm run audit:schemas                              # Check production (www.clodo.dev)
 *   node tools/audit-schemas.js http://localhost:8001  # Check local
 *   node tools/audit-schemas.js https://example.com    # Check any site
 */

import https from 'https';
import http from 'http';

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(text, color = COLORS.reset) {
  console.log(`${color}${text}${COLORS.reset}`);
}

async function fetchAndAnalyze(url) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const protocol = isHttps ? https : http;

    log(`\nChecking ${url}...`, COLORS.cyan);

    const req = protocol.get(url, { timeout: 10000 }, (res) => {
      let data = '';

      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchAndAnalyze(res.headers.location).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
        let match;
        let schemas = [];

        while ((match = regex.exec(data)) !== null) {
          try {
            const jsonContent = match[1].trim();
            const parsed = JSON.parse(jsonContent);
            schemas.push({
              type: parsed['@type'],
              data: parsed,
            });
          } catch (e) {
            schemas.push({
              type: 'INVALID',
              error: e.message,
            });
          }
        }

        resolve({
          url,
          schemas,
          pageSize: data.length,
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout (10 seconds)'));
    });

    req.on('error', reject);
  });
}

function printReport(result) {
  const { url, schemas } = result;
  const validSchemas = schemas.filter((s) => s.type !== 'INVALID');
  const invalidSchemas = schemas.filter((s) => s.type === 'INVALID');

  log('\n' + '='.repeat(90), COLORS.cyan);
  log('  SCHEMA AUDIT REPORT', COLORS.bold);
  log('='.repeat(90), COLORS.cyan);
  log(`\nURL: ${url}\n`);

  // Summary
  log('SUMMARY', COLORS.bold);
  log('─'.repeat(90), COLORS.cyan);
  log(`Total Schemas: ${schemas.length}`);
  log(`Valid: ${validSchemas.length}`, validSchemas.length > 0 ? COLORS.green : COLORS.yellow);
  log(
    `Invalid: ${invalidSchemas.length}`,
    invalidSchemas.length === 0 ? COLORS.green : COLORS.red
  );

  // Score
  let scoreText = '❌ None';
  let scoreColor = COLORS.red;
  if (validSchemas.length >= 5) {
    scoreText = '✅ Excellent (5+)';
    scoreColor = COLORS.green;
  } else if (validSchemas.length >= 3) {
    scoreText = '✅ Good (3+)';
    scoreColor = COLORS.green;
  } else if (validSchemas.length >= 1) {
    scoreText = '⚠️  Basic (1+)';
    scoreColor = COLORS.yellow;
  }
  log(`SEO Score: ${scoreText}`, scoreColor);

  // Schema Details
  if (validSchemas.length > 0) {
    log('\nDETAILS', COLORS.bold);
    log('─'.repeat(90), COLORS.cyan);

    validSchemas.forEach((schema, i) => {
      log(`\n${i + 1}. ${schema.type}`, COLORS.bold);

      if (schema.data.name) log(`   Name: ${schema.data.name}`);
      if (schema.data.description)
        log(`   Description: ${schema.data.description.substring(0, 85)}...`);
      if (schema.data.url) log(`   URL: ${schema.data.url}`);

      const propCount = Object.keys(schema.data).length;
      log(`   Properties: ${propCount}`, COLORS.yellow);
    });
  }

  // Errors
  if (invalidSchemas.length > 0) {
    log('\nERRORS', COLORS.bold);
    log('─'.repeat(90), COLORS.red);
    invalidSchemas.forEach((schema, i) => {
      log(`\n${i + 1}. Invalid JSON: ${schema.error}`, COLORS.red);
    });
  }

  // Recommendations
  const types = validSchemas.map((s) => s.type);
  const missing = [];

  if (!types.includes('Organization')) missing.push('Organization');
  if (!types.includes('WebSite')) missing.push('WebSite');
  if (!types.includes('SoftwareApplication')) missing.push('SoftwareApplication');
  if (!types.includes('BreadcrumbList')) missing.push('BreadcrumbList');
  if (!types.includes('Article')) missing.push('Article/BlogPosting');
  if (!types.includes('FAQPage')) missing.push('FAQPage');

  if (missing.length > 0) {
    log('\nRECOMMENDATIONS', COLORS.bold);
    log('─'.repeat(90), COLORS.yellow);
    missing.forEach((type, i) => {
      log(`${i + 1}. Add ${type} schema`, COLORS.yellow);
    });
  } else if (validSchemas.length > 0) {
    log('\nRESULT', COLORS.bold);
    log('─'.repeat(90), COLORS.green);
    log('✅ Excellent schema coverage! All major schema types are implemented.', COLORS.green);
  }

  log('\n' + '='.repeat(90) + '\n', COLORS.cyan);
}

async function main() {
  const url = process.argv[2] || 'https://www.clodo.dev';

  try {
    const result = await fetchAndAnalyze(url);
    printReport(result);

    if (result.schemas.length === 0) {
      process.exit(1);
    }
  } catch (error) {
    log(`\n❌ Error: ${error.message}\n`, COLORS.red);
    process.exit(1);
  }
}

main();
