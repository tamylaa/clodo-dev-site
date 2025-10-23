#!/usr/bin/env node

/**
 * Simple test runner for Clodo Framework website
 * Runs all test suites and reports results
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Clodo Framework Tests...\n');

// Test suites to run
const testSuites = [
  {
    name: 'Unit Tests',
    command: 'npm run test:unit',
    description: 'Testing core functionality and utilities'
  },
  {
    name: 'Accessibility Tests',
    command: 'npm run test:accessibility',
    description: 'WCAG 2.1 AA compliance testing'
  },
  {
    name: 'Performance Tests',
    command: 'npm run test:performance',
    description: 'Load time and runtime performance testing'
  }
];

let passed = 0;
let failed = 0;

testSuites.forEach(suite => {
  console.log(`📋 Running ${suite.name}...`);
  console.log(`   ${suite.description}`);

  try {
    execSync(suite.command, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..', 'tests')
    });
    console.log(`✅ ${suite.name} passed\n`);
    passed++;
  } catch (error) {
    console.log(`❌ ${suite.name} failed\n`);
    failed++;
  }
});

// Summary
console.log('📊 Test Results Summary:');
console.log(`   ✅ Passed: ${passed}`);
console.log(`   ❌ Failed: ${failed}`);
console.log(`   📈 Total: ${passed + failed}`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! Ready for deployment.');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review and fix issues before deployment.');
  process.exit(1);
}