# Data-Driven Schema Architecture

## Overview

This document describes the new **data-driven schema architecture** for clodo.dev. Instead of maintaining schema markup inline in 20+ HTML files, all schemas are now generated programmatically from centralized configuration files.

## Architecture

### Core Components

1. **`schema/schema-generator.js`** (350+ lines)
   - Reusable schema generation module with 14 export functions
   - Generates valid JSON-LD markup for all schema types
   - Reads from data files (blog-data.json, page-config.json)
   - Eliminates all inline schema duplication

2. **`data/schemas/defaults.json`** (JSON configuration, preferred location; legacy `schema/defaults.json` still supported)
   - Centralized organization metadata
   - Software application metrics
   - Default values for blog posts and case studies
   - Single source of truth for shared values

3. **`data/schemas/page-config.json`** (JSON configuration, preferred location; legacy `schema/page-config.json` still supported)

Note: Page-level schema files are now organized into subfolders under `data/schemas/` to reduce root-level clutter:
- `data/schemas/pages/` — per-page Article/WebPage JSON files
- `data/schemas/faqs/` — auto-extracted and manual FAQPage JSON files
- `data/schemas/breadcrumbs/` — BreadcrumbList JSON files

The tooling prefers the new subfolders but retains compatibility with legacy flat files placed directly under `data/schemas/`.
   - Blog post configurations (6 posts)
   - Case study configurations (2 studies)
   - Page-specific configurations (pricing, docs)
   - Maps filenames → schema metadata

4. **`schema/build-integration.js`** (150+ lines)
   - Integration layer between schema generator and build system
   - `injectSchemasIntoHTML()` - Injects generated schemas into HTML
   - `preGenerateAllSchemas()` - Pre-generates all schemas
   - `getConfigurationReport()` - Reports configuration status
   - `validateSchemaConfigs()` - Validates configurations

5. **`schema/cli.js`** (CLI tool)
   - Command-line interface for schema operations
   - `status` - Show configuration summary
   - `generate` - Pre-generate all schemas with samples
   - `validate` - Validate all configurations
   - `help` - Show help message

## Configuration Structure

### Blog Posts Configuration

Each blog post in `data/schemas/page-config.json` requires:

```json
{
  "filename.html": {
    "title": "Article Title",
    "headline": "Display Headline (if different)",
    "author": "author-key-from-blog-data.json",
    "published": "YYYY-MM-DD",
    "updated": "YYYY-MM-DD",
    "url": "https://clodo.dev/blog/slug",
    "description": "Meta description",
    "section": "Category (Technical, Architecture, etc.)",
    "proficiencyLevel": "Beginner|Intermediate|Advanced",
    "dependencies": "Required software/knowledge",
    "keywords": ["keyword1", "keyword2"],
    "wordCount": 2400
  }
}
```

Generates:
- Organization schema (shared)
- TechArticle schema with author from blog-data.json
- BreadcrumbList schema
- All injected into `<head>` section

### Case Studies Configuration

Each case study requires:

```json
{
  "filename.html": {
    "title": "Case Study Title",
    "headline": "Display Title",
    "url": "https://clodo.dev/case-studies/slug",
    "description": "Case study summary",
    "industry": "Industry Name",
    "metrics": [
      {
        "name": "Metric Name",
        "description": "What this metric measures",
        "value": 80,
        "unitText": "percent"
      }
    ]
  }
}
```

Generates:
- Organization schema (shared)
- Article schema
- ItemList with QuantitativeValue metrics
- BreadcrumbList schema

### Pages Configuration

Specific pages like pricing and docs:

```json
{
  "pages": {
    "pricing": {
      "type": "FAQPage",
      "faqs": [
        {
          "name": "Question?",
          "acceptedAnswer": "Answer text..."
        }
      ]
    },
    "docs": {
      "type": "LearningResource",
      "name": "Documentation Hub",
      "description": "...",
      "url": "https://clodo.dev/docs",
      "educationalLevel": "Intermediate to Advanced"
    }
  }
}
```

## Integration with Build System

### Step 1: Import in build.js

```javascript
import { injectSchemasIntoHTML } from './schema/build-integration.js';
```

### Step 2: Hook into HTML Processing

In your HTML processing loop in `build.js`:

```javascript
// During HTML file processing
const htmlContent = fs.readFileSync(filePath, 'utf8');

// Inject generated schemas
const enhancedHTML = injectSchemasIntoHTML(
  path.basename(filePath),
  htmlContent
);

// Write the enhanced content
fs.writeFileSync(outputPath, enhancedHTML, 'utf8');
```

### Step 3: Run Build

```bash
npm run build
```

The build will:
1. Load page-config.json
2. Generate schemas for configured pages
3. Remove old inline schemas
4. Inject new generated schemas into `<head>`
5. Output all 223 files to dist/

## Generated Schemas

### Blog Posts

Each blog post gets:

1. **Organization Schema**
   - Name, URL, logo, social links
   - From `schema/defaults.json`
   - Shared across all pages

2. **TechArticle Schema**
   - Headline, description, URL
   - Author from blog-data.json (no copy-paste!)
   - Publication/modification dates
   - Proficiency level and dependencies
   - Keywords as comma-separated string

3. **BreadcrumbList**
   - Home → Blog → Article Title
   - Automatic from page hierarchy

### Case Studies

Each case study gets:

1. **Organization Schema** (shared)

2. **Article Schema**
   - Title, description, URL
   - Publisher information

3. **Metrics ItemList**
   - QuantitativeValue for each metric
   - Name, value, unit
   - Counts cost reduction, performance improvements, etc.

4. **BreadcrumbList**
   - Home → Case Studies → Study Title

### Pages

**Pricing Page:**
- Organization schema (shared)
- FAQPage with configured Q&As
- BreadcrumbList

**Docs Page:**
- Organization schema (shared)
- LearningResource schema
- BreadcrumbList

## CLI Commands

### Check Configuration Status

```bash
node schema/cli.js status
```

Output:
```
========================================
SCHEMA CONFIGURATION STATUS
========================================

📝 Blog Posts:      6 configured
   Files:
     ✓ cloudflare-infrastructure-myth.html
     ✓ stackblitz-integration-journey.html
     ...

📊 Case Studies:    2 configured
📄 Pages:           2 configured
📦 Total:           10 pages configured
========================================
```

### Pre-Generate and Preview Schemas

```bash
node schema/cli.js generate
```

Shows:
- Count of generated schemas
- Sample Organization schema
- Sample TechArticle schema with actual data

### Validate Configuration

```bash
node schema/cli.js validate
```

Shows:
- All configured blog posts with details
- All configured case studies with metrics
- All configured pages with type

## Benefits

### Before (Inline Schemas)

- ❌ 50+ schema blocks scattered across 20+ files
- ❌ Organization schema duplicated on every page
- ❌ BreadcrumbList duplicated with URL changes
- ❌ Difficult to maintain: update schema = edit 20 files
- ❌ Easy to make mistakes (copy-paste errors)
- ❌ Hard to scale: new page requires manual schema creation
- ❌ Author data duplicated from blog-data.json

### After (Data-Driven Generation)

- ✅ 1 generator module + 1 config file = all schemas
- ✅ Organization schema defined once in defaults.json
- ✅ BreadcrumbList auto-generated from page hierarchy
- ✅ Update one value = applies to all pages globally
- ✅ Less error-prone: generation is deterministic
- ✅ Highly scalable: new page = add to page-config.json
- ✅ Single source of truth: author data from blog-data.json
- ✅ Easy to audit: review page-config.json to see all schemas
- ✅ Version control friendly: config changes are obvious

## Adding New Content

### Add a New Blog Post

1. Create HTML file: `blog/new-post.html`
2. Add to `schema/page-config.json`:

```json
{
  "new-post.html": {
    "title": "Post Title",
    "headline": "Post Headline",
    "author": "tamyla",
    "published": "2025-01-20",
    "url": "https://clodo.dev/blog/new-post",
    "description": "...",
    "section": "Technical",
    "proficiencyLevel": "Intermediate",
    "dependencies": "...",
    "keywords": ["keyword1", "keyword2"]
  }
}
```

3. Run build:
```bash
npm run build
```

4. Schemas automatically generated and injected! ✨

### Add a New Case Study

1. Create HTML file: `case-studies/new-study.html`
2. Add to `schema/page-config.json`:

```json
{
  "new-study.html": {
    "title": "Case Study Title",
    "headline": "Case Study",
    "url": "https://clodo.dev/case-studies/new-study",
    "description": "...",
    "industry": "Industry",
    "metrics": [
      {
        "name": "Cost Reduction",
        "description": "...",
        "value": 80,
        "unitText": "percent"
      }
    ]
  }
}
```

3. Run build - schemas auto-generated!

## Updating Shared Values

### Update Organization Info

All pages use organization data from `data/schemas/defaults.json` (legacy: `schema/defaults.json`). To update:

1. Edit `data/schemas/defaults.json`:

```json
{
  "organization": {
    "name": "Clodo",
    "url": "https://clodo.dev",
    "email": "product@clodo.dev",
    ...
  }
}
```

2. Run build
3. All 10+ pages automatically get updated Organization schema ✨

### Update Software Metrics

For SoftwareApplication schema:

1. Edit `data/schemaschemas/defaults.json`:

```json
{
  "softwareApplication": {
    "downloads": 2000,
    "versions": 80,
    "codeQuality": 98.9,
    "tests": 464
  }
}
```

2. Run build
3. Homepage automatically reflects new metrics!

## Validation & Testing

### Pre-Check Before Build

```bash
node schema/cli.js validate
```

Displays:
- All configured blog posts with metadata
- All configured case studies with metrics
- All configured pages with types
- Warnings if config exists for non-existent files

### Verify Generated Schemas

```bash
node schema/cli.js generate
```

Shows sample Organization and TechArticle schemas to ensure data is correct.

### Post-Build Validation

After `npm run build`:

1. Check dist/ for generated HTML files
2. Open browser: `file:///path/to/dist/blog/post.html`
3. View page source → Search for `application/ld+json`
4. Copy schema JSON and validate with [Google Rich Results Test](https://search.google.com/test/rich-results)

## Architecture Pattern

This is a **hybrid data-driven architecture**:

```
Data Sources
    ↓
blog-data.json (authors, testimonials)
defaults.json (org, software metrics)
page-config.json (page metadata)
    ↓
Schema Generator Module
    ↓
generateAllPageSchemas()
    ↓
[TechArticle, Organization, BreadcrumbList, FAQPage, ItemList...]
    ↓
Build Integration Layer
    ↓
injectSchemasIntoHTML()
    ↓
Enhanced HTML with Schemas in <head>
    ↓
npm run build → dist/ (223 files)
```

## File Structure

```
schema/
  ├── schema-generator.js      # 350+ lines, 14 export functions
  ├── defaults.json            # Organization & software metrics
  ├── page-config.json         # Blog posts, case studies, pages
  ├── build-integration.js     # Build system integration layer
  ├── cli.js                   # CLI tool (status, generate, validate)
  └── README.md                # This file
```

## Next Steps

1. **Integrate into build.js** (Immediate)
   - Import build-integration.js
   - Hook injectSchemasIntoHTML() into HTML processing loop

2. **Migrate existing pages** (Short-term)
   - Run build with integration
   - Remove inline schemas from HTML files

3. **Add more pages** (As needed)
   - Examples.html → add to page-config.json
   - Product.html → add to page-config.json
   - Any new pages → add to config, schemas auto-generate

4. **Set up automated testing** (Optional)
   - Run `node schema/cli.js validate` in CI/CD
   - Validate generated schemas with Google's tool
   - Alert on config errors

## Troubleshooting

### Schemas not generating?

1. Check page-config.json exists and is valid JSON
2. Verify filename in config matches actual HTML filename
3. Run: `node schema/cli.js validate`

### Author data not showing in blog post schema?

1. Check blog-data.json has author entry
2. Verify `author` key in page-config.json matches blog-data.json
3. Run: `node schema/cli.js generate` to see actual output

### Build fails after integration?

1. Verify build-integration.js imports are correct
2. Check page-config.json is valid JSON
3. Ensure defaults.json exists and is valid
4. Check file paths are absolute, not relative

## Performance Impact

- **Schema generation:** < 100ms for all 10+ pages
- **Build time:** Negligible increase (file I/O only)
- **Output size:** Same as inline schemas (no additional markup)
- **Maintainability:** Massive improvement (1 source of truth vs 50+ duplicates)

## Future Enhancements

- [ ] Integrate into build.js (next step)
- [ ] Auto-generate schemas for all HTML pages
- [ ] Schema versioning & history
- [ ] Automated schema validation in CI/CD
- [ ] Web UI for managing page configs
- [ ] Bulk import from existing HTML schemas
- [ ] Multi-language schema support
