document.addEventListener('DOMContentLoaded', function() {
initFeatureCardAnimations();
initComparisonTableHighlighting();
initScrollAnimations();
initTableOfContents();
initSmoothScrolling();
initReadingProgress();
});
function initScrollAnimations() {
const observerOptions = {
threshold: 0.1,
rootMargin: '0px 0px -50px 0px'
};
const observer = new IntersectionObserver((entries) => {
entries.forEach(entry => {
if (entry.isIntersecting) {
entry.target.classList.add('animate-in');
}
});
}, observerOptions);
const animateElements = document.querySelectorAll('.animate-on-scroll');
animateElements.forEach(element => {
observer.observe(element);
const rect = element.getBoundingClientRect();
const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
if (rect.top < viewportHeight - 50) {
element.classList.add('animate-in');
}
});
setTimeout(() => {
document.querySelectorAll('.animate-on-scroll:not(.animate-in)').forEach(el => {
el.classList.add('animate-in');
});
}, 2000);
}
function initTableOfContents() {
const tocLinks = document.querySelectorAll('nav a[href^="#"]');
tocLinks.forEach(link => {
link.addEventListener('click', function(e) {
e.preventDefault();
const targetId = this.getAttribute('href').substring(1);
const targetElement = document.getElementById(targetId);
if (targetElement) {
const headerOffset = 80; // Account for fixed header
const elementPosition = targetElement.offsetTop;
const offsetPosition = elementPosition - headerOffset;
window.scrollTo({
top: offsetPosition,
behavior: 'smooth'
});
history.pushState(null, null, `#${targetId}`);
}
});
});
}
function initFeatureCardAnimations() {
const featureCards = document.querySelectorAll('.feature-card');
featureCards.forEach((card, index) => {
card.classList.add('animate-on-scroll');
card.style.transitionDelay = `${index * 0.1}s`;
card.addEventListener('mouseenter', function() {
this.style.transform = 'translateY(-8px) scale(1.02)';
});
card.addEventListener('mouseleave', function() {
this.style.transform = 'translateY(0) scale(1)';
});
});
}
function initComparisonTableHighlighting() {
const table = document.querySelector('.comparison-table');
if (!table) return;
table.classList.add('animate-on-scroll');
const rows = table.querySelectorAll('tbody tr');
rows.forEach(row => {
row.addEventListener('mouseenter', function() {
this.style.backgroundColor = '#eff6ff';
this.style.transform = 'scale(1.01)';
this.style.transition = 'all 0.2s ease';
});
row.addEventListener('mouseleave', function() {
this.style.backgroundColor = '';
this.style.transform = 'scale(1)';
});
});
}
function initSmoothScrolling() {
const allLinks = document.querySelectorAll('a[href^="#"]');
allLinks.forEach(link => {
if (link.closest('nav')) return;
link.addEventListener('click', function(e) {
const href = this.getAttribute('href');
if (href.startsWith('#')) {
e.preventDefault();
const targetId = href.substring(1);
const targetElement = document.getElementById(targetId);
if (targetElement) {
const headerOffset = 80;
const elementPosition = targetElement.offsetTop;
const offsetPosition = elementPosition - headerOffset;
window.scrollTo({
top: offsetPosition,
behavior: 'smooth'
});
history.pushState(null, null, href);
}
}
});
});
}
function initPerformanceTracking() {
if (window.PerformanceMonitor && typeof window.PerformanceMonitor.trackPageView === 'function') {
window.PerformanceMonitor.trackPageView('cloudflare-framework');
}
}
if (window.PerformanceMonitor) {
initPerformanceTracking();
} else {
document.addEventListener('performanceMonitorReady', initPerformanceTracking);
}
function initCopyButtons() {
const codeBlocks = document.querySelectorAll('pre code');
codeBlocks.forEach((codeBlock, index) => {
const pre = codeBlock.parentElement;
const copyButton = document.createElement('button');
copyButton.className = 'copy-button';
copyButton.textContent = 'Copy';
copyButton.setAttribute('aria-label', 'Copy code to clipboard');
copyButton.style.position = 'absolute';
copyButton.style.top = '1rem';
copyButton.style.right = '1rem';
copyButton.style.padding = '0.5rem 1rem';
copyButton.style.background = '#6366f1';
copyButton.style.color = 'white';
copyButton.style.border = 'none';
copyButton.style.borderRadius = '0.25rem';
copyButton.style.fontSize = '0.875rem';
copyButton.style.cursor = 'pointer';
copyButton.style.transition = 'background-color 0.2s';
pre.style.position = 'relative';
copyButton.addEventListener('mouseenter', () => {
copyButton.style.background = '#4f46e5';
});
copyButton.addEventListener('mouseleave', () => {
copyButton.style.background = '#6366f1';
});
copyButton.addEventListener('click', async () => {
try {
await navigator.clipboard.writeText(codeBlock.textContent);
copyButton.textContent = 'Copied!';
copyButton.style.background = '#10b981';
setTimeout(() => {
copyButton.textContent = 'Copy';
copyButton.style.background = '#6366f1';
}, 2000);
} catch (err) {
console.error('Failed to copy text: ', err);
copyButton.textContent = 'Failed';
copyButton.style.background = '#ef4444';
setTimeout(() => {
copyButton.textContent = 'Copy';
copyButton.style.background = '#6366f1';
}, 2000);
}
});
pre.appendChild(copyButton);
});
}
setTimeout(initCopyButtons, 100);
function initLazyLoading() {
const images = document.querySelectorAll('img[data-src]');
if ('IntersectionObserver' in window) {
const imageObserver = new IntersectionObserver((entries) => {
entries.forEach(entry => {
if (entry.isIntersecting) {
const img = entry.target;
img.src = img.dataset.src;
img.classList.remove('lazy');
imageObserver.unobserve(img);
}
});
});
images.forEach(img => imageObserver.observe(img));
} else {
images.forEach(img => {
img.src = img.dataset.src;
});
}
}
function initReadingProgress() {
const progressBar = document.querySelector('.progress-bar');
if (!progressBar) return;
function updateProgress() {
const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
const progress = (scrollTop / scrollHeight) * 100;
progressBar.style.width = Math.min(progress, 100) + '%';
}
window.addEventListener('scroll', updateProgress);
updateProgress(); // Initial call
}
if (typeof module !== 'undefined' && module.exports) {
module.exports = {
initScrollAnimations,
initTableOfContents,
initFeatureCardAnimations,
initComparisonTableHighlighting,
initSmoothScrolling,
initCopyButtons,
initReadingProgress
};
}