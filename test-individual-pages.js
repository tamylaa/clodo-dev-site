/**
 * Test individual pages separately to avoid rate limiting
 * Tests /docs.html, /pricing.html, /examples.html one at a time
 */

import lighthouse from 'lighthouse';
import chromeLauncher from 'chrome-launcher';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pages = [
  'https://www.clodo.dev/',
  'https://www.clodo.dev/docs.html',
  'https://www.clodo.dev/pricing.html',
  'https://www.clodo.dev/examples.html'
];

const resultsDir = path.join(__dirname, 'lighthouse-results');

async function testPage(url) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${url}`);
  console.log('='.repeat(60));

  let chrome;
  try {
    chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });

    const options = {
      logLevel: 'info',
      output: 'json',
      port: chrome.port,
      onlyCategories: ['performance', 'best-practices', 'accessibility', 'seo']
    };

    const runnerResult = await lighthouse(url, options);

    // Log scores
    const scores = runnerResult.lhr.categories;
    console.log('\nScores:');
    console.log(`  Performance: ${Math.round(scores.performance.score * 100)}/100`);
    console.log(`  Best Practices: ${Math.round(scores['best-practices'].score * 100)}/100`);
    console.log(`  Accessibility: ${Math.round(scores.accessibility.score * 100)}/100`);
    console.log(`  SEO: ${Math.round(scores.seo.score * 100)}/100`);

    // Check for console errors
    const consoleErrors = runnerResult.lhr.audits['errors-in-console'];
    console.log(`\nConsole Errors: ${consoleErrors.details.items.length}`);
    if (consoleErrors.details.items.length > 0) {
      consoleErrors.details.items.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.description}`);
      });
    }

    // Save report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const pageName = new URL(url).pathname.replace(/\//g, '-') || 'index';
    const reportPath = path.join(resultsDir, `individual-${pageName}-${timestamp}.json`);
    
    fs.writeFileSync(reportPath, JSON.stringify(runnerResult.lhr, null, 2));
    console.log(`\nReport saved: ${reportPath}`);

    return {
      url,
      scores,
      errors: consoleErrors.details.items.length
    };
  } catch (error) {
    console.error(`Error testing ${url}:`, error.message);
    return { url, error: error.message };
  } finally {
    if (chrome) {
      await chrome.kill();
    }
    // Wait 5 seconds between tests to avoid rate limiting
    console.log('\nWaiting 5 seconds before next test...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

async function runAllTests() {
  console.log('Starting individual page tests...\n');
  
  const results = [];
  for (const page of pages) {
    const result = await testPage(page);
    results.push(result);
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    if (result.error) {
      console.log(`\n${result.url}: ERROR - ${result.error}`);
    } else {
      console.log(`\n${result.url}:`);
      console.log(`  Performance: ${Math.round(result.scores.performance.score * 100)}/100`);
      console.log(`  Best Practices: ${Math.round(result.scores['best-practices'].score * 100)}/100`);
      console.log(`  Console Errors: ${result.errors}`);
    }
  });
}

runAllTests().catch(console.error);
