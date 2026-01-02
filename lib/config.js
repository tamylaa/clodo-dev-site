/**
 * Configuration Manager
 * Loads, validates, and provides access to Clodo Framework configuration
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

export class ConfigManager {
  constructor(configPath = 'clodo.config.js') {
    this.configPath = resolve(configPath);
    this.config = null;
    this.environment = process.env.NODE_ENV || process.env.CLODO_ENV || 'development';
  }

  /**
   * Initialize the configuration manager
   */
  async initialize() {
    await this.loadConfig();
    return this;
  }

  /**
   * Load configuration from file
   */
  async loadConfig() {
    try {
      if (!existsSync(this.configPath)) {
        throw new Error(`Configuration file not found: ${this.configPath}`);
      }

      // Clear require cache to allow hot reloading in development
      // Note: In ES modules, cache clearing is handled differently
      if (this.environment === 'development') {
        // For ES modules, we could implement cache clearing if needed
        // but for now, we'll skip it as dynamic imports handle this
      }

      // Import the configuration
      const configUrl = pathToFileURL(this.configPath);
      const configModule = await import(configUrl.href);
      this.config = configModule.default || configModule;

      // Apply environment overrides
      this.applyEnvironmentOverrides();

      // Validate configuration
      this.validateConfig();

      console.log(`✅ Configuration loaded from ${this.configPath}`);
    } catch (error) {
      console.error(`❌ Failed to load configuration: ${error.message}`);
      throw error;
    }
  }

  /**
   * Apply environment-specific overrides
   */
  applyEnvironmentOverrides() {
    const overrides = this.get('advanced.overrides', {});
    const envOverrides = overrides[this.environment];

    if (envOverrides) {
      console.log(`🔄 Applying ${this.environment} environment overrides`);
      this.config = this.deepMerge(this.config, envOverrides);
    }
  }

  /**
   * Validate configuration structure
   */
  validateConfig() {
    const requiredSections = ['site', 'content', 'build', 'deploy', 'features'];

    for (const section of requiredSections) {
      if (!this.config[section]) {
        throw new Error(`Missing required configuration section: ${section}`);
      }
    }

    // Validate site configuration
    if (!this.config.site.name || !this.config.site.domain) {
      throw new Error('Site name and domain are required');
    }

    // Validate content type
    const validContentTypes = ['blog', 'docs', 'portfolio', 'landing', 'business'];
    if (!validContentTypes.includes(this.config.content.type)) {
      throw new Error(`Invalid content type: ${this.config.content.type}. Must be one of: ${validContentTypes.join(', ')}`);
    }

    // Validate deployment platform
    const validPlatforms = ['cloudflare-pages', 'cloudflare-workers', 'static', 'netlify', 'vercel'];
    if (!validPlatforms.includes(this.config.deploy.platform)) {
      throw new Error(`Invalid deployment platform: ${this.config.deploy.platform}. Must be one of: ${validPlatforms.join(', ')}`);
    }

    console.log('✅ Configuration validation passed');
  }

  /**
   * Get configuration value by path
   * @param {string} path - Dot-separated path (e.g., 'site.name')
   * @param {*} defaultValue - Default value if path not found
   * @returns {*} Configuration value
   */
  get(path, defaultValue = null) {
    return this.getNestedValue(this.config, path) || defaultValue;
  }

  /**
   * Set configuration value by path
   * @param {string} path - Dot-separated path
   * @param {*} value - Value to set
   */
  set(path, value) {
    this.setNestedValue(this.config, path, value);
  }

  /**
   * Get nested value from object
   * @param {object} obj - Object to search
   * @param {string} path - Dot-separated path
   * @returns {*} Value at path or undefined
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Set nested value in object
   * @param {object} obj - Object to modify
   * @param {string} path - Dot-separated path
   * @param {*} value - Value to set
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Deep merge two objects
   * @param {object} target - Target object
   * @param {object} source - Source object
   * @returns {object} Merged object
   */
  deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  // ============================================
  // CONVENIENCE METHODS
  // ============================================

  /**
   * Get site configuration
   */
  getSite() {
    return this.config.site;
  }

  /**
   * Get content configuration
   */
  getContent() {
    return this.config.content;
  }

  /**
   * Get build configuration
   */
  getBuild() {
    return this.config.build;
  }

  /**
   * Get deployment configuration
   */
  getDeploy() {
    return this.config.deploy;
  }

  /**
   * Get current environment configuration
   */
  getEnvironmentConfig() {
    return this.config.deploy.environments[this.environment] || {};
  }

  /**
   * Get features configuration
   */
  getFeatures() {
    return this.config.features;
  }

  /**
   * Get integrations configuration
   */
  getIntegrations() {
    return this.config.integrations;
  }

  /**
   * Check if feature is enabled
   * @param {string} feature - Feature name
   * @returns {boolean} Whether feature is enabled
   */
  isFeatureEnabled(feature) {
    return this.get(`features.${feature}`, false);
  }

  /**
   * Get current environment
   */
  getEnvironment() {
    return this.environment;
  }

  /**
   * Check if running in production
   */
  isProduction() {
    return this.environment === 'production';
  }

  /**
   * Check if running in development
   */
  isDevelopment() {
    return this.environment === 'development';
  }

  /**
   * Reload configuration (useful for development)
   */
  reload() {
    console.log('🔄 Reloading configuration...');
    this.loadConfig();
  }

  /**
   * Export configuration for debugging
   */
  export() {
    return {
      environment: this.environment,
      configPath: this.configPath,
      config: this.config
    };
  }
}

// Default export for convenience
export default ConfigManager;