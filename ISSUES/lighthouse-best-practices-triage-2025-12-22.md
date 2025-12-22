Summary
=======

On 2025-12-21 a Lighthouse audit of production produced a Best Practices score regression (79). I triaged the production report and found two failing Best Practices audits that explain the regression:

1) `errors-in-console` (score: 0)
   - 3 network console errors: 503 responses for these URLs:
     - https://www.clodo.dev/docs
     - https://www.clodo.dev/pricing
     - https://www.clodo.dev/examples
   - fetchTime in report: 2025-12-21T18:30:26.476Z
   - Note: HEAD requests run locally now return 200, so the 503s look transient or triggered by edge rules (CF/WAF/Workers) during the audit.

2) `deprecations` (score: 0)
   - One deprecation: "StorageType.persistent is deprecated. Please use standardized navigator.storage instead." 
   - Source: https://www.clodo.dev/cdn-cgi/challenge-platform/scripts/jsd/main.js (Cloudflare challenge script)
   - This is an external script injected by Cloudflare (challenge / bot mitigation), not code we control.

Immediate reproduction
--------------------
- I ran HEAD checks against the three URLs and got HTTP 200 responses at the time of investigation. This suggests the 503s were transient or specific to the environment/UA used by Lighthouse.
  - Commands used:
    - Invoke-WebRequest -Uri "https://www.clodo.dev/docs" -Method Head
    - Invoke-WebRequest -Uri "https://www.clodo.dev/pricing" -Method Head
    - Invoke-WebRequest -Uri "https://www.clodo.dev/examples" -Method Head

Next actions (recommended)
-------------------------
1) Ops: Check Cloudflare/edge & origin logs (P0)
   - Search edge/Workers/logs/Firewall events around 2025-12-21T18:30:26Z for 503/Challenge/blocked events.
   - Check origin logs for any errors/timeouts/overload around that time.
   - If WAF/Firewall rules are causing intermittent 503s for the UA used by Lighthouse, adjust rules or allowlist Lighthouse user agent ranges for audit/CI runs.

2) Ops/Cloudflare: Inspect challenge script deprecation (P1)
   - The deprecation originates in Cloudflare's challenge script. Options:
     - Contact Cloudflare support or check Cloudflare changelog for the fix.
     - If Cloudflare cannot immediately fix it, treat as external and document in triage notes.
     - If the script is not required on all pages, consider scoping or deferring it.

3) Engineering: Make code-level improvements (P2)
   - Consider deferring non-critical third-party scripts and analytics until after LCP.
   - Ensure heavy scripts are async/defer where safe (gtag, integrations). This will help Performance and reduce TBT.
   - Add Lighthouse checks in CI (lighthouse-ci or script) to fail builds when Best Practices or Performance fall under thresholds.

4) Validation: Re-run Lighthouse after fixes (P3)
   - Re-run targeted Lighthouse audits for production and local, ensure Best Practices >= 90 and no `errors-in-console` or `deprecations` remain.

Notes & context
---------------
- This repo's build succeeded locally after re-run; many CSS linter warnings exist but are non-blocking.
- The Cloudflare challenge script is found repeatedly in Lighthouse reports; it's likely sitewide via Cloudflare and causes the deprecation audit to appear across reports.

If you'd like, I can:
- Open an issue / PR template for the ops team with exact timestamps and suggested Cloudflare log filters.
- Add a CI Lighthouse job (and a small script) that compares results and fails on regressions.
- Draft a PR to defer or scope third-party scripts that we can control.

Next step: I can draft the ops ticket and a PR plan — say the word and I’ll proceed.