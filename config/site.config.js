/**
 * Site Configuration
 * 
 * This is the central configuration file for your website.
 * All site-wide settings, branding, URLs, and metadata are defined here.
 * 
 * SETUP: Run `npm run setup` to generate this file interactively,
 * or edit the values below manually.
 */

const siteConfig = {
  // ============================================
  // CORE SITE IDENTITY
  // ============================================
  site: {
    name: 'Your Site Name',
    shortName: 'YourSite',
    tagline: 'Your compelling tagline goes here',
    description: 'A detailed description of your website for SEO and social sharing. Keep it under 160 characters for best results.',
    
    // Primary URL (used for canonical URLs, sitemaps, etc.)
    url: 'https://example.com',
    
    // Language settings
    language: 'en',
    locale: 'en_US',
    
    // Supported alternate locales (for hreflang tags)
    alternateLocales: [
      { lang: 'en', url: 'https://example.com' },
      { lang: 'en-GB', url: 'https://example.com' },
      { lang: 'x-default', url: 'https://example.com' }
    ],
    
    // Copyright information
    copyright: {
      holder: 'Your Company Name',
      year: new Date().getFullYear(),
      startYear: 2024
    }
  },

  // ============================================
  // BRANDING
  // ============================================
  branding: {
    // Logo configuration
    logo: {
      // Path to logo SVG (relative to public/)
      path: '/logo.svg',
      // Alt text for accessibility
      alt: 'Your Site Name Logo',
      // Logo dimensions
      width: 24,
      height: 24
    },
    
    // Brand colors (used in CSS custom properties and PWA manifest)
    colors: {
      primary: '#1d4ed8',      // Primary brand color
      secondary: '#6366f1',    // Secondary/accent color
      background: '#0b1220',   // Dark background
      text: '#ffffff',         // Primary text color
      themeColor: '#1d4ed8'    // Browser theme color (PWA)
    },
    
    // Favicon paths
    favicons: {
      ico: '/favicon.ico',
      svg: '/favicon.svg',
      appleTouchIcon: '/apple-touch-icon.png'
    }
  },

  // ============================================
  // SOCIAL MEDIA LINKS
  // ============================================
  social: {
    twitter: {
      url: 'https://twitter.com/yourhandle',
      handle: '@yourhandle'
    },
    github: {
      url: 'https://github.com/your-org/your-repo',
      org: 'your-org',
      repo: 'your-repo'
    },
    linkedin: {
      url: 'https://linkedin.com/company/your-company'
    },
    discord: {
      url: 'https://discord.gg/your-invite'
    },
    // Add more social platforms as needed
    youtube: null,
    facebook: null,
    instagram: null
  },

  // ============================================
  // CONTACT INFORMATION
  // ============================================
  contact: {
    email: {
      general: 'contact@example.com',
      support: 'support@example.com',
      sales: 'sales@example.com'
    },
    // Physical address (optional, for schema.org)
    address: {
      street: '',
      city: '',
      region: '',
      postalCode: '',
      country: ''
    }
  },

  // ============================================
  // OPEN GRAPH & SOCIAL SHARING
  // ============================================
  openGraph: {
    type: 'website',
    image: '/og-image.png',
    imageWidth: 1200,
    imageHeight: 630,
    imageAlt: 'Your Site Name - Preview Image'
  },

  // ============================================
  // SCHEMA.ORG STRUCTURED DATA
  // ============================================
  schema: {
    // Organization details for schema.org
    organization: {
      type: 'Organization',
      name: 'Your Company Name',
      legalName: 'Your Company Legal Name LLC',
      foundingDate: '2024',
      description: 'Company description for search engines',
      // Same as social links above, used in schema
      sameAs: [] // Will be auto-populated from social config
    },
    
    // Website schema
    website: {
      type: 'WebSite',
      potentialAction: {
        type: 'SearchAction',
        target: 'https://example.com/search?q={search_term_string}',
        queryInput: 'required name=search_term_string'
      }
    }
  },

  // ============================================
  // ANALYTICS & THIRD-PARTY SERVICES
  // ============================================
  services: {
    // Analytics (configured via environment variables)
    analytics: {
      // Cloudflare Web Analytics (token set via CF dashboard)
      cloudflare: {
        enabled: true
      },
      // Google Analytics (optional)
      google: {
        enabled: false,
        measurementId: '' // Set via GOOGLE_ANALYTICS_ID env var
      }
    },
    
    // Newsletter service
    newsletter: {
      provider: 'brevo', // 'brevo', 'mailchimp', 'convertkit', 'custom', or null
      // API credentials set via environment variables:
      // - BREVO_API_KEY
      // - BREVO_LIST_ID
    },
    
    // Live chat widget
    chat: {
      enabled: false,
      provider: null // 'brevo', 'intercom', 'crisp', etc.
      // Widget IDs set via environment variables
    },
    
    // Search engine verification codes
    verification: {
      google: '', // Set via GOOGLE_SITE_VERIFICATION env var
      bing: ''    // Set via BING_SITE_VERIFICATION env var
    }
  },

  // ============================================
  // PWA MANIFEST SETTINGS
  // ============================================
  manifest: {
    display: 'standalone',
    orientation: 'portrait',
    startUrl: '/',
    scope: '/',
    categories: ['business', 'productivity'],
    // Icons are auto-generated from branding.favicons
  },

  // ============================================
  // BUILD CONFIGURATION
  // ============================================
  build: {
    // Output directory
    outDir: 'dist',
    
    // Public assets directory
    publicDir: 'public',
    
    // Enable/disable features
    features: {
      criticalCss: true,      // Inline critical CSS
      contentHashing: true,   // Hash CSS/JS for cache busting
      minifyHtml: true,       // Minify HTML output
      minifyCss: true,        // Minify CSS output
      minifyJs: true,         // Minify JavaScript output
      generateSitemap: true,  // Generate sitemap.xml
      generateRobots: true    // Generate robots.txt
    }
  },

  // ============================================
  // CLOUDFLARE PAGES CONFIGURATION
  // ============================================
  cloudflare: {
    // Project name in Cloudflare Pages
    projectName: 'your-site',
    
    // Account ID (optional, for wrangler commands)
    accountId: '' // Set via CLOUDFLARE_ACCOUNT_ID env var
  },

  // ============================================
  // CONTENT CONFIGURATION
  // ============================================
  content: {
    // Blog settings
    blog: {
      enabled: true,
      postsPerPage: 10,
      path: '/blog',
      categories: [
        'Tutorial',
        'News',
        'Case Study',
        'Technical',
        'General'
      ]
    },
    
    // Default author for content
    defaultAuthor: {
      name: 'Your Name',
      email: 'author@example.com',
      url: 'https://example.com/about',
      avatar: '/images/authors/default.jpg',
      bio: 'Author bio goes here.',
      social: {
        twitter: 'https://twitter.com/yourhandle',
        github: 'https://github.com/yourusername',
        linkedin: 'https://linkedin.com/in/yourprofile'
      }
    }
  }
};

// Auto-populate schema.organization.sameAs from social links
const socialUrls = Object.values(siteConfig.social || {})
  .filter(s => s?.url)
  .map(s => s.url);
  
if (siteConfig.schema?.organization) {
  siteConfig.schema.organization.sameAs = socialUrls;
}

export default siteConfig;

export { config };
