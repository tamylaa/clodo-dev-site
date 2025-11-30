#!/usr/bin/env node

/**
 * Check Zone-level Web Analytics
 * This is DIFFERENT from Pages-level Web Analytics
 */

import https from 'https';

const [,, API_TOKEN] = process.argv;

if (!API_TOKEN) {
  console.error('Usage: node tools/check-zone-analytics.js <API_TOKEN>');
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
          resolve({ success: res.statusCode < 300, data: response, status: res.statusCode });
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function checkZoneAnalytics() {
  try {
    console.log('🔍 Checking Zone-level Web Analytics for clodo.dev...\n');
    
    // Get zone ID
    const zonesResp = await makeRequest('GET', '/client/v4/zones?name=clodo.dev');
    if (!zonesResp.success || !zonesResp.data.result?.length) {
      console.log('❌ Zone not found');
      return;
    }
    
    const zone = zonesResp.data.result[0];
    console.log(`✅ Zone: ${zone.name} (${zone.id})\n`);
    
    // Check Web Analytics settings
    const analyticsResp = await makeRequest('GET', `/client/v4/zones/${zone.id}/web_analytics/config`);
    
    if (analyticsResp.status === 404) {
      console.log('✅ No Zone-level Web Analytics configured');
      console.log('\n📝 Recommendation: The auto-injection is coming from somewhere else.');
      console.log('   Check: Dashboard → Analytics & Logs → Web Analytics');
      return;
    }
    
    if (analyticsResp.success && analyticsResp.data.result) {
      const config = analyticsResp.data.result;
      console.log('⚠️  Zone-level Web Analytics IS configured:');
      console.log(`   Token: ${config.site_token || 'N/A'}`);
      console.log(`   Auto-install: ${config.auto_install ? '✅ YES' : '❌ NO'}`);
      
      if (config.auto_install) {
        console.log('\n🎯 FOUND THE PROBLEM!');
        console.log('   Zone-level auto-install is ENABLED');
        console.log('\n📝 To disable:');
        console.log('1. Dashboard → clodo.dev → Analytics & Logs → Web Analytics');
        console.log('2. Disable "Automatic Installation"');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkZoneAnalytics();
