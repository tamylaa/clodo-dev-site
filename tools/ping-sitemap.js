#!/usr/bin/env node

/**
 * Sitemap Notification Utility
 * 
 * Notifies search engines when the sitemap has been updated.
 * 
 * NOTE: As of June 2023, Google deprecated the ping endpoint.
 * Modern approach:
 * - Use Google Search Console API or IndexNow API
 * - Submit via Search Console manually
 * - Let search engines discover via robots.txt
 * 
 * This script now uses IndexNow API (supported by Bing, Yandex, etc.)
 * 
 * Usage:
 *   node tools/ping-sitemap.js
 * 
 * Environment Variables:
 *   SITEMAP_URL - Full URL to sitemap (default: https://www.clodo.dev/sitemap.xml)
 *   INDEXNOW_KEY - IndexNow API key (optional, will generate if not provided)
 */

import https from 'https';
import { URL } from 'url';
import crypto from 'crypto';

const SITEMAP_URL = process.env.SITEMAP_URL || 'https://www.clodo.dev/sitemap.xml';
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || crypto.randomBytes(32).toString('hex');

/**
 * Fetch sitemap and extract URLs
 */
function fetchSitemap(sitemapUrl) {
  return new Promise((resolve, reject) => {
    const url = new URL(sitemapUrl);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'GET',
      timeout: 10000,
      headers: {
        'User-Agent': 'Clodo-Sitemap-Pinger/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Extract URLs from sitemap XML
          const urlMatches = body.match(/<loc>(.*?)<\/loc>/g);
          if (urlMatches) {
            const urls = urlMatches.map(match => match.replace(/<\/?loc>/g, ''));
            resolve(urls);
          } else {
            resolve([]);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Submit URLs via IndexNow API
 */
function submitToIndexNow(urls, host, key) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      host: host,
      key: key,
      urlList: urls
    });

    const options = {
      hostname: 'api.indexnow.org',
      port: 443,
      path: '/indexnow',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        // IndexNow returns 200 for success, 202 for accepted
        if (res.statusCode === 200 || res.statusCode === 202) {
          resolve({ success: true, status: res.statusCode });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Main execution
 */
async function main() {
  console.log('🔔 Sitemap Notification Utility\n');
  console.log(`📍 Sitemap: ${SITEMAP_URL}\n`);

  // Extract host from sitemap URL
  const sitemapHost = new URL(SITEMAP_URL).hostname;

  // Fetch and parse sitemap
  console.log('📥 Fetching sitemap...');
  let urls;
  try {
    urls = await fetchSitemap(SITEMAP_URL);
    console.log(`  ✓ Found ${urls.length} URLs in sitemap\n`);
    
    if (urls.length === 0) {
      console.error('⚠️  No URLs found in sitemap');
      console.log('\n✅ Nothing to notify (empty sitemap)');
      process.exit(0);
    }
  } catch (error) {
    console.error(`  ✗ Failed to fetch sitemap: ${error.message}`);
    console.error('\n⚠️  Skipping search engine notification (sitemap not accessible)');
    console.error('\n📚 Alternative approaches:');
    console.error('  • Submit URLs via Google Search Console');
    console.error('  • Submit URLs via Bing Webmaster Tools');
    console.error('  • Ensure robots.txt references sitemap');
    console.error('  • Try again after deployment completes');
    
    // Exit successfully to not fail the workflow
    process.exit(0);
  }

  // Submit to IndexNow
  console.log('📤 Submitting to search engines via IndexNow...');
  console.log(`  • API Key: ${INDEXNOW_KEY.substring(0, 8)}...`);
  console.log(`  • Host: ${sitemapHost}`);
  console.log(`  • URLs: ${Math.min(urls.length, 10000)} (max 10k per request)\n`);

  try {
    // IndexNow supports max 10,000 URLs per request
    const urlsToSubmit = urls.slice(0, 10000);
    const result = await submitToIndexNow(urlsToSubmit, sitemapHost, INDEXNOW_KEY);
    
    console.log(`  ✓ Search engines notified (HTTP ${result.status})`);
    console.log(`    Supported engines: Bing, Yandex, Seznam.cz, Naver`);
    
    if (urls.length > 10000) {
      console.log(`\n⚠️  Note: Only first 10,000 URLs submitted (sitemap has ${urls.length})`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Sitemap notification complete!');
    console.log('\n📚 Additional recommendations:');
    console.log('  • Submit sitemap to Google Search Console manually');
    console.log('  • Ensure sitemap is listed in robots.txt');
    console.log('  • Keep sitemap updated with fresh content');
    
    if (!process.env.INDEXNOW_KEY) {
      console.log('\n💡 Tip: Set INDEXNOW_KEY environment variable for consistent key usage');
      console.log(`    Current key: ${INDEXNOW_KEY}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error(`  ✗ IndexNow submission failed: ${error.message}`);
    console.error('\n❌ Search engine notification failed');
    console.error('\n📚 Alternative approaches:');
    console.error('  • Submit URLs via Google Search Console');
    console.error('  • Submit URLs via Bing Webmaster Tools');
    console.error('  • Ensure robots.txt references sitemap');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
