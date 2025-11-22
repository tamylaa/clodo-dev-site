/**
 * Performance Monitor
 * 
 * Tracks Web Vitals, errors, resource timing, and user behavior
 * to provide data-driven insights for optimization decisions.
 * 
 * Features:
 * - Core Web Vitals (LCP, FID, CLS, FCP, TTFB)
 * - JavaScript errors tracking
 * - Resource loading performance
 * - User session metrics
 * - Network quality detection
 * - Integration with analytics
 * 
 * @module PerformanceMonitor
 */

/**
 * Configuration
 */
const config = {
    debug: false,
    
    // Performance thresholds (Google recommendations)
    thresholds: {
        // Largest Contentful Paint (LCP)
        lcp: {
            good: 2500,      // < 2.5s
            needsImprovement: 4000, // 2.5s - 4s
        },
        // First Input Delay (FID)
        fid: {
            good: 100,       // < 100ms
            needsImprovement: 300,  // 100ms - 300ms
        },
        // Cumulative Layout Shift (CLS)
        cls: {
            good: 0.1,       // < 0.1
            needsImprovement: 0.25, // 0.1 - 0.25
        },
        // First Contentful Paint (FCP)
        fcp: {
            good: 1800,      // < 1.8s
            needsImprovement: 3000, // 1.8s - 3s
        },
        // Time to First Byte (TTFB)
        ttfb: {
            good: 800,       // < 800ms
            needsImprovement: 1800, // 800ms - 1.8s
        },
    },
    
    // Sampling rate (0-1, 1 = 100% of users)
    sampleRate: 1.0,
    
    // Endpoints for reporting (optional)
    endpoints: {
        vitals: null,    // POST Web Vitals data
        errors: null,    // POST JavaScript errors
        timing: null,    // POST resource timing
    },
    
    // Analytics integration
    analytics: {
        enabled: false,
        provider: null,  // 'ga4', 'plausible', 'custom'
    },
};

/**
 * State
 */
const state = {
    metrics: {},
    errors: [],
    timings: [],
    sessionStart: Date.now(),
    isRecording: false,
    observers: new Map(),
};

/**
 * Log debug message
 */
function log(...args) {
    if (config.debug) {
        console.log('[PerformanceMonitor]', ...args);
    }
}

/**
 * Check if we should sample this session
 */
function shouldSample() {
    return Math.random() < config.sampleRate;
}

/**
 * Get rating for a metric value
 */
function getRating(metricName, value) {
    const threshold = config.thresholds[metricName.toLowerCase()];
    if (!threshold) return 'unknown';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
}

/**
 * Format metric for logging
 */
function formatMetric(name, value, unit = 'ms') {
    return `${name}: ${value.toFixed(2)}${unit}`;
}

// ==================== WEB VITALS ====================

/**
 * Measure Largest Contentful Paint (LCP)
 */
function measureLCP() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
        const observer = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            
            const lcp = lastEntry.renderTime || lastEntry.loadTime;
            const rating = getRating('lcp', lcp);
            
            state.metrics.lcp = { value: lcp, rating, timestamp: Date.now() };
            
            log(formatMetric('LCP', lcp), `[${rating}]`);
            
            // Report to analytics
            reportMetric('LCP', lcp, rating);
        });
        
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
        state.observers.set('lcp', observer);
        
    } catch (error) {
        console.error('Error measuring LCP:', error);
    }
}

/**
 * Measure First Input Delay (FID)
 */
function measureFID() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
        const observer = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            
            entries.forEach(entry => {
                const fid = entry.processingStart - entry.startTime;
                const rating = getRating('fid', fid);
                
                state.metrics.fid = { value: fid, rating, timestamp: Date.now() };
                
                log(formatMetric('FID', fid), `[${rating}]`);
                
                // Report to analytics
                reportMetric('FID', fid, rating);
            });
        });
        
        observer.observe({ type: 'first-input', buffered: true });
        state.observers.set('fid', observer);
        
    } catch (error) {
        console.error('Error measuring FID:', error);
    }
}

/**
 * Measure Cumulative Layout Shift (CLS)
 */
function measureCLS() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
        let clsValue = 0;
        let sessionValue = 0;
        let sessionEntries = [];
        
        const observer = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            
            entries.forEach(entry => {
                // Only count layout shifts without recent user input
                if (!entry.hadRecentInput) {
                    const firstSessionEntry = sessionEntries[0];
                    const lastSessionEntry = sessionEntries[sessionEntries.length - 1];
                    
                    // Start new session if gap > 1s or > 5s total
                    if (sessionValue &&
                        entry.startTime - lastSessionEntry.startTime > 1000 ||
                        entry.startTime - firstSessionEntry.startTime > 5000) {
                        
                        sessionValue = 0;
                        sessionEntries = [];
                    }
                    
                    sessionValue += entry.value;
                    sessionEntries.push(entry);
                    
                    // Update CLS if this session is larger
                    if (sessionValue > clsValue) {
                        clsValue = sessionValue;
                        const rating = getRating('cls', clsValue);
                        
                        state.metrics.cls = { value: clsValue, rating, timestamp: Date.now() };
                        
                        log(formatMetric('CLS', clsValue, ''), `[${rating}]`);
                        
                        // Report to analytics
                        reportMetric('CLS', clsValue, rating);
                    }
                }
            });
        });
        
        observer.observe({ type: 'layout-shift', buffered: true });
        state.observers.set('cls', observer);
        
    } catch (error) {
        console.error('Error measuring CLS:', error);
    }
}

/**
 * Measure First Contentful Paint (FCP)
 */
function measureFCP() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
        const observer = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            
            entries.forEach(entry => {
                if (entry.name === 'first-contentful-paint') {
                    const fcp = entry.startTime;
                    const rating = getRating('fcp', fcp);
                    
                    state.metrics.fcp = { value: fcp, rating, timestamp: Date.now() };
                    
                    log(formatMetric('FCP', fcp), `[${rating}]`);
                    
                    // Report to analytics
                    reportMetric('FCP', fcp, rating);
                }
            });
        });
        
        observer.observe({ type: 'paint', buffered: true });
        state.observers.set('fcp', observer);
        
    } catch (error) {
        console.error('Error measuring FCP:', error);
    }
}

/**
 * Measure Time to First Byte (TTFB)
 */
function measureTTFB() {
    try {
        const navigation = performance.getEntriesByType('navigation')[0];
        
        if (navigation) {
            const ttfb = navigation.responseStart - navigation.requestStart;
            const rating = getRating('ttfb', ttfb);
            
            state.metrics.ttfb = { value: ttfb, rating, timestamp: Date.now() };
            
            log(formatMetric('TTFB', ttfb), `[${rating}]`);
            
            // Report to analytics
            reportMetric('TTFB', ttfb, rating);
        }
    } catch (error) {
        console.error('Error measuring TTFB:', error);
    }
}

// ==================== ERROR TRACKING ====================

/**
 * Track JavaScript errors
 */
function trackErrors() {
    // Global error handler
    window.addEventListener('error', (event) => {
        const errorData = {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error ? event.error.stack : null,
            timestamp: Date.now(),
            url: window.location.href,
        };
        
        state.errors.push(errorData);
        
        log('JavaScript Error:', errorData);
        
        // Report to endpoint
        reportError(errorData);
    });
    
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        const errorData = {
            message: 'Unhandled Promise Rejection',
            reason: event.reason,
            timestamp: Date.now(),
            url: window.location.href,
        };
        
        state.errors.push(errorData);
        
        log('Promise Rejection:', errorData);
        
        // Report to endpoint
        reportError(errorData);
    });
}

// ==================== RESOURCE TIMING ====================

/**
 * Track resource loading performance
 */
function trackResourceTiming() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
        const observer = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            
            entries.forEach(entry => {
                const timing = {
                    name: entry.name,
                    type: entry.initiatorType,
                    duration: entry.duration,
                    size: entry.transferSize,
                    timestamp: Date.now(),
                };
                
                state.timings.push(timing);
                
                // Log slow resources (> 1s)
                if (entry.duration > 1000) {
                    log(`Slow resource (${entry.initiatorType}):`, entry.name, `${entry.duration.toFixed(2)}ms`);
                }
            });
        });
        
        observer.observe({ type: 'resource', buffered: true });
        state.observers.set('resource', observer);
        
    } catch (error) {
        console.error('Error tracking resource timing:', error);
    }
}

// ==================== NETWORK QUALITY ====================

/**
 * Detect network quality
 */
function detectNetworkQuality() {
    if (!('connection' in navigator)) return null;
    
    const connection = navigator.connection;
    
    return {
        effectiveType: connection.effectiveType, // '4g', '3g', '2g', 'slow-2g'
        downlink: connection.downlink,           // Mbps
        rtt: connection.rtt,                     // Round-trip time (ms)
        saveData: connection.saveData,           // Data saver enabled
    };
}

// ==================== USER SESSION ====================

/**
 * Track user session metrics
 */
function trackSession() {
    // Page visibility
    document.addEventListener('visibilitychange', () => {
        log('Visibility:', document.visibilityState);
        
        if (document.visibilityState === 'hidden') {
            // Send final report before page unloads
            sendBeacon();
        }
    });
    
    // Time on page
    window.addEventListener('beforeunload', () => {
        const sessionDuration = Date.now() - state.sessionStart;
        log('Session duration:', `${(sessionDuration / 1000).toFixed(2)}s`);
    });
}

// ==================== REPORTING ====================

/**
 * Report metric to analytics
 */
function reportMetric(name, value, rating) {
    if (!config.analytics.enabled) return;
    
    // Google Analytics 4
    if (config.analytics.provider === 'ga4' && window.gtag) {
        window.gtag('event', name, {
            value: Math.round(value),
            metric_rating: rating,
            event_category: 'Web Vitals',
        });
    }
    
    // Plausible Analytics
    else if (config.analytics.provider === 'plausible' && window.plausible) {
        window.plausible('Web Vitals', {
            props: {
                metric: name,
                value: Math.round(value),
                rating: rating,
            },
        });
    }
    
    // Custom endpoint
    else if (config.endpoints.vitals) {
        sendToEndpoint(config.endpoints.vitals, {
            metric: name,
            value: value,
            rating: rating,
            url: window.location.href,
            timestamp: Date.now(),
        });
    }
}

/**
 * Report error
 */
function reportError(errorData) {
    if (config.endpoints.errors) {
        sendToEndpoint(config.endpoints.errors, errorData);
    }
}

/**
 * Send data to endpoint
 */
function sendToEndpoint(endpoint, data) {
    if (!endpoint) return;
    
    // Use sendBeacon for reliability
    if ('sendBeacon' in navigator) {
        navigator.sendBeacon(endpoint, JSON.stringify(data));
    } else {
        // Fallback to fetch
        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            keepalive: true,
        }).catch(error => {
            console.error('Error sending data:', error);
        });
    }
}

/**
 * Send beacon with all collected data
 */
function sendBeacon() {
    const report = {
        metrics: state.metrics,
        errors: state.errors,
        timings: state.timings,
        network: detectNetworkQuality(),
        sessionDuration: Date.now() - state.sessionStart,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
    };
    
    log('Sending final report:', report);
    
    // Send to endpoints
    if (config.endpoints.vitals) {
        sendToEndpoint(config.endpoints.vitals, report);
    }
}

// ==================== PUBLIC API ====================

/**
 * Initialize performance monitoring
 */
function init(options = {}) {
    // Merge config
    Object.assign(config, options);
    
    // Check sampling
    if (!shouldSample()) {
        log('Session not sampled, skipping monitoring');
        return;
    }
    
    log('Initializing performance monitoring...');
    
    state.isRecording = true;
    
    // Measure Web Vitals
    measureLCP();
    measureFID();
    measureCLS();
    measureFCP();
    measureTTFB();
    
    // Track errors
    trackErrors();
    
    // Track resource timing
    trackResourceTiming();
    
    // Track session
    trackSession();
    
    log('Performance monitoring initialized');
}

/**
 * Get current metrics
 */
function getMetrics() {
    return { ...state.metrics };
}

/**
 * Get all errors
 */
function getErrors() {
    return [...state.errors];
}

/**
 * Get resource timings
 */
function getTimings() {
    return [...state.timings];
}

/**
 * Get performance report
 */
function getReport() {
    return {
        metrics: getMetrics(),
        errors: getErrors(),
        timings: getTimings(),
        network: detectNetworkQuality(),
        sessionDuration: Date.now() - state.sessionStart,
        url: window.location.href,
    };
}

/**
 * Enable debug mode
 */
function enableDebug() {
    config.debug = true;
    log('Debug mode enabled');
}

/**
 * Disable debug mode
 */
function disableDebug() {
    config.debug = false;
}

/**
 * Stop monitoring
 */
function stop() {
    state.isRecording = false;
    
    // Disconnect all observers
    state.observers.forEach(observer => observer.disconnect());
    state.observers.clear();
    
    log('Performance monitoring stopped');
}

/**
 * Export PerformanceMonitor API
 */
export default {
    init,
    getMetrics,
    getErrors,
    getTimings,
    getReport,
    enableDebug,
    disableDebug,
    stop,
    sendBeacon,
};

// Named exports
export {
    init,
    getMetrics,
    getErrors,
    getTimings,
    getReport,
    enableDebug,
    disableDebug,
    stop,
    sendBeacon,
};
