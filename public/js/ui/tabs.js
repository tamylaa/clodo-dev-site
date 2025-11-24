/**
 * Tabs Component
 * 
 * Accessible tabs implementation with:
 * - ARIA tabs pattern
 * - Keyboard navigation (Arrow keys, Home, End)
 * - URL hash support
 * - Lazy content loading
 * - Event emission
 * - Responsive mobile accordion fallback
 * 
 * @module Tabs
 */

/**
 * Tabs configuration
 */
const config = {
    debug: false,
    
    // Default options
    defaults: {
        orientation: 'horizontal', // 'horizontal' or 'vertical'
        urlHash: false, // Use URL hash for tab state
        lazy: false, // Lazy load tab content
        defaultTab: 0, // Index of default active tab
        mobileBreakpoint: 768, // Switch to accordion on mobile
    },
    
    // Selectors
    selectors: {
        tabList: '[role="tablist"]',
        tab: '[role="tab"]',
        tabPanel: '[role="tabpanel"]',
    },
    
    // Classes
    classes: {
        tabList: 'tabs-list',
        tab: 'tab',
        tabPanel: 'tab-panel',
        active: 'active',
        hidden: 'hidden',
        loaded: 'loaded',
    },
    
    // Key codes
    keys: {
        left: 'ArrowLeft',
        right: 'ArrowRight',
        up: 'ArrowUp',
        down: 'ArrowDown',
        home: 'Home',
        end: 'End',
    },
};

/**
 * Tabs state
 */
const state = {
    instances: new Map(), // id -> instance
    initialized: false,
};

/**
 * Log debug message
 */
function log(...args) {
    if (config.debug) {
        console.log('[Tabs]', ...args);
    }
}

/**
 * Generate unique ID
 */
function generateId() {
    return `tabs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if mobile
 */
function isMobile(breakpoint) {
    return window.innerWidth < breakpoint;
}

/**
 * Tabs class
 */
class Tabs {
    constructor(element, options = {}) {
        if (!element) {
            throw new Error('Tabs requires an element');
        }
        
        this.id = generateId();
        this.element = element;
        this.options = { ...config.defaults, ...options };
        this.tabList = null;
        this.tabs = [];
        this.panels = [];
        this.activeIndex = -1;
        this.listeners = new Map();
        
        this._init();
        state.instances.set(this.id, this);
        
        log('Tabs created', this.id);
    }
    
    /**
     * Initialize tabs
     */
    _init() {
        // Find tab list
        this.tabList = this.element.querySelector(config.selectors.tabList);
        if (!this.tabList) {
            throw new Error('Tabs requires a [role="tablist"] element');
        }
        
        // Find tabs and panels
        this.tabs = Array.from(this.tabList.querySelectorAll(config.selectors.tab));
        this.panels = Array.from(this.element.querySelectorAll(config.selectors.tabPanel));
        
        if (this.tabs.length === 0 || this.panels.length === 0) {
            throw new Error('Tabs requires at least one tab and panel');
        }
        
        if (this.tabs.length !== this.panels.length) {
            console.warn('Number of tabs and panels do not match');
        }
        
        // Set up ARIA attributes
        this._setupAria();
        
        // Setup event listeners
        this._setupListeners();
        
        // Activate initial tab
        const initialTab = this._getInitialTab();
        this.activate(initialTab);
    }
    
    /**
     * Setup ARIA attributes
     */
    _setupAria() {
        // Tab list
        this.tabList.setAttribute('role', 'tablist');
        
        if (this.options.orientation === 'vertical') {
            this.tabList.setAttribute('aria-orientation', 'vertical');
        }
        
        // Tabs and panels
        this.tabs.forEach((tab, index) => {
            const panel = this.panels[index];
            if (!panel) return;
            
            // Generate IDs if needed
            const tabId = tab.id || `${this.id}-tab-${index}`;
            const panelId = panel.id || `${this.id}-panel-${index}`;
            
            tab.id = tabId;
            panel.id = panelId;
            
            // Tab attributes
            tab.setAttribute('role', 'tab');
            tab.setAttribute('aria-controls', panelId);
            tab.setAttribute('aria-selected', 'false');
            tab.setAttribute('tabindex', '-1');
            
            // Panel attributes
            panel.setAttribute('role', 'tabpanel');
            panel.setAttribute('aria-labelledby', tabId);
            panel.setAttribute('tabindex', '0');
            panel.classList.add(config.classes.hidden);
        });
    }
    
    /**
     * Setup event listeners
     */
    _setupListeners() {
        // Tab clicks
        this.tabs.forEach((tab, index) => {
            const handler = (e) => {
                e.preventDefault();
                this.activate(index);
            };
            tab.addEventListener('click', handler);
            this.listeners.set(`click-${index}`, handler);
        });
        
        // Keyboard navigation
        const keyHandler = (e) => {
            this._handleKeyboard(e);
        };
        this.tabList.addEventListener('keydown', keyHandler);
        this.listeners.set('keyboard', keyHandler);
        
        // URL hash changes
        if (this.options.urlHash) {
            const hashHandler = () => {
                this._handleHashChange();
            };
            window.addEventListener('hashchange', hashHandler);
            this.listeners.set('hashchange', hashHandler);
        }
        
        // Resize for mobile accordion
        const resizeHandler = () => {
            this._handleResize();
        };
        window.addEventListener('resize', resizeHandler);
        this.listeners.set('resize', resizeHandler);
    }
    
    /**
     * Remove event listeners
     */
    _removeListeners() {
        // Tab clicks
        this.tabs.forEach((tab, index) => {
            const handler = this.listeners.get(`click-${index}`);
            if (handler) {
                tab.removeEventListener('click', handler);
            }
        });
        
        // Keyboard
        const keyHandler = this.listeners.get('keyboard');
        if (keyHandler) {
            this.tabList.removeEventListener('keydown', keyHandler);
        }
        
        // Hash
        const hashHandler = this.listeners.get('hashchange');
        if (hashHandler) {
            window.removeEventListener('hashchange', hashHandler);
        }
        
        // Resize
        const resizeHandler = this.listeners.get('resize');
        if (resizeHandler) {
            window.removeEventListener('resize', resizeHandler);
        }
        
        this.listeners.clear();
    }
    
    /**
     * Get initial tab index
     */
    _getInitialTab() {
        // Check URL hash
        if (this.options.urlHash && window.location.hash) {
            const hash = window.location.hash.slice(1);
            const index = this.panels.findIndex(panel => panel.id === hash);
            if (index !== -1) {
                return index;
            }
        }
        
        // Use default
        return this.options.defaultTab;
    }
    
    /**
     * Handle keyboard navigation
     */
    _handleKeyboard(event) {
        const { key } = event;
        const { orientation } = this.options;
        
        let handled = false;
        let newIndex = this.activeIndex;
        
        // Arrow navigation
        if (orientation === 'horizontal') {
            if (key === config.keys.left) {
                newIndex = this.activeIndex - 1;
                handled = true;
            } else if (key === config.keys.right) {
                newIndex = this.activeIndex + 1;
                handled = true;
            }
        } else {
            if (key === config.keys.up) {
                newIndex = this.activeIndex - 1;
                handled = true;
            } else if (key === config.keys.down) {
                newIndex = this.activeIndex + 1;
                handled = true;
            }
        }
        
        // Home/End
        if (key === config.keys.home) {
            newIndex = 0;
            handled = true;
        } else if (key === config.keys.end) {
            newIndex = this.tabs.length - 1;
            handled = true;
        }
        
        if (handled) {
            event.preventDefault();
            
            // Wrap around
            if (newIndex < 0) {
                newIndex = this.tabs.length - 1;
            } else if (newIndex >= this.tabs.length) {
                newIndex = 0;
            }
            
            this.activate(newIndex, true);
        }
    }
    
    /**
     * Handle URL hash change
     */
    _handleHashChange() {
        if (!window.location.hash) return;
        
        const hash = window.location.hash.slice(1);
        const index = this.panels.findIndex(panel => panel.id === hash);
        
        if (index !== -1 && index !== this.activeIndex) {
            this.activate(index);
        }
    }
    
    /**
     * Handle window resize
     */
    _handleResize() {
        const mobile = isMobile(this.options.mobileBreakpoint);
        
        // Update orientation class for styling
        if (mobile) {
            this.element.classList.add('tabs-mobile');
        } else {
            this.element.classList.remove('tabs-mobile');
        }
    }
    
    /**
     * Load panel content (if lazy)
     */
    _loadPanel(index) {
        const panel = this.panels[index];
        if (!panel || panel.classList.contains(config.classes.loaded)) {
            return;
        }
        
        if (this.options.lazy) {
            // Emit load event
            this._emit('load', { index, panel });
            
            // Mark as loaded
            panel.classList.add(config.classes.loaded);
        }
    }
    
    /**
     * Activate tab by index
     */
    activate(index, focusTab = false) {
        if (index < 0 || index >= this.tabs.length) {
            log('Invalid tab index', index);
            return this;
        }
        
        if (index === this.activeIndex) {
            log('Tab already active', index);
            return this;
        }
        
        const previousIndex = this.activeIndex;
        const tab = this.tabs[index];
        const panel = this.panels[index];
        
        log('Activating tab', index);
        
        // Emit before-change event
        this._emit('before-change', { index, previousIndex, tab, panel });
        
        // Deactivate all tabs
        this.tabs.forEach((t, i) => {
            t.setAttribute('aria-selected', 'false');
            t.setAttribute('tabindex', '-1');
            t.classList.remove(config.classes.active);
        });
        
        // Hide all panels
        this.panels.forEach(p => {
            p.classList.add(config.classes.hidden);
        });
        
        // Activate selected tab
        tab.setAttribute('aria-selected', 'true');
        tab.setAttribute('tabindex', '0');
        tab.classList.add(config.classes.active);
        
        if (focusTab) {
            tab.focus();
        }
        
        // Show selected panel
        panel.classList.remove(config.classes.hidden);
        
        // Load panel content if lazy
        this._loadPanel(index);
        
        // Update URL hash
        if (this.options.urlHash) {
            const newHash = `#${panel.id}`;
            if (window.location.hash !== newHash) {
                history.pushState(null, '', newHash);
            }
        }
        
        // Update active index
        this.activeIndex = index;
        
        // Emit change event
        this._emit('change', { index, previousIndex, tab, panel });
        
        return this;
    }
    
    /**
     * Activate next tab
     */
    next() {
        const nextIndex = (this.activeIndex + 1) % this.tabs.length;
        return this.activate(nextIndex);
    }
    
    /**
     * Activate previous tab
     */
    previous() {
        const prevIndex = this.activeIndex - 1 < 0 ? this.tabs.length - 1 : this.activeIndex - 1;
        return this.activate(prevIndex);
    }
    
    /**
     * Get active tab index
     */
    getActive() {
        return this.activeIndex;
    }
    
    /**
     * Get tab count
     */
    getCount() {
        return this.tabs.length;
    }
    
    /**
     * Disable tab
     */
    disable(index) {
        if (index < 0 || index >= this.tabs.length) return this;
        
        const tab = this.tabs[index];
        tab.setAttribute('aria-disabled', 'true');
        tab.setAttribute('tabindex', '-1');
        
        return this;
    }
    
    /**
     * Enable tab
     */
    enable(index) {
        if (index < 0 || index >= this.tabs.length) return this;
        
        const tab = this.tabs[index];
        tab.removeAttribute('aria-disabled');
        
        if (index === this.activeIndex) {
            tab.setAttribute('tabindex', '0');
        }
        
        return this;
    }
    
    /**
     * Emit event
     */
    _emit(eventName, detail = {}) {
        const event = new CustomEvent(`tabs:${eventName}`, {
            detail: { tabsId: this.id, ...detail },
        });
        window.dispatchEvent(event);
        
        // Also emit on element
        this.element.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
    
    /**
     * Add event listener
     */
    on(eventName, handler) {
        this.element.addEventListener(eventName, handler);
        return this;
    }
    
    /**
     * Remove event listener
     */
    off(eventName, handler) {
        this.element.removeEventListener(eventName, handler);
        return this;
    }
    
    /**
     * Destroy tabs
     */
    destroy() {
        this._removeListeners();
        state.instances.delete(this.id);
        log('Tabs destroyed', this.id);
    }
}

/**
 * Initialize tabs on element
 */
function init(element, options = {}) {
    if (!element) {
        throw new Error('Tabs.init requires an element');
    }
    
    return new Tabs(element, options);
}

/**
 * Initialize all tabs in document
 */
function initAll(selector = '[data-tabs]', options = {}) {
    const elements = document.querySelectorAll(selector);
    const instances = [];
    
    elements.forEach(element => {
        instances.push(new Tabs(element, options));
    });
    
    return instances;
}

/**
 * Get tabs instance by ID
 */
function getById(id) {
    return state.instances.get(id);
}

/**
 * Get all tabs instances
 */
function getAll() {
    return Array.from(state.instances.values());
}

/**
 * Configure tabs
 */
function configure(options) {
    Object.assign(config.defaults, options);
    log('Configuration updated', config.defaults);
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
 * Get state (for testing/debugging)
 */
function getState() {
    return {
        initialized: state.initialized,
        totalInstances: state.instances.size,
    };
}

// Expose API to window
if (typeof window !== 'undefined') {
    window.Tabs = Tabs;
    window.TabsAPI = {
        Tabs,
        init,
        initAll,
        getById,
        getAll,
        configure,
        enableDebug,
        disableDebug,
        getState,
    };
}
