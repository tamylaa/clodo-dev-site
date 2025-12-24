#!/usr/bin/env node

/**
 * Check Cloudflare Pages Web Analytics Settings
 * 
 * Usage:
 *   node tools/check-pages-settings.js <API_TOKEN>
 * 
 * Get API Token: https://dash.cloudflare.com → My Profile → API Tokens
 * Required permissions: Account.Cloudflare Pages (Read)
 */

import https from 'https';

const [,, API_TOKEN] = process.argv;

if (!API_TOKEN) {
  console.error('❌ Missing required argument');
  console.error('\nUsage:');
  console.error('  node tools/check-pages-settings.js <API_TOKEN>');
  console.error('\nGet API Token: Dashboard → My Profile → API Tokens');
  console.error('Required permissions: Account.Cloudflare Pages (Read)');
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

async function getAccountId() {
  try {
    console.log('🔍 Fetching account information...');
    const response = await makeRequest('GET', '/client/v4/accounts');
    
    if (!response.result || response.result.length === 0) {
      throw new Error('No accounts found');
    }

    const account = response.result[0];
    console.log(`✅ Account: ${account.name} (${account.id})\n`);
    return account.id;
  } catch (error) {
    throw new Error(`Failed to fetch account: ${error.message}`);
  }
}

async function checkPagesSettings() {
  try {
    const ACCOUNT_ID = await getAccountId();
    
    console.log('🔍 Fetching Cloudflare Pages projects...\n');
    
    const response = await makeRequest('GET', `/client/v4/accounts/${ACCOUNT_ID}/pages/projects`);
    
    if (!response.result || response.result.length === 0) {
      console.log('❌ No Pages projects found');
      return;
    }

    console.log(`Found ${response.result.length} project(s):\n`);
    
    for (const project of response.result) {
      console.log(`📄 Project: ${project.name}`);
      console.log(`   Production URL: ${project.domains?.[0] || 'N/A'}`);
      console.log(`   Web Analytics: ${project.web_analytics_enabled ? '✅ ENABLED' : '❌ DISABLED'}`);
      
      if (project.web_analytics_token) {
        console.log(`   Beacon Token: ${project.web_analytics_token.substring(0, 20)}...`);
      }
      console.log('');
    }
    
    // Load project name from config
    let projectName = 'my-website';
    try {
      const { getConfig } = await import('../config/tooling.config.js');
      projectName = getConfig().cloudflare.projectName;
    } catch (e) {
      // Use default
    }
    
    const targetProject = response.result.find(p => p.name === projectName);
    
    if (targetProject && targetProject.web_analytics_enabled) {
      console.log('⚠️  Web Analytics is ENABLED on your Pages project!');
      console.log('\n📝 To disable:');
      console.log('1. Go to: https://dash.cloudflare.com');
      console.log(`2. Navigate: Pages → ${projectName} → Settings`);
      console.log('3. Find "Web Analytics" section');
      console.log('4. Toggle OFF or remove the integration');
      console.log('\nThis is different from Zone Web Analytics and must be disabled separately.');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('- Verify API token has Pages:Read permission');
    console.error('- Verify Account ID is correct');
    process.exit(1);
  }
}

checkPagesSettings();
