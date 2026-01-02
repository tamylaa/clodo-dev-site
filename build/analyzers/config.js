/**
 * Analyzers Configuration
 * Module-specific configuration for analyzer tools
 * Extends global configuration with analyzer-specific settings
 */

import { GLOBAL_CONFIG } from '../global-config.js';

export const ANALYZER_CONFIG = {
  // Inherit global URLs and ports
  urls: GLOBAL_CONFIG.site,
  ports: GLOBAL_CONFIG.ports,

  // Analyzer-specific timeouts (override global where needed)
  timeouts: {
    ...GLOBAL_CONFIG.analyzers.timeouts,
    pageLoad: GLOBAL_CONFIG.build.timeouts.pageLoad
  },

  // File configurations
  files: GLOBAL_CONFIG.analyzers.files,

  // SEO analysis settings
  seo: GLOBAL_CONFIG.analyzers.seo,

  // Content analysis settings
  content: GLOBAL_CONFIG.analyzers.content,

  // External service configurations
  webpagetest: GLOBAL_CONFIG.analyzers.webpagetest,
  lighthouse: GLOBAL_CONFIG.analyzers.lighthouse,

  // Testing configurations
  smokeTest: GLOBAL_CONFIG.analyzers.smokeTest,

  // Validation rules
  validation: GLOBAL_CONFIG.validation,

  // Size and performance limits
  limits: {
    gitDiffBuffer: GLOBAL_CONFIG.build.limits.gitBuffer,
    mutationLogLimit: 50
  }
};

// Re-export helper functions for convenience
export { getBaseUrl, isDevelopment, getPort, getApiUrl, getFullUrl } from '../global-config.js';