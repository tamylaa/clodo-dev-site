// Simple script to check current LCP performance
console.log('Checking current LCP performance...');

// Wait for PerformanceMonitor to load with timeout
let _lcpAttempts = 0;
const _lcpMaxAttempts = 20; // ~10 seconds (500ms * 20)
function checkLCP() {
    if (typeof window.PerformanceMonitor === 'undefined') {
        _lcpAttempts++;
        if (_lcpAttempts > _lcpMaxAttempts) {
            console.warn('PerformanceMonitor not found after waiting, giving up.');
            return;
        }
        setTimeout(checkLCP, 500);
        return;
    }

    const report = (window.PerformanceMonitor && typeof window.PerformanceMonitor.getReport === 'function') ? window.PerformanceMonitor.getReport() : {};
    const lcp = report.metrics ? report.metrics.lcp : undefined;

    if (lcp) {
        console.log('Current LCP:', {
            value: Math.round(lcp.value) + 'ms',
            rating: lcp.rating,
            timestamp: new Date(lcp.timestamp).toLocaleTimeString()
        });
    } else {
        console.log('LCP not yet measured - page may still be loading');
    }
}

checkLCP();