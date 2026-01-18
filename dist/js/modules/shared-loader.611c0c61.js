const SharedModules = {
loaded: {},
async loadModule(name, path) {
try {
if (this.loaded[name]) {
return this.loaded[name];
}
const module = await import(path);
this.loaded[name] = module;
return module;
} catch (error) {
console.warn(`Failed to load module: ${name}`, error);
return null;
}
},
initProgressBar() {
try {
const progressBar = document.getElementById('progressBar') || 
document.querySelector('.progress-bar');
if (!progressBar) return;
const updateProgressBar = () => {
const scrollTop = window.scrollY;
const docHeight = document.documentElement.scrollHeight - window.innerHeight;
const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
progressBar.style.width = Math.min(scrollPercent, 100) + '%';
};
let progressTimeout;
window.addEventListener('scroll', function() {
if (!progressTimeout) {
progressTimeout = setTimeout(function() {
updateProgressBar();
progressTimeout = null;
}, 16);
}
});
updateProgressBar();
} catch (error) {
console.warn('Progress bar init failed:', error);
}
},
initSocialSharing() {
try {
window.shareOnTwitter = function() {
const url = encodeURIComponent(window.location.href);
const pageTitle = document.querySelector('h1')?.textContent || 'Check this out';
const text = encodeURIComponent(`${pageTitle} - ${url}`);
const twitterUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
window.open(twitterUrl, '_blank', 'width=600,height=400');
};
window.shareOnLinkedIn = function() {
const url = encodeURIComponent(window.location.href);
const title = encodeURIComponent(document.title);
const summary = encodeURIComponent(
document.querySelector('meta[name="description"]')?.getAttribute('content') || 'Check this out'
);
const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`;
window.open(linkedinUrl, '_blank', 'width=600,height=600');
};
window.copyLink = function() {
const url = window.location.href;
navigator.clipboard.writeText(url).then(() => {
const copyBtn = document.querySelector('.copy-link');
if (copyBtn) {
const originalText = copyBtn.innerHTML;
copyBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Copied!';
copyBtn.classList.add('copied');
setTimeout(() => {
copyBtn.innerHTML = originalText;
copyBtn.classList.remove('copied');
}, 2000);
}
}).catch(() => {
const textArea = document.createElement('textarea');
textArea.value = url;
document.body.appendChild(textArea);
textArea.select();
document.execCommand('copy');
document.body.removeChild(textArea);
});
};
} catch (error) {
console.warn('Social sharing init failed:', error);
}
},
initTOC() {
try {
const tocToggle = document.querySelector('.toc-toggle');
const tocNav = document.querySelector('.toc-nav');
const tocLinks = document.querySelectorAll('.toc-link, .toc-sublink');
const headings = document.querySelectorAll('h1[id], h2[id], h3[id], h4[id]');
if (!tocLinks.length) return;
if (tocToggle && tocNav) {
tocToggle.addEventListener('click', function() {
tocNav.classList.toggle('expanded');
const isExpanded = tocNav.classList.contains('expanded');
tocToggle.setAttribute('aria-expanded', isExpanded);
const svg = tocToggle.querySelector('svg');
if (svg) {
svg.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
}
});
}
const updateActiveSection = () => {
const scrollPosition = window.scrollY + 150;
tocLinks.forEach(link => link.classList.remove('active'));
let currentSection = null;
for (let i = headings.length - 1; i >= 0; i--) {
const heading = headings[i];
if (heading.offsetTop <= scrollPosition) {
currentSection = heading;
break;
}
}
if (currentSection) {
const targetLink = document.querySelector(`a[href="#${currentSection.id}"]`);
if (targetLink) {
targetLink.classList.add('active');
const parentLi = targetLink.closest('.toc-item');
if (parentLi && targetLink.classList.contains('toc-sublink')) {
const parentLink = parentLi.querySelector('.toc-link');
if (parentLink) parentLink.classList.add('active');
}
}
}
};
let scrollTimeout;
window.addEventListener('scroll', function() {
if (!scrollTimeout) {
scrollTimeout = setTimeout(function() {
updateActiveSection();
scrollTimeout = null;
}, 50);
}
});
updateActiveSection();
tocLinks.forEach(link => {
link.addEventListener('click', function(e) {
e.preventDefault();
const targetId = this.getAttribute('href').substring(1);
const targetElement = document.getElementById(targetId);
if (targetElement) {
const header = document.querySelector('header') || document.querySelector('nav');
const headerOffset = header ? header.offsetHeight + 20 : 100;
const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
const offsetPosition = elementPosition - headerOffset;
window.scrollTo({
top: offsetPosition,
behavior: 'smooth'
});
history.pushState(null, null, `#${targetId}`);
if (window.innerWidth <= 1024 && tocNav) {
tocNav.classList.remove('expanded');
if (tocToggle) {
tocToggle.setAttribute('aria-expanded', 'false');
const svg = tocToggle.querySelector('svg');
if (svg) svg.style.transform = 'rotate(0deg)';
}
}
}
});
});
} catch (error) {
console.warn('TOC init failed:', error);
}
},
initAnimations() {
try {
const counterCards = document.querySelectorAll('[data-animate="counter"]');
counterCards.forEach(card => {
const observer = new IntersectionObserver((entries) => {
entries.forEach(entry => {
if (entry.isIntersecting && !entry.target.dataset.animated) {
entry.target.dataset.animated = 'true';
const valueElement = entry.target.querySelector('.metric-value') ||
entry.target.querySelector('.stat-number');
if (valueElement) {
const target = parseInt(entry.target.dataset.target);
const suffix = entry.target.dataset.suffix || '';
this.animateCounter(valueElement, 0, target, 2000, suffix);
}
}
});
}, { threshold: 0.5 });
observer.observe(card);
});
const cards = document.querySelectorAll('.building-block, .platform-card');
cards.forEach((card, index) => {
card.style.opacity = '0';
card.style.transform = 'translateY(20px)';
card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
const observer = new IntersectionObserver((entries) => {
entries.forEach(entry => {
if (entry.isIntersecting) {
entry.target.style.opacity = '1';
entry.target.style.transform = 'translateY(0)';
}
});
}, { threshold: 0.1 });
observer.observe(card);
});
const barItems = document.querySelectorAll('.bar-item');
barItems.forEach(item => {
const observer = new IntersectionObserver((entries) => {
entries.forEach(entry => {
if (entry.isIntersecting) {
const barFill = entry.target.querySelector('.bar-fill');
if (barFill && !barFill.dataset.animated) {
barFill.dataset.animated = 'true';
const targetWidth = barFill.dataset.width;
setTimeout(() => {
barFill.style.width = targetWidth + '%';
}, 100);
}
}
});
}, { threshold: 0.3 });
observer.observe(item);
});
} catch (error) {
console.warn('Animations init failed:', error);
}
},
animateCounter(element, start, end, duration, suffix = '') {
const startTime = performance.now();
const endTime = startTime + duration;
const update = (currentTime) => {
if (currentTime >= endTime) {
element.textContent = end + suffix;
return;
}
const progress = (currentTime - startTime) / duration;
const easeOutProgress = 1 - Math.pow(1 - progress, 3);
const currentValue = Math.floor(start + (end - start) * easeOutProgress);
element.textContent = currentValue + suffix;
requestAnimationFrame(update);
};
requestAnimationFrame(update);
}
};
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', () => {
SharedModules.initProgressBar();
SharedModules.initSocialSharing();
SharedModules.initTOC();
SharedModules.initAnimations();
});
} else {
SharedModules.initProgressBar();
SharedModules.initSocialSharing();
SharedModules.initTOC();
SharedModules.initAnimations();
}
if (typeof module !== 'undefined' && module.exports) {
module.exports = SharedModules;
}