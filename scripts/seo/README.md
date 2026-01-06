# SEO Tools & Verification Suite

Complete SEO automation for canonical URLs, hreflang tags, and pre-deployment verification.

## 📁 Directory Structure

```
scripts/seo/
├── seo-checker.mjs                 # Live URL verification
├── check-canonical-consistency.mjs # Analyze scan results
├── fixers/                         # Canonical & hreflang fixes
│   ├── universal-canonical-fixer.mjs
│   ├── fix-hreflang-tags.mjs
│   └── README.md
├── verification/                   # Pre-deployment checks
│   ├── pre-deployment-verification.mjs
│   └── README.md
├── generate_experiment_pages.js    # SEO experiment generator (legacy)
└── README.md (this file)
```

## 🔍 Complete SEO Workflow

### Step 1: Check Live URLs
```bash
node scripts/seo/seo-checker.mjs --input data/seo-urls.txt --output reports/seo-report.json
```
**Purpose:** Verify all URLs on live site
- Follows redirects and canonicals
- Detects hreflang relationships
- Reports final URLs
- Output: JSON report with full metadata

### Step 2: Analyze Results
```bash
node scripts/seo/check-canonical-consistency.mjs reports/seo-report.json
```
**Purpose:** Identify issues in scan results
- Finds canonical mismatches
- Groups by type: AMP, regional, tags, search
- Shows patterns and problems
- Output: Console report with issue breakdown

### Step 3: Fix Canonicals
```bash
node scripts/seo/fixers/universal-canonical-fixer.mjs public
```
**Purpose:** Fix ALL canonical issues
- Ensures `https://www.clodo.dev` domain (with www)
- Fixes index files: `/index.html` → `/`
- Strips `.html` extensions
- Handles AMP pages: `/amp/*/page.amp.html` → `/page`
- Fixes query string handling

**Typical Result:**
```
Files: 223
Fixed: 13
Already correct: 206
Errors: 4 (intentional exclusions)
```

### Step 4: Fix Hreflang Tags (if needed)
```bash
node scripts/seo/fixers/fix-hreflang-tags.mjs public
```
**Purpose:** Update hreflang domain consistency
- Changes `https://clodo.dev` → `https://www.clodo.dev`
- Preserves all language codes and paths
- Updates `hreflang` href attributes

**Use when:**
- Domain changes (with/without www)
- Adding new locales
- Fixing hreflang relationships

### Step 5: Pre-Deployment Verification
```bash
node scripts/seo/verification/pre-deployment-verification.mjs
```
**Purpose:** Final safety check before production
- Validates all 223+ HTML files
- Checks canonicals, hreflang, structure
- ✅ Passes if: 0 issues found
- ❌ Fails if: any problems detected

**Validation Checks:**
- ✅ www.clodo.dev on all canonicals
- ✅ HTTPS protocol required
- ✅ No .html extensions in canonicals
- ✅ Index files have trailing slashes
- ✅ Hreflang tags are consistent

## 🚀 Quick Commands

### Full Audit (Check → Analyze → Verify)
```bash
# Manual
node scripts/seo/seo-checker.mjs
node scripts/seo/check-canonical-consistency.mjs reports/seo-report.json
node scripts/seo/verification/pre-deployment-verification.mjs

# Or use npm script (if added to package.json)
npm run seo:full-audit
```

### Just Fix Canonicals
```bash
node scripts/seo/fixers/universal-canonical-fixer.mjs public
```

### Just Fix Hreflang
```bash
node scripts/seo/fixers/fix-hreflang-tags.mjs public
```

### Pre-Deploy Safety Check
```bash
node scripts/seo/verification/pre-deployment-verification.mjs
```

## 📊 Session Results

**Last Execution (2026-01-06):**
- ✅ Scanned 59 live URLs
- ✅ Fixed 223 HTML files
- ✅ Updated 29 hreflang tags
- ✅ Fixed 9 AMP canonicals
- ✅ Pre-deployment: 0 issues

## 📝 Expected Input/Output

### seo-checker.mjs
**Input:** Text file with URLs (one per line)
```
https://www.clodo.dev/
https://www.clodo.dev/blog/
https://www.clodo.dev/blog/my-post
```

**Output:** JSON report
```json
{
  "url": "https://www.clodo.dev/blog/",
  "finalUrl": "https://www.clodo.dev/blog/",
  "canonical": "https://www.clodo.dev/blog/",
  "hreflang": [...],
  "redirects": []
}
```

### check-canonical-consistency.mjs
**Input:** JSON from seo-checker
**Output:** Grouped issues
```
Mismatches (13 total):
  AMP pages (3):
    - /amp/en/blog/foo.amp.html
  Tag filters (5):
    - /blog/?tag=X
  ...
```

### universal-canonical-fixer.mjs
**Input:** Folder path (public/)
**Output:** Console report + modified files
```
🔗 Universal Canonical Fixer
Files: 223
Fixed: 13
Already correct: 206
```

## 🔧 npm Scripts (Recommended)

Add these to `package.json`:
```json
{
  "scripts": {
    "seo:check": "node scripts/seo/seo-checker.mjs",
    "seo:analyze": "node scripts/seo/check-canonical-consistency.mjs reports/seo-report.json",
    "seo:fix-canonicals": "node scripts/seo/fixers/universal-canonical-fixer.mjs public",
    "seo:fix-hreflang": "node scripts/seo/fixers/fix-hreflang-tags.mjs public",
    "seo:verify": "node scripts/seo/verification/pre-deployment-verification.mjs",
    "seo:full-audit": "npm run seo:check && npm run seo:analyze && npm run seo:verify"
  }
}
```

Then use:
```bash
npm run seo:check          # Check live URLs
npm run seo:verify         # Pre-deploy verification
npm run seo:full-audit     # Complete workflow
```

## 📚 Each Tool in Detail

### seo-checker.mjs
- **Purpose:** Verify live URLs and metadata
- **Input:** List of URLs
- **Output:** JSON with redirects, canonicals, hreflang
- **Use Case:** Regular audits, before major deployments
- **Performance:** ~59 URLs in ~30 seconds

### check-canonical-consistency.mjs
- **Purpose:** Analyze scan results for issues
- **Input:** JSON from seo-checker
- **Output:** Categorized mismatches
- **Use Case:** Understanding problems before fixing
- **Performance:** Instant

### universal-canonical-fixer.mjs
- **Purpose:** Fix ALL canonical issues at once
- **Input:** public/ folder
- **Output:** Modified HTML files + report
- **Use Case:** Bulk fixing, after domain changes
- **Performance:** 223 files in ~2 seconds

### fix-hreflang-tags.mjs
- **Purpose:** Update hreflang domain/paths
- **Input:** public/ folder
- **Output:** Modified HTML files + report
- **Use Case:** Domain changes, locale updates
- **Performance:** 29 files in ~1 second

### pre-deployment-verification.mjs
- **Purpose:** Final safety check
- **Input:** public/ folder
- **Output:** Pass/Fail report
- **Use Case:** Before every production deployment
- **Performance:** 223 files in ~3 seconds

## ⚠️ Important Notes

- **Operates on:** `public/` folder (build output), not source
- **Modifies files:** Yes, use git for backup/rollback
- **No external deps:** Uses only Node built-ins + JSDOM
- **Requires:** Node 18+ (for global fetch, ES modules)
- **Safe:** All changes are metadata-only, no content/URL changes

## 🔄 Workflow Examples

### New Content Day
```bash
# Check if new pages have correct canonicals
npm run seo:verify
```

### Before Production Deploy
```bash
# Full audit before going live
npm run seo:full-audit
```

### Fixed Domain Issue
```bash
# Check → Fix hreflang → Verify
npm run seo:check
npm run seo:fix-hreflang
npm run seo:verify
```

### Bulk Issue Fix
```bash
# Fix all canonicals → Pre-check → Deploy
npm run seo:fix-canonicals
npm run seo:verify
git push origin main
```

## 📞 Troubleshooting

**Pre-deployment shows errors?**
- Read detailed error messages
- Check specific file paths
- Use fixer scripts before deploy

**Live URLs not responding?**
- Check internet connection
- Verify URLs are correct
- Check if site is live

**Redirects detected?**
- Normal for CDN
- Check _redirects file
- Verify canonical is final URL

**Hreflang issues?**
- Use fix-hreflang-tags.mjs
- Verify language codes
- Check domain in hreflang attributes
