# Framework Component Extraction Plan

This document outlines the specific components to extract from `clodo-dev-site` and move to `clodo-web-starter`.

## Build Tools Extraction

### Core Build System
**Files to Move:**
- `build/build.js` → `framework-extraction/build-tools/core-build.js`
- `build/config-loader.js` → `framework-extraction/build-tools/config-loader.js`
- `build/content-renderer.js` → `framework-extraction/build-tools/content-renderer.js`
- `build/page-generator.js` → `framework-extraction/build-tools/page-generator.js`

**Modifications Needed:**
- Remove site-specific paths and configurations
- Make paths configurable via environment variables
- Add CLI interface for standalone usage

### Development Server
**Files to Move:**
- `build/dev-server.js` → `framework-extraction/build-tools/dev-server.js`

**Modifications Needed:**
- Make port and host configurable
- Remove hardcoded site-specific routes

## Content Tools Extraction

### Content Generation
**Files to Move:**
- `build/generate-blog-post.mjs` → `framework-extraction/content-tools/blog-generator.mjs`
- `build/content-effectiveness-analyzer.js` → `framework-extraction/content-tools/content-analyzer.js`

**Modifications Needed:**
- Make content directory paths configurable
- Support multiple content formats (JSON, Markdown, etc.)

### SEO Tools
**Files to Move:**
- `build/keyword-ranking-tracker.js` → `framework-extraction/content-tools/seo-tracker.js`
- `build/check-links.js` → `framework-extraction/content-tools/link-checker.js`

**Modifications Needed:**
- Remove site-specific URLs
- Make domain and sitemap URLs configurable

## Validation Tools Extraction

### Performance Testing
**Files to Move:**
- `build/check-lcp.js` → `framework-extraction/validation-tools/lcp-checker.js`
- `build/check-page-loading.js` → `framework-extraction/validation-tools/page-load-tester.js`
- `build/seo-performance-test.js` → `framework-extraction/validation-tools/seo-performance-test.js`

**Modifications Needed:**
- Make test URLs configurable
- Support multiple testing environments

### Quality Assurance
**Files to Move:**
- `build/validate-headers.js` → `framework-extraction/validation-tools/header-validator.js`
- `build/validate-redirects.js` → `framework-extraction/validation-tools/redirect-validator.js`
- `build/check-visual.js` → `framework-extraction/validation-tools/visual-regression.js`

**Modifications Needed:**
- Remove hardcoded site URLs
- Make validation rules configurable

## Deployment Tools Extraction

### Cloudflare Integration
**Files to Move:**
- `build/setup-clodo.js` → `framework-extraction/deployment-tools/cloudflare-setup.js`
- `build/setup-clodo.ps1` → `framework-extraction/deployment-tools/cloudflare-setup.ps1`

**Modifications Needed:**
- Make project name and configuration paths dynamic
- Support different deployment targets

## Templates Extraction

### HTML Templates
**Files to Move:**
- `templates/pages/*.html` → `framework-extraction/templates/pages/`
- `templates/components/*.html` → `framework-extraction/templates/components/`
- `templates/layouts/*.html` → `framework-extraction/templates/layouts/`

**Modifications Needed:**
- Remove hardcoded content and branding
- Use template variables for dynamic content

### Configuration Templates
**Files to Move:**
- `config/` directory contents → `framework-extraction/config/templates/`

**Modifications Needed:**
- Create template versions with placeholder values
- Include schema validation

## Documentation Extraction

### Guides and Tutorials
**Files to Create:**
- `framework-extraction/documentation/setup-guide.md`
- `framework-extraction/documentation/configuration-reference.md`
- `framework-extraction/documentation/api-reference.md`
- `framework-extraction/documentation/migration-guide.md`

### Technical Documentation
**Files to Create:**
- `framework-extraction/documentation/architecture.md`
- `framework-extraction/documentation/build-system.md`
- `framework-extraction/documentation/content-system.md`

## Configuration Schema

### Site Configuration Schema
**Create:** `framework-extraction/config/site-config.schema.json`
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "site": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "description": { "type": "string" },
        "url": { "type": "string", "format": "uri" }
      },
      "required": ["name", "url"]
    },
    "branding": {
      "type": "object",
      "properties": {
        "logo": { "type": "string" },
        "colors": {
          "type": "object",
          "properties": {
            "primary": { "type": "string" },
            "secondary": { "type": "string" }
          }
        }
      }
    }
  }
}
```

## CLI Interface Design

### Command Structure
```
clodo <command> [options]

Commands:
  init          Initialize a new Clodo project
  build         Build the project
  dev           Start development server
  validate      Run validation checks
  deploy        Deploy to production
  analyze       Run performance analysis

Options:
  --config      Path to config file
  --output      Output directory
  --verbose     Enable verbose logging
```

### Implementation Plan
1. Create `framework-extraction/build-tools/cli.js`
2. Implement command parsing and routing
3. Add help system and documentation
4. Integrate with existing build tools

## Testing Strategy

### Unit Tests
- Test each extracted module independently
- Mock file system and network calls
- Test configuration loading and validation

### Integration Tests
- Test full build pipeline
- Test deployment process
- Test content generation workflow

### End-to-End Tests
- Test complete project setup
- Test generated site functionality
- Test deployment and hosting

## Migration Timeline

### Week 1: Planning and Setup
- [ ] Create extraction folder structure
- [ ] Document all components to extract
- [ ] Set up testing environment

### Week 2: Core Build System
- [ ] Extract and modularize build tools
- [ ] Create CLI interface
- [ ] Test build system isolation

### Week 3: Content and Validation Tools
- [ ] Extract content generation tools
- [ ] Extract validation and testing tools
- [ ] Update configurations

### Week 4: Templates and Documentation
- [ ] Extract and generalize templates
- [ ] Create framework documentation
- [ ] Test integration

### Week 5: Integration and Cleanup
- [ ] Integrate into clodo-web-starter
- [ ] Clean up clodo-dev-site
- [ ] Final testing and documentation

## Risk Assessment

### High Risk
- Breaking existing clodo-dev-site functionality
- Missing dependencies during extraction
- Configuration conflicts

### Medium Risk
- Template rendering issues
- Path resolution problems
- CLI interface usability

### Low Risk
- Documentation updates
- Test script modifications
- Configuration schema changes

## Success Criteria

- [ ] clodo-dev-site continues to work unchanged
- [ ] clodo-web-starter can use all extracted components
- [ ] Framework components are properly modularized
- [ ] Documentation is complete and accurate
- [ ] All tests pass
- [ ] CLI interface works correctly