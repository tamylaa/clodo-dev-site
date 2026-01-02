# Blog Template System

A modular, reusable component system for creating SEO-optimized blog posts with authority signals.

## Directory Structure

```
templates/blog/
├── author-tamyla.html        # Reusable author bio component
├── schema-author-tamyla.html # JSON-LD Person schema for head
├── cta-newsletter-mid.html   # Mid-article newsletter CTA
├── cta-newsletter-footer.html# Footer newsletter with benefits
├── cta-try-clodo.html        # Product CTA component
├── testimonials-cloudflare.html # Testimonials with Review schema
├── share-buttons.html        # Social sharing buttons
├── reading-progress.html     # Progress bar + back-to-top
└── README.md                 # This documentation

data/
├── blog-data.json            # Central data store (authors, testimonials, CTAs)
├── blog-post.schema.json     # JSON Schema for validating posts
└── posts/
    └── cloudflare-infrastructure-myth.json # Example post data
```

## Quick Start

### Using SSI-style Includes (Current Method)

Add includes directly in your HTML files:

```html
<!-- In <head> -->
<!--#include file="../templates/blog/schema-author-tamyla.html" -->

<!-- In article body -->
<!--#include file="../templates/blog/author-tamyla.html" -->

<!-- Before closing </article> -->
<!--#include file="../templates/blog/cta-newsletter-footer.html" -->
```

### Using JSON + Generator (Recommended)

1. **Create a post JSON file** in `data/posts/`:

```json
{
  "slug": "your-post-slug",
  "title": "Your Amazing Title",
  "description": "150-160 char meta description",
  "author": "tamyla",
  "publishedDate": "2024-12-15",
  "category": "cloudflare-workers",
  "readingTime": 8,
  "tags": ["cloudflare", "performance"],
  "content": {
    "sections": [
      { "id": "intro", "title": "Introduction" },
      { "id": "problem", "title": "The Problem" },
      { "id": "solution", "title": "Our Solution" }
    ],
    "opinionStatement": {
      "emoji": "🔥",
      "label": "Hot Take:",
      "text": "Your bold, expert opinion here.",
      "style": "strong"
    }
  }
}
```

2. **Generate HTML**:

```bash
node build/generate-blog-post.js data/posts/your-post-slug.json
```

## Component Reference

### Author Bio (`author-tamyla.html`)

A full author attribution section with:
- Avatar/gravatar
- Name and credentials
- Social links (GitHub, LinkedIn)
- Article metadata

**Usage:**
```html
<aside class="blog-post__author">
    <!--#include file="../templates/blog/author-tamyla.html" -->
</aside>
```

**Dependencies:**
- CSS: `.blog-post__author`, `.blog-post__author-credentials`, `.author-social`

---

### Author Schema (`schema-author-tamyla.html`)

JSON-LD Person schema for SEO. Place in `<head>`.

**Usage:**
```html
<head>
    <!--#include file="../templates/blog/schema-author-tamyla.html" -->
</head>
```

**Generates:**
```json
{
  "@type": "Person",
  "name": "Tamyla",
  "sameAs": ["github.com/...", "linkedin.com/..."]
}
```

---

### Newsletter CTA - Mid-Article (`cta-newsletter-mid.html`)

Compact newsletter signup for mid-article placement.

**Usage:**
```html
<!-- After 2-3 sections -->
<!--#include file="../templates/blog/cta-newsletter-mid.html" -->
```

**Features:**
- GDPR-compliant with checkbox
- Minimal friction design
- Links to privacy policy

---

### Newsletter CTA - Footer (`cta-newsletter-footer.html`)

Enhanced footer CTA with benefit bullets.

**Usage:**
```html
<!-- Before </article> -->
<!--#include file="../templates/blog/cta-newsletter-footer.html" -->
```

**Features:**
- Benefit list (frequency promise, content preview)
- Two-tone design
- Animated hover states

---

### Product CTA (`cta-try-clodo.html`)

CTA for Clodo Framework sign-ups.

**Usage:**
```html
<!--#include file="../templates/blog/cta-try-clodo.html" -->
```

---

### Testimonials (`testimonials-cloudflare.html`)

Three testimonials with Review schema markup.

**Usage:**
```html
<section id="testimonials">
    <!--#include file="../templates/blog/testimonials-cloudflare.html" -->
</section>
```

**Features:**
- Review schema for rich snippets
- Star ratings
- Company/role attribution
- Link to leave review

---

### Share Buttons (`share-buttons.html`)

Social sharing with Twitter, LinkedIn, copy link.

**Usage:**
```html
<!--#include file="../templates/blog/share-buttons.html" -->
```

**Features:**
- Auto-populates current URL and title
- Copy-to-clipboard with feedback
- Accessible button labels

---

### Reading Progress (`reading-progress.html`)

Visual progress bar + back-to-top button.

**Usage:**
```html
<!-- At very top of <body> -->
<!--#include file="../templates/blog/reading-progress.html" -->
```

**Features:**
- Fixed progress bar at top
- Smooth scroll back-to-top
- Appears after 20% scroll

## Data Schema

### Blog Post Schema (`blog-post.schema.json`)

All posts should validate against this schema. Key fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `slug` | string | ✅ | URL-safe identifier |
| `title` | string | ✅ | Post title (50-65 chars ideal) |
| `description` | string | ✅ | Meta description (150-160 chars) |
| `author` | string | ✅ | Author ID from blog-data.json |
| `publishedDate` | string | ✅ | ISO date format |
| `category` | enum | ✅ | cloudflare-workers, developer-experience, etc. |
| `readingTime` | integer | ✅ | Minutes to read |
| `tags` | array | ✅ | At least 2 tags |

### Content Object

```json
{
  "content": {
    "introduction": "Opening paragraph (optional)",
    "sections": [
      { "id": "section-id", "title": "Section Title" }
    ],
    "opinionStatement": {
      "emoji": "🔥",
      "label": "Hot Take:",
      "text": "Bold opinion that only an expert would state",
      "style": "strong"
    },
    "ourResults": {
      "enabled": true,
      "metrics": [
        {
          "value": "100%",
          "label": "Uptime",
          "context": "Over 12 months"
        }
      ],
      "methodology": {
        "testEnvironment": "Production traffic",
        "timePeriod": "Jan-Dec 2024",
        "tools": "Cloudflare Analytics",
        "sampleSize": "100,000 requests"
      }
    }
  }
}
```

## Authority Signals

Each post should include these E-E-A-T signals:

### 1. Named Author with Credentials
```html
<span class="blog-post__author-credentials">
    <span class="credential">7+ years on Cloudflare Workers</span>
</span>
```

### 2. Bold Opinion Statement
```html
<div class="opinion-callout opinion-callout--strong">
    <p><strong>🔥 Hot Take:</strong> Your expert opinion...</p>
</div>
```

### 3. Original Data ("Our Results")
```html
<section class="our-results">
    <div class="results-grid">
        <div class="result-card">
            <div class="result-metric">99.99%</div>
            <div class="result-label">Uptime</div>
        </div>
    </div>
</section>
```

### 4. Testimonials with Schema
```html
<div class="testimonial" itemscope itemtype="https://schema.org/Review">
    <blockquote itemprop="reviewBody">...</blockquote>
</div>
```

### 5. Article Changelog
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

## CSS Dependencies

All component styles are in `/public/css/pages/blog.css`. Key classes:

- `.blog-post__author-credentials` - Author credential styling
- `.opinion-callout` - Opinion highlight box
- `.our-results` - Results section container
- `.results-grid` - Metrics grid layout
- `.testimonials-section` - Testimonials container
- `.article-updates` - Changelog section
- `.share-buttons` - Social share styling
- `.reading-progress` - Progress bar

## Validation

Validate your post JSON before generating:

```bash
# Using ajv-cli
npx ajv validate -s data/blog-post.schema.json -d data/posts/your-post.json
```

## Best Practices

1. **Always include an opinion statement** - This signals human expertise
2. **Add testimonials** - Real social proof with Review schema
3. **Include original data** - "Our Results" section with methodology
4. **Keep changelog updated** - Shows content evolution
5. **Use named author** - Never "Team" or anonymous
6. **Link to sources** - Cited references build credibility

## Future Enhancements

- [ ] Build script that injects includes at build time
- [ ] Automatic schema validation in CI/CD
- [ ] RSS feed generation from JSON
- [ ] Related posts auto-linking
- [ ] Reading time auto-calculation

---

*Last updated: December 2024*
