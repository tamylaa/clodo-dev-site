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

import { 
    isFeatureEnabled, 
    getEnabledFeatures, 
    isBrowserSupported 
} from './config/features.js';

/**
 * Initialize core features
 * These run immediately on page load
 */
async function initCore() {
    console.log('[Main.js] Initializing core features...');
    
    // Theme manager - always available, but can be modular
    if (isFeatureEnabled('THEME_MANAGER_MODULE')) {
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
    
    // Newsletter form handler
    if (isFeatureEnabled('NEWSLETTER_MODULE')) {
        const newsletterForms = document.querySelectorAll('form[action*="newsletter"]');
        if (newsletterForms.length > 0) {
            try {
                const Newsletter = await import('./features/newsletter.js');
                Newsletter.init();
                console.log('[Main.js] ✓ Newsletter module loaded');
            } catch (error) {
                console.error('[Main.js] Failed to load newsletter:', error);
            }
        }
    }
    
    // Navigation component
    if (isFeatureEnabled('NAVIGATION_MODULE')) {
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
    if (isFeatureEnabled('PERFORMANCE_MONITORING')) {
        try {
            const Performance = await import('./features/performance.js');
            Performance.init();
            console.log('[Main.js] ✓ Performance monitoring loaded');
        } catch (error) {
            console.error('[Main.js] Failed to load performance monitoring:', error);
        }
    }
    
    // Error tracking (production only)
    if (isFeatureEnabled('ERROR_TRACKING')) {
        try {
            const ErrorTracking = await import('./features/error-tracking.js');
            ErrorTracking.init();
            console.log('[Main.js] ✓ Error tracking loaded');
        } catch (error) {
            console.error('[Main.js] Failed to load error tracking:', error);
        }
    }
}

/**
 * Main initialization
 * Called when DOM is ready
 */
function init() {
    // Check if ES6 modules are enabled
    if (!isFeatureEnabled('ES6_MODULES')) {
        console.log('[Main.js] Module system disabled. Using legacy script.js');
        return;
    }
    
    // Check browser support
    if (!isBrowserSupported('ES6_MODULES')) {
        console.warn('[Main.js] ES6 modules not supported, falling back to legacy script.js');
        return;
    }

    console.log('[Main.js] 🚀 Initializing Clodo Framework modules...');
    console.log('[Main.js] Enabled features:', getEnabledFeatures().join(', '));
    
    // Initialize core features immediately
    initCore();
    
    // Initialize page features after DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFeatures);
    } else {
        initFeatures();
    }
    
    // Initialize deferred features when idle
    if (isFeatureEnabled('IDLE_CALLBACK') && 'requestIdleCallback' in window) {
        requestIdleCallback(initDeferred);
    } else {
        setTimeout(initDeferred, 1000);
    }
}

// Auto-initialize
init();

// Export for testing and manual initialization
export { init, initCore, initFeatures, initDeferred };

