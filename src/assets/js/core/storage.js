/**
 * Storage Wrapper
 * 
 * Enhanced wrapper for localStorage and sessionStorage with:
 * - Automatic JSON serialization/deserialization
 * - TTL (time-to-live) support
 * - Namespace/prefix support
 * - Type safety
 * - Error handling
 * - Storage quota management
 * - Event notifications
 * 
 * @module Storage
 */

/**
 * Storage types
 */
const StorageType = {
    LOCAL: 'local',
    SESSION: 'session',
    MEMORY: 'memory', // Fallback when storage unavailable
};

/**
 * Storage configuration
 */
const config = {
    debug: false,
    prefix: 'site_', // Namespace all keys
    defaultTTL: null, // No expiry by default (ms)
    enableEvents: true,
};

/**
 * In-memory storage fallback
 */
const memoryStorage = new Map();

/**
 * Get native storage object
 */
function getNativeStorage(type) {
    switch (type) {
        case StorageType.LOCAL:
            return window.localStorage;
        case StorageType.SESSION:
            return window.sessionStorage;
        case StorageType.MEMORY:
            return null; // Use Map
        default:
            throw new Error(`Invalid storage type: ${type}`);
    }
}

/**
 * Check if storage is available
 */
function isStorageAvailable(type) {
    try {
        const storage = getNativeStorage(type);
        if (!storage) return type === StorageType.MEMORY;
        
        const testKey = '__storage_test__';
        storage.setItem(testKey, 'test');
        storage.removeItem(testKey);
        return true;
    } catch {
        return false;
    }
}

/**
 * Get prefixed key
 */
function getPrefixedKey(key) {
    return `${config.prefix}${key}`;
}

/**
 * Strip prefix from key
 */
function stripPrefix(key) {
    return key.startsWith(config.prefix) ? key.slice(config.prefix.length) : key;
}

/**
 * Log debug message
 */
function log(...args) {
    if (config.debug) {
        console.log('[Storage]', ...args);
    }
}

/**
 * Emit storage event
 */
function emitEvent(eventName, detail) {
    if (!config.enableEvents) return;
    
    window.dispatchEvent(new CustomEvent(`storage:${eventName}`, {
        detail: {
            ...detail,
            timestamp: Date.now(),
        },
    }));
}

/**
 * Create storage item with metadata
 */
function createStorageItem(value, ttl = null) {
    const expiryTime = ttl ? Date.now() + ttl : null;
    
    return {
        value,
        created: Date.now(),
        expires: expiryTime,
        version: 1,
    };
}

/**
 * Check if storage item is expired
 */
function isExpired(item) {
    if (!item.expires) return false;
    return Date.now() > item.expires;
}

/**
 * Storage class
 */
class Storage {
    constructor(type = StorageType.LOCAL) {
        this.type = type;
        this.storage = getNativeStorage(type);
        this.available = isStorageAvailable(type);
        
        if (!this.available && type !== StorageType.MEMORY) {
            log(`${type} storage not available, falling back to memory storage`);
            this.type = StorageType.MEMORY;
        }
        
        log(`Initialized ${this.type} storage`);
    }
    
    /**
     * Set item
     */
    set(key, value, ttl = null) {
        const prefixedKey = getPrefixedKey(key);
        const item = createStorageItem(value, ttl || config.defaultTTL);
        
        try {
            if (this.type === StorageType.MEMORY) {
                memoryStorage.set(prefixedKey, item);
            } else {
                this.storage.setItem(prefixedKey, JSON.stringify(item));
            }
            
            log(`Set "${key}"`, value, ttl ? `(TTL: ${ttl}ms)` : '');
            
            emitEvent('set', {
                key,
                value,
                ttl,
                storageType: this.type,
            });
            
            return true;
        } catch (error) {
            console.error(`[Storage] Failed to set "${key}":`, error);
            
            // Check if quota exceeded
            if (error.name === 'QuotaExceededError') {
                emitEvent('quota-exceeded', {
                    key,
                    error: error.message,
                    storageType: this.type,
                });
            }
            
            return false;
        }
    }
    
    /**
     * Get item
     */
    get(key, defaultValue = null) {
        const prefixedKey = getPrefixedKey(key);
        
        try {
            let item;
            
            if (this.type === StorageType.MEMORY) {
                item = memoryStorage.get(prefixedKey);
            } else {
                const raw = this.storage.getItem(prefixedKey);
                if (!raw) return defaultValue;
                item = JSON.parse(raw);
            }
            
            if (!item) return defaultValue;
            
            // Check expiry
            if (isExpired(item)) {
                log(`"${key}" expired, removing`);
                this.remove(key);
                
                emitEvent('expired', {
                    key,
                    storageType: this.type,
                });
                
                return defaultValue;
            }
            
            log(`Get "${key}"`, item.value);
            return item.value;
        } catch (error) {
            console.error(`[Storage] Failed to get "${key}":`, error);
            return defaultValue;
        }
    }
    
    /**
     * Check if key exists (and not expired)
     */
    has(key) {
        const prefixedKey = getPrefixedKey(key);
        
        try {
            if (this.type === StorageType.MEMORY) {
                const item = memoryStorage.get(prefixedKey);
                return item && !isExpired(item);
            }
            
            const raw = this.storage.getItem(prefixedKey);
            if (!raw) return false;
            
            const item = JSON.parse(raw);
            if (isExpired(item)) {
                this.remove(key);
                return false;
            }
            
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * Remove item
     */
    remove(key) {
        const prefixedKey = getPrefixedKey(key);
        
        try {
            if (this.type === StorageType.MEMORY) {
                memoryStorage.delete(prefixedKey);
            } else {
                this.storage.removeItem(prefixedKey);
            }
            
            log(`Remove "${key}"`);
            
            emitEvent('remove', {
                key,
                storageType: this.type,
            });
            
            return true;
        } catch (error) {
            console.error(`[Storage] Failed to remove "${key}":`, error);
            return false;
        }
    }
    
    /**
     * Clear all items (with prefix)
     */
    clear() {
        try {
            if (this.type === StorageType.MEMORY) {
                const keys = Array.from(memoryStorage.keys()).filter(k => 
                    k.startsWith(config.prefix)
                );
                keys.forEach(k => memoryStorage.delete(k));
                log(`Cleared ${keys.length} items from memory storage`);
                return keys.length;
            }
            
            const keys = this.keys();
            keys.forEach(key => this.remove(key));
            
            log(`Cleared ${keys.length} items`);
            
            emitEvent('clear', {
                count: keys.length,
                storageType: this.type,
            });
            
            return keys.length;
        } catch (error) {
            console.error('[Storage] Failed to clear:', error);
            return 0;
        }
    }
    
    /**
     * Get all keys (without prefix)
     */
    keys() {
        try {
            if (this.type === StorageType.MEMORY) {
                return Array.from(memoryStorage.keys())
                    .filter(k => k.startsWith(config.prefix))
                    .map(stripPrefix);
            }
            
            const keys = [];
            for (let i = 0; i < this.storage.length; i++) {
                const key = this.storage.key(i);
                if (key.startsWith(config.prefix)) {
                    keys.push(stripPrefix(key));
                }
            }
            return keys;
        } catch (error) {
            console.error('[Storage] Failed to get keys:', error);
            return [];
        }
    }
    
    /**
     * Get all items as object
     */
    getAll() {
        const items = {};
        this.keys().forEach(key => {
            items[key] = this.get(key);
        });
        return items;
    }
    
    /**
     * Get storage size (bytes, approximate)
     */
    getSize() {
        try {
            if (this.type === StorageType.MEMORY) {
                let size = 0;
                memoryStorage.forEach((value, key) => {
                    if (key.startsWith(config.prefix)) {
                        size += JSON.stringify(value).length;
                    }
                });
                return size;
            }
            
            let size = 0;
            this.keys().forEach(key => {
                const prefixedKey = getPrefixedKey(key);
                const value = this.storage.getItem(prefixedKey);
                size += prefixedKey.length + (value ? value.length : 0);
            });
            return size;
        } catch {
            return 0;
        }
    }
    
    /**
     * Get remaining quota (bytes, approximate)
     */
    async getRemainingQuota() {
        if (this.type === StorageType.MEMORY) {
            return Infinity;
        }
        
        try {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                const estimate = await navigator.storage.estimate();
                return estimate.quota - estimate.usage;
            }
            return null; // Unknown
        } catch {
            return null;
        }
    }
    
    /**
     * Clean expired items
     */
    cleanExpired() {
        let count = 0;
        
        this.keys().forEach(key => {
            const prefixedKey = getPrefixedKey(key);
            
            try {
                let item;
                
                if (this.type === StorageType.MEMORY) {
                    item = memoryStorage.get(prefixedKey);
                } else {
                    const raw = this.storage.getItem(prefixedKey);
                    if (raw) item = JSON.parse(raw);
                }
                
                if (item && isExpired(item)) {
                    this.remove(key);
                    count++;
                }
            } catch {
                // Skip invalid items
            }
        });
        
        log(`Cleaned ${count} expired item(s)`);
        return count;
    }
    
    /**
     * Get TTL for key (ms remaining)
     */
    getTTL(key) {
        const prefixedKey = getPrefixedKey(key);
        
        try {
            let item;
            
            if (this.type === StorageType.MEMORY) {
                item = memoryStorage.get(prefixedKey);
            } else {
                const raw = this.storage.getItem(prefixedKey);
                if (raw) item = JSON.parse(raw);
            }
            
            if (!item || !item.expires) return null;
            
            const remaining = item.expires - Date.now();
            return remaining > 0 ? remaining : 0;
        } catch {
            return null;
        }
    }
}

/**
 * Create storage instance
 */
function createStorage(type = StorageType.LOCAL, options = {}) {
    const instance = new Storage(type);
    
    if (options.prefix) {
        const originalPrefix = config.prefix;
        config.prefix = options.prefix;
        instance.prefix = options.prefix;
        
        // Restore original prefix after use (for multiple instances)
        return new Proxy(instance, {
            get(target, prop) {
                config.prefix = options.prefix;
                const value = target[prop];
                config.prefix = originalPrefix;
                return typeof value === 'function' ? value.bind(target) : value;
            },
        });
    }
    
    return instance;
}

/**
 * Default storage instances
 */
let localStorage = null;
let sessionStorage = null;

/**
 * Initialize storage module
 */
function init(options = {}) {
    log('Initializing...');
    
    // Merge config
    Object.assign(config, options);
    
    // Create default instances
    localStorage = new Storage(StorageType.LOCAL);
    sessionStorage = new Storage(StorageType.SESSION);
    
    // Clean expired items periodically (every 5 minutes)
    setInterval(() => {
        localStorage.cleanExpired();
        sessionStorage.cleanExpired();
    }, 5 * 60 * 1000);
    
    log('Initialized ✓');
}

/**
 * Destroy storage module
 */
function destroy() {
    log('Destroying...');
    localStorage = null;
    sessionStorage = null;
    memoryStorage.clear();
    log('Destroyed ✓');
}

/**
 * Configure storage
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

// Expose to window
if (typeof window !== 'undefined') {
    window.StorageAPI = {
        init,
        destroy,
        configure,
        enableDebug,
        disableDebug,
        createStorage,
        StorageType,
    };
    window.StorageType = StorageType;
}
// Named exports
export {
    init,
    destroy,
    configure,
    enableDebug,
    disableDebug,
    createStorage,
    Storage,
    StorageType,
};
