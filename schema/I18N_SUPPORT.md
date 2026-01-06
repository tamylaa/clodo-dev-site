# Schema.org Multi-Language (i18n) Support

## Overview

The schema system now fully supports **9 language locales** across your website:

- **English** (en) - `https://clodo.dev`
- **German** (de) - `https://clodo.dev/i18n/de`
- **Italian** (it) - `https://clodo.dev/i18n/it`
- **Arabic** (ar) - `https://clodo.dev/i18n/ar` [RTL]
- **Hebrew** (he) - `https://clodo.dev/i18n/he` [RTL]
- **Persian/Farsi** (fa) - `https://clodo.dev/i18n/fa` [RTL]
- **Portuguese (Brazil)** (br) - `https://clodo.dev/i18n/br`
- **Spanish (Latin America)** (es-419) - `https://clodo.dev/i18n/es-419`
- **English (India)** (in) - `https://clodo.dev/i18n/in`

## Key Features

### 1. **Automatic Locale Detection**
- Schemas automatically detect locale from file path
- `/blog/article.html` → English (en)
- `/i18n/de/article.html` → German (de)
- `/i18n/it/article.html` → Italian (it)

### 2. **Locale-Specific Organization Schema**
Each locale has its own Organization schema with:
- **Localized organization name** (if available)
- **Locale-specific URLs** with `/i18n/<locale>` prefix (except English)
- **Country/region metadata** (Germany for de, Italy for it, etc.)
- **Language attributes** in `inLanguage` field
- **RTL support** for Arabic, Hebrew, Persian (right-to-left layouts)

### 3. **Localized Content URLs**
```javascript
// English pages point to base URL
https://clodo.dev/blog/cloudflare-infrastructure-myth

// German pages include locale prefix
https://clodo.dev/i18n/de/blog/cloudflare-infrastructure-myth

// Arabic pages (RTL)
https://clodo.dev/i18n/ar/blog/cloudflare-infrastructure-myth
```

### 4. **Multi-Language Blog Posts**
When a blog post is configured in `page-config.json`, generated schemas include:
- **Locale-aware URLs** (automatically adjusted based on detected locale)
- **Language tags** (`inLanguage: "de-DE"`, `"it-IT"`, etc.)
- **Correct region metadata** for each country
- **Author information** linked from `blog-data.json`

### 5. **Case Study Localization**
Case study schemas automatically adapt:
- URLs reflect the locale (`/i18n/de/case-studies/...`)
- Metrics remain language-agnostic (numbers translate universally)
- Organization references use correct locale

## Architecture

### Configuration Files

**`schema/defaults-i18n.json`** - Centralized locale configuration
```json
{
  "locales": {
    "en": { "organization": {...}, "locale": "en-US", "region": "US" },
    "de": { "organization": {...}, "locale": "de-DE", "region": "DE" },
    "it": { "organization": {...}, "locale": "it-IT", "region": "IT" },
    "ar": { "organization": {...}, "locale": "ar-SA", "region": "SA", "isRTL": true },
    ... // All 9 locales configured
  },
  "shared": { "softwareApplication": {...} }
}
```

### Utility Functions

**`schema/locale-utils.js`** - Locale detection and URL building
```javascript
// Detect locale from file path
detectLocaleFromPath('i18n/de/article.html') // → 'de'
detectLocaleFromPath('blog/article.html')     // → 'en' (default)

// Build locale-specific URLs
buildLocaleUrl('/blog/article', 'en')  // → https://clodo.dev/blog/article
buildLocaleUrl('/blog/article', 'de')  // → https://clodo.dev/i18n/de/blog/article

// Check if locale is RTL
isRTLLocale('ar')  // → true
isRTLLocale('en')  // → false

// Get locale configuration
getLocaleConfig('de') // → { organization, language, locale, region }

// Generate hreflang links for SEO
generateAlternateLanguageLinks('/docs') // → [{ rel: 'alternate', hreflang: 'en', href: '...' }, ...]
```

### Build Integration

**`schema/build-integration.js`** - Modified to support locales
```javascript
// Now detects locale from file path during build
export function injectSchemasIntoHTML(htmlFilePath, htmlContent) {
  const locale = detectLocaleFromPath(htmlFilePath); // Auto-detect
  // ... generates schemas with correct locale-specific URLs
}
```

## Schema Generation

### How It Works

1. **Build processes HTML file** → `dist/i18n/de/docs.html`
2. **Locale detected** → German (de)
3. **Organization schema generated** with:
   - German language (`inLanguage: "de-DE"`)
   - German organization name
   - Germany region metadata
   - URL: `https://clodo.dev/i18n/de`
4. **Article/TechArticle schema generated** with:
   - Locale-specific URL
   - Language metadata
   - Author information (language-agnostic)

### Configuration Example

If you configure a blog post in `page-config.json`:
```json
{
  "blogPosts": {
    "cloudflare-infrastructure-myth.html": {
      "title": "The Myth of Cloudflare Infrastructure",
      "url": "https://clodo.dev/blog/cloudflare-infrastructure-myth",
      "author": "tamyla",
      "published": "2024-11-28"
    }
  }
}
```

Then:
- ✅ English page (`/blog/...`) generates English schemas
- ✅ German page (`/i18n/de/blog/...`) generates German schemas
- ✅ Italian page (`/i18n/it/blog/...`) generates Italian schemas
- ✅ All locales generate correct Organization + Article schemas

## SEO Benefits

### 1. **Hreflang Links**
Alternate language links are properly set for:
```html
<link rel="alternate" hreflang="en" href="https://clodo.dev/docs">
<link rel="alternate" hreflang="de" href="https://clodo.dev/i18n/de/docs">
<link rel="alternate" hreflang="it" href="https://clodo.dev/i18n/it/docs">
<link rel="alternate" hreflang="x-default" href="https://clodo.dev/docs">
```

### 2. **Localized Search Results**
Google Rich Results will show:
- German users: German organization metadata, German URLs
- Italian users: Italian organization metadata, Italian URLs
- Arabic users: Arabic metadata, RTL indicator

### 3. **Regional SEO**
- Organization schema includes country/region metadata
- Each locale is associated with correct geographic region
- Helps rank in regional searches (Germany, Italy, Middle East, etc.)

## When to Add Localization

### Currently Implemented
- ✅ **Automatic detection** for all 9 locales
- ✅ **Blog posts** - Add filename to `page-config.json`
- ✅ **Case studies** - Configured similarly to blog posts
- ✅ **Organization schema** - Locale-aware

### Future Enhancements (Optional)

If you expand localized content:

1. **Create locale-specific page configs**
   ```json
   {
     "blogPosts": {
       "german-only-article.html": { ... }
     }
   }
   ```

2. **Add translations to page-config.json**
   ```json
   {
     "cloudflare-infrastructure-myth.html": {
       "en": { "title": "English title", ... },
       "de": { "title": "German title", ... }
     }
   }
   ```

3. **Extend localized FAQ pages**
   - Current: Inline schemas in i18n pages
   - Future: Centralized FAQ configs with locale keys

## RTL Language Support

For Arabic, Hebrew, and Persian:
- Schema system detects RTL automatically
- `isRTLLocale('ar')` returns `true`
- Build process can add `dir="rtl"` attributes
- CSS can apply RTL-specific styles

Example RTL detection:
```javascript
const isRTL = isRTLLocale(locale); // true for ar, he, fa
const htmlDir = isRTL ? ' dir="rtl"' : '';
```

## Testing Localized Schemas

### Via Google Rich Results Test
1. Copy a localized page from `dist/i18n/de/...`
2. Upload to [Google Rich Results Test](https://search.google.com/test/rich-results)
3. Verify:
   - ✅ Organization schema with German metadata
   - ✅ `inLanguage: "de-DE"` present
   - ✅ Country/region: Germany
   - ✅ No validation errors

### Via CLI
```bash
# Check which locales are detected
node schema/cli.js status

# Validate schemas for all locales
node schema/cli.js validate

# Generate schemas with details
node schema/cli.js generate --verbose
```

## Common Questions

### Q: Do I need to translate schema content?
**A:** No. Schema fields like organization metadata are already translated in `defaults-i18n.json`. Blog/article content is language-agnostic for structured data.

### Q: What if I add a new language?
**A:** 
1. Add locale to `schema/locale-utils.js` (`SUPPORTED_LOCALES` object)
2. Add configuration to `schema/defaults-i18n.json`
3. Create `public/i18n/<locale>/` folder
4. Schemas will auto-detect and generate correctly

### Q: Do localized German blog posts automatically get German schemas?
**A:** **Yes!** If you:
1. Place German blog post at `public/i18n/de/cloudflare-infrastructure-myth.html`
2. Configure it in `page-config.json`
3. Run build

Then it automatically generates with `inLanguage: "de-DE"` and German organization metadata.

### Q: What about URL canonicals for localized pages?
**A:** Each locale has correct canonical URL:
```html
<!-- English -->
<link rel="canonical" href="https://clodo.dev/blog/article">

<!-- German -->
<link rel="canonical" href="https://clodo.dev/i18n/de/blog/article">
```

## Files Modified

- ✅ `schema/schema-generator.js` - Added `locale` parameter to all generation functions
- ✅ `schema/build-integration.js` - Added locale detection and passing
- ✅ `schema/defaults.json` - Original (still supported)
- ✅ `schema/defaults-i18n.json` - **NEW** - All 9 locale configurations
- ✅ `schema/locale-utils.js` - **NEW** - Locale utilities and detection
- ✅ `build/build.js` - Already calling injectSchemasIntoHTML with file paths

## Next Steps

1. **Monitor Google Search Console**
   - Check that German, Italian, etc. pages are indexed
   - Verify correct language/region metadata

2. **Test with Google Rich Results**
   - Validate schemas for at least one page per locale
   - Ensure `inLanguage` and region metadata is correct

3. **Consider Content Expansion**
   - If adding more localized blog posts, add to `page-config.json`
   - Existing schema system will handle locale detection automatically

4. **Optional: Google Translate Integration**
   - If targeting non-English markets, consider auto-translation of blog content
   - Schemas will adjust automatically based on locale
