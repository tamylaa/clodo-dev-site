# Quick Reference: Secrets Validation Changes

**Updated:** February 9, 2026

---

## TL;DR

✅ **Both deploy workflows now validate secrets BEFORE deployment**

When you push code or create a release:
1. GitHub Actions checks if all required secrets are configured
2. If missing → Shows you exactly which ones + how to set them up
3. If OK → Proceeds to tests and deployment

---

## Required Secrets

**Set these in:** https://github.com/YOUR_ORG/ai-engine/settings/secrets/actions

```
REQUIRED (must have all 5):
├─ CLOUDFLARE_API_TOKEN      ← https://dash.cloudflare.com/profile/api-tokens
├─ CLOUDFLARE_ACCOUNT_ID     ← https://dash.cloudflare.com/workers (Account ID sidebar)
├─ CLOUDFLARE_WORKER_SUBDOMAIN  ← Your choice (e.g., "ai-engine")
├─ AI_ENGINE_TOKEN           ← Generate: openssl rand -hex 20
└─ ANTHROPIC_API_KEY         ← https://console.anthropic.com/settings/keys

OPTIONAL (add more providers):
├─ OPENAI_API_KEY            ← https://platform.openai.com/api-keys
├─ GOOGLE_AI_API_KEY         ← https://aistudio.google.com/app/apikey
├─ MISTRAL_API_KEY           ← https://console.mistral.ai/api-keys
└─ DEEPSEEK_API_KEY          ← https://platform.deepseek.com/api_keys
```

---

## Workflow Files Changed

### 1. `.github/workflows/deploy-staging.yml`
- ✅ Added `check-secrets` job
- ✅ Test job now depends on `check-secrets`
- ✅ Uses `if: needs.check-secrets.outputs.valid == 'true'` to block on failure

### 2. `.github/workflows/deploy-production.yml`
- ✅ Added comprehensive `check-secrets` job
- ✅ Provides detailed setup instructions
- ✅ Lists direct links to where to get each secret
- ✅ Test and check-staging jobs depend on `check-secrets`
- ✅ Shows available AI provider count

---

## What Happens on Deployment

### Staging (push to main)

```
1. check-secrets runs
   ├─ Checks: CLOUDFLARE_API_TOKEN (required)
   ├─ Checks: CLOUDFLARE_ACCOUNT_ID (required)
   ├─ Checks: CLOUDFLARE_WORKER_SUBDOMAIN (required)
   ├─ Checks: AI_ENGINE_TOKEN (required)
   ├─ Checks: ANTHROPIC_API_KEY (required)
   ├─ Checks: OPENAI_API_KEY (optional)
   ├─ Checks: GOOGLE_AI_API_KEY (optional)
   ├─ Checks: MISTRAL_API_KEY (optional)
   └─ Checks: DEEPSEEK_API_KEY (optional)
   
2. If all required → PASS
   └─ Proceeds to test job
   
3. If any required missing → FAIL
   └─ Shows: "Missing: [list]"
   └─ Shows: "To fix: [instructions]"
   └─ Workflow stops
```

### Production (release or manual trigger)

Same as staging, but with:
- More detailed error messages
- Direct links to Cloudflare / Anthropic / etc.
- Step-by-step instructions
- Provider count summary

---

## Failure Example

If you try to deploy without `ANTHROPIC_API_KEY`:

```
🛞 PRODUCTION DEPLOYMENT BLOCKED

Missing required secrets:
   → ANTHROPIC_API_KEY

📋 INSTRUCTIONS TO FIX:

1. Open: https://github.com/yourorg/ai-engine/settings/secrets/actions

2. Create/update these secrets:

   ↳ ANTHROPIC_API_KEY (REQUIRED)
      → Go to: https://console.anthropic.com/settings/keys
      → Create new API key
      → Copy: sk-ant-...

3. Retry the workflow after secrets are configured
```

---

## Success Example

If all secrets are configured:

```
═══════════════════════════════════════════════════════════════
Checking required secrets...
  ✅ CLOUDFLARE_API_TOKEN — configured
  ✅ CLOUDFLARE_ACCOUNT_ID — configured
  ✅ CLOUDFLARE_WORKER_SUBDOMAIN — configured
  ✅ AI_ENGINE_TOKEN — configured
  ✅ ANTHROPIC_API_KEY — configured

Checking optional provider keys...
  ✅ OPENAI_API_KEY — configured
  ⚪ GOOGLE_AI_API_KEY — not configured
  ⚪ MISTRAL_API_KEY — not configured
  ⚪ DEEPSEEK_API_KEY — not configured

Summary:
  Total AI Providers available: 3
  Required secrets found: 5/5

═══════════════════════════════════════════════════════════════

✅ All required secrets configured!
```

---

## First-Time Setup

1. **Push code to create workflow run**
   ```bash
   git push origin main
   ```

2. **Check workflow in GitHub Actions**
   - Go to Actions tab
   - Click the workflow run
   - See which secrets are missing

3. **Create secrets in GitHub**
   - Visit: `https://github.com/YOUR_ORG/ai-engine/settings/secrets/actions`
   - Click "New repository secret"
   - Add each missing secret name + value
   - Click "Add secret"

4. **Retry workflow**
   ```bash
   git push origin main  # or push another commit
   ```

5. ✅ **Done! Deployment should succeed**

---

## Important Notes

- ✅ Secrets are **stored securely** in GitHub (encrypted)
- ✅ Secrets are **masked in logs** (shows as `***`)
- ✅ Required secrets **block deployment** if missing
- ✅ Optional secrets **allow partial deployment** (fallback to free tier)
- ✅ Validation happens **automatically** with every deploy attempt

---

## Common Issues

| Issue | Solution |
|-------|----------|
| "Missing required secrets" | Use the provided links to get each secret, add to GitHub Actions secrets |
| "Deployment failed with API error" | Secret exists but value is wrong. Re-check value and re-create |
| "Workflow stuck on check-secrets" | Wait 1-2 min for job to complete, then check logs for error |
| "Can't find where to set secrets" | Go to: `github.com/org/repo/settings/secrets/actions` |

---

## Documentation Files

New guides created:

1. **`GITHUB_SECRETS_SETUP.md`** — Complete setup guide with links and instructions
2. **`WORKFLOW_SECRETS_INTEGRATION.md`** — Technical details of implementation
3. **This document** — Quick reference

---

## Next Steps

1. ✅ Update both workflow files (DONE)
2. ⏳ Set required secrets in GitHub Actions (USER ACTION)
3. ⏳ Push code to trigger workflows (USER ACTION)
4. ✅ Workflows validate → Run tests → Deploy (AUTOMATED)

---

**Questions?** → See `GITHUB_SECRETS_SETUP.md` for full guide

**Updated:** February 9, 2026  
**Status:** Ready to use
