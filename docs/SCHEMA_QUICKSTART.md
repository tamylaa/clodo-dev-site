# 🚀 Quick Start: Add Schema to Your Site

## 5-Minute Setup (Most Impact)

### Step 1: Add BreadcrumbList to All Pages

For each non-homepage page, add this to `<head>`:

**For `/docs.html`:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://clodo.dev/"},
    {"@type": "ListItem", "position": 2, "name": "Documentation", "item": "https://clodo.dev/docs"}
  ]
}
</script>
```

**For `/faq.html`:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://clodo.dev/"},
    {"@type": "ListItem", "position": 2, "name": "FAQ", "item": "https://clodo.dev/faq"}
  ]
}
</script>
```

Repeat for:
- `/examples.html`
- `/pricing.html`
- `/migrate.html`
- `/what-is-edge-computing.html`
- `/what-is-cloudflare-workers.html`
- Any other pages

### Step 2: Add BlogPosting to Blog Posts

For each blog post, add to `<head>`:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Your Article Title",
  "description": "Brief description of the article",
  "image": "https://clodo.dev/blog-images/post-slug.png",
  "datePublished": "2024-11-20T10:00:00Z",
  "dateModified": "2024-12-10T14:30:00Z",
  "author": {"@type": "Organization", "name": "Clodo Team"},
  "publisher": {
    "@type": "Organization",
    "name": "Clodo Framework",
    "url": "https://clodo.dev"
  },
  "mainEntityOfPage": {"@type": "WebPage", "@id": "https://clodo.dev/blog/post-slug"},
  "keywords": "keyword1, keyword2, keyword3",
  "isAccessibleForFree": true
}
</script>
```

### Step 3: Validate

1. Go to: https://search.google.com/test/rich-results
2. Enter: `https://clodo.dev`
3. Click "Test URL"
4. Verify results show: SoftwareApplication ✅, Organization ✅, FAQPage ✅

---

## 30-Minute Setup (Better Coverage)

In addition to above, add:

### HowTo Schema to Tutorial Pages

If you have a "Getting Started" or guide page:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Get Started with Clodo Framework",
  "description": "Step-by-step guide to building your first app",
  "totalTime": "PT30M",
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "Install Clodo",
      "text": "npm install @clodo/framework",
      "url": "https://clodo.dev/guides/getting-started#step-1"
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "Create Project",
      "text": "Run clodo new my-app",
      "url": "https://clodo.dev/guides/getting-started#step-2"
    }
  ]
}
</script>
```

### Rating Schema (Optional)

If you have user reviews:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "AggregateRating",
  "itemReviewed": {
    "@type": "SoftwareApplication",
    "name": "Clodo Framework"
  },
  "ratingValue": "4.9",
  "bestRating": "5",
  "ratingCount": "127",
  "reviewCount": "43"
}
</script>
```

---

## Verification

### After Adding Schema:

1. **Local Test:**
   ```bash
   npm run build
   ```

2. **Google Rich Results Test:**
   - https://search.google.com/test/rich-results
   - Enter your homepage
   - Verify all schemas show with ✅

3. **Schema Validator:**
   - https://validator.schema.org/
   - Paste your HTML
   - Check for errors

4. **Search Console:**
   - https://search.google.com/search-console
   - Check Enhancements > Rich Results
   - Monitor for schema errors

---

## Common Issues & Fixes

### Issue: "Required property 'name' missing"

**Fix:** Ensure all required fields are present:
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Required ✅",
  "description": "Required ✅",
  "image": "Required ✅",
  "datePublished": "Required ✅"
}
```

### Issue: "Property not recognized"

**Fix:** Check spelling and type:
- ❌ `headLine` → ✅ `headline`
- ❌ `images` → ✅ `image`
- ❌ `datePublish` → ✅ `datePublished`

### Issue: "Invalid URL"

**Fix:** Use full HTTPS URLs:
- ❌ `/docs` → ✅ `https://clodo.dev/docs`
- ❌ `http://` → ✅ `https://`

### Issue: Schema not showing in Google Rich Results

**Fix:** Give Google time to recrawl (24-48 hours):
1. Add schema
2. Test locally ✅
3. Deploy to production
4. Wait 24-48 hours
5. Retest in Google Rich Results Test

---

## Implementation Priority

**Week 1 (High Impact):**
1. Add BreadcrumbList to all pages
2. Add BlogPosting to all blog posts
3. Validate with Google Rich Results Test

**Week 2 (Better Coverage):**
1. Add HowTo to tutorial pages
2. Enhance FAQ schema
3. Submit to Search Console

**Week 3+ (Advanced):**
1. Add rating schema
2. Monitor Search Console
3. Collect user reviews
4. Track AI search visibility

---

## Files to Modify

### Pages needing BreadcrumbList:
- `/docs.html` ← Add breadcrumb
- `/faq.html` ← Already has FAQPage, add breadcrumb
- `/examples.html` ← Add breadcrumb
- `/pricing.html` ← Add breadcrumb
- `/migrate.html` ← Add breadcrumb
- `/what-is-edge-computing.html` ← Add breadcrumb
- `/what-is-cloudflare-workers.html` ← Add breadcrumb
- All blog posts in `/blog/` ← Add breadcrumb + BlogPosting

### Pages needing BlogPosting:
- All files in `/blog/` folder

### Pages needing HowTo:
- `/guides/` pages (if any)
- Tutorial pages
- Getting started pages

---

## Testing Your Implementation

### Step-by-Step Verification:

1. **Build locally:**
   ```bash
   npm run build
   ```

2. **Check HTML output:**
   ```bash
   grep -r "@context" dist/
   ```
   Should show schema blocks in all pages

3. **Validate schema:**
   ```bash
   npm run validate-schema
   ```
   (if script installed)

4. **Test in browser:**
   - Serve: `python -m http.server 8000`
   - Open: `http://localhost:8000`
   - Right-click > Inspect > check `<head>` for schema tags

5. **Google Rich Results Test:**
   - Go to: https://search.google.com/test/rich-results
   - Enter URL
   - Verify ✅ on all expected schemas

---

## Next Steps

1. ✅ Add BreadcrumbList to all pages
2. ✅ Add BlogPosting to blog posts
3. ✅ Add HowTo to tutorials
4. 📊 Submit sitemap to Google Search Console
5. 📈 Monitor Search Console for 2-4 weeks
6. 🤖 Test in ChatGPT, Perplexity, Claude
7. 🎯 Measure traffic from AI searches

---

## Support

If schema isn't showing:

1. **Check syntax:** Use https://jsonlint.com
2. **Validate type:** Visit https://schema.org/[TypeName]
3. **Google test:** https://search.google.com/test/rich-results
4. **Wait for crawl:** Google might need 24-48 hours

Remember: Structured data doesn't instantly improve SEO, but it **enables** rich features in search results and AI engines. Give it 2-4 weeks to see results.
