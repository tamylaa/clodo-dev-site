# AI Engine — Full Stocktake & Deployment Guide

**Generated:** February 9, 2026  
**Version:** 2.0.0  
**Status:** Production Ready

---

## Executive Summary

The AI Engine is a **Cloudflare Workers-based multi-model LLM orchestrator** providing 7 AI-powered capabilities for SEO analytics. It supports 6 AI providers with intelligent routing, rate limiting, cost tracking, and zero-trust authentication.

**Architecture:** Standalone worker → Multi-provider router → 6+ AI backends  
**Deployment:** Wrangler (Cloudflare Workers platform)  
**Environment Support:** development, staging, production

---

## Part 1: Capabilities Inventory

### 1. **Intent Classifier** (`/ai/intent-classify`)
- **Purpose:** LLM-powered keyword search intent classification
- **Input:** Array of search keywords + optional context (site URL, industry, audience)
- **Output:** Intent classification, confidence score, business value, recommended content type
- **Model Tier:** Simple (Haiku/GPT-4o mini for speed)
- **Processing:** Batches keywords (50 per batch) for efficiency
- **Enabled By:** `CAPABILITY_INTENT=true`
- **Cost Estimate:** ~$0.0008-0.003 per 1K tokens input

**Sample Request:**
```json
{
  "keywords": ["buy shoes online", "running shoes benefits", "nike store near me"],
  "context": {
    "siteUrl": "example.com",
    "industry": "footwear",
    "targetAudience": "runners"
  }
}
```

**Sample Response:**
```json
{
  "classifications": [
    {
      "query": "buy shoes online",
      "intent": "transactional",
      "confidence": 0.95,
      "businessValue": 9,
      "contentType": "landing-page",
      "reasoning": "User is ready to purchase"
    }
  ],
  "metadata": {
    "provider": "claude",
    "keywordsProcessed": 3,
    "tokensUsed": {"input": 450, "output": 200},
    "cost": 0.004
  }
}
```

---

### 2. **Anomaly Diagnosis** (`/ai/anomaly-diagnose`)
- **Purpose:** Root-cause analysis for sudden metric changes
- **Input:** Array of detected anomalies + current analytics snapshot
- **Output:** Likely cause, confidence, immediate action, investigation steps
- **Anomaly Types Analyzed:**
  - Google algorithm updates
  - Technical issues (downtime, robots.txt, canonicals, redirects)
  - Content changes (edits, removals, URL changes)
  - Competitor actions
  - Seasonal patterns
  - Data artifacts
- **Model Tier:** Standard (Sonnet 4/GPT-4o)
- **Processing:** Top 5 anomalies by severity
- **Enabled By:** `CAPABILITY_ANOMALY=true`

**Sample Request:**
```json
{
  "anomalies": [
    {
      "type": "traffic_drop",
      "severity": "critical",
      "keyword": "target keyword",
      "previousValue": 1200,
      "currentValue": 450,
      "changePercent": -62.5
    }
  ],
  "currentData": {
    "avgRank": 15,
    "totalImpressions": 5000,
    "totalClicks": 200
  }
}
```

---

### 3. **Embedding Clustering** (`/ai/embedding-cluster`)
- **Purpose:** Semantic keyword clustering using vector embeddings
- **Input:** Keywords with metadata (clicks, impressions, CTR, position)
- **Output:** Clustered keyword groups with semantic relationships
- **Model Used:** BGE-base embeddings (Cloudflare Workers AI)
- **Similarity Threshold:** Default 0.7 (configurable)
- **Enabled By:** `CAPABILITY_EMBEDDINGS=true`
- **Cost:** Free (Cloudflare Workers AI)

**Sample Input:**
```json
{
  "keywords": [
    {"query": "blue running shoes", "clicks": 45, "impressions": 200, "ctr": 0.225, "position": 8},
    {"query": "best running shoes", "clicks": 120, "impressions": 500, "ctr": 0.24, "position": 3}
  ],
  "minSimilarity": 0.7
}
```

---

### 4. **Conversational Analytics** (`/ai/chat`)
- **Purpose:** Natural language Q&A about SEO analytics data
- **Input:** User message + analytics context + optional history
- **Output:** Text answer with citations to data
- **Model Tier:** Standard (Sonnet 4/GPT-4o)
- **Context Window:** Up to 200K tokens (Claude advantage)
- **Enabled By:** `CAPABILITY_CHAT=true`
- **Features:**
  - Multi-turn conversation with history
  - Context-aware responses
  - Citation of source metrics

**Sample Request:**
```json
{
  "message": "Why did traffic drop last week?",
  "analyticsContext": {
    "weeklyTraffic": {"previous": 5000, "current": 3800},
    "topDroppedKeywords": ["keyword1", "keyword2"],
    "competitorActivity": "Increased"
  },
  "history": []
}
```

---

### 5. **Content Rewrite Suggestions** (`/ai/content-rewrite`)
- **Purpose:** AI-generated title, meta description, and H1 rewrites
- **Input:** Array of pages with current content + target keywords + position/CTR
- **Output:** Recommended rewrites for maximum CTR/engagement
- **Model Tier:** Standard (Sonnet 4/GPT-4o)
- **Optimization Focus:** Click-through rate, keyword relevance, user intent match
- **Enabled By:** `CAPABILITY_REWRITES=true`

**Sample Request:**
```json
{
  "pages": [
    {
      "url": "/products/running-shoes",
      "title": "Running Shoes",
      "description": "We sell running shoes",
      "h1": "Running Shoes",
      "targetKeywords": ["best running shoes", "affordable running shoes"],
      "position": 12,
      "ctr": 0.08
    }
  ]
}
```

---

### 6. **Recommendation Refiner** (`/ai/refine-recs`)
- **Purpose:** Two-pass AI refinement of SEO recommendations
  - **Pass 1:** Critique original recommendations for evidence/feasibility
  - **Pass 2:** Generate improved, evidence-backed recommendations
- **Input:** Original recommendations + analytics context for evidence
- **Output:** Refined recommendations with justification
- **Model Tier:** Complex (Opus 4 option, or fallback to Sonnet 4)
- **Processing:** Two-turn prompt for depth
- **Enabled By:** `CAPABILITY_REFINER=true`

---

### 7. **Smart Forecasting** (`/ai/smart-forecast`)
- **Purpose:** Context-aware metric forecasting (beyond linear regression)
- **Input:** Historical metrics + context (seasonality, events, trends)
- **Output:** Forecast with confidence intervals + interpretation
- **Model Tier:** Complex (Sonnet 4/Opus 4)
- **Forecast Periods:** Next 7/30/90 days
- **Considerations:**
  - Seasonal patterns
  - Recent algorithm updates
  - Competitor moves
  - Content changes
- **Enabled By:** `CAPABILITY_FORECAST=true`

---

## Part 2: API Endpoints Inventory

### Discovery Endpoints (No Auth Required)

#### `GET /`
**Health Check — HTTP GET with no auth**
```json
{
  "service": "ai-engine",
  "version": "2.0.0",
  "environment": "development|staging|production",
  "healthy": true,
  "checks": {
    "kv_ai": { "status": "ok" },
    "workers_ai": { "status": "ok" },
    "providers": {
      "status": "ok",
      "available": 3,
      "total": 6,
      "details": {
        "claude": "configured",
        "openai": "not configured",
        "cloudflare": "configured"
      }
    }
  }
}
```

#### `GET /ai/capabilities`
**List all available capabilities** — Bearer auth required
```json
{
  "engine": "ai-engine",
  "version": "2.0.0",
  "providers": [
    {"id": "claude", "name": "Anthropic Claude", "tier": "premium"},
    {"id": "cloudflare", "name": "Cloudflare Workers AI", "tier": "free"}
  ],
  "capabilities": [
    {
      "id": "intent-classify",
      "name": "AI Intent Classifier",
      "endpoint": "/ai/intent-classify",
      "method": "POST",
      "enabled": true,
      "inputSchema": {...}
    }
    // ... 6 more
  ]
}
```

#### `GET /ai/providers`
**List configured AI providers** — Bearer auth required
```json
{
  "claude": {
    "id": "claude",
    "name": "Anthropic Claude",
    "available": true,
    "models": [
      {"id": "claude-sonnet-4", "contextWindow": 200000, "maxOutput": 16384},
      {"id": "claude-opus-4", "contextWindow": 200000, "maxOutput": 32768},
      {"id": "claude-haiku-3.5", "contextWindow": 200000, "maxOutput": 8192}
    ]
  },
  "openai": {
    "available": false,
    "message": "No API key configured"
  }
}
```

#### `GET /ai/usage`
**7-day usage summary** — Bearer auth required
```json
{
  "date": "2025-02-09",
  "requests": 1523,
  "totalCost": 45.67,
  "byProvider": {
    "claude": {"requests": 900, "cost": 23.45},
    "openai": {"requests": 623, "cost": 22.22}
  },
  "byCapability": {
    "chat": {"requests": 500, "cost": 12.34},
    "intent-classify": {"requests": 600, "cost": 3.45}
  },
  "totalTokens": {"input": 1500000, "output": 350000},
  "totalDurationMs": 123400
}
```

### Capability Endpoints (Bearer Auth Required — POST)

| Endpoint | Description | Model Tier | Input | Rate Limit |
|----------|-------------|-----------|-------|-----------|
| `POST /ai/intent-classify` | Keyword intent classification | Simple | Keywords array | Batch 50 |
| `POST /ai/anomaly-diagnose` | Root-cause analysis | Standard | Anomalies array | Top 5 |
| `POST /ai/embedding-cluster` | Semantic clustering | Free (CF) | Keywords array | Unlimited* |
| `POST /ai/chat` | Conversational Q&A | Standard | Message + context | Multi-turn |
| `POST /ai/content-rewrite` | Title/meta rewrites | Standard | Pages array | Unlimited* |
| `POST /ai/refine-recs` | Recommendation refinement | Complex | Recommendations array | Unlimited* |
| `POST /ai/smart-forecast` | Metric forecasting | Complex | Historical data | Unlimited* |

*Unlimited per endpoint, but subject to global rate limit (see deployment config)

---

## Part 3: Providers Inventory

### Provider Capabilities Matrix

| Provider | API Endpoint | Auth Type | Models | Tier | Strengths | Cost |
|----------|--------------|-----------|--------|------|-----------|------|
| **Claude** | api.anthropic.com | Header (x-api-key) | Opus 4, Sonnet 4, Haiku 3.5 | Premium | Reasoning, long-context, structured output | $0.08-0.075/1K |
| **OpenAI** | api.openai.com | Bearer | GPT-4o, GPT-4o mini | Premium | Vision, function calling, creativity | $2.50-10/1K |
| **Gemini** | generativelanguage.googleapis.com | Query param | Gemini 2.0, Flash | Premium | Speed, multimodal, long-context | ~$1.25-5/1K |
| **Mistral** | api.mistral.ai | Bearer | Mistral-Large, Mistral-Small | Mid | Speed, coding, EU compliance | $0.27-2.87/1K |
| **DeepSeek** | api.deepseek.com | Bearer | DeepSeek V3, V2 | Budget | Reasoning, math, cost-efficient | $0.14-0.28/1K |
| **Cloudflare** | Local binding | Binding | Llama 3.3-70B, Llama 3.1-8B | Free | Zero-cost, low-latency, embeddings | Free (10K/day) |

### Model Selection Logic

The system automatically routes requests based on:

1. **Task Complexity:**
   - `simple` → Haiku/mini models (fast, cheap)
   - `standard` → Sonnet/GPT-4o (balanced)
   - `complex` → Opus/o1 (best quality)

2. **Capability Requirements:**
   - Intent classification → Simple
   - Anomaly diagnosis → Standard
   - Recommendation refining → Complex
   - Forecasting → Complex
   - Embeddings → CF Workers AI (free)

3. **Provider Priority (default):**
   - Claude > OpenAI > Gemini > Mistral > DeepSeek > Cloudflare

4. **Fallback Chain:**
   - If preferred provider fails, tries next in priority list
   - Cloudflare is always fallback option

5. **User Override:**
   - Set `AI_PROVIDER=specific-provider` to force provider
   - Set `AI_PREFERRED_PROVIDER=claude` to change default

---

## Part 4: Deployment Configuration

### Environment Variables (wrangler.toml)

#### Public Variables (`[vars]`)

| Variable | Type | Default | Purpose | Example |
|----------|------|---------|---------|---------|
| `ENVIRONMENT` | string | "development" | Runtime environment | "production" |
| `AI_PROVIDER` | string | "auto" | Route strategy | "auto" or "claude" |
| `AI_PREFERRED_PROVIDER` | string | "claude" | Preferred fallback | "claude" |
| `MAX_REQUESTS_PER_HOUR` | string | "120" | Rate limit | "300" (production) |
| `CAPABILITY_INTENT` | string | "true" | Enable/disable | "true" or "false" |
| `CAPABILITY_ANOMALY` | string | "true" | Enable/disable | "true" or "false" |
| `CAPABILITY_EMBEDDINGS` | string | "true" | Enable/disable | "true" or "false" |
| `CAPABILITY_CHAT` | string | "true" | Enable/disable | "true" or "false" |
| `CAPABILITY_REWRITES` | string | "true" | Enable/disable | "true" or "false" |
| `CAPABILITY_REFINER` | string | "true" | Enable/disable | "true" or "false" |
| `CAPABILITY_FORECAST` | string | "true" | Enable/disable | "true" or "false" |
| `CF_MODEL_LARGE` | string | "llama-3.3-70b..." | Cloudflare large model | |
| `CF_MODEL_SMALL` | string | "llama-3.1-8b..." | Cloudflare small model | |
| `CF_MODEL_EMBEDDING` | string | "bge-base..." | Embedding model | |

#### Secrets (via `wrangler secret put`)

| Secret | Required | Purpose | Example |
|--------|----------|---------|---------|
| `AI_ENGINE_TOKEN` | Yes | Shared auth token with visibility-analytics | 40+ char alphanumeric |
| `ANTHROPIC_API_KEY` | No* | Claude API access | sk-ant-... |
| `OPENAI_API_KEY` | No | OpenAI API access | sk-... |
| `GOOGLE_AI_API_KEY` | No | Gemini API access | AIzaSy... |
| `MISTRAL_API_KEY` | No | Mistral API access | ... |
| `DEEPSEEK_API_KEY` | No | DeepSeek API access | ... |

*At least one provider required, or Cloudflare Workers AI (free) is used.

#### Bindings

| Binding | Type | Purpose | Config Reference |
|---------|------|---------|-------------------|
| `AI` | Workers AI | ML models (Llama, BGE embeddings) | Built-in, no config needed |
| `KV_AI` | KV Namespace | Rate limiting + usage tracking | Configured in `[[kv_namespaces]]` |
| `VECTORIZE` (optional) | Vectorize | Advanced semantic search | Configured in `[[vectorize]]` |

### Environment-Specific Configs

#### Development
```toml
[vars]
ENVIRONMENT = "development"
AI_PROVIDER = "auto"
MAX_REQUESTS_PER_HOUR = "120"
CAPABILITY_* = "true"  # All enabled
```
- **Use Case:** Local testing, `npm run dev`
- **KV Namespace:** Same as production
- **Auth:** Disabled if no token in .dev.vars

#### Staging
```toml
[env.staging]
vars = { 
  ENVIRONMENT = "staging", 
  AI_PROVIDER = "auto", 
  MAX_REQUESTS_PER_HOUR = "60" 
}
[[env.staging.kv_namespaces]]
binding = "KV_AI"
id = ""  # Different namespace
```
- **Use Case:** Pre-production testing
- **Rate Limit:** 60 req/hr (conservative)
- **Secrets:** Shared with production (inherited)

#### Production
```toml
[env.production]
vars = { 
  ENVIRONMENT = "production", 
  AI_PROVIDER = "auto", 
  AI_PREFERRED_PROVIDER = "claude",
  MAX_REQUESTS_PER_HOUR = "300"  # Higher limit
}
routes = [
  { pattern = "ai.wetechfounders.workers.dev/*", zone_name = "" }
]
[[env.production.kv_namespaces]]
binding = "KV_AI"
id = ""  # Production namespace
```
- **Use Case:** Live traffic
- **Rate Limit:** 300 req/hr (generous)
- **Auth:** REQUIRED (`AI_ENGINE_TOKEN` must be set)
- **Secrets:** All provider keys expected

---

## Part 5: Deployment Checklist

### Pre-Deployment Setup

#### 1. Install Dependencies
```bash
npm install
npm install -g wrangler  # or use npx wrangler
```

#### 2. Configure Cloudflare Account
```bash
wrangler login
# Follow browser-based auth flow
```

#### 3. Create KV Namespaces

**Development:**
```bash
wrangler kv:namespace create KV_AI
# Copy ID to wrangler.toml [[kv_namespaces]] section
```

**Staging:**
```bash
wrangler kv:namespace create KV_AI --env staging
```

**Production:**
```bash
wrangler kv:namespace create KV_AI --env production
```

#### 4. Set Secrets

**All environments need at least one:**
```bash
# Production
wrangler secret put AI_ENGINE_TOKEN --env production
wrangler secret put ANTHROPIC_API_KEY --env production
wrangler secret put OPENAI_API_KEY --env production  # Optional

# Staging
wrangler secret put AI_ENGINE_TOKEN --env staging
wrangler secret put ANTHROPIC_API_KEY --env staging

# Development (local .dev.vars instead)
# Copy .dev.vars.example to .dev.vars and edit
```

#### 5. Configure Vectorize (Optional, for Advanced Embeddings)
```bash
# Create index (one-time)
wrangler vectorize create seo-embeddings --dimensions=768 --metric=cosine

# Uncomment in wrangler.toml:
# [[vectorize]]
# binding = "VECTORIZE"
# index_name = "seo-embeddings"
```

### Deployment Commands

```bash
# Development (local)
npm run dev
# Server runs at http://localhost:8787

# Staging
npm run deploy:staging

# Production
npm run deploy:production

# Check live logs
npm run tail

# List KV keys
npm run kv:list
```

### Post-Deployment Validation

```bash
# Health check
curl https://ai.wetechfounders.workers.dev/

# Capability discovery (replace YOUR_TOKEN)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://ai.wetechfounders.workers.dev/ai/capabilities

# Test intent classifier
curl -X POST https://ai.wetechfounders.workers.dev/ai/intent-classify \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"keywords": ["buy shoes online"]}'

# Check usage
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://ai.wetechfounders.workers.dev/ai/usage
```

---

## Part 6: Architecture & Security

### Request Flow Diagram

```
visibility-analytics
    │
    ├─ Bearer Token / Service Binding
    └──►  AI Engine Worker
         │
         ├─► Auth Middleware (verify token)
         ├─► Rate Limiter (check KV quota)
         ├─► Route Handler (dispatch to capability)
         │
         └──► Capability Handler (e.g., intent-classify)
              │
              └──► Multi-Model Provider Router
                   │
                   ├─► resolveModelChain() [select models based on complexity]
                   │
                   ├──► Claude Adapter → api.anthropic.com
                   ├──► OpenAI Adapter → api.openai.com
                   ├──► Gemini Adapter → generativelanguage.googleapis.com
                   ├──► Mistral Adapter → api.mistral.ai
                   ├──► DeepSeek Adapter → api.deepseek.com
                   └──► Cloudflare Adapter → Workers AI binding
                        │
                        ├─► KV (rate limit tracking)
                        └─► KV (usage logging)
```

### Authentication Methods

**Method 1: Service Binding (Preferred for worker-to-worker)**
- Header: `x-ai-engine-service: visibility-analytics`
- No token in request body
- Trust: Implicit (Cloudflare validates service)

**Method 2: Bearer Token (HTTP clients)**
- Header: `Authorization: Bearer <AI_ENGINE_TOKEN>`
- Token set via `wrangler secret put AI_ENGINE_TOKEN`
- For external integrations, webhooks, SDKs

**Method 3: Dev Mode (Local only)**
- If no token configured and `ENVIRONMENT != production`
- Allows unauthenticated access for development
- **NEVER** used in production

### Rate Limiting

- **Per-hour limit** stored in KV with auto-expiring keys
- **Default:** 120 req/hr (dev), 60 req/hr (staging), 300 req/hr (production)
- **Identifier:** IP address or service name (if service binding used)
- **Response on limit exceeded:**
  ```json
  {
    "error": "Rate limit exceeded",
    "limit": 120,
    "resetAt": "2025-02-09T21:00:00Z",
    "status": 429
  }
  ```

### Cost Tracking

Every request logs:
- Tokens used (input + output)
- Estimated cost per provider pricing
- Duration
- Provider/model selection

**Usage Summary** available via `GET /ai/usage`

---

## Part 7: Troubleshooting

### "AI Engine not configured"
```bash
# 1. Check if worker deployed
npm run tail

# 2. Check health endpoint
curl https://ai-engine.workers.dev/

# 3. Verify secrets exist
wrangler secret list

# 4. Re-run setup
npm run setup
```

### "Provider not available"
```bash
# Check configured providers
curl -H "Authorization: Bearer TOKEN" \
  https://ai-engine.workers.dev/ai/providers

# Add missing API key
wrangler secret put ANTHROPIC_API_KEY

# Redeploy
npm run deploy:production
```

### "Rate limited"
```bash
# Check hourly usage
curl -H "Authorization: Bearer TOKEN" \
  https://ai-engine.workers.dev/ai/usage

# Increase limit in wrangler.toml
# [env.production]
# vars = { MAX_REQUESTS_PER_HOUR = "500" }

npm run deploy:production
```

### "KV namespace error"
```bash
# List namespaces
wrangler kv:namespace list

# Create missing namespace
wrangler kv:namespace create KV_AI --env production

# Update ID in wrangler.toml and redeploy
```

### "Authentication failed"
```bash
# 1. Verify token is set
wrangler secret get AI_ENGINE_TOKEN

# 2. Check domain hasn't changed
# (secret may be associated with specific domain)

# 3. Re-set secret
wrangler secret put AI_ENGINE_TOKEN

# 4. Verify Authorization header format
# Header: "Authorization: Bearer <token>"
# NOT "Authorization: Token <token>"
```

---

## Part 8: Cost Estimation

### Per 1K Tokens (Input/Output)

| Provider | Model | Input | Output | Use Case |
|----------|-------|-------|--------|----------|
| Claude | Sonnet 4 | $0.003 | $0.015 | Standard analysis (RECOMMENDED) |
| Claude | Opus 4 | $0.015 | $0.075 | Complex refinement |
| Claude | Haiku | $0.0008 | $0.004 | Simple classification (bulk) |
| OpenAI | GPT-4o | $0.0025 | $0.010 | Alternative to Sonnet |
| Gemini | Gemini 2.0 | $0.075 | $0.3 | Fast, multimodal |
| DeepSeek | V3 | $0.0014 | $0.0028 | Budget alternative |
| Mistral | Large | $0.0027 | $0.0081 | EU-friendly |
| Cloudflare | Llama 70B | Free | Free | Fallback (10K neurons/day) |

### Example Monthly Costs (1M requests @ 1K avg tokens)

| Scenario | Monthly Cost | Notes |
|----------|-------------|-------|
| 100% Claude Sonnet | $1,800 | `tokensUsed.input: 500K, output: 500K` |
| 80% Claude + 20% DeepSeek | $1,450 | Mixed tier strategy |
| 50% Claude + 50% OpenAI | $1,650 | Balanced providers |
| 100% Cloudflare (free tier) | FREE* | 10K neurons/day limit |

*Free tier limited to 10,000 neurons/day; overages cost money

---

## Part 9: Security Best Practices

### Secrets Management
✅ **DO:**
- Use `wrangler secret put` for all API keys
- Rotate secrets annually
- Use different keys for staging/production
- Store backup in secure vault (1Password, Vault, etc.)

❌ **DON'T:**
- Commit secrets to Git (`.dev.vars` in .gitignore)
- Share tokens in Slack/email
- Use same token for multiple environments
- Log token values anywhere

### Network Security
✅ **DO:**
- Enable service binding auth for worker-to-worker
- Enforce HTTPS-only (Workers default)
- Use rate limiting (10-minute time window in KV)
- Monitor usage logs for anomalies

❌ **DON'T:**
- Allow unauthenticated access to production
- Open worker to `*` origins (CORS is set to wildcard for dev)
- Store sensitive data in KV (it's for rate limit counters only)

### Data Privacy
- **No sensitive data logged:** Requests/responses sanitized
- **Usage tracked:** only `provider`, `model`, `tokensUsed`, `cost`
- **KV data:** expires automatically (1-hour TTL for rate limits)
- **No long-term storage:** logs purged after 7 days

---

## Part 10: Monitoring & Observability

### Health Check Endpoint
```
GET /
Response includes:
  - kv_ai status
  - workers_ai binding status
  - All configured providers (available/not configured)
```

### Usage Tracking
```
GET /ai/usage
Returns 7-day summary:
  - Total requests and cost
  - Breakdown by provider and capability
  - Token usage
  - Average duration
```

### Tail Logs
```bash
npm run tail
# Streams real-time logs from all worker instances
```

### Alert Rules (Recommended)
- **Rate limit exceeded:** Check spam activity
- **Provider failures:** Test API key validity
- **High cost:** Verify model selection logic
- **Latency spike:** Check provider status page

---

## Part 11: Version & Dependencies

### Package.json

```json
{
  "name": "ai-engine",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@tamyla/clodo-framework": "^4.4.1"
  },
  "devDependencies": {
    "vitest": "^4.0.18",
    "wrangler": "^3.57.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Build & Deploy Scripts
| Script | Purpose |
|--------|---------|
| `npm run dev` | Local development server (port 8787) |
| `npm run deploy` | Deploy to staging |
| `npm run deploy:staging` | Deploy to staging (explicit) |
| `npm run deploy:production` | Deploy to production |
| `npm test` | Run unit tests |
| `npm run test:watch` | Watch mode |
| `npm run test:coverage` | Coverage report |
| `npm run tail` | Stream live logs |
| `npm run kv:list` | List KV keys |

### Node.js Compatibility
- **Minimum:** Node.js 18.0.0
- **Recommended:** Node.js 20.x LTS

---

## Summary Checklist

### Core Capabilities (7)
- ✅ Intent Classifier
- ✅ Anomaly Diagnosis
- ✅ Embedding Clustering
- ✅ Conversational Analytics
- ✅ Content Rewrites
- ✅ Recommendation Refiner
- ✅ Smart Forecasting

### AI Providers (6)
- ✅ Claude (Anthropic) — RECOMMENDED
- ✅ OpenAI (GPT-4o)
- ✅ Gemini (Google)
- ✅ Mistral AI
- ✅ DeepSeek
- ✅ Cloudflare Workers AI (free fallback)

### API Endpoints (10)
- ✅ `GET /` — Health check
- ✅ `GET /ai/capabilities` — Manifest
- ✅ `GET /ai/providers` — Provider status
- ✅ `GET /ai/usage` — Usage summary
- ✅ `POST /ai/intent-classify`
- ✅ `POST /ai/anomaly-diagnose`
- ✅ `POST /ai/embedding-cluster`
- ✅ `POST /ai/chat`
- ✅ `POST /ai/content-rewrite`
- ✅ `POST /ai/refine-recs`
- ✅ `POST /ai/smart-forecast`

### Deployment Environments
- ✅ Development (local via npm run dev)
- ✅ Staging (wrangler deploy --env staging)
- ✅ Production (wrangler deploy --env production)

### Configuration Items
- ✅ 1 shared auth token (`AI_ENGINE_TOKEN`)
- ✅ Up to 6 provider API keys
- ✅ 3 environment-specific KV namespaces
- ✅ 7 capability toggles
- ✅ Rate limit per environment
- ✅ Provider routing strategy

---

**Last Updated:** February 9, 2026  
**Maintained By:** AI Engine Team  
**Questions?** Check `/README.md` or `npm run setup:check`
