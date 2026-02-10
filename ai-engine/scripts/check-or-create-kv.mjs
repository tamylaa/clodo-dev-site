#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
// Check (and optionally create) KV namespaces required by wrangler.toml
// Usage:
//   node scripts/check-or-create-kv.mjs --env staging [--create] [--fail-if-missing]
// ═══════════════════════════════════════════════════════════════════════
import { readFileSync } from 'fs';
import { spawnSync } from 'child_process';

// ── Parse expected KV IDs from wrangler.toml for a given env ─────────
function parseExpectedIds(env) {
  const content = readFileSync(
    new URL('../config/wrangler.toml', import.meta.url),
    'utf8',
  );
  const ids = new Set();

  // Match [[env.<env>.kv_namespaces]] blocks
  const pattern = '\\[\\[env\\.' + env + '\\.kv_namespaces\\]\\]([\\s\\S]*?)(?=\\n\\[|$)';
  const kvBlockRe = new RegExp(pattern, 'gi');
  let m;
  while ((m = kvBlockRe.exec(content)) !== null) {
    const idMatch = m[1].match(/id\s*=\s*"([^"]+)"/);
    if (idMatch) ids.add(idMatch[1]);
  }

  // Fallback: top-level [[kv_namespaces]] (dev env)
  if (ids.size === 0) {
    const globalRe = /\[\[kv_namespaces\]\]([\s\S]*?)(?=\n\[|$)/gi;
    while ((m = globalRe.exec(content)) !== null) {
      const idMatch = m[1].match(/id\s*=\s*"([^"]+)"/);
      if (idMatch) ids.add(idMatch[1]);
    }
  }

  return [...ids];
}

// ── Run a command synchronously ──────────────────────────────────────
function run(cmd, args) {
  const r = spawnSync(cmd, args, {
    encoding: 'utf8',
    env: { ...process.env },
    shell: true,
  });
  if (r.error) throw r.error;
  return { code: r.status, out: (r.stdout || '') + '\n' + (r.stderr || '') };
}

// ── Extract hex IDs from wrangler output ─────────────────────────────
function extractIds(text) {
  const ids = new Set();
  for (const m of text.matchAll(/([0-9a-f]{24,64})/gi)) ids.add(m[1]);
  return [...ids];
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const envIdx = args.indexOf('--env');
  if (envIdx === -1 || !args[envIdx + 1]) {
    console.log('Usage: node scripts/check-or-create-kv.mjs --env <staging|production> [--create] [--fail-if-missing]');
    process.exit(2);
  }
  const envName = args[envIdx + 1];
  const createFlag = args.includes('--create') || process.env.CREATE_MISSING === 'true';
  const failIfMissing = args.includes('--fail-if-missing');
  const patchToml = args.includes('--patch');

  console.log(`Checking KV namespaces for env: ${envName}`);
  const expected = parseExpectedIds(envName);
  console.log('Expected KV IDs:', expected.length ? expected.join(', ') : '(none)');

  // List namespaces visible to the current token / account
  console.log('Listing KV namespaces via Wrangler...');
  const listRes = run('npx', ['wrangler', 'kv', 'namespace', 'list']);
  if (listRes.code !== 0 && !listRes.out.trim()) {
    console.error('wrangler kv:namespace list failed:', listRes.out);
    process.exit(3);
  }

  const existing = extractIds(listRes.out);
  console.log('Found KV IDs in account:', existing.length ? existing.join(', ') : '(none)');

  const missing = expected.filter((id) => !existing.includes(id));
  if (missing.length === 0) {
    console.log('All expected KV namespaces are present.');
    process.exit(0);
  }

  console.warn(`Missing KV IDs: ${missing.join(', ')}`);

  if (!createFlag) {
    console.error(
      '\nEither create these KV namespaces in the Cloudflare account or update config/wrangler.toml.',
    );
    if (failIfMissing) process.exit(4);
    process.exit(0);
  }

  // Create missing namespaces
  console.log('\nCreating missing KV namespaces...');
  const created = [];
  for (let i = 0; i < missing.length; i++) {
    const title = `KV_AI_${envName.toUpperCase()}_${i + 1}`;
    console.log(`  Creating "${title}"...`);
    const cr = run('npx', ['wrangler', 'kv', 'namespace', 'create', title]);
    if (cr.code !== 0) {
      console.error('    Failed:', cr.out);
      continue;
    }
    const idMatch = cr.out.match(/([0-9a-f]{24,64})/i);
    const newId = idMatch ? idMatch[1] : '(unknown)';
    console.log(`    Created with id: ${newId}`);
    created.push({ title, id: newId, replaces: missing[i] });
  }

  if (created.length) {
    console.log('\n--- ACTION REQUIRED ---');
    console.log('Update config/wrangler.toml with the new IDs:');
    for (const c of created) {
      console.log(`  Replace id "${c.replaces}" with "${c.id}" (title: ${c.title})`);
    }

    if (patchToml) {
      const tomlPath = new URL('../config/wrangler.toml', import.meta.url);
      let toml = readFileSync(tomlPath, 'utf8');
      for (const c of created) {
        toml = toml.replace(c.replaces, c.id);
        console.log(`  Patched wrangler.toml: ${c.replaces} → ${c.id}`);
      }
      const { writeFileSync } = await import('fs');
      writeFileSync(tomlPath, toml, 'utf8');
      console.log('  wrangler.toml updated on disk.');
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(10);
});
