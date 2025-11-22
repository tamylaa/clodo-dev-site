/**
 * Navigation Manager
 * 
 * Lightweight navigation coordinator for multi-page sites.
 * Handles:
 * - Smooth page transitions
 * - Scroll position restoration
 * - Active link highlighting
 * - Navigation events
 * - Prefetching
 * 
 * @module Navigation
 */

/**
 * Navigation configuration
 */
const config = {
    // Scroll behavior
    scrollBehavior: 'smooth', // 'smooth' | 'instant' | 'auto'
    scrollOffset: 80, // Offset for fixed headers (px)
    
    // Transitions
    enableTransitions: true,
    transitionDuration: 300, // ms
    
    // Prefetching
    enablePrefetch: true,
    prefetchDelay: 100, // ms after hover
    
    // Active links
    activeClass: 'active',
    exactMatch: false, // true = exact URL match, false = starts with
    
    // History
    saveScrollPosition: true,
    restoreScrollPosition: true,
};

/**
 * Navigation state
 */
const state = {
    currentPath: window.location.pathname,
    scrollPositions: new Map(), // path -> scroll position
    isTransitioning: false,
    prefetchTimers: new Map(), // link -> timer
    observers: [], // IntersectionObserver instances
};

/**
 * Get normalized path from URL
 */
function normalizePath(url) {
    try {
        const urlObj = new URL(url, window.location.origin);
        return urlObj.pathname;
    } catch {
        return url;
    }
}

/**
 * Check if URL is internal
 */
function isInternalLink(url) {
    try {
        const urlObj = new URL(url, window.location.origin);
        return urlObj.origin === window.location.origin;
    } catch {
        return false;
    }
}

/**
 * Check if link should be handled by navigation manager
 */
function shouldHandleLink(link) {
    // Skip if:
    // - Has download attribute
    // - Has target="_blank"
    // - Is external
    // - Has data-no-intercept
    // - Is hash-only link on same page
    
    if (link.hasAttribute('download')) return false;
    if (link.target === '_blank') return false;
    if (link.hasAttribute('data-no-intercept')) return false;
    
    const href = link.getAttribute('href');
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
    
    if (!isInternalLink(href)) return false;
    
    // Allow hash links to same page
    const url = new URL(href, window.location.origin);
    if (url.pathname === window.location.pathname && url.hash) {
        return false; // Let browser handle hash navigation
    }
    
    return true;
}

/**
 * Save current scroll position
 */
function saveScrollPosition() {
    if (!config.saveScrollPosition) return;
    
    state.scrollPositions.set(state.currentPath, {
        x: window.scrollX,
        y: window.scrollY,
        timestamp: Date.now(),
    });
}

/**
 * Restore scroll position for current path
 */
function restoreScrollPosition() {
    if (!config.restoreScrollPosition) return;
    
    const position = state.scrollPositions.get(state.currentPath);
    if (position) {
        window.scrollTo({
            left: position.x,
            top: position.y,
            behavior: 'instant',
        });
        return true;
    }
    return false;
}

/**
 * Scroll to top of page
 */
function scrollToTop() {
    window.scrollTo({
        left: 0,
        top: 0,
        behavior: config.scrollBehavior,
    });
}

/**
 * Scroll to element
 */
function scrollToElement(element, offset = config.scrollOffset) {
    if (!element) return;
    
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.scrollY - offset;
    
    window.scrollTo({
        top: offsetPosition,
        behavior: config.scrollBehavior,
    });
}

/**
 * Scroll to hash target
 */
function scrollToHash(hash) {
    if (!hash) return false;
    
    const id = hash.startsWith('#') ? hash.slice(1) : hash;
    const element = document.getElementById(id);
    
    if (element) {
        scrollToElement(element);
        return true;
    }
    return false;
}

/**
 * Update active navigation links
 */
function updateActiveLinks() {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('a[href]');
    
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (!href || !isInternalLink(href)) return;
        
        const linkPath = normalizePath(href);
        const isActive = config.exactMatch
            ? linkPath === currentPath
            : currentPath.startsWith(linkPath);
        
        link.classList.toggle(config.activeClass, isActive);
        
        // Update ARIA
        if (isActive) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });
}

/**
 * Prefetch page
 */
function prefetchPage(url) {
    if (!config.enablePrefetch) return;
    if (!isInternalLink(url)) return;
    
    // Check if already prefetched
    const links = document.querySelectorAll(`link[rel="prefetch"][href="${url}"]`);
    if (links.length > 0) return;
    
    // Create prefetch link
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
}

/**
 * Handle link hover for prefetching
 */
function handleLinkHover(event) {
    const link = event.target.closest('a');
    if (!link || !shouldHandleLink(link)) return;
    
    const href = link.getAttribute('href');
    
    // Clear existing timer
    const existingTimer = state.prefetchTimers.get(link);
    if (existingTimer) {
        clearTimeout(existingTimer);
    }
    
    // Set new timer
    const timer = setTimeout(() => {
        prefetchPage(href);
        state.prefetchTimers.delete(link);
    }, config.prefetchDelay);
    
    state.prefetchTimers.set(link, timer);
}

/**
 * Handle link click
 */
function handleLinkClick(event) {
    const link = event.target.closest('a');
    if (!link || !shouldHandleLink(link)) return;
    
    // Get href
    const href = link.getAttribute('href');
    const url = new URL(href, window.location.origin);
    
    // Handle hash links to different pages
    if (url.pathname !== window.location.pathname && url.hash) {
        // Let browser navigate, will be handled by popstate
        return;
    }
    
    // Emit navigation event
    const navigationEvent = new CustomEvent('navigation:before', {
        detail: { url: url.href, path: url.pathname },
        cancelable: true,
    });
    
    if (!window.dispatchEvent(navigationEvent)) {
        event.preventDefault();
        return;
    }
    
    // Save scroll position before navigation
    saveScrollPosition();
}

/**
 * Handle popstate (back/forward navigation)
 */
function handlePopState() {
    state.currentPath = window.location.pathname;
    
    // Try to restore scroll position
    const restored = restoreScrollPosition();
    
    // Update active links
    updateActiveLinks();
    
    // Emit event
    window.dispatchEvent(new CustomEvent('navigation:after', {
        detail: {
            path: state.currentPath,
            scrollRestored: restored,
        },
    }));
}

/**
 * Handle page load
 */
function handlePageLoad() {
    state.currentPath = window.location.pathname;
    
    // Update active links
    updateActiveLinks();
    
    // Handle hash if present
    if (window.location.hash) {
        // Wait for content to load
        requestAnimationFrame(() => {
            scrollToHash(window.location.hash);
        });
    }
    
    // Emit event
    window.dispatchEvent(new CustomEvent('navigation:load', {
        detail: { path: state.currentPath },
    }));
}

/**
 * Initialize navigation manager
 */
function init(options = {}) {
    console.log('[Navigation] Initializing...');
    
    // Merge config
    Object.assign(config, options);
    
    // Handle initial page load
    handlePageLoad();
    
    // Listen for popstate (back/forward)
    window.addEventListener('popstate', handlePopState);
    
    // Listen for link clicks
    document.addEventListener('click', handleLinkClick);
    
    // Listen for link hovers (prefetching)
    if (config.enablePrefetch) {
        document.addEventListener('mouseenter', handleLinkHover, true);
    }
    
    // Listen for page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            updateActiveLinks();
        }
    });
    
    // Save scroll position before unload
    window.addEventListener('beforeunload', saveScrollPosition);
    
    console.log('[Navigation] Initialized ✓');
}

/**
 * Destroy navigation manager
 */
function destroy() {
    console.log('[Navigation] Destroying...');
    
    // Remove event listeners
    window.removeEventListener('popstate', handlePopState);
    document.removeEventListener('click', handleLinkClick);
    document.removeEventListener('mouseenter', handleLinkHover, true);
    window.removeEventListener('beforeunload', saveScrollPosition);
    
    // Clear timers
    state.prefetchTimers.forEach(timer => clearTimeout(timer));
    state.prefetchTimers.clear();
    
    // Clear observers
    state.observers.forEach(observer => observer.disconnect());
    state.observers = [];
    
    // Clear state
    state.scrollPositions.clear();
    
    console.log('[Navigation] Destroyed ✓');
}

/**
 * Navigate to URL programmatically
 */
function navigateTo(url, options = {}) {
    const { replace = false } = options;
    
    // Save current scroll position
    if (config.saveScrollPosition && !replace) {
        saveScrollPosition();
    }
    
    // Navigate
    window.location.href = url;
    
    // Note: Scroll will be handled on next page load
}

/**
 * Go back in history
 */
function goBack() {
    window.history.back();
}

/**
 * Go forward in history
 */
function goForward() {
    window.history.forward();
}

/**
 * Get current path
 */
function getCurrentPath() {
    return state.currentPath;
}

/**
 * Configure navigation manager
 */
function configure(options) {
    Object.assign(config, options);
}

/**
 * Export Navigation manager
 */
export default {
    init,
    destroy,
    navigateTo,
    goBack,
    goForward,
    scrollToTop,
    scrollToElement,
    scrollToHash,
    updateActiveLinks,
    getCurrentPath,
    configure,
};

// Named exports for testing
export {
    init,
    destroy,
    navigateTo,
    goBack,
    goForward,
    scrollToTop,
    scrollToElement,
    scrollToHash,
    updateActiveLinks,
    getCurrentPath,
    configure,
    normalizePath,
    isInternalLink,
};
