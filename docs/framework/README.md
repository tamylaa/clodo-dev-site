# Clodo Framework Extraction

This folder contains reusable components, scripts, tools, and documentation extracted from the `clodo-dev-site` codebase that can be moved to the `clodo-web-starter` project.

## Purpose

The goal is to separate reusable framework components from site-specific code, making it easier to:
- Maintain the framework independently
- Reuse components across different projects
- Keep the `clodo-dev-site` focused on its specific implementation
- Enable the `clodo-web-starter` to become a comprehensive framework

## Folder Structure

```
framework-extraction/
├── build-tools/           # Build scripts and automation
├── content-tools/         # Content generation and management
├── validation-tools/      # Testing, linting, and validation
├── deployment-tools/      # Deployment and hosting scripts
├── templates/            # Reusable HTML/CSS/JS templates
├── config/               # Configuration files and schemas
├── documentation/        # Framework docs and guides
└── README.md            # This file
```

## Extraction Process

### Phase 1: Identify Reusable Components
- [ ] Audit all scripts in `build/` directory
- [ ] Identify framework-agnostic tools vs site-specific code
- [ ] Document dependencies and requirements

### Phase 2: Extract and Modularize
- [ ] Move reusable scripts to appropriate subfolders
- [ ] Create modular interfaces (CLI, APIs)
- [ ] Update import paths and dependencies

### Phase 3: Integrate into clodo-web-starter
- [ ] Copy extracted components to clodo-web-starter
- [ ] Update clodo-web-starter's build system
- [ ] Test integration and functionality

### Phase 4: Clean Up
- [ ] Remove extracted components from clodo-dev-site
- [ ] Update clodo-dev-site to use framework components
- [ ] Document breaking changes

## Key Components to Extract

### Build Tools
- `build.js` - Main build orchestration
- `content-renderer.js` - Template rendering engine
- `page-generator.js` - Content-driven page generation
- `config-loader.js` - Configuration management

### Content Tools
- Blog generation scripts
- SEO optimization tools
- Content validation and analysis

### Validation Tools
- Performance testing scripts
- SEO validation tools
- Accessibility checkers
- Link health monitoring

### Deployment Tools
- Cloudflare Workers deployment
- CDN configuration
- Environment setup scripts

### Templates
- HTML templates with SSI includes
- CSS frameworks and themes
- JavaScript utilities

### Configuration
- Schema definitions for content
- Build configuration templates
- Environment configurations

## Migration Checklist

### Scripts to Move
- [ ] `build/build.js`
- [ ] `build/content-renderer.js`
- [ ] `build/page-generator.js`
- [ ] `build/config-loader.js`
- [ ] `build/setup-clodo.js`
- [ ] `build/dev-server.js`

### Tools to Extract
- [ ] SEO analysis tools
- [ ] Performance monitoring
- [ ] Content generation utilities
- [ ] Validation scripts

### Templates to Move
- [ ] Base HTML templates
- [ ] Component templates
- [ ] Email templates

### Documentation to Create
- [ ] Framework API documentation
- [ ] Setup and deployment guides
- [ ] Configuration reference
- [ ] Migration guides

## Dependencies to Consider

### External Dependencies
- Node.js modules used by build scripts
- Cloudflare Workers runtime dependencies
- Testing frameworks and tools

### Internal Dependencies
- Shared utilities and helpers
- Common configuration schemas
- Reusable components and templates

## Testing Strategy

After extraction, ensure:
- [ ] clodo-dev-site still builds and deploys correctly
- [ ] clodo-web-starter can use extracted components
- [ ] All existing functionality is preserved
- [ ] New framework features work as expected

## Next Steps

1. Review each script in `build/` directory
2. Identify which are framework vs site-specific
3. Move framework components to appropriate subfolders
4. Update import paths and dependencies
5. Test integration in clodo-web-starter
6. Clean up clodo-dev-site references