# AI Engine — Multi-Model AI Worker

Standalone AI service for SEO analytics, built on Cloudflare Workers with support for 6 AI providers.

## Features

- **6 AI Providers**: Claude (recommended), OpenAI, Google Gemini, Mistral, DeepSeek, Cloudflare Workers AI (free fallback)
- **7 Capabilities**: Intent classification, anomaly diagnosis, embedding clustering, conversational AI, content rewriting, recommendation refinement, smart forecasting
- **Smart Routing**: Automatic model selection based on task complexity and provider availability
- **Cost Tracking**: Per-request cost estimation and usage logging
- **Rate Limiting**: KV-backed hourly limits with configurable thresholds
- **Zero-Trust Auth**: Service binding, bearer token, or dev mode

## Quick Start

### Option 1: Node.js Scripts (Cross-Platform)

```bash
# Interactive setup (collects API keys, creates .dev.vars, sets up KV, pushes secrets)
npm run setup

# Just check current configuration
npm run setup:check

# Local-only setup (no Cloudflare interaction)
npm run setup:local
```

### Option 2: PowerShell Scripts (Windows)

```powershell
# Interactive setup
npm run setup:ps

# Just check current configuration
npm run setup:ps:check

# Local-only setup
npm run setup:ps:local
```

### Manual Setup

1. **Prerequisites**:
   ```bash
   node --version  # v18+
   npx wrangler --version
   npm install
   ```

2. **Configure Secrets**:
   ```bash
   # Copy template
   cp .dev.vars.example .dev.vars

   # Edit with your API keys
   # AI_ENGINE_TOKEN=your-shared-token
   # ANTHROPIC_API_KEY=sk-ant-api03-...
   # OPENAI_API_KEY=sk-...
   # etc.
   ```

3. **Setup Cloudflare**:
   ```bash
   # Authenticate
   npx wrangler login

   # Create KV namespace
   npm run setup:kv

   # Push secrets
   npx wrangler secret put AI_ENGINE_TOKEN
   npx wrangler secret put ANTHROPIC_API_KEY
   ```

4. **Deploy**:
   ```bash
   npm run deploy
   ```

## API Endpoints

### Discovery
- `GET /` - Health check
- `GET /ai/capabilities` - List available capabilities
- `GET /ai/providers` - List configured providers
- `GET /ai/usage` - Usage statistics

### Capabilities
- `POST /ai/intent-classify` - Classify keyword intents
- `POST /ai/anomaly-diagnose` - Diagnose traffic anomalies
- `POST /ai/embedding-cluster` - Cluster keywords by embeddings
- `POST /ai/chat` - Conversational AI with analytics context
- `POST /ai/content-rewrite` - Rewrite page titles/descriptions
- `POST /ai/recommendation-refine` - Refine SEO recommendations
- `POST /ai/smart-forecast` - Forecast metrics with AI insights

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `AI_ENGINE_TOKEN` | Shared auth token with visibility-analytics | Yes |
| `ANTHROPIC_API_KEY` | Claude API key (recommended) | No* |
| `OPENAI_API_KEY` | OpenAI API key | No |
| `GOOGLE_AI_API_KEY` | Google Gemini API key | No |
| `MISTRAL_API_KEY` | Mistral AI API key | No |
| `DEEPSEEK_API_KEY` | DeepSeek API key | No |
| `AI_PROVIDER` | Default provider: `auto`, `claude`, `openai`, etc. | No |

*At least one provider key required, or Cloudflare Workers AI will be used (free but limited).

### Provider Routing

The `auto` mode routes requests based on:
1. **Task complexity**: Simple → Haiku/Mini/Flash, Standard → Sonnet 4/GPT-4o, Complex → Opus 4/o1
2. **Provider priority**: Claude → OpenAI → Gemini → DeepSeek → Mistral → Cloudflare
3. **Availability**: Skips providers without configured API keys

### Rate Limiting

- **Default**: 120 requests/hour
- **Staging**: 60 requests/hour
- **Production**: 300 requests/hour
- **KV-backed**: Persists across worker instances

## Development

```bash
# Local development
npm run dev

# Run tests
npm test

# Test specific capability
curl -X POST http://localhost:8787/ai/intent-classify \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"keywords": ["buy shoes online", "running shoes"]}'
```

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ visibility-     │    │   AI Engine      │    │   AI Providers  │
│ analytics       │◄──►│  Cloudflare      │◄──►│ Claude, OpenAI, │
│ (dashboard)     │    │  Worker          │    │ Gemini, etc.    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   Storage        │
                       │ KV (usage)       │
                       │ Vectorize (opt.) │
                       └──────────────────┘
```

## Security

- **Secrets**: Never committed, managed via `wrangler secret put`
- **Auth**: Service binding (preferred), bearer token, or dev mode
- **Validation**: All inputs validated, rate limiting enforced
- **Logging**: Usage tracked but no sensitive data logged

## Cost Estimation

Approximate costs per 1K tokens (as of 2025):

| Provider | Model | Input | Output | Notes |
|----------|-------|-------|--------|-------|
| Claude | Sonnet 4 | $3.00 | $15.00 | Best quality |
| OpenAI | GPT-4o | $2.50 | $10.00 | Strong alternative |
| DeepSeek | V3 | $0.14 | $0.28 | Lowest cost |
| Cloudflare | Llama 70B | Free | Free | 10K neurons/day |

## Troubleshooting

### Common Issues

1. **"AI Engine not configured"**
   - Run setup script: `npm run setup`
   - Check secrets: `npm run setup:check`

2. **"Provider not available"**
   - Add API key to `.dev.vars`
   - Push to Cloudflare: `npx wrangler secret put <KEY>`

3. **Rate limited**
   - Check usage: `GET /ai/usage`
   - Increase limits in `wrangler.toml`

4. **KV errors**
   - Create namespace: `npm run setup:kv`
   - Check wrangler.toml has correct ID

### Health Check

```bash
# Local
curl http://localhost:8787/

# Production
curl https://your-worker.workers.dev/
```

Response includes:
- Service status and version
- Provider availability
- KV connectivity
- Configuration validation