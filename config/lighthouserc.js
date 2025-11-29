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
        // Core Web Vitals budgets
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // 2.5s
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],   // 1.8s
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],   // 0.1
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],        // 300ms
        'interactive': ['warn', { maxNumericValue: 3800 }],                // 3.8s
        
        // Performance score budgets
        'categories:performance': ['error', { minScore: 0.9 }],    // 90+
        'categories:accessibility': ['error', { minScore: 0.95 }], // 95+
        'categories:best-practices': ['warn', { minScore: 0.9 }],  // 90+
        'categories:seo': ['error', { minScore: 0.95 }],           // 95+
        
        // Resource budgets
        'resource-summary:document:size': ['warn', { maxNumericValue: 50 * 1024 }],    // 50KB HTML
        'resource-summary:stylesheet:size': ['warn', { maxNumericValue: 200 * 1024 }], // 200KB CSS
        'resource-summary:script:size': ['warn', { maxNumericValue: 300 * 1024 }],     // 300KB JS
        'resource-summary:font:size': ['warn', { maxNumericValue: 150 * 1024 }],       // 150KB fonts
        'resource-summary:image:size': ['warn', { maxNumericValue: 500 * 1024 }],      // 500KB images
        'resource-summary:total:size': ['warn', { maxNumericValue: 1000 * 1024 }],     // 1MB total
        
        // Network requests budget
        'resource-summary:total:count': ['warn', { maxNumericValue: 50 }], // Max 50 requests
        
        // Specific audits
        'uses-responsive-images': 'warn',
        'offscreen-images': 'warn',
        'render-blocking-resources': 'warn',
        'unused-css-rules': 'warn',
        'unused-javascript': 'warn',
        'modern-image-formats': 'warn',
        'uses-optimized-images': 'warn',
        'uses-text-compression': 'error',
        'uses-rel-preconnect': 'off', // We manually manage preconnect
        'font-display': 'warn',
        
        // Accessibility
        'aria-hidden-body': 'error',
        'color-contrast': 'error',
        'duplicate-id': 'error',
        'html-has-lang': 'error',
        'valid-lang': 'error',
        
        // Best practices
        'errors-in-console': 'warn',
        'no-vulnerable-libraries': 'warn',
        'doctype': 'error',
        'charset': 'error',
        
        // SEO
        'meta-description': 'error',
        'http-status-code': 'error',
        'crawlable-anchors': 'warn',
        'link-text': 'warn',
        'tap-targets': 'warn',
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
