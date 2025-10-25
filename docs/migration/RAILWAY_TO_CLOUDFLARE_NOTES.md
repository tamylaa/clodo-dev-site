# Railway → Cloudflare Migration Notes (Preview)

High-level mapping to inform a future Railway adapter.

## Concepts Mapping

- Services (web/worker) → Cloudflare Pages (static + functions) or Workers
- Variables → wrangler.toml [vars] + secrets; environment scoping by Railway environments → CF envs
- Domains → Cloudflare DNS/Pages custom domains
- Databases
  - Postgres → Keep external PG (Neon) or migrate to D1 when feasible; provide Prisma/HTTP driver guidance
  - Redis → Map to KV/DO-based cache patterns; document limitations
- Cron Jobs → Cloudflare Cron Triggers
- Persistent Disk → Not available on Workers; replace with R2 or external storage

## Adapter Actions

- Parse railway.json/project config via CLI introspection
- Build service graph: which services expose HTTP, ports, envs, and dependencies
- Generate target:
  - Workers for API services; Pages for static frontends
  - wrangler.toml bindings (KV, R2, D1, Queues, DO)
- Env/Secrets migration with namespacing and branch mapping

## Edge Cases

- Native binaries in services (not portable to Workers)
- File system assumptions; stateful workloads
- Long-lived connections beyond DO scope; propose DO rooms or Queues

## Validation

- Port mapping to route mapping; probe health endpoints pre/post
- Data export scripts for PG, object storage sync to R2

These notes seed the Railway adapter design and will evolve as we validate real migrations.
