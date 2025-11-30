#!/usr/bin/env node

/**
 * Disable Cloudflare Web Analytics Auto-Injection
 * 
 * This script disables the automatic injection of Cloudflare Web Analytics
 * beacon to allow manual control for better performance.
 * 
 * Usage:
 *   node tools/disable-web-analytics.js <API_TOKEN>
 * 
 * Get your API token:
 *   https://dash.cloudflare.com/profile/api-tokens
 *   Permissions needed: Zone:Analytics:Edit
 */

import https from 'https';

const API_TOKEN = process.argv[2];

if (!API_TOKEN) {
  console.error('❌ Missing API token');
  console.error('\nUsage:');
  console.error('  node tools/disable-web-analytics.js <API_TOKEN>');
  console.error('\nGet API token: https://dash.cloudflare.com/profile/api-tokens');
  console.error('Permissions needed: Zone:Analytics:Edit');
  process.exit(1);
}

console.log('🔍 Finding zones and checking Web Analytics configuration...\n');

/**
 * Make Cloudflare API request
 */
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

/**
 * Main execution
 */
async function disableWebAnalytics() {
  try {
    // Step 1: List zones to find the right one
    console.log('📋 Fetching your zones...');
    const zonesResponse = await makeRequest('GET', '/client/v4/zones');
    
    if (!zonesResponse.result || zonesResponse.result.length === 0) {
      console.error('❌ No zones found for this API token');
      process.exit(1);
    }

    console.log(`Found ${zonesResponse.result.length} zone(s):\n`);
    
    // Step 2: Check each zone for Web Analytics
    let foundAnalytics = false;
    
    for (const zone of zonesResponse.result) {
      console.log(`🌐 Zone: ${zone.name} (${zone.id})`);
      
      try {
        // Check Web Analytics for this zone
        const sitesResponse = await makeRequest('GET', `/client/v4/zones/${zone.id}/web_analytics/sites`);
        
        if (sitesResponse.result && sitesResponse.result.length > 0) {
          foundAnalytics = true;
          console.log(`   📊 Found ${sitesResponse.result.length} Web Analytics site(s)\n`);
          
          // Disable auto-injection for each site
          for (const site of sitesResponse.result) {
            console.log(`   📍 Site: ${site.site_name || site.site_tag}`);
            console.log(`      Auto Install: ${site.auto_install ? '✅ ENABLED' : '❌ DISABLED'}`);
            
            if (site.auto_install) {
              console.log('      🔧 Disabling auto-injection...');
              
              await makeRequest(
                'PATCH',
                `/client/v4/zones/${zone.id}/web_analytics/sites/${site.site_tag}`,
                { auto_install: false }
              );
              
              console.log('      ✅ Auto-injection disabled!');
            } else {
              console.log('      ℹ️  Already disabled');
            }
            console.log('');
          }
        } else {
          console.log('   ℹ️  No Web Analytics configured\n');
        }
      } catch (err) {
        console.log(`   ℹ️  No Web Analytics access or not configured\n`);
      }
    }

    if (!foundAnalytics) {
      console.log('✅ No Web Analytics sites with auto-injection found!');
      return;
    }

    console.log('🎉 Web Analytics auto-injection has been disabled!');
    console.log('\n📝 Next steps:');
    console.log('1. Deploy your site with the optimized analytics.js');
    console.log('2. Wait 2-3 minutes for changes to propagate');
    console.log('3. Run Lighthouse audit to verify improved performance');
    console.log('4. Expected: TBT < 200ms, Performance Score 85-90+');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('- Verify API token has Zone:Analytics:Edit permission');
    console.error('- Check if Web Analytics is enabled for your zones');
    process.exit(1);
  }
}

disableWebAnalytics();
