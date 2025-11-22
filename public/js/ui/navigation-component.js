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
    debug: false,
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
    const toggle = document.querySelector(config.selectors.toggle);
    const menu = document.querySelector(config.selectors.menu);
    
    if (!toggle || !menu) return;
    
    const isOpen = forceState !== null ? forceState : !state.mobileMenuOpen;
    
    state.mobileMenuOpen = isOpen;
    toggle.setAttribute('aria-expanded', isOpen);
    menu.classList.toggle(config.classes.active, isOpen);
    
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
    event.stopPropagation();
    toggleMobileMenu();
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
    if (isMobile()) return;
    
    const dropdown = event.currentTarget;
    
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
        log('Mobile menu elements not found');
        return;
    }
    
    // Toggle button
    toggle.addEventListener('click', handleToggleClick);
    
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
    
    if (dropdowns.length === 0) {
        log('No dropdown elements found');
        return;
    }
    
    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector(config.selectors.dropdownToggle);
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
    if (state.initialized) {
        log('Already initialized');
        return;
    }
    
    log('Initializing...');
    
    // Merge config
    Object.assign(config, options);
    
    // Setup components
    setupMobileMenu();
    setupDropdowns();
    setupGlobalListeners();
    
    state.initialized = true;
    
    // Emit ready event
    window.dispatchEvent(new CustomEvent('nav:ready'));
    
    log('Initialized ✓');
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
    
    // Reset state
    state.mobileMenuOpen = false;
    state.activeDropdown = null;
    state.initialized = false;
    
    log('Destroyed ✓');
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

/**
 * Export Navigation Component
 */
export default {
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
};

// Named exports for testing
export {
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
