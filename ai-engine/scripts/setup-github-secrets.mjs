#!/usr/bin/env node

/**
 * AI Engine — GitHub Secrets Setup Helper
 *
 * Reads your .dev.vars file and generates setup commands
 * for GitHub Actions secrets. Shows what can be reused.
 *
 * Usage:
 *   node scripts/setup-github-secrets.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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
};

function loadDevVars() {
  const devVarsPath = resolve(ROOT, '.dev.vars');
  if (!existsSync(devVarsPath)) {
    console.error(`${c.red}✘ .dev.vars not found at ${devVarsPath}${c.reset}`);
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

function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🔑 GitHub Actions Secrets Setup Helper                     ║
║                                                              ║
║   Copy these values to:                                      ║
║   https://github.com/tamylaa/ai-engine-private/settings/secrets/actions ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);

  const devVars = loadDevVars();

  const secrets = [
    {
      name: 'CLOUDFLARE_API_TOKEN',
      description: 'Cloudflare API token with Workers deploy permission',
      source: 'https://dash.cloudflare.com/profile/api-tokens',
      notes: 'Create new token with Workers permissions',
      canReuse: false,
      value: null,
    },
    {
      name: 'CLOUDFLARE_ACCOUNT_ID',
      description: 'Your Cloudflare account ID',
      source: 'https://dash.cloudflare.com/workers (sidebar)',
      notes: 'Copy from Workers dashboard',
      canReuse: false,
      value: null,
    },
    {
      name: 'CLOUDFLARE_WORKER_SUBDOMAIN',
      description: 'Worker subdomain for deployment',
      source: 'Choose your preferred subdomain',
      notes: 'e.g., "ai-engine" → ai-engine.workers.dev',
      canReuse: true,
      value: 'ai-engine',
    },
    {
      name: 'AI_ENGINE_TOKEN',
      description: 'Shared auth token for API access',
      source: 'Reuse from .dev.vars',
      notes: 'Same token for all environments',
      canReuse: true,
      value: devVars.AI_ENGINE_TOKEN,
    },
    {
      name: 'ANTHROPIC_API_KEY',
      description: 'Claude API key (required)',
      source: 'Reuse from .dev.vars',
      notes: 'Primary AI provider',
      canReuse: true,
      value: devVars.ANTHROPIC_API_KEY,
    },
    {
      name: 'OPENAI_API_KEY',
      description: 'OpenAI API key (optional fallback)',
      source: 'Reuse from .dev.vars',
      notes: 'Secondary AI provider',
      canReuse: true,
      value: devVars.OPENAI_API_KEY,
    },
    {
      name: 'GOOGLE_AI_API_KEY',
      description: 'Google Gemini API key (optional)',
      source: 'https://makersuite.google.com/app/apikey',
      notes: 'Additional fallback provider',
      canReuse: true,
      value: devVars.GOOGLE_AI_API_KEY,
    },
    {
      name: 'MISTRAL_API_KEY',
      description: 'Mistral API key (optional)',
      source: 'https://console.mistral.ai/api-keys',
      notes: 'Additional fallback provider',
      canReuse: true,
      value: devVars.MISTRAL_API_KEY,
    },
    {
      name: 'DEEPSEEK_API_KEY',
      description: 'DeepSeek API key (optional)',
      source: 'https://platform.deepseek.com/api_keys',
      notes: 'Additional fallback provider',
      canReuse: true,
      value: devVars.DEEPSEEK_API_KEY,
    },
  ];

  console.log(`${c.bold}📋 REQUIRED SECRETS (must be set):${c.reset}`);
  console.log('');

  secrets.filter(s => !s.name.includes('GOOGLE') && !s.name.includes('MISTRAL') && !s.name.includes('DEEPSEEK'))
    .forEach(secret => {
      const status = secret.value ? `${c.green}✅ Ready to reuse${c.reset}` : `${c.yellow}⚠️  Need to create${c.reset}`;
      const masked = secret.value ? maskSecret(secret.value) : 'Not set';

      console.log(`${c.cyan}${secret.name}${c.reset}`);
      console.log(`   ${secret.description}`);
      console.log(`   Source: ${secret.source}`);
      console.log(`   Status: ${status}`);
      console.log(`   Value: ${masked}`);
      if (secret.notes) console.log(`   Notes: ${secret.notes}`);
      console.log('');
    });

  console.log(`${c.bold}🔄 OPTIONAL SECRETS (improve fallback chain):${c.reset}`);
  console.log('');

  secrets.filter(s => s.name.includes('GOOGLE') || s.name.includes('MISTRAL') || s.name.includes('DEEPSEEK'))
    .forEach(secret => {
      const status = secret.value ? `${c.green}✅ Ready to reuse${c.reset}` : `${c.yellow}⚠️  Not configured${c.reset}`;
      const masked = secret.value ? maskSecret(secret.value) : 'Not set';

      console.log(`${c.cyan}${secret.name}${c.reset}`);
      console.log(`   ${secret.description}`);
      console.log(`   Source: ${secret.source}`);
      console.log(`   Status: ${status}`);
      console.log(`   Value: ${masked}`);
      if (secret.notes) console.log(`   Notes: ${secret.notes}`);
      console.log('');
    });

  console.log(`${c.bold}🚀 NEXT STEPS:${c.reset}`);
  console.log('');
  console.log(`1. ${c.blue}Visit:${c.reset} https://github.com/tamylaa/ai-engine-private/settings/secrets/actions`);
  console.log('');
  console.log(`2. ${c.blue}Add secrets:${c.reset}`);
  secrets.forEach(secret => {
    if (secret.value) {
      console.log(`   ✅ ${secret.name} = ${maskSecret(secret.value)}`);
    } else if (!secret.name.includes('CLOUDFLARE')) {
      console.log(`   ⚠️  ${secret.name} = (get from ${secret.source})`);
    } else {
      console.log(`   🔑 ${secret.name} = (create at ${secret.source})`);
    }
  });
  console.log('');
  console.log(`3. ${c.blue}Test deployment:${c.reset}`);
  console.log(`   git push origin master  # Triggers staging deploy`);
  console.log(`   npm run post-deploy:staging  # Validates staging`);
  console.log(`   git tag -a v1.0.1 -m "Test release" && git push origin v1.0.1  # Production deploy`);
  console.log('');

  console.log(`${c.bold}💡 TIPS:${c.reset}`);
  console.log(`• Reuse API keys for simplicity (same billing)`);
  console.log(`• CLOUDFLARE_API_TOKEN needs Workers + KV permissions`);
  console.log(`• AI_ENGINE_TOKEN should be the same across environments`);
  console.log(`• Test with staging first before production`);
  console.log('');
}

main();
