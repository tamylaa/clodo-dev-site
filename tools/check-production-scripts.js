#!/usr/bin/env node

/**
 * Check what scripts are loading on production
 */

import https from 'https';

const url = 'https://www.clodo.dev';

console.log(`🔍 Checking scripts on ${url}...\n`);

https.get(url, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    // Find all script tags
    const scriptRegex = /<script[^>]*(?:src=["']([^"']+)["'])?[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    let scriptCount = 0;
    
    console.log('📜 Scripts found:\n');
    
    while ((match = scriptRegex.exec(data)) !== null) {
      scriptCount++;
      const src = match[1];
      const inline = match[2];
      
      if (src) {
        console.log(`${scriptCount}. External: ${src}`);
      } else if (inline && inline.trim().length > 0) {
        const preview = inline.trim().substring(0, 80).replace(/\n/g, ' ');
        console.log(`${scriptCount}. Inline: ${preview}...`);
      }
    }
    
    console.log(`\n✅ Total scripts: ${scriptCount}`);
    
    // Check for specific analytics patterns
    if (data.includes('beacon.min.js')) {
      console.log('\n⚠️  FOUND: Cloudflare Web Analytics (beacon.min.js)');
    }
    if (data.includes('gtag/js')) {
      console.log('⚠️  FOUND: Google Analytics');
    }
    if (data.includes('analytics.js')) {
      console.log('✅ FOUND: Custom analytics.js');
    }
  });
}).on('error', (err) => {
  console.error('❌ Error:', err.message);
});
