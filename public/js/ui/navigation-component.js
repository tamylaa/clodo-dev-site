/**
 * Navigation Component
 * 
 * Manages main navigation functionality including:
 * - Mobile menu toggle
 * - Dropdown menus
 * - Keyboard navigation
 * - Click-outside handling
 * - ARIA accessibility
 * 
 * @module NavigationComponent
 */

/**
 * Navigation component configuration
 */
const config = {
    debug: true, // Debug mode ENABLED for diagnosis
    mobileBreakpoint: 768,
    dropdownDelay: 200, // ms
    animationDuration: 300, // ms
    
    // Selectors
    selectors: {
        toggle: '#mobile-menu-toggle',
        menu: '#mobile-menu',
        dropdownToggle: '.nav-dropdown-toggle',
        dropdown: '.nav-dropdown',
        dropdownMenu: '.nav-dropdown-menu',
        navLink: '.nav-link',
    },
    
    // Classes
    classes: {
        active: 'active',
        expanded: 'expanded',
        open: 'open',
    },
    
    // Scroll spy configuration
    scrollSpy: {
        enabled: true,
        offset: 100, // px from top
        throttleDelay: 100, // ms
        sections: ['hero', 'key-benefits', 'cloudflare-edge', 'features', 'technical-foundation', 'comparison', 'architecture', 'social-proof', 'cta'],
    },
};

/**
 * Navigation component state
 */
const state = {
    mobileMenuOpen: false,
    activeDropdown: null,
    dropdownTimers: new Map(),
    resizeObserver: null,
    initialized: false,
    
    // Scroll spy state
    scrollSpy: {
        activeSection: null,
        lastScrollY: 0,
        ticking: false,
    },
};

/**
 * Log debug message
 */
function log(...args) {
    if (config.debug) {
        console.log('[NavigationComponent]', ...args);
    }
}

/**
 * Check if viewport is mobile
 */
function isMobile() {
    return window.innerWidth <= config.mobileBreakpoint;
}

/**
 * Toggle mobile menu
 */
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
    
    // Verify attributes were set
    const ariaAfter = toggle.getAttribute('aria-expanded');
    const dataAfter = menu.getAttribute('data-visible');
    console.log('toggleMobileMenu: Verification - aria-expanded:', ariaAfter, 'data-visible:', dataAfter);
    
    // Emit event
    window.dispatchEvent(new CustomEvent('nav:mobile-toggle', {
        detail: { open: isOpen },
    }));
    
    log(`Mobile menu ${isOpen ? 'opened' : 'closed'}`);
}

/**
 * Close mobile menu
 */
function closeMobileMenu() {
    if (state.mobileMenuOpen) {
        toggleMobileMenu(false);
    }
}

/**
 * Open dropdown
 */
function openDropdown(dropdown) {
    if (!dropdown) return;
    
    const toggle = dropdown.querySelector(config.selectors.dropdownToggle);
    if (!toggle) return;
    
    // Close other dropdowns
    if (state.activeDropdown && state.activeDropdown !== dropdown) {
        closeDropdown(state.activeDropdown);
    }
    
    state.activeDropdown = dropdown;
    console.log('openDropdown: Setting aria-expanded="true" on toggle');
    toggle.setAttribute('aria-expanded', 'true');
    dropdown.classList.add(config.classes.open);
    
    log('Dropdown opened', dropdown);
}

/**
 * Close dropdown
 */
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

/**
 * Close all dropdowns
 */
function closeAllDropdowns() {
    const dropdowns = document.querySelectorAll(config.selectors.dropdown);
    dropdowns.forEach(dropdown => closeDropdown(dropdown));
}

/**
 * Handle mobile menu toggle click
 */
function handleToggleClick(event) {
    console.log('handleToggleClick called', { type: event.type, target: event.target, currentTarget: event.currentTarget });
    log('handleToggleClick called', { type: event.type, target: event.target });
    event.stopPropagation();
    // Prevent default for touch events to avoid double firing
    if (event.type === 'touchstart') {
        event.preventDefault();
    }
    console.log('About to call toggleMobileMenu()');
    toggleMobileMenu();
    console.log('toggleMobileMenu() completed');
}

/**
 * Handle menu link click
 */
function handleMenuLinkClick() {
    closeMobileMenu();
    closeAllDropdowns();
}

/**
 * Handle dropdown toggle click
 */
function handleDropdownToggleClick(event) {
    const toggle = event.currentTarget;
    const dropdown = toggle.closest(config.selectors.dropdown);
    
    if (isMobile()) {
        // On mobile, toggle on click
        event.preventDefault();
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        
        if (isExpanded) {
            closeDropdown(dropdown);
        } else {
            openDropdown(dropdown);
        }
    }
    // On desktop, let hover handle it
}

/**
 * Handle dropdown mouse enter (desktop only)
 */
function handleDropdownMouseEnter(event) {
    console.log('handleDropdownMouseEnter called, isMobile:', isMobile());
    if (isMobile()) return;
    
    const dropdown = event.currentTarget;
    console.log('handleDropdownMouseEnter: Opening dropdown');
    
    // Clear any pending close timer
    const timer = state.dropdownTimers.get(dropdown);
    if (timer) {
        clearTimeout(timer);
        state.dropdownTimers.delete(dropdown);
    }
    
    openDropdown(dropdown);
}

/**
 * Handle dropdown mouse leave (desktop only)
 */
function handleDropdownMouseLeave(event) {
    if (isMobile()) return;
    
    const dropdown = event.currentTarget;
    
    // Delay closing to allow mouse movement
    const timer = setTimeout(() => {
        closeDropdown(dropdown);
        state.dropdownTimers.delete(dropdown);
    }, config.dropdownDelay);
    
    state.dropdownTimers.set(dropdown, timer);
}

/**
 * Handle document click (close menu/dropdowns when clicking outside)
 */
function handleDocumentClick(event) {
    const toggle = document.querySelector(config.selectors.toggle);
    const menu = document.querySelector(config.selectors.menu);
    
    // Check if click is outside mobile menu
    if (state.mobileMenuOpen) {
        const isClickInsideMenu = menu && menu.contains(event.target);
        const isClickInsideToggle = toggle && toggle.contains(event.target);
        
        if (!isClickInsideMenu && !isClickInsideToggle) {
            closeMobileMenu();
        }
    }
    
    // Check if click is outside dropdown (desktop only)
    if (!isMobile() && state.activeDropdown) {
        const isClickInsideDropdown = state.activeDropdown.contains(event.target);
        
        if (!isClickInsideDropdown) {
            closeAllDropdowns();
        }
    }
}

/**
 * Handle keyboard events
 */
function handleKeyDown(event) {
    // Escape key closes menu and dropdowns
    if (event.key === 'Escape') {
        closeMobileMenu();
        closeAllDropdowns();
        
        // Return focus to toggle button
        const toggle = document.querySelector(config.selectors.toggle);
        if (toggle) {
            toggle.focus();
        }
    }
    
    // Tab key handling for dropdown navigation
    if (event.key === 'Tab' && state.activeDropdown) {
        const dropdown = state.activeDropdown;
        const focusableElements = dropdown.querySelectorAll('a, button');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        // If shift+tab on first element, close dropdown
        if (event.shiftKey && document.activeElement === firstElement) {
            closeDropdown(dropdown);
        }
        
        // If tab on last element, close dropdown
        if (!event.shiftKey && document.activeElement === lastElement) {
            closeDropdown(dropdown);
        }
    }
}

/**
 * Handle window resize
 */
function handleResize() {
    // Close mobile menu if resizing to desktop
    if (!isMobile() && state.mobileMenuOpen) {
        closeMobileMenu();
    }
    
    // Close all dropdowns on resize
    closeAllDropdowns();
}

/**
 * Setup mobile menu
 */
function setupMobileMenu() {
    const toggle = document.querySelector(config.selectors.toggle);
    const menu = document.querySelector(config.selectors.menu);
    
    if (!toggle || !menu) {
        log('Mobile menu elements not found', { toggle: !!toggle, menu: !!menu });
        return;
    }
    
    log('Found mobile menu elements', { toggle, menu });
    
    // Toggle button - add both click and touch events for mobile compatibility
    toggle.addEventListener('click', handleToggleClick);
    
    // Add touch events for better mobile support (especially iOS)
    if ('ontouchstart' in window) {
        toggle.addEventListener('touchstart', handleToggleClick, { passive: false });
        log('Added touchstart event listener');
    }
    
    // Close menu when clicking links
    const menuLinks = menu.querySelectorAll(config.selectors.navLink);
    menuLinks.forEach(link => {
        link.addEventListener('click', handleMenuLinkClick);
    });
    
    log('Mobile menu setup complete');
}

/**
 * Setup dropdowns
 */
function setupDropdowns() {
    const dropdowns = document.querySelectorAll(config.selectors.dropdown);
    console.log('setupDropdowns: Found', dropdowns.length, 'dropdowns');
    console.log('setupDropdowns: selector used:', config.selectors.dropdown);
    
    if (dropdowns.length === 0) {
        console.error('%c❌ NO DROPDOWNS FOUND! Navigation dropdowns not initialized!', 'color: red; font-size: 14px; font-weight: bold;');
        log('No dropdown elements found');
        // DIAGNOSTIC: List all elements with "dropdown" in their class
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
        
        // Click handler for mobile
        toggle.addEventListener('click', handleDropdownToggleClick);
        
        // Hover handlers for desktop
        dropdown.addEventListener('mouseenter', handleDropdownMouseEnter);
        dropdown.addEventListener('mouseleave', handleDropdownMouseLeave);
    });
    
    log(`Setup ${dropdowns.length} dropdown(s)`);
}

/**
 * Setup global event listeners
 */
function setupGlobalListeners() {
    // Document click for closing menus
    document.addEventListener('click', handleDocumentClick);
    
    // Keyboard navigation
    document.addEventListener('keydown', handleKeyDown);
    
    // Window resize
    window.addEventListener('resize', handleResize);
    
    // Page visibility (close menus when page hidden)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            closeMobileMenu();
            closeAllDropdowns();
        }
    });
    
    log('Global listeners setup complete');
}

/**
 * Initialize navigation component
 */
function init(options = {}) {
    console.log('Navigation init() called with options:', options);
    if (state.initialized) {
        log('Already initialized');
        return;
    }
    
    log('Initializing...');
    
    try {
        // Merge config
        Object.assign(config, options);
        
        // Setup components
        setupMobileMenu();
        setupDropdowns();
        setupGlobalListeners();
        initScrollSpy();
        
        state.initialized = true;
        
        // Mark navigation as initialized
        console.log('About to set data-nav-init attribute on document.body');
        document.body.setAttribute('data-nav-init', 'true');
        console.log('Set data-nav-init attribute');
        
        // Debug: Check if attribute was set
        const attrValue = document.body.getAttribute('data-nav-init');
        console.log('Attribute check after setting:', attrValue);
        
        if (attrValue !== 'true') {
            console.error('ERROR: Attribute was not set correctly! Expected "true", got:', attrValue);
        } else {
            console.log('SUCCESS: Attribute set correctly to "true"');
        }
        
        // Emit ready event
        window.dispatchEvent(new CustomEvent('nav:ready'));
        
        log('Initialized ✓');
    } catch (error) {
        console.error('Error during initialization:', error);
        log('Error during initialization:', error);
        throw error;
    }
}

/**
 * Destroy navigation component
 */
function destroy() {
    if (!state.initialized) return;
    
    log('Destroying...');
    
    // Remove toggle listener
    const toggle = document.querySelector(config.selectors.toggle);
    if (toggle) {
        toggle.removeEventListener('click', handleToggleClick);
        if ('ontouchstart' in window) {
            toggle.removeEventListener('touchstart', handleToggleClick);
        }
    }
    
    // Remove menu link listeners
    const menu = document.querySelector(config.selectors.menu);
    if (menu) {
        const menuLinks = menu.querySelectorAll(config.selectors.navLink);
        menuLinks.forEach(link => {
            link.removeEventListener('click', handleMenuLinkClick);
        });
    }
    
    // Remove dropdown listeners
    const dropdowns = document.querySelectorAll(config.selectors.dropdown);
    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector(config.selectors.dropdownToggle);
        if (toggle) {
            toggle.removeEventListener('click', handleDropdownToggleClick);
        }
        dropdown.removeEventListener('mouseenter', handleDropdownMouseEnter);
        dropdown.removeEventListener('mouseleave', handleDropdownMouseLeave);
    });
    
    // Remove global listeners
    document.removeEventListener('click', handleDocumentClick);
    document.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('resize', handleResize);
    
    // Clear timers
    state.dropdownTimers.forEach(timer => clearTimeout(timer));
    state.dropdownTimers.clear();
    
    // Destroy scroll spy
    destroyScrollSpy();
    
    // Reset state
    state.mobileMenuOpen = false;
    state.activeDropdown = null;
    state.initialized = false;
    
    log('Destroyed ✓');
}

/**
 * Get the currently active section based on scroll position
 */
function getActiveSection() {
    const scrollY = window.scrollY + config.scrollSpy.offset;
    const _windowHeight = window.innerHeight;
    
    // Check sections from bottom to top
    for (let i = config.scrollSpy.sections.length - 1; i >= 0; i--) {
        const sectionId = config.scrollSpy.sections[i];
        const section = document.getElementById(sectionId);
        
        if (section) {
            const rect = section.getBoundingClientRect();
            const sectionTop = rect.top + window.scrollY;
            const sectionHeight = rect.height;
            
            // Section is active if it's in the viewport or user has scrolled past it
            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                return sectionId;
            }
            
            // If we're at the top of the page, hero is active
            if (scrollY < 100 && sectionId === 'hero') {
                return sectionId;
            }
        }
    }
    
    return null;
}

/**
 * Update active navigation link
 */
function updateActiveNavLink(activeSectionId) {
    // Remove active class from all nav links
    const navLinks = document.querySelectorAll(`${config.selectors.navLink}[href^="#"]`);
    navLinks.forEach(link => {
        link.classList.remove(config.classes.active);
        link.removeAttribute('aria-current');
    });
    
    // Add active class to current section link
    if (activeSectionId) {
        const activeLink = document.querySelector(`${config.selectors.navLink}[href="#${activeSectionId}"]`);
        if (activeLink) {
            activeLink.classList.add(config.classes.active);
            activeLink.setAttribute('aria-current', 'page');
        }
    }
    
    // Update state
    state.scrollSpy.activeSection = activeSectionId;
}

/**
 * Handle scroll events for scroll spy
 */
function handleScroll() {
    if (!config.scrollSpy.enabled) return;
    
    // Throttle scroll events
    if (!state.scrollSpy.ticking) {
        requestAnimationFrame(() => {
            const activeSection = getActiveSection();
            
            if (activeSection !== state.scrollSpy.activeSection) {
                updateActiveNavLink(activeSection);
                
                // Emit event
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

/**
 * Handle navigation link clicks for smooth scrolling
 */
function handleNavLinkClick(event) {
    const link = event.target.closest(config.selectors.navLink);
    if (!link) return;
    
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    
    const targetId = href.substring(1);
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
        event.preventDefault();
        
        // Smooth scroll to target
        targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
        
        // Update URL without triggering scroll
        history.pushState(null, null, href);
        
        // Close mobile menu if open
        closeMobileMenu();
        
        log('Smooth scrolled to:', targetId);
    }
}

/**
 * Initialize scroll spy functionality
 */
function initScrollSpy() {
    if (!config.scrollSpy.enabled) return;
    
    // Determine if we're on the homepage/index page
    const pathname = window.location.pathname.toLowerCase();
    const isIndexPage = pathname === '/' || 
                       pathname === '' ||
                       pathname.endsWith('/index.html') ||
                       pathname.endsWith('/index');
    
    const scrollSpyItems = document.querySelectorAll('.nav-scroll-spy');
    
    if (isIndexPage) {
        // Show scroll spy items ONLY on homepage
        scrollSpyItems.forEach(item => {
            item.style.display = '';
        });
    } else {
        // Ensure scroll spy items are hidden on non-homepage pages
        scrollSpyItems.forEach(item => {
            // Force the display property to ensure .hidden class is respected
            if (item.classList.contains('hidden')) {
                item.style.display = 'none';
            }
        });
    }
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Add click event listeners to navigation links
    const navLinks = document.querySelectorAll(`${config.selectors.navLink}[href^="#"]`);
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavLinkClick);
    });
    
    // Set initial active section
    const initialActiveSection = getActiveSection();
    updateActiveNavLink(initialActiveSection);
    
    log('Scroll spy initialized');
}

/**
 * Destroy scroll spy functionality
 */
function destroyScrollSpy() {
    if (!config.scrollSpy.enabled) return;
    
    // Remove scroll event listener
    window.removeEventListener('scroll', handleScroll);
    
    // Remove click event listeners
    const navLinks = document.querySelectorAll(`${config.selectors.navLink}[href^="#"]`);
    navLinks.forEach(link => {
        link.removeEventListener('click', handleNavLinkClick);
    });
    
    // Clear active states
    updateActiveNavLink(null);
    
    log('Scroll spy destroyed');
}

/**
 * Get navigation state
 */
function getState() {
    return {
        mobileMenuOpen: state.mobileMenuOpen,
        activeDropdown: state.activeDropdown,
        isMobile: isMobile(),
        initialized: state.initialized,
    };
}

/**
 * Configure navigation
 */
function configure(options) {
    Object.assign(config, options);
    log('Configuration updated', config);
}

/**
 * Enable debug mode
 */
function enableDebug() {
    config.debug = true;
    log('Debug mode enabled');
}

/**
 * Disable debug mode
 */
function disableDebug() {
    config.debug = false;
}

// Expose API to window
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

// ES Module exports
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

// Auto-initialize when loaded as ES module (for pages that load this directly)
if (typeof document !== 'undefined') {
    console.log('Navigation component module loaded, checking DOM state:', document.readyState);
    
    if (document.readyState === 'loading') {
        console.log('Navigation component: DOM loading, adding DOMContentLoaded listener');
        document.addEventListener('DOMContentLoaded', () => {
            console.log('Navigation component: DOMContentLoaded fired, calling init()');
            init();
        });
    } else {
        // DOM already loaded
        console.log('Navigation component: DOM already loaded, calling init() immediately');
        init();
    }
} else {
    console.log('Navigation component: document is undefined, skipping auto-init');
}
