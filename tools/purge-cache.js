#!/usr/bin/env node

/**
 * Purge Cloudflare Cache
 * This forces the edge to serve fresh content without the auto-injected beacon
 * 
 * Usage:
 *   node tools/purge-cache.js <API_TOKEN>
 */

import https from 'https';

const [,, API_TOKEN] = process.argv;

if (!API_TOKEN) {
  console.error('❌ Missing API token');
  console.error('\nUsage:');
  console.error('  node tools/purge-cache.js <API_TOKEN>');
  process.exit(1);
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.cloudflare.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (!response.success) {
            reject(new Error(response.errors?.[0]?.message || 'API request failed'));
          } else {
            resolve(response);
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function getZoneId() {
  console.log('🔍 Finding zone for clodo.dev...');
  const response = await makeRequest('GET', '/client/v4/zones?name=clodo.dev');
  
  if (!response.result || response.result.length === 0) {
    throw new Error('Zone not found');
  }
  
  const zone = response.result[0];
  console.log(`✅ Zone: ${zone.name} (${zone.id})\n`);
  return zone.id;
}

async function purgeCache() {
  try {
    const zoneId = await getZoneId();
    
    console.log('🧹 Purging entire cache for www.clodo.dev...');
    console.log('   This will force fresh content without auto-injected scripts\n');
    
    // Purge specific URLs
    const urls = [
      'https://www.clodo.dev',
      'https://www.clodo.dev/',
      'https://clodo.dev',
      'https://clodo.dev/'
    ];
    
    await makeRequest('POST', `/client/v4/zones/${zoneId}/purge_cache`, {
      files: urls
    });
    
    console.log('✅ Cache purged successfully!\n');
    console.log('⏱️  Wait 30-60 seconds, then check:');
    console.log('   node tools/check-production-scripts.js\n');
    console.log('The auto-injected beacon should now be gone.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('- Verify API token has Zone.Cache Purge permission');
    console.error('- Verify zone exists and is accessible');
    process.exit(1);
  }
}

purgeCache();
