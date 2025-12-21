SEO Experiments helper

This folder contains a simple generator to create static experiment pages from
`content/seo-experiments/meta-variants.json`.

Usage
-----
- Install node deps if required (none required for the generator itself).
- Run: `node scripts/seo/generate_experiment_pages.js` to create pages under `public/experiments/`.

Notes
-----
- Generated pages default to `rel="canonical"` pointing to the main page. If you plan to index variants for SERP experiments, adjust canonical rules as needed and consult Search Console guidance.
- Use analytics tags on generated pages to track impressions/clicks.
