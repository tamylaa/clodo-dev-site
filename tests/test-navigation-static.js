#!/usr/bin/env node

/**
 * Navigation System Test Suite
 * 
 * Tests navigation consistency across all pages:
 * - HTML structure validation
 * - CSS attribute presence
 * - JavaScript integration
 * - Responsive behavior verification
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration
// Prefer `dist` (legacy) but fall back to Astro build output `dist-astro/client` if present.
const LEGACY_DIST = join(__dirname, '..', 'dist');
const ASTRO_DIST = join(__dirname, '..', 'dist-astro', 'client');
let DIST_DIR = LEGACY_DIST;
import { existsSync } from 'fs';
if (!existsSync(DIST_DIR) && existsSync(ASTRO_DIST)) {
    DIST_DIR = ASTRO_DIST;
}
const CRITICAL_CSS_PATH = join(DIST_DIR, 'critical.css');

// Test results
const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
};

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(colors[color] + message + colors.reset);
}

function addTest(name, passed, message = '', isWarning = false) {
    results.tests.push({ name, passed, message, isWarning });
    if (isWarning) {
        results.warnings++;
    } else if (passed) {
        results.passed++;
    } else {
        results.failed++;
    }
}

/**
 * Find all HTML files in dist directory
 */
function findHtmlFiles(dir) {
    const files = [];
    const items = readdirSync(dir);
    
    for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
            files.push(...findHtmlFiles(fullPath));
        } else if (item.endsWith('.html')) {
            // Exclude Google verification files and standalone demo pages
            if (!item.startsWith('google') && !fullPath.includes('demo')) {
                files.push(fullPath);
            }
        }
    }
    
    return files;
}

/**
 * Test: Mobile menu has data-visible attribute
 */
function testDataVisibleAttribute(filePath, content) {
    const testName = `[${filePath.replace(DIST_DIR, '')}] Mobile menu has data-visible attribute`;
    const mobileMenuRegex = /<ul[^>]*id="mobile-menu"[^>]*>/;
    const match = content.match(mobileMenuRegex);
    
    if (!match) {
        addTest(testName, false, 'Mobile menu element not found');
        return;
    }
    
    const hasDataVisible = match[0].includes('data-visible=');
    const correctValue = match[0].includes('data-visible="false"');
    
    if (!hasDataVisible) {
        addTest(testName, false, 'Missing data-visible attribute');
    } else if (!correctValue) {
        addTest(testName, false, `Found data-visible but not set to "false": ${match[0]}`);
    } else {
        addTest(testName, true);
    }
}

/**
 * Test: Navigation toggle button exists
 */
function testToggleButton(filePath, content) {
    const testName = `[${filePath.replace(DIST_DIR, '')}] Mobile menu toggle button exists`;
    const toggleRegex = /<button[^>]*id="mobile-menu-toggle"[^>]*>/;
    const match = content.match(toggleRegex);
    
    if (!match) {
        addTest(testName, false, 'Toggle button not found');
        return;
    }
    
    const hasAriaExpanded = match[0].includes('aria-expanded=');
    const hasAriaControls = match[0].includes('aria-controls="mobile-menu"');
    
    if (!hasAriaExpanded) {
        addTest(testName, false, 'Toggle button missing aria-expanded attribute', true);
    } else if (!hasAriaControls) {
        addTest(testName, false, 'Toggle button missing aria-controls attribute', true);
    } else {
        addTest(testName, true);
    }
}

/**
 * Test: Navigation has correct structure
 */
function testNavigationStructure(filePath, content) {
    const testName = `[${filePath.replace(DIST_DIR, '')}] Navigation structure valid`;
    
    const hasNavbar = content.includes('<nav class="navbar"');
    const hasNavContainer = content.includes('class="nav-container"');
    const hasLogo = content.includes('class="logo"');
    const hasMobileMenu = content.includes('id="mobile-menu"');
    
    if (!hasNavbar) {
        addTest(testName, false, 'Missing navbar element');
    } else if (!hasNavContainer) {
        addTest(testName, false, 'Missing nav-container');
    } else if (!hasLogo) {
        addTest(testName, false, 'Missing logo');
    } else if (!hasMobileMenu) {
        addTest(testName, false, 'Missing mobile menu');
    } else {
        addTest(testName, true);
    }
}

/**
 * Test: CSS includes data-visible rules
 */
function testCssRules() {
    const testName = 'Critical CSS includes data-visible rules';
    
    try {
        const css = readFileSync(CRITICAL_CSS_PATH, 'utf-8');
        
        const hasFalseRule = css.includes('[data-visible="false"]') || css.includes("[data-visible='false']");
        const hasTrueRule = css.includes('[data-visible="true"]') || css.includes("[data-visible='true']");
        
        if (!hasFalseRule && !hasTrueRule) {
            addTest(testName, false, 'No data-visible CSS rules found');
        } else if (!hasFalseRule) {
            addTest(testName, false, 'Missing [data-visible="false"] rule', true);
        } else if (!hasTrueRule) {
            addTest(testName, false, 'Missing [data-visible="true"] rule');
        } else {
            addTest(testName, true);
        }
    } catch (err) {
        addTest(testName, false, `Failed to read critical CSS: ${err.message}`);
    }
}

/**
 * Test: JavaScript has String conversion
 */
function testJavaScriptStringConversion() {
    const testName = 'Navigation JS converts boolean to string';
    const jsPath = join(DIST_DIR, 'js', 'ui', 'navigation-component.js');
    
    try {
        const js = readFileSync(jsPath, 'utf-8');
        
        const hasStringConversion = js.includes('String(isOpen)');
        const hasSetAttribute = js.includes('setAttribute');
        const hasDataVisible = js.includes('data-visible');
        
        if (!hasSetAttribute) {
            addTest(testName, false, 'setAttribute method not found');
        } else if (!hasDataVisible) {
            addTest(testName, false, 'data-visible attribute not set in JS');
        } else if (!hasStringConversion) {
            addTest(testName, false, 'Boolean not converted to String (will create data-visible="" instead of data-visible="true")');
        } else {
            addTest(testName, true);
        }
    } catch (err) {
        addTest(testName, false, `Failed to read navigation JS: ${err.message}`);
    }
}

/**
 * Test: Template consistency
 */
function testTemplateConsistency(htmlFiles) {
    const testName = 'All pages use consistent navigation templates';
    
    const navStructures = {};
    
    for (const file of htmlFiles) {
        const content = readFileSync(file, 'utf-8');
        const mobileMenuMatch = content.match(/<ul[^>]*id="mobile-menu"[^>]*>/);
        
        if (mobileMenuMatch) {
            const structure = mobileMenuMatch[0];
            if (!navStructures[structure]) {
                navStructures[structure] = [];
            }
            navStructures[structure].push(file.replace(DIST_DIR, ''));
        }
    }
    
    const structureCount = Object.keys(navStructures).length;
    
    if (structureCount === 0) {
        addTest(testName, false, 'No mobile menus found in any pages');
    } else if (structureCount > 1) {
        let message = `Found ${structureCount} different mobile menu structures:\n`;
        for (const [structure, files] of Object.entries(navStructures)) {
            message += `\n  Structure: ${structure}\n`;
            message += `  Files: ${files.slice(0, 3).join(', ')}${files.length > 3 ? ` and ${files.length - 3} more` : ''}\n`;
        }
        addTest(testName, false, message, true);
    } else {
        addTest(testName, true, `All ${htmlFiles.length} pages use the same structure`);
    }
}

/**
 * Main test runner
 */
function runTests() {
    log('\n' + '='.repeat(60), 'cyan');
    log('🧪 NAVIGATION SYSTEM TEST SUITE', 'bold');
    log('='.repeat(60) + '\n', 'cyan');
    
    log('📁 Scanning for HTML files...', 'cyan');
    const htmlFiles = findHtmlFiles(DIST_DIR);
    log(`   Found ${htmlFiles.length} HTML files\n`, 'cyan');
    
    // Run CSS tests
    log('🎨 Testing CSS...', 'cyan');
    testCssRules();
    
    // Run JavaScript tests
    log('📜 Testing JavaScript...', 'cyan');
    testJavaScriptStringConversion();
    
    // Run template consistency tests
    log('📋 Testing template consistency...', 'cyan');
    testTemplateConsistency(htmlFiles);
    
    // Run per-file tests
    log('🔍 Testing individual pages...', 'cyan');
    for (const file of htmlFiles) {
        const content = readFileSync(file, 'utf-8');
        testNavigationStructure(file, content);
        testDataVisibleAttribute(file, content);
        testToggleButton(file, content);
    }
    
    // Print results
    printResults();
}

/**
 * Print test results
 */
function printResults() {
    log('\n' + '='.repeat(60), 'cyan');
    log('📊 TEST SUMMARY', 'bold');
    log('='.repeat(60), 'cyan');
    log(`Total Tests: ${results.passed + results.failed}`, 'bold');
    log(`✅ Passed: ${results.passed}`, 'green');
    log(`❌ Failed: ${results.failed}`, 'red');
    log(`⚠️  Warnings: ${results.warnings}`, 'yellow');
    log('='.repeat(60) + '\n', 'cyan');
    
    // Show failed tests
    const failedTests = results.tests.filter(t => !t.passed && !t.isWarning);
    if (failedTests.length > 0) {
        log('❌ FAILED TESTS:', 'red');
        for (const test of failedTests) {
            log(`\n  ${test.name}`, 'red');
            if (test.message) {
                log(`     ${test.message}`, 'yellow');
            }
        }
        log('');
    }
    
    // Show warnings
    const warnings = results.tests.filter(t => t.isWarning);
    if (warnings.length > 0) {
        log('⚠️  WARNINGS:', 'yellow');
        for (const test of warnings) {
            log(`\n  ${test.name}`, 'yellow');
            if (test.message) {
                log(`     ${test.message}`, 'yellow');
            }
        }
        log('');
    }
    
    // Show passed tests summary
    if (results.passed > 0) {
        log(`✅ ${results.passed} tests passed successfully\n`, 'green');
    }
    
    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests();
