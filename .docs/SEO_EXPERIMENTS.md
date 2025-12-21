SEO Experiments & Infrastructure

Overview
--------
This document explains the lightweight infrastructure added to support repeatable SEO experiments, localization scaffolding, and performance testing.

Files added
-----------
- `content/seo-experiments/meta-variants.json` — Declare title/meta variants per slug.
- `scripts/seo/generate_experiment_pages.js` — Generates static experiment pages under `public/experiments/` for A/B runs.
- `scripts/seo/README.md` — Quick usage notes for the generator.
- `content/i18n/*.json` & `scripts/i18n/apply_locales.js` — Basic i18n scaffolding and generator for localized pages/stubs.
- `scripts/perf/run_lighthouse.js` — Local Lighthouse runner that saves reports to `reports/lighthouse`.
- `scripts/perf/run_webpagetest.js` — Wrapper to request WebPageTest runs (multi-region).
- `templates/partials/quick-answers.html` & `templates/schema-partials/faq.html` — Reusable content/schema partials.
- Template placeholder `{{EXPERIMENT_META}}` added to `templates/blog-post-template.html` for optional per-page experiment overrides.

How to run an experiment (high level)
------------------------------------
1. Add A/B variants to `content/seo-experiments/meta-variants.json` for the slug(s) you want to test.
2. Run `node scripts/seo/generate_experiment_pages.js` to generate experiment pages.
3. Deploy experiment pages to a test/staging domain or subpath and ensure analytics is enabled on those pages.
4. Promote variants via controlled channels (newsletter, paid geo-targeting, or Search Console tests) and monitor impressions/CTR by page and country.
5. Collect results and decide winner after a 2–4 week window.

Localization
------------
- Translation stubs live under `content/i18n/<locale>.json`.
- Use `node scripts/i18n/apply_locales.js --locale=de` to create localized stubs under `public/i18n/de/`.
- For production, integrate the i18n JSON files into the build pipeline to create fully localized pages with proper `hreflang` entries.

Performance testing
-------------------
- Run `node scripts/perf/run_lighthouse.js --urls=public/how-to-migrate-from-wrangler.html` to create Lighthouse reports locally.
- Use WebPageTest to run regionally-distributed tests using `node scripts/perf/run_webpagetest.js --url=https://...` (requires WPT API key).
- Use reports to fix region-specific LCP/TTI regressions and verify caching/edge behavior.

CI integration (next step)
--------------------------
- Add Lighthouse CI steps to the repo's GitHub Actions (example job placeholder to be added) to ensure PR changes do not regress LCP.
- Add a JSON-LD validation step to the CI to ensure added schema is syntactically valid.

Next recommended work
---------------------
- Integrate `meta-variants.json` into the build pipeline so variants can be generated as part of CI and previewed in staging.
- Add an experiment runner that records `variant` in analytics and ties a view/click back to the variant for statistical testing.
- Add GitHub Actions job templates for Lighthouse and HTML/JSON-LD validation.
