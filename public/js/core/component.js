/**
 * Base Component Class
 * 
 * Provides a foundation for building reusable, maintainable UI components with:
 * - Lifecycle management (init, mount, unmount, destroy)
 * - Event handling (on, off, emit)
 * - State management (setState, getState)
 * - Observer pattern for reactive updates
 * - Error boundary handling
 * - Performance monitoring hooks
 * 
 * @module Component
 * @example
 * class MyComponent extends Component {
 *   constructor(element, options) {
 *     super(element, options);
 *   }
 *   
 *   onInit() {
 *     // Setup logic
 *   }
 *   
 *   onMount() {
 *     // DOM is ready
 *   }
 * }
 */

/**
 * Generate unique component ID
 */
function generateId() {
    return `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Base Component Class
 */
class Component {
    /**
     * Create a component instance
     * @param {HTMLElement} element - DOM element for this component
     * @param {Object} options - Component configuration options
     */
    constructor(element, options = {}) {
        if (!element) {
            throw new Error('Component requires a DOM element');
        }
        
        // Core properties
        this.id = options.id || generateId();
        this.element = element;
        this.options = { ...this.constructor.defaultOptions, ...options };
        
        // State management
        this._state = {};
        this._observers = new Map();
        this._eventHandlers = new Map();
        
        // Lifecycle flags
        this._isInitialized = false;
        this._isMounted = false;
        this._isDestroyed = false;
        
        // Performance tracking
        this._performanceMarks = new Map();
        
        // Error handling
        this._errorHandler = options.onError || this._defaultErrorHandler.bind(this);
        
        // Store component reference on element
        element._component = this;
        
        // Auto-initialize if not deferred
        if (!options.deferInit) {
            this.init();
        }
    }
    
    /**
     * Default options (override in subclass)
     */
    static get defaultOptions() {
        return {
            debug: false,
            autoMount: true,
            trackPerformance: false,
        };
    }
    
    // ==================== LIFECYCLE METHODS ====================
    
    /**
     * Initialize component
     * Sets up state, binds methods, prepares for mounting
     */
    init() {
        if (this._isInitialized) {
            this._warn('Component already initialized');
            return this;
        }
        
        try {
            this._startPerformance('init');
            
            // Call lifecycle hook
            this.onInit();
            
            this._isInitialized = true;
            this._emit('init');
            
            // Auto-mount if enabled
            if (this.options.autoMount) {
                this.mount();
            }
            
            this._endPerformance('init');
            this._log('Component initialized');
            
        } catch (error) {
            this._handleError('init', error);
        }
        
        return this;
    }
    
    /**
     * Mount component to DOM
     * Component becomes active and interactive
     */
    mount() {
        if (this._isMounted) {
            this._warn('Component already mounted');
            return this;
        }
        
        if (!this._isInitialized) {
            this._warn('Component not initialized, initializing now');
            this.init();
        }
        
        try {
            this._startPerformance('mount');
            
            // Add mounted class
            this.element.classList.add('component-mounted');
            
            // Call lifecycle hook
            this.onMount();
            
            this._isMounted = true;
            this._emit('mount');
            
            this._endPerformance('mount');
            this._log('Component mounted');
            
        } catch (error) {
            this._handleError('mount', error);
        }
        
        return this;
    }
    
    /**
     * Unmount component from DOM
     * Component becomes inactive but not destroyed
     */
    unmount() {
        if (!this._isMounted) {
            this._warn('Component not mounted');
            return this;
        }
        
        try {
            this._startPerformance('unmount');
            
            // Call lifecycle hook
            this.onUnmount();
            
            // Remove mounted class
            this.element.classList.remove('component-mounted');
            
            this._isMounted = false;
            this._emit('unmount');
            
            this._endPerformance('unmount');
            this._log('Component unmounted');
            
        } catch (error) {
            this._handleError('unmount', error);
        }
        
        return this;
    }
    
    /**
     * Destroy component completely
     * Removes all listeners, observers, and references
     */
    destroy() {
        if (this._isDestroyed) {
            this._warn('Component already destroyed');
            return;
        }
        
        try {
            this._startPerformance('destroy');
            
            // Unmount first if still mounted
            if (this._isMounted) {
                this.unmount();
            }
            
            // Call lifecycle hook
            this.onDestroy();
            
            // Clean up event handlers
            this._eventHandlers.forEach((handlers, eventName) => {
                handlers.forEach(handler => {
                    this.element.removeEventListener(eventName, handler);
                });
            });
            this._eventHandlers.clear();
            
            // Clear observers
            this._observers.clear();
            
            // Remove component reference
            delete this.element._component;
            
            this._isDestroyed = true;
            this._emit('destroy');
            
            this._endPerformance('destroy');
            this._log('Component destroyed');
            
        } catch (error) {
            this._handleError('destroy', error);
        }
    }
    
    // ==================== LIFECYCLE HOOKS (override in subclass) ====================
    
    /**
     * Called during initialization
     * Override to add setup logic
     */
    onInit() {
        // Override in subclass
    }
    
    /**
     * Called when component is mounted
     * Override to add DOM interaction logic
     */
    onMount() {
        // Override in subclass
    }
    
    /**
     * Called when component is unmounted
     * Override to add cleanup logic
     */
    onUnmount() {
        // Override in subclass
    }
    
    /**
     * Called when component is destroyed
     * Override to add final cleanup logic
     */
    onDestroy() {
        // Override in subclass
    }
    
    // ==================== STATE MANAGEMENT ====================
    
    /**
     * Get current state (or specific key)
     * @param {string} key - Optional state key
     * @returns {*} State value or entire state object
     */
    getState(key) {
        return key ? this._state[key] : { ...this._state };
    }
    
    /**
     * Update state and notify observers
     * @param {Object|string} keyOrState - State key or entire state object
     * @param {*} value - Value (if using key)
     */
    setState(keyOrState, value) {
        const isObject = typeof keyOrState === 'object';
        const updates = isObject ? keyOrState : { [keyOrState]: value };
        
        const previousState = { ...this._state };
        
        // Update state
        Object.assign(this._state, updates);
        
        // Notify observers
        Object.keys(updates).forEach(key => {
            if (this._observers.has(key)) {
                this._observers.get(key).forEach(callback => {
                    try {
                        callback(this._state[key], previousState[key]);
                    } catch (error) {
                        this._handleError('observer', error);
                    }
                });
            }
        });
        
        // Emit state change event
        this._emit('statechange', {
            state: this._state,
            previousState,
            updates,
        });
        
        return this;
    }
    
    /**
     * Observe state changes
     * @param {string} key - State key to observe
     * @param {Function} callback - Callback when state changes
     * @returns {Function} Unsubscribe function
     */
    observe(key, callback) {
        if (!this._observers.has(key)) {
            this._observers.set(key, new Set());
        }
        
        this._observers.get(key).add(callback);
        
        // Return unsubscribe function
        return () => {
            if (this._observers.has(key)) {
                this._observers.get(key).delete(callback);
            }
        };
    }
    
    // ==================== EVENT HANDLING ====================
    
    /**
     * Add event listener
     * @param {string} eventName - Event name
     * @param {Function} handler - Event handler
     * @param {Object} options - addEventListener options
     */
    on(eventName, handler, options = {}) {
        if (!this._eventHandlers.has(eventName)) {
            this._eventHandlers.set(eventName, new Set());
        }
        
        this._eventHandlers.get(eventName).add(handler);
        this.element.addEventListener(eventName, handler, options);
        
        return this;
    }
    
    /**
     * Remove event listener
     * @param {string} eventName - Event name
     * @param {Function} handler - Event handler to remove
     */
    off(eventName, handler) {
        if (this._eventHandlers.has(eventName)) {
            this._eventHandlers.get(eventName).delete(handler);
            this.element.removeEventListener(eventName, handler);
        }
        
        return this;
    }
    
    /**
     * Emit custom event
     * @param {string} eventName - Event name
     * @param {*} detail - Event detail data
     */
    _emit(eventName, detail = {}) {
        const event = new CustomEvent(`component:${eventName}`, {
            detail: {
                componentId: this.id,
                component: this,
                ...detail,
            },
            bubbles: true,
            cancelable: true,
        });
        
        this.element.dispatchEvent(event);
        
        return event;
    }
    
    // ==================== UTILITY METHODS ====================
    
    /**
     * Query element(s) within component
     * @param {string} selector - CSS selector
     * @param {boolean} all - Return all matches
     * @returns {HTMLElement|NodeList} Element(s)
     */
    $(selector, all = false) {
        return all 
            ? this.element.querySelectorAll(selector)
            : this.element.querySelector(selector);
    }
    
    /**
     * Check if component is in specific state
     */
    get isInitialized() {
        return this._isInitialized;
    }
    
    get isMounted() {
        return this._isMounted;
    }
    
    get isDestroyed() {
        return this._isDestroyed;
    }
    
    // ==================== PERFORMANCE TRACKING ====================
    
    /**
     * Start performance measurement
     */
    _startPerformance(operation) {
        if (this.options.trackPerformance) {
            this._performanceMarks.set(operation, performance.now());
        }
    }
    
    /**
     * End performance measurement
     */
    _endPerformance(operation) {
        if (this.options.trackPerformance && this._performanceMarks.has(operation)) {
            const start = this._performanceMarks.get(operation);
            const duration = performance.now() - start;
            this._performanceMarks.delete(operation);
            
            this._log(`${operation} took ${duration.toFixed(2)}ms`);
            
            this._emit('performance', {
                operation,
                duration,
            });
        }
    }
    
    // ==================== ERROR HANDLING ====================
    
    /**
     * Handle component errors
     */
    _handleError(operation, error) {
        const errorEvent = this._emit('error', {
            operation,
            error,
            message: error.message,
            stack: error.stack,
        });
        
        if (!errorEvent.defaultPrevented) {
            this._errorHandler(error, operation);
        }
    }
    
    /**
     * Default error handler
     */
    _defaultErrorHandler(error, operation) {
        console.error(`[Component ${this.id}] Error in ${operation}:`, error);
    }
    
    // ==================== LOGGING ====================
    
    /**
     * Log message if debug enabled
     */
    _log(...args) {
        if (this.options.debug) {
            console.log(`[Component ${this.id}]`, ...args);
        }
    }
    
    /**
     * Log warning if debug enabled
     */
    _warn(...args) {
        if (this.options.debug) {
            console.warn(`[Component ${this.id}]`, ...args);
        }
    }
}

/**
 * Factory function to create component instances
 */
function createComponent(ComponentClass, element, options) {
    return new ComponentClass(element, options);
}

/**
 * Get component instance from element
 */
function getComponent(element) {
    return element._component;
}

/**
 * Check if element has component
 */
function hasComponent(element) {
    return !!element._component;
}

/**
 * Export Component API
 */
export default Component;

export {
    Component,
    createComponent,
    getComponent,
    hasComponent,
};
