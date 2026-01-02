/**
 * Lighthouse CI Configuration
 * 
 * Performance monitoring and budgets for the Clodo Framework website.
 * 
 * This configuration:
 * - Defines performance budgets for key metrics
 * - Sets up assertions for Core Web Vitals
 * - Configures automated Lighthouse audits
 * - Integrates with CI/CD pipeline
 * 
 * @see https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md
 */

export default {
  ci: {
    collect: {
      // Use Vite dev server for development testing
      startServerCommand: 'npm run dev',
      startServerReadyPattern: 'ready in',
      staticDistDir: null,
      url: [
        'http://localhost:5173/',
      ],
      numberOfRuns: 3, // Run 3 times and take median
      settings: {
        preset: 'desktop',
        // Throttling settings (simulated Fast 3G)
        throttling: {
          rttMs: 40,
          throughputKbps: 10 * 1024,
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    
    assert: {
      assertions: {
        // Core Web Vitals budgets (relaxed for CI)
        'largest-contentful-paint': ['warn', { maxNumericValue: 3000 }], // 3s
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],   // 2s
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.25 }],  // 0.25
        'total-blocking-time': ['warn', { maxNumericValue: 500 }],       // 500ms
        'interactive': ['warn', { maxNumericValue: 4000 }],               // 4s
        
        // Performance score budgets (relaxed for CI)
        'categories:performance': ['warn', { minScore: 0.8 }],    // 80+
        'categories:accessibility': ['warn', { minScore: 0.9 }], // 90+
        'categories:best-practices': ['warn', { minScore: 0.8 }], // 80+
        'categories:seo': ['error', { minScore: 0.9 }],           // 90+
        
        // Resource budgets
        'resource-summary:document:size': ['warn', { maxNumericValue: 50 * 1024 }],    // 50KB HTML
        'resource-summary:stylesheet:size': ['warn', { maxNumericValue: 200 * 1024 }], // 200KB CSS
        'resource-summary:script:size': ['warn', { maxNumericValue: 300 * 1024 }],     // 300KB JS
        'resource-summary:font:size': ['warn', { maxNumericValue: 150 * 1024 }],       // 150KB fonts
        'resource-summary:image:size': ['warn', { maxNumericValue: 500 * 1024 }],      // 500KB images
        'resource-summary:total:size': ['warn', { maxNumericValue: 1000 * 1024 }],     // 1MB total
        
        // Network requests budget
        'resource-summary:total:count': ['warn', { maxNumericValue: 50 }], // Max 50 requests
        
        // Specific audits (relaxed for CI)
        'uses-responsive-images': 'off',
        'offscreen-images': 'off',
        'render-blocking-resources': 'off',
        'unused-css-rules': 'off',
        'unused-javascript': 'off',
        'modern-image-formats': 'off',
        'uses-optimized-images': 'off',
        'uses-text-compression': 'off',
        'font-display': 'off',
        
        // Accessibility (relaxed for CI)
        'aria-hidden-body': 'off',
        'color-contrast': 'off',
        'duplicate-id': 'off',
        'html-has-lang': 'off',
        'valid-lang': 'off',
        
        // Best practices (relaxed for CI)
        'errors-in-console': 'off',
        'no-vulnerable-libraries': 'off',
        'doctype': 'off',
        'charset': 'off',
        
        // SEO (keep critical ones)
        'meta-description': 'error',
        'http-status-code': 'error',
        'crawlable-anchors': 'off',
        'link-text': 'off',
        'tap-targets': 'off',
      },
    },
    
    upload: {
      // Target for CI - can be configured for Lighthouse CI server
      target: 'temporary-public-storage', // Free temporary storage
      // For production, use: target: 'lhci', serverBaseUrl: 'https://your-lhci-server.com'
    },
    
    // Server configuration (if running own LHCI server)
    // server: {
    //   port: 9001,
    //   storage: {
    //     storageMethod: 'sql',
    //     sqlDialect: 'sqlite',
    //     sqlDatabasePath: './lhci.db',
    //   },
    // },
  },
};
