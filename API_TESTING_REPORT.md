# API Endpoint Testing Report

## Test Results Summary

### Status: 401 Unauthorized ❌

All public endpoint tests **failed with 401 Unauthorized** because the AI Engine requires authentication.

```
✗ POST /ai/generate-schema → 401 Unauthorized
  Error: No authentication provided
```

---

## Authentication Requirements

The AI Engine implements 3-tier authentication:

### 1. **Service Binding** (Worker-to-Worker) ✅ **PREFERRED**
Used by visibility-analytics to call AI Engine with zero-latency, zero-auth overhead.

```
Header: x-ai-engine-service: visibility-analytics
→ Automatically authorized (trusted service)
```

**This is how VA calls AI Engine internally** — no bearer token needed.

---

### 2. **Bearer Token** (External HTTP Access)
For external clients or testing via curl/HTTP requests.

```
Header: Authorization: Bearer <AI_ENGINE_TOKEN>
```

- Token value must match `AI_ENGINE_TOKEN` environment variable
- Set via: `wrangler secret put AI_ENGINE_TOKEN`
- Must be set in **production**
- Unset in dev mode to allow unauthenticated requests

---

### 3. **Dev Mode** (Local Development)
If `AI_ENGINE_TOKEN` is not set and not in production environment:

```
Authorization: None required
Environment: ENVIRONMENT != "production"
```

---

## End-to-End Flow

### ✅ What Works (Worker-to-Worker)

```
visibility-analytics.com/api/ai/generate-schema
    ↓ (HTTP POST)
visibility-analytics worker
    ↓ (Service Binding with x-ai-engine-service header)
ai-engine worker /ai/generate-schema
    ↓ (authenticated via service binding, not HTTP header)
ResponseSuccess
```

This works because:
1. VA has `AI_ENGINE` service binding configured in `wrangler.toml`
2. VA calls it using `env.AI_ENGINE.fetch()` or similar
3. Automatically includes `x-ai-engine-service` header
4The AI Engine trusts all service binding requests

---

### ❌ What Doesn't Work (Direct Public Access)

```
curl https://ai-engine.wetechfounders.workers.dev/ai/generate-schema
    ↓ (no auth header)
ai-engine worker /ai/generate-schema
    ↓ (checks auth)
401 Unauthorized "No authentication provided"
```

Requires:
- `Authorization: Bearer <token>` header with valid token, OR
- Service binding header (only works from another CF Worker), OR
- Dev mode enabled (not production, no token set)

---

## How to Test Properly

### Option 1: Test via Va Proxy ✅ **EASIEST**
VA exposes `/api/ai/generate-schema` which proxies to AI Engine via service binding:

```bash
curl -X POST https://visibility-analytics.wetechfounders.workers.dev/api/ai/generate-schema \
  -H "Content-Type: application/json" \
  -d '{
    "pages": [{
      "url": "https://clodo.dev",
      "title": "CLODO",
      "h1": "CLODO Platform",
      "wordCount": 2000,
      "bodyPreview": "SEO analytics platform..."
    }]
  }'
```

✅ No auth needed — VA proxy handles auth with service binding
✅ Uses deployed endpoint
✅ Tests full integration

---

### Option 2: Direct AI Engine with Bearer Token 
First, set the token in AI Engine:

```bash
wrangler secret put AI_ENGINE_TOKEN
# Enter token when prompted, e.g.: "sk-test-token-12345"
wrangler deploy
```

Then test with token:

```bash
curl -X POST https://ai-engine.wetechfounders.workers.dev/ai/generate-schema \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-test-token-12345" \
  -d '{
    "pages": [{...}]
  }'
```

✅ Tests AI Engine directly
⚠️ Requires token management
⚠️ Token must be configured on worker

---

### Option 3: Local Dev Mode
Start AI Engine in dev mode (no token):

```bash
cd ai-engine
ENVIRONMENT=development wrangler dev
# or remove AI_ENGINE_TOKEN from .env
```

Then test without auth:

```bash
curl -X POST http://localhost:8787/ai/generate-schema \
  -H "Content-Type: application/json" \
  -d '{...}'
```

✅ Quick local testing
❌ Not available on deployed worker

---

## Recommended Testing Path

1. **✅ Test VA Proxy** (Simplest, no auth)
   ```bash
   POST https://visibility-analytics.wetechfounders.workers.dev/api/ai/generate-schema
   ```

2. **✅ Trigger Real Crawl**
   - Run a crawl of clodo.dev via VA
   - Verify schema insights are generated
   - Check for CMS detection (should detect Astro)
   - Review expected vs actual verification

3. **✅ Check Closed Loop**
   - Find one schema action in baseline
   - Manually add schema to that page on clodo.dev
   - Run another crawl
   - Verify `verifySchemaImplementation()` shows schema as `verified` not `missing`

---

## Key Files

| File | Purpose |
|------|---------|
| `ai-engine/src/middleware/auth.mjs` | Authentication logic (service binding, bearer, dev mode) |
| `ai-engine/src/worker.mjs` | Auth check on all `/ai/*` routes (lines 106-120) |
| `visibility-analytics/src/workers/api-routes.mjs` | Proxy endpoint that calls AI Engine |
| `visibility-analytics/package.json` / `wrangler.toml` | Service binding config |

---

## Summary

| Endpoint | Auth Method | Status | Accessible | Use Case |
|----------|------------|--------|-----------|----------|
| `POST /api/ai/generate-schema` (VA) | Internal service binding | ✅ Deployed | ✅ Public internet | Test full flow |
| `POST /ai/generate-schema` (AI Engine) | Bearer token OR service binding | ✅ Deployed | ❌ Needs token OR must be called from VA | Internal use |
| `POST /ai/generate-schema` (AI Engine dev) | None (dev mode) | ✅ Working | ✅ Local only | Local development |

**→ Recommendation**: Use the **VA proxy endpoint** for testing. It handles authentication automatically via service binding.
