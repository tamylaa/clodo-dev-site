---
title: "Wrangler Multi-Tenant Patterns"
description: "How to configure Wrangler and Cloudflare Workers for multi-tenant SaaS: envs, per-tenant bindings, D1 strategies, and deployment patterns."
date: 2025-12-24
---

# Wrangler Multi-Tenant Patterns

*Draft outline — will expand with configs, examples, and HowTo schema.*

## Overview
- When to use multi-tenant vs single-tenant
- Key considerations: isolation, billing, data locality, scaling

## Wrangler Environments & Configuration
- Example `wrangler.toml`/`wrangler.jsonc` showing `[env.*]` usage and how names map to `my-worker-<env>`
- Using `[[d1_databases]]` per tenant vs shared DB

## Per-tenant D1 strategies
- Database-per-tenant vs single DB with tenant_id
- Read replicas and queue management

## HowTo: Deploy a new tenant
- Steps and automation example using Wrangler and the Cloudflare API

## FAQ
- "Can I bind thousands of D1 databases to a single Worker?" → explanation and limits
- "How do I route tenant requests?" → subdomain/subpath patterns and service bindings

<!-- TODO: Add full examples, HowTo JSON-LD schema, and code snippets -->