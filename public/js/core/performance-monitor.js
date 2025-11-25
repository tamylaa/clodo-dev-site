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

(function() {
    'use strict';

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
        // Interaction to Next Paint (INP)
        inp: {
            good: 200,       // < 200ms
            needsImprovement: 500,  // 200ms - 500ms
        },
        // Total Blocking Time (TBT)
        tbt: {
            good: 200,       // < 200ms
            needsImprovement: 600,  // 200ms - 600ms
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
    longTasks: [],
    trends: {
        lcp: [],
        fid: [],
        cls: [],
        fcp: [],
        ttfb: [],
        inp: [],
        tbt: []
    },
    resourceBreakdown: {
        css: { count: 0, totalSize: 0, totalTime: 0, slowCount: 0 },
        script: { count: 0, totalSize: 0, totalTime: 0, slowCount: 0 },
        img: { count: 0, totalSize: 0, totalTime: 0, slowCount: 0 },
        font: { count: 0, totalSize: 0, totalTime: 0, slowCount: 0 },
        other: { count: 0, totalSize: 0, totalTime: 0, slowCount: 0 }
    },
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
 * Store metric trend data
 */
function storeMetricTrend(metricName, value, rating) {
    if (!state.trends[metricName]) return;

    const trendData = {
        value: value,
        rating: rating,
        timestamp: Date.now(),
        sessionTime: Date.now() - state.sessionStart
    };

    // Keep only last 50 data points to prevent memory issues
    state.trends[metricName].push(trendData);
    if (state.trends[metricName].length > 50) {
        state.trends[metricName].shift();
    }
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

            // Store trend data
            storeMetricTrend('lcp', lcp, rating);

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

                // Store trend data
                storeMetricTrend('fid', fid, rating);

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
                    if (sessionValue && lastSessionEntry && firstSessionEntry &&
                        (entry.startTime - lastSessionEntry.startTime > 1000 ||
                        entry.startTime - firstSessionEntry.startTime > 5000)) {

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

                        // Store trend data
                        storeMetricTrend('cls', clsValue, rating);

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

                    // Store trend data
                    storeMetricTrend('fcp', fcp, rating);

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

            // Store trend data
            storeMetricTrend('ttfb', ttfb, rating);

            log(formatMetric('TTFB', ttfb), `[${rating}]`);

            // Report to analytics
            reportMetric('TTFB', ttfb, rating);
        }
    } catch (error) {
        console.error('Error measuring TTFB:', error);
    }
}

/**
 * Measure Interaction to Next Paint (INP)
 */
function measureINP() {
    if (!('PerformanceObserver' in window)) return;

    try {
        let maxInteractionDelay = 0;

        const observer = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();

            entries.forEach(entry => {
                // Calculate interaction delay (input delay + processing time)
                const interactionDelay = entry.processingEnd - entry.startTime;

                if (interactionDelay > maxInteractionDelay) {
                    maxInteractionDelay = interactionDelay;
                    const rating = getRating('inp', maxInteractionDelay);

                    state.metrics.inp = { value: maxInteractionDelay, rating, timestamp: Date.now() };

                    // Store trend data
                    storeMetricTrend('inp', maxInteractionDelay, rating);

                    log(formatMetric('INP', maxInteractionDelay), `[${rating}]`);

                    // Report to analytics
                    reportMetric('INP', maxInteractionDelay, rating);
                }
            });
        });

        observer.observe({ type: 'event', buffered: true });
        state.observers.set('inp', observer);

    } catch (error) {
        console.error('Error measuring INP:', error);
    }
}

/**
 * Measure Total Blocking Time (TBT)
 */
function measureTBT() {
    if (!('PerformanceObserver' in window)) return;

    try {
        let totalBlockingTime = 0;

        const observer = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();

            entries.forEach(entry => {
                // Long tasks are > 50ms
                if (entry.duration > 50) {
                    // Blocking time is duration minus 50ms
                    const blockingTime = entry.duration - 50;
                    totalBlockingTime += blockingTime;
                }
            });

            const rating = getRating('tbt', totalBlockingTime);

            state.metrics.tbt = { value: totalBlockingTime, rating, timestamp: Date.now() };

            // Store trend data
            storeMetricTrend('tbt', totalBlockingTime, rating);

            log(formatMetric('TBT', totalBlockingTime), `[${rating}]`);

            // Report to analytics
            reportMetric('TBT', totalBlockingTime, rating);
        });

        observer.observe({ type: 'longtask', buffered: true });
        state.observers.set('tbt', observer);

    } catch (error) {
        console.error('Error measuring TBT:', error);
    }
}

/**
 * Monitor memory usage
 */
function monitorMemory() {
    if (!('memory' in performance)) return;

    try {
        // Check memory every 10 seconds
        const memoryCheck = setInterval(() => {
            const memInfo = performance.memory;

            const heapUsed = memInfo.usedJSHeapSize / 1024 / 1024; // MB
            const heapTotal = memInfo.totalJSHeapSize / 1024 / 1024; // MB
            const heapLimit = memInfo.jsHeapSizeLimit / 1024 / 1024; // MB

            state.metrics.memory = {
                heapUsed: heapUsed,
                heapTotal: heapTotal,
                heapLimit: heapLimit,
                timestamp: Date.now()
            };

            log(`Memory: ${heapUsed.toFixed(1)}MB used, ${heapTotal.toFixed(1)}MB total`);

        }, 10000);

        // Store interval ID for cleanup
        state.memoryInterval = memoryCheck;

    } catch (error) {
        console.error('Error monitoring memory:', error);
    }
}

/**
 * Detect long tasks (>50ms)
 */
function detectLongTasks() {
    if (!('PerformanceObserver' in window)) return;

    try {
        const observer = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();

            entries.forEach(entry => {
                if (entry.duration > 50) {
                    const longTask = {
                        duration: entry.duration,
                        startTime: entry.startTime,
                        timestamp: Date.now(),
                        url: window.location.href
                    };

                    // Store long tasks (keep last 10)
                    if (!state.longTasks) state.longTasks = [];
                    state.longTasks.push(longTask);
                    if (state.longTasks.length > 10) {
                        state.longTasks.shift();
                    }

                    log(`Long task detected: ${entry.duration.toFixed(2)}ms`);
                }
            });
        });

        observer.observe({ type: 'longtask', buffered: true });
        state.observers.set('longtasks', observer);

    } catch (error) {
        console.error('Error detecting long tasks:', error);
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

                // Categorize resource
                updateResourceBreakdown(entry);

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

/**
 * Update resource breakdown analysis
 */
function updateResourceBreakdown(entry) {
    let category = 'other';

    // Categorize by initiator type
    switch (entry.initiatorType) {
        case 'link':
        case 'css':
            category = 'css';
            break;
        case 'script':
            category = 'script';
            break;
        case 'img':
        case 'image':
            category = 'img';
            break;
        case 'font':
            category = 'font';
            break;
        default:
            // Check file extension for better categorization
            const url = entry.name.toLowerCase();
            if (url.includes('.css')) category = 'css';
            else if (url.includes('.js')) category = 'script';
            else if (url.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) category = 'img';
            else if (url.match(/\.(woff|woff2|ttf|otf|eot)$/)) category = 'font';
    }

    const breakdown = state.resourceBreakdown[category];
    breakdown.count++;
    breakdown.totalSize += entry.transferSize || 0;
    breakdown.totalTime += entry.duration;

    if (entry.duration > 1000) {
        breakdown.slowCount++;
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
    measureINP();
    measureTBT();

    // Monitor memory usage
    monitorMemory();

    // Detect long tasks
    detectLongTasks();

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
 * Get long tasks
 */
function getLongTasks() {
    return [...(state.longTasks || [])];
}

/**
 * Get metric trends
 */
function getTrends() {
    return { ...state.trends };
}

/**
 * Get resource breakdown analysis
 */
function getResourceBreakdown() {
    return { ...state.resourceBreakdown };
}

/**
 * Generate optimization recommendations
 */
function getOptimizationRecommendations() {
    const recommendations = [];
    const metrics = state.metrics;
    const breakdown = state.resourceBreakdown;
    const longTasks = state.longTasks || [];

    // Core Web Vitals recommendations
    if (metrics.lcp && metrics.lcp.rating !== 'good') {
        if (metrics.lcp.value > 4000) {
            recommendations.push({
                priority: 'high',
                category: 'LCP',
                issue: 'Largest Contentful Paint is very slow',
                suggestion: 'Optimize server response times, remove render-blocking JavaScript/CSS, optimize images, and use preload for critical resources.'
            });
        } else if (metrics.lcp.value > 2500) {
            recommendations.push({
                priority: 'medium',
                category: 'LCP',
                issue: 'Largest Contentful Paint needs improvement',
                suggestion: 'Consider optimizing images, using modern image formats (WebP/AVIF), and implementing lazy loading for below-the-fold images.'
            });
        }
    }

    if (metrics.cls && metrics.cls.rating !== 'good') {
        recommendations.push({
            priority: 'high',
            category: 'CLS',
            issue: 'Cumulative Layout Shift detected',
            suggestion: 'Reserve space for dynamic content, avoid inserting content above existing content, and use CSS aspect-ratio for media elements.'
        });
    }

    if (metrics.fid && metrics.fid.rating !== 'good') {
        recommendations.push({
            priority: 'medium',
            category: 'FID',
            issue: 'First Input Delay is high',
            suggestion: 'Reduce JavaScript execution time, remove unused JavaScript, and minimize main thread work.'
        });
    }

    // Advanced metrics recommendations
    if (metrics.inp && metrics.inp.rating !== 'good') {
        recommendations.push({
            priority: 'high',
            category: 'INP',
            issue: 'Interaction to Next Paint is slow',
            suggestion: 'Optimize event handlers, break up long tasks, and use passive event listeners where appropriate.'
        });
    }

    if (metrics.tbt && metrics.tbt.rating !== 'good') {
        recommendations.push({
            priority: 'high',
            category: 'TBT',
            issue: 'Total Blocking Time is high',
            suggestion: 'Break up long tasks (>50ms), minimize main thread work, and optimize JavaScript execution.'
        });
    }

    // Resource recommendations
    if (breakdown.script.slowCount > 0) {
        recommendations.push({
            priority: 'medium',
            category: 'JavaScript',
            issue: `${breakdown.script.slowCount} slow JavaScript resources detected`,
            suggestion: 'Minify and compress JavaScript, use code splitting, implement lazy loading for non-critical scripts.'
        });
    }

    if (breakdown.img.slowCount > 0) {
        recommendations.push({
            priority: 'medium',
            category: 'Images',
            issue: `${breakdown.img.slowCount} slow image resources detected`,
            suggestion: 'Optimize images (compress, use WebP/AVIF), implement responsive images, and use lazy loading.'
        });
    }

    if (breakdown.css.slowCount > 0) {
        recommendations.push({
            priority: 'medium',
            category: 'CSS',
            issue: `${breakdown.css.slowCount} slow CSS resources detected`,
            suggestion: 'Minify CSS, remove unused styles, and consider using CSS-in-JS or critical CSS extraction.'
        });
    }

    // Memory recommendations
    if (metrics.memory) {
        const memoryUsagePercent = (metrics.memory.heapUsed / metrics.memory.heapLimit) * 100;
        if (memoryUsagePercent > 80) {
            recommendations.push({
                priority: 'high',
                category: 'Memory',
                issue: 'High memory usage detected',
                suggestion: 'Check for memory leaks, optimize object creation, and consider using memory profiling tools.'
            });
        }
    }

    // Long tasks recommendations
    if (longTasks.length > 5) {
        recommendations.push({
            priority: 'medium',
            category: 'Performance',
            issue: `${longTasks.length} long tasks detected`,
            suggestion: 'Break up long-running JavaScript tasks, use requestAnimationFrame for animations, and implement web workers for heavy computations.'
        });
    }

    // Network recommendations
    const network = detectNetworkQuality();
    if (network && network.effectiveType === 'slow-2g') {
        recommendations.push({
            priority: 'high',
            category: 'Network',
            issue: 'Slow network connection detected',
            suggestion: 'Implement progressive loading, use smaller assets for slow connections, and consider service worker caching.'
        });
    }

    return recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
}

/**
 * Get performance report
 */
function getReport() {
    return {
        metrics: getMetrics(),
        errors: getErrors(),
        timings: getTimings(),
        longTasks: getLongTasks(),
        trends: getTrends(),
        resourceBreakdown: getResourceBreakdown(),
        recommendations: getOptimizationRecommendations(),
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

    // Clear memory monitoring interval
    if (state.memoryInterval) {
        clearInterval(state.memoryInterval);
    }

    log('Performance monitoring stopped');
}

/**
 * Export PerformanceMonitor API
 */
const PerformanceMonitor = {
    init,
    getMetrics,
    getErrors,
    getTimings,
    getLongTasks,
    getTrends,
    getResourceBreakdown,
    getOptimizationRecommendations,
    getReport,
    enableDebug,
    disableDebug,
    stop,
    sendBeacon,
};

// Expose to global scope
if (typeof window !== 'undefined') {
    window.PerformanceMonitor = PerformanceMonitor;
}

// Remove ES6 exports - this is now an IIFE
// export default PerformanceMonitor;
// export { ... };

})();
