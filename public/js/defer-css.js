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
    let assetManifest = window.__assetManifest__ || {};
    let manifestSize = Object.keys(assetManifest).length;
    debugLog('Asset manifest loaded: ' + manifestSize + ' entries');
    
    // If manifest missing inline (deployment transform), attempt a fast fetch of /asset-manifest.json as fallback
    async function ensureManifest() {
        if (manifestSize === 0) {
            debugLog('WARNING: Manifest is empty. Attempting to fetch /asset-manifest.json as fallback.');
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 800);
                const res = await fetch('/asset-manifest.json', { method: 'GET', cache: 'no-store', signal: controller.signal });
                clearTimeout(timeout);
                if (res && res.ok) {
                    const data = await res.json();
                    if (data && Object.keys(data).length) {
                        assetManifest = data;
                        manifestSize = Object.keys(assetManifest).length;
                        debugLog('Fetched asset manifest fallback from /asset-manifest.json: ' + manifestSize + ' entries');
                    } else {
                        debugLog('Fetched manifest fallback was empty');
                    }
                } else {
                    debugLog('Failed to fetch manifest fallback (non-ok response)');
                }
            } catch (e) {
                debugLog('Error fetching manifest fallback: ' + (e && e.message ? e.message : e));
            }
        }
    }

    // Defer the rest of initialization until we've ensured a manifest is available (try fast fetch fallback)
    (async function initDeferredStyles() {
        await ensureManifest();

        // Get hashed filenames from manifest (CRITICAL for production)
        const indexDeferredCss = assetManifest['styles-index-deferred.css'];
        let commonDeferredCss = assetManifest['css/components-deferred.css'];

        debugLog('Index deferred CSS lookup: "styles-index-deferred.css" -> ' + (indexDeferredCss || 'NOT FOUND'));
        debugLog('Common deferred CSS lookup: "css/components-deferred.css" -> ' + (commonDeferredCss || 'NOT FOUND'));

        // Fallback: if common deferred CSS missing, try components-reusable entry or plain path
        if (!commonDeferredCss) {
            // try alternate manifest keys
            commonDeferredCss = assetManifest['css/components-reusable.css'] || assetManifest['components-reusable.css'] || null;
            if (commonDeferredCss) {
                debugLog('Fallback: found components-reusable in manifest -> ' + commonDeferredCss);
            } else {
                // final fallback to an expected path on the server
                debugLog('Fallback: components-reusable not in manifest, will use /css/components-reusable.css if available');
                commonDeferredCss = null; // explicit null, will fallback to path when used
            }
        }

        // CSS files to load after initial render (maps to asset manifest keys)
        const deferredStyles = {
            'index': indexDeferredCss ? '/' + indexDeferredCss : null,  // Homepage below-fold sections
            'common': commonDeferredCss ? '/' + commonDeferredCss : '/css/components-reusable.css'  // Common interactive styles
        };
        
        // WARN if index deferred missing; common now has a safe fallback
        if (!indexDeferredCss) {
            debugLog('WARNING: Index deferred CSS not found in manifest - styles may not load!');
        }
        if (!assetManifest['css/components-deferred.css']) {
            debugLog('WARNING: Common deferred CSS not found in manifest - using fallback: ' + deferredStyles['common']);
        }
        
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
                // Avoid duplicating work when the stylesheet is already present (preloaded or applied).
                try {
                    const hrefToCheck = deferredStyles['common'];
                    const basename = hrefToCheck.split('/').pop();

                    // Look for existing link elements (stylesheet or preload) matching the same basename
                    const existingLink = Array.from(document.querySelectorAll('link[rel="stylesheet"], link[rel="preload"]'))
                        .find(ln => {
                            try {
                                const h = ln.getAttribute('href') || '';
                                return h.endsWith(basename) || h.indexOf(basename) !== -1;
                            } catch (e) { return false; }
                        });

                    // Also check applied styleSheets for the same basename
                    const sheetDetected = Array.from(document.styleSheets)
                        .some(s => s && s.href && s.href.indexOf(basename) !== -1);

                    if (existingLink || sheetDetected) {
                        debugLog('Skipping deferred load; stylesheet already present: ' + (existingLink ? (existingLink.href || existingLink.getAttribute('href')) : 'detected in document.styleSheets'));
                    } else {
                        debugLog('Loading common deferred styles');
                        loadDeferredCSS(deferredStyles['common']);
                    }
                } catch (e) {
                    debugLog('Error while checking existing styles, proceeding to load: ' + (e && e.message ? e.message : e));
                    loadDeferredCSS(deferredStyles['common']);
                }
            } else {
                debugLog('ERROR: No common deferred styles to load - manifest may be empty or CSS not found in manifest');
            }
            
            // Detect current page (check body class or URL)
            const isIndex = document.body.classList.contains('home') || 
                           window.location.pathname === '/' || 
                           window.location.pathname === '/index.html';
            debugLog('Is index page: ' + isIndex + ' (pathname: ' + window.location.pathname + ')');

            if (isIndex) {
                if (deferredStyles['index']) {
                    debugLog('Loading index deferred styles');
                    loadDeferredCSS(deferredStyles['index']);
                } else {
                    debugLog('ERROR: This is index page but no index deferred styles available - manifest issue');
                }
            } else {
                debugLog('Not loading index styles (non-index page detected)');
                debugLog('Page-specific CSS is already preloaded and converted to stylesheet by init-preload.js');
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
})();
