Title: Investigate transient 503s during Lighthouse audit and Cloudflare challenge deprecation

Summary
-------
During the production Lighthouse run on 2025-12-21 around 18:30:26Z, Lighthouse recorded several console errors (503) for pages:
- /docs
- /pricing
- /examples

Also Lighthouse flagged a deprecation originating from Cloudflare challenge script:
- StorageType.persistent is deprecated. Source: https://www.clodo.dev/cdn-cgi/challenge-platform/scripts/jsd/main.js

What I did
---------
- Confirmed the Lighthouse report: lighthouse-results/lighthouse-production-2025-12-21T18-30-22-443Z.report.json (see `errors-in-console` and `deprecations` sections).
- Ran local HEAD checks for the three URLs — they returned 200 at the time of investigation. This suggests the 503s were transient or specific to the UA/edge path used by the Lighthouse run.
- Noted that the Cloudflare challenge script is present sitewide (via cdn-cgi). It produced a 'StorageType.persistent is deprecated' deprecation warning in the Lighthouse report.

Requested investigation (for Cloudflare / infra)
-----------------------------------------------
1) Search edge logs / Workers logs / Firewall events around 2025-12-21T18:30:00Z -> 2025-12-21T18:31:00Z for requests to:
   - https://www.clodo.dev/docs
   - https://www.clodo.dev/pricing
   - https://www.clodo.dev/examples

   Filter suggestions:
   - Request URL contains `/docs` or `/pricing` or `/examples`
   - Response status code == 503
   - Client UA contains `HeadlessChrome` or `Chrome-Lighthouse` (if present)
   - Firewall/managed rule/Worker exception codes

2) If 503s are present in edge logs, identify which component returned 503:
   - Was it Cloudflare edge (e.g., challenge response), Cloudflare WAF, or origin returning 503 due to overload or upstream error?

3) If caused by the WAF/Challenge configuration: review rules that might target HeadlessChrome / Lighthouse UA or other bot detection that could return 503/Challenge for automated audits. Add an allowlist for audit user agents or IP ranges used by Lighthouse runs (or our audit CI runner) where safe.

4) Regarding the deprecation warning from CDN script:
   - Check if Cloudflare has an updated challenge script that removes StorageType.persistent.
   - If not, open a ticket with Cloudflare Support including the deprecation message and the timestamp of the audit.

Suggested Cloudflare support message body
----------------------------------------
Hello Cloudflare Support,

We observed a deprecation warning in our Lighthouse audit pointing to `https://<our-host>/cdn-cgi/challenge-platform/scripts/jsd/main.js`: "StorageType.persistent is deprecated. Please use standardized navigator.storage instead." Please advise whether this is a known change on your side and whether an updated challenge script is available.

Additionally, a Lighthouse audit recorded 503 responses for several pages (see timestamp). Can you help determine whether a Cloudflare rule or challenge triggered a 503 for the audit user agent around 2025-12-21T18:30:26Z?

Relevant artifacts:
- Lighthouse report: `lighthouse-results/lighthouse-production-2025-12-21T18-30-22-443Z.report.json`
- Audit timestamp: 2025-12-21T18:30:26.476Z

Thanks,
[Team]

Next steps I can do
-------------------
- Prepare a short PR to gracefully defer non-critical scripts and add preconnects (already in progress).
- Add an ops ticket in your tracking system with the above details (I can create it if you provide the ticket template/URL).
