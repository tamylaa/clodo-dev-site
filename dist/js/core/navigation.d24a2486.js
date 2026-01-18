const config = {
scrollBehavior: 'smooth', // 'smooth' | 'instant' | 'auto'
scrollOffset: 80, // Offset for fixed headers (px)
enableTransitions: true,
transitionDuration: 300, // ms
enablePrefetch: true,
prefetchDelay: 100, // ms after hover
activeClass: 'active',
exactMatch: false, // true = exact URL match, false = starts with
saveScrollPosition: true,
restoreScrollPosition: true,
};
const state = {
currentPath: window.location.pathname,
scrollPositions: new Map(), // path -> scroll position
isTransitioning: false,
prefetchTimers: new Map(), // link -> timer
observers: [], // IntersectionObserver instances
};
function normalizePath(url) {
try {
const urlObj = new URL(url, window.location.origin);
return urlObj.pathname;
} catch {
return url;
}
}
function isInternalLink(url) {
if (!url || url.trim() === '') return false;
try {
const urlObj = new URL(url);
return urlObj.origin === window.location.origin;
} catch {
return url.startsWith('/') || url.startsWith('./') || url.startsWith('../') || url === '.' || url === '..';
}
}
function shouldHandleLink(link) {
if (link.hasAttribute('download')) return false;
if (link.target === '_blank') return false;
if (link.hasAttribute('data-no-intercept')) return false;
const href = link.getAttribute('href');
if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
if (!isInternalLink(href)) return false;
const url = new URL(href, window.location.origin);
if (url.pathname === window.location.pathname && url.hash) {
return false; // Let browser handle hash navigation
}
return true;
}
function saveScrollPosition() {
if (!config.saveScrollPosition) return;
state.scrollPositions.set(state.currentPath, {
x: window.scrollX,
y: window.scrollY,
timestamp: Date.now(),
});
}
function restoreScrollPosition() {
if (!config.restoreScrollPosition) return;
const position = state.scrollPositions.get(state.currentPath);
if (position) {
window.scrollTo({
left: position.x,
top: position.y,
behavior: 'instant',
});
return true;
}
return false;
}
function scrollToTop() {
window.scrollTo({
left: 0,
top: 0,
behavior: config.scrollBehavior,
});
}
function scrollToElement(element, offset = config.scrollOffset) {
if (!element) return;
const elementPosition = element.getBoundingClientRect().top;
const offsetPosition = elementPosition + window.scrollY - offset;
window.scrollTo({
top: offsetPosition,
behavior: config.scrollBehavior,
});
}
function scrollToHash(hash) {
if (!hash) return false;
const id = hash.startsWith('#') ? hash.slice(1) : hash;
const element = document.getElementById(id);
if (element) {
scrollToElement(element);
return true;
}
return false;
}
function updateActiveLinks() {
const currentPath = window.location.pathname;
const links = document.querySelectorAll('a[href]');
links.forEach(link => {
const href = link.getAttribute('href');
if (!href || !isInternalLink(href)) return;
const linkPath = normalizePath(href);
const isActive = config.exactMatch
? linkPath === currentPath
: currentPath.startsWith(linkPath);
link.classList.toggle(config.activeClass, isActive);
if (isActive) {
link.setAttribute('aria-current', 'page');
} else {
link.removeAttribute('aria-current');
}
});
}
function prefetchPage(url) {
if (!config.enablePrefetch) return;
if (!isInternalLink(url)) return;
const links = document.querySelectorAll(`link[rel="prefetch"][href="${url}"]`);
if (links.length > 0) return;
const link = document.createElement('link');
link.rel = 'prefetch';
link.href = url;
document.head.appendChild(link);
}
function handleLinkHover(event) {
const link = event.target.closest('a');
if (!link || !shouldHandleLink(link)) return;
const href = link.getAttribute('href');
const existingTimer = state.prefetchTimers.get(link);
if (existingTimer) {
clearTimeout(existingTimer);
}
const timer = setTimeout(() => {
prefetchPage(href);
state.prefetchTimers.delete(link);
}, config.prefetchDelay);
state.prefetchTimers.set(link, timer);
}
function handleLinkClick(event) {
const link = event.target.closest('a');
if (!link || !shouldHandleLink(link)) return;
const href = link.getAttribute('href');
const url = new URL(href, window.location.origin);
if (url.pathname !== window.location.pathname && url.hash) {
return;
}
const navigationEvent = new CustomEvent('navigation:before', {
detail: { url: url.href, path: url.pathname },
cancelable: true,
});
if (!window.dispatchEvent(navigationEvent)) {
event.preventDefault();
return;
}
saveScrollPosition();
}
function handlePopState() {
state.currentPath = window.location.pathname;
const restored = restoreScrollPosition();
updateActiveLinks();
window.dispatchEvent(new CustomEvent('navigation:after', {
detail: {
path: state.currentPath,
scrollRestored: restored,
},
}));
}
function handlePageLoad() {
state.currentPath = window.location.pathname;
updateActiveLinks();
if (window.location.hash) {
requestAnimationFrame(() => {
scrollToHash(window.location.hash);
});
}
window.dispatchEvent(new CustomEvent('navigation:load', {
detail: { path: state.currentPath },
}));
}
function init(options = {}) {
console.log('[Navigation] Initializing...');
Object.assign(config, options);
handlePageLoad();
window.addEventListener('popstate', handlePopState);
document.addEventListener('click', handleLinkClick);
if (config.enablePrefetch) {
document.addEventListener('mouseenter', handleLinkHover, true);
}
document.addEventListener('visibilitychange', () => {
if (!document.hidden) {
updateActiveLinks();
}
});
window.addEventListener('beforeunload', saveScrollPosition);
console.log('[Navigation] Initialized ✓');
}
function destroy() {
console.log('[Navigation] Destroying...');
window.removeEventListener('popstate', handlePopState);
document.removeEventListener('click', handleLinkClick);
document.removeEventListener('mouseenter', handleLinkHover, true);
window.removeEventListener('beforeunload', saveScrollPosition);
state.prefetchTimers.forEach(timer => clearTimeout(timer));
state.prefetchTimers.clear();
state.observers.forEach(observer => observer.disconnect());
state.observers = [];
state.scrollPositions.clear();
console.log('[Navigation] Destroyed ✓');
}
function navigateTo(url, options = {}) {
const { replace = false } = options;
if (config.saveScrollPosition && !replace) {
saveScrollPosition();
}
window.location.href = url;
}
function goBack() {
window.history.back();
}
function goForward() {
window.history.forward();
}
function getCurrentPath() {
return state.currentPath;
}
function configure(options) {
Object.assign(config, options);
}
if (typeof window !== 'undefined') {
window.NavigationManager = {
init,
destroy,
navigateTo,
goBack,
goForward,
scrollToTop,
scrollToElement,
scrollToHash,
updateActiveLinks,
getCurrentPath,
configure,
};
}
export { init, destroy, navigateTo, goBack, goForward, scrollToTop, scrollToElement, scrollToHash, updateActiveLinks, getCurrentPath, configure, normalizePath, isInternalLink };