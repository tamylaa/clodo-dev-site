# SEO Fixers

Canonical URL and hreflang tag fixers for consistent SEO metadata.

## 📋 Files

- **universal-canonical-fixer.mjs** - Fix all canonical issues
- **fix-hreflang-tags.mjs** - Fix hreflang domain/path issues

## 🔧 universal-canonical-fixer.mjs

Fixes all canonical URL issues in HTML files.

### What It Does

1. **Ensures www prefix:** `clodo.dev` → `www.clodo.dev`
2. **Ensures HTTPS:** All canonicals use `https://`
3. **Removes .html extensions:** `/blog/post.html` → `/blog/post`
4. **Fixes index files:** `/blog/index.html` → `/blog/`
5. **Handles AMP pages:** `/amp/en/blog/foo.amp.html` → `/blog/foo`
6. **Excludes intentional exclusions:** noindex files, analytics pages

### Usage

```bash
node scripts/seo/fixers/universal-canonical-fixer.mjs public
```

### What Changed (Session 2026-01-06)

```
Files: 223
Fixed: 13
Already correct: 206
Errors: 4 (intentional)

Fixed patterns:
- blog/index.html canonical: /blog/index → /blog/ ✅
- amp pages: /amp/en/blog/foo.amp.html → /blog/foo ✅
- i18n pages: /i18n/de/page.html → /i18n/de/page ✅
- root index: /index.html → / ✅
```

### Examples

**Index file fix:**
```html
<!-- Before -->
<link rel="canonical" href="https://www.clodo.dev/blog/index.html">

<!-- After -->
<link rel="canonical" href="https://www.clodo.dev/blog/">
```

**AMP page fix:**
```html
<!-- Before -->
<link rel="canonical" href="https://www.clodo.dev/amp/en/blog/my-post.amp.html">

<!-- After -->
<link rel="canonical" href="https://www.clodo.dev/blog/my-post">
```

**Extension removal:**
```html
<!-- Before -->
<link rel="canonical" href="https://www.clodo.dev/about.html">

<!-- After -->
<link rel="canonical" href="https://www.clodo.dev/about">
```

**Domain fix:**
```html
<!-- Before -->
<link rel="canonical" href="https://clodo.dev/blog/post">

<!-- After -->
<link rel="canonical" href="https://www.clodo.dev/blog/post">
```

### Files Modified

- All 223 HTML files in `public/`
- Focus on files with incorrect canonicals (13 fixed)
- Skips noindex files, analytics, intentional exclusions

### When to Use

- ✅ After domain changes
- ✅ After URL structure changes
- ✅ After adding new pages
- ✅ Regular quality checks
- ✅ Before production deploy

---

## 🔗 fix-hreflang-tags.mjs

Fixes hreflang tag domain/path consistency.

### What It Does

1. **Updates domain in href:** `clodo.dev` → `www.clodo.dev` (or vice versa)
2. **Preserves language codes:** `hreflang="en-IN"` stays intact
3. **Preserves paths:** Only updates domain part
4. **Handles all formats:** `hreflang="en"`, `hreflang="en-US"`, `hreflang="x-default"`

### Usage

```bash
node scripts/seo/fixers/fix-hreflang-tags.mjs public
```

### What Changed (Session 2026-01-06)

```
Files: 223
Fixed: 29
Unchanged: 194

Fixed files:
- public/index.html (root hreflang tags)
- public/about.html
- public/blog/*.html (blog posts)
- public/i18n/de/*.html (localized pages)
- public/pricing.html
- public/docs.html
```

### Examples

**Simple language tag:**
```html
<!-- Before -->
<link rel="alternate" hreflang="en" href="https://clodo.dev/en/">

<!-- After -->
<link rel="alternate" hreflang="en" href="https://www.clodo.dev/en/">
```

**Regional variant:**
```html
<!-- Before -->
<link rel="alternate" hreflang="en-IN" href="https://clodo.dev/in/en/">

<!-- After -->
<link rel="alternate" hreflang="en-IN" href="https://www.clodo.dev/in/en/">
```

**Default language:**
```html
<!-- Before -->
<link rel="alternate" hreflang="x-default" href="https://clodo.dev/">

<!-- After -->
<link rel="alternate" hreflang="x-default" href="https://www.clodo.dev/">
```

### Files Modified

- 29 files with hreflang tags
- Root index (7 language variants)
- Blog posts (multiple posts with regional variants)
- Localized pages (Germany, Brazil, India variants)

### When to Use

- ✅ Domain changes (add/remove www)
- ✅ Adding new locales
- ✅ Fixing regional relationships
- ✅ After structure changes
- ⚠️ Use carefully! (affects Search Console)

### Important Notes

**Risk Level:** MEDIUM
- Affects how Google sees language relationships
- Can cause re-indexing
- Wrong hreflang can de-index pages

**Last Session Context:**
- User noted these were changed FROM www.clodo.dev TO clodo.dev in earlier build
- Reverted back to www.clodo.dev for consistency
- May need to monitor Search Console

---

## 🔄 Combined Usage

### Fix Everything
```bash
# Step 1: Fix canonicals
node scripts/seo/fixers/universal-canonical-fixer.mjs public

# Step 2: Fix hreflang
node scripts/seo/fixers/fix-hreflang-tags.mjs public

# Step 3: Verify
node scripts/seo/verification/pre-deployment-verification.mjs
```

### Fix Just One Thing
```bash
# Only canonicals
node scripts/seo/fixers/universal-canonical-fixer.mjs public

# Only hreflang (for domain/locale changes)
node scripts/seo/fixers/fix-hreflang-tags.mjs public
```

---

## 📊 Performance

| Tool | Input | Output | Speed |
|------|-------|--------|-------|
| universal-canonical-fixer | 223 files | Modified HTML | ~2 sec |
| fix-hreflang-tags | 223 files | Modified HTML | ~1 sec |

---

## ⚠️ Safety Notes

### Backups
- Scripts modify files in-place
- Use git to track changes
- Easy rollback with `git revert`

### No Breaking Changes
- Only modify canonical/hreflang tags
- Don't change content, URLs, or structure
- All changes are in <head> metadata

### Testing
- Always run pre-deployment verification after
- Check live site after deploy
- Monitor Search Console for 7 days

### Rollback
If issues detected:
```bash
git revert <commit-hash>
git push origin main
# Site reverts automatically
```

---

## 🔧 Customization

If you need to modify fix logic:

**Universal Canonical Fixer:**
- Check lines 30-50 for URL transformation rules
- Modify regex patterns for different domain/path handling
- Add exclusion patterns for special files

**Fix Hreflang Tags:**
- Check lines 20-40 for domain replacement logic
- Modify regex for different domain formats
- Add preserve patterns for special attributes

---

## 📞 Common Issues

**Q: How do I fix just the AMP canonicals?**
A: Use `universal-canonical-fixer.mjs` - it handles AMP automatically

**Q: Can I preview changes before applying?**
A: Not directly, but you can:
1. Check the output report
2. Use git to see diffs: `git diff public/`
3. Restore with: `git checkout public/`

**Q: What if I only need to fix hreflang?**
A: Run just `fix-hreflang-tags.mjs`

**Q: How do I undo the fixes?**
A: Use git: `git checkout public/`

**Q: Do these break redirects?**
A: No, they only modify metadata in <head>
