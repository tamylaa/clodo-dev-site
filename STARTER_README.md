# Clodo Web Starter

A **content-driven, fully configurable** website starter template. Spin up new sites by editing JSON files — zero code changes required.

## 🚀 Quick Start

```bash
# 1. Clone this template
git clone https://github.com/your-org/clodo-web-starter my-new-site
cd my-new-site

# 2. Run the setup wizard
npm run setup

# 3. Edit your content (see content/ directory)

# 4. Build and deploy
npm run build
npm run deploy
```

## 📁 Project Structure

```
├── config/
│   ├── site.config.js      # Site metadata, branding, social links
│   ├── navigation.json     # Header & footer navigation
│   └── pages.config.json   # CSS bundles per page
├── content/
│   ├── pages/
│   │   ├── index.json      # Landing page content
│   │   ├── pricing.json    # Pricing plans
│   │   ├── faq.json        # FAQ categories
│   │   └── about.json      # About page
│   └── blog/
│       ├── config.json     # Blog settings & authors
│       └── posts.json      # Blog post metadata
├── templates/              # HTML templates with {{variables}}
├── public/                 # Static assets
└── build/                  # Build system
```

## ✏️ Customization

### 1. Site Configuration (`config/site.config.js`)

```javascript
const siteConfig = {
  site: {
    name: 'Your Brand',
    tagline: 'Your powerful tagline',
    url: 'https://yourdomain.com'
  },
  branding: {
    colors: { primary: '#1d4ed8' }
  },
  social: {
    github: { url: 'https://github.com/you' }
  }
};
```

### 2. Page Content (`content/pages/*.json`)

**Landing Page** (`index.json`):
```json
{
  "sections": {
    "hero": {
      "title": "Build Amazing Products",
      "subtitle": "The platform that scales with you",
      "cta": { "primary": { "text": "Get Started", "href": "/signup" } }
    },
    "features": {
      "sectionTitle": "Why Choose Us",
      "items": [
        { "title": "Fast", "description": "Lightning speed", "icon": "⚡" }
      ]
    }
  }
}
```

**Pricing** (`pricing.json`):
```json
{
  "plans": [
    { "name": "Free", "price": { "monthly": 0 }, "cta": { "text": "Start Free" } },
    { "name": "Pro", "price": { "monthly": 29 }, "highlighted": true }
  ]
}
```

### 3. Blog (`content/blog/`)

Add posts to `posts.json`:
```json
{
  "posts": [
    {
      "slug": "getting-started",
      "title": "Getting Started Guide",
      "category": "tutorials",
      "publishedAt": "2025-01-15"
    }
  ]
}
```

## 🔧 Commands

| Command | Description |
|---------|-------------|
| `npm run setup` | Interactive setup wizard |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run build:pages` | Generate pages from content |
| `npm run deploy` | Deploy to Cloudflare Pages |

## 🎨 Theming

Update `config/site.config.js`:

```javascript
branding: {
  colors: {
    primary: '#your-color',
    secondary: '#your-accent'
  }
}
```

Templates use `{{branding.colors.primary}}` syntax.

## 📝 Adding New Pages

1. Create `content/pages/newpage.json` with your content
2. Create `templates/pages/newpage.html` with template
3. Run `npm run build`

## 📦 What's Included

- ✅ SEO-optimized with Schema.org markup
- ✅ Responsive design
- ✅ Dark/light theme support
- ✅ Newsletter integration (Brevo)
- ✅ Blog system with categories & authors
- ✅ Cloudflare Pages deployment ready
- ✅ Performance optimized (critical CSS, lazy loading)

## 📄 License

MIT

---

Built with ❤️ for rapid site deployment.
