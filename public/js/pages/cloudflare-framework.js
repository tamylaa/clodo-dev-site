/**
 * Cloudflare Framework Page JavaScript
 * Interactive features and enhancements
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all features (ensure elements have animation classes before observing)
    initFeatureCardAnimations();
    initComparisonTableHighlighting();
    initScrollAnimations();
    initTableOfContents();
    initSmoothScrolling();
    initReadingProgress();
});

/**
 * Initialize scroll-based animations
 */
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

    // Observe elements that should animate on scroll
    const animateElements = document.querySelectorAll('.animate-on-scroll');
    animateElements.forEach(element => {
        observer.observe(element);
    });
}

/**
 * Initialize table of contents with smooth scrolling
 */
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

                // Update URL without triggering scroll
                history.pushState(null, null, `#${targetId}`);
            }
        });
    });
}

/**
 * Initialize feature card hover animations
 */
function initFeatureCardAnimations() {
    const featureCards = document.querySelectorAll('.feature-card');

    featureCards.forEach((card, index) => {
        // Add animation class
        card.classList.add('animate-on-scroll');

        // Add staggered animation delay
        card.style.transitionDelay = `${index * 0.1}s`;

        // Enhanced hover effects
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

/**
 * Initialize comparison table row highlighting
 */
function initComparisonTableHighlighting() {
    const table = document.querySelector('.comparison-table');

    if (!table) return;

    // Add animation class to table
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

/**
 * Initialize smooth scrolling for all anchor links
 */
function initSmoothScrolling() {
    const allLinks = document.querySelectorAll('a[href^="#"]');

    allLinks.forEach(link => {
        // Skip if already handled by table of contents
        if (link.closest('nav')) return;

        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');

            // Only handle internal links
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

                    // Update URL
                    history.pushState(null, null, href);
                }
            }
        });
    });
}

/**
 * Performance monitoring for this page
 */
function initPerformanceTracking() {
    if (window.PerformanceMonitor && typeof window.PerformanceMonitor.trackPageView === 'function') {
        window.PerformanceMonitor.trackPageView('cloudflare-framework');
    }
}

// Initialize performance tracking when PerformanceMonitor is available
if (window.PerformanceMonitor) {
    initPerformanceTracking();
} else {
    // Wait for PerformanceMonitor to load
    document.addEventListener('performanceMonitorReady', initPerformanceTracking);
}

/**
 * Copy button functionality for code blocks
 */
function initCopyButtons() {
    const codeBlocks = document.querySelectorAll('pre code');

    codeBlocks.forEach((codeBlock, index) => {
        const pre = codeBlock.parentElement;

        // Create copy button
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.textContent = 'Copy';
        copyButton.setAttribute('aria-label', 'Copy code to clipboard');

        // Position the button
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

        // Make pre element relative for positioning
        pre.style.position = 'relative';

        // Add hover effect
        copyButton.addEventListener('mouseenter', () => {
            copyButton.style.background = '#4f46e5';
        });

        copyButton.addEventListener('mouseleave', () => {
            copyButton.style.background = '#6366f1';
        });

        // Add click functionality
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

// Initialize copy buttons after a short delay to ensure DOM is ready
setTimeout(initCopyButtons, 100);

/**
 * Lazy loading for images (if any are added later)
 */
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
        // Fallback for browsers without IntersectionObserver
        images.forEach(img => {
            img.src = img.dataset.src;
        });
    }
}

/**
 * Initialize reading progress bar
 */
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

// Export for testing
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