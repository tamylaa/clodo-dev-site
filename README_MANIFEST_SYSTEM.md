# Pages Manifest System

## Overview

The **pages manifest** is the single source of truth for URL generation across the Clodo website. It consolidates information from:
- **Filesystem**: 235 actual HTML pages in `/public`
- **Sitemap**: 51 URLs currently indexed in `public/sitemap.xml`
- **Navigation**: 24 pages linked in `nav-system/configs/navigation.json`

## Problem Solved

Previously, URLs were generated independently by 5 different systems:
1. Filesystem scanning (what pages exist)
2. Hardcoded sitemap (which pages are indexed)
3. Navigation config (which pages are linked)
4. Canonicals function (URL normalization)
5. Redirects file (URL mapping)

This caused:
- **172 pages (~73%) missing from sitemap** despite being real, served files
- **No consistency** between what pages exist and where they're indexed
- **Manual updates** required when adding new pages
- **Easy to break** during refactoring

## Solution Architecture

### 1. Config File: `config/pages-manifest.json`

Each entry in the manifest describes a page:

```json
{
  "path": "/docs/cli-commands",
  "file": "docs/cli-commands.html",
  "type": "page",
  "locale": "en",
  "indexed": true,
  "inNav": true,
  "inSitemap": true,
  "priority": 0.7,
  "changefreq": "weekly",
  "isAdmin": false,
  "isExperiment": false,
  "isI18n": false,
  "isIndex": false,
  "reason": null
}
```

**Key Fields:**
- `path`: URL path (e.g., `/docs/cli-commands`)
- `file`: Physical file location in `/public`
- `type`: `page | blog-post | case-study | experiment`
- `locale`: Language code (e.g., `en`, `ar`, `es-419`)
- `indexed`: If true, page will appear in sitemap/search
- `inNav`: If true, page is linked in navigation
- `inSitemap`: If true, page is currently in sitemap.xml
- `isAdmin`: If true, page is hidden (not indexed/linked)
- `isExperiment`: If true, page is A/B test variant
- `isI18n`: If true, page is internationalized
- `isIndex`: If true, page is index.html (usually not indexed)
- `reason`: Why entry exists (e.g., `admin-page`, `ab-test`)

### 2. Extraction Tools

**`tools/extract-filesystem-manifest.js`**
- Recursively scans `/public` directory
- Converts file paths to URL paths
- Classifies pages (blog, case-study, experiment)
- Detects admin pages
- Extracts locales from i18n paths
- Output: 235 filesystem pages

**`tools/extract-sitemap-manifest.js`**
- Parses `public/sitemap.xml`
- Extracts priority and changefreq metadata
- Output: 51 indexed URLs

**`tools/extract-nav-manifest.js`**
- Traverses `nav-system/configs/navigation.json`
- Recursively extracts all internal hrefs
- Filters out external URLs and anchors
- Output: 24+ navigation entries

**`tools/merge-manifests.js`**
- Orchestrates all three extractions
- Merges data using filesystem as base (source of truth)
- Detects orphaned entries
- Applies business logic (admin/experiment non-indexed)
- Outputs: `config/pages-manifest.json`

### 3. Validation Tools

**`tools/validate-manifest.js`**
- Validates manifest structure and content
- Checks all required fields present
- Verifies paths are properly formatted
- Confirms files exist for all entries
- Tests i18n locales
- Output: Pass/fail test results

**`build/validate-build-manifest.js`**
- Pre-deployment validation (runs before build)
- Regenerates manifest to detect new/deleted files
- Checks for orphaned entries
- Verifies indexed pages exist
- Ensures admin/experiment pages aren't indexed
- Exit code 0 (pass) or 1 (fail) for CI/CD

**`build/pre-build-checks.js`**
- Developer-friendly pre-build checks
- Analyzes indexing coverage
- Estimates SEO impact
- Suggests improvements
- Runs automatically before build

### 4. Generator Tools

**`build/generate-sitemap-from-manifest.js`**
- Generates `public/sitemap-from-manifest.xml` from manifest
- Uses priority/changefreq rules based on page type
- Includes i18n alternate links
- Compares with current sitemap
- Shows coverage gains

## Build Process Integration

### Before Build: Pre-Build Checks

```bash
npm run prebuild
```

Runs in this order:
1. `pre-build-checks.js` - Developer feedback
2. `lint` - Code quality
3. `type-check` - TypeScript validation
4. `validate:blog` - Blog post structure
5. `validate:headers` - HTTP headers
6. `validate:redirects` - Redirect rules
7. `validate:reviews` - Review pages
8. `check-links` - Link validation
9. `validate-build-manifest.js` - URL consistency (NEW)

**Fails if:**
- Manifest has errors
- Key validations fail
- Build would deploy broken state

### After Build: Post-Build Generation

```bash
npm run postbuild
```

After build completes:
1. Normalizes links
2. Injects navigation
3. Validates built schemas
4. Enforces required schemas
5. *(Future: Regenerates sitemap using manifest)*

## Usage Guide

### Common Tasks

#### 1. Add a New Page
```bash
# 1. Create the HTML file in /public
cp public/template.html public/new-page.html

# 2. Run prebuild to regenerate manifest
npm run prebuild

# 3. If you want it indexed, update nav config:
vim nav-system/configs/navigation.json

# 4. Commit both changes
git add public/new-page.html nav-system/configs/navigation.json config/pages-manifest.json
```

#### 2. Index More Pages
```bash
# 1. See which pages are missing from sitemap
node tools/debug-manifest-issues.js

# 2. Review the pages - decide which should be indexed

# 3. For pages that should be indexed, add to nav or mark in manifest

# 4. Run validation
node tools/validate-manifest.js
node build/generate-sitemap-from-manifest.js
```

#### 3. Debug Missing Content
```bash
# See what the manifest thinks about a specific page
node -e "const fs = require('fs'); const m = JSON.parse(fs.readFileSync('config/pages-manifest.json', 'utf8')); console.log(m.find(e => e.path === '/your-path'));"

# Compare filesystem vs manifest vs sitemap
node tools/debug-manifest-issues.js
```

#### 4. Check Coverage Before Deployment
```bash
# Run full validation
node build/validate-build-manifest.js

# See pre-build checks
node build/pre-build-checks.js

# Generate manifest-based sitemap
node build/generate-sitemap-from-manifest.js
```

### Development Workflow

1. **During Development**
   - Manifest automatically regenerates on `npm run prebuild`
   - Pre-build checks run before compilation
   - Issues caught early

2. **Before Commit**
   - Run `npm run prebuild` to validate
   - Check output for warnings
   - Review generated manifest changes

3. **During Code Review**
   - Changes to `config/pages-manifest.json` are transparent
   - Reviewers can see exactly what pages changed
   - Easy to spot mistakes

4. **On Deploy**
   - Build validation runs automatically
   - Deployment fails if manifest is inconsistent
   - Safe rollback possible

## Maintenance

### When Things Break

If manifest gets out of sync with filesystem:

```bash
# 1. Regenerate from current state
node tools/merge-manifests.js

# 2. Validate regenerated manifest
node tools/validate-manifest.js

# 3. Review changes
git diff config/pages-manifest.json

# 4. Commit or discard
git add config/pages-manifest.json
```

### Monitoring

Key metrics to track:
- **Filesystem Pages**: Total count should grow as content increases
- **Indexed Pages**: Target should be ~50-80% of filesystem
- **In Nav**: Should be subset of indexed pages
- **Coverage**: (indexed / filesystem) * 100% = SEO health

Current State:
- Filesystem: 235 pages
- Indexed: 51 pages (21.7%)
- In Nav: 24 pages
- Coverage: **21.7%** (opportunity to improve SEO!)

### Future Improvements

1. **Automatic Sitemap Generation** - Use manifest instead of hardcoded XML
2. **Navigation Filtering** - Generate nav based on manifest inNav flag
3. **Canonical URLs** - Use manifest for URL consolidation
4. **Link Validation** - Check all nav links exist in manifest
5. **Redirect Optimization** - Use manifest to auto-generate redirects
6. **Analytics Integration** - Track which pages drive traffic, update manifest priority

## Files Reference

### Core Files
- `config/pages-manifest.json` - The manifest itself
- `nav-system/configs/navigation.json` - Navigation config (source for nav entries)
- `public/sitemap.xml` - Current sitemap (legacy format)

### Tools
- `tools/extract-*.js` - Extraction tools (3 files)
- `tools/merge-manifests.js` - Merge orchestrator
- `tools/validate-manifest.js` - Validation tests
- `tools/debug-manifest-issues.js` - Debugging helper

### Build
- `build/generate-sitemap-from-manifest.js` - Manifest-based sitemap
- `build/validate-build-manifest.js` - Pre-deployment validation
- `build/pre-build-checks.js` - Developer checks
- `package.json` - Scripts integration (`prebuild`, `postbuild`)

## Questions?

See documentation:
- [Schema Implementation](README_SCHEMA_IMPLEMENTATION.md)
- [Build Process](README.md)
- [Navigation System](NAV_SYSTEM_SETUP_STATUS.md)
