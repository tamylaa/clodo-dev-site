/**
 * Unified Configuration System
 *
 * This is the single source of truth for all project configuration.
 * It consolidates and organizes all existing config files into a logical hierarchy.
 *
 * Architecture:
 * - Runtime Config: Available at runtime (client + server)
 * - Build Config: Only available during build process
 * - Environment Overrides: Environment-specific settings
 * - Feature Flags: Gradual rollout capabilities
 *
 * Usage:
 * - Runtime: import { config } from './config/index.js'
 * - Build: import { buildConfig } from './config/index.js'
 * - Features: import { features } from './config/index.js'
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import toml from '@iarna/toml';
import Ajv from 'ajv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ajv = new Ajv({ allErrors: true });

// ==========================================
// ✅ CONFIG VALIDATION
// ==========================================

/**
 * Validate config against JSON schema
 */
const validateConfig = (config, schemaName) => {
  try {
    // Try to load schema file
    const schemaPath = join(__dirname, `${schemaName}.schema.json`);
    if (!existsSync(schemaPath)) {
      return { valid: true, errors: null }; // No schema, skip validation
    }

    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
    const validate = ajv.compile(schema);
    const valid = validate(config);

    return {
      valid,
      errors: validate.errors
    };
  } catch (error) {
    console.warn(`Warning: Could not validate config ${schemaName}:`, error.message);
    return { valid: true, errors: null }; // Don't fail on validation errors
  }
};

/**
 * Load and validate config file
 */
const loadAndValidateConfig = async (baseName, fallback = {}) => {
  const config = await loadConfigFile(baseName, fallback);

  // Remove $schema field if present (used by editors, not for validation)
  const configToValidate = { ...config };
  delete configToValidate.$schema;

  const validation = validateConfig(configToValidate, baseName);

  if (!validation.valid) {
    console.warn(`Config validation failed for ${baseName}:`, validation.errors);
    // In development, you might want to throw here
    // In production, continue with fallback
    if (currentEnv === 'development') {
      console.error('Config validation errors:', validation.errors);
    }
  }

  return config;
};

// ==========================================
// 🔧 ENVIRONMENT DETECTION
// ==========================================

const getEnvironment = () => {
  // Explicit environment variable
  if (process.env.NODE_ENV) return process.env.NODE_ENV;

  // Check hostname patterns
  const hostname = process.env.HOSTNAME || 'localhost';
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) return 'development';
  if (hostname.includes('staging')) return 'staging';
  return 'production';
};

const currentEnv = getEnvironment();

// ==========================================
// 📁 CONFIG FILE LOADING
// ==========================================

/**
 * Load JSON config file with error handling
 */
const loadJsonConfig = (filePath, fallback = {}) => {
  try {
    if (existsSync(filePath)) {
      return JSON.parse(readFileSync(filePath, 'utf8'));
    }
  } catch (error) {
    console.warn(`Warning: Could not load JSON config file ${filePath}:`, error.message);
  }
  return fallback;
};

/**
 * Load TOML config file with error handling
 */
const loadTomlConfig = (filePath, fallback = {}) => {
  try {
    if (existsSync(filePath)) {
      return toml.parse(readFileSync(filePath, 'utf8'));
    }
  } catch (error) {
    console.warn(`Warning: Could not load TOML config file ${filePath}:`, error.message);
  }
  return fallback;
};

/**
 * Load JS config file with error handling
 */
const loadJsConfig = async (filePath, fallback = {}) => {
  try {
    const module = await import(filePath);
    return module.default || module;
  } catch (error) {
    console.warn(`Warning: Could not load JS config file ${filePath}:`, error.message);
    return fallback;
  }
};

/**
 * Load config file with format preference: TOML > JSON > JS > fallback
 */
const loadConfigFile = async (baseName, fallback = {}) => {
  const configDir = __dirname;

  // Try TOML first (industry standard for configs)
  const tomlPath = join(configDir, `${baseName}.toml`);
  if (existsSync(tomlPath)) {
    return loadTomlConfig(tomlPath, fallback);
  }

  // Try JSON second
  const jsonPath = join(configDir, `${baseName}.json`);
  if (existsSync(jsonPath)) {
    return loadJsonConfig(jsonPath, fallback);
  }

  // Try JS last (for dynamic configs)
  const jsPath = join(configDir, `${baseName}.js`);
  if (existsSync(jsPath)) {
    return await loadJsConfig(jsPath, fallback);
  }

  return fallback;
};

// Load all config files (TOML preferred, JSON fallback for compatibility)
const siteConfig = await loadAndValidateConfig('site', {});
const themeConfig = await loadAndValidateConfig('theme', {});
const navigationConfig = await loadAndValidateConfig('navigation', {});
const pagesConfig = await loadAndValidateConfig('pages.config', {});
const featuresConfig = await loadJsConfig('../public/js/config/features.js', {});
// Extract features from the loaded module (it attaches to global but we need the functions)
const FEATURES = featuresConfig.FEATURES || {};

// Feature flag functions (reimplemented for server-side use)
function checkFeatureEnabled(featureName, options = {}) {
  const feature = FEATURES[featureName];
  if (!feature) return false;

  if (options.force) return true;
  if (feature.enabled === false) return false;

  // Check environment restrictions
  if (feature.environments) {
    const currentEnv = getEnvironment();
    if (!feature.environments.includes(currentEnv)) {
      return false;
    }
  }

  // Check dependencies
  if (feature.dependencies) {
    for (const dep of feature.dependencies) {
      if (!checkFeatureEnabled(dep, options)) {
        return false;
      }
    }
  }

  // Check rollout percentage
  if (feature.rollout !== undefined && feature.rollout < 100) {
    if (options.userId) {
      const hash = simpleHash(options.userId);
      const userPercentile = hash % 100;
      return userPercentile < feature.rollout;
    }
    return Math.random() * 100 < feature.rollout;
  }

  return feature.enabled !== false;
}

function getFeatureConfig(featureName) {
  return FEATURES[featureName] || null;
}

function getEnabledFeatures(options = {}) {
  return Object.keys(FEATURES).filter(name => isFeatureEnabled(name, options));
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
// ==========================================
// 🌐 RUNTIME CONFIGURATION
// ==========================================

export const config = {
  // ==========================================
  // 📍 SITE IDENTITY & BRANDING
  // ==========================================

  site: {
    // Start with TOML config, then apply environment overrides
    ...siteConfig.site,

    // Environment variable overrides
    name: process.env.SITE_NAME || siteConfig.site?.name || 'Clodo Framework',
    shortName: process.env.SITE_SHORT_NAME || siteConfig.site?.shortName || 'Clodo',
    tagline: process.env.SITE_TAGLINE || siteConfig.site?.tagline || 'Build serverless applications with ease',
    description: process.env.SITE_DESCRIPTION || siteConfig.site?.description || 'A modern framework for building Cloudflare Workers applications',

    // URLs
    url: process.env.SITE_URL || siteConfig.site?.url || 'https://www.clodo.dev',
    developmentUrl: process.env.DEV_URL || siteConfig.site?.developmentUrl || 'http://localhost:8000',
    stagingUrl: process.env.STAGING_URL || siteConfig.site?.stagingUrl || 'https://staging.clodo.dev',

    // Language & Locale
    language: process.env.SITE_LANGUAGE || siteConfig.site?.language || 'en',
    locale: process.env.SITE_LOCALE || siteConfig.site?.locale || 'en_US',

    // Copyright (merge with defaults)
    copyright: {
      ...siteConfig.site?.copyright,
      holder: process.env.COPYRIGHT_HOLDER || siteConfig.site?.copyright?.holder || 'Clodo Team',
      year: new Date().getFullYear(),
      startYear: process.env.COPYRIGHT_START_YEAR || siteConfig.site?.copyright?.startYear || 2024
    }
  },

  // ==========================================
  // 🎨 THEME & DESIGN SYSTEM
  // ==========================================

  theme: themeConfig,

  // ==========================================
  // 🏷️ BRANDING (alias for templates)
  // ==========================================

  branding: {
    colors: themeConfig.colors?.brand || {},
    logo: {
      path: '/logo.svg',
      alt: `${siteConfig.site?.name || 'Clodo'} Logo`
    }
  },

  // ==========================================
  // 🧭 NAVIGATION
  // ==========================================

  navigation: navigationConfig,

  // ==========================================
  // 📄 PAGES & ROUTING
  // ==========================================

  pages: pagesConfig,

  // ==========================================
  // 🔗 SOCIAL & EXTERNAL LINKS
  // ==========================================

  social: {
    twitter: {
      url: process.env.TWITTER_URL || 'https://twitter.com/clodo_dev',
      handle: process.env.TWITTER_HANDLE || '@clodo_dev'
    },
    github: {
      url: process.env.GITHUB_URL || 'https://github.com/clodo-dev/clodo',
      org: process.env.GITHUB_ORG || 'clodo-dev',
      repo: process.env.GITHUB_REPO || 'clodo'
    },
    discord: {
      url: process.env.DISCORD_URL || 'https://discord.gg/clodo'
    },
    linkedin: {
      url: process.env.LINKEDIN_URL || 'https://linkedin.com/company/clodo'
    }
  },

  // ==========================================
  // 📧 CONTACT INFORMATION
  // ==========================================

  contact: {
    // Start with TOML config
    ...siteConfig.contact,

    // Environment overrides
    email: {
      general: process.env.CONTACT_EMAIL || siteConfig.contact?.email || 'hello@clodo.dev',
      support: process.env.SUPPORT_EMAIL || siteConfig.contact?.support || 'support@clodo.dev',
      sales: process.env.SALES_EMAIL || 'sales@clodo.dev'
    },
    address: {
      street: process.env.ADDRESS_STREET || '',
      city: process.env.ADDRESS_CITY || '',
      region: process.env.ADDRESS_REGION || '',
      postalCode: process.env.ADDRESS_POSTAL || '',
      country: process.env.ADDRESS_COUNTRY || ''
    }
  },

  // ==========================================
  // 🔧 SERVICES & INTEGRATIONS
  // ==========================================

  services: {
    analytics: {
      // Start with TOML config
      ...siteConfig.analytics,

      // Environment overrides
      enabled: process.env.ANALYTICS_ENABLED !== 'false' && (siteConfig.analytics?.enabled !== false),
      provider: process.env.ANALYTICS_PROVIDER || siteConfig.analytics?.provider || 'plausible',

      // Provider-specific settings
      cloudflare: {
        enabled: process.env.CF_ANALYTICS_ENABLED !== 'false',
        token: process.env.CF_WEB_ANALYTICS_TOKEN
      },
      google: {
        enabled: process.env.GA_ENABLED === 'true',
        measurementId: process.env.GA_MEASUREMENT_ID
      },

      // Plausible settings from TOML
      plausible: siteConfig.analytics?.providers?.plausible || {}
    },

    newsletter: {
      provider: process.env.NEWSLETTER_PROVIDER || 'brevo',
      apiKey: process.env.BREVO_API_KEY,
      listId: process.env.BREVO_LIST_ID
    },

    chat: {
      enabled: process.env.CHAT_ENABLED === 'true',
      provider: process.env.CHAT_PROVIDER || 'brevo'
    },

    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      bing: process.env.BING_SITE_VERIFICATION
    }
  },

  // ==========================================
  // 📱 PWA & MANIFEST
  // ==========================================

  pwa: {
    enabled: process.env.PWA_ENABLED !== 'false',
    display: 'standalone',
    orientation: 'portrait',
    startUrl: '/',
    scope: '/',
    themeColor: themeConfig.colors?.brand?.primary || '#1d4ed8',
    backgroundColor: themeConfig.colors?.background?.dark || '#0f172a'
  },

  // ==========================================
  // 📊 SEO & METADATA
  // ==========================================

  seo: {
    title: {
      default: process.env.SEO_DEFAULT_TITLE || 'Clodo Framework',
      template: process.env.SEO_TITLE_TEMPLATE || '%s | Clodo Framework'
    },
    description: {
      default: process.env.SEO_DEFAULT_DESCRIPTION || 'Build serverless applications with ease',
      maxLength: 160
    },
    keywords: process.env.SEO_KEYWORDS?.split(',') || [
      'cloudflare workers',
      'serverless',
      'framework',
      'javascript',
      'edge computing'
    ],
    canonicalBase: process.env.CANONICAL_BASE || 'https://www.clodo.dev'
  },

  // ==========================================
  // 🏗️ BUILD & DEVELOPMENT
  // ==========================================

  build: {
    outDir: process.env.OUT_DIR || 'dist',
    publicDir: process.env.PUBLIC_DIR || 'public',
    debug: process.env.DEBUG === 'true',
    minify: process.env.MINIFY !== 'false'
  },

  // ==========================================
  // 🌍 ENVIRONMENT
  // ==========================================

  environment: {
    current: currentEnv,
    isDevelopment: currentEnv === 'development',
    isStaging: currentEnv === 'staging',
    isProduction: currentEnv === 'production'
  }
};

// ==========================================
// 🛠️ BUILD-TIME CONFIGURATION
// ==========================================

export const buildConfig = {
  // ==========================================
  // 🔧 TOOLING & DEVELOPMENT
  // ==========================================

  tooling: {
    // Cloudflare
    cloudflare: {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
      zoneId: process.env.CLOUDFLARE_ZONE_ID,
      apiToken: process.env.CLOUDFLARE_API_TOKEN,
      projectName: process.env.CF_PROJECT_NAME || 'clodo-framework'
    },

    // URLs for different environments
    urls: {
      production: config.site.url,
      development: config.site.developmentUrl,
      staging: config.site.stagingUrl,
      local: 'http://localhost:8000',
      vite: 'http://localhost:5173'
    },

    // Testing
    testing: {
      baseUrl: process.env.TEST_BASE_URL || 'http://localhost:8000',
      timeout: parseInt(process.env.TEST_TIMEOUT) || 30000,
      lighthouseUrls: [
        '/',
        '/pricing',
        '/about',
        '/blog',
        '/docs'
      ]
    },

    // SEO
    seo: {
      canonicalBase: config.seo.canonicalBase,
      sitemapPath: '/sitemap.xml',
      robotsPath: '/robots.txt',
      defaultLocale: 'en',
      locales: ['en', 'en-GB', 'en-IN', 'en-AU']
    }
  },

  // ==========================================
  // 📊 ANALYTICS & MONITORING
  // ==========================================

  analytics: {
    googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID,
    cfWebAnalyticsToken: process.env.CF_WEB_ANALYTICS_TOKEN,
    enableInDev: process.env.ANALYTICS_DEV === 'true'
  },

  // ==========================================
  // 🚀 DEPLOYMENT
  // ==========================================

  deployment: {
    cloudflare: {
      projectName: process.env.CF_PROJECT_NAME || 'clodo-framework',
      branch: process.env.CF_PAGES_BRANCH || 'main'
    }
  }
};

// ==========================================
// 🚩 FEATURE FLAGS
// ==========================================

export const features = {
  FEATURES,
  isFeatureEnabled: checkFeatureEnabled,
  getFeatureConfig,
  getEnabledFeatures,
  // Add other functions as needed
};

// ==========================================
// 🛠️ HELPER FUNCTIONS
// ==========================================

/**
 * Get the appropriate base URL for current environment
 */
export const getBaseUrl = () => {
  if (process.env.BASE_URL) return process.env.BASE_URL;

  switch (currentEnv) {
    case 'development':
      return config.site.developmentUrl;
    case 'staging':
      return config.site.stagingUrl;
    default:
      return config.site.url;
  }
};

/**
 * Get full URL for a path
 */
export const getFullUrl = (path = '') => {
  const base = getBaseUrl();
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
};

/**
 * Check if feature is enabled
 */
export const isFeatureEnabled = (featureName, options = {}) => {
  if (!features.isFeatureEnabled) return false;
  return features.isFeatureEnabled(featureName, {
    ...options,
    userId: options.userId || process.env.USER_ID
  });
};

/**
 * Get config value with environment override
 */
export const getConfig = (path, defaultValue = null) => {
  const parts = path.split('.');
  let value = config;

  for (const part of parts) {
    value = value?.[part];
    if (value === undefined) return defaultValue;
  }

  return value ?? defaultValue;
};

/**
 * Get build config value
 */
export const getBuildConfig = (path, defaultValue = null) => {
  const parts = path.split('.');
  let value = buildConfig;

  for (const part of parts) {
    value = value?.[part];
    if (value === undefined) return defaultValue;
  }

  return value ?? defaultValue;
};

// ==========================================
// 🔄 LEGACY COMPATIBILITY
// ==========================================

/**
 * Load and reload configuration dynamically
 * Useful for development hot reloading or runtime config updates
 */
export const loadConfig = async () => {
  try {
    const site = await loadAndValidateConfig('site', {});
    const theme = await loadAndValidateConfig('theme', {});
    const navigation = await loadAndValidateConfig('navigation', {});
    const pages = await loadAndValidateConfig('pages.config', {});
    const experiments = await loadAndValidateConfig('experiments', {});
    const personalization = await loadAndValidateConfig('personalization', []);

    return {
      site,
      theme,
      navigation,
      pages,
      experiments,
      personalization
    };
  } catch (error) {
    console.error('Failed to load configuration:', error);
    throw error;
  }
};

// Maintain backward compatibility with existing imports
export { config as siteConfig };
export { buildConfig as toolingConfig };
export { config as default };

// Export individual sections for direct access
export const { site, theme, navigation, pages, social, contact, services, pwa, seo, build, environment } = config;
export const { tooling, analytics, deployment } = buildConfig;