# Unified Configuration System

This document describes the new unified configuration architecture that consolidates all project configuration into a single, logical system.

## 🎯 Overview

The project previously had configuration scattered across multiple files with overlapping concerns and inconsistent patterns. The new unified system provides:

- **Single source of truth** for all configuration
- **Clear separation** between runtime and build-time config
- **Environment-aware** settings with proper overrides
- **Feature flag system** for gradual rollouts
- **Backward compatibility** with existing code

## 📁 Configuration Hierarchy

```
config/
├── index.js           # Main unified config (NEW)
├── site.config.js     # Site identity & branding
├── tooling.config.js  # Build & tooling settings
├── theme.json         # Design system
├── navigation.json    # Navigation structure
├── pages.config.json  # Page-to-CSS mappings
└── features.js        # Feature flags (in public/js/config/)
```

## 🚀 Usage

### Runtime Configuration (Client + Server)

```javascript
import { config, getBaseUrl, isFeatureEnabled } from './config/index.js';

// Access site settings
console.log(config.site.name); // "Clodo Framework"
console.log(config.site.url);  // "https://www.clodo.dev"

// Get environment-aware URLs
const baseUrl = getBaseUrl(); // Auto-detects environment

// Check feature flags
if (isFeatureEnabled('DARK_MODE')) {
  // Enable dark mode
}
```

### Build-Time Configuration

```javascript
import { buildConfig, getBuildConfig } from './config/index.js';

// Access Cloudflare settings
const accountId = buildConfig.tooling.cloudflare.accountId;

// Get testing configuration
const testUrl = getBuildConfig('testing.baseUrl');
```

### Feature Flags

```javascript
import { features, isFeatureEnabled } from './config/index.js';

// Check if feature is enabled
if (isFeatureEnabled('ES6_MODULES')) {
  // Use ES6 modules
}

// Get feature configuration
const config = features.getFeatureConfig('DARK_MODE');
```

## 🔧 Configuration Sections

### Runtime Config (`config`)

| Section | Purpose | Example |
|---------|---------|---------|
| `site` | Site identity, URLs, branding | `config.site.name` |
| `theme` | Design system (colors, typography) | `config.theme.colors` |
| `navigation` | Header/footer navigation | `config.navigation.header` |
| `pages` | Page-to-CSS bundle mappings | `config.pages.pageBundles` |
| `social` | Social media links | `config.social.twitter.url` |
| `contact` | Contact information | `config.contact.email` |
| `services` | Analytics, newsletter, chat | `config.services.analytics` |
| `pwa` | PWA manifest settings | `config.pwa.themeColor` |
| `seo` | SEO metadata & settings | `config.seo.title.default` |
| `build` | Build output settings | `config.build.outDir` |
| `environment` | Current environment info | `config.environment.isProduction` |

### Build Config (`buildConfig`)

| Section | Purpose | Example |
|---------|---------|---------|
| `tooling` | Cloudflare, URLs, testing | `buildConfig.tooling.cloudflare` |
| `analytics` | Analytics configuration | `buildConfig.analytics.googleAnalyticsId` |
| `deployment` | Deployment settings | `buildConfig.deployment.cloudflare` |

### Feature Flags (`features`)

| Method | Purpose | Example |
|--------|---------|---------|
| `isFeatureEnabled(name)` | Check if feature enabled | `isFeatureEnabled('DARK_MODE')` |
| `getFeatureConfig(name)` | Get feature settings | `getFeatureConfig('ES6_MODULES')` |
| `getEnabledFeatures()` | List enabled features | `getEnabledFeatures()` |

## 🌍 Environment Variables

### Runtime Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `NODE_ENV` | Environment (development/staging/production) | Auto-detected |
| `SITE_URL` | Production site URL | `https://www.clodo.dev` |
| `DEV_URL` | Development server URL | `http://localhost:8000` |
| `SITE_NAME` | Site display name | `Clodo Framework` |
| `GA_MEASUREMENT_ID` | Google Analytics ID | - |
| `CF_WEB_ANALYTICS_TOKEN` | Cloudflare Analytics token | - |

### Build Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `CLOUDFLARE_ACCOUNT_ID` | CF account ID | - |
| `CLOUDFLARE_API_TOKEN` | CF API token | - |
| `CF_PROJECT_NAME` | CF Pages project | `clodo-framework` |
| `TEST_BASE_URL` | Testing base URL | `http://localhost:8000` |
| `OUT_DIR` | Build output directory | `dist` |

## 🔄 Migration Guide

### From Old Config Files

#### `site.config.js` → `config.site`
```javascript
// Old
import siteConfig from './config/site.config.js';
console.log(siteConfig.site.name);

// New
import { config } from './config/index.js';
console.log(config.site.name);
```

#### `tooling.config.js` → `buildConfig.tooling`
```javascript
// Old
import { toolingConfig } from './config/tooling.config.js';
console.log(toolingConfig.urls.production);

// New
import { buildConfig } from './config/index.js';
console.log(buildConfig.tooling.urls.production);
```

#### `theme.json` → `config.theme`
```javascript
// Old
import theme from './config/theme.json';
console.log(theme.colors.brand.primary);

// New
import { config } from './config/index.js';
console.log(config.theme.colors.brand.primary);
```

#### `navigation.json` → `config.navigation`
```javascript
// Old
import navigation from './config/navigation.json';
console.log(navigation.header.mainNav);

// New
import { config } from './config/index.js';
console.log(config.navigation.header.mainNav);
```

#### `pages.config.json` → `config.pages`
```javascript
// Old
import pages from './config/pages.config.json';
console.log(pages.pageBundles.index);

// New
import { config } from './config/index.js';
console.log(config.pages.pageBundles.index);
```

### From Build Scripts

#### `build/global-config.js` → Unified System
```javascript
// Old
import { GLOBAL_CONFIG, getBaseUrl } from '../build/global-config.js';

// New
import { config, buildConfig, getBaseUrl } from '../config/index.js';

// Site URLs now in config.site
const siteUrl = config.site.url;

// API endpoints now in buildConfig.tooling
const cfApi = buildConfig.tooling.cloudflare.apiToken;

// Helper functions remain the same
const baseUrl = getBaseUrl();
```

## 🛠️ Helper Functions

| Function | Purpose | Example |
|----------|---------|---------|
| `getBaseUrl()` | Get environment-aware base URL | `getBaseUrl()` |
| `getFullUrl(path)` | Get full URL for path | `getFullUrl('/about')` |
| `isFeatureEnabled(name)` | Check feature flag | `isFeatureEnabled('DARK_MODE')` |
| `getConfig(path)` | Get nested config value | `getConfig('site.name')` |
| `getBuildConfig(path)` | Get nested build config | `getBuildConfig('tooling.cloudflare.accountId')` |

## 🔒 Security Considerations

- **Environment Variables**: Sensitive data (API keys, tokens) should only be set via environment variables
- **Client-Side Access**: Only runtime config is available in browser - build config stays server-side
- **Feature Flags**: Use for gradual rollouts, not security features

## 📋 Best Practices

1. **Use the unified import** - Always import from `./config/index.js`
2. **Environment variables first** - Override defaults with env vars
3. **Feature flags for rollouts** - Use feature flags for new features
4. **Validate config** - Check required values at startup
5. **Document overrides** - Document environment variable usage

## 🔄 Backward Compatibility

The system maintains compatibility with existing code:

- Old config files still exist and work
- Build scripts can gradually migrate
- Environment variables remain the same
- No breaking changes to existing functionality

## 🚀 Future Enhancements

- **Config validation** - Schema validation for all config
- **Config hot-reload** - Development-time config reloading
- **Config GUI** - Visual configuration editor
- **Multi-environment** - Environment-specific config files
- **Config as code** - Programmatic config generation</content>
<parameter name="filePath">g:\coding\clodo-web-starter\config\UNIFIED_CONFIG_SYSTEM.md