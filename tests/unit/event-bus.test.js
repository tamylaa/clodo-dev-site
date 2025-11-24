/**
 * Event Bus Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
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
    configure,
} from '@/core/event-bus.js';

describe('Event Bus', () => {
    beforeEach(() => {
        reset();
        configure({ debug: false, enableHistory: true });
    });
    
    afterEach(() => {
        reset();
    });
    
    describe('initialization', () => {
        it('should initialize successfully', () => {
            expect(() => init()).not.toThrow();
        });
        
        it('should accept configuration options', () => {
            init({ debug: true, maxHistory: 50 });
            // Config should be applied
        });
    });
    
    describe('on - subscribe to events', () => {
        it('should subscribe to event', () => {
            const handler = vi.fn();
            const unsubscribe = on('test:event', handler);
            
            expect(typeof unsubscribe).toBe('function');
            expect(hasListeners('test:event')).toBe(true);
        });
        
        it('should call handler when event is emitted', async () => {
            const handler = vi.fn();
            on('test:event', handler);
            
            await emit('test:event', { data: 'value' });
            
            expect(handler).toHaveBeenCalledWith({ data: 'value' }, 'test:event');
        });
        
        it('should support multiple handlers for same event', async () => {
            const handler1 = vi.fn();
            const handler2 = vi.fn();
            
            on('test:event', handler1);
            on('test:event', handler2);
            
            await emit('test:event', 'data');
            
            expect(handler1).toHaveBeenCalledWith('data', 'test:event');
            expect(handler2).toHaveBeenCalledWith('data', 'test:event');
        });
        
        it('should support priority-based execution', async () => {
            const order = [];
            
            on('test:event', () => order.push(3), { priority: 0 });
            on('test:event', () => order.push(1), { priority: 100 });
            on('test:event', () => order.push(2), { priority: 50 });
            
            await emit('test:event');
            
            expect(order).toEqual([1, 2, 3]);
        });
        
        it('should support custom context', async () => {
            const context = { value: 42 };
            const handler = vi.fn(function() {
                return this.value;
            });
            
            on('test:event', handler, { context });
            await emit('test:event');
            
            expect(handler.mock.results[0].value).toBe(42);
        });
        
        it('should throw error if callback is not a function', () => {
            expect(() => on('test:event', 'not-a-function')).toThrow(TypeError);
        });
    });
    
    describe('once - one-time subscription', () => {
        it('should call handler only once', async () => {
            const handler = vi.fn();
            once('test:event', handler);
            
            await emit('test:event', 'data1');
            await emit('test:event', 'data2');
            
            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenCalledWith('data1', 'test:event');
        });
        
        it('should remove handler after execution', async () => {
            const handler = vi.fn();
            once('test:event', handler);
            
            await emit('test:event');
            
            expect(hasListeners('test:event')).toBe(false);
        });
    });
    
    describe('off - unsubscribe', () => {
        it('should unsubscribe handler', async () => {
            const handler = vi.fn();
            const unsubscribe = on('test:event', handler);
            
            unsubscribe();
            await emit('test:event');
            
            expect(handler).not.toHaveBeenCalled();
        });
        
        it('should return unsubscribe function', () => {
            const unsubscribe = on('test:event', vi.fn());
            expect(typeof unsubscribe).toBe('function');
        });
        
        it('should remove specific handler', async () => {
            const handler1 = vi.fn();
            const handler2 = vi.fn();
            
            const unsub1 = on('test:event', handler1);
            on('test:event', handler2);
            
            unsub1();
            await emit('test:event');
            
            expect(handler1).not.toHaveBeenCalled();
            expect(handler2).toHaveBeenCalled();
        });
    });
    
    describe('offAll - unsubscribe all', () => {
        it('should remove all handlers for event', () => {
            on('test:event', vi.fn());
            on('test:event', vi.fn());
            on('test:event', vi.fn());
            
            offAll('test:event');
            
            expect(hasListeners('test:event')).toBe(false);
        });
        
        it('should remove all handlers for all events', () => {
            on('event1', vi.fn());
            on('event2', vi.fn());
            on('event3', vi.fn());
            
            offAll();
            
            expect(listenerCount('event1')).toBe(0);
            expect(listenerCount('event2')).toBe(0);
            expect(listenerCount('event3')).toBe(0);
        });
    });
    
    describe('emit - fire events', () => {
        it('should emit event to all handlers', async () => {
            const handler1 = vi.fn();
            const handler2 = vi.fn();
            
            on('test:event', handler1);
            on('test:event', handler2);
            
            const count = await emit('test:event', 'data');
            
            expect(count).toBe(2);
            expect(handler1).toHaveBeenCalled();
            expect(handler2).toHaveBeenCalled();
        });
        
        it('should pass data to handlers', async () => {
            const handler = vi.fn();
            on('test:event', handler);
            
            await emit('test:event', { key: 'value' });
            
            expect(handler).toHaveBeenCalledWith({ key: 'value' }, 'test:event');
        });
        
        it('should return count of handlers executed', async () => {
            on('test:event', vi.fn());
            on('test:event', vi.fn());
            on('test:event', vi.fn());
            
            const count = await emit('test:event');
            
            expect(count).toBe(3);
        });
        
        it('should return 0 for events with no listeners', async () => {
            const count = await emit('nonexistent:event');
            expect(count).toBe(0);
        });
        
        it('should support async handlers', async () => {
            const handler = vi.fn(async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return 'result';
            });
            
            on('test:event', handler);
            await emit('test:event');
            
            expect(handler).toHaveBeenCalled();
        });
        
        it('should handle handler errors gracefully', async () => {
            const handler1 = vi.fn(() => { throw new Error('Handler error'); });
            const handler2 = vi.fn();
            
            on('test:event', handler1);
            on('test:event', handler2);
            
            const count = await emit('test:event');
            
            // Should execute both despite error
            expect(count).toBe(2);
            expect(handler2).toHaveBeenCalled();
        });
    });
    
    describe('emitSync - fire and forget', () => {
        it('should emit event asynchronously', () => {
            const handler = vi.fn();
            on('test:event', handler);
            
            emitSync('test:event', 'data');
            
            // Handler not called yet (async)
            expect(handler).not.toHaveBeenCalled();
        });
    });
    
    describe('wildcard events', () => {
        it('should match wildcard patterns', async () => {
            const handler = vi.fn();
            on('user:*', handler);
            
            await emit('user:login', { userId: 1 });
            await emit('user:logout', { userId: 1 });
            
            expect(handler).toHaveBeenCalledTimes(2);
        });
        
        it('should match global wildcard', async () => {
            const handler = vi.fn();
            on('*', handler);
            
            await emit('event1');
            await emit('event2');
            await emit('user:login');
            
            expect(handler).toHaveBeenCalledTimes(3);
        });
        
        it('should match complex patterns', async () => {
            const handler = vi.fn();
            on('user:*:success', handler);
            
            await emit('user:login:success');
            await emit('user:register:success');
            await emit('user:login:error'); // Should not match
            
            expect(handler).toHaveBeenCalledTimes(2);
        });
    });
    
    describe('hasListeners', () => {
        it('should return true if event has listeners', () => {
            on('test:event', vi.fn());
            expect(hasListeners('test:event')).toBe(true);
        });
        
        it('should return false if event has no listeners', () => {
            expect(hasListeners('test:event')).toBe(false);
        });
        
        it('should check wildcard matches', () => {
            on('user:*', vi.fn());
            expect(hasListeners('user:login')).toBe(true);
        });
    });
    
    describe('listenerCount', () => {
        it('should return number of listeners', () => {
            on('test:event', vi.fn());
            on('test:event', vi.fn());
            on('test:event', vi.fn());
            
            expect(listenerCount('test:event')).toBe(3);
        });
        
        it('should return 0 for events with no listeners', () => {
            expect(listenerCount('test:event')).toBe(0);
        });
        
        it('should count wildcard matches', () => {
            on('user:*', vi.fn());
            on('user:login', vi.fn());
            
            expect(listenerCount('user:login')).toBe(2);
        });
    });
    
    describe('getEventNames', () => {
        it('should return all registered event names', () => {
            on('event1', vi.fn());
            on('event2', vi.fn());
            on('event3', vi.fn());
            
            const names = getEventNames();
            
            expect(names).toContain('event1');
            expect(names).toContain('event2');
            expect(names).toContain('event3');
        });
        
        it('should return empty array when no events', () => {
            const names = getEventNames();
            expect(names).toEqual([]);
        });
    });
    
    describe('event history', () => {
        it('should record events in history', async () => {
            await emit('event1', 'data1');
            await emit('event2', 'data2');
            
            const history = getHistory();
            
            expect(history).toHaveLength(2);
            expect(history[0].name).toBe('event1');
            expect(history[0].data).toBe('data1');
            expect(history[1].name).toBe('event2');
        });
        
        it('should filter history by event name', async () => {
            await emit('user:login');
            await emit('user:logout');
            await emit('admin:login');
            
            const history = getHistory('user:*');
            
            expect(history).toHaveLength(2);
        });
        
        it('should limit history results', async () => {
            await emit('event1');
            await emit('event2');
            await emit('event3');
            await emit('event4');
            
            const history = getHistory(null, 2);
            
            expect(history).toHaveLength(2);
            expect(history[0].name).toBe('event3');
            expect(history[1].name).toBe('event4');
        });
        
        it('should clear history', async () => {
            await emit('event1');
            await emit('event2');
            
            const count = clearHistory();
            
            expect(count).toBe(2);
            expect(getHistory()).toHaveLength(0);
        });
    });
    
    describe('replay', () => {
        it('should replay events from history', async () => {
            const handler = vi.fn();
            
            await emit('test:event', 'data1');
            await emit('test:event', 'data2');
            
            // Subscribe after events emitted
            on('test:event', handler);
            
            await replay('test:event');
            
            expect(handler).toHaveBeenCalledTimes(2);
        });
        
        it('should replay limited events', async () => {
            const handler = vi.fn();
            
            await emit('test:event', 'data1');
            await emit('test:event', 'data2');
            await emit('test:event', 'data3');
            
            on('test:event', handler);
            await replay('test:event', 2);
            
            expect(handler).toHaveBeenCalledTimes(2);
        });
    });
    
    describe('getStats', () => {
        it('should return statistics', async () => {
            on('event1', vi.fn());
            on('event2', vi.fn());
            await emit('event1');
            await emit('event2');
            
            const stats = getStats();
            
            expect(stats.totalEvents).toBe(2);
            expect(stats.activeListeners).toBe(2);
            expect(stats.historySize).toBe(2);
            expect(stats.eventNames).toContain('event1');
        });
    });
    
    describe('reset', () => {
        it('should clear all listeners and history', async () => {
            on('event1', vi.fn());
            on('event2', vi.fn());
            await emit('event1');
            
            reset();
            
            expect(hasListeners('event1')).toBe(false);
            expect(hasListeners('event2')).toBe(false);
            expect(getHistory()).toHaveLength(0);
        });
    });
});
