Collect commits (content scripts)

This copy of the collector is intended to write its results into the `content/release-notes/` tree where release note authors and site content can reference them.

Examples:

- Local:
  node content/scripts/collect-commits.js --source=local --out=content/release-notes/tamylaa/clodo-framework/commit-history.json

- GitHub (recommended for PR associations):
  GITHUB_TOKEN=ghp_xxx node content/scripts/collect-commits.js --source=github --repo=tamylaa/clodo-framework --out=content/release-notes/tamylaa/clodo-framework/commit-history.json

Then run:
  npm run analyze-commits

The analyzer will produce `commit-insights.json` and `commit-insights.md` in the same release-notes folder.
