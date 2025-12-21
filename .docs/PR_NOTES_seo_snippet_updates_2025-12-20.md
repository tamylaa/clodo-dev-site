PR: SEO: Add quick-answer snippets, FAQ JSON-LD and CTR-optimized titles/meta for key pages

Summary
-------
This PR introduces modular quick-answer and FAQ schema patterns and applies CTR-focused title/meta updates to four primary pages that were receiving impressions but low clicks. Changes are template-first where possible so the same pattern can be used for other pages.

Files changed
-------------
- templates/partials/quick-answers.html (new)
- templates/schema-partials/faq.html (new)
- templates/blog-post-template.html (inserted `{{SNIPPET_ANSWERS}}` placeholder)
- public/how-to-migrate-from-wrangler.html
  - Title/meta -> *Migrate from Wrangler to Clodo — 5‑Step Automated Migration (Safe & Reversible)*
  - Augmented HowTo JSON-LD (added tool array) and appended FAQ JSON-LD
  - Quick-answers block added under hero
- public/clodo-framework-api-simplification.html
  - Title/meta -> *API Simplification — How Clodo Reduced Developer Onboarding by 88%*
  - FAQ JSON-LD added
  - Quick-answers block added under hero
- public/clodo-framework-promise-to-reality.html
  - Title/meta -> *Clodo Framework — From Prototype to Production with 98.9% Test Success*
  - FAQ JSON-LD added
  - Quick-answers block added under hero
- public/index.html
  - Added a "Featured Guides" section with links to the three target pages

Testing checklist
-----------------
- [ ] HTML validation for the modified pages (lint/CI)
- [ ] Lighthouse run for each page to ensure LCP unchanged and no regressions
- [ ] Smoke test that JSON-LD scripts parse in Google Rich Results test if available
- [ ] Manual QA on mobile and desktop to confirm the quick-answers block renders correctly and the canonical links are unchanged

Rollout plan
------------
1. Deploy to staging and run the checklist above.  
2. Release as an experiment for 2–4 weeks, A/B testing two title/meta variants (we can queue alternate titles as `?trk=variant-b` or use Search Console experiments if available).  
3. Monitor impressions, CTR, clicks, and positions weekly.  
4. If CTR lifts by >10% and position is stable, roll to production globally.

Notes
-----
- The templates include placeholders (`{{SNIPPET_ANSWERS}}`, `{{FAQ_SCHEMA}}`) so adding FAQs and quick answer content should be a low-friction content update going forward.
- Next recommended tasks: create 2 title variants per page and implement a method to serve variants for measurement; consolidate FAQ content into a CMS or content file for easy reuse.
