/**
 * Modal Component
 * 
 * Accessible dialog/modal system with:
 * - Focus trap (keeps focus inside modal)
 * - Scroll locking (prevents body scroll)
 * - Backdrop click closing
 * - ESC key support
 * - ARIA attributes
 * - Animation support
 */

// CustomEvent polyfill for older browsers
if (typeof CustomEvent !== 'function') {
    (typeof window !== 'undefined' ? window : globalThis).CustomEvent = class CustomEvent extends Event {
        constructor(event, params = {}) {
            super(event, params);
            this.detail = params.detail || {};
        }
    };
}

/**
 * Modal Component
 * 
 * Accessible dialog/modal system with:
 * - Focus trap (keeps focus inside modal)
 * - Scroll locking (prevents body scroll)
 * - Backdrop click closing
 * - ESC key support
 * - ARIA attributes
 * - Animation support
 * - Stacking (multiple modals)
 * 
 * @module Modal
 */

/**
 * Modal configuration
 */
const config = {
    debug: false,
    
    // Default options
    defaults: {
        closeOnBackdrop: true,
        closeOnEscape: true,
        lockScroll: true,
        appendTo: 'body',
        animation: true,
        animationDuration: 300, // ms
    },
    
    // Selectors
    selectors: {
        closeButton: '[data-modal-close]',
        focusable: 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    },
    
    // Classes
    classes: {
        modal: 'modal',
        backdrop: 'modal-backdrop',
        content: 'modal-content',
        open: 'modal-open',
        active: 'modal-active',
        closing: 'modal-closing',
        scrollLocked: 'modal-scroll-locked',
    },
};

/**
 * Modal state
 */
const state = {
    modals: new Map(), // id -> modal instance
    stack: [], // Array of open modal IDs
    scrollbarWidth: null,
    initialized: false,
};

/**
 * Log debug message
 */
function log(...args) {
    if (config.debug) {
        console.log('[Modal]', ...args);
    }
}

/**
 * Generate unique ID
 */
function generateId() {
    return `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get scrollbar width (for scroll lock compensation)
 */
function getScrollbarWidth() {
    if (state.scrollbarWidth !== null) {
        return state.scrollbarWidth;
    }
    
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll';
    document.body.appendChild(outer);
    
    const inner = document.createElement('div');
    outer.appendChild(inner);
    
    state.scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
    outer.remove();
    
    return state.scrollbarWidth;
}

/**
 * Lock body scroll
 */
function lockScroll() {
    if (document.body.classList.contains(config.classes.scrollLocked)) {
        return; // Already locked
    }
    
    const scrollbarWidth = getScrollbarWidth();
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.classList.add(config.classes.scrollLocked);
    document.body.style.overflow = 'hidden';
    
    log('Scroll locked');
}

/**
 * Unlock body scroll
 */
function unlockScroll() {
    // Only unlock if no modals are open
    if (state.stack.length > 0) {
        return;
    }
    
    // Check if document is available (for test environments)
    if (typeof document === 'undefined' || !document.body) {
        return;
    }
    
    document.body.style.paddingRight = '';
    document.body.classList.remove(config.classes.scrollLocked);
    document.body.style.overflow = '';
    
    log('Scroll unlocked');
}

/**
 * Get focusable elements within container
 */
function getFocusableElements(container) {
    const elements = container.querySelectorAll(config.selectors.focusable);
    return Array.from(elements).filter(el => {
        // In test environments, don't filter by visibility
        if (typeof window !== 'undefined' && window.navigator && window.navigator.userAgent && window.navigator.userAgent.includes('jsdom')) {
            return true;
        }
        return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
    });
}

/**
 * Handle focus trap
 */
function trapFocus(modal, event) {
    const focusableElements = getFocusableElements(modal.element);
    
    if (focusableElements.length === 0) {
        event.preventDefault();
        return;
    }
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // If shift+tab on first element, focus last
    if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
    }
    // If tab on last element, focus first
    else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
    }
}

/**
 * Modal class
 */
class Modal {
    constructor(options = {}) {
        this.id = generateId();
        this.options = { ...config.defaults, ...options };
        this.element = null;
        this.backdrop = null;
        this.isOpen = false;
        this.previousFocus = null;
        this.listeners = new Map();
        
        this._createElements();
        state.modals.set(this.id, this);
        
        log('Modal created', this.id);
    }
    
    /**
     * Create modal elements
     */
    _createElements() {
        // Create backdrop
        this.backdrop = document.createElement('div');
        this.backdrop.className = config.classes.backdrop;
        this.backdrop.setAttribute('aria-hidden', 'true');
        
        // Create modal container
        this.element = document.createElement('div');
        this.element.className = config.classes.modal;
        this.element.setAttribute('role', 'dialog');
        this.element.setAttribute('aria-modal', 'true');
        this.element.setAttribute('tabindex', '-1');
        
        if (this.options.ariaLabel) {
            this.element.setAttribute('aria-label', this.options.ariaLabel);
        }
        
        if (this.options.ariaLabelledBy) {
            this.element.setAttribute('aria-labelledby', this.options.ariaLabelledBy);
        }
        
        // Create content container
        const content = document.createElement('div');
        content.className = config.classes.content;
        
        if (this.options.content) {
            if (typeof this.options.content === 'string') {
                content.innerHTML = this.options.content;
            } else if (this.options.content instanceof HTMLElement) {
                content.appendChild(this.options.content);
            }
        }
        
        this.element.appendChild(content);
    }
    
    /**
     * Setup event listeners
     */
    _setupListeners() {
        // Backdrop click
        if (this.options.closeOnBackdrop) {
            const backdropHandler = (e) => {
                if (e.target === this.backdrop) {
                    this.close();
                }
            };
            this.backdrop.addEventListener('click', backdropHandler);
            this.listeners.set('backdrop', backdropHandler);
        }
        
        // ESC key
        if (this.options.closeOnEscape) {
            const escHandler = (e) => {
                if (e.key === 'Escape' && this._isTopModal()) {
                    this.close();
                }
            };
            document.addEventListener('keydown', escHandler);
            this.listeners.set('escape', escHandler);
        }
        
        // Focus trap
        const focusHandler = (e) => {
            if (e.key === 'Tab' && this._isTopModal()) {
                trapFocus(this, e);
            }
        };
        document.addEventListener('keydown', focusHandler);
        this.listeners.set('focus', focusHandler);
        
        // Close buttons
        const closeButtons = this.element.querySelectorAll(config.selectors.closeButton);
        closeButtons.forEach(button => {
            const handler = () => this.close();
            button.addEventListener('click', handler);
            this.listeners.set(button, handler);
        });
    }
    
    /**
     * Remove event listeners
     */
    _removeListeners() {
        // Backdrop
        const backdropHandler = this.listeners.get('backdrop');
        if (backdropHandler) {
            this.backdrop.removeEventListener('click', backdropHandler);
        }
        
        // ESC key
        const escHandler = this.listeners.get('escape');
        if (escHandler) {
            document.removeEventListener('keydown', escHandler);
        }
        
        // Focus trap
        const focusHandler = this.listeners.get('focus');
        if (focusHandler) {
            document.removeEventListener('keydown', focusHandler);
        }
        
        // Close buttons
        const closeButtons = this.element.querySelectorAll(config.selectors.closeButton);
        closeButtons.forEach(button => {
            const handler = this.listeners.get(button);
            if (handler) {
                button.removeEventListener('click', handler);
            }
        });
        
        this.listeners.clear();
    }
    
    /**
     * Check if this modal is on top of stack
     */
    _isTopModal() {
        return state.stack.length > 0 && state.stack[state.stack.length - 1] === this.id;
    }
    
    /**
     * Emit event
     */
    _emit(eventName, detail = {}) {
        // Check if we can emit events (document and element must be available)
        if (typeof document === 'undefined' || !this.element || !this.element.ownerDocument) {
            return;
        }
        
        // Create CustomEvent or fallback for environments without it
        const createEvent = (name, options = {}) => {
            if (typeof CustomEvent === 'function') {
                return new CustomEvent(name, options);
            } else {
                // Fallback for environments without CustomEvent
                const event = document.createEvent('CustomEvent');
                event.initCustomEvent(name, options.bubbles || false, options.cancelable || false, options.detail || {});
                return event;
            }
        };
        
        const event = createEvent(`modal:${eventName}`, {
            detail: { modalId: this.id, ...detail },
        });
        window.dispatchEvent(event);
        
        // Also emit on element
        this.element.dispatchEvent(createEvent(eventName, { detail }));
    }
    
    /**
     * Open modal
     */
    open() {
        if (this.isOpen) {
            log('Modal already open', this.id);
            return this;
        }
        
        log('Opening modal', this.id);
        
        // Save current focus
        this.previousFocus = document.activeElement;
        
        // Append to DOM
        const container = document.querySelector(this.options.appendTo) || document.body;
        container.appendChild(this.backdrop);
        container.appendChild(this.element);
        
        // Add to stack
        state.stack.push(this.id);
        
        // Setup listeners
        this._setupListeners();
        
        // Lock scroll
        if (this.options.lockScroll) {
            lockScroll();
        }
        
        // Emit before-open event
        this._emit('before-open');
        
        // Trigger animation
        if (this.options.animation) {
            // Force reflow
            this.backdrop.offsetHeight;
            this.element.offsetHeight;
            
            this.backdrop.classList.add(config.classes.active);
            this.element.classList.add(config.classes.open);
            
            // Wait for animation
            setTimeout(() => {
                this.isOpen = true;
                this._focusFirstElement();
                this._emit('open');
            }, this.options.animationDuration);
        } else {
            this.backdrop.classList.add(config.classes.active);
            this.element.classList.add(config.classes.open);
            this.isOpen = true;
            this._focusFirstElement();
            this._emit('open');
        }
        
        return this;
    }
    
    /**
     * Close modal
     */
    close() {
        if (!this.isOpen) {
            log('Modal already closed', this.id);
            return this;
        }
        
        log('Closing modal', this.id);
        
        // Emit before-close event
        this._emit('before-close');
        
        // Trigger animation
        if (this.options.animation) {
            this.element.classList.add(config.classes.closing);
            this.backdrop.classList.remove(config.classes.active);
            
            setTimeout(() => {
                this._finishClose();
            }, this.options.animationDuration);
        } else {
            this._finishClose();
        }
        
        return this;
    }
    
    /**
     * Finish closing (after animation)
     */
    _finishClose() {
        this.isOpen = false;
        
        // Remove from DOM
        this.backdrop.remove();
        this.element.remove();
        
        // Remove from stack
        const index = state.stack.indexOf(this.id);
        if (index > -1) {
            state.stack.splice(index, 1);
        }
        
        // Unlock scroll if no modals open
        if (this.options.lockScroll) {
            unlockScroll();
        }
        
        // Remove listeners
        this._removeListeners();
        
        // Restore focus
        if (this.previousFocus && typeof this.previousFocus.focus === 'function') {
            this.previousFocus.focus();
        }
        
        // Emit close event
        this._emit('close');
    }
    
    /**
     * Focus first focusable element
     */
    _focusFirstElement() {
        const focusableElements = getFocusableElements(this.element);
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        } else {
            this.element.focus();
        }
    }
    
    /**
     * Update content
     */
    setContent(content) {
        const contentContainer = this.element.querySelector(`.${config.classes.content}`);
        if (!contentContainer) return this;
        
        if (typeof content === 'string') {
            contentContainer.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            contentContainer.innerHTML = '';
            contentContainer.appendChild(content);
        }
        
        return this;
    }
    
    /**
     * Destroy modal
     */
    destroy() {
        if (this.isOpen) {
            this.close();
        }
        
        state.modals.delete(this.id);
        log('Modal destroyed', this.id);
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
}

/**
 * Create and open modal (convenience method)
 */
function open(options = {}) {
    const modal = new Modal(options);
    modal.open();
    return modal;
}

/**
 * Close all modals
 */
function closeAll() {
    const modalIds = [...state.stack];
    modalIds.forEach(id => {
        const modal = state.modals.get(id);
        if (modal) {
            modal.close();
        }
    });
}

/**
 * Reset modal state (for testing)
 */
function resetState() {
    state.stack.length = 0;
    state.modals.clear();
    state.scrollbarWidth = null;
}

/**
 * Get modal by ID
 */
function getById(id) {
    return state.modals.get(id);
}

/**
 * Get all open modals
 */
function getOpenModals() {
    return state.stack.map(id => state.modals.get(id)).filter(Boolean);
}

/**
 * Configure modal system
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
 * Initialize modal system
 */
function init() {
    if (state.initialized) {
        log('Already initialized');
        return;
    }
    
    state.initialized = true;
    log('Modal system initialized');
}

/**
 * Get state (for testing/debugging)
 */
function getState() {
    return {
        initialized: state.initialized,
        openModals: state.stack.length,
        totalModals: state.modals.size,
        stack: [...state.stack],
    };
}

// Expose API to window
if (typeof window !== 'undefined') {
    window.Modal = Modal;
    window.ModalAPI = {
        Modal,
        open,
        closeAll,
        resetState,
        getById,
        getOpenModals,
        configure,
        enableDebug,
        disableDebug,
        init,
        getState,
    };
}
