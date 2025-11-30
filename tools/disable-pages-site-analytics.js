#!/usr/bin/env node

/**
 * Disable Web Analytics auto-injection for clododev.pages.dev via Cloudflare API
 */

import https from 'https';

const [,, API_TOKEN] = process.argv;

if (!API_TOKEN) {
  console.error('Usage: node tools/disable-pages-site-analytics.js <API_TOKEN>');
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

async function getAccountId() {
  console.log('🔍 Fetching account...');
  const resp = await makeRequest('GET', '/client/v4/accounts');
  if (!resp.success || !resp.data.result?.length) {
    throw new Error('No accounts found');
  }
  return resp.data.result[0].id;
}

async function disableAnalytics() {
  try {
    const ACCOUNT_ID = await getAccountId();
    console.log(`✅ Account ID: ${ACCOUNT_ID}\n`);
    
    console.log('🔍 Fetching Pages projects...');
    const projectsResp = await makeRequest('GET', `/client/v4/accounts/${ACCOUNT_ID}/pages/projects`);
    
    if (!projectsResp.success) {
      throw new Error('Failed to fetch projects');
    }

    const project = projectsResp.data.result.find(p => p.name === 'clododev');
    if (!project) {
      console.log('❌ clododev project not found');
      return;
    }

    console.log(`📄 Project: ${project.name}`);
    console.log(`   Web Analytics: ${project.web_analytics_enabled ? '✅ ENABLED' : '❌ DISABLED'}\n`);

    if (project.web_analytics_enabled) {
      console.log('🧹 Disabling Web Analytics...\n');
      
      const disableResp = await makeRequest(
        'PATCH',
        `/client/v4/accounts/${ACCOUNT_ID}/pages/projects/clododev`,
        { web_analytics_enabled: false }
      );

      if (disableResp.success) {
        console.log('✅ SUCCESS! Web Analytics disabled\n');
        console.log('⏱️  Waiting 30 seconds for Cloudflare to process...\n');
        
        // Wait 30 seconds
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        console.log('⏱️  Waiting additional 2-3 minutes for edge cache to clear...');
        console.log('\nThen run: node tools/check-production-scripts.js\n');
      } else {
        console.log('❌ Failed:', disableResp.data.errors?.[0]?.message);
      }
    } else {
      console.log('✅ Web Analytics is already DISABLED');
      console.log('\n📝 The beacon must be coming from an old Pages deployment cache.');
      console.log('   Trying alternative approach...\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

disableAnalytics();
