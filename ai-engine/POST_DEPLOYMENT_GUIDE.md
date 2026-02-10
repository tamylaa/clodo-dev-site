# Post-Deployment Validation Guide

Automated validation scripts for testing AI Engine deployments across all environments.

---

## Quick Start

**After pushing v1.0.0 tag, wait for deployment and run:**

```powershell
# Test production (waits for GitHub Actions to complete)
npm run post-deploy

# Or directly with Node.js
node scripts/post-deploy.mjs
```

---

## Available Commands

### 1. **Test Production** (default)
```powershell
npm run post-deploy
# or
node scripts/post-deploy.mjs
```

**What it does:**
- ⏱ Waits for GitHub Actions workflow to complete (up to 5 minutes)
- ✅ Validates all 5 required GitHub secrets exist
- ✅ Tests health endpoint
- ✅ Discovers available capabilities
- ✅ Checks provider status and fallback chain
- ✅ Tests sample capability endpoints
- ✅ Validates usage tracking
- 📊 Reports deployment status

---

### 2. **Test Staging**
```powershell
npm run post-deploy:staging
# or
node scripts/post-deploy.mjs --staging
```

**When to use:**
- After pushing to `main` branch (triggers staging deploy)
- Before creating release tag for production
- To verify staging environment works

---

### 3. **Test Local Dev Server**
```powershell
npm run post-deploy:local
# or
node scripts/post-deploy.mjs --local
```

**When to use:**
- Running `npm run dev` in another terminal
- Testing locally before committing
- Debug capability endpoints

**Setup:**
```powershell
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run validation
npm run post-deploy:local
```

---

### 4. **Skip Workflow Wait**
```powershell
npm run post-deploy:skip-wait
# or
node scripts/post-deploy.mjs --skip-workflow-wait
```

**When to use:**
- GitHub Actions workflow is taking too long
- GitHub Actions already completed, you want immediate results
- Manual testing of deployed worker
- Testing staging/local that don't have workflows

---

## Options (Direct Node.js)

```powershell
node scripts/post-deploy.mjs [options]

Options:
  --staging              Test staging environment (default: production)
  --local                Test local dev server (default: production)
  --skip-workflow-wait   Skip GitHub Actions wait (default: wait)
  --timeout N            Max seconds to wait (default: 300)
  --token <token>        Custom auth token (default: read from .dev.vars)
```

**Examples:**
```powershell
# Wait max 600 seconds for production workflow
node scripts/post-deploy.mjs --timeout 600

# Test specific token
node scripts/post-deploy.mjs --token abc123def456

# Combination: skip wait, test staging with custom token
node scripts/post-deploy.mjs --staging --skip-workflow-wait --token mytoken
```

---

## Typical Deployment Flow

### **Full Deployment Cycle**

```powershell
# 1. Add changes, commit
git add .
git commit -m "feat: new capability"
git push origin master

# 2. GitHub Actions automatically deploys to staging
#    (Check: github.com/your-org/ai-engine/actions)

# 3. Validate staging (optional but recommended)
npm run post-deploy:staging

# 4. If staging looks good, create release
git tag -a v1.0.1 -m "Release: Fix for capability X"
git push origin v1.0.1

# 5. GitHub Actions automatically deploys to production
#    (Check: github.com/your-org/ai-engine/actions)

# 6. Validate production (waits for workflow, gated by check-secrets)
npm run post-deploy

# 7. Monitor live worker
npm run tail

# 8. Check daily costs
curl https://ai-engine.workers.dev/ai/usage \
  -H "x-ai-engine-service: YOUR_TOKEN"
```

---

## What Gets Validated

### ✅ Health Check
```
Test: POST /health
Checks: Worker is responding, uptime tracking working
Failure Reason: Worker down, auth token wrong, CORS blocked
```

### ✅ Capability Discovery
```
Test: GET /ai/capabilities
Checks: All 7 capabilities registered and discoverable
Expected: intent-classify, anomaly-diagnose, embedding-cluster, 
          chat, content-rewrite, refine-recs, smart-forecast
Failure Reason: Capability not registered, worker crash
```

### ✅ Provider Status
```
Test: GET /ai/providers
Checks: All configured providers available, models listed
Expected: Claude (primary), OpenAI (fallback), Cloudflare (always)
Failure Reason: API key invalid, provider endpoint down
```

### ✅ Sample Capabilities
```
Test: POST /ai/intent-classify, /ai/content-rewrite
Checks: Can actually run capability endpoints
Failure Reason: Model routing broken, token limit exceeded
```

### ✅ Usage Tracking
```
Test: GET /ai/usage
Checks: Cost tracking and rate limiting working
Reports: Today's cost, call count, breakdown by provider
Failure Reason: KV namespace down, usage tracking broken
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | ✅ All tests passed, deployment successful |
| 1 | ❌ One or more tests failed, check logs |

**Automate deployments:**
```powershell
# Only deploy if validation passes
if (npm run post-deploy) {
  Write-Host "Deployment successful!"
} else {
  Write-Host "Deployment validation failed!"
  exit 1
}
```

---

## Troubleshooting

### Workflow Wait Times Out (5 minutes)

```powershell
# Option 1: Increase timeout
node scripts/post-deploy.mjs --timeout 900  # 15 minutes

# Option 2: Skip the wait (if you know workflow completed)
npm run post-deploy:skip-wait

# Option 3: Check GitHub Actions manually
# Visit: https://github.com/your-org/ai-engine/actions
```

**Why it's timing out:**
- GitHub Actions queue is backed up
- Workflow step taking longer than expected
- Network connectivity issue

---

### Health Check Fails

```powershell
# Check 1: Is the worker actually deployed?
curl https://ai-engine.workers.dev/health -i

# Check 2: Is auth token correct?
# Compare token in .dev.vars with GitHub secret
cat .dev.vars | grep AI_ENGINE_TOKEN

# Check 3: Check Cloudflare logs
wrangler tail --env=production
```

---

### Provider Check Shows "Unavailable"

```powershell
# Check 1: Are API keys set in GitHub Actions secrets?
# Visit: https://github.com/your-org/ai-engine/settings/secrets/actions
# Verify: ANTHROPIC_API_KEY, OPENAI_API_KEY exist

# Check 2: Are API keys valid?
# Check they're not expired or revoked
# https://console.anthropic.com/settings/keys
# https://platform.openai.com/api-keys

# Check 3: Are rate limits hit?
# Claude: https://console.anthropic.com/dashboard
# OpenAI: https://platform.openai.com/account/billing/overview
```

---

### Usage Tracking Shows No Data

```powershell
# Check 1: Have you made requests since deployment?
# The usage endpoint only shows today's data

# Check 2: Is KV namespace configured?
# Verify in config/wrangler.toml:
#   [[kv_namespaces]]
#   binding = "KV_AI"
#   id = "8cf5349f..."

# Check 3: Check KV contents
npm run kv:list
```

---

## Monitoring Options

### After Deployment

**Option 1: Use validation script (recommended)**
```powershell
npm run post-deploy        # Full validation
npm run post-deploy:skip-wait  # Quick check (no workflow wait)
```

**Option 2: Monitor live logs**
```powershell
npm run tail  # Shows last 100 logs, streams new ones
```

**Option 3: Check costs**
```powershell
curl https://ai-engine.workers.dev/ai/usage \
  -H "x-ai-engine-service: YOUR_TOKEN"
```

**Option 4: Test specific endpoint**
```powershell
curl https://ai-engine.workers.dev/ai/intent-classify \
  -H "x-ai-engine-service: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"keywords":["test"]}'
```

---

## Advanced Usage

### Continuous Monitoring

```powershell
# Check every 5 minutes
while ($true) {
    Clear-Host
    node scripts/post-deploy.mjs --skip-workflow-wait
    Write-Host "Next check in 5 minutes..."
    Start-Sleep -Seconds 300
}
```

### Automated Deployment Chain

```powershell
# Deploy and validate in one script
Write-Host "Creating release..."
git tag -a v1.0.1 -m "New release"
git push origin v1.0.1

Write-Host "Waiting for deployment..."
Start-Sleep -Seconds 30

Write-Host "Validating..."
node scripts/post-deploy.mjs

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}
```

### Test Multiple Environments

```powershell
$environments = @('local', 'staging', 'production')

foreach ($env in $environments) {
    Write-Host "Testing $env environment..." -ForegroundColor Cyan
    
    $params = if ($env -eq 'local') { 
        @('--local', '--skip-workflow-wait') 
    } elseif ($env -eq 'staging') { 
        @('--staging', '--skip-workflow-wait') 
    } else { 
        @() 
    }
    
    & node scripts/post-deploy.mjs @params
    Write-Host ""
}
```

---

## Performance

| Environment | Time to Complete |
|-------------|-----------------|
| Local | 3-5 seconds |
| Staging | 5-10 seconds |
| Production | 5-10 seconds (+ workflow wait time) |

**With workflow wait:**
- First deployment (from tag push): +5-10 minutes
- Subsequent checks: +0 minutes (workflow already done)

---

## Related Commands

```powershell
# Development
npm run dev              # Start local dev server
npm test                 # Run unit tests
npm run test:watch      # Watch mode testing

# Deployment
npm run deploy           # Deploy to current environment
npm run deploy:staging   # Deploy to staging
npm run deploy:production # Deploy to production (direct)

# Monitoring
npm run tail            # Stream worker logs
npm run kv:list         # List KV usage data

# Validation
npm run post-deploy      # Full validation
npm run post-deploy:staging   # Validate staging
npm run post-deploy:local     # Validate local
npm run post-deploy:skip-wait # Quick validation
```

---

## FAQ

**Q: How often should I run the validation script?**
A: After every deployment to production. For staging: once before creating release. For local: when developing new features.

**Q: Why is the workflow wait taking so long?**
A: GitHub Actions may have queue. Use `--skip-workflow-wait` if you want immediate results.

**Q: Can I use this script with CI/CD?**
A: Yes! The exit code is reliable (0 = success, 1 = failure). See "Automated Deployment Chain" above.

**Q: Does the script modify anything?**
A: No, it's read-only. Only tests endpoints and reads logs.

**Q: What if validation fails?**
A: Check the specific failure, fix the issue (auth token, API keys, etc.), and re-run the script.

---

## Support

- 📖 **Documentation:** See README.md and related guides
- 🐛 **Issues:** Check GitHub Actions logs for detailed errors
- 📺 **Logs:** `npm run tail` for live worker logs
- 💬 **Help:** See GITHUB_SECRETS_SETUP.md for secrets configuration
