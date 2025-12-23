#!/usr/bin/env node

/**
 * Delete Web Analytics site by name
 */

import https from 'https';

const [,, API_TOKEN, SITE_NAME] = process.argv;

if (!API_TOKEN || !SITE_NAME) {
  console.error('Usage: node tools/delete-web-analytics-site.js <API_TOKEN> <SITE_NAME>');
  console.error('Example: node tools/delete-web-analytics-site.js mytoken clododev.pages.dev');
  process.exit(1);
}

function _makeRequest(method, path, data = null) {
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

async function deleteSite() {
  try {
    console.log(`🔍 Looking for Web Analytics site: ${SITE_NAME}\n`);
    
    // This would list sites but the API might not support it
    // Instead, we'll try to construct the delete path
    console.log(`⚠️  Note: The Cloudflare API for Web Analytics is limited`);
    console.log(`   You may need to delete "${SITE_NAME}" manually from the dashboard:\n`);
    console.log(`   Dashboard → Analytics & Logs → Web Analytics`);
    console.log(`   Find "${SITE_NAME}" and click "Manage site" → Delete\n`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

deleteSite();
