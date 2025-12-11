/**
 * Navigation System Test Suite
 * 
 * Tests mobile menu functionality across:
 * - Multiple viewport sizes (mobile, tablet, desktop)
 * - Different page types (landing, blog, docs)
 * - Various states (closed, open, transitions)
 * 
 * Run: node tests/navigation-test.js
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration
const BASE_URL = 'http://localhost:8002';
const VIEWPORTS = {
    mobile: { width: 375, height: 667, name: 'iPhone SE' },
    mobileLarge: { width: 414, height: 896, name: 'iPhone 11' },
    tablet: { width: 768, height: 1024, name: 'iPad' },
    desktop: { width: 1024, height: 768, name: 'Desktop' },
    desktopLarge: { width: 1440, height: 900, name: 'Desktop Large' }
};

const TEST_PAGES = [
    { path: '/', name: 'Landing Page (index.html)' },
    { path: '/blog/', name: 'Blog Index' },
    { path: '/docs.html', name: 'Documentation' },
    { path: '/pricing.html', name: 'Pricing' }
];

// Test results tracking
const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
};

function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
        info: 'ℹ️',
        success: '✅',
        error: '❌',
        warning: '⚠️'
    }[type] || 'ℹ️';
    
    console.log(`[${timestamp}] ${prefix} ${message}`);
}

function recordTest(testName, passed, details = '') {
    results.tests.push({ testName, passed, details });
    if (passed) {
        results.passed++;
    } else {
        results.failed++;
    }
}

async function testNavigationElements(page, viewport, pagePath) {
    const testName = `[${viewport.name}] ${pagePath} - Elements Present`;
    
    try {
        // Check if navigation elements exist
        const toggle = await page.$('#mobile-menu-toggle');
        const menu = await page.$('#mobile-menu');
        
        if (!toggle || !menu) {
            recordTest(testName, false, 'Missing navigation elements');
            log(`${testName}: FAIL - Missing elements`, 'error');
            return false;
        }
        
        recordTest(testName, true);
        log(`${testName}: PASS`, 'success');
        return true;
    } catch (error) {
        recordTest(testName, false, error.message);
        log(`${testName}: ERROR - ${error.message}`, 'error');
        return false;
    }
}

async function testInitialState(page, viewport, pagePath) {
    const testName = `[${viewport.name}] ${pagePath} - Initial State`;
    
    try {
        // Get initial attributes
        const ariaExpanded = await page.$eval('#mobile-menu-toggle', el => el.getAttribute('aria-expanded'));
        const dataVisible = await page.$eval('#mobile-menu', el => el.getAttribute('data-visible'));
        const isVisible = await page.$eval('#mobile-menu', el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none';
        });
        
        // Mobile/Tablet should start hidden
        if (viewport.width < 768) {
            if (ariaExpanded !== 'false' || dataVisible !== 'false') {
                recordTest(testName, false, `aria-expanded=${ariaExpanded}, data-visible=${dataVisible}`);
                log(`${testName}: FAIL - Menu not properly initialized`, 'error');
                return false;
            }
            
            if (isVisible) {
                recordTest(testName, false, 'Menu visible on mobile when should be hidden');
                log(`${testName}: FAIL - Menu should be hidden on mobile`, 'error');
                return false;
            }
        } else {
            // Desktop should always be visible
            if (!isVisible) {
                recordTest(testName, false, 'Menu hidden on desktop');
                log(`${testName}: FAIL - Menu should be visible on desktop`, 'error');
                return false;
            }
        }
        
        recordTest(testName, true);
        log(`${testName}: PASS`, 'success');
        return true;
    } catch (error) {
        recordTest(testName, false, error.message);
        log(`${testName}: ERROR - ${error.message}`, 'error');
        return false;
    }
}

async function testToggleFunctionality(page, viewport, pagePath) {
    const testName = `[${viewport.name}] ${pagePath} - Toggle Functionality`;
    
    // Skip toggle test on desktop (menu always visible)
    if (viewport.width >= 768) {
        log(`${testName}: SKIP - Desktop menu always visible`, 'info');
        return true;
    }
    
    try {
        // Click to open
        await page.click('#mobile-menu-toggle');
        await page.waitForTimeout(300); // Wait for animation
        
        const ariaExpandedOpen = await page.$eval('#mobile-menu-toggle', el => el.getAttribute('aria-expanded'));
        const dataVisibleOpen = await page.$eval('#mobile-menu', el => el.getAttribute('data-visible'));
        const isVisibleOpen = await page.$eval('#mobile-menu', el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none';
        });
        
        if (ariaExpandedOpen !== 'true' || dataVisibleOpen !== 'true' || !isVisibleOpen) {
            recordTest(testName, false, `Open failed: aria-expanded=${ariaExpandedOpen}, data-visible=${dataVisibleOpen}, visible=${isVisibleOpen}`);
            log(`${testName}: FAIL - Menu didn't open properly`, 'error');
            return false;
        }
        
        // Click to close
        await page.click('#mobile-menu-toggle');
        await page.waitForTimeout(300);
        
        const ariaExpandedClosed = await page.$eval('#mobile-menu-toggle', el => el.getAttribute('aria-expanded'));
        const dataVisibleClosed = await page.$eval('#mobile-menu', el => el.getAttribute('data-visible'));
        const isVisibleClosed = await page.$eval('#mobile-menu', el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none';
        });
        
        if (ariaExpandedClosed !== 'false' || dataVisibleClosed !== 'false' || isVisibleClosed) {
            recordTest(testName, false, `Close failed: aria-expanded=${ariaExpandedClosed}, data-visible=${dataVisibleClosed}, visible=${isVisibleClosed}`);
            log(`${testName}: FAIL - Menu didn't close properly`, 'error');
            return false;
        }
        
        recordTest(testName, true);
        log(`${testName}: PASS`, 'success');
        return true;
    } catch (error) {
        recordTest(testName, false, error.message);
        log(`${testName}: ERROR - ${error.message}`, 'error');
        return false;
    }
}

async function testCSSConsistency(page, viewport, pagePath) {
    const testName = `[${viewport.name}] ${pagePath} - CSS Consistency`;
    
    try {
        // Check that CSS rules are loaded
        const cssRules = await page.evaluate(() => {
            const rules = [];
            for (const sheet of document.styleSheets) {
                try {
                    for (const rule of sheet.cssRules || []) {
                        if (rule.selectorText && rule.selectorText.includes('nav-menu')) {
                            rules.push(rule.selectorText);
                        }
                    }
                } catch (e) {
                    // CORS stylesheet, skip
                }
            }
            return rules;
        });
        
        const hasBaseRule = cssRules.some(r => r.includes('.nav-menu') && !r.includes('['));
        const hasTrueRule = cssRules.some(r => r.includes('[data-visible="true"]'));
        const hasFalseRule = cssRules.some(r => r.includes('[data-visible="false"]'));
        
        if (!hasBaseRule || !hasTrueRule) {
            recordTest(testName, false, `Missing CSS rules: base=${hasBaseRule}, true=${hasTrueRule}, false=${hasFalseRule}`);
            log(`${testName}: FAIL - Missing critical CSS rules`, 'error');
            return false;
        }
        
        if (!hasFalseRule) {
            results.warnings++;
            log(`${testName}: WARNING - Missing defensive [data-visible="false"] rule`, 'warning');
        }
        
        recordTest(testName, true);
        log(`${testName}: PASS`, 'success');
        return true;
    } catch (error) {
        recordTest(testName, false, error.message);
        log(`${testName}: ERROR - ${error.message}`, 'error');
        return false;
    }
}

async function testJavaScriptExecution(page, viewport, pagePath) {
    const testName = `[${viewport.name}] ${pagePath} - JavaScript Execution`;
    
    try {
        // Check if navigation component initialized
        const navInitialized = await page.evaluate(() => {
            return typeof window.NavigationComponent !== 'undefined' || 
                   document.querySelector('#mobile-menu-toggle')?.hasAttribute('aria-expanded');
        });
        
        if (!navInitialized) {
            recordTest(testName, false, 'Navigation component not initialized');
            log(`${testName}: FAIL - JavaScript not executed`, 'error');
            return false;
        }
        
        recordTest(testName, true);
        log(`${testName}: PASS`, 'success');
        return true;
    } catch (error) {
        recordTest(testName, false, error.message);
        log(`${testName}: ERROR - ${error.message}`, 'error');
        return false;
    }
}

async function runTestSuite() {
    log('Starting Navigation Test Suite...', 'info');
    log(`Base URL: ${BASE_URL}`, 'info');
    log(`Testing ${TEST_PAGES.length} pages across ${Object.keys(VIEWPORTS).length} viewports`, 'info');
    console.log('');
    
    const browser = await chromium.launch({
        headless: true // Set to false to watch tests run
    });
    
    try {
        for (const viewport of Object.values(VIEWPORTS)) {
            log(`\n📱 Testing viewport: ${viewport.name} (${viewport.width}x${viewport.height})`, 'info');
            
            const context = await browser.newContext({
                viewport: { width: viewport.width, height: viewport.height }
            });
            const page = await context.newPage();
            
            for (const testPage of TEST_PAGES) {
                const url = `${BASE_URL}${testPage.path}`;
                log(`\n  🌐 Loading: ${testPage.name}`, 'info');
                
                try {
                    await page.goto(url, { waitUntil: 'networkidle' });
                    await page.waitForTimeout(500); // Wait for JS initialization
                    
                    // Run all tests for this page/viewport combo
                    await testNavigationElements(page, viewport, testPage.name);
                    await testInitialState(page, viewport, testPage.name);
                    await testToggleFunctionality(page, viewport, testPage.name);
                    await testCSSConsistency(page, viewport, testPage.name);
                    await testJavaScriptExecution(page, viewport, testPage.name);
                    
                } catch (error) {
                    log(`  Failed to load ${url}: ${error.message}`, 'error');
                    results.failed++;
                }
            }
            
            await context.close();
        }
    } finally {
        await browser.close();
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${results.passed + results.failed}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`⚠️  Warnings: ${results.warnings}`);
    console.log('='.repeat(60));
    
    if (results.failed > 0) {
        console.log('\n❌ FAILED TESTS:');
        results.tests
            .filter(t => !t.passed)
            .forEach(t => {
                console.log(`  • ${t.testName}`);
                if (t.details) console.log(`    ${t.details}`);
            });
    }
    
    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTestSuite().catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
});
