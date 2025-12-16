chore(css): tokenize colors & tidy CSS

Summary:
- Tokenized a large set of repeated hex colors and added semantic tokens to `public/css/base.css`.
- Replaced many high-frequency hex literals across pages and components (hero, case-studies, blog, subscribe/testimonials, etc.).
- Fixed codemod damage and normalized dark-mode variable blocks where safe.
- Began triaging duplicate-selectors and no-descending-specificity warnings; removed duplicated `.nav-section` and consolidated TOC rules in `public/css/components-reusable.css`.

Current status:
- Branch: `chore/color-vars` (committed and pushed work in small batches).
- Linter snapshot: **498 warnings** (0 errors).
  - Top categories: `no-descending-specificity` (185), `no-duplicate-selectors` (171), `declaration-block-single-line-max-declarations` (38), `number-max-precision` (35), `color-no-hex` (19).
- Visual/CI: quick checks performed during work; recommend running a full visual regression once merged.

Remaining / recommended next steps:
1. Continue triage of duplicate selectors & ordering issues (files with the most: `components-common.css`, `components-full-backup.css`, `base.css`).
2. Decide whether to update stylelint config to accept modern CSS syntax (e.g., `rgb()`/slash alpha, `prefers-contrast`) or normalize code to suppress property/media unknown warnings.
3. Complete tokenization for remaining high-frequency hexes in backups and low-usage pages.
4. Run full visual regression and smoke tests for each small batch before merging.

Notes for reviewers:
- Changes are intentionally small and scoped to reduce regression risk.
- Please review `public/css/components-reusable.css` for the grouped TOC/nav changes.
- I can continue working if you want me to finish another batch (components-common) before merging; otherwise this PR is a safe handoff with clear follow-ups.

Files touched (high level):
- `public/css/base.css` (tokens added)
- `public/css/pages/*` (hero, case-studies, blog, subscribe/testimonials)
- `public/css/components-reusable.css` (dedupe/reorder TOC + nav section)

Open questions:
- Should we adopt a blocking rule (reduce duplicates <100) or proceed iteratively with periodic PRs?

---
Automated linter snapshot attached in the PR comments (run on Dec 16, 2025).