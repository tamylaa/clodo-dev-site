collect-commits.js — usage

This helper script consolidates commit history into JSON for analysis and content generation.

Usage examples:

- Local git history (no network):
  node scripts/collect-commits.js --source=local --out=commit-history.json

- GitHub API (enriched with PR data):
  GITHUB_TOKEN=ghp_xxx node scripts/collect-commits.js --source=github --repo=owner/repo --out=commit-history-github.json

Options:
- --source=local|github  (default: local)
- --repo=owner/repo      (required for github source; can also be read from GITHUB_REPOSITORY env)
- --since=YYYY-MM-DD     (optional)
- --until=YYYY-MM-DD     (optional)
- --out=path             (default: commit-history.json)

Notes:
- For `github` mode you must set `GITHUB_TOKEN` with repo read scopes.
- The output JSON contains `meta`, `summary` and a `commits` array with per-commit metadata and (when using GitHub mode) PR associations.
- This is intentionally lightweight and works without additional dependencies.

Next steps:
- Optionally add keyword extraction, change-type heuristics, per-month aggregation, and a simple viz generator.
