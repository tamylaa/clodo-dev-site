# Structured Data Strategy for AI Search Optimization

## 🎯 Goal
Maximize visibility in AI search engines (ChatGPT, Claude, Perplexity, Google AI Overviews) and traditional search results.

## Current Status
✅ **Implemented:** SoftwareApplication, Organization, FAQPage, TechArticle, WebSite schemas
⚠️ **Gaps:** BreadcrumbList, detailed Article schema for blog posts, HowTo schemas

---

## 1. BreadcrumbList Schema (All Pages)

**Purpose:** Helps search engines understand site structure; improves navigation clarity

**Where:** Add to `<head>` on every page except homepage

**Example for `/docs.html`:**
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://clodo.dev"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Documentation",
      "item": "https://clodo.dev/docs"
    }
  ]
}
```

**For nested pages (e.g., `/blog/post-name.html`):**
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://clodo.dev"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Blog",
      "item": "https://clodo.dev/blog"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Article Title",
      "item": "https://clodo.dev/blog/article-slug"
    }
  ]
}
```

---

## 2. Article Schema for Blog Posts

**Purpose:** Helps AI search engines extract blog content with metadata

**Where:** Blog post pages (e.g., `blog/stackblitz-integration-journey.html`)

**Template:**
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Building an Instant Try Now Experience with StackBlitz",
  "description": "How we transformed developer onboarding from 30 minutes to 60 seconds with live code sandboxes.",
  "image": "https://clodo.dev/blog-images/stackblitz-hero.png",
  "datePublished": "2024-11-15",
  "dateModified": "2024-12-10",
  "author": {
    "@type": "Person",
    "name": "Author Name",
    "url": "https://clodo.dev/author/name"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Clodo Framework",
    "logo": {
      "@type": "ImageObject",
      "url": "https://clodo.dev/logo.png"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://clodo.dev/blog/stackblitz-integration-journey"
  },
  "articleSection": "Engineering",
  "keywords": ["StackBlitz", "developer experience", "onboarding", "live coding"],
  "articleBody": "Full article content here...",
  "wordCount": 1250,
  "timeToRead": "5 minutes",
  "isAccessibleForFree": true
}
```

---

## 3. HowTo Schema for Tutorial Pages

**Purpose:** Enables rich snippets in search results and AI extraction

**Where:** Tutorial/guide pages (e.g., `clodo-framework-guide.html`)

**Template:**
```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Build Enterprise SaaS with Clodo Framework",
  "description": "Step-by-step guide to creating a multi-tenant SaaS application using Clodo",
  "image": "https://clodo.dev/tutorial-hero.png",
  "estimatedCost": {
    "@type": "PriceSpecification",
    "priceCurrency": "USD",
    "price": "0"
  },
  "totalTime": "PT30M",
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "Install Clodo Framework",
      "text": "Run npm install @clodo/framework",
      "image": "https://clodo.dev/step1.png",
      "url": "https://clodo.dev/clodo-framework-guide#step-1"
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "Create Project Structure",
      "text": "Initialize project with template",
      "image": "https://clodo.dev/step2.png",
      "url": "https://clodo.dev/clodo-framework-guide#step-2"
    },
    {
      "@type": "HowToStep",
      "position": 3,
      "name": "Deploy to Cloudflare",
      "text": "Use Wrangler to deploy workers",
      "image": "https://clodo.dev/step3.png",
      "url": "https://clodo.dev/clodo-framework-guide#step-3"
    }
  ],
  "tool": [
    {
      "@type": "HowToTool",
      "name": "Node.js",
      "requiredLink": "https://nodejs.org"
    },
    {
      "@type": "HowToTool",
      "name": "Cloudflare Workers",
      "requiredLink": "https://workers.cloudflare.com"
    }
  ],
  "supply": [
    {
      "@type": "HowToSupply",
      "name": "Terminal/Command Line"
    },
    {
      "@type": "HowToSupply",
      "name": "Text Editor"
    }
  ]
}
```

---

## 4. LocalBusiness / Service Schema (Optional)

**Purpose:** If offering enterprise support/consulting

**Where:** Contact/about page or sitewide

```json
{
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "Clodo Framework Enterprise Support",
  "description": "Enterprise-grade support and consulting for Cloudflare Workers",
  "url": "https://clodo.dev",
  "telephone": "+1-555-0123",
  "email": "support@clodo.dev",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Tech Street",
    "addressLocality": "San Francisco",
    "addressRegion": "CA",
    "postalCode": "94102",
    "addressCountry": "US"
  },
  "priceRange": "$$",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "5.0",
    "ratingCount": "50"
  }
}
```

---

## 5. SearchAction Enhancement

**Current:** Basic search at `/?q=`  
**Enhanced:**

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Clodo Framework",
  "url": "https://clodo.dev",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://clodo.dev/search?q={search_term_string}",
      "actionPlatform": [
        "http://schema.org/DesktopWebPlatform",
        "http://schema.org/MobileWebPlatform"
      ]
    },
    "query-input": "required name=search_term_string"
  }
}
```

---

## 6. Rating/Review Schema

**Purpose:** Build social proof for AI searches

**Example (for homepage or dedicated reviews page):**

```json
{
  "@context": "https://schema.org",
  "@type": "AggregateRating",
  "itemReviewed": {
    "@type": "SoftwareApplication",
    "name": "Clodo Framework"
  },
  "ratingValue": "4.9",
  "bestRating": "5",
  "worstRating": "1",
  "ratingCount": "127",
  "reviewCount": "43",
  "reviews": [
    {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "Enterprise Developer"
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5",
        "worstRating": "1"
      },
      "reviewBody": "Clodo Framework reduced our deployment time by 70%...",
      "datePublished": "2024-12-01"
    }
  ]
}
```

---

## 7. FAQ Schema Enhancement

**Current:** Basic FAQPage  
**Enhanced with richer answers:**

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How much can Clodo reduce development costs?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Up to 60% for $50K-200K projects through automation and reusable components.",
        "source": {
          "@type": "WebPage",
          "@id": "https://clodo.dev/case-studies"
        }
      }
    }
  ]
}
```

---

## 🔍 Validation & Testing

### Google Rich Results Test
1. Go to: https://search.google.com/test/rich-results
2. Enter: `https://clodo.dev`
3. Check for:
   - ✅ SoftwareApplication detected
   - ✅ Organization detected
   - ✅ FAQPage detected
   - ⚠️ Any warnings or errors

### Schema.org Validator
- https://validator.schema.org/
- Paste HTML or JSON-LD
- Verify all types are recognized

### AI Search Validation
- **Bing Webmaster Tools:** https://www.bing.com/webmaster
- **Yandex Validator:** https://webmaster.yandex.com
- **Submit sitemap:** All search engines

---

## 📈 AI Search Optimization Tips

### 1. **Rich Snippets Priority**
- ✅ FAQPage (best for ChatGPT context)
- ✅ TechArticle (for blog posts)
- ✅ HowTo (for tutorials)
- ✅ SoftwareApplication (for product pages)

### 2. **Content Structure for AI**
```html
<!-- Use semantic HTML -->
<article>
  <h1>Main Title</h1>
  <section>
    <h2>Section Title</h2>
    <p>Content...</p>
  </section>
  <section>
    <h2>Another Section</h2>
    <p>More content...</p>
  </section>
</article>
```

### 3. **Key Schema Properties for AI Indexing**
- `description` - Summary for LLMs
- `articleBody` / `text` - Full content
- `keywords` - Topic extraction
- `author` / `publisher` - Trust signals
- `datePublished` / `dateModified` - Freshness
- `mainEntityOfPage` - Primary subject

### 4. **Optimizing for Specific AI Engines**

**ChatGPT/Claude:**
- Focus on: FAQPage, detailed descriptions, structured step-by-step guides
- Use clear section headings
- Include author/publisher info

**Perplexity:**
- Focus on: up-to-date content with recent dates
- Include source citations via `source` property
- Breadcrumb schema for context

**Google AI Overviews:**
- Focus on: E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)
- Include author credentials
- Add aggregate ratings
- Link to authoritative sources

---

## 📋 Implementation Checklist

- [ ] Add BreadcrumbList to all non-homepage pages
- [ ] Enhance blog posts with BlogPosting schema
- [ ] Add HowTo schema to tutorial pages
- [ ] Enhance FAQ schema with source citations
- [ ] Add Article schema to each blog post header
- [ ] Validate with Google Rich Results Test
- [ ] Test with Schema.org Validator
- [ ] Submit sitemap to Google Search Console
- [ ] Monitor Search Console for schema errors
- [ ] Track AI search visibility (use tools like Semrush, Ahrefs)

---

## 🚀 Next Steps

1. **Immediate (This Week):**
   - Add BreadcrumbList to all pages
   - Test homepage with Google validator

2. **Short-term (Next Week):**
   - Add Article schema to blog posts
   - Add HowTo to guide pages

3. **Long-term:**
   - Monitor AI search rankings
   - Collect user reviews for rating schema
   - Track which schema types drive the most traffic

---

## 📚 Resources

- [Schema.org Types](https://schema.org)
- [Google Structured Data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [JSON-LD Best Practices](https://www.w3.org/TR/json-ld/)
- [OpenAI on Web Search](https://openai.com/blog/web-search)
- [Claude on Information Retrieval](https://claude.ai/docs/api)
