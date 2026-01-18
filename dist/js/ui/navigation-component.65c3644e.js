const config = {
debug: true, // Debug mode ENABLED for diagnosis
mobileBreakpoint: 768,
dropdownDelay: 200, // ms
animationDuration: 300, // ms
selectors: {
toggle: '#mobile-menu-toggle',
menu: '#mobile-menu',
dropdownToggle: '.nav-dropdown-toggle',
dropdown: '.nav-dropdown',
dropdownMenu: '.nav-dropdown-menu',
navLink: '.nav-link',
},
classes: {
active: 'active',
expanded: 'expanded',
open: 'open',
},
scrollSpy: {
enabled: true,
offset: 100, // px from top
throttleDelay: 100, // ms
sections: ['hero', 'key-benefits', 'cloudflare-edge', 'features', 'technical-foundation', 'comparison', 'architecture', 'social-proof', 'cta'],
},
};
const state = {
mobileMenuOpen: false,
activeDropdown: null,
dropdownTimers: new Map(),
resizeObserver: null,
initialized: false,
scrollSpy: {
activeSection: null,
lastScrollY: 0,
ticking: false,
},
};
function log(...args) {
if (config.debug) {
console.log('[NavigationComponent]', ...args);
}
}
function isMobile() {
return window.innerWidth <= config.mobileBreakpoint;
}
function toggleMobileMenu(forceState = null) {
console.log('toggleMobileMenu called with forceState:', forceState);
const toggle = document.querySelector(config.selectors.toggle);
const menu = document.querySelector(config.selectors.menu);
if (!toggle || !menu) {
console.error('toggleMobileMenu: Elements not found', { toggle: !!toggle, menu: !!menu });
return;
}
const isOpen = forceState !== null ? forceState : !state.mobileMenuOpen;
console.log('toggleMobileMenu: current state.mobileMenuOpen:', state.mobileMenuOpen, 'new isOpen:', isOpen);
state.mobileMenuOpen = isOpen;
console.log('toggleMobileMenu: Setting aria-expanded to:', String(isOpen));
toggle.setAttribute('aria-expanded', String(isOpen));
console.log('toggleMobileMenu: Setting data-visible to:', String(isOpen));
menu.setAttribute('data-visible', String(isOpen));
const ariaAfter = toggle.getAttribute('aria-expanded');
const dataAfter = menu.getAttribute('data-visible');
console.log('toggleMobileMenu: Verification - aria-expanded:', ariaAfter, 'data-visible:', dataAfter);
window.dispatchEvent(new CustomEvent('nav:mobile-toggle', {
detail: { open: isOpen },
}));
log(`Mobile menu ${isOpen ? 'opened' : 'closed'}`);
}
function closeMobileMenu() {
if (state.mobileMenuOpen) {
toggleMobileMenu(false);
}
}
function openDropdown(dropdown) {
if (!dropdown) return;
const toggle = dropdown.querySelector(config.selectors.dropdownToggle);
if (!toggle) return;
if (state.activeDropdown && state.activeDropdown !== dropdown) {
closeDropdown(state.activeDropdown);
}
state.activeDropdown = dropdown;
console.log('openDropdown: Setting aria-expanded="true" on toggle');
toggle.setAttribute('aria-expanded', 'true');
dropdown.classList.add(config.classes.open);
log('Dropdown opened', dropdown);
}
function closeDropdown(dropdown) {
if (!dropdown) return;
const toggle = dropdown.querySelector(config.selectors.dropdownToggle);
if (!toggle) return;
toggle.setAttribute('aria-expanded', 'false');
dropdown.classList.remove(config.classes.open);
if (state.activeDropdown === dropdown) {
state.activeDropdown = null;
}
log('Dropdown closed', dropdown);
}
function closeAllDropdowns() {
const dropdowns = document.querySelectorAll(config.selectors.dropdown);
dropdowns.forEach(dropdown => closeDropdown(dropdown));
}
function handleToggleClick(event) {
console.log('handleToggleClick called', { type: event.type, target: event.target, currentTarget: event.currentTarget });
log('handleToggleClick called', { type: event.type, target: event.target });
event.stopPropagation();
if (event.type === 'touchstart') {
event.preventDefault();
}
console.log('About to call toggleMobileMenu()');
toggleMobileMenu();
console.log('toggleMobileMenu() completed');
}
function handleMenuLinkClick() {
closeMobileMenu();
closeAllDropdowns();
}
function handleDropdownToggleClick(event) {
const toggle = event.currentTarget;
const dropdown = toggle.closest(config.selectors.dropdown);
if (isMobile()) {
event.preventDefault();
const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
if (isExpanded) {
closeDropdown(dropdown);
} else {
openDropdown(dropdown);
}
}
}
function handleDropdownMouseEnter(event) {
console.log('handleDropdownMouseEnter called, isMobile:', isMobile());
if (isMobile()) return;
const dropdown = event.currentTarget;
console.log('handleDropdownMouseEnter: Opening dropdown');
const timer = state.dropdownTimers.get(dropdown);
if (timer) {
clearTimeout(timer);
state.dropdownTimers.delete(dropdown);
}
openDropdown(dropdown);
}
function handleDropdownMouseLeave(event) {
if (isMobile()) return;
const dropdown = event.currentTarget;
const timer = setTimeout(() => {
closeDropdown(dropdown);
state.dropdownTimers.delete(dropdown);
}, config.dropdownDelay);
state.dropdownTimers.set(dropdown, timer);
}
function handleDocumentClick(event) {
const toggle = document.querySelector(config.selectors.toggle);
const menu = document.querySelector(config.selectors.menu);
if (state.mobileMenuOpen) {
const isClickInsideMenu = menu && menu.contains(event.target);
const isClickInsideToggle = toggle && toggle.contains(event.target);
if (!isClickInsideMenu && !isClickInsideToggle) {
closeMobileMenu();
}
}
if (!isMobile() && state.activeDropdown) {
const isClickInsideDropdown = state.activeDropdown.contains(event.target);
if (!isClickInsideDropdown) {
closeAllDropdowns();
}
}
}
function handleKeyDown(event) {
if (event.key === 'Escape') {
closeMobileMenu();
closeAllDropdowns();
const toggle = document.querySelector(config.selectors.toggle);
if (toggle) {
toggle.focus();
}
}
if (event.key === 'Tab' && state.activeDropdown) {
const dropdown = state.activeDropdown;
const focusableElements = dropdown.querySelectorAll('a, button');
const firstElement = focusableElements[0];
const lastElement = focusableElements[focusableElements.length - 1];
if (event.shiftKey && document.activeElement === firstElement) {
closeDropdown(dropdown);
}
if (!event.shiftKey && document.activeElement === lastElement) {
closeDropdown(dropdown);
}
}
}
function handleResize() {
if (!isMobile() && state.mobileMenuOpen) {
closeMobileMenu();
}
closeAllDropdowns();
}
function setupMobileMenu() {
const toggle = document.querySelector(config.selectors.toggle);
const menu = document.querySelector(config.selectors.menu);
if (!toggle || !menu) {
log('Mobile menu elements not found', { toggle: !!toggle, menu: !!menu });
return;
}
log('Found mobile menu elements', { toggle, menu });
toggle.addEventListener('click', handleToggleClick);
if ('ontouchstart' in window) {
toggle.addEventListener('touchstart', handleToggleClick, { passive: false });
log('Added touchstart event listener');
}
const menuLinks = menu.querySelectorAll(config.selectors.navLink);
menuLinks.forEach(link => {
link.addEventListener('click', handleMenuLinkClick);
});
log('Mobile menu setup complete');
}
function setupDropdowns() {
const dropdowns = document.querySelectorAll(config.selectors.dropdown);
console.log('setupDropdowns: Found', dropdowns.length, 'dropdowns');
console.log('setupDropdowns: selector used:', config.selectors.dropdown);
if (dropdowns.length === 0) {
console.error('%c❌ NO DROPDOWNS FOUND! Navigation dropdowns not initialized!', 'color: red; font-size: 14px; font-weight: bold;');
log('No dropdown elements found');
const allElements = document.querySelectorAll('[class*="dropdown"]');
console.log('setupDropdowns: Elements with "dropdown" in class:', allElements.length);
allElements.forEach((el, idx) => {
console.log('setupDropdowns: Element', idx, ':', el.tagName, el.className);
});
return;
}
console.log('%c✓ Found dropdowns, setting up event listeners', 'color: green; font-size: 14px;');
dropdowns.forEach((dropdown, idx) => {
const toggle = dropdown.querySelector(config.selectors.dropdownToggle);
console.log('setupDropdowns: Dropdown', idx, 'has toggle:', !!toggle);
if (!toggle) return;
toggle.addEventListener('click', handleDropdownToggleClick);
dropdown.addEventListener('mouseenter', handleDropdownMouseEnter);
dropdown.addEventListener('mouseleave', handleDropdownMouseLeave);
});
log(`Setup ${dropdowns.length} dropdown(s)`);
}
function setupGlobalListeners() {
document.addEventListener('click', handleDocumentClick);
document.addEventListener('keydown', handleKeyDown);
window.addEventListener('resize', handleResize);
document.addEventListener('visibilitychange', () => {
if (document.hidden) {
closeMobileMenu();
closeAllDropdowns();
}
});
log('Global listeners setup complete');
}
function init(options = {}) {
console.log('Navigation init() called with options:', options);
if (state.initialized) {
log('Already initialized');
return;
}
log('Initializing...');
try {
Object.assign(config, options);
setupMobileMenu();
setupDropdowns();
setupGlobalListeners();
initScrollSpy();
state.initialized = true;
console.log('About to set data-nav-init attribute on document.body');
document.body.setAttribute('data-nav-init', 'true');
console.log('Set data-nav-init attribute');
const attrValue = document.body.getAttribute('data-nav-init');
console.log('Attribute check after setting:', attrValue);
if (attrValue !== 'true') {
console.error('ERROR: Attribute was not set correctly! Expected "true", got:', attrValue);
} else {
console.log('SUCCESS: Attribute set correctly to "true"');
}
window.dispatchEvent(new CustomEvent('nav:ready'));
log('Initialized ✓');
} catch (error) {
console.error('Error during initialization:', error);
log('Error during initialization:', error);
throw error;
}
}
function destroy() {
if (!state.initialized) return;
log('Destroying...');
const toggle = document.querySelector(config.selectors.toggle);
if (toggle) {
toggle.removeEventListener('click', handleToggleClick);
if ('ontouchstart' in window) {
toggle.removeEventListener('touchstart', handleToggleClick);
}
}
const menu = document.querySelector(config.selectors.menu);
if (menu) {
const menuLinks = menu.querySelectorAll(config.selectors.navLink);
menuLinks.forEach(link => {
link.removeEventListener('click', handleMenuLinkClick);
});
}
const dropdowns = document.querySelectorAll(config.selectors.dropdown);
dropdowns.forEach(dropdown => {
const toggle = dropdown.querySelector(config.selectors.dropdownToggle);
if (toggle) {
toggle.removeEventListener('click', handleDropdownToggleClick);
}
dropdown.removeEventListener('mouseenter', handleDropdownMouseEnter);
dropdown.removeEventListener('mouseleave', handleDropdownMouseLeave);
});
document.removeEventListener('click', handleDocumentClick);
document.removeEventListener('keydown', handleKeyDown);
window.removeEventListener('resize', handleResize);
state.dropdownTimers.forEach(timer => clearTimeout(timer));
state.dropdownTimers.clear();
destroyScrollSpy();
state.mobileMenuOpen = false;
state.activeDropdown = null;
state.initialized = false;
log('Destroyed ✓');
}
function getActiveSection() {
const scrollY = window.scrollY + config.scrollSpy.offset;
const _windowHeight = window.innerHeight;
for (let i = config.scrollSpy.sections.length - 1; i >= 0; i--) {
const sectionId = config.scrollSpy.sections[i];
const section = document.getElementById(sectionId);
if (section) {
const rect = section.getBoundingClientRect();
const sectionTop = rect.top + window.scrollY;
const sectionHeight = rect.height;
if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
return sectionId;
}
if (scrollY < 100 && sectionId === 'hero') {
return sectionId;
}
}
}
return null;
}
function updateActiveNavLink(activeSectionId) {
const navLinks = document.querySelectorAll(`${config.selectors.navLink}[href^="#"]`);
navLinks.forEach(link => {
link.classList.remove(config.classes.active);
link.removeAttribute('aria-current');
});
if (activeSectionId) {
const activeLink = document.querySelector(`${config.selectors.navLink}[href="#${activeSectionId}"]`);
if (activeLink) {
activeLink.classList.add(config.classes.active);
activeLink.setAttribute('aria-current', 'page');
}
}
state.scrollSpy.activeSection = activeSectionId;
}
function handleScroll() {
if (!config.scrollSpy.enabled) return;
if (!state.scrollSpy.ticking) {
requestAnimationFrame(() => {
const activeSection = getActiveSection();
if (activeSection !== state.scrollSpy.activeSection) {
updateActiveNavLink(activeSection);
window.dispatchEvent(new CustomEvent('nav:section-change', {
detail: { 
activeSection,
previousSection: state.scrollSpy.activeSection 
},
}));
log('Active section changed:', activeSection);
}
state.scrollSpy.lastScrollY = window.scrollY;
state.scrollSpy.ticking = false;
});
state.scrollSpy.ticking = true;
}
}
function handleNavLinkClick(event) {
const link = event.target.closest(config.selectors.navLink);
if (!link) return;
const href = link.getAttribute('href');
if (!href || !href.startsWith('#')) return;
const targetId = href.substring(1);
const targetElement = document.getElementById(targetId);
if (targetElement) {
event.preventDefault();
targetElement.scrollIntoView({
behavior: 'smooth',
block: 'start',
});
history.pushState(null, null, href);
closeMobileMenu();
log('Smooth scrolled to:', targetId);
}
}
function initScrollSpy() {
if (!config.scrollSpy.enabled) return;
const pathname = window.location.pathname.toLowerCase();
const isIndexPage = pathname === '/' || 
pathname === '' ||
pathname.endsWith('/index.html') ||
pathname.endsWith('/index');
const scrollSpyItems = document.querySelectorAll('.nav-scroll-spy');
if (isIndexPage) {
scrollSpyItems.forEach(item => {
item.style.display = '';
});
} else {
scrollSpyItems.forEach(item => {
if (item.classList.contains('hidden')) {
item.style.display = 'none';
}
});
}
window.addEventListener('scroll', handleScroll, { passive: true });
const navLinks = document.querySelectorAll(`${config.selectors.navLink}[href^="#"]`);
navLinks.forEach(link => {
link.addEventListener('click', handleNavLinkClick);
});
const initialActiveSection = getActiveSection();
updateActiveNavLink(initialActiveSection);
log('Scroll spy initialized');
}
function destroyScrollSpy() {
if (!config.scrollSpy.enabled) return;
window.removeEventListener('scroll', handleScroll);
const navLinks = document.querySelectorAll(`${config.selectors.navLink}[href^="#"]`);
navLinks.forEach(link => {
link.removeEventListener('click', handleNavLinkClick);
});
updateActiveNavLink(null);
log('Scroll spy destroyed');
}
function getState() {
return {
mobileMenuOpen: state.mobileMenuOpen,
activeDropdown: state.activeDropdown,
isMobile: isMobile(),
initialized: state.initialized,
};
}
function configure(options) {
Object.assign(config, options);
log('Configuration updated', config);
}
function enableDebug() {
config.debug = true;
log('Debug mode enabled');
}
function disableDebug() {
config.debug = false;
}
if (typeof window !== 'undefined') {
window.NavigationComponent = {
init,
destroy,
toggleMobileMenu,
closeMobileMenu,
openDropdown,
closeDropdown,
closeAllDropdowns,
getState,
configure,
enableDebug,
disableDebug,
isMobile,
};
}
const NavigationComponentAPI = {
init,
destroy,
toggleMobileMenu,
closeMobileMenu,
openDropdown,
closeDropdown,
closeAllDropdowns,
getState,
configure,
enableDebug,
disableDebug,
isMobile,
};
export { NavigationComponentAPI as default, init, destroy, toggleMobileMenu, closeMobileMenu, openDropdown, closeDropdown, closeAllDropdowns, getState, configure, enableDebug, disableDebug, isMobile };
if (typeof document !== 'undefined') {
console.log('Navigation component module loaded, checking DOM state:', document.readyState);
if (document.readyState === 'loading') {
console.log('Navigation component: DOM loading, adding DOMContentLoaded listener');
document.addEventListener('DOMContentLoaded', () => {
console.log('Navigation component: DOMContentLoaded fired, calling init()');
init();
});
} else {
console.log('Navigation component: DOM already loaded, calling init() immediately');
init();
}
} else {
console.log('Navigation component: document is undefined, skipping auto-init');
}