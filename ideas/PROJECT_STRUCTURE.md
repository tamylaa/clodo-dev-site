# Project Structure

This document outlines the organization of the Clodo Framework website repository.

## 📁 Root Directory Structure

```
clodo-dev-site/
├── .docs/                    # Internal documentation (analysis, reports, planning)
├── .github/                  # GitHub configuration (workflows, templates)
├── .test-output/             # Test results (gitignored)
├── build/                    # Build scripts and tools
├── config/                   # Configuration files (tsconfig, playwright, etc.)
├── data/                     # Content data (blog posts, schemas)
├── dist/                     # Build output (gitignored)
├── docs/                     # Public documentation
├── functions/                # Cloudflare Functions
├── node_modules/             # Dependencies (gitignored)
├── public/                   # Source files
├── templates/                # HTML templates
├── tests/                    # Test suites
├── tools/                    # Utility scripts
├── .gitignore               # Git ignore rules
├── package.json             # Project dependencies and scripts
└── README.md                # Project overview
```

## 📂 Key Directories

### `/public` - Source Files
Source code for the website:
- `css/` - Stylesheets (modular structure)
- `js/` - JavaScript modules
- `blog/` - Blog post HTML files
- `*.html` - Page templates

### `/templates` - Reusable Components
HTML templates and components:
- `nav-main.html` - Landing page navigation
- `header.html` - Standard page navigation
- `footer.html` - Footer template
- `blog/` - Blog-specific templates

### `/build` - Build System
Build scripts and utilities:
- `build.js` - Main build script
- `dev-server.js` - Development server
- `*.js` - Build utilities

### `/config` - Configuration
Project configuration files:
- `vite.config.js` - Vite configuration
- `playwright.config.js` - Playwright test config
- `tsconfig.json` - TypeScript configuration
- `lighthouserc.js` - Lighthouse CI config
- `postcss.config.js` - PostCSS configuration

### `/tests` - Test Suites
Automated tests:
- `navigation-test.js` - Navigation browser tests (88 tests)
- `test-navigation-static.js` - Static HTML validation (108 tests)
- `run-navigation-tests.js` - Test runner
- `NAVIGATION_TESTS.md` - Testing documentation
- `e2e/` - End-to-end tests

### `/data` - Content Data
Structured content data:
- `blog-data.json` - Central blog data store
- `posts/` - Individual blog post JSON files
- `*.schema.json` - JSON schemas

### `/docs` - Public Documentation
User-facing documentation:
- Developer guides
- API documentation
- Getting started guides
- Best practices

### `/.docs` - Internal Documentation
Internal project documentation (see `.docs/README.md`):
- `/analysis` - Performance analysis
- `/audits` - Audit reports
- `/reports` - Progress reports
- `/planning` - Project planning
- `/navigation` - Navigation system docs
- `/performance` - Performance optimization docs

### `/.test-output` - Test Results
Generated test outputs (gitignored):
- `/lighthouse` - Lighthouse reports
- `/playwright` - Playwright test results

### `/dist` - Build Output
Generated production files (gitignored):
- Optimized HTML
- Minified CSS/JS
- Critical CSS inlined
- Processed templates

## 🔧 Configuration Files

### Root Level
- `.gitignore` - Git ignore patterns
- `.eslintrc.cjs` - ESLint configuration
- `.eslintignore` - ESLint ignore patterns
- `.stylelintrc.json` - Stylelint configuration
- `.stylelintignore` - Stylelint ignore patterns
- `package.json` - Dependencies and scripts
- `package-lock.json` - Locked dependency versions

## 🎯 Naming Conventions

### Files
- **Source HTML**: `kebab-case.html`
- **Templates**: `kebab-case.html`
- **CSS**: `kebab-case.css`
- **JavaScript**: `kebab-case.js` or `camelCase.js` for modules
- **Documentation**: `UPPERCASE_WITH_UNDERSCORES.md` for formal docs, `kebab-case.md` for informal

### Directories
- **Public-facing**: `kebab-case/`
- **Internal/hidden**: `.hidden-case/`
- **Component-based**: `camelCase/` for JS modules

## 🚀 Common Tasks

### Development
```bash
npm run dev              # Start dev server
npm run build           # Build for production
npm run preview         # Preview production build
```

### Testing
```bash
npm run test            # Run all tests
npm run test:navigation # Test navigation system
npm run test:e2e        # End-to-end tests
npm run lighthouse      # Performance audit
```

### Cleaning
```bash
npm run clean           # Clean build output
npm run clean:tests     # Clean test results
npm run clean:all       # Clean everything
```

## 📝 File Organization Best Practices

1. **Keep root clean** - Only essential config files in root
2. **Group by purpose** - Related files in same directory
3. **Separate concerns** - Build, source, config, tests, docs
4. **Ignore outputs** - Build and test outputs in gitignore
5. **Document structure** - README files in key directories

## 🔄 Recent Changes

**December 11, 2025**:
- Created `.docs/` for internal documentation
- Created `.test-output/` for test results
- Moved `analysis/`, `audits/`, `reports/` → `.docs/`
- Moved `cls/`, `optimization/` → `.docs/performance/`
- Moved `phases/`, `roadmap/` → `.docs/planning/`
- Moved standalone MD files → `.docs/planning/` or `.docs/navigation/`
- Updated `.gitignore` to reflect new structure
- Added `clean:tests` and `clean:all` npm scripts

---

*For detailed documentation structure, see `.docs/README.md`*
*For test output details, see `.test-output/README.md`*
