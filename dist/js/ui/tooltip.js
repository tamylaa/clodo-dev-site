/**
 * Tooltip Component
 * 
 * Smart tooltip system with:
 * - Viewport-aware positioning
 * - Multiple placement options
 * - Delay handling (show/hide)
 * - ARIA labeling
 * - Touch device support
 * - HTML content support
 * - Trigger on hover/focus/click
 * 
 * @module Tooltip
 */

/**
 * Tooltip configuration
 */
const config = {
    debug: false,
    
    // Default options
    defaults: {
        placement: 'top', // 'top', 'bottom', 'left', 'right', 'auto'
        trigger: 'hover', // 'hover', 'focus', 'click', 'manual'
        showDelay: 200, // ms
        hideDelay: 100, // ms
        offset: 8, // px from trigger element
        arrow: true,
        html: false, // Allow HTML content
        container: 'body', // Where to append tooltip
        boundary: 'viewport', // Stay within boundary
    },
    
    // Classes
    classes: {
        tooltip: 'tooltip',
        arrow: 'tooltip-arrow',
        content: 'tooltip-content',
        show: 'tooltip-show',
        hide: 'tooltip-hide',
    },
};

/**
 * Tooltip state
 */
const state = {
    tooltips: new Map(), // element -> tooltip instance
    showTimers: new Map(),
    hideTimers: new Map(),
    activeTooltip: null,
    initialized: false,
};

/**
 * Log debug message
 */
function log(...args) {
    if (config.debug) {
        console.log('[Tooltip]', ...args);
    }
}

/**
 * Generate unique ID
 */
function generateId() {
    return `tooltip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get element position
 */
function getElementRect(element) {
    return element.getBoundingClientRect();
}

/**
 * Get viewport dimensions
 */
function getViewport() {
    return {
        width: window.innerWidth || document.documentElement.clientWidth,
        height: window.innerHeight || document.documentElement.clientHeight,
    };
}

/**
 * Calculate tooltip position
 */
function calculatePosition(triggerRect, tooltipRect, placement, offset) {
    const viewport = getViewport();
    const positions = {
        top: {
            x: triggerRect.left + (triggerRect.width - tooltipRect.width) / 2,
            y: triggerRect.top - tooltipRect.height - offset,
        },
        bottom: {
            x: triggerRect.left + (triggerRect.width - tooltipRect.width) / 2,
            y: triggerRect.bottom + offset,
        },
        left: {
            x: triggerRect.left - tooltipRect.width - offset,
            y: triggerRect.top + (triggerRect.height - tooltipRect.height) / 2,
        },
        right: {
            x: triggerRect.right + offset,
            y: triggerRect.top + (triggerRect.height - tooltipRect.height) / 2,
        },
    };
    
    // Auto placement - find best position
    if (placement === 'auto') {
        const fits = {
            top: positions.top.y >= 0,
            bottom: positions.bottom.y + tooltipRect.height <= viewport.height,
            left: positions.left.x >= 0,
            right: positions.right.x + tooltipRect.width <= viewport.width,
        };
        
        // Prefer top, then bottom, then right, then left
        if (fits.top) placement = 'top';
        else if (fits.bottom) placement = 'bottom';
        else if (fits.right) placement = 'right';
        else placement = 'left';
    }
    
    const pos = positions[placement];
    
    // Keep within viewport
    if (pos.x < 0) pos.x = 4;
    if (pos.x + tooltipRect.width > viewport.width) {
        pos.x = viewport.width - tooltipRect.width - 4;
    }
    if (pos.y < 0) pos.y = 4;
    if (pos.y + tooltipRect.height > viewport.height) {
        pos.y = viewport.height - tooltipRect.height - 4;
    }
    
    return { x: pos.x, y: pos.y, placement };
}

/**
 * Tooltip class
 */
class Tooltip {
    constructor(element, options = {}) {
        if (!element) {
            throw new Error('Tooltip requires an element');
        }
        
        this.id = generateId();
        this.element = element;
        this.options = { ...config.defaults, ...options };
        this.tooltip = null;
        this.isVisible = false;
        this.listeners = new Map();
        
        // Get content
        this.content = this.options.content || element.getAttribute('title') || 
                      element.getAttribute('data-tooltip');
        
        if (!this.content) {
            throw new Error('Tooltip requires content');
        }
        
        // Remove title to prevent native tooltip
        if (element.hasAttribute('title')) {
            element.removeAttribute('title');
        }
        
        this._createTooltip();
        this._setupListeners();
        state.tooltips.set(element, this);
        
        log('Tooltip created', this.id);
    }
    
    /**
     * Create tooltip element
     */
    _createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = config.classes.tooltip;
        this.tooltip.setAttribute('role', 'tooltip');
        this.tooltip.id = this.id;
        
        // Set ARIA relationship
        this.element.setAttribute('aria-describedby', this.id);
        
        // Content
        const content = document.createElement('div');
        content.className = config.classes.content;
        
        if (this.options.html) {
            content.innerHTML = this.content;
        } else {
            content.textContent = this.content;
        }
        
        this.tooltip.appendChild(content);
        
        // Arrow
        if (this.options.arrow) {
            const arrow = document.createElement('div');
            arrow.className = config.classes.arrow;
            this.tooltip.appendChild(arrow);
        }
        
        // Initially hidden
        this.tooltip.style.position = 'absolute';
        this.tooltip.style.display = 'none';
        this.tooltip.style.zIndex = '9999';
    }
    
    /**
     * Setup event listeners
     */
    _setupListeners() {
        const { trigger } = this.options;
        
        if (trigger === 'hover') {
            const showHandler = () => this._scheduleShow();
            const hideHandler = () => this._scheduleHide();
            
            this.element.addEventListener('mouseenter', showHandler);
            this.element.addEventListener('mouseleave', hideHandler);
            this.element.addEventListener('focus', showHandler);
            this.element.addEventListener('blur', hideHandler);
            
            this.listeners.set('mouseenter', showHandler);
            this.listeners.set('mouseleave', hideHandler);
            this.listeners.set('focus', showHandler);
            this.listeners.set('blur', hideHandler);
        } else if (trigger === 'focus') {
            const showHandler = () => this._scheduleShow();
            const hideHandler = () => this._scheduleHide();
            
            this.element.addEventListener('focus', showHandler);
            this.element.addEventListener('blur', hideHandler);
            
            this.listeners.set('focus', showHandler);
            this.listeners.set('blur', hideHandler);
        } else if (trigger === 'click') {
            const toggleHandler = (e) => {
                e.preventDefault();
                this.toggle();
            };
            
            this.element.addEventListener('click', toggleHandler);
            this.listeners.set('click', toggleHandler);
        }
        
        // Touch support
        if ('ontouchstart' in window) {
            const touchHandler = (_e) => {
                if (this.isVisible) {
                    this.hide();
                } else {
                    this.show();
                }
            };
            
            this.element.addEventListener('touchstart', touchHandler);
            this.listeners.set('touchstart', touchHandler);
        }
    }
    
    /**
     * Remove event listeners
     */
    _removeListeners() {
        this.listeners.forEach((handler, event) => {
            this.element.removeEventListener(event, handler);
        });
        this.listeners.clear();
    }
    
    /**
     * Schedule show with delay
     */
    _scheduleShow() {
        // Clear any hide timer
        const hideTimer = state.hideTimers.get(this);
        if (hideTimer) {
            clearTimeout(hideTimer);
            state.hideTimers.delete(this);
        }
        
        // Schedule show
        const showTimer = setTimeout(() => {
            this.show();
            state.showTimers.delete(this);
        }, this.options.showDelay);
        
        state.showTimers.set(this, showTimer);
    }
    
    /**
     * Schedule hide with delay
     */
    _scheduleHide() {
        // Clear any show timer
        const showTimer = state.showTimers.get(this);
        if (showTimer) {
            clearTimeout(showTimer);
            state.showTimers.delete(this);
        }
        
        // Schedule hide
        const hideTimer = setTimeout(() => {
            this.hide();
            state.hideTimers.delete(this);
        }, this.options.hideDelay);
        
        state.hideTimers.set(this, hideTimer);
    }
    
    /**
     * Position tooltip
     */
    _position() {
        if (!this.tooltip || !this.isVisible) return;
        
        const triggerRect = getElementRect(this.element);
        const tooltipRect = getElementRect(this.tooltip);
        
        const { x, y, placement } = calculatePosition(
            triggerRect,
            tooltipRect,
            this.options.placement,
            this.options.offset
        );
        
        this.tooltip.style.left = `${x}px`;
        this.tooltip.style.top = `${y}px`;
        
        // Update placement class for arrow positioning
        this.tooltip.setAttribute('data-placement', placement);
    }
    
    /**
     * Show tooltip
     */
    show() {
        if (this.isVisible) return this;
        
        log('Showing tooltip', this.id);
        
        // Hide other tooltips
        if (state.activeTooltip && state.activeTooltip !== this) {
            state.activeTooltip.hide();
        }
        
        // Append to container
        const container = document.querySelector(this.options.container) || document.body;
        container.appendChild(this.tooltip);
        
        // Show tooltip
        this.tooltip.style.display = 'block';
        
        // Position (need to wait for display to get dimensions)
        requestAnimationFrame(() => {
            this._position();
            this.tooltip.classList.add(config.classes.show);
        });
        
        this.isVisible = true;
        state.activeTooltip = this;
        
        // Emit event
        this._emit('show');
        
        return this;
    }
    
    /**
     * Hide tooltip
     */
    hide() {
        if (!this.isVisible) return this;
        
        log('Hiding tooltip', this.id);
        
        this.tooltip.classList.remove(config.classes.show);
        this.tooltip.classList.add(config.classes.hide);
        
        // Remove after animation
        setTimeout(() => {
            if (this.tooltip.parentNode) {
                this.tooltip.parentNode.removeChild(this.tooltip);
            }
            this.tooltip.classList.remove(config.classes.hide);
            this.tooltip.style.display = 'none';
        }, 200);
        
        this.isVisible = false;
        
        if (state.activeTooltip === this) {
            state.activeTooltip = null;
        }
        
        // Emit event
        this._emit('hide');
        
        return this;
    }
    
    /**
     * Toggle tooltip
     */
    toggle() {
        return this.isVisible ? this.hide() : this.show();
    }
    
    /**
     * Update content
     */
    setContent(content) {
        this.content = content;
        
        const contentEl = this.tooltip.querySelector(`.${config.classes.content}`);
        if (contentEl) {
            if (this.options.html) {
                contentEl.innerHTML = content;
            } else {
                contentEl.textContent = content;
            }
        }
        
        // Reposition if visible
        if (this.isVisible) {
            this._position();
        }
        
        return this;
    }
    
    /**
     * Update options
     */
    setOptions(options) {
        Object.assign(this.options, options);
        return this;
    }
    
    /**
     * Emit event
     */
    _emit(eventName, detail = {}) {
        const event = new CustomEvent(`tooltip:${eventName}`, {
            detail: { tooltipId: this.id, element: this.element, ...detail },
        });
        window.dispatchEvent(event);
    }
    
    /**
     * Destroy tooltip
     */
    destroy() {
        // Hide first
        if (this.isVisible) {
            this.hide();
        }
        
        // Clear timers
        const showTimer = state.showTimers.get(this);
        const hideTimer = state.hideTimers.get(this);
        if (showTimer) clearTimeout(showTimer);
        if (hideTimer) clearTimeout(hideTimer);
        
        // Remove listeners
        this._removeListeners();
        
        // Remove from DOM
        if (this.tooltip && this.tooltip.parentNode) {
            this.tooltip.parentNode.removeChild(this.tooltip);
        }
        
        // Remove ARIA
        this.element.removeAttribute('aria-describedby');
        
        // Remove from state
        state.tooltips.delete(this.element);
        
        log('Tooltip destroyed', this.id);
    }
}

/**
 * Initialize tooltip on element
 */
function init(element, options = {}) {
    if (!element) {
        throw new Error('Tooltip.init requires an element');
    }
    
    // Return existing tooltip if already initialized
    if (state.tooltips.has(element)) {
        return state.tooltips.get(element);
    }
    
    return new Tooltip(element, options);
}

/**
 * Initialize all tooltips in document
 */
function initAll(selector = '[data-tooltip], [title]', options = {}) {
    const elements = document.querySelectorAll(selector);
    const instances = [];
    
    elements.forEach(element => {
        // Skip if already initialized
        if (!state.tooltips.has(element)) {
            try {
                instances.push(new Tooltip(element, options));
            } catch (error) {
                log('Failed to initialize tooltip', element, error);
            }
        }
    });
    
    return instances;
}

/**
 * Get tooltip instance for element
 */
function getInstance(element) {
    return state.tooltips.get(element);
}

/**
 * Destroy tooltip on element
 */
function destroy(element) {
    const tooltip = state.tooltips.get(element);
    if (tooltip) {
        tooltip.destroy();
    }
}

/**
 * Destroy all tooltips
 */
function destroyAll() {
    state.tooltips.forEach(tooltip => tooltip.destroy());
}

/**
 * Hide all tooltips
 */
function hideAll() {
    state.tooltips.forEach(tooltip => tooltip.hide());
}

/**
 * Configure tooltips
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
        totalTooltips: state.tooltips.size,
        activeTooltip: state.activeTooltip ? state.activeTooltip.id : null,
    };
}

// Expose API to window
if (typeof window !== 'undefined') {
    window.Tooltip = Tooltip;
    window.TooltipAPI = {
        Tooltip,
        init,
        initAll,
        getInstance,
        destroy,
        destroyAll,
        hideAll,
        configure,
        enableDebug,
        disableDebug,
        getState,
    };
}

