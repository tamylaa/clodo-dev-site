# Configuration System Best Practices

## Overview

This configuration system follows industry standards for scalable, maintainable, and feature-rich application configuration. It supports TOML format, JSON Schema validation, localization, personalization, and hot reloading.

## Architecture

```
config/
├── index.js           # Main unified config (with TOML + validation)
├── manager.js         # Advanced config management system
├── validation.js      # JSON Schema validation
├── i18n.js           # Internationalization
├── personalization.js # User personalization & A/B testing
├── types.d.ts        # TypeScript definitions
├── locales/          # Translation files
│   ├── en.json
│   ├── es.json
│   └── fr.json
├── experiments.json  # A/B testing configuration
├── personalization.json # Personalization rules
├── *.schema.json     # JSON Schema validation files
└── *.toml            # TOML format configs (preferred)
```

## ✅ **NEW: TOML Support & Validation**

### TOML Configuration Files
TOML (Tom's Obvious Minimal Language) is now the **preferred format** for configuration:

```toml
# config/site.toml
[site]
name = "Clodo Framework"
description = "Build serverless applications with ease"

[site.urls]
production = "https://www.clodo.dev"
development = "http://localhost:8000"

[theme.colors.brand]
primary = "#1d4ed8"
secondary = "#7c3aed"
```

**Why TOML?**
- ✅ Human-readable (better than JSON)
- ✅ Supports comments and complex structures
- ✅ Industry standard (Rust, Hugo, Python, Go)
- ✅ Type-safe by design

### JSON Schema Validation
All config files are automatically validated against schemas:

```json
// config/theme.schema.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "properties": {
    "colors": {
      "properties": {
        "brand": {
          "properties": {
            "primary": { "pattern": "^#[0-9a-fA-F]{6}$" }
          }
        }
      }
    }
  }
}
```

**Benefits:**
- ✅ Runtime validation prevents config errors
- ✅ IDE autocompletion and error detection
- ✅ Documentation of config structure
- ✅ Type safety without TypeScript compilation

### Loading Priority
1. **TOML files** (preferred)
2. **JSON files** (compatibility)
3. **JavaScript files** (dynamic configs)
4. **Environment variables** (overrides)
5. **Defaults** (fallbacks)

## File Format Recommendations

### 1. **TOML for Complex Configurations** (Recommended)
```toml
# config/site.config.toml
[site]
name = "Clodo Framework"
description = "Build serverless applications with ease"

[site.urls]
production = "https://www.clodo.dev"
development = "http://localhost:8000"

[theme.colors.brand]
primary = "#1d4ed8"
secondary = "#7c3aed"

[navigation.main]
[[navigation.main.items]]
label = "Home"
href = "/"

[[navigation.main.items]]
label = "Docs"
href = "/docs"
```

**Why TOML?**
- Human-readable
- Supports nested structures
- Better than JSON for config files
- Comments support
- Type safety

### 2. **JSON for Simple Data Structures**
```json
{
  "colors": {
    "brand": {
      "primary": "#1d4ed8",
      "secondary": "#7c3aed"
    }
  }
}
```

### 3. **JavaScript for Dynamic Configurations**
```javascript
// Only when you need computation or environment-specific logic
export default {
  apiUrl: process.env.NODE_ENV === 'production'
    ? 'https://api.clodo.dev'
    : 'http://localhost:3001'
};
```

## Internationalization (i18n)

### Usage

### Basic Configuration
```javascript
import { config } from './config/index.js';

// Access configuration
console.log(config.site.name);        // From TOML or JSON
console.log(config.theme.colors);     // Theme configuration
console.log(config.navigation.main);  // Navigation structure
```

### TOML Configuration
```toml
# config/site.toml
[site]
name = "My App"
description = "Description from TOML"

[features]
darkMode = true
analytics = true
```

### JSON Schema Validation
```javascript
// Automatic validation on load
import { config } from './config/index.js';
// Validation errors are logged but don't break the app
```

### Environment Overrides
```bash
# Override any config value
SITE_NAME="Production App" npm start
THEME_COLORS_BRAND_PRIMARY="#ff0000" npm start
```

### Feature Flags
```javascript
import { isFeatureEnabled } from './config/index.js';

if (isFeatureEnabled('darkMode')) {
  // Enable dark mode
}
```

### Internationalization (i18n)
```javascript
import { t, getCurrentLocale, setCurrentLocale } from './config/i18n.js';

// Get translated text
const title = t('site.name');
const navLabel = t('navigation.home');

// Change locale
setCurrentLocale('es');
```

### Translation Files
```json
// config/locales/es.json
{
  "site": {
    "name": "Clodo Framework",
    "description": "Construye aplicaciones serverless con facilidad"
  },
  "navigation": {
    "home": "Inicio",
    "docs": "Documentación"
  }
}
```

## Personalization & A/B Testing

### User Profiles
```javascript
import { getUserProfile, updateUserProfile } from './config/personalization.js';

const user = getUserProfile();
updateUserProfile({
  preferences: {
    theme: 'dark',
    language: 'es'
  }
});
```

### Experiments Configuration
```json
// config/experiments.json
{
  "hero_button_color": {
    "name": "Hero Button Color Test",
    "variants": [
      { "id": "blue", "name": "Blue", "weight": 50 },
      { "id": "green", "name": "Green", "weight": 50 }
    ]
  }
}
```

## Configuration Management

### Hot Reloading
```javascript
import { configManager, onConfigChange } from './config/manager.js';

// Listen for config changes
onConfigChange(({ name, filePath }) => {
  console.log(`Config ${name} changed at ${filePath}`);
  // Trigger UI updates or service restarts
});
```

### Environment Overrides
```bash
# Environment variables override config values
THEME_COLORS_BRAND_PRIMARY="#ff0000"
NAVIGATION_MAIN_0_LABEL="Custom Home"
```

## Validation & Type Safety

### Schema Validation
```javascript
import { validateConfig } from './config/validation.js';

const result = validateConfig(themeConfig, 'theme');
if (!result.valid) {
  console.error('Config validation failed:', result.errors);
}
```

### TypeScript Support
```typescript
import type { Config, ThemeConfig } from './config/types.d.ts';

const config: Config = loadConfig('site');
const theme: ThemeConfig = config.theme;
```

## Migration Guide

### From Current System
```javascript
// OLD: Multiple imports
import theme from './theme.json';
import nav from './navigation.json';

// NEW: Single import with types
import { config } from './config/manager.js';
const { theme, navigation } = config;
```

### Adding Localization
1. Create locale files in `config/locales/`
2. Use `t()` function for translations
3. Add locale routing if needed

### Adding Personalization
1. Define experiments in `config/experiments.json`
2. Create personalization rules in `config/personalization.json`
3. Use `getPersonalizedConfig()` to get user-specific config

## Best Practices

### 1. **Use TOML for New Configs**
- Better readability than JSON
- Supports comments
- Type-safe by default

### 2. **Environment-Specific Configs**
```
config/
├── database.config.toml      # Base config
├── database.production.toml  # Production overrides
└── database.staging.toml     # Staging overrides
```

### 3. **Validation First**
Always validate configs before using them:
```javascript
const config = await loadConfig('theme');
const validation = validateConfig(config, 'theme');
if (!validation.valid) throw new Error('Invalid theme config');
```

### 4. **Type Safety**
Use TypeScript interfaces for all config objects to catch errors at compile time.

### 5. **Feature Flags Over Config Branches**
Instead of:
```javascript
const apiUrl = isNewApi ? 'new.api.com' : 'old.api.com';
```
Use:
```javascript
const apiUrl = config.api.url; // Controlled by feature flags
```

### 6. **Configuration as Code**
For complex logic, use JavaScript configs, but prefer declarative formats when possible.

## Performance Considerations

- Configs are cached in memory
- Hot reloading only in development
- Lazy loading for large configs
- CDN-friendly static configs

## Security

- Never store secrets in config files
- Use environment variables for sensitive data
- Validate all user-provided config values
- Sanitize localization keys to prevent injection

## Testing

```javascript
// Test config loading
describe('Config System', () => {
  it('should load valid theme config', async () => {
    const config = await loadConfig('theme');
    expect(validateConfig(config, 'theme').valid).toBe(true);
  });

  it('should support localization', () => {
    expect(t('site.name', 'es')).toBe('Clodo Framework');
  });
});
```</content>
<parameter name="filePath">g:\coding\clodo-web-starter\config\README.md