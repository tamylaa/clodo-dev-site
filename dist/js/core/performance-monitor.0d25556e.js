(function() {
'use strict';
const config = {
debug: false,
thresholds: {
lcp: {
good: 2500,      // < 2.5s
needsImprovement: 4000, // 2.5s - 4s
},
fid: {
good: 100,       // < 100ms
needsImprovement: 300,  // 100ms - 300ms
},
cls: {
good: 0.1,       // < 0.1
needsImprovement: 0.25, // 0.1 - 0.25
},
fcp: {
good: 1800,      // < 1.8s
needsImprovement: 3000, // 1.8s - 3s
},
ttfb: {
good: 800,       // < 800ms
needsImprovement: 1800, // 800ms - 1.8s
},
inp: {
good: 200,       // < 200ms
needsImprovement: 500,  // 200ms - 500ms
},
tbt: {
good: 200,       // < 200ms
needsImprovement: 600,  // 200ms - 600ms
},
},
sampleRate: 1.0,
endpoints: {
vitals: null,    // POST Web Vitals data
errors: null,    // POST JavaScript errors
timing: null,    // POST resource timing
},
analytics: {
enabled: false,
provider: null,  // 'ga4', 'plausible', 'custom'
},
};
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
function log(...args) {
if (config.debug) {
console.log('[PerformanceMonitor]', ...args);
}
}
function shouldSample() {
return Math.random() < config.sampleRate;
}
function getRating(metricName, value) {
const threshold = config.thresholds[metricName.toLowerCase()];
if (!threshold) return 'unknown';
if (value <= threshold.good) return 'good';
if (value <= threshold.needsImprovement) return 'needs-improvement';
return 'poor';
}
function formatMetric(name, value) {
if (typeof value === 'number') {
if (name.includes('LCP') || name.includes('FCP') || name.includes('TTFB')) {
return `${name}: ${Math.round(value)}ms`;
}
if (name.includes('CLS')) {
return `${name}: ${value.toFixed(4)}`;
}
if (name.includes('FID')) {
return `${name}: ${Math.round(value)}ms`;
}
return `${name}: ${value}`;
}
return `${name}: ${value}`;
}
function storeMetricTrend(metricName, value, rating) {
if (!state.trends[metricName]) return;
const trendData = {
value: value,
rating: rating,
timestamp: Date.now(),
sessionTime: Date.now() - state.sessionStart
};
state.trends[metricName].push(trendData);
if (state.trends[metricName].length > 50) {
state.trends[metricName].shift();
}
}
function measureLCP() {
if (!('PerformanceObserver' in window)) return;
try {
const observer = new PerformanceObserver((entryList) => {
const entries = entryList.getEntries();
const lastEntry = entries[entries.length - 1];
const lcp = lastEntry.renderTime || lastEntry.loadTime;
const rating = getRating('lcp', lcp);
state.metrics.lcp = { value: lcp, rating, timestamp: Date.now() };
storeMetricTrend('lcp', lcp, rating);
log(formatMetric('LCP', lcp), `[${rating}]`);
reportMetric('LCP', lcp, rating);
});
observer.observe({ type: 'largest-contentful-paint', buffered: true });
state.observers.set('lcp', observer);
} catch (error) {
console.error('Error measuring LCP:', error);
}
}
function measureFID() {
if (!('PerformanceObserver' in window)) return;
try {
const observer = new PerformanceObserver((entryList) => {
const entries = entryList.getEntries();
entries.forEach(entry => {
const fid = entry.processingStart - entry.startTime;
const rating = getRating('fid', fid);
state.metrics.fid = { value: fid, rating, timestamp: Date.now() };
storeMetricTrend('fid', fid, rating);
log(formatMetric('FID', fid), `[${rating}]`);
reportMetric('FID', fid, rating);
});
});
observer.observe({ type: 'first-input', buffered: true });
state.observers.set('fid', observer);
} catch (error) {
console.error('Error measuring FID:', error);
}
}
function measureCLS() {
if (!('PerformanceObserver' in window)) return;
try {
let clsValue = 0;
let sessionValue = 0;
let sessionEntries = [];
const observer = new PerformanceObserver((entryList) => {
const entries = entryList.getEntries();
entries.forEach(entry => {
if (!entry.hadRecentInput) {
const firstSessionEntry = sessionEntries[0];
const lastSessionEntry = sessionEntries[sessionEntries.length - 1];
if (sessionValue && lastSessionEntry && firstSessionEntry &&
(entry.startTime - lastSessionEntry.startTime > 1000 ||
entry.startTime - firstSessionEntry.startTime > 5000)) {
sessionValue = 0;
sessionEntries = [];
}
sessionValue += entry.value;
sessionEntries.push(entry);
if (sessionValue > clsValue) {
clsValue = sessionValue;
const rating = getRating('cls', clsValue);
state.metrics.cls = { value: clsValue, rating, timestamp: Date.now() };
storeMetricTrend('cls', clsValue, rating);
log(formatMetric('CLS', clsValue, ''), `[${rating}]`);
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
storeMetricTrend('fcp', fcp, rating);
log(formatMetric('FCP', fcp), `[${rating}]`);
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
function measureTTFB() {
try {
const navigation = performance.getEntriesByType('navigation')[0];
if (navigation) {
const ttfb = navigation.responseStart - navigation.requestStart;
const rating = getRating('ttfb', ttfb);
state.metrics.ttfb = { value: ttfb, rating, timestamp: Date.now() };
storeMetricTrend('ttfb', ttfb, rating);
log(formatMetric('TTFB', ttfb), `[${rating}]`);
reportMetric('TTFB', ttfb, rating);
}
} catch (error) {
console.error('Error measuring TTFB:', error);
}
}
function measureINP() {
if (!('PerformanceObserver' in window)) return;
try {
let maxInteractionDelay = 0;
const observer = new PerformanceObserver((entryList) => {
const entries = entryList.getEntries();
entries.forEach(entry => {
const interactionDelay = entry.processingEnd - entry.startTime;
if (interactionDelay > maxInteractionDelay) {
maxInteractionDelay = interactionDelay;
const rating = getRating('inp', maxInteractionDelay);
state.metrics.inp = { value: maxInteractionDelay, rating, timestamp: Date.now() };
storeMetricTrend('inp', maxInteractionDelay, rating);
log(formatMetric('INP', maxInteractionDelay), `[${rating}]`);
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
function measureTBT() {
if (!('PerformanceObserver' in window)) return;
try {
let totalBlockingTime = 0;
const observer = new PerformanceObserver((entryList) => {
const entries = entryList.getEntries();
entries.forEach(entry => {
if (entry.duration > 50) {
const blockingTime = entry.duration - 50;
totalBlockingTime += blockingTime;
}
});
const rating = getRating('tbt', totalBlockingTime);
state.metrics.tbt = { value: totalBlockingTime, rating, timestamp: Date.now() };
storeMetricTrend('tbt', totalBlockingTime, rating);
log(formatMetric('TBT', totalBlockingTime), `[${rating}]`);
reportMetric('TBT', totalBlockingTime, rating);
});
observer.observe({ type: 'longtask', buffered: true });
state.observers.set('tbt', observer);
} catch (error) {
console.error('Error measuring TBT:', error);
}
}
function monitorMemory() {
if (!('memory' in performance)) return;
try {
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
state.memoryInterval = memoryCheck;
} catch (error) {
console.error('Error monitoring memory:', error);
}
}
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
function trackErrors() {
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
reportError(errorData);
});
window.addEventListener('unhandledrejection', (event) => {
const errorData = {
message: 'Unhandled Promise Rejection',
reason: event.reason,
timestamp: Date.now(),
url: window.location.href,
};
state.errors.push(errorData);
log('Promise Rejection:', errorData);
reportError(errorData);
});
}
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
updateResourceBreakdown(entry);
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
function updateResourceBreakdown(entry) {
let category = 'other';
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
default: {
const url = entry.name.toLowerCase();
if (url.includes('.css')) category = 'css';
else if (url.includes('.js')) category = 'script';
else if (url.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) category = 'img';
else if (url.match(/\.(woff|woff2|ttf|otf|eot)$/)) category = 'font';
}
}
const breakdown = state.resourceBreakdown[category];
breakdown.count++;
breakdown.totalSize += entry.transferSize || 0;
breakdown.totalTime += entry.duration;
if (entry.duration > 1000) {
breakdown.slowCount++;
}
}
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
function trackSession() {
document.addEventListener('visibilitychange', () => {
log('Visibility:', document.visibilityState);
if (document.visibilityState === 'hidden') {
sendBeacon();
}
});
window.addEventListener('beforeunload', () => {
const sessionDuration = Date.now() - state.sessionStart;
log('Session duration:', `${(sessionDuration / 1000).toFixed(2)}s`);
});
}
function reportMetric(name, value, rating) {
if (!config.analytics.enabled) return;
if (config.analytics.provider === 'ga4' && window.gtag) {
window.gtag('event', name, {
value: Math.round(value),
metric_rating: rating,
event_category: 'Web Vitals',
});
}
else if (config.analytics.provider === 'plausible' && window.plausible) {
window.plausible('Web Vitals', {
props: {
metric: name,
value: Math.round(value),
rating: rating,
},
});
}
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
function reportError(errorData) {
if (config.endpoints.errors) {
sendToEndpoint(config.endpoints.errors, errorData);
}
}
function sendToEndpoint(endpoint, data) {
if (!endpoint) return;
if ('sendBeacon' in navigator) {
navigator.sendBeacon(endpoint, JSON.stringify(data));
} else {
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
if (config.endpoints.vitals) {
sendToEndpoint(config.endpoints.vitals, report);
}
}
function init(options = {}) {
Object.assign(config, options);
if (!shouldSample()) {
log('Session not sampled, skipping monitoring');
return;
}
log('Initializing performance monitoring...');
state.isRecording = true;
measureLCP();
measureFID();
measureCLS();
measureFCP();
measureTTFB();
measureINP();
measureTBT();
monitorMemory();
detectLongTasks();
trackErrors();
trackResourceTiming();
trackSession();
log('Performance monitoring initialized');
}
function getMetrics() {
return { ...state.metrics };
}
function getErrors() {
return [...state.errors];
}
function getTimings() {
return [...state.timings];
}
function getLongTasks() {
return [...(state.longTasks || [])];
}
function getTrends() {
return { ...state.trends };
}
function getResourceBreakdown() {
return { ...state.resourceBreakdown };
}
function getOptimizationRecommendations() {
const recommendations = [];
const metrics = state.metrics;
const breakdown = state.resourceBreakdown;
const longTasks = state.longTasks || [];
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
if (longTasks.length > 5) {
recommendations.push({
priority: 'medium',
category: 'Performance',
issue: `${longTasks.length} long tasks detected`,
suggestion: 'Break up long-running JavaScript tasks, use requestAnimationFrame for animations, and implement web workers for heavy computations.'
});
}
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
function enableDebug() {
config.debug = true;
log('Debug mode enabled');
}
function disableDebug() {
config.debug = false;
}
function stop() {
state.isRecording = false;
state.observers.forEach(observer => observer.disconnect());
state.observers.clear();
if (state.memoryInterval) {
clearInterval(state.memoryInterval);
}
log('Performance monitoring stopped');
}
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
if (typeof window !== 'undefined') {
window.PerformanceMonitor = PerformanceMonitor;
}
})();