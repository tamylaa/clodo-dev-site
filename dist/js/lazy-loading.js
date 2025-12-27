// Lazy loading functionality - loaded after page load
function setupLazyLoading() {
    // Support for native lazy loading attribute
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');

    // If native lazy loading is supported, we're done
    if ('loading' in HTMLImageElement.prototype) {
        return;
    }

    // Fallback: Use Intersection Observer for older browsers
    const imageObserverOptions = {
        threshold: 0.01,
        rootMargin: '50px'
    };

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;

                // Load image from data-src
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                }

                // Load srcset from data-srcset
                if (img.dataset.srcset) {
                    img.srcset = img.dataset.srcset;
                }

                // Add loaded class
                img.classList.add('lazy-loaded');

                // Stop observing this image
                observer.unobserve(img);
            }
        });
    }, imageObserverOptions);

    lazyImages.forEach(img => {
        // Add placeholder if not already present
        if (!img.dataset.src) {
            img.dataset.src = img.src;
            img.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22400%22 height=%22300%22/%3E%3C/svg%3E';
        }

        img.classList.add('lazy');
        imageObserver.observe(img);
    });

    // Also setup lazy loading for background images with data-src
    const lazyBgs = document.querySelectorAll('[data-bg-src]');
    const bgObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                el.style.backgroundImage = `url(${el.dataset.bgSrc})`;
                el.classList.add('lazy-loaded');
                observer.unobserve(el);
            }
        });
    }, imageObserverOptions);

    lazyBgs.forEach(el => {
        el.classList.add('lazy');
        bgObserver.observe(el);
    });
}

// Initialize lazy loading when this module loads
setupLazyLoading();