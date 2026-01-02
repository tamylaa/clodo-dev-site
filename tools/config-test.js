#!/usr/bin/env node

/**
 * Configuration System Test Suite
 *
 * Comprehensive testing for the unified configuration system.
 * Run with: npm run test:config
 *
 * This script validates:
 * - Config loading and structure
 * - Environment detection
 * - Helper functions
 * - Feature flags
 * - Backward compatibility
 */

import { config, buildConfig, getBaseUrl, getFullUrl, isFeatureEnabled, features, getConfig, getBuildConfig } from '../config/index.js';
import { GLOBAL_CONFIG, ANALYZER_CONFIG } from '../build/global-config.js';

console.log('🧪 Unified Configuration System Test Suite\n');

// Test counters
let testsPassed = 0;
let testsFailed = 0;

function test(name, condition, expected, actual) {
  if (condition) {
    console.log(`✅ ${name}`);
    testsPassed++;
  } else {
    console.log(`❌ ${name}`);
    console.log(`   Expected: ${expected}`);
    console.log(`   Actual: ${actual}`);
    testsFailed++;
  }
}

function section(title) {
  console.log(`\n📋 ${title}`);
  console.log('─'.repeat(50));
}

// ==========================================
// 📋 RUNTIME CONFIG TESTS
// ==========================================

section('Runtime Configuration');

test(
  'Site name is configured',
  config.site.name && typeof config.site.name === 'string',
  'string',
  config.site.name
);

test(
  'Site URL is configured',
  config.site.url && config.site.url.startsWith('https://'),
  'https:// URL',
  config.site.url
);

test(
  'Environment is detected',
  ['development', 'staging', 'production'].includes(config.environment.current),
  'development|staging|production',
  config.environment.current
);

test(
  'Theme colors are loaded',
  config.theme.colors && config.theme.colors.brand,
  'theme colors object',
  typeof config.theme.colors
);

test(
  'Navigation is configured',
  config.navigation.header && config.navigation.header.mainNav,
  'navigation object',
  config.navigation.header
);

test(
  'Social links are configured',
  config.social && Object.keys(config.social).length > 0,
  'social links object',
  Object.keys(config.social || {}).length
);

// ==========================================
// 🔧 BUILD CONFIG TESTS
// ==========================================

section('Build Configuration');

test(
  'Cloudflare project is configured',
  buildConfig.tooling.cloudflare.projectName,
  'project name',
  buildConfig.tooling.cloudflare.projectName
);

test(
  'Testing configuration exists',
  buildConfig.tooling.testing && buildConfig.tooling.testing.baseUrl,
  'testing config',
  buildConfig.tooling.testing
);

// ==========================================
// 🛠️ HELPER FUNCTIONS TESTS
// ==========================================

section('Helper Functions');

const baseUrl = getBaseUrl();
test(
  'getBaseUrl() returns valid URL',
  baseUrl && (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')),
  'http(s):// URL',
  baseUrl
);

const fullUrl = getFullUrl('/test');
test(
  'getFullUrl() constructs full URL',
  fullUrl && fullUrl.includes('/test'),
  'URL with /test path',
  fullUrl
);

test(
  'isFeatureEnabled() works for known feature',
  typeof isFeatureEnabled('ES6_MODULES') === 'boolean',
  'boolean',
  typeof isFeatureEnabled('ES6_MODULES')
);

test(
  'getConfig() retrieves nested values',
  getConfig('site.name') === config.site.name,
  config.site.name,
  getConfig('site.name')
);

test(
  'getBuildConfig() retrieves nested values',
  getBuildConfig('tooling.cloudflare.projectName') === buildConfig.tooling.cloudflare.projectName,
  buildConfig.tooling.cloudflare.projectName,
  getBuildConfig('tooling.cloudflare.projectName')
);

// ==========================================
// 🚩 FEATURE FLAGS TESTS
// ==========================================

section('Feature Flags');

test(
  'Feature flags are loaded',
  features.FEATURES && typeof features.FEATURES === 'object',
  'features object',
  typeof features.FEATURES
);

test(
  'getEnabledFeatures() returns array',
  Array.isArray(features.getEnabledFeatures()),
  'array',
  typeof features.getEnabledFeatures()
);

test(
  'Feature flag checking works',
  typeof features.isFeatureEnabled('ES6_MODULES') === 'boolean',
  'boolean',
  typeof features.isFeatureEnabled('ES6_MODULES')
);

// ==========================================
// 🔄 BACKWARD COMPATIBILITY TESTS
// ==========================================

section('Backward Compatibility');

test(
  'GLOBAL_CONFIG still works',
  GLOBAL_CONFIG && GLOBAL_CONFIG.site,
  'GLOBAL_CONFIG object',
  typeof GLOBAL_CONFIG
);

test(
  'ANALYZER_CONFIG still works',
  ANALYZER_CONFIG && ANALYZER_CONFIG.urls,
  'ANALYZER_CONFIG object',
  typeof ANALYZER_CONFIG
);

test(
  'Legacy config values match',
  GLOBAL_CONFIG.site.url === config.site.url,
  'URLs match',
  GLOBAL_CONFIG.site.url === config.site.url
);

// ==========================================
// 📊 RESULTS
// ==========================================

section('Test Results');

const totalTests = testsPassed + testsFailed;
const successRate = Math.round((testsPassed / totalTests) * 100);

console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`Success Rate: ${successRate}%`);

if (testsFailed === 0) {
  console.log('\n🎉 All tests passed! Configuration system is healthy.');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review the configuration.');
  process.exit(1);
}