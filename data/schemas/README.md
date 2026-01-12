# Schema files and tools

This folder contains page-level schema JSON files (source of truth) and small utilities for auditing and managing structured data.

Structure:

- `data/schemas/*.json` — page-specific schema files (e.g., `product-article.json`, `product-faq.json`).
- `data/schemas/page-config.json` — configuration describing page types and optional `requiredSchemas` used by the build (moved from `schema/page-config.json`).
- `data/schemas/tools/` — helper scripts:
  - `audit-schema-coverage.js` — classifies pages into coverage categories and writes a report.

Best practices:
- Keep content in `data/schemas` as canonical sources for JSON-LD. The build injects these into pages under `dist/`.
- Use `audit-schema-coverage.js` to find pages that need attention and add configurations to `page-config.json`.
- Use the existing build integration (`schema/build-integration.js`) which now reads `data/schemas/page-config.json`.
