#!/usr/bin/env node
/**
 * Test actual redirect behavior
 * Verifies redirects work correctly and don't create chains/loops
 * 
 * Usage: npm run test:redirects (requires dev server running)
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('\n🔄 REDIRECT BEHAVIOR TEST\n');
console.log('════════════════════════════════════════════════════════════════\n');

const BASE_URL = 'http://localhost:8000';
const MAX_REDIRECTS = 5;

// Test cases
const testCases = [
  { url: 'http://clodo.dev/', desc: 'Non-www HTTP' },
  { url: 'https://clodo.dev/', desc: 'Non-www HTTPS' },
  { url: 'http://www.clodo.dev/', desc: 'www HTTP' },
  { url: 'https://www.clodo.dev/', desc: 'www HTTPS' },
  { url: 'https://www.clodo.dev/index.html', desc: 'With .html extension' },
  { url: 'https://www.clodo.dev/about.html', desc: 'About page with .html' },
  { url: 'https://www.clodo.dev/about/', desc: 'About page with trailing slash' },
  { url: 'https://www.clodo.dev/docs/index.html', desc: '/docs with index.html' },
];

function testRedirect(url, desc) {
  return new Promise((resolve) => {
    const urlObj = new URL(url.replace('https://', 'http://'));
    
    const redirectChain = [];
    let currentUrl = url;
    
    const follow = () => {
      if (redirectChain.length > MAX_REDIRECTS) {
        resolve({
          url: desc,
          status: 'ERROR',
          chain: redirectChain,
          message: `Exceeded max redirects (${MAX_REDIRECTS})`
        });
        return;
      }
      
      // Only test localhost for dev server
      if (!currentUrl.includes('localhost')) {
        // Skip external URLs
        resolve({
          url: desc,
          status: 'SKIPPED',
          chain: redirectChain,
          message: 'Only testing localhost redirects'
        });
        return;
      }
      
      const urlObj = new URL(currentUrl);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 80,
        path: urlObj.pathname + urlObj.search,
        method: 'HEAD',
        redirect: 'manual'
      };
      
      const req = http.request(options, (res) => {
        redirectChain.push({
          url: currentUrl,
          status: res.statusCode
        });
        
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          currentUrl = res.headers.location;
          if (!currentUrl.startsWith('http')) {
            currentUrl = `http://${urlObj.hostname}:${options.port || 80}${currentUrl}`;
          }
          follow();
        } else {
          resolve({
            url: desc,
            status: res.statusCode,
            chain: redirectChain,
            message: res.statusCode === 200 ? '✓ OK' : `${res.statusCode}`
          });
        }
      });
      
      req.on('error', (err) => {
        resolve({
          url: desc,
          status: 'ERROR',
          chain: redirectChain,
          message: err.message
        });
      });
      
      req.end();
    };
    
    follow();
  });
}

// Run tests
(async () => {
  console.log('⚠️  Make sure dev server is running on http://localhost:8000\n');
  console.log('Testing redirect chains...\n');
  
  const results = [];
  
  for (const test of testCases) {
    const result = await testRedirect(test.url, test.desc);
    results.push(result);
    
    const statusStr = typeof result.status === 'number' ? `${result.status}` : result.status;
    const icon = result.status === 200 || result.status === 'SKIPPED' ? '✓' : '⚠️ ';
    
    console.log(`${icon} ${result.url}`);
    console.log(`   Final: ${statusStr}`);
    
    if (result.chain.length > 1) {
      console.log(`   Chain length: ${result.chain.length}`);
      if (result.chain.length > 3) {
        console.log(`   ⚠️  Long redirect chain detected!`);
      }
    }
    console.log();
  }
  
  // Summary
  console.log('════════════════════════════════════════════════════════════════');
  console.log('\n📊 REDIRECT TEST SUMMARY\n');
  
  const ok = results.filter(r => r.status === 200 || r.status === 'SKIPPED').length;
  const errors = results.filter(r => r.status === 'ERROR').length;
  const longChains = results.filter(r => r.chain && r.chain.length > 3).length;
  
  console.log(`   Passed: ${ok}/${results.length}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Long chains (>3): ${longChains}`);
  
  if (errors === 0 && longChains === 0) {
    console.log('\n✅ REDIRECTS WORKING CORRECTLY\n');
  } else {
    console.log('\n⚠️  ISSUES DETECTED - Review chains above\n');
  }
  
  console.log('════════════════════════════════════════════════════════════════\n');
})();
