# Post-Deployment Testing & Troubleshooting Guide

## Current Status

### ✅ Code Deployment
- Both AI Engine and visibility-analytics codebases have been compiled and pushed to Cloudflare Workers
- All 1593 tests passing (visibility-analytics)
- All 298 tests passing (AI Engine)

### ⚠️ 401 Unauthorized Responses
Both endpoints return 401 "No authentication provided":
- `POST /api/ai/generate-schema` (VA proxy) → 401
- `POST /ai/generate-schema` (AI Engine direct) → 401

---

## Root Cause Analysis

### Authentication Architecture

**AI Engine** (`ai-engine` worker):
- Requires authentication on all `/ai/*` routes
- Accepts 3 methods:
  1. **Service Binding header**: `x-ai-engine-service: visibility-analytics` (worker-to-worker, zero-trust)
  2. **Bearer token**: `Authorization: Bearer <AI_ENGINE_TOKEN>` (HTTP external)
  3. **Dev mode**: No auth if `AI_ENGINE_TOKEN` unset && `ENVIRONMENT != production`

**Visibility Analytics** (`visibility-analytics worker):
- Public `/api/ai/generate-schema` endpoint
- Uses Service Binding to call AI Engine (configured in wrangler.toml, lines 35-36)
- Service binding bypasses HTTP auth entirely

### Why 401 is Occurring

The 401 error suggests one of:

1. **Deployment Incomplete**
   - Workers may not have fully deployed the latest code
   - Wrangler auth errors were encountered earlier (account ID mismatch)
   - `wrangler deploy` may not have completed successfully

2. **Environment Variables Not Set**
   - AI Engine needs `CAPABILITY_SCHEMA=true` or `CAPABILITY_SCHEMA` as `true` (not "false")
   - AI Engine needs `ENVIRONMENT` set appropriately
   - VA needs service binding environment variable accessible

3. **Service Binding Not Active**
   - Even though configured in wrangler.toml, service binding only works if:
     - Both workers are in the same account
     - The binding is actually deployed
     - The service name matches exactly: `ai-engine`

---

## Verification Steps

### Step 1: Confirm Deployment
```bash
# Check if workers are deployed
wrangler deployments list --name ai-engine
wrangler deployments list --name visibility-analytics

# Both should show recent deployments
```

### Step 2: Check Environment Variables
```bash
# For AI Engine
wrangler secret list --config config/wrangler.toml
# Should have: CAPABILITY_SCHEMA, AI_ENGINE_TOKEN (if using HTTP fallback), etc.

# Check what's actually deployed
wrangler tail ai-engine --format json
# Monitor logs while making requests
```

### Step 3: Test Service Binding Connectivity

**From VA to AI Engine (via service binding):**
```bash
# This is how VA calls AI Engine internally
# Service binding includes x-ai-engine-service header automatically
# No HTTP round-trip, no additional auth needed
```

**From external client to VA (public HTTP):**
```bash
curl -X POST https://visibility-analytics.wetechfounders.workers.dev/api/ai/generate-schema \
  -H "Content-Type: application/json" \
  -d '{...}'
# This should work if:
# 1. VA is deployed
# 2. VA has service binding to AI Engine configured
# 3. AI Engine is deployed and accessible
```

**From external client to AI Engine (requires auth):**
```bash
curl -X POST https://ai-engine.wetechfounders.workers.dev/ai/generate-schema \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token-here>" \
  -d '{...}'
# OR if dev mode enabled (no token set):
curl -X POST http://localhost:8787/ai/generate-schema \
  -H "Content-Type: application/json" \
  -d '{...}'
```

---

## Required Configuration

### AI Engine (`ai-engine/config/wrangler.toml`)

Must have these environment variables set in Cloudflare dashboard:

```bash
wrangler secret put CAPABILITY_SCHEMA --value "true"
wrangler secret put ENVIRONMENT --value "production"

# Optional: if using HTTP fallback instead of service binding
wrangler secret put AI_ENGINE_TOKEN --value "your-secure-token"
```

### Visibility Analytics (`visibility-analytics/config/wrangler.toml`)

Already configured:
- ✅ Service binding `AI_ENGINE` -> `ai-engine` (lines 35-36)
- ✅ KV namespaces for analytics and history
- ✅ R2 bucket for data storage

Optional environment variables:
```bash
wrangler secret put AI_ENGINE_URL --value "https://ai-engine.wetechfounders.workers.dev"
wrangler secret put AI_ENGINE_TOKEN --value "your-token" # if service binding fails
```

---

## Deployment Checklist

- [ ] **Fix Wrangler Auth**
  ```bash
  wrangler login
  # Re-authenticate to get fresh OAuth token with correct account
  ```

- [ ] **Deploy AI Engine**
  ```bash
  cd ai-engine
  wrangler deploy --config config/wrangler.toml
  ```

- [ ] **Set AI Engine Secrets**
  ```bash
  wrangler secret put CAPABILITY_SCHEMA --value "true"
  wrangler secret put ENVIRONMENT --value "production"
  ```

- [ ] **Deploy Visibility Analytics**
  ```bash
  cd ../visibility-analytics
  wrangler deploy --config config/wrangler.toml
  ```

- [ ] **Monitor Logs**
  ```bash
  wrangler tail ai-engine --follow
  wrangler tail visibility-analytics --follow
  ```

- [ ] **Test Health Endpoints**
  ```bash
  # AI Engine health
  curl https://ai-engine.wetechfounders.workers.dev/health
  
  # VA health
  curl https://visibility-analytics.wetechfounders.workers.dev/health
  ```

- [ ] **Test API Endpoints**
  ```bash
  # This should work without auth if everything is deployed
  curl -X POST https://visibility-analytics.wetechfounders.workers.dev/api/ai/generate-schema \
    -H "Content-Type: application/json" \
    -d '{
      "pages": [{
        "url": "https://clodo.dev",
        "title": "CLODO",
        "h1": "CLODO",
        "wordCount": 2000,
        "bodyPreview": "..."
      }]
    }'
  ```

---

## Expected Success Indicators

When properly deployed, you should see:

```json
{
  "success": true,
  "pages": [
    {
      "url": "https://clodo.dev",
      "inferredTypes": ["Article", "BreadcrumbList"],
      "schemas": [
        {
          "type": "Article",
          "markup": "{\"@context\":\"https://schema.org\",\"@type\":\"Article\",\"headline\":\"CLODO\",...}"
        },
        {
          "type": "BreadcrumbList",
          "markup": "{\"@context\":\"https://schema.org\",\"@type\":\"BreadcrumbList\",...}"
        }
      ]
    }
  ]
}
```

---

## Debugging 401 Errors

### Check AI Engine Logs
```bash
wrangler tail ai-engine --format json
# Look for auth-related entries:
# - "Service binding auth from: visibility-analytics" ✓ means service binding worked
# - "Invalid token" means bearer token is wrong
# - "No authentication provided" means no auth header/binding detected
```

### Check VA Logs
```bash
wrangler tail visibility-analytics --format json
# Look for errors when calling AI Engine
# Should see service binding requests being made
```

### Manual Service Binding Test (local dev)
```bash
cd ai-engine
ENVIRONMENT=development wrangler dev # Start in dev mode, no token required

# In another terminal:
cd ../visibility-analytics
# Temporarily comment out service binding to test HTTP
# Or add debug logs to see what auth method is being used
```

---

## Next Steps

1. **Authenticate with Wrangler**
   ```bash
   wrangler logout
   wrangler login
   ```

2. **Verify account ID matches both wrangler.toml files**
   - Check that `account_id` in both configs match your Cloudflare account
   - Or leave it unset and let wrangler auto-detect

3. **Deploy both workers in order**
   - AI Engine first (no dependencies)
   - Visibility Analytics second (depends on AI Engine)

4. **Run the full test suite** provided in `test-va-proxy.ps1` after deployment  

5. **Monitor real crawl lifecycle**
   - Trigger a crawl of clodo.dev
   - Watch for schema insights being generated
   - Verify CMS detection (should detect Astro)
   - Check schema verification on next crawl runs

---

## Files Modified in This Release

### AI Engine
- `src/capabilities/generate-schema.mjs` (NEW)
- `src/lib/schemas/generate-schema.schema.mjs` (NEW)
- `src/lib/few-shot/generate-schema.examples.mjs` (NEW)
- `src/routes.mjs` (POST /ai/generate-schema added)
- `src/capabilities/manifest.mjs` (capability #15 added)

### Visibility Analytics
- `src/workers/api-routes.mjs` (POST /api/ai/generate-schema added)
- `src/ai/ai-engine-client.mjs` (generateSchema() method added)
- `src/visualization/insight-engine.mjs` (CMS detection + instructions integrated)
- `src/analysis/schema-generator.mjs` (detectPlatform, getCMSInstructions functions)
- `src/extractors/content-analyzer.mjs` (bodyPreview increased to 800 chars, metaGenerator extraction)
- `src/feedback/impact-tracker.mjs` (verifySchemaImplementation function added)

---

## Support

If you continue seeing 401 errors after following this guide:

1. Check `wrangler tail` logs for the exact error message
2. Verify deployment succeeded: `wrangler deployments list`
3. Ensure secrets are set: `wrangler secret list`
4. Test locally in dev mode first: `wrangler dev` (no auth required)
5. Check service binding configuration matches between workers
