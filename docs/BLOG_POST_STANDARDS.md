# 📝 Clodo Framework Blog Post Standards

This document defines the required elements for **high-achiever blog posts** that maximize SEO, AI discoverability, and lead generation.

> **🆕 Template System:** See `/templates/blog/README.md` for the modular component system and JSON schema.

---

## 🏆 Authority Signals (E-E-A-T)

Every post MUST include these authority signals to compete with AI-generated content:

### 1. **Named Author with Credentials** ✅ Required
```html
<span class="blog-post__author-name" itemprop="name">Tamyla</span>
<span class="blog-post__author-credentials">
    <span class="credential">7+ years on Cloudflare Workers</span>
</span>
```
- Never use "Clodo Team" or anonymous authorship
- Include verifiable social links (GitHub, LinkedIn)
- Use Person schema with `sameAs` property

### 2. **Bold Opinion Statement** ✅ Required
```html
<div class="opinion-callout opinion-callout--strong">
    <p><strong>🔥 Hot Take:</strong> Your expert opinion that only someone 
    with real experience would state...</p>
</div>
```
- Take a position that's defensible but bold
- Reference specific experience or data
- Use `--strong` variant for main opinion

### 3. **Original Data ("Our Results")** ⭐ Recommended
```html
<section class="our-results">
    <h2>📊 Our Results: What We've Measured Firsthand</h2>
    <div class="results-grid">
        <div class="result-card">
            <div class="result-metric">99.99%</div>
            <div class="result-label">Uptime</div>
            <div class="result-context">Over 12 months</div>
        </div>
    </div>
</section>
```
- Include methodology disclosure
- Use real data from your experience
- Differentiate from marketing claims

### 4. **Testimonials with Schema** ⭐ Recommended
```html
<div class="testimonial" itemscope itemtype="https://schema.org/Review">
    <blockquote itemprop="reviewBody">Real quote from real user...</blockquote>
    <cite itemprop="author">— Name, Role at Company</cite>
</div>
```
- Use Review schema for rich snippets
- Include star ratings where applicable

### 5. **Article Changelog** ⭐ Recommended
```html
<section class="article-updates">
    <dl class="changelog">
        <div class="changelog-entry">
            <dt><time datetime="2024-12-01">Dec 1, 2024</time></dt>
            <dd>Added performance benchmarks</dd>
        </div>
    </dl>
</section>
```
- Shows content is maintained
- Builds trust through transparency

---

## ✅ Required Checklist

Every blog post MUST have:

### 1. **Security Headers**
```html
<meta http-equiv="X-Frame-Options" content="DENY">
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
```

### 2. **SEO Meta Tags**
- Title tag (55-60 chars)
- Meta description (150-160 chars)
- Canonical URL
- Keywords
- Robots: `index, follow, max-snippet:-1, max-image-preview:large`

### 3. **Open Graph Tags**
- og:type = "article"
- og:title, og:description, og:url, og:image
- og:locale = "en_US"
- article:published_time, article:author, article:section

### 4. **Twitter Card Tags**
- twitter:card = "summary_large_image"
- twitter:site, twitter:creator = "@clodoframework"
- twitter:title, twitter:description, twitter:image

### 5. **Schema Markup (Structured Data)**

| Schema Type | When to Use | Required |
|-------------|-------------|----------|
| **Article** | Always | ✅ Required |
| **BreadcrumbList** | Always | ✅ Required |
| **FAQPage** | When article has Q&A format | ⭐ Recommended |
| **HowTo** | For tutorials/guides | ⭐ Recommended |

### 6. **UI Components**
- [ ] Breadcrumb navigation
- [ ] Reading progress indicator (fixed top)
- [ ] Back-to-top button (fixed bottom-right)
- [ ] Table of Contents with anchor links
- [ ] Last Updated timestamp

### 7. **Lead Generation CTAs**
- [ ] Mid-article newsletter signup (after ~40% content)
- [ ] Footer newsletter with GDPR consent checkbox
- [ ] Try Now / Docs CTA buttons

### 8. **Internal Linking** (minimum 10 links)
Target destinations:
- `/index.html` - Homepage
- `/docs.html` - Documentation
- `/examples.html` - Examples
- `/blog/` - Blog index
- `/blog/other-posts.html` - Related posts
- `/docs/getting-started/` - Getting started guide
- `/docs/api-reference/` - API docs
- `/docs/best-practices/` - Best practices

### 9. **External Links** (with nofollow)
```html
<a href="https://example.com" target="_blank" rel="nofollow noopener">External Site</a>
```
- Always use `rel="nofollow noopener"` for external links
- Keep external links minimal (only authoritative sources)
- Add to Sources section with superscript references

### 10. **Related Articles Section**
Minimum 3 related articles with:
- Thumbnail/icon
- Title
- Short description
- Read time
- Link to article

---

## 📊 Post Structure Template

```
1. Header
   ├── Breadcrumbs (Home / Blog / Article Title)
   ├── Meta (date, reading time, category)
   ├── H1 Title
   ├── Subtitle
   └── Author info

2. Table of Contents
   └── Numbered list with anchor links

3. Content Body
   ├── Introduction
   ├── Key Points (H2 sections)
   │   ├── Supporting content
   │   ├── Code examples
   │   └── Highlight boxes
   ├── Mid-article Newsletter CTA
   ├── Additional sections
   └── Conclusion

4. Sources Section (if external citations)
   └── Numbered references with nofollow links

5. Footer
   ├── Tags
   ├── Primary CTA (Try Now / Docs)
   └── Share buttons (Twitter, LinkedIn, Copy)

6. Related Articles

7. Footer Newsletter CTA
```

---

## 🎨 CSS Classes Reference

### Content Highlight Boxes
```html
<aside class="highlight-box">
    <h4>💡 Key Insight</h4>
    <p>Important callout text...</p>
</aside>

<aside class="highlight-box highlight-box--warning">
    <h4>⚠️ Warning</h4>
    <p>Caution message...</p>
</aside>

<aside class="highlight-box highlight-box--success">
    <h4>✅ Success</h4>
    <p>Positive outcome...</p>
</aside>
```

### Statistics Grid
```html
<div class="stats-grid">
    <div class="stat-card">
        <span class="stat-value">99.9%</span>
        <span class="stat-label">Uptime</span>
    </div>
</div>
```

### Code Comparison
```html
<div class="code-comparison">
    <div class="code-block code-block--before">
        <h4>❌ Traditional Approach</h4>
        <pre><code>// Old code</code></pre>
    </div>
    <div class="code-block code-block--after">
        <h4>✅ Modern Approach</h4>
        <pre><code>// New code</code></pre>
    </div>
</div>
```

### Newsletter CTA
```html
<div class="blog-cta">
    <h4>📬 Stay Informed</h4>
    <p>Get monthly insights on edge computing...</p>
    <form class="newsletter-form">
        <label for="newsletter-email">Email address</label>
        <input id="newsletter-email" type="email" name="email" placeholder="Enter your email" required>
        <button type="submit" class="btn btn--primary">Subscribe</button>
        <div class="consent">
            <input id="newsletter-consent" type="checkbox" name="consent" required>
            <label for="newsletter-consent">I accept the Privacy Policy</label>
        </div>
    </form>
</div>
```

---

## 🔗 Internal Link Targets

| Page | Path | Use For |
|------|------|---------|
| Homepage | `/index.html` | "Try Now" CTAs |
| Documentation | `/docs.html` | Technical deep-dives |
| Examples | `/examples.html` | Live demos |
| Blog Index | `/blog/` | "More articles" |
| Getting Started | `/docs/getting-started/` | Setup guides |
| API Reference | `/docs/api-reference/` | Code references |
| Best Practices | `/docs/best-practices/` | Recommendations |
| Routing Guide | `/docs/features/routing-system/` | URL handling |
| Orchestration | `/docs/features/orchestration/` | Service calls |
| Performance | `/docs/features/performance-utilities/` | Speed topics |

---

## 📈 SEO Optimization Checklist

### Title Tag
- [ ] 55-60 characters max
- [ ] Primary keyword near beginning
- [ ] Brand at end: `| Clodo Framework Blog`

### Meta Description
- [ ] 150-160 characters
- [ ] Include primary keyword
- [ ] Include call-to-action
- [ ] Unique for each page

### Content
- [ ] H1 contains primary keyword
- [ ] H2s contain secondary keywords
- [ ] Natural keyword density (1-2%)
- [ ] Minimum 1,500 words for pillar content
- [ ] Images with alt text (if any)

### Technical
- [ ] Canonical URL set
- [ ] hreflang tags for international
- [ ] Schema validation passed
- [ ] Mobile-friendly layout
- [ ] Page speed optimized

---

## 🔄 Post Update Process

When updating existing blog posts:

1. Update `dateModified` in Article schema
2. Update "Last verified" date in UI
3. Verify all internal links still work
4. Check external links for 404s
5. Update sitemap lastmod date
6. Add any new relevant internal links

---

## 📁 Modular Template System

### Quick Start with Templates

Use the reusable components from `/templates/blog/`:

```html
<!-- In <head> - Author schema -->
<!--#include file="../templates/blog/schema-author-tamyla.html" -->

<!-- Author bio section -->
<!--#include file="../templates/blog/author-tamyla.html" -->

<!-- Mid-article CTA -->
<!--#include file="../templates/blog/cta-newsletter-mid.html" -->

<!-- Testimonials with Review schema -->
<!--#include file="../templates/blog/testimonials-cloudflare.html" -->

<!-- Footer CTA -->
<!--#include file="../templates/blog/cta-newsletter-footer.html" -->

<!-- Reading progress bar -->
<!--#include file="../templates/blog/reading-progress.html" -->
```

### JSON-First Workflow (Recommended)

1. **Create post JSON** in `data/blog/posts/your-slug.json`:

```json
{
  "slug": "your-post-slug",
  "title": "Your Title Here",
  "author": "tamyla",
  "category": "cloudflare-workers",
  "content": {
    "opinionStatement": {
      "emoji": "🔥",
      "label": "Hot Take:",
      "text": "Your bold opinion"
    }
  }
}
```

2. **Generate HTML**:
```bash
node build/generate-blog-post.js data/posts/your-slug.json
```

See `/templates/blog/README.md` for complete documentation.

---

## 📁 File Naming Convention

```
/public/blog/
├── index.html                           # Blog index
├── topic-keyword-phrase.html            # Article URL-safe slug
├── cloudflare-infrastructure-myth.html  # Example
├── stackblitz-integration-journey.html  # Example
└── ...
```

Rules:
- Lowercase
- Hyphens between words
- No dates in URL (evergreen)
- 3-5 words max
- Include primary keyword

---

## ⚡ Quick Reference

### New Post Workflow (Manual)
1. Copy `/templates/blog-post-template.html`
2. Replace all `{{PLACEHOLDERS}}`
3. Add Article + Breadcrumb schema (required)
4. Add FAQ/HowTo schema if applicable
5. Add 10+ internal links
6. Add external citations with nofollow
7. Create Sources section
8. Update `/public/blog/index.html`
9. Update `/public/sitemap.xml`
10. Test with Google Rich Results Test

### New Post Workflow (JSON-First) ⭐ Recommended
1. Create JSON file in `/data/posts/your-slug.json`
2. Validate against `/data/blog-post.schema.json`
3. Run `node build/generate-blog-post.js data/posts/your-slug.json`
4. Review generated HTML
5. Update blog index and sitemap
6. Test with Rich Results Test

### Authority Signals Checklist ✅
- [ ] Named author with credentials (not "Team")
- [ ] Person schema with GitHub/LinkedIn links
- [ ] Bold opinion statement unique to this post
- [ ] "Our Results" section with methodology (if data available)
- [ ] Testimonials with Review schema (if testimonials exist)
- [ ] Article changelog section
- [ ] Sources with academic-style citations

### Validation Tools
- Schema: https://validator.schema.org/
- Rich Results: https://search.google.com/test/rich-results
- Mobile: https://search.google.com/test/mobile-friendly
- PageSpeed: https://pagespeed.web.dev/
- JSON Schema: `npx ajv validate -s data/json-schemas/blog-post.schema.json -d data/blog/posts/your-post.json`

---

*Last updated: December 2024*
