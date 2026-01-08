# Pre-Deployment Verification

Final safety checks before production deployment.

## 📋 File

- **pre-deployment-verification.mjs** - Comprehensive validation script

## 🔍 What It Checks

### Canonical URL Validation
- ✅ www.clodo.dev prefix present on ALL canonicals
- ✅ HTTPS protocol enforced (not http)
- ✅ No .html extensions (clean URLs)
- ✅ Index files have trailing slashes (`/`, `/blog/`, not `/index`)
- ✅ AMP pages point to non-AMP canonicals
- ✅ Locale pages have full paths

### Hreflang Tag Validation
- ✅ Domain consistency across all hreflang tags
- ✅ Valid language codes format
- ✅ No orphaned hreflang references

### File Structure Validation
- ✅ 223 HTML files total
- ✅ No syntax errors in meta tags
- ✅ Proper canonical tag format

## 🚀 Usage

### Before Every Production Deployment

```bash
node scripts/seo/verification/pre-deployment-verification.mjs
```

### Expected Output (Success)

```
🔍 Pre-Deployment Verification
Scanning: public

📊 Results:
Files: 223
Checked: 221
Files with issues: 0
Warnings: 0

✅ All checks passed! Safe to deploy.
```

### Expected Output (Failure)

```
🔍 Pre-Deployment Verification
Scanning: public

📊 Results:
Files: 223
Checked: 221
Files with issues: 2
Warnings: 1

❌ Issues found:
[error details...]

🔧 Suggestions:
1. Run universal-canonical-fixer
2. Run fix-hreflang-tags
3. Re-run this verification
```

## ✅ Last Session Results

**Date:** 2026-01-06
**Status:** ✅ PASSED

```
🔍 Pre-Deployment Verification
Files: 223
Checked: 221
Files with issues: 0
Warnings: 0
✅ All checks passed! Safe to deploy.
```

## 📊 What Gets Skipped

The verification intentionally skips:
1. **Noindex files** - Don't need canonicals (e.g., subscribe/thanks.html)
2. **Analytics files** - Not user-facing
3. **Performance dashboards** - Internal tools
4. **AMP index file** - Special case (intentional)

**Files skipped:** 2  
**Files checked:** 221 of 223

## 🔄 Workflow Integration

### Pre-Deployment Checklist

```bash
# 1. Make changes (run fixers if needed)
node scripts/seo/fixers/universal-canonical-fixer.mjs public
node scripts/seo/fixers/fix-hreflang-tags.mjs public

# 2. Run verification
node scripts/seo/verification/pre-deployment-verification.mjs

# 3. If passed (0 issues)
git add .
git commit -m "Fix SEO canonicals and hreflang"
git push origin main

# 4. If failed, fix and re-run verification
```

### As npm Script

Add to `package.json`:
```json
{
  "scripts": {
    "seo:verify": "node scripts/seo/verification/pre-deployment-verification.mjs",
    "pre-deploy": "npm run seo:verify && git push origin main"
  }
}
```

Then use:
```bash
npm run seo:verify         # Just check
npm run pre-deploy         # Check + push
```

## 📋 Detailed Checks

### Canonical Format Check
```
✅ <link rel="canonical" href="https://www.clodo.dev/...">
❌ <link rel="canonical" href="https://clodo.dev/..."> (missing www)
❌ <link rel="canonical" href="http://www.clodo.dev/..."> (not HTTPS)
❌ <link rel="canonical" href="https://www.clodo.dev/page.html"> (.html not allowed)
```

### Index File Check
```
✅ Root: href="https://www.clodo.dev/"           (trailing slash)
✅ Blog: href="https://www.clodo.dev/blog/"      (trailing slash)
❌ Root: href="https://www.clodo.dev/index.html" (bad format)
❌ Blog: href="https://www.clodo.dev/blog/index" (missing slash)
```

### AMP Page Check
```
✅ AMP file: /amp/en/blog/foo.amp.html
✅ Canonical: https://www.clodo.dev/blog/foo     (non-AMP URL)
❌ Canonical: https://www.clodo.dev/amp/en/blog/foo.amp.html (points to itself)
```

### Hreflang Check
```
✅ <link rel="alternate" hreflang="en" href="https://www.clodo.dev/">
✅ <link rel="alternate" hreflang="en-IN" href="https://www.clodo.dev/in/">
❌ Hreflang with http:// (should be https://)
❌ Hreflang missing domain
```

## ⚠️ Common Issues & Fixes

### Issue: Some pages failed checks

**Cause:** Canonical fixes weren't applied
**Fix:**
```bash
node scripts/seo/fixers/universal-canonical-fixer.mjs public
node scripts/seo/verification/pre-deployment-verification.mjs
```

### Issue: Hreflang warnings

**Cause:** Domain inconsistency in hreflang tags
**Fix:**
```bash
node scripts/seo/fixers/fix-hreflang-tags.mjs public
node scripts/seo/verification/pre-deployment-verification.mjs
```

### Issue: Specific file failing

**Cause:** Manual edit, special formatting
**Action:**
1. Check the reported file
2. Fix manually or with universal fixer
3. Re-run verification

## 📊 Metrics

### Session 2026-01-06
- **Total files:** 223
- **Checked:** 221
- **Issues before fixes:** 13 canonical + 29 hreflang
- **Issues after fixes:** 0
- **Time to fix all:** ~5 seconds
- **Time to verify:** ~3 seconds
- **Status:** ✅ SAFE TO DEPLOY

## 🎯 Pre-Deploy Checklist

Before running this script, ensure:

- [ ] All changes committed to git
- [ ] No uncommitted modifications
- [ ] public/ folder built and ready
- [ ] Internet connection available (for URL checks if doing full scan)
- [ ] Latest fixes applied (if changes were made)

## 🔧 Technical Details

### What It Validates

1. **Canonical Link Tags**
   - Regex: `/<link[^>]+rel=["']canonical["'][^>]*>/gi`
   - Extracts href attribute
   - Validates format and domain

2. **Hreflang Link Tags**
   - Regex: `/<link[^>]+rel=["']alternate["'][^>]*>/gi`
   - Checks href consistency
   - Validates language codes

3. **File Operations**
   - Recursively scans public/ folder
   - Processes 223 HTML files
   - Skips intentional exclusions

### Exit Codes

```bash
0 = All checks passed (safe to deploy)
1 = Issues found (don't deploy)
```

## 📈 Monitoring After Deploy

After deployment, monitor:

1. **Search Console** (next 7 days)
   - Check indexing status
   - Monitor "Alternate page" errors
   - Watch crawl stats

2. **Canonical Reports**
   - Verify Google recognizes canonicals
   - Check for "Page with redirect" errors
   - Confirm coverage improvements

3. **Performance**
   - Monitor crawl efficiency
   - Check Core Web Vitals
   - Watch PageSpeed metrics

## 📞 Support

**Question:** How often should I run this?
**Answer:** Before every production deployment

**Question:** Can I run this on development?
**Answer:** Yes, but it checks the public/ (build) folder, not source

**Question:** What if a check fails?
**Answer:** Use the fixer scripts, then re-run verification

**Question:** Can I skip this before deploying?
**Answer:** Not recommended. Always verify before production.

## 🔄 Integration with Deployment

### GitHub Actions Example

```yaml
- name: SEO Verification
  run: node scripts/seo/verification/pre-deployment-verification.mjs

- name: Deploy
  if: success()
  run: npm run build && git push origin main
```

### Manual Deployment Workflow

```bash
# 1. Make changes
# 2. Build
npm run build

# 3. Verify (this script)
npm run seo:verify

# 4. Deploy (only if verified)
git push origin main
```

## ✨ Summary

**Purpose:** Ensure all SEO metadata is correct before production  
**Runtime:** ~3 seconds  
**False Positives:** Very low (only catches real issues)  
**Rollback:** Simple git revert if needed  
**Confidence:** High (223 files validated)

**Status:** ✅ READY FOR PRODUCTION
