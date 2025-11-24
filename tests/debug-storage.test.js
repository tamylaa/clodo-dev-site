import { describe, it, expect } from 'vitest';
import { createStorage, StorageType } from '../public/js/core/storage.js';

describe('Storage Debug', () => {
    it('should debug storage availability', () => {
        console.log('Testing native localStorage...');
        try {
            window.localStorage.setItem('test', 'value');
            console.log('Set item worked');
            const value = window.localStorage.getItem('test');
            console.log('Get item result:', value);
            window.localStorage.removeItem('test');
            console.log('Remove item worked');
            console.log('localStorage type:', typeof window.localStorage);
            console.log('localStorage methods:', Object.getOwnPropertyNames(window.localStorage));
        } catch (error) {
            console.log('Native localStorage error:', error.message);
        }
    });

    it('should test createStorage function', () => {
        console.log('Testing createStorage...');
        try {
            const storage = createStorage(StorageType.LOCAL);
            console.log('Storage created:', storage.type, storage.available);

            // Try to set and get a value
            storage.set('debug_key', 'debug_value');
            const value = storage.get('debug_key');
            console.log('Set/get result:', value);

            const removed = storage.remove('debug_key');
            console.log('Remove result:', removed);

        } catch (error) {
            console.log('createStorage error:', error.message);
        }
    });
});