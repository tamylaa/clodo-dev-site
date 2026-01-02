/**
 * Configuration Migration Utilities
 *
 * Industry-standard approach: Automated migration tools for config format upgrades
 * Benefits: Smooth transitions, backward compatibility, developer productivity
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, extname } from 'path';
import { stringify } from '@iarna/toml';

class ConfigMigrationTool {
  constructor(configDir = 'config') {
    this.configDir = configDir;
    this.migrationLog = [];
  }

  /**
   * Migrate JSON config to TOML format
   */
  async migrateToTOML(configName, options = {}) {
    const {
      backup = true,
      validate = true,
      dryRun = false
    } = options;

    const jsonPath = join(process.cwd(), this.configDir, `${configName}.json`);
    const tomlPath = join(process.cwd(), this.configDir, `${configName}.toml`);

    if (!existsSync(jsonPath)) {
      throw new Error(`Source JSON file not found: ${jsonPath}`);
    }

    if (existsSync(tomlPath) && !options.force) {
      throw new Error(`TOML file already exists: ${tomlPath}`);
    }

    console.log(`🔄 Migrating ${configName}.json to TOML format...`);

    // Read JSON config
    const jsonContent = readFileSync(jsonPath, 'utf8');
    let configData;

    try {
      configData = JSON.parse(jsonContent);
    } catch (error) {
      throw new Error(`Invalid JSON in ${configName}.json: ${error.message}`);
    }

    // Validate if requested
    if (validate) {
      await this.validateConfig(configName, configData);
    }

    // Convert to TOML
    const tomlContent = this.convertToTOML(configData);

    if (dryRun) {
      console.log('📋 Dry run - would create:', tomlPath);
      console.log('📄 TOML content preview:');
      console.log(tomlContent.substring(0, 500) + (tomlContent.length > 500 ? '...' : ''));
      return { success: true, dryRun: true };
    }

    // Backup original if requested
    if (backup) {
      const backupPath = `${jsonPath}.backup`;
      writeFileSync(backupPath, jsonContent);
      this.migrationLog.push(`Backed up ${configName}.json to ${backupPath}`);
    }

    // Write TOML file
    writeFileSync(tomlPath, tomlContent);

    this.migrationLog.push(`Migrated ${configName}.json to ${configName}.toml`);

    console.log(`✅ Migration completed: ${configName}.toml created`);

    return {
      success: true,
      from: jsonPath,
      to: tomlPath,
      backup: backup ? `${jsonPath}.backup` : null
    };
  }

  /**
   * Convert JavaScript object to TOML string
   */
  convertToTOML(data) {
    // TOML has some limitations, so we need to handle special cases
    const processed = this.preprocessForTOML(data);
    return stringify(processed);
  }

  /**
   * Preprocess data for TOML compatibility
   */
  preprocessForTOML(data) {
    if (Array.isArray(data)) {
      return data.map(item => this.preprocessForTOML(item));
    }

    if (data === null || data === undefined) {
      return null;
    }

    if (typeof data === 'object') {
      const processed = {};

      for (const [key, value] of Object.entries(data)) {
        // TOML keys should be valid identifiers
        const tomlKey = this.sanitizeTOMLKey(key);
        processed[tomlKey] = this.preprocessForTOML(value);
      }

      return processed;
    }

    return data;
  }

  /**
   * Sanitize key for TOML compatibility
   */
  sanitizeTOMLKey(key) {
    // Replace invalid characters with underscores
    return key.replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  /**
   * Validate config against schema
   */
  async validateConfig(configName, data) {
    try {
      const { validateConfig } = await import('./validation.js');
      const result = await validateConfig(configName, data);

      if (!result.valid) {
        const errors = result.errors.map(err => `${err.instancePath}: ${err.message}`).join('; ');
        throw new Error(`Validation failed: ${errors}`);
      }
    } catch (error) {
      if (error.message.includes('Validation failed')) {
        throw error;
      }
      // If validation module doesn't exist, skip validation
      console.warn('⚠️  Validation skipped - validation module not available');
    }
  }

  /**
   * Batch migrate multiple configs
   */
  async batchMigrate(configs, options = {}) {
    const results = [];
    const errors = [];

    for (const configName of configs) {
      try {
        const result = await this.migrateToTOML(configName, { ...options, dryRun: false });
        results.push(result);
      } catch (error) {
        errors.push({ config: configName, error: error.message });
        console.error(`❌ Failed to migrate ${configName}:`, error.message);
      }
    }

    return {
      successful: results.length,
      failed: errors.length,
      results,
      errors
    };
  }

  /**
   * Get migration recommendations
   */
  getMigrationRecommendations() {
    const recommendations = [];
    const jsonFiles = this.findJSONConfigs();

    if (jsonFiles.length > 0) {
      recommendations.push(`Consider migrating ${jsonFiles.length} JSON configs to TOML format for better maintainability`);
    }

    // Check file sizes
    const largeFiles = jsonFiles.filter(file => {
      const filePath = join(process.cwd(), this.configDir, file);
      return existsSync(filePath) && readFileSync(filePath, 'utf8').length > 10000; // 10KB
    });

    if (largeFiles.length > 0) {
      recommendations.push(`Large JSON files detected: ${largeFiles.join(', ')} - TOML would be more readable`);
    }

    return recommendations;
  }

  /**
   * Find all JSON config files
   */
  findJSONConfigs() {
    const fs = require('fs');
    const files = fs.readdirSync(join(process.cwd(), this.configDir));
    return files
      .filter(file => file.endsWith('.json') && !file.endsWith('.schema.json'))
      .map(file => file.replace('.json', ''));
  }

  /**
   * Get migration log
   */
  getMigrationLog() {
    return this.migrationLog;
  }

  /**
   * Clean up backup files
   */
  cleanupBackups() {
    const fs = require('fs');
    const files = fs.readdirSync(join(process.cwd(), this.configDir));
    const backups = files.filter(file => file.endsWith('.backup'));

    for (const backup of backups) {
      const backupPath = join(process.cwd(), this.configDir, backup);
      fs.unlinkSync(backupPath);
      console.log(`🗑️  Removed backup: ${backup}`);
    }

    return backups.length;
  }
}

// Global migration tool instance
export const configMigrationTool = new ConfigMigrationTool();

// Convenience functions
export const migrateConfigToTOML = (configName, options) =>
  configMigrationTool.migrateToTOML(configName, options);

export const batchMigrateConfigs = (configs, options) =>
  configMigrationTool.batchMigrate(configs, options);

export const getMigrationRecommendations = () =>
  configMigrationTool.getMigrationRecommendations();