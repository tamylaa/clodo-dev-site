# GitHub Secrets Setup Guide

**Last Updated:** February 9, 2026

---

## Overview

The deployment workflows now **automatically validate all required secrets** before attempting deployment. If any required secrets are missing, the workflow will:

1. **Fail fast** — prevent deployment with missing config
2. **Show exactly what's missing** — clear list of which secrets aren't set
3. **Provide setup instructions** — direct links and step-by-step guidance

---

## Required Secrets

### For Both Staging & Production

| Secret | Required | Description | Example |
|--------|----------|-------------|---------|
| `CLOUDFLARE_API_TOKEN` | ✅ Yes | Cloudflare API token with Workers namespace and KV permissions | `v1.c123abc...` |
| `CLOUDFLARE_ACCOUNT_ID` | ✅ Yes | Your Cloudflare Account ID (32-char hex) | `abc123def456...` |
| `CLOUDFLARE_WORKER_SUBDOMAIN` | ✅ Yes | Subdomain for your worker URLs (e.g., `ai-engine`) | `ai-engine` |
| `AI_ENGINE_TOKEN` | ✅ Yes | Shared auth token for visibility-analytics integration | 40+ char alphanumeric |
| `ANTHROPIC_API_KEY` | ✅ Yes | Claude API key from Anthropic | `sk-ant-api03-...` |

### Optional (Additional AI Providers)

| Secret | Recommended | Description | Example |
|--------|---|-------------|---------|
| `OPENAI_API_KEY` | ⭐ High | OpenAI API key (provides GPT-4o fallback) | `sk-proj-...` |
| `GOOGLE_AI_API_KEY` | ⭐ Medium | Google Gemini API key | `AIzaSy...` |
| `MISTRAL_API_KEY` | ⭐ Low | Mistral AI API key | `... ` |
| `DEEPSEEK_API_KEY` | ⭐ Low | DeepSeek API key (excellent value) | `... ` |

**Note:** Even with optional providers missing, deployment proceeds because Cloudflare Workers AI (free tier) is always available as fallback.

---

## Setup Instructions

### Step 1: Create GitHub Secrets Location

1. Go to your repository on GitHub
2. Click **Settings** (top menu)
3. Click **Secrets and variables** (left sidebar)
4. Click **Actions**

You should see: `https://github.com/YOUR_ORG/ai-engine/settings/secrets/actions`

### Step 2: Create Required Secrets

#### A. `CLOUDFLARE_API_TOKEN`

1. Go to **https://dash.cloudflare.com/profile/api-tokens**
2. Click **Create Token**
3. Select template: **Edit Cloudflare Workers**
4. Grant permissions for:
   - ✅ Accounts → Cloudflare Workers Scripts (Write)
   - ✅ Account Settings → Cloudflare Workers KV Storage (Write)
   - ✅ Account Settings → Cloudflare Workers Routes (Write)
5. Continue and copy the token
6. In GitHub Actions secrets, create: **`CLOUDFLARE_API_TOKEN`** = *paste token*

#### B. `CLOUDFLARE_ACCOUNT_ID`

1. Go to **https://dash.cloudflare.com/workers**
2. Look for **Account ID** in the right sidebar — it's a 32-character hex string
3. In GitHub Actions secrets, create: **`CLOUDFLARE_ACCOUNT_ID`** = *paste Account ID*

#### C. `CLOUDFLARE_WORKER_SUBDOMAIN`

This is your choice. Examples:
- `ai-engine` — Results in `ai-engine-staging.ai-engine.workers.dev`
- `seo-ai` — Results in `seo-ai-staging.seo-ai.workers.dev`

Pick something short and memorable.

In GitHub Actions secrets, create: **`CLOUDFLARE_WORKER_SUBDOMAIN`** = *your-chosen-subdomain*

#### D. `AI_ENGINE_TOKEN`

Generate a secure random token:

**On Mac/Linux:**
```bash
openssl rand -hex 20
# Output: 3f2a9c8b1e5d4a7f6c2e9b3a1d5f7c4e
```

**On Windows PowerShell:**
```powershell
[BitConverter]::ToString([byte[]](1..40 | ForEach-Object { Get-Random -Maximum 256 })) -replace '-'
```

**Or use any secure random generator** — just ensure it's 40+ characters of alphanumeric characters.

In GitHub Actions secrets, create: **`AI_ENGINE_TOKEN`** = *your-generated-token*

**Important:** Share this token with the visibility-analytics team for their configuration.

#### E. `ANTHROPIC_API_KEY`

1. Go to **https://console.anthropic.com/settings/keys**
2. Click **Create Key**
3. Copy the key (starts with `sk-ant-`)
4. In GitHub Actions secrets, create: **`ANTHROPIC_API_KEY`** = *paste key*

### Step 3: Create Optional Provider Secrets (Recommended)

To add provider fallback options, get API keys from:

**OpenAI (recommended):**
1. https://platform.openai.com/api-keys
2. Create new API key
3. GitHub secret: **`OPENAI_API_KEY`** = *paste key*

**Google Gemini:**
1. https://aistudio.google.com/app/apikey
2. Copy API key
3. GitHub secret: **`GOOGLE_AI_API_KEY`** = *paste key*

**Mistral AI:**
1. https://console.mistral.ai/api-keys
2. Create new API key
3. GitHub secret: **`MISTRAL_API_KEY`** = *paste key*

**DeepSeek (excellent value):**
1. https://platform.deepseek.com/api_keys
2. Create new API key
3. GitHub secret: **`DEEPSEEK_API_KEY`** = *paste key*

---

## Validation Flow

When you push code or create a release, the workflow runs:

### 1. **check-secrets Job** (runs first)
```
✅ Check if all required secrets are set
├─ CLOUDFLARE_API_TOKEN ✓
├─ CLOUDFLARE_ACCOUNT_ID ✓
├─ CLOUDFLARE_WORKER_SUBDOMAIN ✓
├─ AI_ENGINE_TOKEN ✓
├─ ANTHROPIC_API_KEY ✓
├─ Optional: OPENAI_API_KEY ✓
├─ Optional: GOOGLE_AI_API_KEY ✗
└─ (continue with available providers)

Summary: 5/5 required, 4 optional providers available ✓
RESULT: PASS → Proceed to tests
```

### 2. **test Job** (only runs if secrets valid)
```
Runs on ubuntu-latest
- Checkout code
- Install dependencies
- Run npm test (vitest suite)
RESULT: PASS/FAIL
```

### 3. **Other Jobs** (if applicable)
```
check-staging (prod only): Health check
deploy-{staging|production}: Actual deployment
```

---

## Troubleshooting

### Workflow Fails: "Missing required secrets"

**Problem:** Deployment blocked because required secrets aren't set.

**Solution:**
1. Go to: https://github.com/YOUR_ORG/ai-engine/settings/secrets/actions
2. Check which secrets are missing (workflow output shows this)
3. Create each missing secret from the instructions above
4. Retry the workflow (or push code again to re-trigger)

### Workflow Appears Stuck on "check-secrets"

**Problem:** The job is waiting for user input that will never come.

**Solution:**
- The workflow is **not stuck** — it's checking secrets and will fail if missing
- Check the job output/logs (click the job name to see details)
- Fix missing secrets and retry

### Secret Value is Incorrect

**Problem:** "Unauthorized" error during deploy after secrets are set.

**Possible causes:**
- `CLOUDFLARE_API_TOKEN` has insufficient permissions
- `ANTHROPIC_API_KEY` is expired or revoked
- `CLOUDFLARE_ACCOUNT_ID` is wrong format

**Solution:**
1. Verify the secret value is correct (re-copy from source)
2. For API tokens, check they haven't expired
3. Delete the secret and recreate it
4. Retry the workflow

---

## Security Best Practices

### ✅ DO

- ✅ Store all secrets in GitHub (never in code)
- ✅ Use strong tokens (40+ characters)
- ✅ Rotate API keys regularly (quarterly minimum)
- ✅ Create separate secrets for staging vs production (if desired)
- ✅ Review GitHub Actions logs (they don't expose secret values)

### ❌ DON'T

- ❌ Commit secrets to version control
- ❌ Share tokens in Slack, email, or chat
- ❌ Use same token for multiple services
- ❌ Hardcode secrets in workflow files
- ❌ Log secret values anywhere

---

## Validation Output Examples

### Success (Staging)

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
  ⚪ GOOGLE_AI_API_KEY — not configured (optional)
  ⚪ MISTRAL_API_KEY — not configured (optional)
  ⚪ DEEPSEEK_API_KEY — not configured (optional)

Summary:
  Total AI Providers available: 3
  Required secrets found: 5/5

═══════════════════════════════════════════════════════════════

✅ All required secrets configured!
```

### Failure (Production)

```
═══════════════════════════════════════════════════════════════
🔐 Production Deployment — Secret Validation
═══════════════════════════════════════════════════════════════

Checking REQUIRED secrets for production...
  ✅ CLOUDFLARE_API_TOKEN — configured
  ✅ CLOUDFLARE_ACCOUNT_ID — configured
  ❌ CLOUDFLARE_WORKER_SUBDOMAIN — NOT SET
  ✅ AI_ENGINE_TOKEN — configured
  ✅ ANTHROPIC_API_KEY — configured

Summary:
  Total AI providers available: 2
  Required secrets: 4/5 configured

═══════════════════════════════════════════════════════════════

🛞 PRODUCTION DEPLOYMENT BLOCKED

Missing required secrets:
   → CLOUDFLARE_WORKER_SUBDOMAIN

📋 INSTRUCTIONS TO FIX:

1. Open: https://github.com/reponame/settings/secrets/actions

2. Create/update these secrets:

   ↳ CLOUDFLARE_WORKER_SUBDOMAIN
      → Choose subdomain for your worker (e.g., 'ai-engine')
      → Will be: https://ai-engine-production.subdomain.workers.dev

3. Retry the workflow after secrets are configured
```

---

## FAQ

### Q: Can I use different tokens for staging vs production?

**A:** Yes! Create separate secrets:
- `CLOUDFLARE_API_TOKEN_STAGING` 
- `CLOUDFLARE_API_TOKEN_PRODUCTION`

Then update the workflow files to use the appropriate secret. Recommended for security.

### Q: What if I don't want to set up optional providers?

**A:** That's fine! The system falls back to:
1. Claude (if `ANTHROPIC_API_KEY` set)
2. Cloudflare Workers AI (free, always available, ~10K neurons/day)

The workflow will warn but **not block** if optional providers aren't set.

### Q: How often should I rotate these secrets?

**A:** Annual minimum. More frequently for:
- After any suspected breach
- When employee leaves
- Best practice: quarterly for customer-facing services

### Q: Can I see secret values in GitHub actions logs?

**A:** No. GitHub automatically masks secret values. Logs will show `***` instead of the actual value.

### Q: What if I accidentally commit a secret to Git?

**A:** 
1. **Immediately revoke the secret** (API token, API key)
2. Regenerate a new secret
3. Use BFG Repo-Cleaner or git filter-branch to remove from history
4. Force push (not recommended in team repos — coordinate with team)

---

## Testing Secrets Locally

To validate secrets before pushing:

```bash
# Check .dev.vars file has required values
npm run setup:check

# Or with more details
npm run setup -- --check

# Deploy individually (without CI/CD)
npm run deploy:staging
```

---

## Getting Help

If you're stuck:

1. **Check workflow logs** — Click the failed job → View logs
2. **Verify secret names** — Secrets are case-sensitive
3. **Re-read setup instructions** — Make sure you copied exactly
4. **Test locally first** — Use `npm run setup:check` locally
5. **Consult LLM** — Feed this document + error message to Claude/ChatGPT

---

## Summary Checklist

Before first deployment:

- [ ] Go to GitHub repo → Settings → Secrets and variables → Actions
- [ ] Create `CLOUDFLARE_API_TOKEN` (from Cloudflare API tokens page)
- [ ] Create `CLOUDFLARE_ACCOUNT_ID` (from Cloudflare Workers dashboard)
- [ ] Create `CLOUDFLARE_WORKER_SUBDOMAIN` (your choice, e.g., 'ai-engine')
- [ ] Create `AI_ENGINE_TOKEN` (40+ char random alphanumeric)
- [ ] Create `ANTHROPIC_API_KEY` (from Anthropic console)
- [ ] (Optional) Create `OPENAI_API_KEY` (from OpenAI)
- [ ] (Optional) Create `GOOGLE_AI_API_KEY` (from Google AI Studio)
- [ ] (Optional) Create `MISTRAL_API_KEY` (from Mistral console)
- [ ] (Optional) Create `DEEPSEEK_API_KEY` (from DeepSeek platform)
- [ ] Push code → Workflow should pass ✅

---

**Last Updated:** February 9, 2026  
**Version:** 1.0  
**Maintainer:** AI Engine Team
