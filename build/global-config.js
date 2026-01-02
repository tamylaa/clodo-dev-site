/**
 * Global Build Configuration
 *
 * This file now serves as a bridge to the unified configuration system.
 * It provides backward compatibility for existing build scripts while
 * delegating to the centralized config system.
 *
 * DEPRECATED: New code should import directly from '../config/index.js'
 * Migration: Replace imports of GLOBAL_CONFIG with imports from config system
 */

import { config, buildConfig, getBaseUrl, getFullUrl, isFeatureEnabled } from '../config/index.js';
import { PORTS, ENVIRONMENTS, PERFORMANCE } from '../lib/constants-extended.js';

// Re-export unified config for backward compatibility
export { config, buildConfig, getBaseUrl, getFullUrl, isFeatureEnabled };

// ==========================================
// 🔄 LEGACY GLOBAL_CONFIG (DEPRECATED)
// ==========================================
// This maintains backward compatibility but delegates to unified config

export const GLOBAL_CONFIG = {
  // Site configuration from unified config
  site: config.site,

  // API endpoints from unified config
  apis: {
    cloudflare: 'https://api.cloudflare.com/client/v4',
    webpagetest: 'https://www.webpagetest.org',
    googleAnalytics: 'https://www.google-analytics.com',
    cloudflareInsights: 'https://static.cloudflareinsights.com'
  },

  // Ports (maintained for build scripts)
  ports: {
    devServer: PORTS.DEV_SERVER,
    smokeTest: PORTS.SMOKE_TEST,
    lighthouse: PORTS.LIGHTHOUSE
  },

  // Environment detection from unified config
  environments: ENVIRONMENTS.HOSTS,

  // Build system settings
  build: {
    timeouts: {
      pageLoad: 30000,
      navigation: 60000,
      resourceLoad: 10000
    },
    limits: {
      gitBuffer: 10 * 1024 * 1024, // 10MB
      fileSize: 5 * 1024 * 1024, // 5MB
      concurrentTasks: 5
    }
  },

  // Validation settings
  validation: {
    http: {
      success: 200,
      redirectMin: 300,
      redirectMax: 399,
      clientError: 400,
      serverError: 500
    },
    curl: {
      maxRedirects: 10,
      timeout: 30000
    },
    playwright: {
      defaultTimeout: 30000,
      navigationTimeout: 60000
    }
  },

  // Performance monitoring
  performance: {
    thresholds: PERFORMANCE.LIGHTHOUSE,
    intervals: {
      monitoring: 500,    // ms
      sampling: 100,      // ms
      polling: 1000       // ms
    }
  },

  // Analyzer modules (specific to build scripts)
  analyzers: {
    timeouts: {
      performanceMonitorWait: 500,
      performanceMonitorMaxAttempts: 20,
      smokeTestReady: 10000,
      smokeTestExtended: 15000,
      mutationObserver: 2300
    },
    seo: {
      targetKeywords: [
        'wrangler',
        'cloudflare workers',
        'serverless',
        'ruby on rails for cloudflare',
        'scaffolding for workers',
        'worker migration',
        'rails cloudflare integration',
        'serverless framework comparison'
      ],
      baseRankings: {
        'wrangler': 15,
        'cloudflare workers': 8,
        'serverless': 12,
        'ruby on rails for cloudflare': 25,
        'scaffolding for workers': 35,
        'worker migration': 18,
        'rails cloudflare integration': 22,
        'serverless framework comparison': 14
      },
      searchVolumes: {
        'wrangler': 5400,
        'cloudflare workers': 2900,
        'serverless': 12100,
        'ruby on rails for cloudflare': 320,
        'scaffolding for workers': 210,
        'worker migration': 590,
        'rails cloudflare integration': 260,
        'serverless framework comparison': 880
      },
      competitionLevels: {
        'wrangler': 'high',
        'cloudflare workers': 'medium',
        'serverless': 'high',
        'ruby on rails for cloudflare': 'low',
        'scaffolding for workers': 'low',
        'worker migration': 'medium',
        'rails cloudflare integration': 'low',
        'serverless framework comparison': 'medium'
      },
      thresholds: {
        opportunityVolume: 500,
        opportunityRank: 20,
        trendDifference: 5,
        rankingVariation: 10
      }
    },
    webpagetest: {
      locations: ['Dulles:Chrome', 'Frankfurt:Chrome', 'Mumbai:Chrome', 'SAO:Chrome'],
      apiKey: process.env.WEBPAGETEST_API_KEY
    },
    lighthouse: {
      outputFormat: 'json',
      formFactor: 'mobile',
      outputDir: 'reports/lighthouse'
    },
    smokeTest: {
      urls: [
        '/',
        '/docs',
        '/case-studies',
        '/case-studies/healthcare-saas-platform',
        '/blog/building-developer-communities',
        '/migrate'
      ],
      devCommand: 'node',
      devArgs: ['build/core/dev-server.js', '--port']
    },
    files: {
      modifiedCss: [
        'public/css/base.css',
        'public/css/components.css',
        'public/css/layout.css',
        'public/css/pages/index.css',
        'public/css/pages/index/hero.css',
        'public/css/pages/subscribe.css',
        'public/css/utilities.css',
        'public/styles.css'
      ],
      newCss: [
        'public/css/components-common.css',
        'public/css/components-page-specific.css',
        'public/css/critical-base.css',
        'public/css/hero-decorations.css',
        'public/css/pages/index/hero-animations.css'
      ],
      excludePatterns: [
        'google*verification*'
      ]
    },
    content: {
      pages: [
        {
          path: '/wrangler-to-clodo-migration.html',
          targetKeyword: 'wrangler',
          publishDate: '2025-12-21',
          expectedTraffic: 5400
        },
        {
          path: '/ruby-on-rails-cloudflare-integration.html',
          targetKeyword: 'ruby on rails for cloudflare',
          publishDate: '2025-12-21',
          expectedTraffic: 320
        },
        {
          path: '/serverless-framework-comparison.html',
          targetKeyword: 'serverless',
          publishDate: '2025-12-21',
          expectedTraffic: 12100
        },
        {
          path: '/worker-scaffolding-tools.html',
          targetKeyword: 'scaffolding for workers',
          publishDate: '2025-12-21',
          expectedTraffic: 210
        },
        {
          path: '/advanced-cloudflare-workers-tutorial.html',
          targetKeyword: 'cloudflare workers',
          publishDate: '2025-12-21',
          expectedTraffic: 2900
        }
      ]
    }
  },

  // Validator modules
  validators: {
    cloudflare: {
      apiBase: 'https://api.cloudflare.com/client/v4',
      dashboardUrl: 'https://dash.cloudflare.com',
      beaconScript: 'https://static.cloudflareinsights.com/beacon.min.js',
      tokenUrl: 'https://dash.cloudflare.com/profile/api-tokens'
    },
    visual: {
      testUrls: [
        '/blog/building-developer-communities',
        '/community/welcome'
      ]
    },
    navigation: {
      testUrls: [
        '/',
        '/community/welcome',
        '/blog/',
        '/blog/stackblitz-integration-journey'
      ]
    },
    css: {
      expectedSelectors: ['.social-proof-section', '.stat-card', '.testimonial-card']
    }
  },

  // Generator modules
  generators: {
    sitemap: {
      defaultPriority: 0.8,
      indexPriority: 1.0,
      defaultChangefreq: 'weekly',
      blogPriority: 0.6
    },
    blog: {
      defaultAuthor: 'Clodo Team',
      defaultCategory: 'Development',
      excerptLength: 160
    }
  }
};

// ==========================================
// 🛠️ HELPER FUNCTIONS (DELEGATE TO UNIFIED)
// ==========================================

/**
 * Get the appropriate base URL based on environment
 * @deprecated Use getBaseUrl from unified config
 */
export const getBaseUrl_legacy = getBaseUrl;

/**
 * Check if running in development environment
 * @deprecated Use config.environment.isDevelopment
 */
export const isDevelopment = (url = null) => {
  const checkUrl = url || getBaseUrl();
  return GLOBAL_CONFIG.environments.development.some(env => checkUrl.includes(env));
};

/**
 * Get port for specific service
 * @deprecated Use buildConfig.tooling or getBuildConfig
 */
export const getPort = (service = 'devServer') => {
  return process.env[`${service.toUpperCase()}_PORT`] || GLOBAL_CONFIG.ports[service];
};

/**
 * Get API endpoint URL
 * @deprecated Use GLOBAL_CONFIG.apis[service]
 */
export const getApiUrl = (service) => {
  return GLOBAL_CONFIG.apis[service];
};

/**
 * Get full URL for a path
 * @deprecated Use getFullUrl from unified config
 */
export const getFullUrl_legacy = getFullUrl;

// ==========================================
// 🔄 LEGACY COMPATIBILITY
// ==========================================

// Maintain backward compatibility with existing analyzer config
export const ANALYZER_CONFIG = {
  urls: {
    production: GLOBAL_CONFIG.site.url,
    development: GLOBAL_CONFIG.site.developmentUrl,
    webpagetest: GLOBAL_CONFIG.apis.webpagetest
  },
  ports: GLOBAL_CONFIG.ports,
  timeouts: GLOBAL_CONFIG.analyzers.timeouts,
  files: GLOBAL_CONFIG.analyzers.files,
  seo: GLOBAL_CONFIG.analyzers.seo,
  content: GLOBAL_CONFIG.analyzers.content,
  webpagetest: GLOBAL_CONFIG.analyzers.webpagetest,
  lighthouse: GLOBAL_CONFIG.analyzers.lighthouse,
  smokeTest: GLOBAL_CONFIG.analyzers.smokeTest,
  validation: GLOBAL_CONFIG.validation,
  limits: {
    gitDiffBuffer: GLOBAL_CONFIG.build.limits.gitBuffer,
    mutationLogLimit: 50
  }
};

// ==========================================
// 📋 MIGRATION NOTICE
// ==========================================

/**
 * MIGRATION NOTICE:
 *
 * This file is now a compatibility layer for the unified configuration system.
 * New code should import from '../config/index.js' instead:
 *
 * OLD:
 *   import { GLOBAL_CONFIG, getBaseUrl } from '../build/global-config.js';
 *
 * NEW:
 *   import { config, buildConfig, getBaseUrl } from '../config/index.js';
 *
 * The unified system provides:
 * - Better organization (runtime vs build config)
 * - Environment-aware settings
 * - Feature flags
 * - Single source of truth
 * - Better maintainability
 */
