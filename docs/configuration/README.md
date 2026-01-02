# ⚙️ Configuration System

## Overview

Clodo Framework features an enterprise-grade configuration system designed for production safety, developer experience, and scalability. The system supports multiple formats, comprehensive validation, and advanced features like A/B testing and personalization.

## 🏗️ Architecture

### Format Priority
Configurations are loaded in this order of preference:
1. **TOML** (`.toml`) - Preferred for complex configurations
2. **JSON** (`.json`) - Fallback for structured data
3. **JavaScript** (`.js`) - Fallback for dynamic configurations
4. **Defaults** - Built-in fallback values

### Validation Layer
- **JSON Schema** validation for all config files
- **Graceful error handling** - logs warnings without breaking the application
- **Comprehensive coverage** - validates theme, navigation, pages, experiments, and personalization

### Advanced Features
- **Environment overrides** - runtime configuration via environment variables
- **Hot reloading** - automatic config updates in development
- **Health monitoring** - proactive issue detection and reporting
- **Migration utilities** - automated format conversions

## 📁 Configuration Files

### Core Configuration
- `config/site.toml` - Main site configuration (TOML format)
- `config/theme.json` - Theme and styling configuration
- `config/navigation.json` - Navigation structure and links
- `config/pages.config.json` - Page-specific configurations and bundles

### Advanced Configuration
- `config/experiments.json` - A/B testing and experimentation
- `config/personalization.json` - User personalization rules

### Validation Schemas
- `config/theme.schema.json` - Theme configuration validation
- `config/navigation.schema.json` - Navigation validation
- `config/pages.schema.json` - Pages configuration validation
- `config/experiments.schema.json` - Experiments validation
- `config/personalization.schema.json` - Personalization validation

## 🚀 Usage

### Loading Configuration
```javascript
import { loadConfig } from './config/index.js';

// Load all configurations
const config = await loadConfig();

// Access specific config sections
console.log(config.site.title);
console.log(config.theme.colors.primary);
```

### Validation
```javascript
import { validateConfig } from './config/validation.js';

// Validate a specific config
const result = await validateConfig('theme');
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

### Health Monitoring
```javascript
import { runConfigHealthCheck } from './config/health.js';

// Run comprehensive health check
const healthReport = await runConfigHealthCheck();
console.log('Config health:', healthReport.status);
```

### Migration Utilities
```javascript
import { migrateConfigToTOML } from './config/migration.js';

// Migrate JSON config to TOML
await migrateConfigToTOML('theme', { backup: true });
```

## 📋 Configuration Formats

### TOML Format (Recommended)
```toml
[site]
title = "My Site"
description = "Site description"

[theme.colors]
primary = "#1d4ed8"
secondary = "#64748b"

[navigation]
layout = "left"
```

### JSON Format
```json
{
  "site": {
    "title": "My Site",
    "description": "Site description"
  },
  "theme": {
    "colors": {
      "primary": "#1d4ed8",
      "secondary": "#64748b"
    }
  }
}
```

## 🔧 Environment Overrides

Override any configuration value using environment variables:

```bash
# Override site title
CLODO_SITE_TITLE="Production Site"

# Override theme color
CLODO_THEME_COLORS_PRIMARY="#ff0000"

# Override navigation layout
CLODO_NAVIGATION_LAYOUT="center"
```

## 🧪 A/B Testing Configuration

```json
{
  "hero_button_color": {
    "name": "Hero Button Color Test",
    "description": "Test different button colors",
    "variants": [
      {
        "id": "blue",
        "name": "Blue (Control)",
        "weight": 50,
        "config": {
          "theme": {
            "colors": {
              "brand": {
                "primary": "#1d4ed8"
              }
            }
          }
        }
      }
    ],
    "targetSegments": ["all"],
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  }
}
```

## 🎯 Personalization Rules

```json
[
  {
    "id": "power_users",
    "condition": "user.segments.includes('power_user')",
    "config": {
      "features": {
        "advanced_analytics": true,
        "priority_support": true
      }
    },
    "priority": 10
  }
]
```

## 🔍 Health Monitoring

The configuration system includes built-in health monitoring:

```javascript
const report = await runConfigHealthCheck();

console.log('Status:', report.status);
console.log('Files loaded:', report.metrics.configsLoaded);
console.log('Validation errors:', report.metrics.validationErrors);
console.log('Recommendations:', report.recommendations);
```

## 📊 Validation Schemas

All configuration files are validated against JSON Schemas to prevent runtime errors:

- **Type safety** - ensures correct data types
- **Required fields** - validates mandatory configuration
- **Pattern matching** - validates string formats (colors, URLs, etc.)
- **Range validation** - ensures numeric values are within bounds

## 🔄 Migration Guide

### Converting JSON to TOML

```javascript
// Migrate single config
await migrateConfigToTOML('theme');

// Migrate multiple configs
await batchMigrateConfigs(['theme', 'navigation', 'pages.config']);
```

### Benefits of TOML Migration
- **Better readability** for complex nested configurations
- **Smaller file sizes** for large configurations
- **Industry standard** format for configuration management
- **Better tooling support** in editors and CI/CD

## 🛠️ Development Tools

### Validation Testing
```bash
# Test all configurations
node -e "
const { validateConfig } = require('./config/validation.js');
const configs = ['theme', 'navigation', 'pages.config', 'experiments', 'personalization'];
configs.forEach(async (config) => {
  const result = await validateConfig(config);
  console.log(config + ':', result.valid ? '✅ Valid' : '❌ Invalid');
});
"
```

### Health Check
```bash
# Run health check
node -e "
const { runConfigHealthCheck } = require('./config/health.js');
runConfigHealthCheck().then(report => console.log(report));
"
```

## 📈 Best Practices

1. **Use TOML for complex configurations** - better readability and maintainability
2. **Always validate configurations** - catch errors early in development
3. **Use environment overrides** - keep sensitive data out of code
4. **Regular health checks** - monitor configuration health in production
5. **Schema-first development** - define schemas before implementing features
6. **Version control configurations** - track configuration changes over time

## 🚨 Troubleshooting

### Common Issues

**Configuration not loading**
- Check file format and syntax
- Verify file permissions
- Ensure correct file extensions (.toml, .json, .js)

**Validation errors**
- Run validation manually to see specific errors
- Check schema definitions for required fields
- Verify data types match schema expectations

**Environment overrides not working**
- Check environment variable naming (CLODO_PREFIX)
- Ensure variables are set before application startup
- Verify variable values are valid for their types

### Debug Mode
Enable debug logging for configuration issues:
```bash
DEBUG=config node your-app.js
```

## 📚 API Reference

### Core Functions
- `loadConfig()` - Load all configurations with validation
- `validateConfig(name)` - Validate specific configuration
- `runConfigHealthCheck()` - Run comprehensive health check
- `migrateConfigToTOML(name, options)` - Migrate config to TOML format

### Utility Functions
- `getConfigHealthReport()` - Get current health status
- `getMigrationRecommendations()` - Get migration suggestions
- `batchMigrateConfigs(configs, options)` - Batch migrate multiple configs

This configuration system provides enterprise-grade reliability while maintaining developer productivity and ease of use.