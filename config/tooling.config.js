/**
 * Tooling Configuration
 * 
 * Central configuration for all build tools, testing, and deployment scripts.
 * This file is used by:
 * - Build scripts (check-*, fix-*, observe-*)
 * - Testing tools (Lighthouse, Playwright)
 * - Deployment tools (Cloudflare, wrangler)
 * - SEO tools (sitemap, canonicals)
 * 
 * Update this file when setting up a new project.
 */

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load site config if available
let siteConfig = null;
try {
    const siteConfigModule = await import('./site.config.js');
    siteConfig = siteConfigModule.default;
} catch (e) {
    // Site config not available yet
}

/**
 * Project Configuration
 */
const toolingConfig = {
    // ===================
    // PROJECT IDENTITY
    // ===================
    project: {
        // Cloudflare Pages project name (used in wrangler, API calls)
        name: process.env.CF_PROJECT_NAME || siteConfig?.cloudflare?.project || 'my-website',
        
        // Display name for logs and reports
        displayName: siteConfig?.site?.name || 'My Website',
        
        // Short name for compact displays
        shortName: siteConfig?.site?.shortName || 'mysite'
    },
    
    // ===================
    // DOMAIN & URLS
    // ===================
    urls: {
        // Production URL (with https://)
        production: process.env.PRODUCTION_URL || siteConfig?.site?.url || 'https://example.com',
        
        // Production domain (without protocol)
        domain: process.env.DOMAIN || siteConfig?.site?.url?.replace(/^https?:\/\//, '') || 'example.com',
        
        // Local development server
        local: process.env.LOCAL_URL || 'http://localhost:8000',
        
        // Vite dev server
        vite: process.env.VITE_URL || 'http://localhost:5173',
        
        // Cloudflare Pages preview URL pattern
        pagesPreview: process.env.CF_PAGES_URL || `https://${siteConfig?.cloudflare?.project || 'my-website'}.pages.dev`
    },
    
    // ===================
    // CLOUDFLARE
    // ===================
    cloudflare: {
        // Account ID (from environment or config)
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID || '',
        
        // Zone ID for the domain
        zoneId: process.env.CLOUDFLARE_ZONE_ID || process.env.CF_ZONE_ID || '',
        
        // API Token (should only be in env, never in config)
        apiToken: process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN || '',
        
        // Pages project name
        pagesProject: process.env.CF_PROJECT_NAME || siteConfig?.cloudflare?.project || 'my-website',
        
        // Workers subdomain
        workersSubdomain: process.env.CF_WORKERS_SUBDOMAIN || ''
    },
    
    // ===================
    // TESTING
    // ===================
    testing: {
        // Base URL for tests (auto-detect CI vs local)
        baseUrl: process.env.TEST_BASE_URL || process.env.BASE_URL || 'http://localhost:8000',
        
        // Lighthouse CI URLs to test
        lighthouseUrls: [
            '/',
            '/pricing',
            '/about',
            '/blog'
        ],
        
        // Playwright test timeout
        timeout: parseInt(process.env.TEST_TIMEOUT) || 30000,
        
        // Screenshot on failure
        screenshotOnFailure: true,
        
        // Trace on first retry
        traceOnRetry: true
    },
    
    // ===================
    // SEO & CANONICALS
    // ===================
    seo: {
        // Canonical domain (without trailing slash)
        canonicalBase: process.env.CANONICAL_BASE || siteConfig?.site?.url || 'https://example.com',
        
        // Sitemap location
        sitemapPath: '/sitemap.xml',
        
        // Robots.txt location
        robotsPath: '/robots.txt',
        
        // Default hreflang
        defaultLocale: 'en',
        
        // Supported locales
        locales: ['en', 'en-GB', 'en-IN', 'en-AU']
    },
    
    // ===================
    // BUILD
    // ===================
    build: {
        // Output directory
        outDir: 'dist',
        
        // Public/source directory
        publicDir: 'public',
        
        // Enable debug logging
        debug: process.env.DEBUG === 'true' || false,
        
        // Skip checks in CI
        skipChecksInCI: process.env.CI === 'true'
    },
    
    // ===================
    // ANALYTICS
    // ===================
    analytics: {
        // Google Analytics ID
        googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID || process.env.GA_ID || '',
        
        // Cloudflare Web Analytics token
        cfWebAnalyticsToken: process.env.CF_WEB_ANALYTICS_TOKEN || '',
        
        // Enable/disable analytics in dev
        enableInDev: false
    }
};

/**
 * Get the base URL for the current environment
 */
export function getBaseUrl() {
    // CI environment - use local server
    if (process.env.CI) {
        return toolingConfig.urls.local;
    }
    
    // Explicit override
    if (process.env.BASE_URL) {
        return process.env.BASE_URL;
    }
    
    // Check if running against production
    if (process.argv.includes('--production') || process.argv.includes('--prod')) {
        return toolingConfig.urls.production;
    }
    
    // Default to local
    return toolingConfig.urls.local;
}

/**
 * Get Cloudflare API headers
 */
export function getCloudflareHeaders() {
    const token = toolingConfig.cloudflare.apiToken;
    if (!token) {
        throw new Error('CLOUDFLARE_API_TOKEN environment variable not set');
    }
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

/**
 * Validate required configuration for a specific tool
 */
export function validateConfig(requiredFields) {
    const missing = [];
    
    for (const field of requiredFields) {
        const parts = field.split('.');
        let value = toolingConfig;
        for (const part of parts) {
            value = value?.[part];
        }
        if (!value) {
            missing.push(field);
        }
    }
    
    if (missing.length > 0) {
        console.error('❌ Missing required configuration:');
        missing.forEach(f => console.error(`   - ${f}`));
        console.error('\nSet these in environment variables or config/site.config.js');
        return false;
    }
    
    return true;
}

/**
 * Get config value with fallback
 */
export function getConfig(path, defaultValue = null) {
    const parts = path.split('.');
    let value = toolingConfig;
    for (const part of parts) {
        value = value?.[part];
        if (value === undefined) return defaultValue;
    }
    return value ?? defaultValue;
}

// Export configuration
export { toolingConfig };
export default toolingConfig;
