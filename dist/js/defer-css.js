/**
 * Defer CSS Loading
 * Loads below-the-fold CSS after initial page render to improve LCP
 * Uses asset manifest to handle content-hashed filenames
 */

(function() {
    'use strict';

    // Debug logging
    window.__deferCssDebug = {
        started: Date.now(),
        logs: []
    };
    
    function debugLog(msg) {
        const timestamp = Date.now() - window.__deferCssDebug.started;
        window.__deferCssDebug.logs.push(`[${timestamp}ms] ${msg}`);
        console.log('[defer-css]', msg);
    }
    
    debugLog('Script started');

    // Asset manifest with hashed filenames (injected during build)
    const assetManifest = window.__assetManifest__ || {};
    debugLog('Asset manifest loaded: ' + Object.keys(assetManifest).length + ' entries');

    // CSS files to load after initial render (maps to asset manifest keys)
    const deferredStyles = {
        'index': assetManifest['styles-index-deferred.css'] ? '/' + assetManifest['styles-index-deferred.css'] : '/styles-index-deferred.css',  // Homepage below-fold sections
        'common': assetManifest['css/components-deferred.css'] ? '/' + assetManifest['css/components-deferred.css'] : '/css/components-deferred.css'  // Common interactive styles
    };
    debugLog('Deferred styles resolved: ' + JSON.stringify(deferredStyles));

    /**
     * Load CSS file asynchronously
     * @param {string} href - CSS file URL
     */
    function loadDeferredCSS(href) {
        debugLog('Loading deferred CSS: ' + href);
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.media = 'print';  // Load without blocking render
        link.onload = function() {
            debugLog('CSS loaded (onload): ' + href + ', setting media to all');
            this.media = 'all';  // Apply styles after loaded
        };
        link.onerror = function() {
            debugLog('ERROR loading CSS: ' + href);
        };
        
        // Fallback for older browsers
        setTimeout(function() {
            debugLog('Timeout fired for ' + href + ', setting media to all');
            link.media = 'all';
        }, 3000);

        document.head.appendChild(link);
        debugLog('Link element appended to head: ' + href);
    }

    /**
     * Determine which deferred CSS to load based on page
     */
    function loadPageDeferredCSS() {
        debugLog('loadPageDeferredCSS called');
        debugLog('document.readyState: ' + document.readyState);
        debugLog('document.head: ' + (document.head ? 'exists' : 'MISSING'));
        
        // Always load common deferred styles (interactive states, animations)
        if (deferredStyles['common']) {
            debugLog('Loading common deferred styles');
            loadDeferredCSS(deferredStyles['common']);
        } else {
            debugLog('No common deferred styles');
        }
        
        // Detect current page (check body class or URL)
        const isIndex = document.body.classList.contains('home') || 
                       window.location.pathname === '/' || 
                       window.location.pathname === '/index.html';
        debugLog('Is index page: ' + isIndex + ' (pathname: ' + window.location.pathname + ')');

        if (isIndex && deferredStyles['index']) {
            debugLog('Loading index deferred styles');
            loadDeferredCSS(deferredStyles['index']);
        } else {
            debugLog('Not loading index styles');
        }
    }

    // Load deferred CSS after page is interactive
    if (document.readyState === 'loading') {
        debugLog('Document loading, waiting for DOMContentLoaded');
        document.addEventListener('DOMContentLoaded', function() {
            debugLog('DOMContentLoaded fired');
            // Delay slightly to prioritize critical rendering
            requestAnimationFrame(function() {
                debugLog('requestAnimationFrame fired');
                setTimeout(loadPageDeferredCSS, 100);
            });
        });
    } else {
        debugLog('Document already loaded, calling immediately');
        // Document already loaded
        requestAnimationFrame(function() {
            debugLog('requestAnimationFrame fired');
            setTimeout(loadPageDeferredCSS, 100);
        });
    }
})();
