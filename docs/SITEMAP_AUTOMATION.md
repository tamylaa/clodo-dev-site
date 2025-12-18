# Sitemap Automation

This repository includes a lightweight GitHub Action that verifies `public/sitemap.xml` is reachable and notifies search engines (Google + Bing) when the sitemap changes.

Workflow: `.github/workflows/ping-sitemap.yml`

Features:
- Runs on push when `public/sitemap.xml` changes
- Runs daily at 02:00 UTC (cron)
- Can be triggered manually from the Actions tab
- Uses `tools/ping-sitemap.js` to:
  - Ensure sitemap is reachable (HTTP 200)
  - Ping Google's and Bing's `ping?sitemap=` endpoints

Environment:
- The default sitemap URL is `https://www.clodo.dev/sitemap.xml`.
- If you want to override it, add a repository secret named `SITEMAP_URL` with the full sitemap URL.

Notes:
- This does not replace Search Console ownership or the Search Console API; it simply notifies the public ping endpoints and verifies reachability.
