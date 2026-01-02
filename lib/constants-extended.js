/**
 * Extended Centralized Constants
 *
 * Consolidates all hardcoded values that appear across multiple files.
 * Single source of truth for ports, URLs, environments, theme modes, etc.
 *
 * Loading priority: TOML → JSON → JavaScript (fallback)
 *
 * Import from here instead of duplicating values across:
 * - build/global-config.js
 * - tooling.config.js
 * - vite.config.js
 * - config files
 * - test files
 * - build scripts
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Load constants from TOML/JSON files
 * Priority: TOML → JSON → Embedded JS (fallback)
 */
let loadedConstants = null;

function loadConstantsFromFiles() {
  if (loadedConstants) return loadedConstants;

  const tomlPath = join(__dirname, 'constants.toml');
  const jsonPath = join(__dirname, 'constants.json');

  // Try TOML first (preferred format)
  if (existsSync(tomlPath)) {
    try {
      const toml = require('@iarna/toml');
      const tomlContent = readFileSync(tomlPath, 'utf8');
      loadedConstants = toml.parse(tomlContent);
      console.log('📋 Constants loaded from TOML');
      return loadedConstants;
    } catch (error) {
      console.warn('⚠️ Failed to load TOML constants:', error.message);
    }
  }

  // Fall back to JSON
  if (existsSync(jsonPath)) {
    try {
      const jsonContent = readFileSync(jsonPath, 'utf8');
      loadedConstants = JSON.parse(jsonContent);
      console.log('📄 Constants loaded from JSON');
      return loadedConstants;
    } catch (error) {
      console.warn('⚠️ Failed to load JSON constants:', error.message);
    }
  }

  // Fall back to embedded defaults
  console.log('📝 Using embedded JavaScript constants (no TOML/JSON found)');
  return null;
}

// Attempt to load from files
const externalConstants = loadConstantsFromFiles();

// ============================================================================
// ENVIRONMENTS & DEPLOYMENT
// ============================================================================

export const ENVIRONMENTS = externalConstants?.environments || {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',

  // All valid environments
  ALL: ['development', 'staging', 'production'],

  // Environment hosts
  HOSTS: {
    development: ['localhost', '127.0.0.1', '0.0.0.0'],
    staging: ['staging.clodo.dev'],
    production: ['clodo.dev', 'www.clodo.dev'],
  },
};

// ============================================================================
// PORTS & NETWORK
// ============================================================================

export const PORTS = externalConstants?.ports || {
  // Local development servers
  DEV_SERVER: 8000,           // Main dev server (Node)
  VITE_DEV: 5173,             // Vite dev server
  HTTP_SERVER: 3000,          // Alternative HTTP server
  LIGHTHOUSE: 8000,           // Lighthouse audit server
  SMOKE_TEST: 38200,          // Smoke test server

  // Default ports by service
  DEFAULT_DEV: 8000,
  DEFAULT_HTTP: 3000,
  DEFAULT_VITE: 5173,
};

export const LOCALHOST = externalConstants?.localhost || {
  // Base URLs for local development
  MAIN: 'http://localhost:8000',
  VITE: 'http://localhost:5173',
  HTTP: 'http://localhost:3000',
  WORKERS: 'http://localhost:8787',

  // Individual hosts
  HOST: 'localhost',
  IP_LOOPBACK: '127.0.0.1',
  IP_ALL: '0.0.0.0',
};

// ============================================================================
// THEME & APPEARANCE
// ============================================================================

export const THEME_MODES = externalConstants?.themeModes || {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',

  ALL: ['light', 'dark', 'auto'],
};

export const THEME_COLORS = externalConstants?.themeColors || {
  // Primary palette
  PRIMARY: {
    light: '#0066cc',
    dark: '#3399ff',
  },

  // Text colors
  TEXT: {
    primary: '#1a1a1a',
    secondary: '#666666',
    muted: '#999999',
  },

  // Background colors
  BACKGROUND: {
    light: '#ffffff',
    dark: '#1a1a1a',
  },

  // Status colors (used in tests and logging)
  STATUS: {
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },

  // Console output colors
  CONSOLE: {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
  },
};

// ============================================================================
// LOCALIZATION & REGIONS
// ============================================================================

export const LOCALES = externalConstants?.locales || {
  ENGLISH: 'en',
  SPANISH: 'es',
  FRENCH: 'fr',
  GERMAN: 'de',
  JAPANESE: 'ja',
  CHINESE: 'zh',
  HEBREW: 'he',

  ALL: ['en', 'es', 'fr', 'de', 'ja', 'zh', 'he'],

  // Region/language pairs
  REGIONS: {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    ja: 'ja-JP',
    zh: 'zh-CN',
    he: 'he-IL',
  },
};

// ============================================================================
// PERFORMANCE & METRICS
// ============================================================================

export const PERFORMANCE = externalConstants?.performance || {
  // Lighthouse targets
  LIGHTHOUSE: {
    PERFORMANCE: 90,
    ACCESSIBILITY: 95,
    BEST_PRACTICES: 90,
    SEO: 90,
  },

  // Web Vitals targets (ms)
  WEB_VITALS: {
    LCP: 2500,      // Largest Contentful Paint
    FID: 100,       // First Input Delay
    CLS: 0.1,       // Cumulative Layout Shift
    FCP: 1800,      // First Contentful Paint
    TTFB: 800,      // Time to First Byte
  },

  // Timeouts (ms)
  TIMEOUTS: {
    REQUEST: 10000,
    PAGE_LOAD: 30000,
    NAVIGATION: 60000,
    RESOURCE_LOAD: 10000,
    SMOKE_TEST: 10000,
    SMOKE_TEST_EXTENDED: 15000,
  },

  // File size limits
  MAX_INLINE_CSS: 50000,     // 50KB
  MAX_INLINE_CSS_KB: 50,
};

// ============================================================================
// CONTENT & PAGES
// ============================================================================

export const PAGES = externalConstants?.pages || {
  HOME: '/',
  ABOUT: '/about',
  PRICING: '/pricing',
  DOCS: '/docs',
  BLOG: '/blog',
  CASE_STUDIES: '/case-studies',
  MIGRATE: '/migrate',
  COMMUNITY: '/community',
};

export const CONFIG_EXTENSIONS = externalConstants?.configExtensions || {
  JSON: '.json',
  JS: '.js',
  TS: '.ts',
  MJS: '.mjs',
  TOML: '.toml',

  ALL: ['.json', '.js', '.ts', '.mjs', '.toml'],
};

// ============================================================================
// FEATURE FLAGS & EXPERIMENTS
// ============================================================================

export const FEATURES = externalConstants?.features || {
  A_B_TESTING: 'ab-testing',
  PERSONALIZATION: 'personalization',
  ANALYTICS: 'analytics',
  HOT_RELOAD: 'hot-reload',
  DEV_TOOLS: 'dev-tools',
};

export const EXPERIMENT_MODES = {
  CONTROL: 'control',
  VARIANT_A: 'variant-a',
  VARIANT_B: 'variant-b',
};

// ============================================================================
// BUILD & COMPILATION
// ============================================================================

export const BUILD = externalConstants?.build || {
  // Hash settings
  HASH_LENGTH: 8,

  // Build modes
  MODE_DEV: 'development',
  MODE_PROD: 'production',

  // Output settings
  SOURCEMAP_DEV: true,
  SOURCEMAP_PROD: false,
};

// ============================================================================
// ERROR MESSAGES & CODES
// ============================================================================

export const HTTP_CODES = externalConstants?.httpCodes || {
  OK: 200,
  REDIRECT_MIN: 300,
  REDIRECT_MAX: 399,
  CLIENT_ERROR: 400,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
};

export const ERROR_MESSAGES = {
  CONFIG_NOT_FOUND: 'Configuration file not found',
  INVALID_ENVIRONMENT: 'Invalid environment specified',
  PORT_IN_USE: 'Port is already in use',
  DEV_SERVER_FAILED: 'Failed to start dev server',
  CONFIG_VALIDATION_FAILED: 'Configuration validation failed',
};

// ============================================================================
// VALIDATOR SETTINGS
// ============================================================================

export const VALIDATION = externalConstants?.validation || {
  HTTP: {
    SUCCESS: 200,
    REDIRECT_MIN: 300,
    REDIRECT_MAX: 399,
    CLIENT_ERROR: 400,
    SERVER_ERROR: 500,
  },

  CURL: {
    MAX_REDIRECTS: 10,
    TIMEOUT: 30000,
  },

  PLAYWRIGHT: {
    DEFAULT_TIMEOUT: 30000,
    NAVIGATION_TIMEOUT: 60000,
  },
};

// ============================================================================
// REGEX PATTERNS & MATCHERS
// ============================================================================

export const PATTERNS = {
  // URL patterns
  VALID_URL: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
  INTERNAL_LINK: /^\/[a-z0-9-/]*$/i,

  // File patterns
  CRITICAL_CSS: /critical|base|reset/i,
  COMMON_CSS: /common|layout|global/i,

  // Dev server ready detection
  DEV_SERVER_READY: /Dev Server running at|Ready for deployment|Home page:/i,

  // Breakpoints
  MOBILE: '(max-width: 767px)',
  TABLET: '(min-width: 768px) and (max-width: 1023px)',
  DESKTOP: '(min-width: 1024px)',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get environment-specific configuration
 */
export const getEnvironmentConfig = (env = ENVIRONMENTS.DEVELOPMENT) => {
  return {
    name: env,
    isDevelopment: env === ENVIRONMENTS.DEVELOPMENT,
    isProduction: env === ENVIRONMENTS.PRODUCTION,
    isStaging: env === ENVIRONMENTS.STAGING,
    hosts: ENVIRONMENTS.HOSTS[env] || [],
  };
};

/**
 * Get port for a service
 */
export const getServicePort = (service = 'devServer') => {
  const serviceMap = {
    devServer: PORTS.DEV_SERVER,
    vite: PORTS.VITE_DEV,
    http: PORTS.HTTP_SERVER,
    lighthouse: PORTS.LIGHTHOUSE,
    smokeTest: PORTS.SMOKE_TEST,
  };
  return serviceMap[service] || PORTS.DEFAULT_DEV;
};

/**
 * Get localhost URL for a service
 */
export const getLocalhost = (service = 'main') => {
  const serviceMap = {
    main: LOCALHOST.MAIN,
    vite: LOCALHOST.VITE,
    http: LOCALHOST.HTTP,
    workers: LOCALHOST.WORKERS,
  };
  return serviceMap[service] || LOCALHOST.MAIN;
};

/**
 * Check if environment is development
 */
export const isDevelopment = (env = process.env.NODE_ENV) => {
  return env === ENVIRONMENTS.DEVELOPMENT;
};

/**
 * Check if environment is production
 */
export const isProduction = (env = process.env.NODE_ENV) => {
  return env === ENVIRONMENTS.PRODUCTION;
};

/**
 * Get Lighthouse thresholds
 */
export const getLighthouseThresholds = () => ({
  performance: PERFORMANCE.LIGHTHOUSE.PERFORMANCE,
  accessibility: PERFORMANCE.LIGHTHOUSE.ACCESSIBILITY,
  'best-practices': PERFORMANCE.LIGHTHOUSE.BEST_PRACTICES,
  seo: PERFORMANCE.LIGHTHOUSE.SEO,
});

/**
 * Get Web Vitals thresholds
 */
export const getWebVitalsThresholds = () => ({
  lcp: PERFORMANCE.WEB_VITALS.LCP,
  fid: PERFORMANCE.WEB_VITALS.FID,
  cls: PERFORMANCE.WEB_VITALS.CLS,
  fcp: PERFORMANCE.WEB_VITALS.FCP,
  ttfb: PERFORMANCE.WEB_VITALS.TTFB,
});

// ============================================================================
// EXPORT DEFAULTS
// ============================================================================

export default {
  ENVIRONMENTS,
  PORTS,
  LOCALHOST,
  THEME_MODES,
  THEME_COLORS,
  LOCALES,
  PERFORMANCE,
  PAGES,
  CONFIG_EXTENSIONS,
  FEATURES,
  EXPERIMENT_MODES,
  BUILD,
  HTTP_CODES,
  ERROR_MESSAGES,
  VALIDATION,
  PATTERNS,
  // Utility functions
  getEnvironmentConfig,
  getServicePort,
  getLocalhost,
  isDevelopment,
  isProduction,
  getLighthouseThresholds,
  getWebVitalsThresholds,
};
