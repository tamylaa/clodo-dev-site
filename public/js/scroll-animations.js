// Scroll animations - loaded after page load
function setupScrollAnimations() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        return; // Skip adding observers for animations
    }

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

    // Observe elements that should animate in
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

// Initialize scroll animations when this module loads
setupScrollAnimations();

// Exports for unit tests (Node/CommonJS environment)
/* eslint-disable no-undef */
if (typeof module === 'object' && module && typeof module.exports === 'object') {
    module.exports = {
        setupScrollAnimations
    };
}
/* eslint-enable no-undef */