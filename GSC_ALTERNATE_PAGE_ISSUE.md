# GSC "Alternate page with proper canonical tag" Issue Analysis

## Root Causes Identified

### 1. AMP Pages Served Directly (Should Be Redirected)
**Problem**: `.amp.html` files being crawled instead of redirected
- Example: `https://www.clodo.dev/blog/instant-try-it-impact.amp.html`
- Current behavior: Pages served with canonical pointing to non-AMP version
- **Fix**: Ensure `.amp.html` → extensionless redirect happens BEFORE serving content

**Implementation**:
- Check `_redirects` rule: `/blog/*.amp.html /blog/:splat 301` is in place
- Verify Cloudflare Pages evaluates redirects before serving AMP files
- May need to adjust rule order or pattern

### 2. Malformed Path Crawls (Double /blog/, Wrong Folders)
**Problem**: Google crawled pages at incorrect paths:
- `/blog/blog/community/welcome.html` (double blog)
- `/blog/docs.html` (docs in /blog folder)
- `/blog/pricing.html` (pricing in /blog folder)
- `/blog/about.html` (about in /blog folder)
- `/blog/privacy.html` (privacy in /blog folder)
- `/blog/product.html` (product in /blog folder)
- `/blog/migrate.html` (migrate in /blog folder)
- `/blog/examples.html` (examples in /blog folder)

**Root cause**: These appear to be "discovered" by Google from:
- Old cached links from previous site versions
- 404 pages with suggestions
- Redirect chains that created these paths
- Possibly old nav versions

**Fix**: Add explicit 301 redirects for all malformed paths to correct locations

### 3. Locale Path Inconsistencies
**Problem**:
- `https://www.clodo.dev/br/` (what is this? Brazilian locale?)
- `https://www.clodo.dev/in/` (what is this? Indonesian locale?)
- `https://www.clodo.dev/i18n/ar/case-studies` (missing trailing slash)

**Fix**: 
- If `/br/` and `/in/` shouldn't exist, block with robots.txt or redirect to correct i18n path
- Add redirect for `/i18n/*` paths to ensure trailing slash consistency

### 4. Query Parameters Creating Duplicates
**Problem**: `/blog/?tag=X` shows as alternate pages
- `/blog/?tag=stackblitz`
- `/blog/?tag=metrics`  
- `/blog/?tag=esm`
- etc.

**Fix**: Mark tags parameter as not affecting page identity in GSC (URL parameters tool)

### 5. Variant URLs (A/B Test Leftovers)
**Problem**:
- `/how-to-migrate-from-wrangler-variant-a`
- `/how-to-migrate-from-wrangler-variant-b`

**Fix**: Redirect variants to canonical version OR remove from sitemap

## Solution Strategy

### Immediate (Redirect-based fixes)
1. **Tighten AMP redirect rule** - ensure .amp.html files can't be served
2. **Add malformed path redirects** - all `/blog/{non-blog-pages}` → correct path
3. **Normalize locale paths** - trailing slash consistency
4. **Remove or redirect variants** - A/B pages to main version

### Configuration-based fixes (GSC)
1. **URL Parameters** - Mark `tag` parameter as not affecting page content
2. **Preferred Domain** - Confirm set to `https://www.clodo.dev/`
3. **Coverage Settings** - Exclude 404s that suggest wrong paths

### Monitoring
1. **Recheck in 1-2 weeks** after fixes deploy
2. **Watch for new alternate page warnings** in GSC
3. **Request indexing** for corrected pages

---

## Files to Modify

1. `public/_redirects` - Add malformed path redirects
2. `public/robots.txt` - Block unnecessary locale variants if needed
3. Possibly `public/sitemap.xml` - Remove variants/malformed entries
