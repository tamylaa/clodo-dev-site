/**
 * Clodo Framework Constants
 * Centralized constants for the build system and tools
 */

export const PATHS = {
  // Default directories
  PUBLIC_DIR: 'public',
  OUTPUT_DIR: 'dist',
  TEMPLATES_DIR: 'templates',
  CONTENT_DIR: 'content',
  DATA_DIR: 'data',
  ASSETS_DIR: 'assets',

  // Subdirectories
  CSS_DIR: 'css',
  JS_DIR: 'js',
  ICONS_DIR: 'icons',
  DEMO_DIR: 'demo',
  BLOG_DIR: 'blog',
  CASE_STUDIES_DIR: 'case-studies',
  COMMUNITY_DIR: 'community',

  // Special files
  CRITICAL_CSS: 'critical.css',
  STYLES_ORGANIZED: 'styles-organized.css',
  SCRIPT_JS: 'script.js',
  SITEMAP_XML: 'sitemap.xml',
  ROBOTS_TXT: 'robots.txt',
  SITE_WEBMANIFEST: 'site.webmanifest',
  FAVICON_SVG: 'favicon.svg',
  FAVICON_ICO: 'favicon.ico',
  BUILD_INFO: 'build-info.json',
  ASSET_MANIFEST: 'asset-manifest.json',
  LINK_HEALTH_REPORT: 'link-health-report.json',

  // Headers and redirects
  HEADERS_FILE: '_headers',
  REDIRECTS_FILE: '_redirects',
};

export const URLS = {
  // Base URLs
  SITE_URL: 'https://www.clodo.dev',
  SITE_DOMAIN: 'clodo.dev',
  CDN_PATTERN: 'https://www.clodo.dev/cdn-cgi/*',

  // Social and external
  GITHUB_URL: 'https://github.com/tamylaa',
  TWITTER_URL: 'https://twitter.com/clodoframework',
  LINKEDIN_URL: 'https://linkedin.com/company/clodo-framework',

  // Default pages
  HOME_URL: 'https://www.clodo.dev/',
  PRICING_URL: 'https://www.clodo.dev/pricing',
  DOCS_URL: 'https://www.clodo.dev/docs',
  PERFORMANCE_DASHBOARD: 'https://www.clodo.dev/performance-dashboard.html',
};

export const BUILD_CONSTANTS = {
  // File size limits
  MAX_INLINE_SIZE: 50000, // 50KB max for CSS inlining
  MAX_INLINE_SIZE_KB: 50,

  // Hash lengths
  HASH_LENGTH: 8,

  // Performance targets
  LIGHTHOUSE_PERFORMANCE_TARGET: 90,
  LIGHTHOUSE_ACCESSIBILITY_TARGET: 95,

  // Ports
  DEFAULT_DEV_PORT: 8000,
  DEFAULT_HTTP_PORT: 3000,

  // Timeouts
  REQUEST_TIMEOUT: 10000, // 10 seconds
};

export const CSS_BUNDLES = {
  // Critical CSS files (always loaded)
  CRITICAL_FILES: [
    'css/critical-base.css', // Optimized variables & resets
    'css/global/header.css', // Header/navigation (always visible)
    'css/utilities.css'      // Essential utility classes
  ],

  // Common CSS files (shared across pages)
  COMMON_FILES: [
    'css/base.css',        // Full base styles (overrides critical-base)
    'css/layout.css',      // Grid, containers, basic layout
    'css/components/buttons.css',  // Button component
    'css/components-common.css',  // Truly reusable components
    'css/global/footer.css'  // Footer styling
  ],

  // Page-specific bundles
  PAGE_BUNDLES: {
    index: [
      'css/pages/index/hero.css',
      'css/hero-decorations.css',
      'css/pages/index/hero-animations.css'
    ],
    pricing: [
      'css/pages/pricing/index.css'
    ],
    blog: [
      'css/pages/blog/header.css',
      'css/pages/blog/index.css',
      'css/pages/blog/card.css',
      'css/pages/blog/stats.css',
      'css/pages/blog/post.css'
    ],
    subscribe: [
      'css/pages/subscribe/hero.css',
      'css/pages/subscribe/form.css',
      'css/pages/subscribe/preview.css',
      'css/pages/subscribe/testimonials.css'
    ],
    product: [
      'css/pages/product.css'
    ],
    about: [
      'css/pages/about.css'
    ],
    migrate: [
      'css/pages/migrate.css'
    ],
    'case-studies': [
      'css/pages/case-studies.css'
    ],
    community: [
      'css/pages/community.css'
    ],
    'clodo-framework-guide': [
      'css/pages/clodo-framework-guide.css'
    ]
  },

  // Deferred bundles (lazy-loaded)
  DEFERRED_BUNDLES: {
    'index-deferred': [
      'css/components-page-specific.css',
      'css/pages/index/benefits.css',
      'css/pages/index/cloudflare-edge.css',
      'css/pages/index/comparison.css',
      'css/pages/index/cta.css',
      'css/pages/index/features.css',
      'css/pages/index/social-proof.css',
      'css/pages/index/stats.css',
      'css/pages/index.css'
    ]
  }
};

export const TEMPLATE_FILES = {
  // Core templates
  FOOTER: 'footer.html',
  HEADER: 'header.html',
  NAV_MAIN: 'nav-main.html',
  VERIFICATION: 'verification.html',
  HERO: 'hero.html',
  HERO_PRICING: 'hero-pricing.html',
  HERO_MINIMAL: 'hero-minimal.html',
  TOC: 'table-of-contents.html',
  TOC_FAQ: 'table-of-contents-faq.html',
  RELATED_CONTENT: 'related-content.html',
  RELATED_CONTENT_FAQ: 'related-content-faq.html',
  RELATED_CONTENT_COMPARISON: 'related-content-comparison.html',
  RELATED_CONTENT_WORKERS: 'related-content-workers.html',
  ANNOUNCEMENT_BANNER: 'announcement-banner.html',
  THEME_SCRIPT: 'theme-script.html',

  // Component templates
  NEWSLETTER_FORM_FOOTER: 'components/newsletter-form-footer.html',
  NEWSLETTER_CTA_BLOG_MID: 'components/newsletter-cta-blog-mid.html',
  NEWSLETTER_CTA_BLOG_FOOTER: 'components/newsletter-cta-blog-footer.html',

  // Partial templates
  PRICING_CARDS: 'partials/pricing-cards.html',
};

export const ROOT_ASSETS = [
  'robots.txt',
  'sitemap.xml',
  'site.webmanifest',
  'google1234567890abcdef.html',
  'favicon.svg',
  'favicon.ico',
  '_redirects',
  '_headers'
];

export const JS_FILES = {
  // Individual JS files referenced in templates
  INIT_PRELOAD: 'js/init-preload.js',
  MAIN: 'js/main.js',
  ANALYTICS: 'js/analytics.js',
  INIT_SYSTEMS: 'js/init-systems.js',
  DEFER_CSS: 'js/defer-css.js',
  CONFIG_FEATURES: 'js/config/features.js',
  NAVIGATION_COMPONENT: 'js/ui/navigation-component.js',
};

export const SEO_CONSTANTS = {
  DEFAULT_TITLE: 'Clodo Framework',
  DEFAULT_DESCRIPTION: 'Pre-Flight Checker for Cloudflare Workers - Reduce custom software costs by 60%',
  DEFAULT_AUTHOR: 'Tamyla',
  DEFAULT_LANGUAGE: 'en',
  DEFAULT_TIMEZONE: 'UTC',
};

export const ANALYTICS_CONSTANTS = {
  CLOUDFLARE_BEACON_TOKEN_PLACEHOLDER: 'your_beacon_token_here',
  ANALYTICS_HTML_PATH: 'analytics.html',
};