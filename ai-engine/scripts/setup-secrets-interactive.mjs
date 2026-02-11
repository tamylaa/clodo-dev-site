#!/usr/bin/env node

/**
 * AI Engine — Interactive GitHub Secrets Setup
 *
 * Collects missing secrets interactively and shows
 * exactly what to copy-paste into GitHub Actions.
 *
 * Usage:
 *   node scripts/setup-secrets-interactive.mjs
 */

import { createInterface } from 'readline';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

const OK = `${c.green}✔${c.reset}`;
const WARN = `${c.yellow}⚠${c.reset}`;
const FAIL = `${c.red}✘${c.reset}`;
const INFO = `${c.blue}ℹ${c.reset}`;
const ARROW = `${c.cyan}→${c.reset}`;
const ROCKET = '🚀';

let rl;

function ask(question, defaultValue = '', hideInput = false) {
  return new Promise((resolve) => {
    if (hideInput) {
      // For sensitive input, we'll just use regular input but mask it in display
      console.log(`${question}`);
      rl.question('→ ', (answer) => {
        const value = answer.trim() || defaultValue;
        console.log(`${'*'.repeat(Math.min(value.length, 20))}...`);
        resolve(value);
      });
    } else {
      rl.question(`${question}`, (answer) => {
        resolve(answer.trim() || defaultValue);
      });
    }
  });
}

function loadDevVars() {
  const devVarsPath = resolve(ROOT, '.dev.vars');
  if (!existsSync(devVarsPath)) {
    console.error(`${FAIL} .dev.vars not found at ${devVarsPath}`);
    process.exit(1);
  }

  const content = readFileSync(devVarsPath, 'utf-8');
  const vars = {};

  content.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+?)=(.*)$/);
    if (match) {
      vars[match[1].trim()] = match[2].trim();
    }
  });

  return vars;
}

function maskSecret(value) {
  if (!value) return '';
  if (value.length <= 8) return '*'.repeat(value.length);
  return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
}

async function collectCloudflareToken() {
  console.log(`\n${ARROW} ${c.bold}Cloudflare API Token${c.reset}`);
  console.log(`   This token needs Workers deploy permissions.`);
  console.log(`   ${c.blue}Create at:${c.reset} https://dash.cloudflare.com/profile/api-tokens`);
  console.log(`   ${c.yellow}Required permissions:${c.reset}`);
  console.log(`   • Account: Cloudflare Workers:Edit`);
  console.log(`   • Account: Cloudflare Workers KV Storage:Edit`);
  console.log(`   • Account: Cloudflare Workers Scripts:Edit`);
  console.log(`   • Zone: Zone:Read (for your domain)`);

  const token = await ask(`Enter CLOUDFLARE_API_TOKEN: `, '', true);

  if (!token || token.length < 40) {
    console.log(`${FAIL} Token appears invalid (too short)`);
    return null;
  }

  // Basic validation - should start with specific patterns
  if (!token.startsWith('API_TOKEN_') && !token.startsWith('v1.')) {
    console.log(`${WARN} Token doesn't match expected format, but continuing...`);
  }

  return token;
}

async function collectCloudflareAccountId() {
  console.log(`\n${ARROW} ${c.bold}Cloudflare Account ID${c.reset}`);
  console.log(`   Found in your Cloudflare Workers dashboard.`);
  console.log(`   ${c.blue}Location:${c.reset} https://dash.cloudflare.com/workers → Sidebar → Account ID`);
  console.log(`   ${c.yellow}Format:${c.reset} 32-character hexadecimal string`);

  const accountId = await ask(`Enter CLOUDFLARE_ACCOUNT_ID: `);

  if (!accountId || !/^[a-f0-9]{32}$/.test(accountId)) {
    console.log(`${FAIL} Account ID should be 32 hexadecimal characters`);
    return null;
  }

  return accountId;
}

async function collectWorkerSubdomain() {
  console.log(`\n${ARROW} ${c.bold}Worker Subdomain${c.reset}`);
  console.log(`   Choose a subdomain for your worker.`);
  console.log(`   ${c.yellow}Examples:${c.reset} ai-engine, my-ai-api, seo-analytics`);
  console.log(`   ${c.blue}Result:${c.reset} {subdomain}.workers.dev`);

  const subdomain = await ask(`Enter CLOUDFLARE_WORKER_SUBDOMAIN: `, 'ai-engine');

  if (!subdomain || !/^[a-z0-9-]+$/.test(subdomain)) {
    console.log(`${FAIL} Subdomain must contain only lowercase letters, numbers, and hyphens`);
    return null;
  }

  return subdomain;
}

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ${ROCKET} AI Engine — Interactive Secrets Setup             ║
║                                                              ║
║   Let's collect the missing GitHub Actions secrets!          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);

  // Load existing configuration
  const devVars = loadDevVars();

  console.log(`${INFO} Found existing configuration in .dev.vars`);
  console.log(`   ✅ AI_ENGINE_TOKEN: ${maskSecret(devVars.AI_ENGINE_TOKEN)}`);
  console.log(`   ✅ ANTHROPIC_API_KEY: ${maskSecret(devVars.ANTHROPIC_API_KEY)}`);
  console.log(`   ✅ OPENAI_API_KEY: ${maskSecret(devVars.OPENAI_API_KEY)}`);

  // Initialize readline
  rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Collect missing secrets
  const secrets = {};

  console.log(`\n${c.bold}🔑 COLLECTING MISSING SECRETS${c.reset}`);
  console.log(`These are required for GitHub Actions deployment.`);

  // Cloudflare API Token
  secrets.CLOUDFLARE_API_TOKEN = await collectCloudflareToken();
  if (!secrets.CLOUDFLARE_API_TOKEN) {
    console.log(`\n${FAIL} Setup cancelled - invalid Cloudflare API token`);
    rl.close();
    process.exit(1);
  }

  // Cloudflare Account ID
  secrets.CLOUDFLARE_ACCOUNT_ID = await collectCloudflareAccountId();
  if (!secrets.CLOUDFLARE_ACCOUNT_ID) {
    console.log(`\n${FAIL} Setup cancelled - invalid Cloudflare Account ID`);
    rl.close();
    process.exit(1);
  }

  // Worker Subdomain
  secrets.CLOUDFLARE_WORKER_SUBDOMAIN = await collectWorkerSubdomain();
  if (!secrets.CLOUDFLARE_WORKER_SUBDOMAIN) {
    console.log(`\n${FAIL} Setup cancelled - invalid subdomain`);
    rl.close();
    process.exit(1);
  }

  // Reuse existing secrets
  secrets.AI_ENGINE_TOKEN = devVars.AI_ENGINE_TOKEN;
  secrets.ANTHROPIC_API_KEY = devVars.ANTHROPIC_API_KEY;
  secrets.OPENAI_API_KEY = devVars.OPENAI_API_KEY;

  rl.close();

  // Display results
  console.log(`\n${c.bold}📋 GITHUB ACTIONS SECRETS CONFIGURATION${c.reset}`);
  console.log(`Copy these to: ${c.blue}https://github.com/tamylaa/ai-engine-private/settings/secrets/actions${c.reset}`);
  console.log('');

  const requiredSecrets = [
    { name: 'CLOUDFLARE_API_TOKEN', value: secrets.CLOUDFLARE_API_TOKEN, desc: 'Cloudflare API token' },
    { name: 'CLOUDFLARE_ACCOUNT_ID', value: secrets.CLOUDFLARE_ACCOUNT_ID, desc: 'Cloudflare account ID' },
    { name: 'CLOUDFLARE_WORKER_SUBDOMAIN', value: secrets.CLOUDFLARE_WORKER_SUBDOMAIN, desc: 'Worker subdomain' },
    { name: 'AI_ENGINE_TOKEN', value: secrets.AI_ENGINE_TOKEN, desc: 'Auth token (reused)' },
    { name: 'ANTHROPIC_API_KEY', value: secrets.ANTHROPIC_API_KEY, desc: 'Claude API key (reused)' },
  ];

  const optionalSecrets = [
    { name: 'OPENAI_API_KEY', value: secrets.OPENAI_API_KEY, desc: 'OpenAI API key (reused)' },
  ];

  console.log(`${c.bold}REQUIRED SECRETS:${c.reset}`);
  requiredSecrets.forEach(secret => {
    console.log(`   ${c.green}✅${c.reset} ${secret.name}`);
    console.log(`      ${secret.desc}`);
    console.log(`      ${c.cyan}Value:${c.reset} ${maskSecret(secret.value)}`);
    console.log('');
  });

  console.log(`${c.bold}OPTIONAL SECRETS (recommended):${c.reset}`);
  optionalSecrets.forEach(secret => {
    if (secret.value) {
      console.log(`   ${c.green}✅${c.reset} ${secret.name}`);
      console.log(`      ${secret.desc}`);
      console.log(`      ${c.cyan}Value:${c.reset} ${maskSecret(secret.value)}`);
    } else {
      console.log(`   ${c.yellow}⚠️${c.reset}  ${secret.name} — not configured`);
    }
    console.log('');
  });

  // Save to a temporary file for easy copying
  const tempFile = resolve(ROOT, 'github-secrets-setup.txt');
  let content = `# GitHub Actions Secrets Setup - Generated ${new Date().toISOString()}\n`;
  content += `# Copy these to: https://github.com/tamylaa/ai-engine-private/settings/secrets/actions\n\n`;

  requiredSecrets.forEach(secret => {
    content += `${secret.name}=${secret.value}\n`;
  });

  if (secrets.OPENAI_API_KEY) {
    content += `\n# Optional\nOPENAI_API_KEY=${secrets.OPENAI_API_KEY}\n`;
  }

  writeFileSync(tempFile, content);

  console.log(`${c.bold}💾 SETUP FILE SAVED${c.reset}`);
  console.log(`   File: ${tempFile}`);
  console.log(`   Contains all secrets ready to copy-paste`);
  console.log('');

  console.log(`${c.bold}🚀 NEXT STEPS:${c.reset}`);
  console.log(`1. ${c.blue}Open:${c.reset} https://github.com/tamylaa/ai-engine-private/settings/secrets/actions`);
  console.log(`2. ${c.blue}Add each secret:${c.reset} Copy the values from above or the file`);
  console.log(`3. ${c.blue}Test deployment:${c.reset}`);
  console.log(`   git push origin master  # Staging deploy`);
  console.log(`   npm run post-deploy:staging  # Validate staging`);
  console.log(`   git tag -a v1.0.1 -m "Production release" && git push origin v1.0.1  # Production deploy`);
  console.log('');

  console.log(`${c.bold}🔒 SECURITY NOTES:${c.reset}`);
  console.log(`• Never commit the setup file (${tempFile})`);
  console.log(`• Delete the setup file after configuring secrets`);
  console.log(`• Rotate API tokens periodically`);
  console.log('');

  console.log(`${OK} Setup complete! Ready to deploy.`);
}

main().catch(error => {
  console.error(`${FAIL} Error: ${error.message}`);
  if (rl) rl.close();
  process.exit(1);
});
