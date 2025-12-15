/**
 * Main Entry Point for Clodo Framework JavaScript
 *
 * This file demonstrates the future ES6 module structure
 * Currently runs alongside script.js during transition period
 *
 * Architecture:
 * - ES6 modules with explicit imports/exports
 * - Feature-based organization
 * - Lazy loading for non-critical features
 * - Progressive enhancement
 */

// Feature flags are loaded as IIFE and available on window.FeatureFlags
// import {
//     isFeatureEnabled,
//     getEnabledFeatures,
//     isBrowserSupported
// } from './config/features.js';

// Core modules are loaded as IIFEs and available on window object
// import PerformanceMonitor from './core/performance-monitor.js';
// import SEO from './core/seo.js';
// import AccessibilityManager from './core/accessibility.js';

/**
 * Dynamically load a script
 * @param {string} src - Script source URL
 * @returns {Promise} Resolves when script is loaded
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * Initialize accessibility enhancements
 * Accessibility is auto-initialized by the IIFE in accessibility.js
 */
function initAccessibility() {
    try {
        // Accessibility is already initialized by the IIFE
        // Just verify it's working
        if (window.a11y && typeof window.a11y.generateReport === 'function') {
            if (window.location.hostname === 'localhost') {
                console.log('[Accessibility] Already initialized. Use window.a11y to access methods');
                console.log('[Accessibility] Run window.a11y.generateReport() for compliance report');
            }
        } else {
            console.warn('[Accessibility] Not available - accessibility.js may not have loaded');
        }
        
    } catch (error) {
        console.error('[Main.js] Failed to verify accessibility:', error);
    }
}

/**
 * Initialize performance monitoring
 * Starts tracking immediately for accurate metrics
 */
function initPerformanceMonitoring() {
    try {
        if (!window.PerformanceMonitor || typeof window.PerformanceMonitor.init !== 'function') {
            console.warn('[Main.js] PerformanceMonitor not available - skipping initialization');
            return;
        }

        window.PerformanceMonitor.init({
            debug: window.location.hostname === 'localhost',
            sampleRate: 1.0, // 100% on localhost, adjust for production
            analytics: {
                enabled: false, // Enable when analytics is set up
                provider: null,
            },
        });
        
        // Log initial report after 5 seconds
        setTimeout(() => {
            if (window.location.hostname === 'localhost') {
                console.log('[Performance Report]', window.PerformanceMonitor.getReport());
            }
        }, 5000);
        
    } catch (error) {
        console.error('[Main.js] Failed to initialize performance monitoring:', error);
    }
}

/**
 * Initialize SEO system
 * Sets up structured data and meta tags
 */
function initSEO() {
    try {
        if (!window.SEO || typeof window.SEO.init !== 'function') {
            console.warn('[Main.js] SEO module not available - skipping initialization');
            return;
        }

        window.SEO.init({
            baseUrl: window.location.origin,
            defaultImage: '/assets/images/og-default.jpg',
            defaultAuthor: 'Clodo Framework Team',
            twitterHandle: '@clodoframework',
        });
        
        // Add Organization schema (global)
        window.SEO.addOrganizationSchema({
            name: 'Clodo Framework',
            logo: '/assets/images/logo.svg',
            description: 'Modern JavaScript framework for building enterprise-grade web applications with unprecedented speed',
            email: 'support@clodo.dev',
            socialLinks: [
                'https://github.com/clodoframework',
                'https://twitter.com/clodoframework',
            ],
        });
        
        // Add WebSite schema with search
        window.SEO.addWebSiteSchema({
            name: 'Clodo Framework',
            description: 'Transform 6-month development cycles into 6 weeks with production-ready components',
        });
        
        // Page-specific schemas based on current page
        const path = window.location.pathname;
        
        if (path === '/' || path === '/index.html') {
            // Homepage - Add Software schema
            window.SEO.addSoftwareSchema({
                name: 'Clodo Framework',
                description: 'Modern JavaScript framework for building enterprise-grade web applications',
                version: '1.0.0',
                downloadUrl: window.location.origin + '/docs/quick-start',
            });
        }
        
        console.log('[SEO] Initialized with structured data');
    } catch (error) {
        console.error('[Main.js] Failed to initialize SEO:', error);
    }
}

/**
 * Initialize core features
 * These run immediately on page load
 */
async function initCore() {
    console.log('[Main.js] Initializing core features...');
    // Defensive defaults for FeatureFlags
    if (!window.FeatureFlags) {
        window.FeatureFlags = {
            isFeatureEnabled: () => false,
            isBrowserSupported: () => true,
            getEnabledFeatures: () => [],
        };
    }

    // Initialize performance monitoring
    initPerformanceMonitoring();

    // Initialize SEO
    initSEO();

    // Initialize accessibility
    initAccessibility();

    // Theme manager - always available, but can be modular
    if (window.FeatureFlags && window.FeatureFlags.isFeatureEnabled('THEME_MANAGER_MODULE')) {
        try {
            const ThemeManager = await import('./core/theme.js');
            ThemeManager.init();
            console.log('[Main.js] ✓ Theme manager module loaded');
        } catch (error) {
            console.error('[Main.js] Failed to load theme manager:', error);
        }
    }
}

/**
 * Initialize page-specific features
 * These load after DOM is ready
 */
async function initFeatures() {
    console.log('[Main.js] Initializing page features...');
    
    // Navigation component
    if (window.FeatureFlags.isFeatureEnabled('NAVIGATION_MODULE')) {
        try {
            const Navigation = await import('./ui/navigation.js');
            Navigation.init();
            console.log('[Main.js] ✓ Navigation module loaded');
        } catch (error) {
            console.error('[Main.js] Failed to load navigation:', error);
        }
    }
}

/**
 * Initialize deferred features
 * These load after page is interactive (requestIdleCallback)
 */
async function initDeferred() {
    console.log('[Main.js] Initializing deferred features...');
    
    // Performance monitoring (production only)
    if (window.FeatureFlags.isFeatureEnabled('PERFORMANCE_MONITORING')) {
        try {
            const Performance = await import('./features/performance.js');
            Performance.init();
            console.log('[Main.js] ✓ Performance monitoring loaded');
        } catch (error) {
            console.error('[Main.js] Failed to load performance monitoring:', error);
        }
    }
    
    // Error tracking (production only)
    if (window.FeatureFlags.isFeatureEnabled('ERROR_TRACKING')) {
        try {
            const ErrorTracking = await import('./features/error-tracking.js');
            ErrorTracking.init();
            console.log('[Main.js] ✓ Error tracking loaded');
        } catch (error) {
            console.error('[Main.js] Failed to load error tracking:', error);
        }
    }
    
    // Brevo Chat (engagement magnet)
    if (window.FeatureFlags.isFeatureEnabled('BREVO_CHAT')) {
        try {
            const BrevoChat = await import('./features/brevo-chat.js');
            const chatManager = new BrevoChat.default();
            chatManager.init({
                websiteId: '68fe79edfbaca7d0230ae87d' // Your Brevo website ID
            });
            console.log('[Main.js] ✓ Brevo chat loaded');
        } catch (error) {
            console.error('[Main.js] Failed to load Brevo chat:', error);
        }
    }
}

/**
 * Main initialization
 * Called when DOM is ready
 */
function init() {
    // Check if ES6 modules are enabled
    if (!window.FeatureFlags.isFeatureEnabled('ES6_MODULES')) {
        console.log('[Main.js] Module system disabled. Using legacy script.js');
        return;
    }
    
    // Check browser support
    if (!window.FeatureFlags.isBrowserSupported('ES6_MODULES')) {
        console.warn('[Main.js] ES6 modules not supported, falling back to legacy script.js');
        return;
    }

    console.log('[Main.js] 🚀 Initializing Clodo Framework modules...');
    console.log('[Main.js] Enabled features:', window.FeatureFlags.getEnabledFeatures().join(', '));
    
    // Initialize core features immediately
    initCore();
    
    // Initialize page features after DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFeatures);
    } else {
        initFeatures();
    }
    
    // Initialize deferred features when idle
    if (window.FeatureFlags.isFeatureEnabled('IDLE_CALLBACK') && 'requestIdleCallback' in window) {
        requestIdleCallback(initDeferred);
    } else {
        setTimeout(initDeferred, 1000);
    }
}

// Auto-initialize
init();

// Export for testing and manual initialization
export { init, initCore, initFeatures, initDeferred };

