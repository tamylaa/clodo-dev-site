# Schema System Architecture - Multi-Language Support

```
┌─────────────────────────────────────────────────────────────────┐
│               CLODO FRAMEWORK SCHEMA SYSTEM (i18n)               │
│                     Multi-Language Support                       │
└─────────────────────────────────────────────────────────────────┘

                    BUILD PROCESS FLOW
                    ═══════════════════

1. SOURCE FILES (public/)
   ├── blog/
   │   └── cloudflare-infrastructure-myth.html  [English]
   ├── i18n/
   │   ├── de/
   │   │   └── cloudflare-infrastructure-myth.html  [German]
   │   ├── it/
   │   │   └── cloudflare-infrastructure-myth.html  [Italian]
   │   ├── ar/
   │   │   └── cloudflare-infrastructure-myth.html  [Arabic - RTL]
   │   └── ... (9 locales total)
   └── data/
       └── blog-data.json  [Author information]

                          ⬇ npm run build

2. BUILD SYSTEM (build/build.js)
   ├─ Read HTML file
   ├─ Call: injectSchemasIntoHTML(htmlFilePath, content)
   │          └─ Detect locale from path
   │             └─ i18n/de/... → 'de'
   │             └─ blog/... → 'en' (default)
   │
   └─ Schema Generator fills in schemas with locale data

3. SCHEMA GENERATION PIPELINE
   ┌──────────────────────────────────────────────────┐
   │ schema/build-integration.js                      │
   │ ─────────────────────────────────────────────────│
   │ injectSchemasIntoHTML(filePath, content)         │
   │   1. Detect locale from path                     │
   │   2. Load page configuration                     │
   │   3. Generate schemas with detected locale       │
   │   4. Inject into HTML                            │
   └──────────────────────────────────────────────────┘
              ⬇ Calls locale-aware generator
   
   ┌──────────────────────────────────────────────────┐
   │ schema/schema-generator.js                       │
   │ ─────────────────────────────────────────────────│
   │ generateOrganizationSchema(locale='en')          │
   │   → Reads from defaults-i18n.json               │
   │   → Returns locale-specific Organization        │
   │                                                  │
   │ generateBlogPostSchemas(filename, config, locale)│
   │   → Organization schema (with locale)            │
   │   → TechArticle schema (with locale URLs)       │
   │   → Breadcrumb schema (with locale URLs)        │
   │                                                  │
   │ generateCaseStudySchemas(filename, config, locale)
   │   → Same as above for case studies              │
   └──────────────────────────────────────────────────┘
              ⬇ Uses locale utilities
   
   ┌──────────────────────────────────────────────────┐
   │ schema/locale-utils.js                           │
   │ ─────────────────────────────────────────────────│
   │ detectLocaleFromPath(filePath) → 'de'           │
   │   i18n/de/article.html → 'de'                   │
   │   blog/article.html → 'en'                      │
   │                                                  │
   │ getLocaleConfig('de') → {...}                   │
   │   Returns: { organization, language, locale,    │
   │             region, isRTL }                      │
   │                                                  │
   │ buildLocaleUrl('/blog/article', 'de')           │
   │   → 'https://clodo.dev/i18n/de/blog/article'   │
   │                                                  │
   │ isRTLLocale('ar') → true                        │
   │   For: ar, he, fa                               │
   └──────────────────────────────────────────────────┘
              ⬇ Reads configuration
   
   ┌──────────────────────────────────────────────────┐
   │ CONFIGURATION FILES                              │
   │ ─────────────────────────────────────────────────│
   │                                                  │
   │ defaults-i18n.json (NEW)                        │
   │ ├─ locales:                                      │
   │ │  ├─ en: { organization, language: 'en', ... } │
   │ │  ├─ de: { organization, language: 'de', ... } │
   │ │  ├─ it: { organization, language: 'it', ... } │
   │ │  ├─ ar: { organization, language: 'ar',      │
   │ │  │        isRTL: true, region: 'SA' }        │
   │ │  ├─ he: { ..., isRTL: true, region: 'IL' }   │
   │ │  ├─ fa: { ..., isRTL: true, region: 'IR' }   │
   │ │  ├─ br: { organization, language: 'pt', ... } │
   │ │  ├─ es-419: { ..., language: 'es', ... }     │
   │ │  └─ in: { organization, language: 'en', ... } │
   │ └─ shared: { softwareApplication: {...} }       │
   │                                                  │
   │ page-config.json (EXISTING)                     │
   │ ├─ blogPosts:                                    │
   │ │  └─ cloudflare-infrastructure-myth.html: {     │
   │ │     title, url, author, published, ...        │
   │ │  }                                             │
   │ ├─ caseStudies: {...}                           │
   │ └─ pages: {...}                                 │
   │                                                  │
   │ blog-data.json (EXISTING)                       │
   │ ├─ authors:                                      │
   │ │  └─ tamyla: { name, jobTitle, url, ... }      │
   │ └─ testimonials: {...}                          │
   └──────────────────────────────────────────────────┘

4. SCHEMA INJECTION
   ┌──────────────────────────────────────────────────┐
   │ For: i18n/de/cloudflare-infrastructure-myth.html │
   │ Detected locale: 'de' (German)                   │
   │                                                  │
   │ Generated schemas:                               │
   │ 1. Organization Schema                          │
   │    {                                             │
   │      "@type": "Organization",                   │
   │      "name": "Clodo Framework",                 │
   │      "url": "https://clodo.dev/i18n/de",       │
   │      "inLanguage": "de-DE",                     │
   │      "foundingLocation": {                      │
   │        "address": { "addressCountry": "DE" }    │
   │      },                                          │
   │      "contactPoint": {                          │
   │        "availableLanguage": "de"                │
   │      }                                           │
   │    }                                             │
   │                                                  │
   │ 2. TechArticle Schema                           │
   │    {                                             │
   │      "@type": "TechArticle",                    │
   │      "headline": "...",                         │
   │      "url": "https://clodo.dev/i18n/de/blog/...",
   │      "inLanguage": "de-DE",                     │
   │      "author": { /* from blog-data.json */ },   │
   │      "publisher": { /* using locale config */ } │
   │    }                                             │
   │                                                  │
   │ 3. BreadcrumbList Schema                        │
   │    {                                             │
   │      "@type": "BreadcrumbList",                 │
   │      "itemListElement": [                       │
   │        { "name": "Home",                        │
   │          "item": "https://clodo.dev/i18n/de" }, │
   │        { ... locale URLs ... }                  │
   │      ]                                           │
   │    }                                             │
   │                                                  │
   │ Injected into: </head> tag                      │
   └──────────────────────────────────────────────────┘

5. OUTPUT (dist/)
   └── Built files with generated schemas
       ├── blog/
       │   └── cloudflare-infrastructure-myth.html
       │       └─ Contains: Organization + TechArticle
       │          (English: inLanguage: "en-US")
       │
       └── i18n/de/
           └── cloudflare-infrastructure-myth.html
               └─ Contains: Organization + TechArticle
                  (German: inLanguage: "de-DE")


═══════════════════════════════════════════════════════════════════

                      KEY IMPROVEMENTS

✅ AUTOMATIC LOCALE DETECTION
   - No manual language selection needed
   - Based on file path: i18n/<locale>/<file>
   - Default: English for files not in i18n folder

✅ LOCALE-SPECIFIC URLS
   - English: https://clodo.dev/blog/article
   - German:  https://clodo.dev/i18n/de/blog/article
   - Correct URL structure for each locale

✅ LANGUAGE METADATA
   - inLanguage: "en-US", "de-DE", "it-IT", etc.
   - Helps Google understand language
   - Improves search ranking for locale-specific queries

✅ REGIONAL TARGETING
   - addressCountry: "US", "DE", "IT", "SA", "IL", "IR", "BR", "MX", "IN"
   - contactPoint.availableLanguage: correct language
   - Enables regional SEO

✅ RTL LANGUAGE SUPPORT
   - Arabic (ar), Hebrew (he), Persian (fa) detected
   - Can trigger RTL CSS and layout changes
   - Proper text direction in search results

✅ SINGLE SOURCE OF TRUTH
   - One page-config.json entry works for all locales
   - One blog-data.json for author info
   - One defaults-i18n.json for all org data

✅ ZERO MAINTENANCE
   - Add file to /i18n/<locale>/ folder
   - Build automatically detects locale
   - Schemas generate with correct language/region


═══════════════════════════════════════════════════════════════════

                    SUPPORTED LOCALES (9)

Locale  │ Language         │ Region │ URL Pattern           │ RTL
────────┼──────────────────┼────────┼───────────────────────┼────
en      │ English          │ US     │ /blog/...             │ No
de      │ German           │ DE     │ /i18n/de/blog/...     │ No
it      │ Italian          │ IT     │ /i18n/it/blog/...     │ No
ar      │ Arabic           │ SA     │ /i18n/ar/blog/...     │ Yes
he      │ Hebrew           │ IL     │ /i18n/he/blog/...     │ Yes
fa      │ Persian          │ IR     │ /i18n/fa/blog/...     │ Yes
br      │ Portuguese (BR)  │ BR     │ /i18n/br/blog/...     │ No
es-419  │ Spanish (LATAM)  │ MX     │ /i18n/es-419/blog/... │ No
in      │ English (India)  │ IN     │ /i18n/in/blog/...     │ No


═══════════════════════════════════════════════════════════════════

                    ADDING NEW LANGUAGES

To add a 10th language (e.g., French):

Step 1: Update schema/locale-utils.js
────────────────────────────────────
export const SUPPORTED_LOCALES = {
  'en': 'en-US',
  'de': 'de-DE',
  ...
  'fr': 'fr-FR',  // ADD THIS
};

Step 2: Update schema/defaults-i18n.json
────────────────────────────────────────
{
  "locales": {
    "en": {...},
    "de": {...},
    ...
    "fr": {           // ADD THIS
      "organization": {
        "name": "Clodo Framework",
        "description": "French description...",
        "sameAs": [...]
      },
      "language": "fr",
      "locale": "fr-FR",
      "region": "FR"
    }
  }
}

Step 3: Create folder and add content
─────────────────────────────────────
mkdir -p public/i18n/fr
# Add French pages here

Step 4: Build
─────────────
npm run build

✅ Done! Schemas will auto-generate with French metadata


═══════════════════════════════════════════════════════════════════
```

## Summary

The schema system is now **fully internationalized**:
- ✅ 9 locales supported with automatic detection
- ✅ Locale-specific Organization + content schemas
- ✅ Correct URLs with `/i18n/<locale>` prefixes
- ✅ Language + region metadata for SEO
- ✅ RTL language support built-in
- ✅ Scalable architecture for unlimited locales
- ✅ Zero maintenance - fully automated

**Status:** Ready for production. No additional configuration needed!
