#!/usr/bin/env node

/**
 * Disable Cloudflare Pages Web Analytics auto-injection
 * This disables analytics at the Pages project level
 */

import https from 'https';

// Import tooling config for project name
let PROJECT_NAME = 'my-website';
try {
  const { getConfig } = await import('../config/tooling.config.js');
  PROJECT_NAME = getConfig().cloudflare.projectName;
} catch (e) {
  console.warn('⚠️  Could not load tooling config, using default project name');
}

const [,, API_TOKEN] = process.argv;

if (!API_TOKEN) {
  console.error('Usage: node tools/disable-pages-analytics.js <API_TOKEN>');
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
  const account = resp.data.result[0];
  console.log(`✅ Account: ${account.name}\n`);
  return account.id;
}

async function disablePagesAnalytics() {
  try {
    const ACCOUNT_ID = await getAccountId();
    
    console.log('🔍 Fetching Pages projects...');
    const projectsResp = await makeRequest('GET', `/client/v4/accounts/${ACCOUNT_ID}/pages/projects`);
    
    if (!projectsResp.success || !projectsResp.data.result?.length) {
      console.log('❌ No Pages projects found');
      return;
    }

    const project = projectsResp.data.result.find(p => p.name === PROJECT_NAME);
    if (!project) {
      console.log(`❌ ${PROJECT_NAME} project not found`);
      return;
    }

    console.log(`📄 Found project: ${project.name}`);
    console.log(`   Web Analytics: ${project.web_analytics_enabled ? '✅ ENABLED' : '❌ DISABLED'}\n`);

    if (!project.web_analytics_enabled) {
      console.log('✅ Web Analytics is already DISABLED on this project');
      console.log('\n📝 The beacon might still be cached at Cloudflare edge.');
      console.log('   Try purging cache or waiting 5-10 minutes for full propagation.');
      return;
    }

    console.log('🧹 Disabling Web Analytics on Pages project...\n');
    
    // Disable analytics
    const disableResp = await makeRequest(
      'PATCH',
      `/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}`,
      {
        web_analytics_enabled: false
      }
    );

    if (disableResp.success) {
      console.log('✅ Web Analytics DISABLED successfully!\n');
      console.log('⏱️  Wait 2-3 minutes for edge cache to clear');
      console.log('   Then run: node tools/check-production-scripts.js\n');
      console.log('The auto-injected beacon should now be gone.');
    } else {
      console.log('❌ Failed to disable:', disableResp.data.errors?.[0]?.message);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

disablePagesAnalytics();
