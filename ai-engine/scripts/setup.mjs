#!/usr/bin/env node

/**
 * AI Engine — Interactive Setup Script
 * 
 * Checks prerequisites, collects API keys, creates .dev.vars,
 * creates KV namespaces, pushes Cloudflare secrets, and validates health.
 * 
 * Usage:
 *   node scripts/setup.mjs           # Full interactive setup
 *   node scripts/setup.mjs --check   # Just check current state
 *   node scripts/setup.mjs --local   # Only set up local .dev.vars (no Cloudflare)
 */

import { createInterface } from 'readline';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { execSync, spawnSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

// ── Colors (ANSI) ────────────────────────────────────────────────────

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

// ── Readline helper ──────────────────────────────────────────────────

let rl;

function ask(question, defaultValue = '') {
  return new Promise((resolve) => {
    const suffix = defaultValue ? ` ${c.dim}(${defaultValue})${c.reset}` : '';
    rl.question(`  ${ARROW} ${question}${suffix}: `, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

function askSecret(question) {
  return new Promise((resolve) => {
    rl.question(`  ${ARROW} ${question}: `, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function confirm(question, defaultYes = true) {
  const hint = defaultYes ? 'Y/n' : 'y/N';
  const answer = await ask(`${question} [${hint}]`);
  if (!answer) return defaultYes;
  return answer.toLowerCase().startsWith('y');
}

// ── Utility ──────────────────────────────────────────────────────────

function exec(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', cwd: ROOT, stdio: 'pipe', ...opts }).trim();
  } catch (e) {
    return null;
  }
}

function fileExists(path) {
  return existsSync(resolve(ROOT, path));
}

function readFile(path) {
  try {
    return readFileSync(resolve(ROOT, path), 'utf8');
  } catch {
    return null;
  }
}

function banner() {
  console.log(`
${c.cyan}╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ${c.bold}AI Engine — Setup & Configuration${c.reset}${c.cyan}                          ║
║   Multi-model AI worker for SEO analytics                    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝${c.reset}
`);
}

// ── Secret definitions ───────────────────────────────────────────────

const SECRETS = [
  {
    key: 'AI_ENGINE_TOKEN',
    label: 'AI Engine Auth Token',
    description: 'Shared secret between visibility-analytics and ai-engine',
    required: true,
    provider: null,
    hint: 'Any secure string — you make this up (e.g. generate with: openssl rand -hex 32)',
    generate: true,
  },
  {
    key: 'ANTHROPIC_API_KEY',
    label: 'Anthropic Claude API Key',
    description: 'Best quality for SEO analysis (Claude Sonnet 4 / Opus 4)',
    required: false,
    recommended: true,
    provider: 'claude',
    hint: 'Get yours at: https://console.anthropic.com/settings/keys',
    prefix: 'sk-ant-',
  },
  {
    key: 'OPENAI_API_KEY',
    label: 'OpenAI API Key',
    description: 'GPT-4o, o1, Codex — strong alternative',
    required: false,
    provider: 'openai',
    hint: 'Get yours at: https://platform.openai.com/api-keys',
    prefix: 'sk-',
  },
  {
    key: 'GOOGLE_AI_API_KEY',
    label: 'Google Gemini API Key',
    description: 'Gemini 2.0 Flash (fast & cheap) and Gemini 2.5 Pro',
    required: false,
    provider: 'gemini',
    hint: 'Get yours at: https://aistudio.google.com/app/apikey',
  },
  {
    key: 'MISTRAL_API_KEY',
    label: 'Mistral AI API Key',
    description: 'Mistral Large, Codestral — great value',
    required: false,
    provider: 'mistral',
    hint: 'Get yours at: https://console.mistral.ai/api-keys',
  },
  {
    key: 'DEEPSEEK_API_KEY',
    label: 'DeepSeek API Key',
    description: 'DeepSeek V3/R1 — excellent quality, lowest cost',
    required: false,
    provider: 'deepseek',
    hint: 'Get yours at: https://platform.deepseek.com/api_keys',
  },
];

// ── Phase 1: Check Prerequisites ─────────────────────────────────────

async function checkPrerequisites() {
  console.log(`\n${c.bold}Phase 1: Prerequisites${c.reset}\n`);

  const checks = {};

  // Node.js
  const nodeVersion = exec('node --version');
  if (nodeVersion) {
    console.log(`  ${OK} Node.js ${nodeVersion}`);
    checks.node = true;
  } else {
    console.log(`  ${FAIL} Node.js not found`);
    checks.node = false;
  }

  // Wrangler
  const wranglerVersion = exec('npx wrangler --version');
  if (wranglerVersion) {
    console.log(`  ${OK} Wrangler ${wranglerVersion}`);
    checks.wrangler = true;
  } else {
    console.log(`  ${FAIL} Wrangler not found — install: npm install -g wrangler`);
    checks.wrangler = false;
  }

  // Wrangler auth
  if (checks.wrangler) {
    const whoami = exec('npx wrangler whoami');
    if (whoami && !whoami.includes('not authenticated')) {
      const accountMatch = whoami.match(/account.*?["'](.+?)["']/i) || whoami.match(/(.+@.+)/);
      console.log(`  ${OK} Wrangler authenticated ${accountMatch ? `(${accountMatch[1]})` : ''}`);
      checks.wranglerAuth = true;
    } else {
      console.log(`  ${WARN} Wrangler not authenticated — run: npx wrangler login`);
      checks.wranglerAuth = false;
    }
  }

  // npm packages
  if (fileExists('node_modules/@tamyla/clodo-framework')) {
    console.log(`  ${OK} npm packages installed`);
    checks.npm = true;
  } else {
    console.log(`  ${WARN} npm packages not installed — run: npm install`);
    checks.npm = false;
  }

  // .gitignore
  const gitignore = readFile('.gitignore');
  if (gitignore?.includes('.dev.vars')) {
    console.log(`  ${OK} .gitignore covers .dev.vars`);
    checks.gitignore = true;
  } else {
    console.log(`  ${FAIL} .gitignore MISSING .dev.vars — secrets at risk!`);
    checks.gitignore = false;
  }

  return checks;
}

// ── Phase 2: Check Current State ─────────────────────────────────────

async function checkCurrentState() {
  console.log(`\n${c.bold}Phase 2: Current Configuration State${c.reset}\n`);

  const state = { locals: {}, cloudflare: {}, kv: {} };

  // Check .dev.vars
  const devVars = readFile('.dev.vars');
  if (devVars) {
    console.log(`  ${OK} .dev.vars file exists`);
    for (const secret of SECRETS) {
      const match = devVars.match(new RegExp(`^${secret.key}=(.+)$`, 'm'));
      if (match && match[1] && !match[1].includes('your-') && !match[1].includes('-here')) {
        state.locals[secret.key] = true;
        console.log(`    ${OK} ${secret.key} ${c.dim}(set)${c.reset}`);
      } else {
        state.locals[secret.key] = false;
        console.log(`    ${secret.required || secret.recommended ? WARN : c.dim + '·' + c.reset} ${secret.key} ${c.dim}(not set)${c.reset}`);
      }
    }
  } else {
    console.log(`  ${WARN} No .dev.vars file — local dev will use dev-mode auth`);
  }

  // Check KV namespace IDs in wrangler.toml
  const wrangler = readFile('config/wrangler.toml');
  if (wrangler) {
    const kvMatch = wrangler.match(/binding\s*=\s*"KV_AI"\s*\n\s*id\s*=\s*"([^"]*)"/);
    if (kvMatch && kvMatch[1]) {
      console.log(`  ${OK} KV_AI namespace ID: ${c.dim}${kvMatch[1].substring(0, 12)}...${c.reset}`);
      state.kv.main = kvMatch[1];
    } else {
      console.log(`  ${WARN} KV_AI namespace ID not set in wrangler.toml`);
      state.kv.main = null;
    }
  }

  // Check Cloudflare secrets (only if wrangler is available)
  const wranglerAvailable = exec('npx wrangler --version');
  if (wranglerAvailable) {
    console.log(`\n  ${INFO} Checking Cloudflare deployed secrets...`);
    const secretList = exec('npx wrangler secret list --config config/wrangler.toml 2>&1');
    if (secretList && !secretList.includes('error') && !secretList.includes('not found')) {
      for (const secret of SECRETS) {
        if (secretList.includes(secret.key)) {
          state.cloudflare[secret.key] = true;
          console.log(`    ${OK} ${secret.key} ${c.dim}(deployed to CF)${c.reset}`);
        } else {
          state.cloudflare[secret.key] = false;
          console.log(`    ${secret.required ? WARN : c.dim + '·' + c.reset} ${secret.key} ${c.dim}(not in CF)${c.reset}`);
        }
      }
    } else {
      console.log(`    ${WARN} Could not list CF secrets (worker may not be deployed yet)`);
    }
  }

  return state;
}

// ── Phase 3: Collect Secrets ─────────────────────────────────────────

async function collectSecrets(state) {
  console.log(`\n${c.bold}Phase 3: Configure Secrets${c.reset}\n`);

  const collected = {};

  // Load existing .dev.vars values
  const devVars = readFile('.dev.vars');
  const existing = {};
  if (devVars) {
    for (const line of devVars.split('\n')) {
      const match = line.match(/^([A-Z_]+)=(.+)$/);
      if (match && !match[2].includes('your-') && !match[2].includes('-here')) {
        existing[match[1]] = match[2];
      }
    }
  }

  for (const secret of SECRETS) {
    console.log(`\n  ${c.bold}${secret.label}${c.reset}`);
    console.log(`  ${c.dim}${secret.description}${c.reset}`);

    if (existing[secret.key]) {
      const masked = maskSecret(existing[secret.key]);
      console.log(`  ${c.dim}Current value: ${masked}${c.reset}`);
      const keep = await confirm('Keep current value?', true);
      if (keep) {
        collected[secret.key] = existing[secret.key];
        continue;
      }
    }

    console.log(`  ${c.dim}${secret.hint}${c.reset}`);

    if (secret.generate) {
      const useGenerated = await confirm('Auto-generate a secure token?', true);
      if (useGenerated) {
        collected[secret.key] = generateToken();
        console.log(`  ${OK} Generated: ${maskSecret(collected[secret.key])}`);
        continue;
      }
    }

    const value = await askSecret(`Enter ${secret.key}`);
    if (value) {
      // Basic validation
      if (secret.prefix && !value.startsWith(secret.prefix)) {
        console.log(`  ${WARN} Expected key to start with "${secret.prefix}" — are you sure?`);
        const proceed = await confirm('Use this value anyway?', false);
        if (!proceed) continue;
      }
      collected[secret.key] = value;
      console.log(`  ${OK} Set: ${maskSecret(value)}`);
    } else if (secret.required) {
      console.log(`  ${FAIL} ${secret.key} is required!`);
      const value2 = await askSecret(`Enter ${secret.key} (required)`);
      if (value2) collected[secret.key] = value2;
    } else {
      console.log(`  ${c.dim}  Skipped — ${secret.provider || 'this'} provider won't be available${c.reset}`);
    }
  }

  // AI_PROVIDER preference
  console.log(`\n  ${c.bold}Provider Routing${c.reset}`);
  const providers = SECRETS.filter(s => s.provider && collected[s.key]).map(s => s.provider);
  if (providers.length > 0) {
    console.log(`  ${c.dim}Available providers: ${providers.join(', ')}, cloudflare (free fallback)${c.reset}`);
  }
  const providerChoice = await ask('AI_PROVIDER (auto = smart routing)', 'auto');
  collected.AI_PROVIDER = providerChoice;

  return collected;
}

// ── Phase 4: Write .dev.vars ─────────────────────────────────────────

async function writeDevVars(collected) {
  console.log(`\n${c.bold}Phase 4: Write Local Config${c.reset}\n`);

  const lines = [
    '# ═══════════════════════════════════════════════════════════════',
    '# AI Engine — Local Development Secrets',
    `# Generated by setup script on ${new Date().toISOString().split('T')[0]}`,
    '# WARNING: NEVER commit this file. It is gitignored.',
    '# ═══════════════════════════════════════════════════════════════',
    '',
  ];

  // Auth
  if (collected.AI_ENGINE_TOKEN) {
    lines.push('# Authentication');
    lines.push(`AI_ENGINE_TOKEN=${collected.AI_ENGINE_TOKEN}`);
    lines.push('');
  }

  // Provider keys
  lines.push('# Provider API Keys');
  for (const secret of SECRETS) {
    if (secret.key === 'AI_ENGINE_TOKEN') continue;
    if (collected[secret.key]) {
      lines.push(`${secret.key}=${collected[secret.key]}`);
    } else {
      lines.push(`# ${secret.key}=  # not configured`);
    }
  }
  lines.push('');

  // Routing
  lines.push('# Provider Routing');
  lines.push(`AI_PROVIDER=${collected.AI_PROVIDER || 'auto'}`);
  lines.push('');

  const content = lines.join('\n');
  const devVarsPath = resolve(ROOT, '.dev.vars');

  if (fileExists('.dev.vars')) {
    const overwrite = await confirm('.dev.vars already exists. Overwrite?', false);
    if (!overwrite) {
      console.log(`  ${INFO} Kept existing .dev.vars`);
      return;
    }
  }

  writeFileSync(devVarsPath, content, 'utf8');
  console.log(`  ${OK} Written: .dev.vars`);

  // Verify it's gitignored
  const gitignore = readFile('.gitignore');
  if (!gitignore?.includes('.dev.vars')) {
    console.log(`  ${FAIL} WARNING: .dev.vars is NOT in .gitignore! Adding it now...`);
    const updatedGitignore = (gitignore || '') + '\n.dev.vars\n';
    writeFileSync(resolve(ROOT, '.gitignore'), updatedGitignore, 'utf8');
    console.log(`  ${OK} Added .dev.vars to .gitignore`);
  }
}

// ── Phase 5: KV Namespaces ───────────────────────────────────────────

async function setupKV() {
  console.log(`\n${c.bold}Phase 5: KV Namespaces${c.reset}\n`);

  const wrangler = readFile('config/wrangler.toml');
  if (!wrangler) {
    console.log(`  ${FAIL} config/wrangler.toml not found`);
    return;
  }

  // Check if KV IDs are already set
  const kvMatch = wrangler.match(/binding\s*=\s*"KV_AI"\s*\n\s*id\s*=\s*"([^"]*)"/);
  if (kvMatch && kvMatch[1]) {
    console.log(`  ${OK} KV_AI already configured: ${kvMatch[1].substring(0, 12)}...`);
    return;
  }

  const create = await confirm('Create KV namespace for ai-engine?', true);
  if (!create) {
    console.log(`  ${INFO} Skipped — KV features (usage tracking, rate limiting) won't work`);
    return;
  }

  // Create main namespace
  console.log(`  ${INFO} Creating KV_AI namespace...`);
  const result = exec('npx wrangler kv namespace create KV_AI --config config/wrangler.toml 2>&1');
  if (!result) {
    console.log(`  ${FAIL} Failed to create KV namespace. Run manually: npx wrangler kv namespace create KV_AI`);
    return;
  }

  const idMatch = result.match(/id\s*=\s*"([a-f0-9]+)"/);
  if (!idMatch) {
    console.log(`  ${WARN} Created but couldn't parse ID. Output:\n${result}`);
    return;
  }

  const kvId = idMatch[1];
  console.log(`  ${OK} Created KV_AI namespace: ${kvId}`);

  // Update wrangler.toml — replace empty IDs
  let updated = wrangler;
  let replacements = 0;

  // Update main binding
  updated = updated.replace(
    /(binding\s*=\s*"KV_AI"\s*\n\s*id\s*=\s*")(")/,
    (match, prefix, suffix) => {
      replacements++;
      return `${prefix}${kvId}${suffix}`;
    }
  );

  // Update staging binding
  updated = updated.replace(
    /(env\.staging\.kv_namespaces[^]*?binding\s*=\s*"KV_AI"\s*\n\s*id\s*=\s*")(")/,
    (match, prefix, suffix) => {
      replacements++;
      return `${prefix}${kvId}${suffix}`;
    }
  );

  // Update production binding
  updated = updated.replace(
    /(env\.production\.kv_namespaces[^]*?binding\s*=\s*"KV_AI"\s*\n\s*id\s*=\s*")(")/,
    (match, prefix, suffix) => {
      replacements++;
      return `${prefix}${kvId}${suffix}`;
    }
  );

  if (replacements > 0) {
    writeFileSync(resolve(ROOT, 'config/wrangler.toml'), updated, 'utf8');
    console.log(`  ${OK} Updated wrangler.toml with KV_AI ID (${replacements} binding${replacements > 1 ? 's' : ''})`);
  }
}

// ── Phase 6: Push Secrets to Cloudflare ──────────────────────────────

async function pushSecrets(collected) {
  console.log(`\n${c.bold}Phase 6: Deploy Secrets to Cloudflare${c.reset}\n`);

  const push = await confirm('Push secrets to Cloudflare? (Required for deployment)', true);
  if (!push) {
    console.log(`  ${INFO} Skipped — remember to push secrets before deploying`);
    return;
  }

  const secretsToPush = Object.entries(collected).filter(
    ([key]) => key !== 'AI_PROVIDER' && collected[key]
  );

  if (secretsToPush.length === 0) {
    console.log(`  ${WARN} No secrets to push`);
    return;
  }

  console.log(`  ${INFO} Pushing ${secretsToPush.length} secrets to Cloudflare...\n`);

  let success = 0;
  let failed = 0;

  for (const [key, value] of secretsToPush) {
    try {
      // Use spawn with stdin to avoid shell escaping issues
      const proc = spawnSync('npx', ['wrangler', 'secret', 'put', key, '--config', 'config/wrangler.toml'], {
        input: value,
        encoding: 'utf8',
        cwd: ROOT,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000,
      });

      if (proc.status === 0) {
        console.log(`    ${OK} ${key}`);
        success++;
      } else {
        console.log(`    ${FAIL} ${key}: ${proc.stderr?.trim() || 'unknown error'}`);
        failed++;
      }
    } catch (err) {
      console.log(`    ${FAIL} ${key}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n  ${INFO} Pushed: ${success} succeeded, ${failed} failed`);
}

// ── Phase 7: Validate ────────────────────────────────────────────────

async function validate(collected) {
  console.log(`\n${c.bold}Phase 7: Validation Summary${c.reset}\n`);

  // Count configured providers
  const configuredProviders = SECRETS
    .filter(s => s.provider && collected[s.key])
    .map(s => s.provider);

  // Always have Cloudflare AI as fallback
  configuredProviders.push('cloudflare');

  console.log(`  ${c.bold}Providers:${c.reset}`);
  const allProviders = ['claude', 'openai', 'gemini', 'mistral', 'deepseek', 'cloudflare'];
  for (const p of allProviders) {
    const configured = configuredProviders.includes(p);
    const marker = configured ? OK : `${c.dim}·${c.reset}`;
    const notes = [];
    if (p === 'cloudflare') notes.push('free fallback, always available');
    if (p === 'claude' && configured) notes.push('preferred for complex tasks');
    if (p === 'deepseek' && configured) notes.push('lowest cost');
    console.log(`    ${marker} ${p}${notes.length ? ` ${c.dim}(${notes.join(', ')})${c.reset}` : ''}`);
  }

  // Auth
  console.log(`\n  ${c.bold}Authentication:${c.reset}`);
  if (collected.AI_ENGINE_TOKEN) {
    console.log(`    ${OK} AI_ENGINE_TOKEN configured`);
  } else {
    console.log(`    ${WARN} AI_ENGINE_TOKEN not set — dev mode only`);
  }

  // KV
  console.log(`\n  ${c.bold}Storage:${c.reset}`);
  const wrangler = readFile('config/wrangler.toml');
  const kvMatch = wrangler?.match(/binding\s*=\s*"KV_AI"\s*\n\s*id\s*=\s*"([^"]+)"/);
  if (kvMatch && kvMatch[1]) {
    console.log(`    ${OK} KV_AI namespace configured`);
  } else {
    console.log(`    ${WARN} KV_AI not configured — no usage tracking or rate limiting`);
  }

  // Security
  console.log(`\n  ${c.bold}Security:${c.reset}`);
  const gitignore = readFile('.gitignore');
  console.log(`    ${gitignore?.includes('.dev.vars') ? OK : FAIL} .dev.vars in .gitignore`);
  console.log(`    ${gitignore?.includes('.env') ? OK : FAIL} .env in .gitignore`);
  console.log(`    ${fileExists('.dev.vars') ? OK : WARN} .dev.vars file exists`);

  // Next steps
  console.log(`\n  ${c.bold}Next Steps:${c.reset}`);
  const steps = [];
  if (!fileExists('node_modules')) steps.push('npm install');
  steps.push('npm run dev          # Start local dev server');
  steps.push('npm run test         # Run tests');
  steps.push('npm run deploy       # Deploy to Cloudflare');
  for (const step of steps) {
    console.log(`    ${ARROW} ${step}`);
  }

  console.log(`\n${c.green}${c.bold}Setup complete!${c.reset}\n`);
}

// ── Helpers ──────────────────────────────────────────────────────────

function maskSecret(value) {
  if (!value || value.length < 8) return '****';
  return value.substring(0, 4) + '•'.repeat(Math.min(value.length - 8, 20)) + value.substring(value.length - 4);
}

function generateToken() {
  // Generate a secure random token (hex string, 32 bytes = 64 chars)
  try {
    return randomBytes(32).toString('hex');
  } catch {
    // Fallback if crypto fails
    const bytes = new Uint8Array(32);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');
  const localOnly = args.includes('--local');

  banner();

  rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    // Phase 1: Prerequisites
    const prereqs = await checkPrerequisites();

    // Phase 2: Current state
    const state = await checkCurrentState();

    if (checkOnly) {
      rl.close();
      return;
    }

    // Phase 3: Collect secrets interactively
    const collected = await collectSecrets(state);

    // Phase 4: Write .dev.vars
    await writeDevVars(collected);

    if (!localOnly && prereqs.wrangler && prereqs.wranglerAuth) {
      // Phase 5: KV namespaces
      await setupKV();

      // Phase 6: Push secrets to Cloudflare
      await pushSecrets(collected);
    } else if (!localOnly) {
      console.log(`\n  ${WARN} Skipping Cloudflare setup (wrangler not available or not authenticated)`);
    }

    // Phase 7: Validate
    await validate(collected);
  } catch (err) {
    console.error(`\n  ${FAIL} Setup failed: ${err.message}\n`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
