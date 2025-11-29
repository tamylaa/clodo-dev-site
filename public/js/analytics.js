/**
 * Deferred Analytics Loading
 * Loads analytics after page is interactive to prevent performance impact
 * Following the same pattern as defer-css.js for consistency
 */

(function() {
    'use strict';

    /**
     * Load analytics script after page is fully interactive
     * This prevents blocking the main thread during initial render
     */
    function loadAnalytics() {
        // Check if we should load analytics (respect DNT, privacy settings, etc)
        if (navigator.doNotTrack === '1' || window.doNotTrack === '1') {
            console.log('Analytics disabled: DNT header detected');
            return;
        }

        // Load Cloudflare Web Analytics beacon
        // This is manually controlled instead of auto-injected for performance
        const beaconScript = document.createElement('script');
        beaconScript.defer = true;
        beaconScript.src = 'https://static.cloudflareinsights.com/beacon.min.js';
        beaconScript.setAttribute('data-cf-beacon', '{"token": "YOUR_BEACON_TOKEN"}');
        
        // Load after a delay to ensure no impact on LCP/FCP
        setTimeout(function() {
            document.head.appendChild(beaconScript);
        }, 2000); // 2 second delay after page interactive

        console.log('Analytics will load in 2 seconds (deferred for performance)');
    }

    /**
     * Initialize analytics loading after page is fully interactive
     * Uses the same pattern as defer-css.js for consistency
     */
    function initAnalytics() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                // Use requestIdleCallback if available (best practice)
                if ('requestIdleCallback' in window) {
                    requestIdleCallback(loadAnalytics, { timeout: 3000 });
                } else {
                    // Fallback: delay slightly after page interactive
                    requestAnimationFrame(function() {
                        setTimeout(loadAnalytics, 100);
                    });
                }
            });
        } else {
            // Document already loaded
            if ('requestIdleCallback' in window) {
                requestIdleCallback(loadAnalytics, { timeout: 3000 });
            } else {
                requestAnimationFrame(function() {
                    setTimeout(loadAnalytics, 100);
                });
            }
        }
    }

    // Initialize deferred analytics
    initAnalytics();
})();
