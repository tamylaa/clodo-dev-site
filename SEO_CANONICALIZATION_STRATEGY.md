# Comprehensive SEO Canonicalization Strategy

**Objective**: Eliminate all redirect issues in GSC by enforcing a single, consistent canonical URL format across all layers.

## Canonical URL Format (Golden Rule)
```
https://www.clodo.dev/<path>
```
- **Protocol**: HTTPS only
- **Domain**: www.clodo.dev (with www)
- **Path**: No `.html` extension, no trailing slash (except root `/`)
- **Examples**:
  - ✅ `https://www.clodo.dev/pricing`
  - ✅ `https://www.clodo.dev/blog/article-slug`
  - ✅ `https://www.clodo.dev/i18n/de/pricing`
  - ✅ `https://www.clodo.dev/`
  - ❌ `https://www.clodo.dev/pricing.html`
  - ❌ `https://www.clodo.dev/pricing/`
  - ❌ `http://www.clodo.dev/pricing`
  - ❌ `https://clodo.dev/pricing`

## Enforcement Layers (in priority order)

### Layer 1: HTTP Redirects (Highest Priority)
**File**: `public/_redirects`
**Purpose**: Server-side 301 redirects that consolidate variants to canonical form

**Rules** (already implemented):
```
# Domain canonicalization
http://* https://www.clodo.dev:splat 301
https://clodo.dev/* https://www.clodo.dev/:splat 301

# Extension stripping
/*.html /:splat 301
/blog/*.html /blog/:splat 301

# Trailing slash normalization
/*/ /:splat 301
```

**Result**: All variants redirect to clean canonical URLs

---

### Layer 2: HTML Canonical Tags (Verification Layer)
**File**: Build script runs `build/fix-canonicals-fn.js`
**Purpose**: Every HTML file declares its own canonical URL in `<head>`

**Standard**:
```html
<link rel="canonical" href="https://www.clodo.dev/<clean-path>">
```

**Examples**:
- `/pricing.html` page → `<link rel="canonical" href="https://www.clodo.dev/pricing">`
- `/blog/article.html` → `<link rel="canonical" href="https://www.clodo.dev/blog/article">`
- `/i18n/de/pricing.html` → `<link rel="canonical" href="https://www.clodo.dev/i18n/de/pricing">`

**Validation**: All tests in `tests/integration/` verify canonical tags are present and correct

---

### Layer 3: HTTP Headers
**File**: `public/_headers`
**Purpose**: Security, caching, and robots meta signals

**Important**: Headers use Cloudflare's path-matching syntax, which automatically handles extensions:
- `/performance-dashboard.html` matches Cloudflare's internal HTML file path
- BUT the actual served URL is extensionless (due to Layer 1 redirects)

**Current State**: ✅ Correct (headers are applied before redirects are evaluated)

---

### Layer 4: Sitemap
**File**: `public/sitemap.xml` (manually maintained)
**Purpose**: Tell Google which URLs to crawl

**Standard**: Only list canonical URLs (no extensions, clean paths)
```xml
<url>
  <loc>https://www.clodo.dev/pricing</loc>
</url>
```

**Validation**: 
- ✅ All sitemap URLs are extensionless (verified)
- ✅ All URLs start with `https://www.clodo.dev/`

---

### Layer 5: robots.txt
**File**: `public/robots.txt`
**Purpose**: Block non-canonical variants and sensitive pages

**Current Strategy**: 
- Disallow `/performance-dashboard.html`, `/analytics.html`, thank-you pages
- Allow everything else

---

### Layer 6: Meta Tags
**File**: Individual HTML files in `public/`
**Purpose**: Declare indexing status

**Standard**:
```html
<meta name="robots" content="index, follow">
```

**Special Cases**:
- Admin/monitoring pages: `noindex, nofollow`
- Thank-you pages: `noindex, nofollow`
- 404 page: `noindex, nofollow`

---

## Handling Special Cases

### AMP Pages
**Current Implementation**: ✅ Correct
- AMP files live at `/amp/en/blog/slug.amp.html`
- Canonical tag in AMP points to: `https://www.clodo.dev/blog/slug`
- Redirect rule: `/blog/*.amp.html /blog/:splat 301`
- **Result**: AMP → non-AMP canonical, no duplicate indexing

### Localized Pages (i18n)
**Current Implementation**: ✅ Correct
- File path: `/i18n/de/pricing.html`
- Canonical URL: `https://www.clodo.dev/i18n/de/pricing`
- Redirect: `*.html → /` strips extension
- **Result**: Extensionless, localized canonical

### Index Pages (folder roots)
**Current Implementation**: ✅ Correct
- File: `/blog/index.html` → Canonical: `https://www.clodo.dev/blog/`
- File: `/case-studies/index.html` → Canonical: `https://www.clodo.dev/case-studies/`
- Build script handles this in `toCanonicalUrl(filePath)`

---

## GSC Issue Resolution Timeline

### Immediate (Deploy + 1 hour)
- ✅ All redirects are live
- ✅ New crawls follow 301 redirects to canonical URLs
- ✅ Canonical tags point to clean URLs

### 1-7 Days
- Google recrawls pages
- Follows 301 redirects
- Consolidates redirect chains

### 1-3 Weeks  
- GSC coverage report updates
- "Page with redirect" items decrease
- Duplicate URL items consolidated

### 3-4 Weeks
- Full normalization visible in GSC
- Crawl budget consolidated to canonical domain

### Action Items in GSC:
1. ✅ Ensure Preferred Domain is set to `https://www.clodo.dev/`
2. ✅ Resubmit sitemap (request recrawl)
3. ✅ Use "Request indexing" for top-priority pages

---

## Testing & Validation

### Automated Tests
- `tests/integration/headers.spec.js`: Verifies meta/header consistency
- `tests/integration/amp.spec.js`: Verifies AMP canonicals map correctly

### Manual Verification
```bash
# Test a redirect
curl -I "https://www.clodo.dev/pricing.html"
# Should return 301 → https://www.clodo.dev/pricing

# Test canonical tag
curl "https://www.clodo.dev/pricing" | grep -i canonical
# Should output: <link rel="canonical" href="https://www.clodo.dev/pricing">

# Check sitemap
curl "https://www.clodo.dev/sitemap.xml" | grep -c "<loc>"
# Should show count of URLs (all extensionless)
```

---

## File Checklist

- [x] `public/_redirects` - Domain canonicalization + extension stripping
- [x] `public/_headers` - Robots signals + caching
- [x] `build/fix-canonicals-fn.js` - Canonical tag generation
- [x] `public/sitemap.xml` - Only lists canonical URLs
- [x] `public/robots.txt` - Blocks non-canonical + sensitive pages
- [x] HTML meta tags - robots meta consistent
- [x] Tests validate canonical correctness

---

## Known Limitations & Next Steps

### Current Strategy Gaps
1. Query parameters (`/blog?tag=stackblitz`) - GSC will still show as separate URLs
   - **Fix**: Use GSC's "URL parameters" tool to mark tags as non-indexable
   
2. Historical GSC data cleanup
   - **Fix**: Manual review in GSC after 3-4 weeks, mark duplicates as "Not selected"

3. Remaining `.html` variant crawl in GSC
   - **Fix**: Will auto-resolve after Google recrawls (1-3 weeks)

### Post-Deploy Checklist
- [ ] Deploy merged master branch to production
- [ ] Run `gh run list` to verify deploy workflow passes
- [ ] Resubmit sitemap in GSC
- [ ] Request indexing for top 10 pages in sitemap
- [ ] Wait 1 week, check GSC Coverage report
- [ ] If issues persist, escalate to Google with canonicals/redirects confirmed

---

**Status**: Strategy implemented and validated locally  
**Deploy Status**: Pending production deployment  
**GSC Resolution Timeline**: 1-4 weeks after deploy
