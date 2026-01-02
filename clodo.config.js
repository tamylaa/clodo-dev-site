/**
 * Clodo Framework Configuration
 * Central configuration for all Clodo Framework features
 */

export default {
  // ============================================
  // SITE IDENTITY & BASIC INFO
  // ============================================
  site: {
    name: 'Clodo Framework',
    domain: 'clodo.dev',
    description: 'Pre-Flight Checker for Cloudflare Workers - Reduce custom software costs by 60%',
    author: 'Tamyla',
    language: 'en',
    timezone: 'UTC',

    // Social & Contact
    social: {
      github: 'https://github.com/tamylaa',
      twitter: 'https://twitter.com/clodoframework',
      linkedin: 'https://linkedin.com/company/clodo-framework'
    },

    // Business info
    business: {
      name: 'Clodo Framework',
      address: null,
      phone: null,
      email: 'hello@clodo.dev'
    }
  },

  // Template variables for easy access
  siteName: 'Clodo Framework',
  siteShortName: 'Clodo',
  siteDescription: 'Pre-Flight Checker for Cloudflare Workers - Reduce custom software costs by 60%',
  copyright: {
    year: 2024,
    holder: 'Clodo Framework'
  },

  // ============================================
  // BRANDING & THEME
  // ============================================
  branding: {
    colors: {
      primary: '#1d4ed8',
      secondary: '#6366f1',
      accent: '#f59e0b'
    },
    logo: {
      path: '/logo.svg',
      alt: 'Clodo Framework Logo'
    }
  },

  // ============================================
  // CONTENT CONFIGURATION
  // ============================================
  content: {
    type: 'blog', // blog | docs | portfolio | landing | business

    // Blog-specific settings
    blog: {
      postsPerPage: 12,
      featuredPosts: 3,
      categories: ['cloudflare', 'framework', 'performance', 'edge-computing'],
      tags: ['serverless', 'javascript', 'cloudflare-workers', 'framework'],
      authors: ['tamyla'],
      showAuthorBio: true,
      showRelatedPosts: true,
      enableComments: false,
      enableNewsletter: true
    },

    // Documentation settings (if type === 'docs')
    docs: {
      versions: ['latest', 'v1.0'],
      defaultVersion: 'latest',
      sidebar: {
        collapsed: false,
        autoCollapse: true
      }
    },

    // Portfolio settings (if type === 'portfolio')
    portfolio: {
      projectsPerPage: 9,
      categories: ['web-development', 'cloudflare', 'frameworks'],
      showCaseStudies: true,
      enableFiltering: true
    }
  },

  // ============================================
  // INTERNATIONALIZATION (I18N)
  // ============================================
  i18n: {
    enabled: true,
    defaultLocale: 'en',
    locales: ['de', 'it'],

    // Locale-specific settings
    localeSettings: {
      de: {
        name: 'Deutsch',
        language: 'de',
        region: 'DE',
        direction: 'ltr'
      },
      it: {
        name: 'Italiano',
        language: 'it',
        region: 'IT',
        direction: 'ltr'
      }
    },

    // Content translation settings
    content: {
      // Where to find translation files
      translationDir: 'content/i18n',

      // Fallback behavior
      fallbackToDefault: true,

      // Auto-generate missing translations
      autoGenerate: true
    },

    // URL structure for localized pages
    routing: {
      strategy: 'prefix', // prefix | domain | subdirectory
      prefix: 'i18n' // e.g., /i18n/de/page
    },

    // SEO settings for localized pages
    seo: {
      hreflang: true,
      canonical: true,
      openGraph: true
    }
  },

  // ============================================
  // BUILD CONFIGURATION
  // ============================================
  build: {
    // Directory structure
    sourceDir: 'src',
    publicDir: 'public',
    outputDir: 'dist',
    templatesDir: 'templates',
    contentDir: 'content',
    dataDir: 'data',
    assetsDir: 'assets',

    // Build options
    optimize: {
      images: true,
      css: true,
      js: true,
      html: true,
      criticalCss: true,
      preload: true,
      prefetch: true
    },

    // Performance targets
    performance: {
      lighthouse: {
        performance: 90,
        accessibility: 95,
        bestPractices: 95,
        seo: 95
      },
      webVitals: {
        lcp: 2500, // ms
        fid: 100,  // ms
        cls: 0.1   // score
      }
    },

    // Asset processing
    assets: {
      images: {
        formats: ['webp', 'avif'],
        sizes: [400, 800, 1200, 1600],
        quality: 85
      },
      fonts: {
        preload: ['critical'],
        display: 'swap'
      }
    }
  },

  // ============================================
  // DEPLOYMENT CONFIGURATION
  // ============================================
  deploy: {
    platform: 'cloudflare-pages', // cloudflare-pages | cloudflare-workers | static | netlify | vercel

    // Environment configurations
    environments: {
      development: {
        domain: 'dev.clodo.dev',
        branch: 'develop',
        buildCommand: 'npm run build',
        outputDir: 'dist',
        environmentVariables: {
          NODE_ENV: 'development',
          CLODO_ENV: 'development'
        }
      },

      staging: {
        domain: 'staging.clodo.dev',
        branch: 'staging',
        buildCommand: 'npm run build',
        outputDir: 'dist',
        environmentVariables: {
          NODE_ENV: 'production',
          CLODO_ENV: 'staging'
        }
      },

      production: {
        domain: 'clodo.dev',
        branch: 'main',
        buildCommand: 'npm run build',
        outputDir: 'dist',
        environmentVariables: {
          NODE_ENV: 'production',
          CLODO_ENV: 'production'
        }
      }
    },

    // Cloudflare-specific settings
    cloudflare: {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
      zoneId: process.env.CLOUDFLARE_ZONE_ID,
      apiToken: process.env.CLOUDFLARE_API_TOKEN,

      // Workers/Pages settings
      workers: {
        compatibilityDate: '2024-01-01',
        compatibilityFlags: ['nodejs_compat'],
        usageModel: 'bundled'
      },

      pages: {
        buildOutputDir: 'dist',
        buildCommand: 'npm run build',
        rootDir: '.'
      }
    }
  },

  // ============================================
  // FEATURE FLAGS
  // ============================================
  features: {
    // Core features
    blog: true,
    docs: false,
    portfolio: false,
    landing: false,

    // Performance features
    analytics: true,
    performance: true,
    accessibility: true,
    seo: true,
    pwa: false,

    // Content features
    search: true,
    comments: false,
    newsletter: true,
    rss: true,
    sitemap: true,

    // Social features
    socialSharing: true,
    openGraph: true,
    twitterCards: true,
    schemaMarkup: true,

    // Development features
    hotReload: true,
    errorOverlay: true,
    buildAnalyzer: true,
    lighthouseCi: true
  },

  // ============================================
  // INTEGRATIONS
  // ============================================
  integrations: {
    // Analytics
    analytics: {
      provider: 'cloudflare', // cloudflare | google | plausible | fathom | custom
      cloudflare: {
        token: process.env.CLOUDFLARE_WEB_ANALYTICS_TOKEN
      },
      google: {
        trackingId: process.env.GA_TRACKING_ID,
        gtag: true
      }
    },

    // Forms & CRM
    forms: {
      provider: 'internal', // internal | netlify | formspree | webhook
      netlify: {
        siteId: process.env.NETLIFY_SITE_ID
      },
      formspree: {
        endpoint: process.env.FORMSPREE_ENDPOINT
      }
    },

    // Content Management
    cms: {
      provider: null, // contentful | strapi | sanity | ghost | custom
      contentful: {
        spaceId: process.env.CONTENTFUL_SPACE_ID,
        accessToken: process.env.CONTENTFUL_ACCESS_TOKEN
      }
    },

    // Payments
    payments: {
      provider: null, // stripe | paypal | coinbase | custom
      stripe: {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        secretKey: process.env.STRIPE_SECRET_KEY
      }
    },

    // Email
    email: {
      provider: 'resend', // resend | sendgrid | mailgun | postmark
      resend: {
        apiKey: process.env.RESEND_API_KEY,
        from: 'noreply@clodo.dev'
      }
    },

    // Search
    search: {
      provider: 'internal', // internal | algolia | typesense | custom
      algolia: {
        appId: process.env.ALGOLIA_APP_ID,
        apiKey: process.env.ALGOLIA_API_KEY,
        indexName: 'clodo-dev'
      }
    }
  },

  // ============================================
  // SECURITY CONFIGURATION
  // ============================================
  security: {
    headers: {
      contentSecurityPolicy: true,
      strictTransportSecurity: true,
      xFrameOptions: 'DENY',
      xContentTypeOptions: true,
      referrerPolicy: 'strict-origin-when-cross-origin'
    },

    // Rate limiting
    rateLimit: {
      enabled: true,
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    },

    // CORS settings
    cors: {
      enabled: false,
      origins: [],
      methods: ['GET', 'POST'],
      credentials: false
    }
  },

  // ============================================
  // DEVELOPMENT CONFIGURATION
  // ============================================
  development: {
    port: 3000,
    host: 'localhost',
    https: false,
    open: true,

    // Development features
    features: {
      hotReload: true,
      errorOverlay: true,
      buildAnalyzer: false,
      performanceMonitor: true
    },

    // Proxy settings for API calls
    proxy: {
      '/api': {
        target: 'http://localhost:8787', // Cloudflare Workers local dev
        changeOrigin: true
      }
    }
  },

  // ============================================
  // TESTING CONFIGURATION
  // ============================================
  testing: {
    // Unit testing
    unit: {
      framework: 'vitest',
      coverage: true,
      coverageThreshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },

    // E2E testing
    e2e: {
      framework: 'playwright',
      browsers: ['chromium', 'firefox', 'webkit'],
      baseURL: 'http://localhost:3000'
    },

    // Visual regression
    visual: {
      enabled: true,
      threshold: 0.01,
      updateScreenshots: false
    },

    // Performance testing
    performance: {
      lighthouse: true,
      webVitals: true,
      budget: {
        performance: 90,
        accessibility: 95,
        bestPractices: 95,
        seo: 95
      }
    }
  },

  // ============================================
  // MONITORING & LOGGING
  // ============================================
  monitoring: {
    // Error tracking
    errors: {
      provider: 'console', // console | sentry | logrocket | custom
      sentry: {
        dsn: process.env.SENTRY_DSN
      }
    },

    // Performance monitoring
    performance: {
      enabled: true,
      webVitals: true,
      realUserMonitoring: false
    },

    // Logging
    logging: {
      level: 'info', // error | warn | info | debug
      format: 'json',
      destination: 'console' // console | file | remote
    }
  },

  // ============================================
  // ADVANCED CONFIGURATION
  // ============================================
  advanced: {
    // Custom build hooks
    hooks: {
      preBuild: null,
      postBuild: null,
      preDeploy: null,
      postDeploy: null
    },

    // Custom webpack/vite configuration
    webpack: null,
    vite: null,

    // Custom scripts to include
    scripts: {
      head: [],
      body: []
    },

    // Custom styles to include
    styles: {
      head: [],
      body: []
    },

    // Environment-specific overrides
    overrides: {
      development: {},
      staging: {},
      production: {}
    }
  },

  // ============================================
  // PAGE-SPECIFIC DATA
  // ============================================
  // Data that can be accessed in templates using {{pageData.key}}
  // Useful for page-specific content like announcements, hero sections, etc.
  pageData: {
    // Global page data available to all pages (use sparingly)
    global: {
      // Common data that ALL pages need can go here
    },

    // Page-specific overrides (deprecated - use content/pages/*.json files instead)
    pages: {
      // Legacy support - new pages should use content/pages/*.json files
    }
  }
};