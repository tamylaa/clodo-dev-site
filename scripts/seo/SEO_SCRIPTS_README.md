# 🚀 SEO Automation Scripts Suite

Complete set of scripts for automating SEO optimization across your entire site. These scripts were built based on improvements implemented to `cloudflare-framework.html` and are now reusable for every page.

## 📋 Script Overview

### Core Scripts

#### 1. **Schema Generator** (`schema-generator.mjs`)
Auto-generates and validates JSON-LD structured data schemas for all pages.

**What it does:**
- Auto-detects page types (Article, BlogPosting, FAQPage, SoftwareApplication, etc.)
- Generates appropriate JSON-LD schemas
- Extracts metadata from HTML (title, description, dates, author)
- Validates existing schemas
- Generates audit report with schema coverage

**Usage:**
```bash
# Analyze all pages
node scripts/seo/schema-generator.mjs --dir public

# Generate missing schemas and fix invalid ones
node scripts/seo/schema-generator.mjs --dir public --generate

# Custom output
node scripts/seo/schema-generator.mjs --dir public --output reports/schema-full-audit.json
```

**Output:** `reports/schema-audit.json`

---

#### 2. **E-E-A-T Enhancer** (`eeat-enhancer.mjs`)
Detects and injects Expertise, Experience, Authority, and Trust signals.

**What it does:**
- Scans for 10 E-E-A-T signals (author metadata, dates, credentials, expertise, social proof, etc.)
- Calculates E-E-A-T score per page
- Suggests improvements based on gaps
- Can automatically inject basic E-E-A-T metadata
- Generates recommendations report

**E-E-A-T Signals Tracked:**
- ✅ Author metadata
- ✅ Publication date
- ✅ Last modified date
- ✅ Expertise indicators
- ✅ Author credentials
- ✅ Social proof (testimonials, reviews, case studies)
- ✅ About the Author section
- ✅ Link to about/author page
- ✅ Content quality indicators (research, methodology, sources)
- ✅ Recency indicators

**Usage:**
```bash
# Analyze E-E-A-T signals
node scripts/seo/eeat-enhancer.mjs --dir public

# Analyze and auto-inject missing signals
node scripts/seo/eeat-enhancer.mjs --dir public --fix

# With custom report location
node scripts/seo/eeat-enhancer.mjs --dir public --report --output reports/eeat-full.json
```

**Output:** `reports/eeat-audit.json`

**Scoring:**
- Author metadata: 10 points
- Publication date: 8 points
- Last modified: 8 points
- Expertise claims: 12 points
- Credentials: 12 points
- Social proof: 10 points
- Author bio section: 15 points
- Author link: 8 points
- Content quality: 10 points
- Recency: 8 points
- Organization schema: 10 points
- **Maximum: 111 points**

Target score: 80+ (72%+)

---

#### 3. **Heading Validator** (`heading-validator.mjs`)
Validates HTML heading hierarchy (H1→H2→H3→H4) and fixes structure issues.

**What it does:**
- Validates proper H1→H2→H3→H4 hierarchy
- Detects multiple H1 tags (should be 1 per page)
- Finds skipped heading levels
- Identifies orphaned headings
- Auto-fixes common issues (convert extra H1s to H2, etc.)
- Generates heading map and hierarchy report

**Common Issues Detected:**
- Multiple H1 tags → Fixed to single H1
- Skipped levels (H2 → H4) → Suggested to use H3
- Missing intermediate levels → Flagged for review
- Orphaned high-level headings → Warned

**Usage:**
```bash
# Validate heading structure
node scripts/seo/heading-validator.mjs --dir public

# Validate and auto-fix issues
node scripts/seo/heading-validator.mjs --dir public --fix

# Strict validation (warnings treated as errors)
node scripts/seo/heading-validator.mjs --dir public --strict

# Custom output
node scripts/seo/heading-validator.mjs --dir public --output reports/headings-detailed.json
```

**Output:** `reports/heading-audit.json`

**Report Contents:**
- Total headings per page
- Heading hierarchy map (H1, H2, H3, H4 structure)
- Errors (multiple H1s, orphaned headings)
- Warnings (skipped levels)
- Headings needing fixes

---

#### 4. **Internal Link Optimizer** (`internal-link-optimizer.mjs`)
Analyzes internal linking patterns and suggests improvements.

**What it does:**
- Counts internal vs external links
- Analyzes anchor text quality (excellent, descriptive, generic, missing)
- Calculates link density (links per 100 words)
- Identifies orphaned pages (0 internal links)
- Detects generic anchor text ("click here", "read more")
- Suggests internal linking opportunities
- Finds broken or malformed links

**Anchor Text Quality Scoring:**
- Excellent: Specific, descriptive (good!)
- Descriptive: Long or well-structured
- Generic: "click here", "read more", "link", etc. (improve!)
- Missing: Links with no text (accessibility issue!)

**Usage:**
```bash
# Analyze internal linking
node scripts/seo/internal-link-optimizer.mjs --dir public

# Analyze with suggestions
node scripts/seo/internal-link-optimizer.mjs --dir public --analyze --suggestions

# Auto-fix orphaned pages (experimental)
node scripts/seo/internal-link-optimizer.mjs --dir public --fix-orphaned

# Custom output
node scripts/seo/internal-link-optimizer.mjs --dir public --output reports/links-analysis.json
```

**Output:** `reports/internal-links-audit.json`

**Metrics Provided:**
- Internal links per page
- External links per page
- Anchor text quality breakdown
- Link density (links per 100 words)
- Orphaned pages count
- Pages with heavy linking (>15 links)
- Pages with light linking (<3 links)
- Top linked pages

---

#### 5. **Pre-Deployment SEO Check** (`pre-deployment-seo-check.mjs`)
**Comprehensive unified verification** - runs all SEO scripts and generates single report.

**What it does:**
- Runs all 6 scripts in sequence
- Aggregates results into single report
- Provides unified recommendations
- Validates readiness for deployment
- Generates clear pass/fail status

**Runs These Checks:**
1. ✅ Schema validation & generation
2. ✅ E-E-A-T signal analysis
3. ✅ Heading hierarchy validation
4. ✅ Internal link analysis
5. ✅ Canonical consistency
6. ✅ Hreflang tag validation

**Usage:**
```bash
# Run full pre-deployment SEO check
node scripts/seo/pre-deployment-seo-check.mjs --dir public

# Run with auto-fixes enabled
node scripts/seo/pre-deployment-seo-check.mjs --dir public --fix

# Generate detailed report
node scripts/seo/pre-deployment-seo-check.mjs --dir public --generate-report

# Custom output
node scripts/seo/pre-deployment-seo-check.mjs --dir public --output reports/seo-final-check.json
```

**Output:** `reports/seo-pre-deployment-check.json`

**Exit Codes:**
- `0` = ✅ All checks passed, ready to deploy
- `1` = ⚠️ Some issues found, review recommended

---

## 🔄 Integration & Workflow

### Single-Page Analysis
```bash
# Analyze one page for all SEO metrics
node scripts/seo/schema-generator.mjs --dir public
node scripts/seo/eeat-enhancer.mjs --dir public
node scripts/seo/heading-validator.mjs --dir public
node scripts/seo/internal-link-optimizer.mjs --dir public
```

### Pre-Deployment Workflow
```bash
# Before deploying to production:
node scripts/seo/pre-deployment-seo-check.mjs --dir dist --generate-report

# If issues found, fix them:
node scripts/seo/pre-deployment-seo-check.mjs --dir public --fix

# Verify fixes:
node scripts/seo/pre-deployment-seo-check.mjs --dir public
```

### CI/CD Integration (Example)
```bash
#!/bin/bash
# scripts/ci-seo-check.sh

set -e
echo "Running SEO pre-deployment checks..."

node scripts/seo/pre-deployment-seo-check.mjs --dir dist --generate-report

if [ $? -eq 0 ]; then
  echo "✅ SEO checks passed - safe to deploy"
  exit 0
else
  echo "❌ SEO issues found - fix before deploying"
  exit 1
fi
```

### Bulk Site Enhancement (Recommended Order)
```bash
# 1. Generate/fix all schemas first
node scripts/seo/schema-generator.mjs --dir public --generate

# 2. Fix heading hierarchy issues
node scripts/seo/heading-validator.mjs --dir public --fix

# 3. Analyze E-E-A-T and add signals
node scripts/seo/eeat-enhancer.mjs --dir public --fix

# 4. Review and optimize internal links
node scripts/seo/internal-link-optimizer.mjs --dir public --analyze

# 5. Final comprehensive check
node scripts/seo/pre-deployment-seo-check.mjs --dir public --generate-report
```

---

## 📊 Reports Generated

All scripts save JSON reports to `reports/` directory:

| Script | Report File | Contains |
|--------|-------------|----------|
| Schema Generator | `schema-audit.json` | Schema coverage, validity, issues |
| E-E-A-T Enhancer | `eeat-audit.json` | E-E-A-T scores, signals, recommendations |
| Heading Validator | `heading-audit.json` | Hierarchy issues, heading maps, fixes |
| Internal Link Optimizer | `internal-links-audit.json` | Link metrics, anchor quality, suggestions |
| Pre-Deployment Check | `seo-pre-deployment-check.json` | All checks aggregated, readiness status |

---

## 🎯 Target Scores & Thresholds

### Schema Coverage
- ✅ Target: 100% of pages have appropriate schemas
- ⚠️ Acceptable: 80%+
- ❌ Action needed: <80%

### E-E-A-T Score
- ✅ Target: 80+ points (72%+)
- ⚠️ Acceptable: 60+ points (54%+)
- ❌ Action needed: <60 points

### Heading Hierarchy
- ✅ Target: 0 errors, 0 warnings
- ⚠️ Acceptable: 0 errors, <5% pages with warnings
- ❌ Action needed: Any errors

### Internal Linking
- ✅ Target: 3-7 contextual internal links per page
- ✅ Target: >90% excellent/descriptive anchor text
- ✅ Target: 0% orphaned pages (all pages have at least 1 internal link)
- ⚠️ Acceptable: 2-8 links, >80% good anchor text

---

## 🛠️ Advanced Options

### Custom Page Detection
The schema generator auto-detects page types based on:
- Content keywords (article, guide, tutorial, blog, etc.)
- Page structure (FAQ sections, testimonials, case studies)
- Metadata (published date, author info)

### Flexible Fixing
- `--fix`: Auto-apply safe, non-breaking fixes
- `--strict`: Treat warnings as errors
- No flags: Report-only (read-only analysis)

### Custom Reports
```bash
# Generate all reports in custom location
for script in schema-generator eeat-enhancer heading-validator internal-link-optimizer; do
  node scripts/seo/${script}.mjs --dir public --output reports/${script}-results.json
done
```

---

## 📝 Examples

### Example 1: Quick Site Audit
```bash
node scripts/seo/pre-deployment-seo-check.mjs --dir public
```
Output: Summary with pass/fail + top recommendations

### Example 2: Fix All E-E-A-T Issues
```bash
node scripts/seo/eeat-enhancer.mjs --dir public --fix
```
Output: Enhanced HTML files + audit report

### Example 3: Review Link Opportunities
```bash
node scripts/seo/internal-link-optimizer.mjs --dir public --analyze --suggestions
```
Output: Detailed link analysis with suggestions for each page

### Example 4: Pre-Deploy Final Check
```bash
node scripts/seo/pre-deployment-seo-check.mjs --dir dist --generate-report
echo "Exit code: $?"
```
Output: Comprehensive report, exit with 0 (pass) or 1 (fail)

---

## 🔍 Troubleshooting

**Script not found:**
- Ensure you're running from project root
- Verify scripts are executable: `chmod +x scripts/seo/*.mjs`

**Reports not generating:**
- Check `reports/` directory exists
- Verify write permissions
- Run with `--output` to specify custom path

**Fix mode not working:**
- Ensure source files are writable
- Use `--fix` flag explicitly
- Check for permission errors in output

**Inconsistent results:**
- Re-run same command (should be deterministic)
- Check for file changes between runs
- Verify no concurrent modifications

---

## 🚀 Quick Start

1. **Run initial audit:**
   ```bash
   node scripts/seo/pre-deployment-seo-check.mjs --dir public
   ```

2. **Review report:**
   ```bash
   cat reports/seo-pre-deployment-check.json
   ```

3. **Fix issues:**
   ```bash
   node scripts/seo/pre-deployment-seo-check.mjs --dir public --fix
   ```

4. **Verify all clear:**
   ```bash
   node scripts/seo/pre-deployment-seo-check.mjs --dir public
   ```

---

## 📚 Related Documentation

- [Cloudflare Framework SEO Improvements](../cloudflare-framework.html)
- [Schema.org Reference](https://schema.org)
- [E-E-A-T Guidelines](https://developers.google.com/search)
- [Core Web Vitals](https://web.dev/vitals)

---

**Last Updated:** 2024  
**Version:** 1.0  
**Status:** Production Ready ✅
