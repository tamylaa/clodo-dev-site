// Simple script to check current LCP performance
console.log('Checking current LCP performance...');

// Wait for PerformanceMonitor to load
function checkLCP() {
    if (typeof window.PerformanceMonitor === 'undefined') {
        setTimeout(checkLCP, 500);
        return;
    }

    const report = window.PerformanceMonitor.getReport();
    const lcp = report.metrics.lcp;

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