Integration test run summary (local)

Date: 2025-12-18
Environment: Local dev server (http://localhost:8000), Playwright Chromium, single worker

Results:
- Total tests run: 56
- Passed: 56
- Failed: 0

Key notes:
- Newsletter non-JS fallback: tested - POST form redirects to /subscribe (303 behavior confirmed)
- Try It CTA: preconnect-on-interaction verified and clicking attempts to open StackBlitz
- Performance Dashboard: rendered with test/dev-only fallback, metrics and session info appear

Files changed relevant to tests:
- functions/newsletter-subscribe.js
- build/dev-server.js
- public/subscribe.html
- public/subscribe/thanks.html
- public/js/integrations/stackblitz.js
- tests/integration/newsletter-redirect.spec.js
- tests/integration/try-it.spec.js
- tests/integration/performance-dashboard.spec.js
- tests/integration/system-integration.spec.js

Recommendation: Add a CI smoke job that runs these three tests on PRs (newsletter, headers, try-it).