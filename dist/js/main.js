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

// Static imports for critical features to avoid CSP issues with dynamic imports
// import { init as newsletterInit } from './features/newsletter.js';
import { init as stackblitzInit } from './integrations/stackblitz.js';

// Core modules are loaded as IIFEs and available on window object
// import PerformanceMonitor from './core/performance-monitor.js';
// import SEO from './core/seo.js';
// import AccessibilityManager from './core/accessibility.js';

/**
 * Global production error reporter
 * Captures unhandled errors and sends diagnostic data to internal endpoint
 */
function setupProductionErrorReporter() {
    // Only enable on production (not localhost)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return;
    }

    // Track errors to avoid duplicates
    const reportedErrors = new Set();

    function reportError(errorData) {
        const errorKey = `${errorData.message}_${errorData.filename}_${errorData.line}`;
        if (reportedErrors.has(errorKey)) return;
        reportedErrors.add(errorKey);

        // Send to analytics endpoint (fire-and-forget)
        fetch('/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'client-error',
                ...errorData,
                timestamp: new Date().toISOString(),
                page: window.location.href,
                userAgent: navigator.userAgent
            })
        }).catch(() => {}); // Ignore reporting failures
    }

    // Catch synchronous errors
    window.addEventListener('error', (event) => {
        reportError({
            message: event.message || 'Unknown error',
            filename: event.filename || 'unknown',
            line: event.lineno || 0,
            column: event.colno || 0,
            stack: event.error?.stack || 'No stack trace'
        });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        reportError({
            message: `Unhandled Promise Rejection: ${event.reason}`,
            filename: 'promise',
            line: 0,
            column: 0,
            stack: event.reason?.stack || String(event.reason)
        });
    });
}

// Initialize error reporting immediately
setupProductionErrorReporter();

/**
 * Dynamically load a script
 * @param {string} src - Script source URL
 * @returns {Promise} Resolves when script is loaded
 */
function _loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Backwards-compatible global for inline 'Try It Live' buttons
// IMPORTANT: Must be synchronous (not async) because inline onclick="openStackBlitz()" cannot await
// Strategy: Try sync module access first, fall back to dynamic import promise, always return immediately
window.openStackBlitz = function openStackBlitzFallback(url) {
    console.log('[openStackBlitz] Called with URL:', url);
    
    // Fast path: if module already loaded synchronously, use it
    try {
        const stackblitzModule = window.__stackblitzModule;
        if (stackblitzModule && typeof stackblitzModule.openStackBlitz === 'function') {
            console.log('[openStackBlitz] Using cached module');
            return stackblitzModule.openStackBlitz(url);
        }
    } catch (e) {
        console.warn('[openStackBlitz] Cached module access failed', e);
    }

    // Fallback: open immediately with window.open (don't wait for dynamic import)
    console.log('[openStackBlitz] Opening with window.open fallback');
    try {
        const popupFeatures = 'width=1200,height=800,left=100,top=100,resizable=yes,scrollbars=yes,status=yes';
        const w = window.open(url, 'stackblitz-demo', popupFeatures);
        if (w) w.focus();
        return w;
    } catch (err) {
        console.error('[openStackBlitz] window.open failed', err);
        // Last resort: change location
        window.location.href = url;
        return null;
    }
};

/**
 * Lightweight runtime diagnostic: watch for resource load errors (images, scripts, links, iframes)
 * If a resource fails to load, attempt a HEAD request to detect HTTP status (e.g., 503)
 */
function initResourceFailureMonitoring() {
    // Use capture phase to catch resource errors (they don't bubble)
    window.addEventListener('error', (event) => {
        try {
            const target = event?.target || event?.srcElement;
            if (!target || !target.tagName) return;
            const tag = target.tagName.toLowerCase();
            if (!['img', 'script', 'link', 'iframe'].includes(tag)) return;

            const url = target.currentSrc || target.href || target.src;
            if (!url) return;

            // Fire-and-forget HEAD request to surface status code (may be blocked by CORS in production)
            fetch(url, { method: 'HEAD', cache: 'no-store' })
                .then(res => {
                    if (res && res.status === 503) {
                        console.warn(`[Main.js] Diagnostic: resource returned 503 for ${url}`);
                    }
                })
                .catch(err => {
                    // Network or CORS error; log for diagnostics
                    console.warn('[Main.js] Diagnostic fetch failed for', url, err);
                });
        } catch (err) {
            // Defensive: do not let this handler throw
            console.warn('[Main.js] Resource failure monitoring encountered an error', err);
        }
    }, true);
}

/**
 * Initialize accessibility enhancements
 * Accessibility is auto-initialized by the IIFE in accessibility.js
 */
async function initAccessibility() {
    try {
        // Accessibility is already initialized by the IIFE - verify and attempt dynamic load if missing
        if (window.a11y && typeof window.a11y.generateReport === 'function') {
            if (window.location.hostname === 'localhost') {
                console.log('[Accessibility] Already initialized. Use window.a11y to access methods');
                console.log('[Accessibility] Run window.a11y.generateReport() for compliance report');
            }
            return;
        }

        console.warn('[Accessibility] Not available - attempting dynamic import of accessibility module...');
        try {
            await import('./core/accessibility.js');
            if (window.a11y && typeof window.a11y.generateReport === 'function') {
                console.log('[Accessibility] accessibility.js loaded dynamically');
            } else {
                console.warn('[Accessibility] Module loaded but window.a11y is not available');
            }
        } catch (importErr) {
            console.warn('[Main.js] Failed to dynamically load accessibility module:', importErr);
        }
    } catch (error) {
        console.error('[Main.js] Failed to verify accessibility:', error);
    }
}

/**
 * Initialize performance monitoring
 * Starts tracking immediately for accurate metrics
 */
async function initPerformanceMonitoring() {
    try {
        // If the global PerformanceMonitor is available, use it directly
        if (window.PerformanceMonitor && typeof window.PerformanceMonitor.init === 'function') {
            window.PerformanceMonitor.init({
                debug: window.location.hostname === 'localhost',
                sampleRate: 1.0, // 100% on localhost, adjust for production
                analytics: {
                    enabled: false, // Enable when analytics is set up
                    provider: null,
                },
            });
        } else {
            // Try to dynamically import the module (will execute the IIFE and attach to window)
            console.warn('[Main.js] PerformanceMonitor not found on window, attempting dynamic import...');
            try {
                await import('./core/performance-monitor.js');
                if (window.PerformanceMonitor && typeof window.PerformanceMonitor.init === 'function') {
                    window.PerformanceMonitor.init({
                        debug: window.location.hostname === 'localhost',
                        sampleRate: 1.0,
                        analytics: { enabled: false, provider: null },
                    });
                } else {
                    console.warn('[Main.js] PerformanceMonitor module loaded but did not register global. Attaching shim to avoid runtime errors.');
                    // Attach a minimal shim so other code and tests that expect the global do not crash
                    window.PerformanceMonitor = window.PerformanceMonitor || {
                        init: () => {},
                        getReport: () => ({}),
                        getMetrics: () => ({}),
                        getErrors: () => [],
                        getTimings: () => [],
                        getLongTasks: () => [],
                        getTrends: () => ({}),
                        getResourceBreakdown: () => ({}),
                        getOptimizationRecommendations: () => [],
                        enableDebug: () => {},
                        disableDebug: () => {},
                        stop: () => {},
                        sendBeacon: () => {},
                    };
                    console.warn('[Main.js] Attached PerformanceMonitor shim to prevent runtime errors.');
                    return;
                }
            } catch (importErr) {
                console.warn('[Main.js] Dynamic import of PerformanceMonitor failed. Attaching shim and skipping performance monitoring.', importErr);
                window.PerformanceMonitor = window.PerformanceMonitor || {
                    init: () => {},
                    getReport: () => ({}),
                    getMetrics: () => ({}),
                    getErrors: () => [],
                    getTimings: () => [],
                    getLongTasks: () => [],
                    getTrends: () => ({}),
                    getResourceBreakdown: () => ({}),
                    getOptimizationRecommendations: () => [],
                    enableDebug: () => {},
                    disableDebug: () => {},
                    stop: () => {},
                    sendBeacon: () => {},
                };
                return;
            }
        }
        
        // Log initial report after 5 seconds if available
        setTimeout(() => {
            if (window.location.hostname === 'localhost' && window.PerformanceMonitor && typeof window.PerformanceMonitor.getReport === 'function') {
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
async function initSEO() {
    try {
        const ensureSEOInit = async () => {
            if (window.SEO && typeof window.SEO.init === 'function') return true;
            console.warn('[Main.js] SEO not found on window, attempting dynamic import...');
            try {
                await import('./core/seo.js');
                return !!(window.SEO && typeof window.SEO.init === 'function');
            } catch (importErr) {
                console.warn('[Main.js] Dynamic import of SEO failed. Skipping SEO initialization.', importErr);
                return false;
            }
        };

        const available = await ensureSEOInit();
        if (!available) {
            console.warn('[Main.js] SEO not available; attaching minimal shim to prevent runtime errors.');
            window.SEO = window.SEO || {
                init: () => {},
                addOrganizationSchema: () => {},
                addWebSiteSchema: () => {},
                addSoftwareSchema: () => {},
                addStructuredData: () => {},
                setPageMeta: () => {},
                makeAbsoluteUrl: (u) => (u || ''),
                getCurrentMeta: () => ({ title: document.title, description: '', url: window.location.href }),
            };
            return;
        }

        // Initialize with defaults
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
    
    // Initialize performance monitoring
    await initPerformanceMonitoring();
    
    // Initialize SEO
    await initSEO();
    
    // Initialize accessibility
    await initAccessibility();
    
    // Theme manager - always available, but can be modular
    if (window.FeatureFlags.isFeatureEnabled('THEME_MANAGER_MODULE')) {
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
    console.log('[Main.js] DOM ready state:', document.readyState);
    console.log('[Main.js] Current URL:', window.location.href);

    // Start resource failure diagnostics (detect 503s and other resource-level errors)
    initResourceFailureMonitoring();
    
    // Wait for FeatureFlags to be available
    if (!window.FeatureFlags) {
        console.log('[Main.js] Waiting for FeatureFlags to load...');
        await new Promise((resolve) => {
            const checkFlags = () => {
                if (window.FeatureFlags) {
                    resolve();
                } else {
                    setTimeout(checkFlags, 10);
                }
            };
            checkFlags();
        });
        console.log('[Main.js] FeatureFlags loaded');
    }
    
    // Debug feature flags
    console.log('[Main.js] FeatureFlags object:', window.FeatureFlags);
    console.log('[Main.js] Enabled features:', window.FeatureFlags ? window.FeatureFlags.getEnabledFeatures() : 'FeatureFlags not loaded');
    console.log('[Main.js] NEWSLETTER_MODULE enabled:', window.FeatureFlags ? window.FeatureFlags.isFeatureEnabled('NEWSLETTER_MODULE') : 'FeatureFlags not loaded');
    console.log('[Main.js] Enabled features:', window.FeatureFlags.getEnabledFeatures().join(', '));
    
    // Debug DOM elements
    const newsletterForms = document.querySelectorAll('[data-newsletter-form]');
    const stackblitzButtons = document.querySelectorAll('[data-stackblitz-url]');
    const onclickButtons = document.querySelectorAll('[onclick*="openStackBlitz"]');
    
    console.log('[Main.js] Found newsletter forms:', newsletterForms.length);
    console.log('[Main.js] Found StackBlitz buttons:', stackblitzButtons.length);
    console.log('[Main.js] Found onclick buttons:', onclickButtons.length);
    
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

    // Newsletter form handler: initialize if page contains newsletter form
    try {
        const hasNewsletterForm = document.querySelector('[data-newsletter-form]') !== null;
        console.log('[Main.js] Newsletter form check:', hasNewsletterForm, 'NEWSLETTER_MODULE enabled:', window.FeatureFlags.isFeatureEnabled('NEWSLETTER_MODULE'));
        if (hasNewsletterForm && window.FeatureFlags.isFeatureEnabled('NEWSLETTER_MODULE')) {
            console.log('[Main.js] Importing newsletter module...');
            try {
                const { init: newsletterInit } = await import('./features/newsletter.js');
                console.log('[Main.js] Newsletter import successful, init function:', typeof newsletterInit);
                if (typeof newsletterInit === 'function') {
                    newsletterInit();
                    console.log('[Main.js] ✓ Newsletter form handler initialized');
                } else {
                    console.error('[Main.js] Newsletter init is not a function:', newsletterInit);
                }
            } catch (importError) {
                console.error('[Main.js] Newsletter import failed:', importError);
                console.error('[Main.js] Import error details:', {
                    message: importError.message,
                    stack: importError.stack,
                    name: importError.name
                });
            }
        } else {
            console.log('[Main.js] Newsletter conditions not met - forms:', hasNewsletterForm, 'module enabled:', window.FeatureFlags.isFeatureEnabled('NEWSLETTER_MODULE'));
        }
    } catch (err) {
        console.error('[Main.js] Newsletter form handler setup failed:', err);
    }

    // StackBlitz integration: initialize if page contains data-stackblitz-url or hero CTA
    try {
        const hasTryIt = document.querySelector('[data-stackblitz-url]') !== null || document.querySelector('[onclick*="openStackBlitz("]') !== null;
        console.log('[Main.js] StackBlitz check:', hasTryIt, 'Elements found:', document.querySelectorAll('[data-stackblitz-url]').length);
        if (hasTryIt) {
            console.log('[Main.js] Initializing StackBlitz module...');
            try {
                stackblitzInit();
                console.log('[Main.js] ✓ StackBlitz integration initialized');
            } catch (initError) {
                console.error('[Main.js] StackBlitz init failed:', initError);
            }
        } else {
            console.log('[Main.js] No StackBlitz elements found, skipping module load');
        }
    } catch (err) {
        console.error('[Main.js] StackBlitz integration setup failed:', err);
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
async function init() {
    // Wait for FeatureFlags to be available
    if (!window.FeatureFlags) {
        console.log('[Main.js] Waiting for FeatureFlags to load...');
        await new Promise((resolve) => {
            const checkFlags = () => {
                if (window.FeatureFlags) {
                    resolve();
                } else {
                    setTimeout(checkFlags, 10);
                }
            };
            checkFlags();
        });
        console.log('[Main.js] FeatureFlags loaded');
    }
    
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

