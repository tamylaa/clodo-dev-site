/**
 * System Initialization Script
 *
 * Loads and initializes all core systems, exposing them to the global scope
 * for browser-based testing and integration.
 */

console.log('🔄 init-systems.js starting...');

// Load core modules as regular scripts (they are now IIFEs)
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Load all core modules
async function loadCoreModules() {
    try {
        console.log('📦 Loading core modules...');

        // Load modules in dependency order (using relative paths)
        await loadScript('./js/core/performance-monitor.js');
        console.log('✅ Performance Monitor loaded');

        await loadScript('./js/core/seo.js');
        console.log('✅ SEO System loaded');

        await loadScript('./js/core/accessibility.js');
        console.log('✅ Accessibility Manager loaded');

        await loadScript('./js/features/icon-system.js');
        console.log('✅ Icon System loaded');

        console.log('🌐 All modules loaded successfully');

        // Verify modules are available
        console.log('🌐 Modules exposed to window:', {
            PerformanceMonitor: typeof window.PerformanceMonitor,
            SEO: typeof window.SEO,
            AccessibilityManager: typeof window.AccessibilityManager,
            a11y: typeof window.a11y
        });

        // Initialize systems with default configurations
        initializeSystems();

    } catch (error) {
        console.error('❌ Error loading modules:', error);
    }
}

function initializeSystems() {
    console.log('📋 Initializing systems...');

    // Initialize Performance Monitor
    if (window.PerformanceMonitor && typeof window.PerformanceMonitor.init === 'function') {
        window.PerformanceMonitor.init({
            debug: false,
            sampleRate: 1.0,
            enableBeacon: true
        });
        console.log('✅ Performance Monitor initialized');
    }

    // Initialize SEO System
    if (window.SEO && typeof window.SEO.init === 'function') {
        window.SEO.init({
            baseUrl: 'https://clodo.dev',
            siteTitle: 'Clodo Framework'
        });
        console.log('✅ SEO System initialized');
    }

    // Accessibility Manager auto-initializes on DOMContentLoaded
    // but we can verify it's available
    if (window.AccessibilityManager) {
        console.log('✅ Accessibility Manager available');
    }

    // Icon System auto-initializes on DOMContentLoaded
    if (window.iconSystem) {
        console.log('✅ Icon System available');
    }

    console.log('🎉 All systems initialized successfully');
}

// Load modules when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCoreModules);
} else {
    loadCoreModules();
}
