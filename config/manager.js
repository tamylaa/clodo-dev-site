/**
 * Configuration Management System
 *
 * Industry-standard approach: Configuration as a service with hot reloading
 * Benefits: Runtime config updates, environment management, caching
 */

import { readFileSync, existsSync, watchFile } from 'fs';
import { join, extname } from 'path';
import { EventEmitter } from 'events';
import { CONFIG_EXTENSIONS } from '../lib/constants-extended.js';

// Configuration file types
const CONFIG_LOADERS = {
  [CONFIG_EXTENSIONS.JSON]: (filePath) => JSON.parse(readFileSync(filePath, 'utf8')),
  [CONFIG_EXTENSIONS.JS]: async (filePath) => {
    const module = await import(filePath);
    return module.default || module;
  },
  [CONFIG_EXTENSIONS.TS]: async (filePath) => {
    // For TypeScript, we'd need a transpiler, but for now assume compiled
    const module = await import(filePath.replace('.ts', '.js'));
    return module.default || module;
  },
  [CONFIG_EXTENSIONS.MJS]: async (filePath) => {
    const module = await import(filePath);
    return module.default || module;
  },
  [CONFIG_EXTENSIONS.TOML]: async (filePath) => {
    const toml = require('@iarna/toml');
    return toml.parse(readFileSync(filePath, 'utf8'));
  }
};

import { ENVIRONMENTS } from '../lib/constants-extended.js';

class ConfigManager extends EventEmitter {
  constructor(configDir = 'config', environment = ENVIRONMENTS.DEVELOPMENT) {
    super();
    this.configCache = new Map();
    this.watchers = new Map();
    this.environment = environment;
    this.configDir = configDir;
  }

  /**
   * Load configuration file with caching and environment overrides
   */
  async loadConfig(name, defaultValue = {}) {
    const cacheKey = `${name}:${this.environment}`;

    // Check cache first
    if (this.configCache.has(cacheKey)) {
      return this.configCache.get(cacheKey);
    }

    // Try environment-specific file first
    let config = await this.loadConfigFile(`${name}.${this.environment}`);

    // Fall back to base config file
    if (!config) {
      config = await this.loadConfigFile(name);
    }

    // Apply default values
    const finalConfig = { ...defaultValue, ...config };

    // Cache the result
    this.configCache.set(cacheKey, finalConfig);

    // Set up file watching for hot reloading
    this.watchConfigFile(name);

    return finalConfig;
  }

  /**
   * Load a specific config file
   */
  async loadConfigFile(baseName) {
    for (const ext of CONFIG_EXTENSIONS.ALL) {
      const filePath = join(process.cwd(), this.configDir, `${baseName}${ext}`);

      if (existsSync(filePath)) {
        try {
          const loader = CONFIG_LOADERS[ext];
          const config = await loader(filePath);

          // Apply environment variable overrides
          return this.applyEnvironmentOverrides(config, baseName);
        } catch (error) {
          console.warn(`Failed to load config file ${filePath}:`, error);
        }
      }
    }

    return null;
  }

  /**
   * Apply environment variable overrides
   */
  applyEnvironmentOverrides(config, configName) {
    const result = { ...config };
    const prefix = `${configName.toUpperCase()}_`;

    // Recursively apply overrides
    const applyOverrides = (obj, path = []) => {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = [...path, key];
        const envKey = prefix + fullPath.join('_').toUpperCase();
        const envValue = process.env[envKey];

        if (envValue !== undefined) {
          // Try to parse as JSON, otherwise use as string
          try {
            obj[key] = JSON.parse(envValue);
          } catch {
            obj[key] = envValue;
          }
        } else if (typeof value === 'object' && value !== null) {
          applyOverrides(value, fullPath);
        }
      }
    };

    applyOverrides(result);
    return result;
  }

  /**
   * Watch config file for changes (hot reloading)
   */
  watchConfigFile(name) {
    if (this.watchers.has(name)) return;

    for (const ext of CONFIG_EXTENSIONS.ALL) {
      const filePath = join(process.cwd(), this.configDir, `${name}${ext}`);

      if (existsSync(filePath)) {
        const watcher = watchFile(filePath, { interval: 1000 }, () => {
          // Clear cache for this config
          this.configCache.clear();

          // Emit change event
          this.emit('configChanged', { name, filePath });
        });

        this.watchers.set(name, watcher);
        break;
      }
    }
  }

  /**
   * Get all loaded configurations
   */
  getAllConfigs() {
    const result = {};
    for (const [key, value] of this.configCache.entries()) {
      const [name] = key.split(':');
      result[name] = value;
    }
    return result;
  }

  /**
   * Reload all configurations
   */
  async reloadAll() {
    this.configCache.clear();
    this.emit('configsReloaded');
  }

  /**
   * Set environment (triggers config reload)
   */
  setEnvironment(environment) {
    this.environment = environment;
    this.reloadAll();
  }

  /**
   * Clean up watchers
   */
  async destroy() {
    for (const [name, watcher] of this.watchers.entries()) {
      // In Node.js, unwatchFile doesn't take a watcher object
      // We need to unwatch each file individually
      for (const ext of CONFIG_EXTENSIONS.ALL) {
        const filePath = join(process.cwd(), this.configDir, `${name}${ext}`);
        try {
          const fs = await import('fs');
          fs.unwatchFile(filePath);
        } catch (error) {
          // Ignore errors during cleanup
        }
      }
    }
    this.watchers.clear();
    this.configCache.clear();
  }
}

// Global config manager instance
export const configManager = new ConfigManager();

// Convenience functions
export const loadConfig = (name, defaultValue) =>
  configManager.loadConfig(name, defaultValue);

export const getAllConfigs = () => configManager.getAllConfigs();

export const reloadConfigs = () => configManager.reloadAll();

export const setEnvironment = (env) => configManager.setEnvironment(env);

// Event handling
export const onConfigChange = (callback) => {
  configManager.on('configChanged', callback);
};

export const onConfigsReloaded = (callback) => {
  configManager.on('configsReloaded', callback);
};