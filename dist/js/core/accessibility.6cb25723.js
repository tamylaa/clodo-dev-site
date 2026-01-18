(function() {
'use strict';
class AccessibilityManager {
constructor() {
this.focusableElements = [
'a[href]',
'button:not([disabled])',
'textarea:not([disabled])',
'input:not([disabled])',
'select:not([disabled])',
'[tabindex]:not([tabindex="-1"])',
'[contenteditable]:not([contenteditable="false"])'
].join(', ');
this.init();
}
init() {
this.enhanceKeyboardNavigation();
this.addFocusIndicators();
this.implementSkipLinks();
this.enhanceFormAccessibility();
this.addLiveRegionSupport();
this.monitorDynamicContent();
this.enhanceTouchTargets();
this.trackInteractions();
console.log('✅ Accessibility enhancements initialized');
}
enhanceKeyboardNavigation() {
document.addEventListener('keydown', (e) => {
if (e.key === 'Escape') {
this.handleEscapeKey();
}
});
document.addEventListener('keydown', (e) => {
if (e.key === 'Tab') {
document.body.classList.add('keyboard-navigation');
}
});
document.addEventListener('mousedown', () => {
document.body.classList.remove('keyboard-navigation');
});
this.enhanceListNavigation();
}
handleEscapeKey() {
const openModal = document.querySelector('.modal[aria-hidden="false"]');
if (openModal) {
const closeButton = openModal.querySelector('[data-modal-close]');
if (closeButton) closeButton.click();
return;
}
const openDropdown = document.querySelector('.nav-dropdown[aria-expanded="true"]');
if (openDropdown) {
openDropdown.setAttribute('aria-expanded', 'false');
const menu = openDropdown.querySelector('.nav-dropdown-menu');
if (menu) menu.hidden = true;
return;
}
const mobileMenu = document.querySelector('.mobile-menu.active');
if (mobileMenu) {
const toggleButton = document.querySelector('.mobile-menu-toggle');
if (toggleButton) toggleButton.click();
}
}
enhanceListNavigation() {
document.querySelectorAll('[role="menu"]').forEach(menu => {
const items = menu.querySelectorAll('[role="menuitem"]');
menu.addEventListener('keydown', (e) => {
const currentIndex = Array.from(items).indexOf(document.activeElement);
if (e.key === 'ArrowDown') {
e.preventDefault();
const nextIndex = (currentIndex + 1) % items.length;
items[nextIndex].focus();
} else if (e.key === 'ArrowUp') {
e.preventDefault();
const prevIndex = (currentIndex - 1 + items.length) % items.length;
items[prevIndex].focus();
} else if (e.key === 'Home') {
e.preventDefault();
items[0].focus();
} else if (e.key === 'End') {
e.preventDefault();
items[items.length - 1].focus();
}
});
});
}
addFocusIndicators() {
const style = document.createElement('style');
style.textContent = `
body.keyboard-navigation *:focus {
outline: 3px solid var(--primary-color, #3b82f6);
outline-offset: 2px;
border-radius: 4px;
}
body.keyboard-navigation a:focus {
outline: 3px solid var(--primary-color, #3b82f6);
outline-offset: 4px;
}
body.keyboard-navigation button:focus {
outline: 3px solid var(--primary-color, #3b82f6);
outline-offset: 2px;
box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.1);
}
body.keyboard-navigation input:focus,
body.keyboard-navigation textarea:focus,
body.keyboard-navigation select:focus {
outline: 3px solid var(--primary-color, #3b82f6);
outline-offset: 2px;
border-color: var(--primary-color, #3b82f6);
}
.skip-link:focus {
outline: 3px solid var(--warning-color, #f59e0b);
outline-offset: 3px;
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
`;
document.head.appendChild(style);
}
implementSkipLinks() {
const skipLink = document.querySelector('.skip-link');
if (!skipLink) {
const link = document.createElement('a');
link.href = '#main-content';
link.className = 'skip-link';
link.textContent = 'Skip to main content';
document.body.insertBefore(link, document.body.firstChild);
const main = document.querySelector('main');
if (main && !main.id) {
main.id = 'main-content';
}
}
document.querySelectorAll('.skip-link').forEach(link => {
link.addEventListener('click', (e) => {
e.preventDefault();
const target = document.querySelector(link.getAttribute('href'));
if (target) {
target.setAttribute('tabindex', '-1');
target.focus();
target.removeAttribute('tabindex');
}
});
});
}
enhanceFormAccessibility() {
document.querySelectorAll('input, textarea, select').forEach(input => {
if (input.type === 'hidden' || input.hidden || input.getAttribute('aria-hidden') === 'true' || input.classList.contains('hp-field') || input.getAttribute('data-honeypot') === 'true') {
return;
}
const getSimpleSelector = (el) => {
if (el.id) return `#${el.id}`;
if (el.name) return `${el.tagName.toLowerCase()}[name="${el.name}"]`;
if (el.placeholder) return `${el.tagName.toLowerCase()}[placeholder="${el.placeholder}"]`;
return el.tagName.toLowerCase();
};
if (!input.id && !input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
console.warn('Form input without label (selector):', getSimpleSelector(input));
}
if (input.required && !input.getAttribute('aria-required')) {
input.setAttribute('aria-required', 'true');
}
input.addEventListener('invalid', (e) => {
e.target.setAttribute('aria-invalid', 'true');
});
input.addEventListener('input', (e) => {
if (e.target.validity.valid) {
e.target.setAttribute('aria-invalid', 'false');
}
});
});
document.querySelectorAll('.form-error, .error-message').forEach(error => {
const input = error.previousElementSibling;
if (input && (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA')) {
if (!error.id) {
error.id = `error-${input.id || Math.random().toString(36).substr(2, 9)}`;
}
input.setAttribute('aria-describedby', error.id);
}
});
}
addLiveRegionSupport() {
if (!document.getElementById('aria-announcer')) {
const announcer = document.createElement('div');
announcer.id = 'aria-announcer';
announcer.setAttribute('role', 'status');
announcer.setAttribute('aria-live', 'polite');
announcer.setAttribute('aria-atomic', 'true');
announcer.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;';
document.body.appendChild(announcer);
}
window.announce = (message, priority = 'polite') => {
const announcer = document.getElementById('aria-announcer');
if (announcer) {
announcer.setAttribute('aria-live', priority);
announcer.textContent = message;
setTimeout(() => {
announcer.textContent = '';
}, 1000);
}
};
const observer = new MutationObserver((mutations) => {
mutations.forEach((mutation) => {
mutation.addedNodes.forEach((node) => {
if (node.nodeType === 1) {
if (node.matches('.success-message, .toast-success')) {
window.announce('Success: ' + node.textContent, 'polite');
} else if (node.matches('.error-message, .toast-error')) {
window.announce('Error: ' + node.textContent, 'assertive');
}
}
});
});
});
observer.observe(document.body, { childList: true, subtree: true });
}
monitorDynamicContent() {
const observer = new MutationObserver((mutations) => {
mutations.forEach((mutation) => {
mutation.addedNodes.forEach((node) => {
if (node.nodeType === 1) {
if (node.tagName === 'IMG' && !node.alt) {
console.warn('Image without alt text:', node);
node.alt = ''; // Decorative image
}
if (node.tagName === 'BUTTON' && !node.textContent.trim() &&
!node.getAttribute('aria-label') && !node.getAttribute('aria-labelledby')) {
console.warn('Button without accessible name:', node);
}
if (node.tagName === 'FORM') {
this.enhanceFormAccessibility();
}
const focusableElements = this.getFocusableElements(node);
if (focusableElements.length > 0) {
const activeElement = document.activeElement;
if (activeElement && activeElement !== document.body) {
this.handleDynamicContentFocus(node, focusableElements);
}
}
if (node.classList && node.classList.contains('modal')) {
this.enhanceModalFocus(node);
}
}
});
mutation.removedNodes.forEach((node) => {
if (node.nodeType === 1) {
if (document.activeElement === document.body ||
document.activeElement === null ||
!document.contains(document.activeElement)) {
this.handleFocusLoss();
}
}
});
});
});
observer.observe(document.body, { childList: true, subtree: true });
}
enhanceTouchTargets() {
const minSize = 44;
document.querySelectorAll('a:not(.footer-section a), button, input[type="button"], input[type="submit"]').forEach(element => {
const rect = element.getBoundingClientRect();
if (rect.width < minSize || rect.height < minSize) {
const currentPadding = parseInt(window.getComputedStyle(element).padding) || 0;
const neededPadding = Math.max(0, (minSize - Math.min(rect.width, rect.height)) / 2);
if (neededPadding > currentPadding) {
element.style.padding = `${neededPadding}px`;
}
}
});
}
getFocusableElements(container = document) {
return container.querySelectorAll(this.focusableElements);
}
trapFocus(container) {
const focusable = this.getFocusableElements(container);
const firstFocusable = focusable[0];
const lastFocusable = focusable[focusable.length - 1];
const handleTabKey = (e) => {
if (e.key !== 'Tab') return;
if (e.shiftKey) {
if (document.activeElement === firstFocusable) {
e.preventDefault();
lastFocusable.focus();
}
} else {
if (document.activeElement === lastFocusable) {
e.preventDefault();
firstFocusable.focus();
}
}
};
container.addEventListener('keydown', handleTabKey);
return () => {
container.removeEventListener('keydown', handleTabKey);
};
}
enhanceDynamicContentFocus() {
const observer = new MutationObserver((mutations) => {
mutations.forEach((mutation) => {
mutation.addedNodes.forEach((node) => {
if (node.nodeType === 1) {
const focusableElements = this.getFocusableElements(node);
if (focusableElements.length > 0) {
const activeElement = document.activeElement;
if (activeElement && activeElement !== document.body) {
this.handleDynamicContentFocus(node, focusableElements);
}
}
if (node.tagName === 'FORM') {
this.enhanceFormAccessibility();
}
if (node.classList && node.classList.contains('modal')) {
this.enhanceModalFocus(node);
}
}
});
mutation.removedNodes.forEach((node) => {
if (node.nodeType === 1) {
if (document.activeElement === document.body ||
document.activeElement === null ||
!document.contains(document.activeElement)) {
this.handleFocusLoss();
}
}
});
});
});
observer.observe(document.body, {
childList: true,
subtree: true
});
}
handleDynamicContentFocus(container, focusableElements) {
if (container.getAttribute('role') === 'dialog' ||
container.getAttribute('role') === 'alertdialog' ||
container.classList.contains('modal')) {
focusableElements[0].focus();
return;
}
if (container.classList.contains('error-message') ||
container.classList.contains('success-message') ||
container.classList.contains('notification')) {
return;
}
const recentlyInteracted = Date.now() - (this.lastInteractionTime || 0) < 1000;
if (recentlyInteracted && focusableElements.length === 1) {
focusableElements[0].focus();
}
}
handleFocusLoss() {
const main = document.querySelector('main');
const header = document.querySelector('header');
const skipLink = document.querySelector('.skip-link');
if (skipLink) {
skipLink.focus();
} else if (main) {
main.setAttribute('tabindex', '-1');
main.focus();
main.removeAttribute('tabindex');
} else if (header) {
header.setAttribute('tabindex', '-1');
header.focus();
header.removeAttribute('tabindex');
}
}
enhanceModalFocus(modal) {
const focusableElements = this.getFocusableElements(modal);
if (focusableElements.length > 0) {
const handleKeyDown = (e) => {
if (e.key === 'Tab') {
this.trapFocusInContainer(modal, e);
}
};
modal.addEventListener('keydown', handleKeyDown);
modal._focusCleanup = () => {
modal.removeEventListener('keydown', handleKeyDown);
};
}
}
trapFocusInContainer(container, event) {
const focusableElements = this.getFocusableElements(container);
if (focusableElements.length === 0) return;
const firstElement = focusableElements[0];
const lastElement = focusableElements[focusableElements.length - 1];
if (event.shiftKey) {
if (document.activeElement === firstElement) {
event.preventDefault();
lastElement.focus();
}
} else {
if (document.activeElement === lastElement) {
event.preventDefault();
firstElement.focus();
}
}
}
trackInteractions() {
const interactionEvents = ['mousedown', 'keydown', 'touchstart'];
interactionEvents.forEach(eventType => {
document.addEventListener(eventType, () => {
this.lastInteractionTime = Date.now();
}, { passive: true });
});
}
getContrastRatio(foreground, background) {
const getLuminance = (color) => {
const rgb = color.match(/\d+/g).map(Number);
const [r, g, b] = rgb.map(val => {
val = val / 255;
return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
});
return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const l1 = getLuminance(foreground);
const l2 = getLuminance(background);
return l1 > l2 ? (l1 + 0.05) / (l2 + 0.05) : (l2 + 0.05) / (l1 + 0.05);
}
validateContrast() {
const issues = [];
document.querySelectorAll('*').forEach(element => {
const styles = window.getComputedStyle(element);
const color = styles.color;
const backgroundColor = styles.backgroundColor;
if (color && backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
const ratio = this.getContrastRatio(color, backgroundColor);
const fontSize = parseFloat(styles.fontSize);
const isBold = parseInt(styles.fontWeight) >= 700;
const isLargeText = fontSize >= 18 || (fontSize >= 14 && isBold);
const requiredRatio = isLargeText ? 3 : 4.5; // WCAG AA
if (ratio < requiredRatio) {
issues.push({
element,
ratio: ratio.toFixed(2),
required: requiredRatio,
color,
backgroundColor
});
}
}
});
return issues;
}
generateReport() {
const report = {
timestamp: new Date().toISOString(),
checks: {
headings: this.checkHeadingHierarchy(),
landmarks: this.checkLandmarks(),
images: this.checkImages(),
forms: this.checkForms(),
links: this.checkLinks(),
contrast: this.validateContrast()
}
};
console.group('📋 Accessibility Report');
console.log('Heading Issues:', report.checks.headings.issues.length);
console.log('Landmark Issues:', report.checks.landmarks.issues.length);
console.log('Image Issues:', report.checks.images.issues.length);
console.log('Form Issues:', report.checks.forms.issues.length);
console.log('Link Issues:', report.checks.links.issues.length);
console.log('Contrast Issues:', report.checks.contrast.length);
console.groupEnd();
return report;
}
checkHeadingHierarchy() {
const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
const issues = [];
let prevLevel = 0;
headings.forEach(heading => {
const level = parseInt(heading.tagName[1]);
if (level - prevLevel > 1) {
issues.push({
element: heading,
message: `Heading level skipped from H${prevLevel} to H${level}`
});
}
prevLevel = level;
});
return { total: headings.length, issues };
}
checkLandmarks() {
const issues = [];
if (!document.querySelector('header, [role="banner"]')) {
issues.push({ message: 'Missing <header> or role="banner"' });
}
if (!document.querySelector('nav, [role="navigation"]')) {
issues.push({ message: 'Missing <nav> or role="navigation"' });
}
if (!document.querySelector('main, [role="main"]')) {
issues.push({ message: 'Missing <main> or role="main"' });
}
if (!document.querySelector('footer, [role="contentinfo"]')) {
issues.push({ message: 'Missing <footer> or role="contentinfo"' });
}
return { issues };
}
checkImages() {
const images = Array.from(document.querySelectorAll('img'));
const issues = images.filter(img => !img.hasAttribute('alt')).map(img => ({
element: img,
message: 'Image missing alt attribute'
}));
return { total: images.length, issues };
}
checkForms() {
const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
const issues = [];
inputs.forEach(input => {
if (input.type === 'hidden') return;
const hasLabel = input.id && document.querySelector(`label[for="${input.id}"]`);
const hasAriaLabel = input.getAttribute('aria-label') || input.getAttribute('aria-labelledby');
if (!hasLabel && !hasAriaLabel) {
issues.push({
element: input,
message: 'Form input missing label'
});
}
});
return { total: inputs.length, issues };
}
checkLinks() {
const links = Array.from(document.querySelectorAll('a[href]'));
const issues = [];
links.forEach(link => {
const text = link.textContent.trim();
const ariaLabel = link.getAttribute('aria-label');
if (!text && !ariaLabel) {
issues.push({
element: link,
message: 'Link has no accessible text'
});
}
if (text && text.length < 2) {
issues.push({
element: link,
message: 'Link text too short'
});
}
});
return { total: links.length, issues };
}
}
let accessibilityManager;
function initializeAccessibility() {
accessibilityManager = new AccessibilityManager();
window.AccessibilityManager = AccessibilityManager;
window.a11y = accessibilityManager;
window.announce = window.announce || function(message, priority = 'polite') {
const announcer = document.getElementById('aria-announcer');
if (announcer) {
announcer.setAttribute('aria-live', priority);
announcer.textContent = message;
setTimeout(() => announcer.textContent = '', 1000);
}
};
}
if (typeof window !== 'undefined') {
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', initializeAccessibility);
} else {
initializeAccessibility();
}
}// Remove ES6 exports - this is now an IIFE
})();