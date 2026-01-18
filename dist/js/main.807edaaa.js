import { init as stackblitzInit } from './integrations/stackblitz.js';
import { init as navigationInit } from './ui/navigation-component.js';
function setupProductionErrorReporter() {
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
return;
}
const reportedErrors = new Set();
function reportError(errorData) {
const errorKey = `${errorData.message}_${errorData.filename}_${errorData.line}`;
if (reportedErrors.has(errorKey)) return;
reportedErrors.add(errorKey);
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
window.addEventListener('error', (event) => {
reportError({
message: event.message || 'Unknown error',
filename: event.filename || 'unknown',
line: event.lineno || 0,
column: event.colno || 0,
stack: event.error?.stack || 'No stack trace'
});
});
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
setupProductionErrorReporter();
function _loadScript(src) {
return new Promise((resolve, reject) => {
const script = document.createElement('script');
script.src = src;
script.onload = resolve;
script.onerror = reject;
document.head.appendChild(script);
});
}
window.openStackBlitz = function openStackBlitzFallback(url) {
console.log('[openStackBlitz] Called with URL:', url);
try {
const stackblitzModule = window.__stackblitzModule;
if (stackblitzModule && typeof stackblitzModule.openStackBlitz === 'function') {
console.log('[openStackBlitz] Using cached module');
return stackblitzModule.openStackBlitz(url);
}
} catch (e) {
console.warn('[openStackBlitz] Cached module access failed', e);
}
console.log('[openStackBlitz] Opening with window.open fallback');
try {
const popupFeatures = 'width=1200,height=800,left=100,top=100,resizable=yes,scrollbars=yes,status=yes';
const w = window.open(url, 'stackblitz-demo', popupFeatures);
if (w) w.focus();
return w;
} catch (err) {
console.error('[openStackBlitz] window.open failed', err);
window.location.href = url;
return null;
}
};
function initResourceFailureMonitoring() {
window.addEventListener('error', (event) => {
try {
const target = event?.target || event?.srcElement;
if (!target || !target.tagName) return;
const tag = target.tagName.toLowerCase();
if (!['img', 'script', 'link', 'iframe'].includes(tag)) return;
const url = target.currentSrc || target.href || target.src;
if (!url) return;
fetch(url, { method: 'HEAD', cache: 'no-store' })
.then(res => {
if (res && res.status === 503) {
console.warn(`[Main.js] Diagnostic: resource returned 503 for ${url}`);
}
})
.catch(err => {
console.warn('[Main.js] Diagnostic fetch failed for', url, err);
});
} catch (err) {
console.warn('[Main.js] Resource failure monitoring encountered an error', err);
}
}, true);
}
async function initAccessibility() {
try {
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
async function initPerformanceMonitoring() {
try {
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
setTimeout(() => {
if (window.location.hostname === 'localhost' && window.PerformanceMonitor && typeof window.PerformanceMonitor.getReport === 'function') {
console.log('[Performance Report]', window.PerformanceMonitor.getReport());
}
}, 5000);
} catch (error) {
console.error('[Main.js] Failed to initialize performance monitoring:', error);
}
}
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
window.SEO.init({
baseUrl: window.location.origin,
defaultImage: '/assets/images/og-default.jpg',
defaultAuthor: 'Clodo Framework Team',
twitterHandle: '@clodoframework',
});
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
window.SEO.addWebSiteSchema({
name: 'Clodo Framework',
description: 'Transform 6-month development cycles into 6 weeks with production-ready components',
});
const path = window.location.pathname;
if (path === '/' || path === '/index.html') {
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
async function initCore() {
console.log('[Main.js] Initializing core features...');
await initPerformanceMonitoring();
await initSEO();
await initAccessibility();
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
async function initFeatures() {
console.log('[Main.js] Initializing page features...');
console.log('[Main.js] DOM ready state:', document.readyState);
console.log('[Main.js] Current URL:', window.location.href);
try {
navigationInit();
console.log('[Main.js] ✓ Navigation component initialized');
} catch (error) {
console.error('[Main.js] Failed to initialize navigation component:', error);
}
initResourceFailureMonitoring();
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
console.log('[Main.js] FeatureFlags object:', window.FeatureFlags);
console.log('[Main.js] Enabled features:', window.FeatureFlags ? window.FeatureFlags.getEnabledFeatures() : 'FeatureFlags not loaded');
console.log('[Main.js] NEWSLETTER_MODULE enabled:', window.FeatureFlags ? window.FeatureFlags.isFeatureEnabled('NEWSLETTER_MODULE') : 'FeatureFlags not loaded');
console.log('[Main.js] Enabled features:', window.FeatureFlags.getEnabledFeatures().join(', '));
const newsletterForms = document.querySelectorAll('[data-newsletter-form]');
const stackblitzButtons = document.querySelectorAll('[data-stackblitz-url]');
const onclickButtons = document.querySelectorAll('[onclick*="openStackBlitz"]');
console.log('[Main.js] Found newsletter forms:', newsletterForms.length);
console.log('[Main.js] Found StackBlitz buttons:', stackblitzButtons.length);
console.log('[Main.js] Found onclick buttons:', onclickButtons.length);
if (window.FeatureFlags.isFeatureEnabled('NAVIGATION_MODULE')) {
try {
const Navigation = await import('./ui/navigation.js');
Navigation.init();
console.log('[Main.js] ✓ Navigation module loaded');
} catch (error) {
console.error('[Main.js] Failed to load navigation:', error);
}
}
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
try {
const hasCopyButtons = document.querySelector('.copy-button') !== null;
if (hasCopyButtons) {
initCopyButtons();
console.log('[Main.js] ✓ Copy button functionality initialized');
}
} catch (err) {
console.error('[Main.js] Copy button setup failed:', err);
}
}
async function initDeferred() {
console.log('[Main.js] Initializing deferred features...');
if (window.FeatureFlags.isFeatureEnabled('PERFORMANCE_MONITORING')) {
try {
const Performance = await import('./features/performance.js');
Performance.init();
console.log('[Main.js] ✓ Performance monitoring loaded');
} catch (error) {
console.error('[Main.js] Failed to load performance monitoring:', error);
}
}
if (window.FeatureFlags.isFeatureEnabled('ERROR_TRACKING')) {
try {
const ErrorTracking = await import('./features/error-tracking.js');
ErrorTracking.init();
console.log('[Main.js] ✓ Error tracking loaded');
} catch (error) {
console.error('[Main.js] Failed to load error tracking:', error);
}
}
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
async function init() {
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
if (!window.FeatureFlags.isFeatureEnabled('ES6_MODULES')) {
console.log('[Main.js] Module system disabled. Using legacy script.js');
return;
}
if (!window.FeatureFlags.isBrowserSupported('ES6_MODULES')) {
console.warn('[Main.js] ES6 modules not supported, falling back to legacy script.js');
return;
}
console.log('[Main.js] 🚀 Initializing Clodo Framework modules...');
initCore();
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', initFeatures);
} else {
initFeatures();
}
if (window.FeatureFlags.isFeatureEnabled('IDLE_CALLBACK') && 'requestIdleCallback' in window) {
requestIdleCallback(initDeferred);
} else {
setTimeout(initDeferred, 1000);
}
}
function initCopyButtons() {
const copyButtons = document.querySelectorAll('.copy-button, .copy-btn');
copyButtons.forEach(button => {
button.addEventListener('click', async () => {
let textToCopy = button.getAttribute('data-clipboard-text');
if (!textToCopy) {
const target = button.getAttribute('data-copy-target') ? document.querySelector(button.getAttribute('data-copy-target') + ' code') : button.closest('.code-snippet') ? button.closest('.code-snippet').querySelector('code') : null;
if (target) textToCopy = target.innerText || target.textContent;
}
if (!textToCopy) {
console.warn('Copy button missing data-clipboard-text and no nearby code block found');
return;
}
try {
await navigator.clipboard.writeText(textToCopy);
button.classList.add('copied');
const originalText = button.textContent;
button.textContent = 'Copied!';
setTimeout(() => {
button.classList.remove('copied');
button.textContent = originalText || 'Copy';
}, 2000);
} catch (err) {
console.error('Failed to copy text: ', err);
const textArea = document.createElement('textarea');
textArea.value = textToCopy;
textArea.style.position = 'fixed';
textArea.style.left = '-999999px';
textArea.style.top = '-999999px';
document.body.appendChild(textArea);
textArea.focus();
textArea.select();
try {
document.execCommand('copy');
button.classList.add('copied');
button.textContent = 'Copied!';
setTimeout(() => {
button.classList.remove('copied');
button.textContent = 'Copy';
}, 2000);
} catch (fallbackErr) {
console.error('Fallback copy failed: ', fallbackErr);
button.textContent = 'Copy failed';
setTimeout(() => {
button.textContent = 'Copy';
}, 2000);
}
document.body.removeChild(textArea);
}
});
});
}
init();
export { init, initCore, initFeatures, initDeferred, initCopyButtons };