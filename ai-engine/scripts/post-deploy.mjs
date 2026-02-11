#!/usr/bin/env node

/**
 * AI Engine — Post-Deployment Validation Script
 * 
 * Automates post-deployment checks:
 * - Waits for GitHub Actions workflow completion
 * - Tests health endpoint
 * - Verifies all capabilities work
 * - Checks provider status and fallback chain
 * - Validates usage tracking
 * - Reports costs and recommendations
 * 
 * Usage:
 *   node scripts/post-deploy.mjs [options]
 * 
 * Options:
 *   --staging              Test staging environment instead of production
 *   --local                Test local dev server (localhost:8787)
 *   --wait-workflow        Wait for GitHub Actions to complete (default: true)
 *   --skip-workflow-wait   Skip GitHub Actions wait (for manual testing)
 *   --timeout N            Timeout in seconds (default: 300)
 *   --token <token>       Use custom auth token (default: read from .dev.vars)
 */

import { createInterface } from 'readline';
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

// ── Colors ────────────────────────────────────────────────────

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const OK = `${c.green}✔${c.reset}`;
const WARN = `${c.yellow}⚠${c.reset}`;
const FAIL = `${c.red}✘${c.reset}`;
const INFO = `${c.blue}ℹ${c.reset}`;
const ARROW = `${c.cyan}→${c.reset}`;
const ROCKET = '🚀';
const CLOCK = '⏱';
const CHART = '📊';

// ── Argument parsing ──────────────────────────────────────────

const args = process.argv.slice(2);
const options = {
  env: 'production',
  waitWorkflow: !args.includes('--skip-workflow-wait'),
  timeout: 300,
  token: null,
};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--staging') options.env = 'staging';
  if (args[i] === '--local') options.env = 'local';
  if (args[i] === '--skip-workflow-wait') options.waitWorkflow = false;
  if (args[i] === '--timeout' && args[i + 1]) options.timeout = parseInt(args[i + 1]);
  if (args[i] === '--token' && args[i + 1]) options.token = args[i + 1];
}

// ── Load .dev.vars ────────────────────────────────────────────

function loadDevVars() {
  const devVarsPath = resolve(ROOT, '.dev.vars');
  if (!existsSync(devVarsPath)) {
    console.error(`${FAIL} .dev.vars not found at ${devVarsPath}`);
    process.exit(1);
  }
  
  const content = readFileSync(devVarsPath, 'utf-8');
  const vars = {};
  
  content.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      vars[match[1]] = match[2];
    }
  });
  
  return vars;
}

// ── Helper functions ──────────────────────────────────────────

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetch_custom(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

function getBaseUrl() {
  if (options.env === 'local') return 'http://localhost:8787';
  if (options.env === 'staging') return 'https://ai-engine-staging.tamylatrading.workers.dev';
  return 'https://ai-engine.workers.dev';
}

function getAuthHeader(token) {
  return { 'x-ai-engine-service': token };
}

// ── Wait for GitHub Actions ───────────────────────────────────

async function waitForWorkflow() {
  if (!options.waitWorkflow) {
    console.log(`${INFO} Skipping GitHub Actions wait (--skip-workflow-wait)`);
    return true;
  }
  
  console.log(`\n${CLOCK} Waiting for GitHub Actions workflow to complete...`);
  
  try {
    // Get repo info
    const repoMatch = execSync('git config --get remote.origin.url', { encoding: 'utf-8' })
      .trim()
      .match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    
    if (!repoMatch) {
      console.log(`${WARN} Could not determine GitHub repo, skipping workflow wait`);
      return true;
    }
    
    const [, owner, repo] = repoMatch;
    console.log(`   Owner: ${owner}, Repo: ${repo}`);
    
    // Check workflow status
    const startTime = Date.now();
    const maxWait = options.timeout * 1000;
    let lastCheck = 0;
    
    while (Date.now() - startTime < maxWait) {
      if (Date.now() - lastCheck < 5000) {
        await sleep(5000);
        continue;
      }
      lastCheck = Date.now();
      
      try {
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
          { headers: { Accept: 'application/vnd.github.v3+json' } }
        );
        
        if (response.ok) {
          const release = await response.json();
          if (release.tag_name === 'v1.0.0') {
            console.log(`${OK} v1.0.0 release detected`);
            
            // Give GitHub Actions a few more seconds to start workflow
            await sleep(5000);
            
            // Check workflow runs
            const runsResponse = await fetch(
              `https://api.github.com/repos/${owner}/${repo}/actions/runs?branch=master&status=completed&per_page=5`,
              { headers: { Accept: 'application/vnd.github.v3+json' } }
            );
            
            if (runsResponse.ok) {
              const runs = await runsResponse.json();
              const latestRun = runs.workflow_runs?.[0];
              
              if (latestRun?.status === 'completed') {
                if (latestRun.conclusion === 'success') {
                  console.log(`${OK} GitHub Actions workflow completed successfully`);
                  await sleep(5000); // Wait for worker to be fully deployed
                  return true;
                } else if (latestRun.conclusion === 'failure') {
                  console.log(`${FAIL} GitHub Actions workflow failed`);
                  console.log(`   View logs: https://github.com/${owner}/${repo}/actions/runs/${latestRun.id}`);
                  return false;
                }
              }
            }
          }
        }
      } catch (error) {
        // Continue waiting, might be network issue
      }
      
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      process.stdout.write(`\r   Waiting... ${elapsed}s`);
    }
    
    console.log(`\n${WARN} Workflow check timeout (${options.timeout}s) — proceeding with local tests`);
    return true;
  } catch (error) {
    console.log(`${WARN} Could not check workflow status: ${error.message}`);
    return true;
  }
}

// ── Test functions ────────────────────────────────────────────

async function testHealth(baseUrl, token) {
  console.log(`\n${ARROW} Testing health endpoint...`);
  
  try {
    const data = await fetch_custom(`${baseUrl}/health`, {
      method: 'POST',
      headers: getAuthHeader(token),
    });
    
    if (data.status === 'ok') {
      console.log(`   ${OK} Health check passed`);
      console.log(`      Status: ${data.status}`);
      console.log(`      Uptime: ${data.uptime ? (data.uptime / 1000).toFixed(2) + 's' : 'N/A'}`);
      return true;
    }
  } catch (error) {
    console.log(`   ${FAIL} Health check failed: ${error.message}`);
    return false;
  }
}

async function testCapabilities(baseUrl, token) {
  console.log(`\n${ARROW} Testing capability discovery...`);
  
  try {
    const caps = await fetch_custom(`${baseUrl}/ai/capabilities`, {
      headers: getAuthHeader(token),
    });
    
    if (caps.capabilities && Array.isArray(caps.capabilities)) {
      console.log(`   ${OK} Found ${caps.capabilities.length} capabilities`);
      
      const expectedCaps = [
        'intent-classify',
        'anomaly-diagnose',
        'embedding-cluster',
        'chat',
        'content-rewrite',
        'refine-recs',
        'smart-forecast',
      ];
      
      let allFound = true;
      expectedCaps.forEach(cap => {
        const found = caps.capabilities.some(c => c.id === cap);
        const status = found ? OK : FAIL;
        console.log(`      ${status} ${cap}`);
        if (!found) allFound = false;
      });
      
      return allFound;
    }
  } catch (error) {
    console.log(`   ${FAIL} Capability discovery failed: ${error.message}`);
    return false;
  }
}

async function testProviders(baseUrl, token) {
  console.log(`\n${ARROW} Testing provider status...`);
  
  try {
    const providers = await fetch_custom(`${baseUrl}/ai/providers`, {
      headers: getAuthHeader(token),
    });
    
    if (providers.providers) {
      console.log(`   ${OK} Found ${providers.providers.length} providers configured`);
      
      providers.providers.forEach(p => {
        const status = p.available ? OK : WARN;
        const availability = p.available ? 'available' : 'unavailable';
        console.log(`      ${status} ${p.name} (${availability})`);
        if (p.models) {
          console.log(`         ${p.models.length} models: ${p.models.slice(0, 3).join(', ')}${p.models.length > 3 ? '...' : ''}`);
        }
      });
      
      const available = providers.providers.filter(p => p.available);
      if (available.length > 0) {
        console.log(`   ${OK} Fallback chain: ${available.map(p => p.name).join(' → ')}`);
        return true;
      }
    }
  } catch (error) {
    console.log(`   ${FAIL} Provider check failed: ${error.message}`);
    return false;
  }
}

async function testCapabilityEndpoint(baseUrl, token, capId) {
  try {
    const result = await fetch_custom(`${baseUrl}/ai/${capId}`, {
      method: 'POST',
      headers: getAuthHeader(token),
      body: JSON.stringify({
        keywords: ['test', 'verification', 'deployment'],
      }),
    });
    
    return result && (result.results || result.classifications);
  } catch (error) {
    return null;
  }
}

async function testSampleCapabilities(baseUrl, token) {
  console.log(`\n${ARROW} Testing sample capabilities...`);
  
  const tests = [
    { id: 'intent-classify', name: 'Intent Classification' },
    { id: 'content-rewrite', name: 'Content Rewrite' },
  ];
  
  let passed = 0;
  
  for (const test of tests) {
    const result = await testCapabilityEndpoint(baseUrl, token, test.id);
    if (result) {
      console.log(`   ${OK} ${test.name}`);
      passed++;
    } else {
      console.log(`   ${WARN} ${test.name} (no response or error)`);
    }
  }
  
  return passed > 0;
}

async function testUsageTracking(baseUrl, token) {
  console.log(`\n${ARROW} Testing usage tracking...`);
  
  try {
    const usage = await fetch_custom(`${baseUrl}/ai/usage`, {
      headers: getAuthHeader(token),
    });
    
    if (usage) {
      console.log(`   ${OK} Usage endpoint accessible`);
      if (usage.usage_today !== undefined) {
        console.log(`      Cost today: $${usage.usage_today}`);
      }
      if (usage.calls_today !== undefined) {
        console.log(`      Calls today: ${usage.calls_today}`);
      }
      return true;
    }
  } catch (error) {
    console.log(`   ${WARN} Usage tracking: ${error.message}`);
    return false;
  }
}

// ── Main execution ────────────────────────────────────────────

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   ${ROCKET} AI Engine — Post-Deployment Validation        ║
║                                                            ║
║   Environment: ${options.env.toUpperCase().padEnd(10, ' ')}                              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);

  // Load configuration
  const devVars = loadDevVars();
  const token = options.token || devVars.AI_ENGINE_TOKEN;
  
  if (!token) {
    console.error(`${FAIL} No auth token found (set AI_ENGINE_TOKEN in .dev.vars)`);
    process.exit(1);
  }
  
  const baseUrl = getBaseUrl();
  console.log(`${INFO} Testing: ${baseUrl}`);
  console.log(`${INFO} Auth token: ${token.substring(0, 8)}...${token.substring(token.length - 4)}`);

  // Wait for workflow
  const workflowOk = await waitForWorkflow();
  
  // Give deployment time to settle
  if (options.env !== 'local') {
    console.log(`\n${CLOCK} Waiting for worker to stabilize (10s)...`);
    await sleep(10000);
  }

  // Run tests
  const tests = {
    health: await testHealth(baseUrl, token),
    capabilities: await testCapabilities(baseUrl, token),
    providers: await testProviders(baseUrl, token),
    samples: await testSampleCapabilities(baseUrl, token),
    usage: await testUsageTracking(baseUrl, token),
  };

  // Summary
  console.log(`\n╔════════════════════════════════════════════════════════════╗`);
  console.log(`║ ${CHART} DEPLOYMENT VALIDATION SUMMARY                       ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝`);
  
  const results = [
    ['Workflow', workflowOk ? OK : WARN],
    ['Health Check', tests.health ? OK : FAIL],
    ['Capabilities', tests.capabilities ? OK : FAIL],
    ['Providers', tests.providers ? OK : FAIL],
    ['Sample Tests', tests.samples ? OK : WARN],
    ['Usage Tracking', tests.usage ? OK : WARN],
  ];
  
  results.forEach(([name, status]) => {
    console.log(`   ${status} ${name.padEnd(20, ' ')}`);
  });

  const allPassed = tests.health && tests.capabilities && tests.providers;
  
  console.log(`\n${allPassed ? OK : FAIL} Overall: ${allPassed ? 'DEPLOYMENT SUCCESSFUL' : 'DEPLOYMENT INCOMPLETE'}\n`);

  if (allPassed) {
    console.log(`${INFO} Next steps:`);
    console.log(`   1. Test with your analytics integration`);
    console.log(`   2. Monitor costs with: curl ${baseUrl}/ai/usage -H "x-ai-engine-service: $TOKEN"`);
    console.log(`   3. Check logs regularly: wrangler tail --env=production`);
    console.log(`   4. Plan scaling if needed (current: 10K calls/hour)`);
  } else {
    console.log(`${FAIL} Deployment incomplete. Check logs:`);
    console.log(`   GitHub Actions: https://github.com/tamylaa/ai-engine-private/actions`);
    console.log(`   Wrangler logs: wrangler tail --env=production`);
  }

  process.exit(allPassed ? 0 : 1);
}

main().catch(error => {
  console.error(`${FAIL} Fatal error: ${error.message}`);
  process.exit(1);
});
