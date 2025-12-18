# Structured Data Validation & Testing Guide

## 🔍 Step 1: Validate with Google Rich Results Test

### Process:
1. Go to: **https://search.google.com/test/rich-results**
2. Enter your domain: `https://clodo.dev`
3. Click "Test URL"
4. Review results:
   - ✅ **Pass** = Schema is recognized
   - ⚠️ **Warning** = Schema recognized but has optional issues
   - ❌ **Error** = Schema won't display in search results

### What to Look For:

**Good Results:**
```
✓ SoftwareApplication
  ✓ name: "Clodo Framework"
  ✓ description: "..."
  ✓ aggregateRating: 5.0/5
  ✓ offers: FREE

✓ Organization
  ✓ name: "Clodo"
  ✓ logo: "https://..."
  ✓ social profiles: [...]

✓ FAQPage
  ✓ 5 questions detected
  ✓ All answers have text
```

**Common Issues & Fixes:**

| Issue | Cause | Fix |
|-------|-------|-----|
| "Missing required property" | Schema incomplete | Add all required fields |
| "Property not recognized" | Typo in @type or property | Check against schema.org |
| "Invalid URL format" | URL not using https:// | Ensure all URLs have proper protocol |
| "Image dimensions too small" | Image < 1200px width | Use images ≥ 1200×630px |

---

## 🔍 Step 2: Schema.org Validator

### URL: https://validator.schema.org/

### How to Use:

**Option A: Validate by URL**
```
1. Enter: https://clodo.dev
2. Click "Validate"
3. Review report
```

**Option B: Validate by pasting HTML**
```
1. Copy your page's HTML
2. Paste in editor
3. Click "Validate"
```

### Expected Output:

```json
Parsed as: RDFa

Microdata
SoftwareApplication (1 of 2)
  - aggregateRating: AggregateRating
  - description: Text (4701 characters)
  - featureList: Text[8]
  - offers: Offer
  - url: URL

Organization (2 of 2)
  - contactPoint: ContactPoint
  - logo: ImageObject
  - name: Text
  - sameAs: URL[4]
```

---

## 🤖 Step 3: AI Search Engine Validation

### ChatGPT / Claude
Test direct prompts:

```
"What is Clodo Framework?"
"Who maintains Clodo Framework?"
"What are the features of Clodo?"
```

✅ **Good Response:** Uses information from your schema
❌ **Bad Response:** Generic or outdated info (schema not indexed yet)

### Perplexity AI
1. Go to: https://www.perplexity.ai
2. Search: "Clodo Framework"
3. Check if:
   - ✅ Your site is cited
   - ✅ Correct information displayed
   - ✅ Recent article dates shown

### Google AI Overviews
1. Go to: https://google.com
2. Search: "Clodo Framework developers"
3. Look for AI Overview section
4. Verify:
   - ✅ Your content included
   - ✅ Proper attribution
   - ✅ Links to your pages

---

## 🧪 Step 4: Automated Testing Script

Save as `scripts/validate-schema.js`:

```javascript
const https = require('https');
const fs = require('fs');

const pages = [
  'https://clodo.dev/',
  'https://clodo.dev/docs',
  'https://clodo.dev/faq',
  'https://clodo.dev/examples',
  'https://clodo.dev/pricing'
];

async function validateSchema(url) {
  console.log(`\n📄 Validating: ${url}`);
  
  try {
    const html = await fetchPage(url);
    
    // Check for JSON-LD scripts
    const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
    if (!jsonLdMatches) {
      console.log('❌ No JSON-LD found');
      return;
    }
    
    console.log(`✅ Found ${jsonLdMatches.length} JSON-LD blocks`);
    
    // Parse and validate each
    jsonLdMatches.forEach((match, idx) => {
      try {
        const json = JSON.parse(match.replace(/<script[^>]*>|<\/script>/g, ''));
        console.log(`  ✅ Block ${idx + 1}: @type = ${json['@type']}`);
        
        // Check for required fields based on type
        validateRequiredFields(json);
      } catch (e) {
        console.log(`  ❌ Block ${idx + 1}: Invalid JSON - ${e.message}`);
      }
    });
    
    // Check for OG meta tags
    if (html.includes('og:title')) {
      console.log('✅ Open Graph tags present');
    } else {
      console.log('⚠️ Missing Open Graph tags');
    }
    
    // Check for canonical
    if (html.includes('rel="canonical"')) {
      console.log('✅ Canonical tag present');
    } else {
      console.log('⚠️ Missing canonical tag');
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

function validateRequiredFields(schema) {
  const required = {
    'SoftwareApplication': ['name', 'description'],
    'Organization': ['name'],
    'FAQPage': ['mainEntity'],
    'BlogPosting': ['headline', 'datePublished'],
    'HowTo': ['name', 'step']
  };
  
  const type = schema['@type'];
  const fields = required[type] || [];
  
  fields.forEach(field => {
    if (!schema[field]) {
      console.log(`    ⚠️ Missing recommended: ${field}`);
    }
  });
}

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Run validation
async function runAll() {
  console.log('🔍 Schema Validation Report\n');
  for (const page of pages) {
    await validateSchema(page);
  }
  console.log('\n✅ Validation complete');
}

runAll().catch(console.error);
```

Run with:
```bash
node scripts/validate-schema.js
```

---

## 📊 Step 5: Monitoring & Analytics

### Google Search Console
1. Go to: https://search.google.com/search-console
2. Select property: **https://clodo.dev**
3. Monitor:
   - **Enhancements > Rich Results** - Schema detection over time
   - **Coverage** - Pages indexed with schema
   - **Performance** - Click-through rates from rich results

### Bing Webmaster Tools
1. Go to: https://www.bing.com/webmaster
2. Add site
3. Check:
   - Schema validation status
   - Indexing health
   - Crawl errors

### Yandex Webmaster (for international reach)
1. Go to: https://webmaster.yandex.com
2. Add property
3. Verify structured data support

---

## 🚀 Step 6: Implementation Checklist

### Phase 1: Foundation (This Week)
- [ ] Add BreadcrumbList to all pages
- [ ] Validate homepage with Google Rich Results Test
- [ ] Fix any validation errors
- [ ] Submit to Google Search Console

### Phase 2: Content Schemas (Next Week)
- [ ] Add BlogPosting to all blog posts
- [ ] Add HowTo to tutorial pages
- [ ] Add Article schema to guides
- [ ] Re-validate all pages

### Phase 3: Optimization (Following Week)
- [ ] Collect user ratings/reviews
- [ ] Add AggregateRating schema
- [ ] Monitor Search Console metrics
- [ ] Test in Perplexity, ChatGPT

### Phase 4: Maintenance (Ongoing)
- [ ] Check Search Console weekly
- [ ] Update dateModified for changed content
- [ ] Monitor AI search rankings
- [ ] Add schema to new content automatically

---

## 🎯 Quick Validation Checklist

For each page, verify:

```
Homepage:
✅ SoftwareApplication with rating, features, offers
✅ Organization with name, logo, social links
✅ FAQPage with 5+ Q&A pairs
✅ WebSite with SearchAction
✅ Canonical URL
✅ OG meta tags

Blog Posts:
✅ BlogPosting with headline, datePublished, author
✅ BreadcrumbList
✅ Description
✅ Featured image
✅ Canonical URL
✅ OG meta tags

Documentation:
✅ HowTo schema with steps
✅ BreadcrumbList
✅ Tools/supplies list
✅ Estimated time
✅ Canonical URL

FAQ Page:
✅ FAQPage with mainEntity questions
✅ All questions have answers
✅ BreadcrumbList
✅ Canonical URL
```

---

## 💡 Pro Tips

1. **Always use HTTPS URLs** in schema - Google requires it
2. **Keep images 1200×630px minimum** for rich snippets
3. **Update dateModified** whenever content changes
4. **Use ISO 8601 dates**: `2024-12-15T10:00:00Z`
5. **Test staging before production** via JSON-LD validators
6. **Validate regularly** - especially after content updates
7. **Monitor Search Console** - it shows actual schema errors Google finds

---

## 🔗 Useful Links

- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)
- [JSON-LD Validator](https://jsonlint.com)
- [Google Structured Data Docs](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [Schema.org Types Reference](https://schema.org)
- [OpenGraph Debugger](https://www.opengraph.xyz/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
