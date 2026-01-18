(function () {
try {
if (document.body.getAttribute('data-nav-init') === 'true') return; // main script already initialized
var isMobile = function () { return window.innerWidth <= 768; };
document.querySelectorAll('.nav-dropdown').forEach(function (dropdown) {
var toggle = dropdown.querySelector('.nav-dropdown-toggle');
if (!toggle) return;
toggle.addEventListener('click', function (e) {
if (!isMobile()) return;
e.preventDefault();
var expanded = toggle.getAttribute('aria-expanded') === 'true';
toggle.setAttribute('aria-expanded', String(!expanded));
dropdown.classList.toggle('open', !expanded);
});
dropdown.addEventListener('mouseenter', function () {
if (isMobile()) return;
toggle.setAttribute('aria-expanded', 'true');
dropdown.classList.add('open');
});
dropdown.addEventListener('mouseleave', function () {
if (isMobile()) return;
toggle.setAttribute('aria-expanded', 'false');
dropdown.classList.remove('open');
});
});
var mobileToggle = document.getElementById('mobile-menu-toggle');
var mobileMenu = document.getElementById('mobile-menu');
if (mobileToggle && mobileMenu) {
mobileToggle.addEventListener('click', function (e) {
try {
var isOpen = mobileToggle.getAttribute('aria-expanded') === 'true';
mobileToggle.setAttribute('aria-expanded', String(!isOpen));
mobileMenu.setAttribute('data-visible', String(!isOpen));
document.body.classList.toggle('mobile-menu-open', !isOpen);
} catch (err) {
}
});
}
} catch (err) {
console.warn('Nav fallback script error:', err);
}
try {
if (document.body.getAttribute('data-nav-init') !== 'true') {
document.body.setAttribute('data-nav-init', 'true');
window.dispatchEvent(new CustomEvent('nav:ready'));
console.log('Nav fallback: set data-nav-init to true');
}
} catch (err) {
}
})();