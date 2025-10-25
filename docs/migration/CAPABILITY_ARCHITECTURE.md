# Cloudflare Migration Capability Architecture

Design for a platform-agnostic importer that transforms apps from platforms like Vercel, Railway, Netlify, and Render into Cloudflare-native deployments, powered by Clodo.

## Objectives

- Decouple source platforms via adapters; share a common domain model
- Make transformations rule-driven and testable
- Support multiple targets (Pages, Workers) with consistent orchestration

## Core Capabilities

1) Detection & Discovery
- Source detectors: Identify platform via config files (vercel.json, railway.json, netlify.toml), package.json hints, and framework heuristics
- Project graph: Build a dependency and route graph (pages, APIs, middleware, assets)

2) Parsers & Domain Model
- Parsers for source configs and framework settings
- Domain model entities:
  - App: name, framework, routes, envs, services
  - Route: path, type (SSR/SSG/API/static), middleware
  - Service: KV/Blob/DB/Queue/Cron/Images/EdgeConfig
  - Policy: headers, caching, security (CSP), redirects, rewrites

3) Mapping Library (Rules Engine)
- Rules by source→target mapping (e.g., VercelKV→CloudflareKV)
- Strategy selection: choose Pages+Next vs Workers, depending on features
- Rule severity: auto-map, manual, or blocker; all produce actionable messages

4) Transformers
- Config transformers: vercel.json → wrangler.toml, headers.json, _routes.json
- Code transformers (codemods): API routes to functions; middleware to Workers; image loader adjustments
- Env/secret mappers: export/import, namespacing, environment mapping

5) Generators & Emitters
- Emit target structure:
  - Pages: functions/, _routes.json, headers.json, next plugin config
  - Workers: src/handlers/*, routers, Hono/itty templates
  - wrangler.toml with bindings (KV, R2, D1, DO, Queues, Cron)

6) Orchestration & Provisioning
- Provision target resources via Wrangler and Cloudflare APIs
- Safeguards: idempotency, naming prefixes, dry-run mode
- Environment alignment: production/preview/dev linked to branches

7) Validation & Testing
- Parity validator: route presence, status codes, headers, cookies
- SSR snapshots: key pages compare selected DOM markers
- Performance checks: TTFB budget; cache-control correctness

8) Data Migration Toolkit
- KV copy pipelines with retry/backoff and checksum
- Blob sync (S3-compatible) with concurrent multipart uploads
- DB migrate/export adapters (PG, D1); prepared statements & quota awareness

9) Observability & Reporting
- Migration report with mapping matrix, warnings, blockers, and estimated effort
- Telemetry (optional): anonymized mapping stats to improve rules

10) Extensibility Model
- Source adapters: implements ISourceAdapter (detect, parse, extract)
- Target adapters: implements ITargetAdapter (generate, provision, deploy)
- Rule packs: composable sets for Vercel, Railway, Netlify

## Key Interfaces (Contracts)

- ISourceAdapter
  - detect(repo): boolean
  - parse(repo): SourceProject
  - extract(repo): DomainModel

- ITargetAdapter
  - plan(model): TargetPlan
  - generate(model, plan): GeneratedArtifacts
  - provision(plan): ProvisionResult
  - deploy(plan): DeployResult

- Rule
  - id, source, target, applies(model) → boolean
  - transform(model, ctx) → Patch[] | Warning[] | Blocker

- ParityReport
  - coverage %, auto-mapped, manual steps, blockers, risk level

## Supported Sources (Roadmap)

- Vercel: Next.js (App/Pages), KV, Blob, Edge Config, Cron, Postgres
- Railway: Services (web, worker), PG/Redis, variables, domains
- Netlify: redirects, functions, edge middleware, envs
- Render: services, cron jobs, disk usage flags

## Targets

- Cloudflare Pages: Next plugin, functions, headers, routes
- Cloudflare Workers: Hono-based router, DO for state, KV/R2/D1 bindings

## Security & Compliance

- Secrets never written to disk in plaintext; use OS keychain or CF secrets API
- Opt-in PII redaction for reports
- Audit log for provisioning actions

## Delivery Model

- OSS CLI core + commercial rule packs/support
- Hosted UI (later): projects, reports, diffs, retry/provisioning, billing

## Example End-to-End (Vercel → Cloudflare Pages)

- Detect Next.js App Router; parse vercel.json; extract rewrites/headers
- Apply rules: map KV→KV, Blob→R2, Edge Config→KV
- Generate: wrangler.toml, _routes.json, functions/api/*, next plugin config
- Provision KV/R2/D1; map env vars; seed data if asked
- Validate with smoke tests; produce parity report; deploy preview

This architecture enables additional sources (e.g., Railway) by implementing new adapters and rule packs without changing the core.
