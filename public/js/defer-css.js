/**
 * Defer CSS Loading
 * Loads below-the-fold CSS after initial page render to improve LCP
 * Uses asset manifest to handle content-hashed filenames
 */

(function() {
    'use strict';

    // Asset manifest with hashed filenames (injected during build)
    const assetManifest = window.__assetManifest__ || {};

    // CSS files to load after initial render (maps to asset manifest keys)
    const deferredStyles = {
        'index': assetManifest['styles-index-deferred.css'] ? '/' + assetManifest['styles-index-deferred.css'] : '/styles-index-deferred.css',  // Homepage below-fold sections
        'common': assetManifest['css/components-deferred.css'] ? '/' + assetManifest['css/components-deferred.css'] : '/css/components-deferred.css'  // Common interactive styles
    };

    /**
     * Load CSS file asynchronously
     * @param {string} href - CSS file URL
     */
    function loadDeferredCSS(href) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.media = 'print';  // Load without blocking render
        link.onload = function() {
            this.media = 'all';  // Apply styles after loaded
        };
        
        // Fallback for older browsers
        setTimeout(function() {
            link.media = 'all';
        }, 3000);

        document.head.appendChild(link);
    }

    /**
     * Determine which deferred CSS to load based on page
     */
    function loadPageDeferredCSS() {
        // Always load common deferred styles (interactive states, animations)
        if (deferredStyles['common']) {
            loadDeferredCSS(deferredStyles['common']);
        }
        
        // Detect current page (check body class or URL)
        const isIndex = document.body.classList.contains('home') || 
                       window.location.pathname === '/' || 
                       window.location.pathname === '/index.html';

        if (isIndex && deferredStyles['index']) {
            loadDeferredCSS(deferredStyles['index']);
        }
    }

    // Load deferred CSS after page is interactive
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            // Delay slightly to prioritize critical rendering
            requestAnimationFrame(function() {
                setTimeout(loadPageDeferredCSS, 100);
            });
        });
    } else {
        // Document already loaded
        requestAnimationFrame(function() {
            setTimeout(loadPageDeferredCSS, 100);
        });
    }
})();
