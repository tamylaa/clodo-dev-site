/**
 * Event Bus
 * 
 * Lightweight pub/sub event system for decoupled module communication.
 * Enables modules to communicate without direct dependencies.
 * 
 * Features:
 * - Subscribe/unsubscribe to events
 * - Wildcard event matching
 * - One-time event listeners
 * - Event history/replay
 * - Priority-based handlers
 * - Async event handling
 * 
 * @module EventBus
 */

/**
 * Event Bus configuration
 */
const config = {
    debug: false,
    maxHistory: 100, // Maximum events to keep in history
    enableHistory: true,
    wildcardChar: '*',
};

/**
 * Event Bus state
 */
const state = {
    listeners: new Map(), // event name -> array of handlers
    history: [], // recent events for replay
    eventCount: 0,
};

/**
 * Handler wrapper with metadata
 */
class EventHandler {
    constructor(callback, options = {}) {
        this.id = `handler_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.callback = callback;
        this.priority = options.priority || 0;
        this.once = options.once || false;
        this.context = options.context || null;
        this.executed = false;
    }
    
    async execute(eventName, data) {
        if (this.once && this.executed) return;
        
        try {
            const result = this.context
                ? await this.callback.call(this.context, data, eventName)
                : await this.callback(data, eventName);
            
            this.executed = true;
            return result;
        } catch (error) {
            console.error(`[EventBus] Error in handler for "${eventName}":`, error);
            throw error;
        }
    }
}

/**
 * Log debug message
 */
function log(...args) {
    if (config.debug) {
        console.log('[EventBus]', ...args);
    }
}

/**
 * Check if event name matches pattern (supports wildcards)
 */
function matchesPattern(eventName, pattern) {
    if (pattern === config.wildcardChar) return true;
    if (eventName === pattern) return true;
    
    // Convert pattern to regex
    // "user:*" matches "user:login", "user:logout", etc.
    // "user:*:success" matches "user:login:success", "user:register:success", etc.
    const regexPattern = pattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
        .replace(/\*/g, '[^:]+'); // Replace * with pattern
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(eventName);
}

/**
 * Get all handlers for an event (including wildcard matches)
 */
function getHandlers(eventName) {
    const handlers = [];
    
    for (const [pattern, patternHandlers] of state.listeners) {
        if (matchesPattern(eventName, pattern)) {
            handlers.push(...patternHandlers);
        }
    }
    
    // Sort by priority (higher first)
    return handlers.sort((a, b) => b.priority - a.priority);
}

/**
 * Subscribe to event
 */
function on(eventName, callback, options = {}) {
    if (typeof callback !== 'function') {
        throw new TypeError('Callback must be a function');
    }
    
    const handler = new EventHandler(callback, options);
    
    if (!state.listeners.has(eventName)) {
        state.listeners.set(eventName, []);
    }
    
    state.listeners.get(eventName).push(handler);
    
    log(`Subscribed to "${eventName}" (priority: ${handler.priority})`);
    
    // Return unsubscribe function
    return () => off(eventName, handler.id);
}

/**
 * Subscribe to event (one time only)
 */
function once(eventName, callback, options = {}) {
    return on(eventName, callback, { ...options, once: true });
}

/**
 * Unsubscribe from event
 */
function off(eventName, handlerOrId) {
    if (!state.listeners.has(eventName)) return false;
    
    const handlers = state.listeners.get(eventName);
    const id = typeof handlerOrId === 'string' ? handlerOrId : handlerOrId.id;
    
    const index = handlers.findIndex(h => h.id === id);
    if (index !== -1) {
        handlers.splice(index, 1);
        log(`Unsubscribed from "${eventName}"`);
        
        // Clean up empty listener arrays
        if (handlers.length === 0) {
            state.listeners.delete(eventName);
        }
        
        return true;
    }
    
    return false;
}

/**
 * Unsubscribe all handlers for an event
 */
function offAll(eventName) {
    if (eventName) {
        // Remove specific event
        const hadListeners = state.listeners.has(eventName);
        state.listeners.delete(eventName);
        log(`Removed all listeners for "${eventName}"`);
        return hadListeners;
    } else {
        // Remove all events
        const count = state.listeners.size;
        state.listeners.clear();
        log(`Removed all listeners (${count} events)`);
        return count > 0;
    }
}

/**
 * Emit event
 */
async function emit(eventName, data = null) {
    state.eventCount++;
    
    log(`Emit "${eventName}"`, data);
    
    // Add to history
    if (config.enableHistory) {
        state.history.push({
            name: eventName,
            data,
            timestamp: Date.now(),
        });
        
        // Trim history if needed
        if (state.history.length > config.maxHistory) {
            state.history.shift();
        }
    }
    
    // Get handlers (including wildcard matches)
    const handlers = getHandlers(eventName);
    
    if (handlers.length === 0) {
        log(`No handlers for "${eventName}"`);
        return 0;
    }
    
    log(`Executing ${handlers.length} handler(s) for "${eventName}"`);
    
    // Execute handlers
    const results = [];
    for (const handler of handlers) {
        try {
            const result = await handler.execute(eventName, data);
            results.push(result);
            
            // Remove one-time handlers
            if (handler.once) {
                for (const [pattern, patternHandlers] of state.listeners) {
                    const index = patternHandlers.findIndex(h => h.id === handler.id);
                    if (index !== -1) {
                        patternHandlers.splice(index, 1);
                        if (patternHandlers.length === 0) {
                            state.listeners.delete(pattern);
                        }
                        break;
                    }
                }
            }
        } catch (error) {
            // Error already logged in handler.execute
            results.push({ error });
        }
    }
    
    return results.length;
}

/**
 * Emit event synchronously (fire and forget)
 */
function emitSync(eventName, data = null) {
    // Use setTimeout to make it asynchronous
    setTimeout(() => {
        emit(eventName, data).catch(error => {
            console.error(`[EventBus] Unhandled error in emitSync for "${eventName}":`, error);
        });
    }, 0);
}

/**
 * Check if event has listeners
 */
function hasListeners(eventName) {
    const handlers = getHandlers(eventName);
    return handlers.length > 0;
}

/**
 * Get listener count for event
 */
function listenerCount(eventName) {
    const handlers = getHandlers(eventName);
    return handlers.length;
}

/**
 * Get all registered event names
 */
function getEventNames() {
    return Array.from(state.listeners.keys());
}

/**
 * Get event history
 */
function getHistory(eventName = null, limit = null) {
    let history = state.history;
    
    // Filter by event name
    if (eventName) {
        history = history.filter(event => matchesPattern(event.name, eventName));
    }
    
    // Apply limit
    if (limit && limit > 0) {
        history = history.slice(-limit);
    }
    
    return history;
}

/**
 * Clear event history
 */
function clearHistory() {
    const count = state.history.length;
    state.history = [];
    log(`Cleared history (${count} events)`);
    return count;
}

/**
 * Replay events from history
 */
async function replay(eventName = null, limit = null) {
    const events = getHistory(eventName, limit);
    
    log(`Replaying ${events.length} event(s)`);
    
    for (const event of events) {
        await emit(event.name, event.data);
    }
    
    return events.length;
}

/**
 * Get statistics
 */
function getStats() {
    return {
        totalEvents: state.eventCount,
        activeListeners: state.listeners.size,
        historySize: state.history.length,
        eventNames: getEventNames(),
    };
}

/**
 * Reset event bus (for testing)
 */
function reset() {
    state.listeners.clear();
    state.history = [];
    state.eventCount = 0;
    log('Event bus reset');
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
 * Configure event bus
 */
function configure(options) {
    Object.assign(config, options);
    log('Configuration updated', config);
}

/**
 * Initialize event bus
 */
function init(options = {}) {
    log('Initializing...');
    configure(options);
    log('Initialized ✓');
}

/**
 * Destroy event bus
 */
function destroy() {
    log('Destroying...');
    reset();
    log('Destroyed ✓');
}

// Expose to window
if (typeof window !== 'undefined') {
    window.EventBus = {
        init,
        destroy,
        on,
        once,
        off,
        offAll,
        emit,
        emitSync,
        hasListeners,
        listenerCount,
        getEventNames,
        getHistory,
        clearHistory,
        replay,
        getStats,
        reset,
        enableDebug,
        disableDebug,
        configure,
    };
}
// Named exports for testing
export {
    init,
    destroy,
    on,
    once,
    off,
    offAll,
    emit,
    emitSync,
    hasListeners,
    listenerCount,
    getEventNames,
    getHistory,
    clearHistory,
    replay,
    getStats,
    reset,
    enableDebug,
    disableDebug,
    configure,
};
