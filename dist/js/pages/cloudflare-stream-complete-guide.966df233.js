(function () {
'use strict';
function _initPlatformFilters() {
var filterBtns = document.querySelectorAll('.filter-btn');
if (!filterBtns.length) return;
filterBtns.forEach(function (btn) {
btn.addEventListener('click', function () {
var category = this.getAttribute('data-category');
filterBtns.forEach(function (b) { b.classList.remove('active'); });
this.classList.add('active');
var rows = document.querySelectorAll('.platform-row');
rows.forEach(function (row) {
if (category === 'all' || row.getAttribute('data-category') === category) {
row.style.display = '';
row.style.animation = 'fadeInUp 0.3s ease forwards';
} else {
row.style.display = 'none';
}
});
});
});
}
function _initReadingProgress() {
var progressBar = document.querySelector('.progress-bar');
if (!progressBar) return;
var ticking = false;
window.addEventListener('scroll', function () {
if (!ticking) {
window.requestAnimationFrame(function () {
var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
var docHeight = document.documentElement.scrollHeight - window.innerHeight;
var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
progressBar.style.width = Math.min(progress, 100) + '%';
ticking = false;
});
ticking = true;
}
});
}
function _initTableOfContents() {
var tocLinks = document.querySelectorAll('.toc-link');
var tocItems = document.querySelectorAll('.toc-item');
if (!tocLinks.length) return;
var sections = [];
tocLinks.forEach(function (link) {
var href = link.getAttribute('href');
if (href && href.charAt(0) === '#') {
var el = document.getElementById(href.substring(1));
if (el) sections.push({ el: el, link: link.parentElement });
}
});
var ticking = false;
function onScroll() {
if (ticking) return;
ticking = true;
window.requestAnimationFrame(function () {
var scrollPos = window.pageYOffset + 120;
var activeIdx = 0;
for (var i = 0; i < sections.length; i++) {
if (sections[i].el.offsetTop <= scrollPos) {
activeIdx = i;
}
}
tocItems.forEach(function (item) { item.classList.remove('active'); });
if (sections[activeIdx]) {
sections[activeIdx].link.classList.add('active');
}
ticking = false;
});
}
window.addEventListener('scroll', onScroll);
onScroll(); // initial
tocLinks.forEach(function (link) {
link.addEventListener('click', function (e) {
var href = this.getAttribute('href');
if (href && href.charAt(0) === '#') {
e.preventDefault();
var target = document.getElementById(href.substring(1));
if (target) {
window.scrollTo({
top: target.offsetTop - 80,
behavior: 'smooth'
});
history.pushState(null, null, href);
}
}
});
});
}
function shareOnTwitter() {
var title = document.title;
var url = window.location.href;
window.open(
'https://twitter.com/intent/tweet?text=' + encodeURIComponent(title) + '&url=' + encodeURIComponent(url),
'_blank',
'width=600,height=400'
);
}
function shareOnLinkedIn() {
var url = window.location.href;
window.open(
'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url),
'_blank',
'width=600,height=400'
);
}
function copyLink() {
var url = window.location.href;
if (navigator.clipboard) {
navigator.clipboard.writeText(url).then(function () {
var btn = document.querySelector('.copy-link');
if (btn) {
var orig = btn.textContent;
btn.textContent = '✓ Copied!';
setTimeout(function () { btn.textContent = orig; }, 2000);
}
});
}
}
function _initStatsAnimation() {
var statNumbers = document.querySelectorAll('.stat-number[data-target]');
if (!statNumbers.length) return;
var observer = new IntersectionObserver(function (entries) {
entries.forEach(function (entry) {
if (entry.isIntersecting) {
var el = entry.target;
var target = parseInt(el.getAttribute('data-target'), 10);
var suffix = el.getAttribute('data-suffix') || '';
var prefix = el.getAttribute('data-prefix') || '';
var duration = 1500;
var startTime = null;
var animate = function(ts) {
if (!startTime) startTime = ts;
var progress = Math.min((ts - startTime) / duration, 1);
var ease = 1 - Math.pow(1 - progress, 3);
var current = Math.floor(ease * target);
el.textContent = prefix + current.toLocaleString() + suffix;
if (progress < 1) {
requestAnimationFrame(animate);
} else {
el.textContent = prefix + target.toLocaleString() + suffix;
}
}
requestAnimationFrame(animate);
observer.unobserve(el);
}
});
}, { threshold: 0.5 });
statNumbers.forEach(function (el) { observer.observe(el); });
}
function _initCodePreview() {
var codeBlocks = document.querySelectorAll('.code-block');
codeBlocks.forEach(function (block) {
var copyBtn = block.querySelector('.code-copy-btn');
if (!copyBtn) return;
copyBtn.addEventListener('click', function () {
var code = block.querySelector('.code-content');
if (code && navigator.clipboard) {
navigator.clipboard.writeText(code.textContent).then(function () {
copyBtn.textContent = '✓';
setTimeout(function () { copyBtn.textContent = '📋'; }, 1500);
});
}
});
});
}
function _initFadeInSections() {
var els = document.querySelectorAll('.metric-card, .feature, .step, .faq-item');
if (!els.length || !('IntersectionObserver' in window)) return;
els.forEach(function (el) {
el.style.opacity = '0';
el.style.transform = 'translateY(20px)';
el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
});
var observer = new IntersectionObserver(function (entries) {
entries.forEach(function (entry) {
if (entry.isIntersecting) {
entry.target.style.opacity = '1';
entry.target.style.transform = 'translateY(0)';
observer.unobserve(entry.target);
}
});
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
els.forEach(function (el) { observer.observe(el); });
}
function init() {
_initPlatformFilters();
_initReadingProgress();
_initTableOfContents();
_initStatsAnimation();
_initCodePreview();
_initFadeInSections();
}
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', init);
} else {
init();
}
window.CloudflareStreamGuide = {
shareOnTwitter: shareOnTwitter,
shareOnLinkedIn: shareOnLinkedIn,
copyLink: copyLink
};
})();