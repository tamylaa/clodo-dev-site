#!/usr/bin/env node

/**
 * Cloudflare Analytics Validation Script
 *
 * Validates Cloudflare Web Analytics and Logpush provisions for a zone.
 * Can auto-discover zone/account info using API token.
 *
 * Usage:
 *   node tools/validate-cloudflare-analytics.js <API_TOKEN> [DOMAIN] [BEACON_TOKEN]
 *
 * If DOMAIN is not provided, will try to auto-discover from zones.
 * If BEACON_TOKEN is provided, will update analytics.html non-interactively.
 *
 * Prerequisites:
 * - Cloudflare API token with Zone Analytics Read and Zone Read permissions
 */

import https from 'https';
import { execSync } from 'child_process';

const API_BASE = 'https://api.cloudflare.com/client/v4';

class CloudflareValidator {
  constructor(apiToken, domain = null, beaconToken = null) {
    this.apiToken = apiToken;
    this.domain = domain;
    this.beaconToken = beaconToken;
    this.headers = {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    };
    this.accountId = null;
    this.zoneId = null;
  }

  async makeRequest(endpoint) {
    return new Promise((resolve, reject) => {
      const url = `${API_BASE}${endpoint}`;
      const options = {
        headers: this.headers
      };

      https.get(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.success) {
              resolve(json.result);
            } else {
              reject(new Error(`API Error: ${json.errors.map(e => e.message).join(', ')}`));
            }
          } catch (e) {
            reject(new Error(`HTTP ${res.statusCode}: ${data || e.message}`));
          }
        });
      }).on('error', (err) => {
        reject(new Error(`Request failed: ${err.message}`));
      });
    });
  }

  async getAccountInfo() {
    console.log('🔍 Discovering account information...');
    
    // Always get account from API first
    let apiAccountId = null;
    try {
      const accounts = await this.makeRequest('/accounts');
      if (accounts && accounts.length > 0) {
        apiAccountId = accounts[0].id;
        this.accountId = apiAccountId;
        console.log(`✅ Account ID from API: ${this.accountId} (${accounts[0].name})`);
      }
    } catch (error) {
      console.log(`❌ Could not retrieve account info from API: ${error.message}`);
      return;
    }

    // Try wrangler for comparison
    try {
      let wranglerOutput;
      try {
        wranglerOutput = execSync('npx wrangler whoami --format=json', { encoding: 'utf8' });
        const wranglerData = JSON.parse(wranglerOutput);
        const wranglerAccountId = wranglerData.account_id;
        if (wranglerAccountId !== apiAccountId) {
          console.log(`⚠️  Wrangler authenticated for different account: ${wranglerAccountId}`);
        } else {
          console.log('✅ Wrangler authentication matches API token account');
        }
      } catch (formatError) {
        // Parse plain text
        wranglerOutput = execSync('npx wrangler whoami', { encoding: 'utf8' });
        // We already have the account from API, so no need to parse
        console.log('ℹ️  Wrangler available but using API account for validation');
      }
    } catch (error) {
      console.log('ℹ️  Wrangler not available, using API discovery only');
    }
  }

  async getZoneInfo() {
    console.log('🔍 Discovering zone information...');

    if (this.domain) {
      console.log(`🔍 Looking for zone: ${this.domain}`);
    }

    try {
      const zones = await this.makeRequest('/zones');
      if (zones && zones.length > 0) {
        if (this.domain) {
          const matchingZone = zones.find(z => z.name === this.domain);
          if (matchingZone) {
            this.zoneId = matchingZone.id;
            console.log(`✅ Found zone: ${matchingZone.name} (${this.zoneId})`);
          } else {
            console.log(`❌ Zone not found for domain: ${this.domain}`);
            console.log('Available zones:');
            zones.forEach(z => console.log(`  - ${z.name} (${z.id})`));
          }
        } else {
          // Auto-select first zone
          this.zoneId = zones[0].id;
          this.domain = zones[0].name;
          console.log(`✅ Auto-selected zone: ${zones[0].name} (${this.zoneId})`);
        }
      } else {
        console.log('❌ No zones found');
      }
    } catch (error) {
      console.log(`❌ Could not retrieve zone info: ${error.message}`);
    }
  }

  async checkWebAnalytics() {
    if (!this.zoneId) return;

    console.log('\n🔍 Checking Web Analytics...');
    try {
      // Try the documented endpoint first
      const result = await this.makeRequest(`/zones/${this.zoneId}/web_analytics`);
      if (result && result.length > 0) {
        console.log('✅ Web Analytics enabled');
        result.forEach(site => {
          console.log(`  - Site: ${site.site_tag}`);
          console.log(`  - Ruleset: ${site.ruleset.id}`);
          console.log(`  - Host: ${site.host || 'All hosts'}`);
          console.log(`  - Auto-install: ${site.auto_install ? 'Yes' : 'No'}`);
          console.log(`  - Created: ${new Date(site.created_on).toLocaleDateString()}`);
        });
      } else {
        console.log('❌ Web Analytics not configured');
        console.log('  💡 Enable in: Cloudflare Dashboard → Analytics & Logs → Web Analytics');
        console.log('  📋 Note: Web Analytics data may not be available via API yet');
      }
    } catch (error) {
      if (error.message.includes('No route for that URI')) {
        console.log('⚠️  Web Analytics API endpoint not available');
        console.log('  💡 Check status in Cloudflare Dashboard → Analytics & Logs → Web Analytics');
        console.log('  📋 Web Analytics may need to be enabled and data may take time to appear');
      } else {
        console.log(`❌ Web Analytics check failed: ${error.message}`);
        console.log('  💡 Required token permission: Zone Analytics Read');
      }
    }
  }

  async checkLogpushJobs() {
    if (!this.zoneId) return;

    console.log('\n📊 Checking Logpush Jobs...');
    try {
      const jobs = await this.makeRequest(`/zones/${this.zoneId}/logpush/jobs`);
      if (jobs && jobs.length > 0) {
        console.log(`✅ ${jobs.length} Logpush job(s) configured`);
        jobs.forEach(job => {
          console.log(`  - Job ID: ${job.id}`);
          console.log(`  - Name: ${job.name}`);
          console.log(`  - Destination: ${this.maskCredentials(job.destination_conf)}`);
          console.log(`  - Dataset: ${job.dataset}`);
          console.log(`  - Enabled: ${job.enabled ? 'Yes' : 'No'}`);
          console.log(`  - Fields: ${job.logpull_options || 'Default'}`);
          console.log(`  - Last Success: ${job.last_successful_push ? new Date(job.last_successful_push).toLocaleString() : 'Never'}`);
        });
      } else {
        console.log('❌ No Logpush jobs configured');
        console.log('  💡 For enterprise analytics: Configure Logpush to BigQuery/S3/Datadog');
      }
    } catch (error) {
      if (error.message.includes('Authentication error') || error.message.includes('Unauthorized')) {
        console.log('❌ Logpush check failed: Insufficient token permissions');
        console.log('  💡 Required token permission: Zone Logs Read');
        console.log('  📋 Create new token at: https://dash.cloudflare.com/profile/api-tokens');
      } else {
        console.log(`❌ Logpush check failed: ${error.message}`);
      }
    }
  }

  async checkZoneAnalytics() {
    if (!this.zoneId) return;

    console.log('\n📈 Checking Zone Analytics Settings...');
    try {
      const settings = await this.makeRequest(`/zones/${this.zoneId}/settings`);

      const relevantSettings = [
        'privacy_pass',
        '0rtt',
        'automatic_https_rewrites',
        'opportunistic_encryption',
        'always_use_https',
        'min_tls_version',
        'ciphers',
        'security_level',
        'waf',
        'rate_limiting'
      ];

      console.log('🔧 Security & Privacy Settings:');
      relevantSettings.forEach(settingKey => {
        const setting = settings.find(s => s.id === settingKey);
        if (setting) {
          console.log(`  - ${settingKey}: ${setting.value}`);
        }
      });

      // Check for analytics-related settings
      console.log('\n🔒 Data Collection Details:');
      console.log('  - Web Analytics collects: Page views, unique visitors, referrers, user agents');
      console.log('  - Privacy: IPs are anonymized, no personal data stored');
      console.log('  - Retention: 30 days (configurable in dashboard)');
      console.log('  - Logpush can collect: Full HTTP logs, performance metrics, security events');

    } catch (error) {
      if (error.message.includes('Unauthorized')) {
        console.log('❌ Zone settings check failed: Insufficient token permissions');
        console.log('  💡 Required token permission: Zone Settings Read');
        console.log('  📋 Create new token at: https://dash.cloudflare.com/profile/api-tokens');
      } else {
        console.log(`❌ Zone settings check failed: ${error.message}`);
      }
    }
  }

  async checkPagesDeployment() {
    console.log('\n🚀 Checking Cloudflare Pages Deployment...');
    try {
      // Try to get project name from wrangler.toml
      let projectName = 'clodo-dev-site'; // Default
      try {
        const fs = await import('fs');
        const path = await import('path');
        const tomlPath = path.join(process.cwd(), 'wrangler.toml');
        const tomlContent = fs.readFileSync(tomlPath, 'utf8');
        const nameMatch = tomlContent.match(/name\s*=\s*["']([^"']+)["']/);
        if (nameMatch) {
          projectName = nameMatch[1];
        }
      } catch (error) {
        // Use default
      }

      let pagesOutput;
      try {
        pagesOutput = execSync(`wrangler pages deployment list --project-name ${projectName} --json`, { encoding: 'utf8' });
      } catch (directError) {
        // Fallback to npx
        pagesOutput = execSync(`npx wrangler pages deployment list --project-name ${projectName} --json`, { encoding: 'utf8' });
      }
      const deployments = JSON.parse(pagesOutput);
      if (deployments && deployments.length > 0) {
        const latest = deployments[0];
        console.log(`✅ Latest deployment: ${latest.id}`);
        console.log(`  - URL: ${latest.url}`);
        console.log(`  - Environment: ${latest.environment}`);
        console.log(`  - Created: ${new Date(latest.created_on).toLocaleString()}`);
        console.log(`  - Status: ${latest.latest_stage?.status || 'Unknown'}`);
      }
    } catch (error) {
      console.log('⚠️  Could not check Pages deployment (Wrangler not available, not authenticated, or project not found)');
    }
  }

  async checkAnalyticsFile() {
    console.log('\n📄 Checking analytics.html configuration...');
    try {
      const fs = await import('fs');
      const path = await import('path');

      const analyticsPath = path.join(process.cwd(), 'public', 'analytics.html');
      const content = fs.readFileSync(analyticsPath, 'utf8');

      if (content.includes('cloudflareinsights.com')) {
        console.log('✅ Analytics file configured for Cloudflare');
        if (content.includes('YOUR_CLOUDFLARE_BEACON_TOKEN')) {
          console.log('⚠️  Beacon token placeholder found - needs to be replaced');
          console.log('  💡 Get token from: Cloudflare Dashboard → Analytics & Logs → Web Analytics');
        } else {
          console.log('✅ Beacon token appears to be configured');
        }
      } else if (content.includes('googletagmanager.com')) {
        console.log('⚠️  Analytics file still contains Google Analytics');
        console.log('  💡 Migration needed - replace GA with Cloudflare beacon');
      } else {
        console.log('❌ No analytics configuration found in analytics.html');
      }
    } catch (error) {
      console.log(`❌ Could not check analytics file: ${error.message}`);
    }
  }

  async updateAnalyticsFile() {
    console.log('\n� Would you like to update analytics.html with a Cloudflare beacon token?');
    console.log('  💡 This will replace any existing analytics configuration');

    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('Enter your Cloudflare beacon token (or press Enter to skip): ', async (token) => {
        rl.close();

        if (!token.trim()) {
          console.log('⏭️  Skipping analytics file update');
          resolve();
          return;
        }

        // Validate token format (beacon tokens are typically 32 hex chars)
        if (!/^[a-f0-9]{32}$/i.test(token.trim())) {
          console.log('❌ Invalid beacon token format. Beacon tokens should be 32 hexadecimal characters.');
          console.log('  💡 Get the correct token from: Cloudflare Dashboard → Analytics & Logs → Web Analytics');
          resolve();
          return;
        }

        try {
          const fs = await import('fs');
          const path = await import('path');

          const analyticsPath = path.join(process.cwd(), 'public', 'analytics.html');
          const beaconScript = `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${token}"}'></script>`;

          // Read current content
          let content = fs.readFileSync(analyticsPath, 'utf8');

          // Remove any existing analytics scripts
          content = content.replace(/<!--[\s\S]*?-->/g, ''); // Remove HTML comments
          content = content.replace(/<script[^>]*googletagmanager\.com[^>]*>[\s\S]*?<\/script>/gi, ''); // Remove GA
          content = content.replace(/<script[^>]*cloudflareinsights\.com[^>]*>[\s\S]*?<\/script>/gi, ''); // Remove existing CF

          // Add new beacon at the end
          content = content.trim() + '\n\n' + beaconScript + '\n';

          fs.writeFileSync(analyticsPath, content);
          console.log('✅ Analytics file updated with Cloudflare beacon');
          console.log(`  📄 File: ${analyticsPath}`);

        } catch (error) {
          console.log(`❌ Failed to update analytics file: ${error.message}`);
        }

        resolve();
      });
    });
  }

  async updateAnalyticsFileNonInteractive() {
    console.log('\n📝 Updating analytics.html with provided beacon token...');

    try {
      const fs = await import('fs');
      const path = await import('path');

      const analyticsPath = path.join(process.cwd(), 'public', 'analytics.html');
      const beaconScript = `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${this.beaconToken}"}'></script>`;

      // Read current content
      let content = fs.readFileSync(analyticsPath, 'utf8');

      // Remove any existing analytics scripts
      content = content.replace(/<!--[\s\S]*?-->/g, ''); // Remove HTML comments
      content = content.replace(/<script[^>]*googletagmanager\.com[^>]*>[\s\S]*?<\/script>/gi, ''); // Remove GA
      content = content.replace(/<script[^>]*cloudflareinsights\.com[^>]*>[\s\S]*?<\/script>/gi, ''); // Remove existing CF

      // Add new beacon at the end
      content = content.trim() + '\n\n' + beaconScript + '\n';

      fs.writeFileSync(analyticsPath, content);
      console.log('✅ Analytics file updated with Cloudflare beacon');
      console.log(`  📄 File: ${analyticsPath}`);

    } catch (error) {
      console.log(`❌ Failed to update analytics file: ${error.message}`);
    }
  }

  async validate() {
    console.log('🚀 Cloudflare Analytics Validation');
    console.log('=' .repeat(60));

    // Auto-discover account and zone
    await this.getAccountInfo();
    await this.getZoneInfo();

    if (!this.zoneId) {
      console.log('\n❌ Could not determine zone ID. Please provide domain or check API token permissions.');
      return;
    }

    console.log(`\n📋 Configuration Summary:`);
    console.log(`  - Account ID: ${this.accountId || 'Unknown'}`);
    console.log(`  - Zone ID: ${this.zoneId}`);
    console.log(`  - Domain: ${this.domain}`);

    await this.checkWebAnalytics();
    await this.checkLogpushJobs();
    await this.checkZoneAnalytics();
    await this.checkPagesDeployment();
    await this.checkAnalyticsFile();

    // Update analytics file if beacon token provided
    if (this.beaconToken) {
      await this.updateAnalyticsFileNonInteractive();
    } else {
      // Offer to update analytics file if needed
      const fs = await import('fs');
      const path = await import('path');
      const analyticsPath = path.join(process.cwd(), 'public', 'analytics.html');
      try {
        const content = fs.readFileSync(analyticsPath, 'utf8');
        if (!content.includes('cloudflareinsights.com') || content.includes('YOUR_CLOUDFLARE_BEACON_TOKEN')) {
          await this.updateAnalyticsFile();
        }
      } catch (error) {
        // File doesn't exist or can't be read, offer to create it
        await this.updateAnalyticsFile();
      }
    }

    console.log('\n✅ Validation complete');
    console.log('\n📋 Recommendations:');
    if (!this.zoneId) {
      console.log('- Enable Web Analytics in Cloudflare dashboard');
    }
    console.log('- For enterprise analytics, configure Logpush to BigQuery/S3');
    console.log('- Review data retention policies in Logpush destinations');
    console.log('- Ensure GDPR/CCPA compliance for data collection');
    console.log('- Monitor analytics in Cloudflare dashboard regularly');

    console.log('\n🚀 Deployment Commands:');
    console.log('  # Deploy to Cloudflare Pages:');
    console.log('  npx wrangler pages deploy public --commit-dirty=true');
    console.log('');
    console.log('  # Verify analytics in production:');
    console.log('  # 1. Visit your site and generate some traffic');
    console.log('  # 2. Check Cloudflare Dashboard → Analytics & Logs → Web Analytics');
    console.log('  # 3. Look for page views and real-time data');
  }
}

// Main execution
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node validate-cloudflare-analytics.js <API_TOKEN> [DOMAIN] [BEACON_TOKEN]');
  console.error('Examples:');
  console.error('  node validate-cloudflare-analytics.js your_token_here');
  console.error('  node validate-cloudflare-analytics.js your_token_here clodo.dev');
  console.error('  node validate-cloudflare-analytics.js your_token_here clodo.dev your_beacon_token');
  process.exit(1);
}

const [apiToken, domain, beaconToken] = args;
const validator = new CloudflareValidator(apiToken, domain, beaconToken);
validator.validate().catch(console.error);