# System Building Scripts Inventory

This document provides a complete inventory of all system building scripts in the clodo-dev-site project, organized by directory and purpose.

**Comprehensive Scan Results**: A full recursive directory scan was performed to identify all executable script files across the entire project structure. The scan included all common script extensions (.js, .mjs, .cjs, .ps1, .sh, .bat, .cmd, .py, .rb, .php, .pl, .lua, .r, .scala, .go, .rs, .cpp, .c, .cs, .vb, .fs, .ml, .hs, .clj, .cljs, .elm, .dart, .kt, .swift, .m, .mm, .exe, .dll, .so, .dylib, .jar, .war, .ear, .deb, .rpm, .pkg, .dmg, .app, .ipa, .apk, .awk, .sed, .tcl, .expect, .fish, .zsh, .ksh, .csh, .tcsh, .bash, .ash, .dash, .mk, .makefile, .Makefile, .cmake, .gradle, .ant, .xml, .env*, .conf*, .ini, .cfg, .properties, .yml, .yaml) and excluded build outputs in `dist/` and `public/` directories.

## NPM Scripts (package.json)

### Build & Development
- `prebuild`: Runs linting, type checking, blog validation, header validation, redirect validation, and link checking
- `build`: Executes main build script and generates AMP pages
- `start`: Alias for serve
- `dev`: Alias for serve
- `preview`: Runs Vite preview with config
- `serve`: Starts development server
- `serve:dist`: Builds and serves distribution

### Cleanup
- `clean`: Runs clean script from tools
- `clean:tests`: Cleans test output directories
- `clean:all`: Combines clean and clean:tests

### Validation & Generation
- `validate:blog`: Validates all blog posts
- `validate:headers`: Validates headers
- `validate:redirects`: Validates redirects
- `generate:blog`: Generates all blog posts
- `generate:amp`: Generates AMP pages
- `check-links`: Checks links
- `check-page-loading`: Checks page loading
- `check-nav-stability`: Checks navigation stability
- `fix-canonicals`: Fixes canonical URLs

### Testing
- `pretest`: Runs linting before tests
- `test`: Runs tests in tests directory
- `test:unit`: Runs unit tests
- `test:accessibility`: Runs accessibility tests
- `test:performance`: Runs performance tests
- `test:coverage`: Runs coverage tests
- `test:e2e`: Runs end-to-end tests (excluding visual regression)
- `test:e2e:ui`: Runs E2E tests with UI
- `test:e2e:headed`: Runs E2E tests in headed mode
- `test:e2e:debug`: Runs E2E tests in debug mode
- `test:visual`: Runs visual regression tests
- `test:visual:update`: Updates visual regression snapshots
- `test:navigation:static`: Runs static navigation tests
- `test:navigation:browser`: Runs browser navigation tests
- `test:navigation`: Alias for static navigation tests
- `test:navigation:full`: Runs both static and browser navigation tests
- `test:smoke`: Runs runtime smoke check
- `test:all`: Alias for E2E tests

### Utilities
- `fix-links`: Fixes HTML links
- `inject-nav`: Injects navigation
- `normalize`: Combines fix-links and inject-nav
- `postbuild`: Runs normalize after build
- `ci:premerge`: Runs normalize and static navigation tests for CI
- `lighthouse`: Runs Lighthouse CI autorun

## Root Directory Scripts

### Debug & Testing Scripts
- `debug-build-corruption.js`: Debugs build corruption issues
- `debug-emoji.js`: Debugs emoji rendering issues
- `debug-full-build.js`: Debugs full build process
- `debug-path-adjust.js`: Debugs path adjustment logic
- `fix-emoji.mjs`: Fixes emoji issues (ESM)
- `fix-emojis.js`: Fixes emoji issues
- `fix-emojis.ps1`: Fixes emoji issues (PowerShell)
- `test-build-process.js`: Tests build process
- `test-emoji.js`: Tests emoji functionality
- `test-exact-build.js`: Tests exact build output
- `test-fix-links.js`: Tests link fixing functionality
- `validate-schemas.js`: Validates schema implementations

### HTML Test Files
- `debug-path-adjust.html`: HTML for path adjustment debugging
- `debug-ssi-only.html`: HTML for SSI-only debugging
- `debug-ssi-target.js`: JavaScript for SSI target debugging
- `temp_lh.html`: Temporary Lighthouse test HTML
- `test-defer-css-sim.html`: CSS defer simulation test
- `test-defer-css.html`: CSS defer test
- `test-exact-build.html`: Exact build test HTML
- `test-full-result.html`: Full result test HTML
- `test-output.html`: Test output HTML
- `test-result.html`: Test result HTML
- `tmp_homepage.html`: Temporary homepage HTML
- `tmp.html`: Temporary HTML file

## Clodo Starter Template (clodo-starter-template/)

- `index.js`: Starter template entry point

## Build Scripts (build/)

### Core Build
- `build.js`: Main build script - processes HTML, applies templates, minifies assets
- `dev-server.js`: Development server script

### Validation & Checking
- `check-analytics-visual.js`: Checks analytics visual elements
- `check-community-visual.js`: Checks community visual elements
- `check-index-visual.js`: Checks index page visual elements
- `check-lcp-node.js`: Checks Largest Contentful Paint (node version)
- `check-lcp.js`: Checks Largest Contentful Paint
- `check-links.js`: Link checking script
- `check-nav-stability.js`: Navigation stability checker
- `check-page-loading.js`: Page loading checker
- `check-production-button.js`: Production button checker
- `check-visual.js`: General visual checker
- `validate-headers.js`: Header validation
- `validate-redirects.js`: Redirect validation

### Generation
- `generate-amp.js`: AMP page generation
- `generate-blog-post.mjs`: Blog post generation

### Analysis & Monitoring
- `analyze-css-changes.js`: Analyzes CSS changes
- `content-effectiveness-analyzer.js`: Analyzes content effectiveness
- `inspect-canonical.js`: Inspects canonical URLs
- `inspect-layout-shift.js`: Inspects layout shifts
- `keyword-ranking-tracker.js`: Tracks keyword rankings
- `observe-header-change.js`: Observes header changes
- `observe-images.js`: Observes image loading
- `observe-mutations.js`: Observes DOM mutations
- `seo-performance-test.js`: SEO performance testing

### Maintenance & Setup
- `clean-index-css.js`: Cleans index CSS
- `fix-canonicals.js`: Fixes canonical URLs
- `setup-clodo.js`: Clodo setup script
- `demo-service-creation.js`: Demo service creation

### Production
- `prod-main-current.js`: Current production main script
- `production-main.js`: Production main script
- `production-stackblitz.js`: StackBlitz production script

### PowerShell Scripts
- `consolidate-footer.ps1`: Consolidates footer
- `setup-clodo.ps1`: Clodo setup (PowerShell)

### Other Files
- `CHANGELOG_AUTOMATED.md`: Automated changelog
- `css-changes-report.json`: CSS changes report
- `link-health-report.json`: Link health report
- `served.html`: Served HTML template

## Scripts Directory (scripts/)

### i18n/ - Internationalization
- `apply_locales.cjs`: Applies locales (CommonJS)
- `apply_locales.js`: Applies locales (ESM)
- `README.md`: i18n documentation

### perf/ - Performance
- `check_lighthouse_smoke.js`: Lighthouse smoke check
- `run_lighthouse.cjs`: Runs Lighthouse (CommonJS)
- `run_lighthouse.js`: Runs Lighthouse (ESM)
- `run_webpagetest.cjs`: Runs WebPageTest (CommonJS)
- `run_webpagetest.js`: Runs WebPageTest (ESM)
- `README.md`: Performance documentation

### seo/ - Search Engine Optimization
- `generate_experiment_pages.cjs`: Generates experiment pages (CommonJS)
- `generate_experiment_pages.js`: Generates experiment pages (ESM)
- `README.md`: SEO documentation

## Tools Directory (tools/)

### Analysis & Validation
- `check-lighthouse-ci.mjs`: Lighthouse CI check
- `check-pages-settings.js`: Pages settings check
- `check-production-css.mjs`: Production CSS check
- `check-production-scripts.js`: Production scripts check
- `check-zone-analytics.js`: Zone analytics check
- `run-lighthouse-audit-ci.mjs`: Lighthouse audit for CI
- `run-lighthouse-audit.js`: Lighthouse audit
- `validate-cloudflare-analytics.js`: Cloudflare analytics validation

### Maintenance & Utilities
- `clean.js`: Cleaning utility
- `extract-critical-css.js`: Extracts critical CSS
- `fix-html-links.js`: Fixes HTML links
- `fix-html-links.mjs`: Fixes HTML links (ESM)
- `inject-nav.mjs`: Injects navigation
- `ping-sitemap.js`: Pings sitemap
- `process-html.js`: Processes HTML
- `purge-cache.js`: Purges cache
- `utilities`: Utility functions (JS file)

### Cloudflare & Analytics
- `capture-pricing-screenshots.mjs`: Captures pricing screenshots
- `cloudflare-api-diagnostic.ps1`: Cloudflare API diagnostic
- `convert-hex-to-vars.mjs`: Converts hex to CSS variables
- `convert-rgba.mjs`: Converts RGBA colors
- `delete-web-analytics-site.js`: Deletes web analytics site
- `disable-pages-analytics.js`: Disables pages analytics
- `disable-pages-site-analytics.js`: Disables pages site analytics
- `disable-web-analytics.js`: Disables web analytics
- `quick-analytics-setup.ps1`: Quick analytics setup
- `runtime-smoke-check.mjs`: Runtime smoke check

### GitHub & SEO
- `github-seo-setup.ps1`: GitHub SEO setup
- `github-seo-setup.sh`: GitHub SEO setup (shell)
- `quick-wins-boost.ps1`: Quick wins boost

### Other
- `consolidate-footer.ps1`: Consolidates footer
- `lcp-test.html`: LCP test HTML

## Functions Directory (functions/)

### API Functions
- `newsletter-subscribe.js`: Newsletter subscription handler
- `api/analytics.js`: Analytics API handler

## Tests Directory (tests/)

### Test Runners & Config
- `accessibility.test.js`: Accessibility tests
- `babel.config.js`: Babel configuration for tests
- `debug-storage.test.js`: Debug storage tests
- `navigation-test.js`: Navigation tests
- `performance.test.js`: Performance tests
- `run-navigation-tests.js`: Navigation test runner
- `runner.js`: Test runner
- `setup.js`: Test setup
- `test-individual-pages.js`: Individual page tests
- `test-navigation-static.js`: Static navigation tests
- `test-reset.js`: Test reset
- `unit.test.js`: Unit tests
- `vitest.config.js`: Vitest configuration
- `config`: Test configuration file

### Integration Tests (tests/integration/)
- `blog-links.spec.js`: Blog links tests
- `canonical-pages.spec.js`: Canonical pages tests
- `headers.spec.js`: Headers tests
- `newsletter-redirect.spec.js`: Newsletter redirect tests
- `performance-dashboard.spec.js`: Performance dashboard tests
- `production-debug.spec.js`: Production debug tests
- `seo-smoke.spec.js`: SEO smoke tests
- `structured-data.spec.js`: Structured data tests
- `subscribe.spec.js`: Subscribe tests
- `system-integration.spec.js`: System integration tests
- `try-it.spec.js`: Try-it tests
- `INTEGRATION_RUN_SUMMARY.md`: Integration test summary

### Unit Tests (tests/unit/)
- `event-bus.test.js`: Event bus tests
- `forms.test.js`: Forms tests
- `modal.test.js`: Modal tests
- `navigation-component.test.js`: Navigation component tests
- `navigation.test.js`: Navigation tests
- `newsletter-fallback.test.js`: Newsletter fallback tests
- `newsletter.test.js`: Newsletter tests
- `storage.test.js`: Storage tests

## Config Directory (config/)

### Build & Development Config
- `lighthouserc.js`: Lighthouse configuration
- `playwright.config.js`: Playwright configuration
- `postcss.config.js`: PostCSS configuration
- `vite.config.js`: Vite configuration
- `wrangler.toml`: Cloudflare Wrangler configuration

### Linting & Code Quality
- `.eslintignore`: ESLint ignore file
- `.eslintrc.cjs`: ESLint configuration
- `.stylelintignore`: Stylelint ignore file
- `.stylelintrc.json`: Stylelint configuration
- `tsconfig.json`: TypeScript configuration

## Summary

**Total Script Count**: Approximately 165+ scripts across all directories

**Key Categories**:
- **Build & Development**: Core build pipeline, dev server, asset processing
- **Validation & Testing**: Comprehensive test suites, linting, performance checks
- **Content Generation**: Blog posts, AMP pages, localized content
- **Monitoring & Analytics**: Performance tracking, SEO analysis, visual regression
- **Utilities & Maintenance**: Cleanup, link fixing, cache management
- **Debug & Testing**: Debug scripts, test utilities, validation tools
- **Cloudflare Integration**: API diagnostics, analytics setup, deployment tools

**Script Types** (Source Scripts Only - Excluding Build Outputs)**:
- JavaScript (.js): ~135 files (206 total including dist/public outputs)
- ES Modules (.mjs): ~17 files
- CommonJS (.cjs): ~8 files
- PowerShell (.ps1): ~10 files
- Shell (.sh): ~1 file
- HTML (.html): ~12 files (test/debug files)
- JSON/Markdown: Configuration and documentation

**Note**: The project contains additional compiled JavaScript files in `dist/` and `public/` directories (approximately 70+ files) that are build outputs, not source scripts. These are excluded from the inventory as they are generated artifacts rather than development/maintenance scripts.

This inventory represents the complete set of system building scripts as of January 1, 2026.