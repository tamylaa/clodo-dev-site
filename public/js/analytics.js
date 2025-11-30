/**
 * Professional Analytics Loading Strategy
 * Implements performance-first analytics with Web Vitals integration
 * Following Google's best practices for non-blocking analytics
 * 
 * Key Features:
 * - Loads after LCP to prevent render blocking
 * - Uses requestIdleCallback for optimal scheduling
 * - Integrates with Web Vitals for performance monitoring
 * - Respects privacy (DNT headers)
 * - Graceful degradation for older browsers
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        // Cloudflare Web Analytics - Get from: Pages → Settings → Web Analytics
        CLOUDFLARE_TOKEN: '049306cd3cd546ae91b66ebd97a71b89', // Token from Cloudflare dashboard snippet
        // Load analytics only after LCP is complete
        WAIT_FOR_LCP: true,
        // Minimum delay to ensure no impact on critical metrics
        MIN_DELAY: 1000,
        // Maximum wait time for LCP before loading anyway
        MAX_LCP_WAIT: 5000
    };

    /**
     * Check if analytics should be loaded
     */
    function shouldLoadAnalytics() {
        // Respect Do Not Track
        if (navigator.doNotTrack === '1' || window.doNotTrack === '1') {
            return false;
        }
        
        // Check if already loaded (prevent duplicates)
        if (window.__cfBeacon || document.querySelector('script[src*="cloudflareinsights"]')) {
            console.log('Analytics: Already loaded, skipping');
            return false;
        }
        
        return true;
    }

    /**
     * Load Cloudflare Web Analytics beacon
     * Uses best practices: defer, no blocking, async injection
     */
    function loadCloudflareBeacon() {
        // Check if Cloudflare already injected it (to avoid duplicates)
        if (document.querySelector('script[src*="cloudflareinsights.com"]')) {
            console.log('Analytics: Cloudflare beacon already loaded, skipping');
            return;
        }
        
        const script = document.createElement('script');
        script.defer = true;
        script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
        script.setAttribute('data-cf-beacon', JSON.stringify({
            token: CONFIG.CLOUDFLARE_TOKEN,
            spa: true // Enable SPA tracking if needed
        }));
        
        // Mark for Content Security Policy
        if (document.querySelector('script[nonce]')) {
            const nonce = document.querySelector('script[nonce]').getAttribute('nonce');
            if (nonce) script.setAttribute('nonce', nonce);
        }
        
        document.head.appendChild(script);
        console.log('Analytics: Cloudflare beacon loaded after LCP');
    }

    /**
     * Professional approach: Wait for LCP to complete before loading analytics
     * This ensures analytics has ZERO impact on Core Web Vitals
     */
    function loadAnalyticsAfterLCP() {
        let lcpComplete = false;
        let timeoutId;

        // Strategy 1: Use PerformanceObserver to detect LCP
        if ('PerformanceObserver' in window && 'PerformanceEventTiming' in window) {
            try {
                const observer = new PerformanceObserver(function(list) {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    
                    if (lastEntry && !lcpComplete) {
                        lcpComplete = true;
                        clearTimeout(timeoutId);
                        
                        // Schedule analytics load during idle time
                        scheduleAnalyticsLoad();
                    }
                });
                
                observer.observe({ type: 'largest-contentful-paint', buffered: true });
            } catch (e) {
                // Fallback if observer fails
                scheduleAnalyticsLoad();
            }
        } else {
            // No PerformanceObserver support - use time-based fallback
            scheduleAnalyticsLoad();
        }

        // Fallback: Load after max wait time even if LCP not detected
        timeoutId = setTimeout(function() {
            if (!lcpComplete) {
                lcpComplete = true;
                scheduleAnalyticsLoad();
            }
        }, CONFIG.MAX_LCP_WAIT);
    }

    /**
     * Schedule analytics loading during browser idle time
     * This is the professional standard for non-critical scripts
     */
    function scheduleAnalyticsLoad() {
        // Add minimum delay to ensure no impact
        setTimeout(function() {
            if ('requestIdleCallback' in window) {
                // Best approach: Load during idle time (when CPU is free)
                requestIdleCallback(function() {
                    loadCloudflareBeacon();
                }, { timeout: 3000 });
            } else {
                // Fallback for older browsers: Use requestAnimationFrame + setTimeout
                requestAnimationFrame(function() {
                    setTimeout(function() {
                        loadCloudflareBeacon();
                    }, 0);
                });
            }
        }, CONFIG.MIN_DELAY);
    }

    /**
     * Initialize analytics with proper timing
     */
    function initAnalytics() {
        if (!shouldLoadAnalytics()) {
            return;
        }

        if (document.readyState === 'loading') {
            // Wait for DOM to be ready
            document.addEventListener('DOMContentLoaded', function() {
                if (CONFIG.WAIT_FOR_LCP) {
                    loadAnalyticsAfterLCP();
                } else {
                    scheduleAnalyticsLoad();
                }
            });
        } else {
            // DOM already ready
            if (CONFIG.WAIT_FOR_LCP) {
                loadAnalyticsAfterLCP();
            } else {
                scheduleAnalyticsLoad();
            }
        }
    }

    // Start the analytics loading process
    initAnalytics();
})();
