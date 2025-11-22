/**
 * Storage Wrapper Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    init,
    destroy,
    createStorage,
    Storage,
    StorageType,
} from '../public/js/core/storage.js';

describe('Storage Wrapper', () => {
    let storage;
    
    beforeEach(() => {
        // Clear storage before each test
        localStorage.clear();
        sessionStorage.clear();
        
        // Create storage instance
        storage = new Storage(StorageType.LOCAL);
    });
    
    afterEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });
    
    describe('initialization', () => {
        it('should initialize successfully', () => {
            expect(() => init()).not.toThrow();
        });
        
        it('should create default instances', () => {
            init();
            expect(Storage).toBeDefined();
        });
    });
    
    describe('StorageType', () => {
        it('should have LOCAL type', () => {
            expect(StorageType.LOCAL).toBe('local');
        });
        
        it('should have SESSION type', () => {
            expect(StorageType.SESSION).toBe('session');
        });
        
        it('should have MEMORY type', () => {
            expect(StorageType.MEMORY).toBe('memory');
        });
    });
    
    describe('set and get', () => {
        it('should store and retrieve string values', () => {
            storage.set('key1', 'value1');
            expect(storage.get('key1')).toBe('value1');
        });
        
        it('should store and retrieve objects', () => {
            const obj = { name: 'test', value: 42 };
            storage.set('key1', obj);
            
            const retrieved = storage.get('key1');
            expect(retrieved).toEqual(obj);
        });
        
        it('should store and retrieve arrays', () => {
            const arr = [1, 2, 3, 'four'];
            storage.set('key1', arr);
            
            const retrieved = storage.get('key1');
            expect(retrieved).toEqual(arr);
        });
        
        it('should store and retrieve null', () => {
            storage.set('key1', null);
            expect(storage.get('key1')).toBe(null);
        });
        
        it('should store and retrieve boolean', () => {
            storage.set('key1', true);
            expect(storage.get('key1')).toBe(true);
            
            storage.set('key2', false);
            expect(storage.get('key2')).toBe(false);
        });
        
        it('should store and retrieve numbers', () => {
            storage.set('key1', 42);
            expect(storage.get('key1')).toBe(42);
            
            storage.set('key2', 3.14);
            expect(storage.get('key2')).toBe(3.14);
        });
        
        it('should return default value for missing keys', () => {
            expect(storage.get('nonexistent', 'default')).toBe('default');
            expect(storage.get('nonexistent', null)).toBe(null);
            expect(storage.get('nonexistent', 0)).toBe(0);
        });
        
        it('should overwrite existing values', () => {
            storage.set('key1', 'value1');
            storage.set('key1', 'value2');
            
            expect(storage.get('key1')).toBe('value2');
        });
    });
    
    describe('has', () => {
        it('should return true for existing keys', () => {
            storage.set('key1', 'value1');
            expect(storage.has('key1')).toBe(true);
        });
        
        it('should return false for missing keys', () => {
            expect(storage.has('nonexistent')).toBe(false);
        });
        
        it('should return true even for null values', () => {
            storage.set('key1', null);
            expect(storage.has('key1')).toBe(true);
        });
    });
    
    describe('remove', () => {
        it('should remove existing keys', () => {
            storage.set('key1', 'value1');
            storage.remove('key1');
            
            expect(storage.has('key1')).toBe(false);
            expect(storage.get('key1')).toBe(null);
        });
        
        it('should handle removing nonexistent keys', () => {
            expect(() => storage.remove('nonexistent')).not.toThrow();
        });
        
        it('should return true on successful removal', () => {
            storage.set('key1', 'value1');
            expect(storage.remove('key1')).toBe(true);
        });
    });
    
    describe('clear', () => {
        it('should remove all items', () => {
            storage.set('key1', 'value1');
            storage.set('key2', 'value2');
            storage.set('key3', 'value3');
            
            const count = storage.clear();
            
            expect(count).toBe(3);
            expect(storage.has('key1')).toBe(false);
            expect(storage.has('key2')).toBe(false);
            expect(storage.has('key3')).toBe(false);
        });
        
        it('should only clear prefixed items', () => {
            // Add item without prefix (directly to localStorage)
            localStorage.setItem('external_key', 'value');
            
            storage.set('key1', 'value1');
            storage.clear();
            
            // External key should remain
            expect(localStorage.getItem('external_key')).toBe('value');
        });
        
        it('should return count of removed items', () => {
            storage.set('key1', 'value1');
            storage.set('key2', 'value2');
            
            expect(storage.clear()).toBe(2);
        });
    });
    
    describe('keys', () => {
        it('should return all keys (without prefix)', () => {
            storage.set('key1', 'value1');
            storage.set('key2', 'value2');
            storage.set('key3', 'value3');
            
            const keys = storage.keys();
            
            expect(keys).toContain('key1');
            expect(keys).toContain('key2');
            expect(keys).toContain('key3');
            expect(keys).toHaveLength(3);
        });
        
        it('should return empty array when no items', () => {
            expect(storage.keys()).toEqual([]);
        });
        
        it('should only return prefixed keys', () => {
            localStorage.setItem('external_key', 'value');
            storage.set('key1', 'value1');
            
            const keys = storage.keys();
            
            expect(keys).toContain('key1');
            expect(keys).not.toContain('external_key');
        });
    });
    
    describe('getAll', () => {
        it('should return all items as object', () => {
            storage.set('key1', 'value1');
            storage.set('key2', 42);
            storage.set('key3', { nested: true });
            
            const all = storage.getAll();
            
            expect(all).toEqual({
                key1: 'value1',
                key2: 42,
                key3: { nested: true },
            });
        });
        
        it('should return empty object when no items', () => {
            expect(storage.getAll()).toEqual({});
        });
    });
    
    describe('TTL (time-to-live)', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });
        
        afterEach(() => {
            vi.useRealTimers();
        });
        
        it('should expire items after TTL', () => {
            storage.set('key1', 'value1', 1000); // 1 second TTL
            
            // Item should exist immediately
            expect(storage.get('key1')).toBe('value1');
            
            // Fast-forward time
            vi.advanceTimersByTime(1001);
            
            // Item should be expired
            expect(storage.get('key1')).toBe(null);
            expect(storage.has('key1')).toBe(false);
        });
        
        it('should not expire items without TTL', () => {
            storage.set('key1', 'value1'); // No TTL
            
            // Fast-forward time
            vi.advanceTimersByTime(1000000);
            
            // Item should still exist
            expect(storage.get('key1')).toBe('value1');
        });
        
        it('should return remaining TTL', () => {
            storage.set('key1', 'value1', 5000); // 5 seconds TTL
            
            const ttl = storage.getTTL('key1');
            
            expect(ttl).toBeGreaterThan(4900);
            expect(ttl).toBeLessThanOrEqual(5000);
        });
        
        it('should return null for items without TTL', () => {
            storage.set('key1', 'value1');
            expect(storage.getTTL('key1')).toBe(null);
        });
        
        it('should return 0 for expired items', () => {
            storage.set('key1', 'value1', 1000);
            
            vi.advanceTimersByTime(1001);
            
            expect(storage.getTTL('key1')).toBe(0);
        });
    });
    
    describe('cleanExpired', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });
        
        afterEach(() => {
            vi.useRealTimers();
        });
        
        it('should remove expired items', () => {
            storage.set('key1', 'value1', 1000); // Expires
            storage.set('key2', 'value2'); // Never expires
            storage.set('key3', 'value3', 5000); // Not yet expired
            
            vi.advanceTimersByTime(2000);
            
            const count = storage.cleanExpired();
            
            expect(count).toBe(1);
            expect(storage.has('key1')).toBe(false);
            expect(storage.has('key2')).toBe(true);
            expect(storage.has('key3')).toBe(true);
        });
        
        it('should return count of cleaned items', () => {
            storage.set('key1', 'value1', 1000);
            storage.set('key2', 'value2', 1000);
            storage.set('key3', 'value3', 1000);
            
            vi.advanceTimersByTime(1001);
            
            expect(storage.cleanExpired()).toBe(3);
        });
    });
    
    describe('getSize', () => {
        it('should calculate storage size', () => {
            storage.set('key1', 'value1');
            
            const size = storage.getSize();
            
            expect(size).toBeGreaterThan(0);
        });
        
        it('should increase with more data', () => {
            storage.set('key1', 'a');
            const size1 = storage.getSize();
            
            storage.set('key2', 'b'.repeat(100));
            const size2 = storage.getSize();
            
            expect(size2).toBeGreaterThan(size1);
        });
    });
    
    describe('sessionStorage', () => {
        it('should work with session storage', () => {
            const sessionStore = new Storage(StorageType.SESSION);
            
            sessionStore.set('key1', 'value1');
            expect(sessionStore.get('key1')).toBe('value1');
            
            // Check it's actually in sessionStorage
            expect(sessionStorage.getItem('clodo_key1')).toBeDefined();
        });
    });
    
    describe('memory storage fallback', () => {
        it('should use memory storage when specified', () => {
            const memoryStore = new Storage(StorageType.MEMORY);
            
            memoryStore.set('key1', 'value1');
            expect(memoryStore.get('key1')).toBe('value1');
            
            // Should not be in localStorage
            expect(localStorage.getItem('clodo_key1')).toBe(null);
        });
    });
    
    describe('createStorage', () => {
        it('should create storage with custom prefix', () => {
            const customStorage = createStorage(StorageType.LOCAL, { 
                prefix: 'custom_' 
            });
            
            customStorage.set('key1', 'value1');
            
            // Check actual localStorage key
            expect(localStorage.getItem('custom_key1')).toBeDefined();
        });
    });
    
    describe('storage events', () => {
        it('should emit set event', () => {
            const handler = vi.fn();
            window.addEventListener('storage:set', handler);
            
            storage.set('key1', 'value1');
            
            expect(handler).toHaveBeenCalled();
            expect(handler.mock.calls[0][0].detail.key).toBe('key1');
            expect(handler.mock.calls[0][0].detail.value).toBe('value1');
            
            window.removeEventListener('storage:set', handler);
        });
        
        it('should emit remove event', () => {
            const handler = vi.fn();
            window.addEventListener('storage:remove', handler);
            
            storage.set('key1', 'value1');
            storage.remove('key1');
            
            expect(handler).toHaveBeenCalled();
            expect(handler.mock.calls[0][0].detail.key).toBe('key1');
            
            window.removeEventListener('storage:remove', handler);
        });
        
        it('should emit expired event', () => {
            vi.useFakeTimers();
            
            const handler = vi.fn();
            window.addEventListener('storage:expired', handler);
            
            storage.set('key1', 'value1', 1000);
            vi.advanceTimersByTime(1001);
            storage.get('key1'); // Trigger expiry check
            
            expect(handler).toHaveBeenCalled();
            expect(handler.mock.calls[0][0].detail.key).toBe('key1');
            
            window.removeEventListener('storage:expired', handler);
            vi.useRealTimers();
        });
    });
});
