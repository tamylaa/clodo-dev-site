// StackBlitz integration helper
// Exposes openStackBlitz(url) and init() which attaches click handlers for elements
// using data-stackblitz-url="...".

// Cache this module globally so inline onclick handlers can access it synchronously
window.__stackblitzModule = window.__stackblitzModule || {};

export function openStackBlitz(url) {
    // Cache this function globally for sync access
    window.__stackblitzModule.openStackBlitz = openStackBlitz;
    
    // Open in popup window with appropriate dimensions for StackBlitz
    try {
        const popupFeatures = 'width=1200,height=800,left=100,top=100,resizable=yes,scrollbars=yes,status=yes';
        const w = window.open(url, 'stackblitz-demo', popupFeatures);
        // Focus the popup window
        if (w) w.focus();
        return w;
    } catch (e) {
        // Fallback to location change only as last resort
        window.location.href = url;
        return null;
    }
}

export function init() {
    // Attach to any button with data-stackblitz-url or data-action="open-stackblitz"
    const buttons = document.querySelectorAll('[data-stackblitz-url], [data-action="open-stackblitz"]');
    buttons.forEach(btn => {
        if (btn.__stackblitzBound) return;

        // On pointer enter, preconnect to StackBlitz to reduce click-to-open latency (low cost, user-initiated)
        const preconnectHandler = () => {
            try {
                if (!document.querySelector('link[data-preconnect="stackblitz"]')) {
                    const link = document.createElement('link');
                    link.rel = 'preconnect';
                    link.href = 'https://stackblitz.com';
                    link.setAttribute('data-preconnect', 'stackblitz');
                    link.crossOrigin = '';
                    document.head.appendChild(link);
                }
            } catch (e) {
                // Ignored - optimization only
                void e;
            }
            // Mark this element as having had preconnect bound/fired
            try { btn.__sbPreconnectBound = true; } catch (e) { (void e); }
        };

        ['pointerenter', 'mouseenter'].forEach(evt => btn.addEventListener(evt, preconnectHandler, { once: true }));

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const url = btn.getAttribute('data-stackblitz-url');
            if (url) openStackBlitz(url);
        });
        btn.__stackblitzBound = true;
    });

    // Delegated fallback: listen for pointerover/mouseover at document level to handle cases
    // where elements are dynamically added after init or per-element binding failed.
    const delegatedOverHandler = (e) => {
        const el = e.target.closest && (e.target.closest('[data-stackblitz-url]') || e.target.closest('[data-action="open-stackblitz"]') || e.target.closest('button[onclick*="openStackBlitz"]'));
        if (!el) return;
        if (el.__sbPreconnectBound) return;
        try {
            if (!document.querySelector('link[data-preconnect="stackblitz"]')) {
                const link = document.createElement('link');
                link.rel = 'preconnect';
                link.href = 'https://stackblitz.com';
                link.setAttribute('data-preconnect', 'stackblitz');
                link.crossOrigin = '';
                document.head.appendChild(link);
            }
        } catch (e) {
            // ignored
            void e;
        }
        try { el.__sbPreconnectBound = true; } catch (e) { (void e); }
    };

    // Use pointerover/mouseover which bubble and are reliable in headless envs
    document.addEventListener('pointerover', delegatedOverHandler, { passive: true });
    document.addEventListener('mouseover', delegatedOverHandler, { passive: true });

    // Also expose global for legacy inline onclick handlers
    if (typeof window.openStackBlitz !== 'function') {
        window.openStackBlitz = openStackBlitz;
    }

    return { init, openStackBlitz };
}
