#!/usr/bin/env node

/**
 * AI Engine — Quick Secret Health Check
 * 
 * Non-interactive. Just reports what's configured and what's missing.
 * Exit code 0 = all required secrets present, 1 = something missing.
 * 
 * Usage:
 *   node scripts/check-secrets.mjs
 *   node scripts/check-secrets.mjs --verbose
 *   node scripts/check-secrets.mjs --json
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

const args = process.argv.slice(2);
const verbose = args.includes('--verbose') || args.includes('-v');
const jsonOutput = args.includes('--json');

// ── Colors ───────────────────────────────────────────────────────────

const c = process.stdout.isTTY && !jsonOutput ? {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m',
} : { reset: '', bold: '', dim: '', red: '', green: '', yellow: '', cyan: '' };

// ── Check definitions ────────────────────────────────────────────────

const CHECKS = [
  // File safety
  { category: 'security', name: '.gitignore covers .dev.vars', check: () => {
    const gi = readSafe('.gitignore');
    return gi?.includes('.dev.vars') || false;
  }, severity: 'critical' },
  
  { category: 'security', name: '.gitignore covers .env', check: () => {
    const gi = readSafe('.gitignore');
    return gi?.includes('.env') || false;
  }, severity: 'critical' },

  { category: 'security', name: '.dev.vars is not git-tracked', check: () => {
    try {
      const result = execSync('git ls-files --cached .dev.vars', { encoding: 'utf8', cwd: ROOT, stdio: 'pipe' }).trim();
      return result === '';
    } catch { return true; }
  }, severity: 'critical' },

  { category: 'security', name: 'No secrets in wrangler.toml', check: () => {
    const toml = readSafe('config/wrangler.toml');
    if (!toml) return true;
    // Check for actual API key patterns (not placeholder comments)
    const apiKeyPattern = /(?:sk-ant-api|sk-proj-|sk-[a-zA-Z0-9]{20,})/;
    return !apiKeyPattern.test(toml);
  }, severity: 'critical' },

  { category: 'security', name: 'No secrets in source code', check: () => {
    const srcFiles = findFiles('src', /\.m?js$/);
    for (const file of srcFiles) {
      const content = readSafe(file);
      if (!content) continue;
      if (/(?:sk-ant-api|sk-proj-)[a-zA-Z0-9]{20,}/.test(content)) return false;
    }
    return true;
  }, severity: 'critical' },

  // Local dev
  { category: 'local', name: '.dev.vars file exists', check: () => {
    return existsSync(resolve(ROOT, '.dev.vars'));
  }, severity: 'warn' },

  { category: 'local', name: 'AI_ENGINE_TOKEN set locally', check: () => {
    return hasDevVar('AI_ENGINE_TOKEN');
  }, severity: 'warn' },

  { category: 'local', name: 'At least one provider key set locally', check: () => {
    return hasDevVar('ANTHROPIC_API_KEY') || hasDevVar('OPENAI_API_KEY') ||
           hasDevVar('GOOGLE_AI_API_KEY') || hasDevVar('MISTRAL_API_KEY') ||
           hasDevVar('DEEPSEEK_API_KEY');
  }, severity: 'warn' },

  // Configuration
  { category: 'config', name: 'KV_AI namespace ID set', check: () => {
    const toml = readSafe('config/wrangler.toml');
    if (!toml) return false;
    const match = toml.match(/binding\s*=\s*"KV_AI"\s*\n\s*id\s*=\s*"([^"]*)"/);
    return match && match[1].length > 0;
  }, severity: 'warn' },

  { category: 'config', name: 'wrangler.toml exists', check: () => {
    return existsSync(resolve(ROOT, 'config/wrangler.toml'));
  }, severity: 'critical' },

  { category: 'config', name: 'package.json exists', check: () => {
    return existsSync(resolve(ROOT, 'package.json'));
  }, severity: 'critical' },
];

// ── Provider detail checks (verbose only) ────────────────────────────

const PROVIDER_CHECKS = [
  { provider: 'claude', key: 'ANTHROPIC_API_KEY', label: 'Anthropic Claude', recommended: true },
  { provider: 'openai', key: 'OPENAI_API_KEY', label: 'OpenAI' },
  { provider: 'gemini', key: 'GOOGLE_AI_API_KEY', label: 'Google Gemini' },
  { provider: 'mistral', key: 'MISTRAL_API_KEY', label: 'Mistral AI' },
  { provider: 'deepseek', key: 'DEEPSEEK_API_KEY', label: 'DeepSeek' },
  { provider: 'cloudflare', key: null, label: 'Cloudflare Workers AI', alwaysAvailable: true },
];

// ── Helpers ──────────────────────────────────────────────────────────

function readSafe(relativePath) {
  try {
    return readFileSync(resolve(ROOT, relativePath), 'utf8');
  } catch { return null; }
}

function hasDevVar(key) {
  const content = readSafe('.dev.vars');
  if (!content) return false;
  const match = content.match(new RegExp(`^${key}=(.+)$`, 'm'));
  return match && match[1] && !match[1].includes('your-') && !match[1].includes('-here');
}

function findFiles(dir, pattern) {
  const results = [];
  try {
    const fullDir = resolve(ROOT, dir);
    
    function walk(d) {
      let entries;
      try { entries = readdirSync(d); } catch { return; }
      for (const entry of entries) {
        const full = resolve(d, entry);
        try {
          const stat = statSync(full);
          if (stat.isDirectory() && entry !== 'node_modules') walk(full);
          else if (pattern.test(entry)) results.push(full);
        } catch {}
      }
    }
    walk(fullDir);
  } catch {}
  return results;
}

// ── Main ─────────────────────────────────────────────────────────────

function main() {
  const results = { passed: 0, warned: 0, failed: 0, checks: [] };

  if (!jsonOutput) {
    console.log(`\n${c.cyan}${c.bold}AI Engine — Secret Health Check${c.reset}\n`);
  }

  let currentCategory = '';

  for (const check of CHECKS) {
    if (!jsonOutput && check.category !== currentCategory) {
      currentCategory = check.category;
      const labels = { security: '🔒 Security', local: '💻 Local Dev', config: '⚙️  Configuration' };
      console.log(`\n  ${c.bold}${labels[currentCategory] || currentCategory}${c.reset}`);
    }

    let passed;
    try {
      passed = check.check();
    } catch {
      passed = false;
    }

    const result = { name: check.name, category: check.category, passed, severity: check.severity };
    results.checks.push(result);

    if (passed) {
      results.passed++;
      if (!jsonOutput) console.log(`    ${c.green}✔${c.reset} ${check.name}`);
    } else if (check.severity === 'critical') {
      results.failed++;
      if (!jsonOutput) console.log(`    ${c.red}✘${c.reset} ${check.name} ${c.red}(CRITICAL)${c.reset}`);
    } else {
      results.warned++;
      if (!jsonOutput) console.log(`    ${c.yellow}⚠${c.reset} ${check.name}`);
    }
  }

  // Provider summary
  if (verbose && !jsonOutput) {
    console.log(`\n  ${c.bold}🤖 Provider Status${c.reset}`);
    for (const p of PROVIDER_CHECKS) {
      const available = p.alwaysAvailable || hasDevVar(p.key);
      const icon = available ? `${c.green}✔${c.reset}` : `${c.dim}·${c.reset}`;
      const tag = p.recommended ? ` ${c.cyan}(recommended)${c.reset}` : '';
      const free = p.alwaysAvailable ? ` ${c.dim}(free, always available)${c.reset}` : '';
      console.log(`    ${icon} ${p.label}${tag}${free}`);
    }
  }

  // Summary
  if (jsonOutput) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log(`\n  ─────────────────────────────────────`);
    console.log(`  ${c.green}✔ ${results.passed} passed${c.reset}  ${c.yellow}⚠ ${results.warned} warnings${c.reset}  ${c.red}✘ ${results.failed} critical${c.reset}`);

    if (results.failed > 0) {
      console.log(`\n  ${c.red}${c.bold}⚠ CRITICAL issues found! Run: node scripts/setup.mjs${c.reset}`);
    } else if (results.warned > 0) {
      console.log(`\n  ${c.yellow}Some optional items not configured. Run: node scripts/setup.mjs${c.reset}`);
    } else {
      console.log(`\n  ${c.green}${c.bold}All checks passed! ✨${c.reset}`);
    }
    console.log();
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

main();
