# Vercel → Cloudflare Migration Playbook

This playbook captures a pragmatic, automatable path to migrate apps from Vercel (often Next.js) to Cloudflare (Pages/Workers), using the Clodo Framework for scaffolding, validation, and orchestration.

## Goals

- Automate 70–90% of the migration via a CLI, with a clear parity report for the rest
- Preserve developer ergonomics (Next.js where possible) while adopting Cloudflare services
- Provide safe fallbacks and guidance for non-portable features

## Supported Targets

- Cloudflare Pages + Next.js (preferred for standard Next apps)
- Cloudflare Workers (for custom servers/middleware and non-Next stacks)

## Migration Flow (CLI UX)

- clodo migrate vercel [--target pages|workers] [--yes]
  1) Detect framework: Next.js version, App Router vs Pages Router, middleware, edge/serverless functions
  2) Parse vercel.json, next.config.js, package.json, env vars
  3) Map services (KV/Blob/Cron/Edge Config/Postgres) to Cloudflare
  4) Generate target artifacts (wrangler.toml, _routes.json, functions/, env mapping)
  5) Produce a parity report with warnings and remediation steps
  6) Optional: run preview deploy, smoke tests

## Config Mapping

- vercel.json → wrangler.toml
  - routes/rewrites/redirects → Pages/Workers routes or _routes.json
  - headers → Pages headers.json or Workers fetch handlers
  - env vars → wrangler.toml [vars] and secrets
- next.config.js → Cloudflare Next plugin and/or Workers entries
  - images domains → Cloudflare Images/static fallback
  - experimental flags → warn if unsupported

## Framework Mapping (Next.js)

- Pages Router: Use Cloudflare Pages + Next plugin; minimal changes
- App Router: Supported for many cases; warn on server actions requiring Node APIs
- Middleware: Map to Pages/Workers middleware equivalents; evaluate edge-runtime compatibility
- ISR/SSG:
  - Revalidate: Implement via cache + Workers revalidation route or Pages functions; document limitations
  - Fallback SSG: Map to pre-render in build; dynamic routes handled via SSR
- API Routes: Map to Pages Functions or Workers routes (Hono/itty-router)

## Services Mapping

- Vercel KV → Cloudflare KV
  - Key/namespace mapping; TTL semantics; size limits; eventual consistency notes
- Vercel Blob → Cloudflare R2
  - Public/private buckets; signed URLs; folder semantics; migration script provided
- Edge Config → KV/Durable Objects
  - Hierarchical config loader with per-environment overrides
- Cron → Cloudflare Cron Triggers
  - Translate schedules; name collisions guarded by prefixing
- Postgres (Vercel/Neon) → Options
  - Keep external PG via HTTP/Prisma driver (recommended for parity)
  - Or migrate to D1 (v2) where constraints fit; provide type/SQL adapters and caveats

## Runtime and Polyfills

- Workers runtime lacks Node built-ins (fs, net, tls, buffer sub-APIs)
  - Auto-detect usage; suggest polyfills or alternatives
  - Binary/native deps flagged; recommend alternatives or isolate behind HTTP

## Images and Optimization

- Next/Image optimizer → Cloudflare Images or static generation
  - For Pages: use CF Images via loader config; for Workers: route to Images API
  - Document differences in cache controls and sharp-like transforms

## Caching Strategy

- Explain CDN default caching vs application-level caching
- Provide utilities: cacheByRoute, cacheByHeader, revalidate tag keys
- Recommend KV-backed tag invalidation for SSR where needed

## Environment & Secrets

- Export Vercel env to .env, mark secrets; import via wrangler secret put
- Map Git branch envs to CF environments (production, preview, dev)

## Observability

- Replace Vercel Analytics with: Cloudflare Analytics/Logs + third-party (Sentry, Logflare)
- Provide request logging middleware sample, error boundaries, edge traces

## Parity Report (Sample)

- Summary: 84% auto-mapped, 6 warnings, 2 blockers
- Routes: 51 pages mapped, 3 rewrites migrated, 1 custom header manual
- Middleware: Migrated; note: rewrite in matcher pattern adjusted
- Services: KV→KV done; Blob→R2 pending data copy (script provided)
- Runtime: Detected node:crypto.randomUUID → replace with global crypto
- Images: Next/Image mapped to CF Images; update next.config.js loader
- Action items: list with code pointers

## Validation & Tests

- Generate route snapshot tests (pre vs post responses for key paths)
- SSR smoke tests: HTML contains title/meta; status codes; critical cookies set
- Edge function tests: middleware contract, headers, redirects

## Data Migration Helpers

- KV copy tool (Vercel KV → CF KV) with concurrency and retry
- Blob sync tool (Vercel Blob → R2) with checksum verification
- Database export/import scripts and optional Prisma migration hints

## Known Edge Cases

- Node native modules or binary deps (sharp without CF Images)
- ISR patterns relying on file-system cache
- On-demand revalidation APIs with custom auth paths
- WebSockets expectations beyond DO limits; plan Durable Objects rooms

## Rollout Strategy

- Dry run in preview env; compare metrics and error rates
- Canary by domain or route path
- Rollback instructions (DNS switchback, feature flag off)

---

This playbook underpins the clodo-migrate CLI and informs docs, warnings, and templates used to achieve high-confidence migrations.
