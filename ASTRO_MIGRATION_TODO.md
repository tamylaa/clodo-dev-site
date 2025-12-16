# Astro Migration Fix Todo List

## Phase 1: Build Process Fixes
- [x] Fix inconsistent Footer component inclusion across all pages
- [x] Ensure all pages use proper HTML instead of SSI directives
- [x] Verify Astro build creates consistent output for all routes
- [x] Test build process with different page types (static, dynamic, etc.)
- [x] Remove legacy HTML files from public directory that were causing conflicts

## Phase 2: Content Structure Validation
- [x] Ensure all pages have proper semantic HTML (nav, main, footer)
- [x] Validate page-specific content is preserved during migration
- [x] Check navigation links and internal routing work correctly
- [x] Verify meta tags, titles, and SEO elements are intact
- [x] Updated test URLs to use directory-based paths (/about/ instead of /about.html)
- [x] Fixed page-specific content selectors to match actual page structure

## Phase 3: Security & CSP Configuration
- [x] Review CSP policy for legitimate external resources (fonts, analytics)
- [x] Allow necessary inline styles and external frames where appropriate
- [x] Ensure CSP doesn't break core functionality
- [x] Test CSP headers work correctly in production
- [x] Updated test to distinguish between CSP security policies and JavaScript errors

## Phase 4: Testing & Validation
- [x] Update content validation tests to handle build inconsistencies
- [x] Create automated tests for footer inclusion across all pages
- [x] Add tests for semantic HTML structure validation
- [x] Implement regression tests for common migration issues
- [x] Fixed test URLs to use directory-based paths
- [x] Fixed page-specific content selectors
- [ ] Stabilize test server to prevent random stops
- [ ] Run comprehensive test suite across all pages
- [ ] Identify and fix remaining page-specific content issues

## Phase 5: Performance & Optimization
- [ ] Ensure LCP (Largest Contentful Paint) is maintained or improved
- [ ] Verify Core Web Vitals are not negatively impacted
- [ ] Check bundle sizes and loading performance
- [ ] Optimize asset loading and caching strategies

## Phase 6: Deployment & Production
- [ ] Test deployment process with new Astro build
- [ ] Verify all redirects and routing work correctly
- [ ] Check analytics and tracking still function
- [ ] Validate production build serves correctly

## Completed Tasks
- [x] Created comprehensive content validation test suite (103 test cases)
- [x] Identified inconsistent footer inclusion as root cause
- [x] Updated test to distinguish between CSP security policies and JS errors
- [x] Documented build process issues with SSI directive retention</content>
<parameter name="filePath">g:\coding\clodo-dev-site\ASTRO_MIGRATION_TODO.md