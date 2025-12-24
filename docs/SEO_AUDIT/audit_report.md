# SEO/AEO Quick Audit — December 24, 2025

## Scope
Target queries: "D1 error", "Wrangler multi-tenant", "Workers authentication help", "Cloudflare Workers boilerplate", "Workers cold start Nextjs".

## High-level findings
- Multi-tenant coverage: Strong foundation (`/multi-tenant-saas.html` exists and is well-structured) but missing Wrangler-specific examples.
- D1 coverage: D1 is referenced in guides and blog posts, but there is no dedicated troubleshooting page or FAQ for D1 errors.
- Authentication: Example snippets exist (basic auth, header PSK), but there is no exhaustive guide covering JWT/OAuth/Access/T urnstile and best practices.
- Boilerplate templates: Starter templates are present in repo and external Cloudflare templates; missing a single canonical 'boilerplate' landing page for discovery and comparison.
- Cold-start / Next.js: Workers' zero-cold-start advantage is documented, but there's no focused Next.js cold-start guide or benchmarks.
- Structured data: JSON-LD snippets are present in several pages (FAQ/SoftwareApplication in blog/index), but not consistently applied to the target pages.

## Immediate recommendations (first 7 days)
1. Verify site in Google Search Console and submit sitemap (if not done).  
2. Create `/d1-errors/` troubleshooting page (FAQ schema) as a high-impact, high-priority page.  
3. Expand `/multi-tenant-saas/` with Wrangler-based examples and HowTo schema.  
4. Draft `/workers-auth/` with JWT/OAuth/Access content and add QAPage schema.  
5. Create the keyword→page mapping (see `keyword_mapping.csv`) and prioritize content work.

## Next steps
- Produce draft pages for the three highest-priority topics: D1 errors, Wrangler multi-tenant, and Workers authentication.  
- Add structured data (FAQ/HowTo) and validate with Rich Results Test.  
- Run performance audits (Lighthouse) on new pages and optimize for CWV.  
- Prepare outreach plan for Cloudflare community & StackOverflow.

## Owner & Deliverables
- Deliverables created: `docs/SEO_AUDIT/keyword_mapping.csv`, `docs/SEO_AUDIT/audit_report.md` (this file)  
- Next deliverable: keyword→page spreadsheet with SERP competitor links and priority scoring.

---

P.S. Let me know if you want me to open a PR for these docs (recommended) so we can iterate in a branch and attach the audit files to the PR.