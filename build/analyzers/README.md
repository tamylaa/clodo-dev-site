# Analyzers Configuration

This directory contains centralized configuration for all analyzer constants, making them configurable, reusable, and consistent across the analyzer scripts.

## 📁 Configuration Structure

### `config.js`
Centralized configuration file containing all extracted constants organized by category.

## 🔧 Extracted Constants by Category

### 🌐 URLs and Domains
- **Production URL**: `https://www.clodo.dev`
- **Development URL**: `http://localhost:8000`
- **WebPageTest API**: `https://www.webpagetest.org`

### 🔌 Ports
- **Dev Server**: `38200` (configurable via `SMOKE_PORT`)
- **Lighthouse**: `8000`

### ⏱️ Timeouts and Intervals
- **Page Load Timeout**: `30000ms` (30 seconds)
- **Performance Monitor Wait**: `500ms` intervals, max `20` attempts (~10 seconds)
- **Smoke Test Ready**: `10000ms` (10 seconds), extended `15000ms` (15 seconds)
- **Mutation Observer**: `2300ms` (2.3 seconds)

### 📄 File Paths and Patterns
- **Modified CSS Files**: Array of 8 CSS files that were recently modified
- **New CSS Files**: Array of 5 newly created CSS files
- **Exclude Patterns**: Files to skip during analysis (e.g., Google verification files)

### 🔍 SEO Configuration
- **Target Keywords**: 8 primary keywords being tracked
- **Base Rankings**: Simulated ranking positions for each keyword
- **Search Volumes**: Estimated monthly search volumes
- **Competition Levels**: Competition assessment (high/medium/low)
- **Thresholds**: Opportunity scoring thresholds

### 📝 Content Pages
- **Content Pages**: 5 key content pages with metadata
- **Target Keywords**: Primary keyword for each page
- **Expected Traffic**: Projected monthly traffic

### 🧪 WebPageTest Settings
- **Test Locations**: 4 global locations (Dulles, Frankfurt, Mumbai, São Paulo)
- **API Key**: Environment variable `WEBPAGETEST_API_KEY`

### 💡 Lighthouse Settings
- **Output Format**: JSON reports
- **Form Factor**: Mobile emulation
- **Output Directory**: `reports/lighthouse`

### 🚀 Smoke Test Configuration
- **Test URLs**: 6 key pages to test during smoke tests
- **Dev Server Command**: Node.js command and arguments

### ✅ Validation Rules
- **HTTP Status Codes**: Success (200), redirects (300-399)
- **CURL Settings**: Max redirects (10)

### 📏 Size Limits
- **Git Diff Buffer**: 10MB for large file comparisons
- **Mutation Log Limit**: 50 entries for performance

## 🚀 Usage Examples

### Import Configuration
```javascript
import { ANALYZER_CONFIG, getBaseUrl, isDevelopment } from './config.js';

// Use centralized URLs
const baseUrl = getBaseUrl();
const isDev = isDevelopment(baseUrl);

// Access SEO keywords
const keywords = ANALYZER_CONFIG.seo.targetKeywords;

// Get timeouts
const timeout = ANALYZER_CONFIG.timeouts.pageLoad;
```

### Environment Variables
- `WEBPAGETEST_API_KEY`: Required for WebPageTest functionality
- `SMOKE_PORT`: Override default dev server port (default: 38200)

## 🔄 Migration Guide

To migrate existing analyzer scripts to use this configuration:

1. **Import the config**:
   ```javascript
   import { ANALYZER_CONFIG } from '../config.js';
   ```

2. **Replace hardcoded values**:
   ```javascript
   // Before
   const BASE_URL = 'https://www.clodo.dev';

   // After
   const BASE_URL = ANALYZER_CONFIG.urls.production;
   ```

3. **Use helper functions**:
   ```javascript
   // Before
   const IS_DEVELOPMENT = BASE_URL.includes('localhost');

   // After
   const IS_DEVELOPMENT = isDevelopment(BASE_URL);
   ```

## 📊 Benefits

- **🔧 Configurable**: Easy to modify settings without code changes
- **♻️ Reusable**: Constants shared across multiple analyzers
- **📏 Consistent**: Standardized values across all tools
- **🛡️ Maintainable**: Single source of truth for configuration
- **🚀 Extensible**: Easy to add new configuration categories

## 🎯 Next Steps

1. Update individual analyzer scripts to import from `config.js`
2. Add environment-specific configuration overrides
3. Implement configuration validation
4. Add configuration documentation for each analyzer