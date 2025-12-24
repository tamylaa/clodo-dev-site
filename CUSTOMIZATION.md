# Customizing Your Site

This guide explains how to customize the web starter template for your own project.

## Quick Start

Run the setup wizard to configure your site:

```bash
node scripts/setup.js
```

This will interactively configure:
- Site name, tagline, and description
- Branding colors
- Social media links
- Contact information
- Cloudflare Pages settings

## Configuration Files

### `config/site.config.js`

The main configuration file. Edit this to customize:

```javascript
const siteConfig = {
  site: {
    name: 'Your Site Name',      // Used in titles, schema, etc.
    shortName: 'YourSite',       // Used in logo text
    tagline: 'Your tagline',     // Used in hero section
    description: 'SEO description',
    url: 'https://yoursite.com', // Production URL
    copyright: {
      holder: 'Your Company',
      year: 2025
    }
  },
  branding: {
    colors: {
      primary: '#1d4ed8',        // Main brand color
      secondary: '#6366f1'       // Accent color
    }
  },
  social: {
    github: { url: 'https://github.com/you/repo' },
    twitter: { url: 'https://twitter.com/you' }
  },
  contact: {
    email: {
      general: 'contact@yoursite.com'
    }
  }
};
```

### `config/navigation.json`

Customize the header and footer navigation:

```json
{
  "header": {
    "mainNav": [
      { "label": "Home", "href": "/" },
      { "label": "About", "href": "/about" },
      { "label": "Blog", "href": "/blog" }
    ]
  },
  "footer": {
    "sections": [...]
  }
}
```

### `config/pages.config.json`

Configure CSS bundles for different page types:

```json
{
  "pageBundles": {
    "index": {
      "files": ["css/pages/index/hero.css", "..."]
    },
    "blog": {
      "files": ["css/pages/blog/index.css", "..."]
    }
  }
}
```

### `.env`

Environment variables for API keys and secrets:

```bash
# Newsletter (Brevo)
BREVO_API_KEY=your-api-key
BREVO_LIST_ID=your-list-id

# Analytics
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Search verification
GOOGLE_SITE_VERIFICATION=your-code
```

## Template Variables

Templates use `{{variable}}` syntax that gets replaced during build:

| Variable | Source | Example |
|----------|--------|---------|
| `{{siteName}}` | `site.name` | "Your Site Name" |
| `{{siteShortName}}` | `site.shortName` | "YourSite" |
| `{{siteUrl}}` | `site.url` | "https://yoursite.com" |
| `{{siteDescription}}` | `site.description` | "Your SEO description" |
| `{{branding.colors.primary}}` | `branding.colors.primary` | "#1d4ed8" |
| `{{social.github.url}}` | `social.github.url` | "https://github.com/..." |
| `{{contact.email.general}}` | `contact.email.general` | "contact@..." |
| `{{copyright.year}}` | `site.copyright.year` | "2025" |
| `{{copyright.holder}}` | `site.copyright.holder` | "Your Company" |

## Customizing Templates

### Header (`templates/header.html`, `templates/nav-main.html`)

The header includes:
- Logo with configurable colors
- Site name from config
- GitHub link from config

### Footer (`templates/footer.html`)

The footer includes:
- Social media links
- Copyright with configurable year/holder
- Newsletter signup form

### Schema.org (`templates/partials/schema-base.html`)

Auto-injected Organization and WebSite schema using config values.

## Adding New Pages

1. Create HTML file in `public/`:
   ```html
   <!DOCTYPE html>
   <html lang="en">
   <head>
       <meta charset="UTF-8">
       <title>Page Title - {{siteName}}</title>
       <link rel="stylesheet" href="styles.css">
   </head>
   <body>
       <header><!--#include file="../templates/nav-main.html" --></header>
       
       <main>
           <!-- Your content -->
       </main>
       
       <!--#include file="../templates/footer.html" -->
   </body>
   </html>
   ```

2. The build process will:
   - Replace SSI includes with template content
   - Process `{{variable}}` placeholders
   - Inject critical CSS
   - Add base schema.org (if not already present)

## Branding Checklist

When setting up a new site, update these assets:

- [ ] `public/logo.svg` - Your logo
- [ ] `public/favicon.ico` - Favicon
- [ ] `public/apple-touch-icon.png` - Apple touch icon (180x180)
- [ ] `public/og-image.png` - Open Graph image (1200x630)
- [ ] `config/site.config.js` - All metadata
- [ ] `.env` - API keys

## Build Commands

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Deploy to Cloudflare Pages
npm run deploy
```

## Project Structure

```
├── config/
│   ├── site.config.js      # Main configuration
│   ├── navigation.json     # Navigation structure
│   └── pages.config.json   # CSS bundle mappings
├── public/
│   ├── index.html          # Homepage
│   ├── about.html          # About page
│   ├── blog/               # Blog pages
│   └── css/                # Stylesheets
├── templates/
│   ├── header.html         # Header template
│   ├── nav-main.html       # Navigation template
│   ├── footer.html         # Footer template
│   └── partials/           # Reusable partials
├── build/
│   ├── build.js            # Main build script
│   └── config-loader.js    # Config loading utilities
├── scripts/
│   └── setup.js            # Setup wizard
└── .env.example            # Environment template
```

## Content-Driven Pages

The site supports fully configurable content via JSON files. **Edit the JSON, rebuild, done!**

### Content Files

```
content/
├── pages/
│   ├── index.json      # Landing page sections
│   ├── pricing.json    # Pricing plans & tiers
│   ├── faq.json        # FAQ categories & items
│   └── about.json      # About page content
└── blog/
    ├── config.json     # Blog settings, categories, authors
    └── posts.json      # Blog post metadata
```

### Landing Page (`content/pages/index.json`)

Configure hero, features, benefits, testimonials, and CTA:

```json
{
  "sections": {
    "hero": {
      "title": "Your Amazing Product",
      "subtitle": "The tagline that sells",
      "cta": {
        "primary": { "text": "Get Started", "href": "/signup" },
        "secondary": { "text": "Learn More", "href": "#features" }
      }
    },
    "features": {
      "sectionTitle": "Why Choose Us",
      "items": [
        { "title": "Feature 1", "description": "Description", "icon": "🚀" }
      ]
    }
  }
}
```

### Pricing Page (`content/pages/pricing.json`)

```json
{
  "plans": [
    {
      "name": "Free",
      "price": { "monthly": 0 },
      "features": [
        { "text": "5 projects", "included": true },
        { "text": "Priority support", "included": false }
      ],
      "cta": { "text": "Start Free", "href": "/signup" }
    }
  ]
}
```

### FAQ Page (`content/pages/faq.json`)

```json
{
  "categories": [
    {
      "name": "General",
      "items": [
        { "question": "What is this?", "answer": "..." }
      ]
    }
  ]
}
```

### Blog System (`content/blog/`)

**config.json** - Global blog settings:
```json
{
  "settings": { "postsPerPage": 10 },
  "categories": [
    { "name": "Tutorials", "slug": "tutorials" }
  ],
  "authors": [
    { "id": "john", "name": "John Doe", "bio": "..." }
  ]
}
```

**posts.json** - Blog post metadata:
```json
{
  "posts": [
    {
      "slug": "getting-started",
      "title": "Getting Started Guide",
      "excerpt": "Learn how to...",
      "category": "tutorials",
      "authorId": "john",
      "publishedAt": "2025-01-15"
    }
  ]
}
```

### Supported Sections

The page generator supports these section types:

| Section | Marker | Description |
|---------|--------|-------------|
| `hero` | `<!-- CONTENT:hero -->` | Hero with title, subtitle, CTA |
| `features` | `<!-- CONTENT:features -->` | Feature cards grid |
| `benefits` | `<!-- CONTENT:benefits -->` | Benefits cards grid |
| `pricing` | `<!-- CONTENT:pricing -->` | Pricing cards |
| `faq` | `<!-- CONTENT:faq -->` | FAQ accordion |
| `testimonials` | `<!-- CONTENT:testimonials -->` | Testimonial cards |
| `comparison` | `<!-- CONTENT:comparison -->` | Comparison table |
| `cta` | `<!-- CONTENT:cta -->` | Call-to-action banner |

Use `<!-- CONTENT:sections -->` to render ALL sections from the JSON in order.

### Running the Page Generator

```bash
# Generate all content-driven pages
node build/page-generator.js

# Or run as part of the full build
npm run build
```

## Spin Up a New Site Checklist

1. **Clone the starter**: `git clone <repo> my-new-site`
2. **Run setup wizard**: `node scripts/setup.js`
3. **Edit content files**: Modify `content/pages/*.json`
4. **Update assets**: Replace logo, favicon, OG image
5. **Build & deploy**: `npm run build && npm run deploy`

That's it! Your new site is live with zero code changes. 🚀

## Need Help?

- Check the build output for errors
- Verify config syntax in `site.config.js`
- Ensure all required environment variables are set
