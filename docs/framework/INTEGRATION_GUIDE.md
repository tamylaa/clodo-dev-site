# Integration Guide: Moving to clodo-web-starter

This guide explains how to integrate the extracted framework components into the `clodo-web-starter` project.

## Overview

The extracted components are now organized in the `framework-extraction/` folder and ready to be moved to `clodo-web-starter`. This will transform your starter template into a full-featured framework.

## Step 1: Copy Framework Components

### Build Tools Integration
```bash
# Copy build tools to clodo-web-starter
cp -r framework-extraction/build-tools/* ../clodo-web-starter/build/

# Copy content tools
cp -r framework-extraction/content-tools/* ../clodo-web-starter/build/

# Copy validation tools
cp -r framework-extraction/validation-tools/* ../clodo-web-starter/build/

# Copy deployment tools
cp -r framework-extraction/deployment-tools/* ../clodo-web-starter/build/
```

### Template Integration
```bash
# Copy templates
cp -r framework-extraction/templates/* ../clodo-web-starter/templates/

# Copy configuration templates
cp -r framework-extraction/config/templates/* ../clodo-web-starter/config/
```

## Step 2: Update Package.json Scripts

Add these scripts to `clodo-web-starter/package.json`:

```json
{
  "scripts": {
    "build": "node build/core-build.js",
    "dev": "node build/dev-server.js",
    "validate": "node build/validation-runner.js",
    "analyze": "node build/content-analyzer.js",
    "deploy": "node build/cloudflare-setup.js"
  }
}
```

## Step 3: Create CLI Interface

Create `clodo-web-starter/bin/clodo.js`:

```javascript
#!/usr/bin/env node

const { Command } = require('commander');
const program = new Command();

program
  .name('clodo')
  .description('Clodo Framework CLI')
  .version('1.0.0');

program
  .command('build')
  .description('Build the project')
  .action(() => {
    require('../build/core-build.js');
  });

program
  .command('dev')
  .description('Start development server')
  .action(() => {
    require('../build/dev-server.js');
  });

program
  .command('validate')
  .description('Run validation checks')
  .action(() => {
    require('../build/validation-runner.js');
  });

program.parse();
```

## Step 4: Update Import Paths

### In Extracted Files
Update all import paths to work with the new structure:

```javascript
// Before (in clodo-dev-site)
import { loadConfig } from './config-loader.js';

// After (in clodo-web-starter)
import { loadConfig } from '../build/config-loader.js';
```

### Key Files to Update
- `core-build.js` - Update all relative imports
- `content-renderer.js` - Update template and config paths
- `page-generator.js` - Update content and template paths
- `dev-server.js` - Update static file serving paths

## Step 5: Make Components Configurable

### Path Configuration
Create a configuration system for paths:

```javascript
// config/paths.js
export const paths = {
  content: './content',
  templates: './templates',
  output: './dist',
  config: './config'
};
```

### Environment Variables
Support environment-specific configurations:

```javascript
// config/env.js
export const env = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  siteUrl: process.env.SITE_URL || 'http://localhost:3000'
};
```

## Step 6: Create Framework API

### Main Framework Module
Create `lib/clodo.js` as the main entry point:

```javascript
// lib/clodo.js
import { build } from '../build/core-build.js';
import { serve } from '../build/dev-server.js';
import { validate } from '../build/validation-runner.js';

export class ClodoFramework {
  constructor(config) {
    this.config = config;
  }

  async build() {
    return build(this.config);
  }

  async serve(port = 3000) {
    return serve(this.config, port);
  }

  async validate() {
    return validate(this.config);
  }
}

export default ClodoFramework;
```

### Plugin System
Create a plugin architecture:

```javascript
// lib/plugins.js
export class PluginManager {
  constructor() {
    this.plugins = [];
  }

  register(plugin) {
    this.plugins.push(plugin);
  }

  async executeHook(hookName, ...args) {
    for (const plugin of this.plugins) {
      if (plugin[hookName]) {
        await plugin[hookName](...args);
      }
    }
  }
}
```

## Step 7: Update Content Structure

### Enhanced Site Configuration
Extend `config/site.config.js`:

```javascript
// config/site.config.js
export default {
  site: {
    name: 'My Clodo Site',
    description: 'Built with Clodo Framework',
    url: process.env.SITE_URL || 'http://localhost:3000'
  },
  build: {
    outputDir: './dist',
    templatesDir: './templates',
    contentDir: './content'
  },
  framework: {
    version: '1.0.0',
    plugins: []
  }
};
```

### Content Schema Validation
Add JSON schema validation for content files:

```javascript
// build/content-validator.js
import Ajv from 'ajv';
import contentSchema from '../config/content.schema.json';

const ajv = new Ajv();
const validate = ajv.compile(contentSchema);

export function validateContent(content) {
  const valid = validate(content);
  return {
    valid,
    errors: validate.errors
  };
}
```

## Step 8: Testing Integration

### Unit Tests
Create tests for framework components:

```javascript
// test/framework.test.js
import { ClodoFramework } from '../lib/clodo.js';
import { expect } from 'chai';

describe('ClodoFramework', () => {
  it('should build successfully', async () => {
    const framework = new ClodoFramework({ /* config */ });
    const result = await framework.build();
    expect(result.success).to.be.true;
  });
});
```

### Integration Tests
Test the full build pipeline:

```javascript
// test/integration.test.js
describe('Full Build Pipeline', () => {
  it('should generate complete site', async () => {
    // Test content generation
    // Test template rendering
    // Test output validation
  });
});
```

## Step 9: Documentation Updates

### Framework Documentation
Create comprehensive docs:

- `docs/setup.md` - Framework setup guide
- `docs/configuration.md` - Configuration reference
- `docs/api.md` - API documentation
- `docs/plugins.md` - Plugin development guide

### Example Projects
Create example implementations:

```
examples/
├── basic-site/          # Basic website
├── blog-site/           # Blog with CMS
├── saas-app/            # SaaS application
└── custom-theme/        # Custom theming
```

## Step 10: Migration Verification

### Checklist
- [ ] All build scripts work
- [ ] Content generation functions
- [ ] Template rendering works
- [ ] Development server starts
- [ ] Validation tools run
- [ ] CLI commands work
- [ ] Tests pass
- [ ] Documentation is complete

### Backwards Compatibility
Ensure existing `clodo-web-starter` projects still work:

```javascript
// Check for legacy config
if (fs.existsSync('site.config.js')) {
  console.warn('Legacy config detected. Consider migrating to new format.');
}
```

## Next Steps

1. **Immediate**: Copy extracted files to `clodo-web-starter`
2. **Short-term**: Update import paths and configurations
3. **Medium-term**: Implement CLI and plugin system
4. **Long-term**: Add advanced features (themes, plugins, deployment)

## Support

- Check `framework-extraction/README.md` for component details
- Review `framework-extraction/EXTRACTION_PLAN.md` for migration steps
- Test incrementally to avoid breaking changes