/**
 * Modal Component Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Test helpers
let dom;
let window;
let document;
let Modal;
let open;
let closeAll;
let resetState;
let getState;

/**
 * Setup DOM environment
 */
async function setupDOM() {
    dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>Test</title>
                <style>
                    .modal-scroll-locked { overflow: hidden; }
                    .modal { display: none; }
                    .modal.modal-open { display: block; }
                    .modal-backdrop { display: none; }
                    .modal-backdrop.modal-active { display: block; }
                </style>
            </head>
            <body>
                <button id="trigger">Open Modal</button>
                <div id="content">Page content</div>
            </body>
        </html>
    `, {
        url: 'http://localhost',
        pretendToBeVisual: true,
        resources: 'usable',
    });

    window = dom.window;
    document = window.document;
    
    // Setup global objects
    global.window = window;
    global.document = document;
    global.CustomEvent = window.CustomEvent;
    global.HTMLElement = window.HTMLElement;
    
    // Import module
    const module = await import('../../public/js/ui/modal.js');
    Modal = module.Modal;
    open = module.open;
    closeAll = module.closeAll;
    resetState = module.resetState;
    getState = module.getState;
}

/**
 * Cleanup DOM
 */
function teardownDOM() {
    if (dom) {
        closeAll();
        resetState();
        dom.window.close();
    }
    delete global.window;
    delete global.document;
    delete global.CustomEvent;
    delete global.HTMLElement;
}

/**
 * Wait for specified time
 */
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe('Modal Component', () => {
    describe('Initialization', () => {
        beforeEach(async () => {
            await setupDOM();
        });

        afterEach(() => {
            teardownDOM();
        });

        it('should create modal instance', () => {
            const modal = new Modal();
            expect(modal).toBeDefined();
            expect(modal.id).toBeDefined();
            expect(modal.isOpen).toBe(false);
        });

        it('should accept options', () => {
            const modal = new Modal({
                closeOnBackdrop: false,
                closeOnEscape: false,
                lockScroll: false,
            });
            
            expect(modal.options.closeOnBackdrop).toBe(false);
            expect(modal.options.closeOnEscape).toBe(false);
            expect(modal.options.lockScroll).toBe(false);
        });

        it('should create DOM elements', () => {
            const modal = new Modal();
            expect(modal.element).toBeDefined();
            expect(modal.backdrop).toBeDefined();
            expect(modal.element.getAttribute('role')).toBe('dialog');
            expect(modal.element.getAttribute('aria-modal')).toBe('true');
        });

        it('should set ARIA labels', () => {
            const modal = new Modal({
                ariaLabel: 'Test Modal',
            });
            
            expect(modal.element.getAttribute('aria-label')).toBe('Test Modal');
        });
    });

    describe('Opening Modal', () => {
        beforeEach(async () => {
            await setupDOM();
        });

        afterEach(() => {
            teardownDOM();
        });

        it('should open modal', async () => {
            const modal = new Modal();
            modal.open();
            
            await wait(50);
            
            expect(document.body.contains(modal.element)).toBe(true);
            expect(document.body.contains(modal.backdrop)).toBe(true);
        });

        it('should set isOpen flag', async () => {
            const modal = new Modal({ animation: false });
            modal.open();
            
            expect(modal.isOpen).toBe(true);
        });

        it('should add to stack', async () => {
            const modal = new Modal({ animation: false });
            modal.open();
            
            const state = getState();
            expect(state.openModals).toBe(1);
            expect(state.stack).toContain(modal.id);
        });

        it('should lock scroll', async () => {
            const modal = new Modal({ animation: false });
            modal.open();
            
            expect(document.body.classList.contains('modal-scroll-locked')).toBe(true);
            expect(document.body.style.overflow).toBe('hidden');
        });

        it('should not lock scroll if disabled', async () => {
            const modal = new Modal({
                animation: false,
                lockScroll: false,
            });
            modal.open();
            
            expect(document.body.classList.contains('modal-scroll-locked')).toBe(false);
        });

        it('should emit before-open event', async () => {
            const modal = new Modal({ animation: false });
            
            const beforeOpenPromise = new Promise((resolve) => {
                window.addEventListener('modal:before-open', (e) => {
                    expect(e.detail.modalId).toBe(modal.id);
                    resolve();
                }, { once: true });
            });
            
            modal.open();
            await beforeOpenPromise;
        });

        it('should emit open event', async () => {
            const modal = new Modal({ animation: false });
            
            const openPromise = new Promise((resolve) => {
                window.addEventListener('modal:open', (e) => {
                    expect(e.detail.modalId).toBe(modal.id);
                    resolve();
                }, { once: true });
            });
            
            modal.open();
            await openPromise;
        });

        it('should focus first element', async () => {
            const firstButton = document.createElement('button');
            firstButton.id = 'first';
            firstButton.textContent = 'First';

            const secondButton = document.createElement('button');
            secondButton.id = 'second';
            secondButton.textContent = 'Second';

            const content = document.createElement('div');
            content.appendChild(firstButton);
            content.appendChild(secondButton);

            const modal = new Modal({
                animation: false,
                content: content,
            });
            
            modal.open();
            await wait(50);
            
            expect(document.activeElement).toBe(firstButton);
        });

        it('should save previous focus', async () => {
            const trigger = document.querySelector('#trigger');
            trigger.focus();
            
            const modal = new Modal({ animation: false });
            modal.open();
            
            expect(modal.previousFocus).toBe(trigger);
        });
    });

    describe('Closing Modal', () => {
        beforeEach(async () => {
            await setupDOM();
        });

        afterEach(() => {
            teardownDOM();
        });

        it('should close modal', async () => {
            const modal = new Modal({ animation: false });
            modal.open();
            modal.close();
            
            expect(modal.isOpen).toBe(false);
            expect(document.body.contains(modal.element)).toBe(false);
        });

        it('should emit before-close event', async () => {
            const modal = new Modal({ animation: false });
            modal.open();
            
            const beforeClosePromise = new Promise((resolve) => {
                window.addEventListener('modal:before-close', (e) => {
                    expect(e.detail.modalId).toBe(modal.id);
                    resolve();
                }, { once: true });
            });
            
            modal.close();
            await beforeClosePromise;
        });

        it('should emit close event', async () => {
            const modal = new Modal({ animation: false });
            modal.open();
            
            const closePromise = new Promise((resolve) => {
                window.addEventListener('modal:close', (e) => {
                    expect(e.detail.modalId).toBe(modal.id);
                    resolve();
                }, { once: true });
            });
            
            modal.close();
            await closePromise;
        });

        it('should restore focus', async () => {
            const trigger = document.querySelector('#trigger');
            trigger.focus();
            
            const modal = new Modal({ animation: false });
            modal.open();
            modal.close();
            
            await wait(50);
            expect(document.activeElement).toBe(trigger);
        });

        it('should unlock scroll', async () => {
            const modal = new Modal({ animation: false });
            modal.open();
            modal.close();
            
            expect(document.body.classList.contains('modal-scroll-locked')).toBe(false);
        });

        it('should not unlock scroll if other modals open', async () => {
            const modal1 = new Modal({ animation: false });
            const modal2 = new Modal({ animation: false });
            
            modal1.open();
            modal2.open();
            modal2.close();
            
            expect(document.body.classList.contains('modal-scroll-locked')).toBe(true);
        });
    });

    describe('ESC Key', () => {
        beforeEach(async () => {
            await setupDOM();
        });

        afterEach(() => {
            teardownDOM();
        });

        it('should close on ESC key', async () => {
            const modal = new Modal({ animation: false });
            modal.open();
            
            const event = new window.KeyboardEvent('keydown', { key: 'Escape' });
            document.dispatchEvent(event);
            
            await wait(50);
            expect(modal.isOpen).toBe(false);
        });

        it('should not close on ESC if disabled', async () => {
            const modal = new Modal({
                animation: false,
                closeOnEscape: false,
            });
            modal.open();
            
            const event = new window.KeyboardEvent('keydown', { key: 'Escape' });
            document.dispatchEvent(event);
            
            await wait(50);
            expect(modal.isOpen).toBe(true);
        });

        it('should only close top modal', async () => {
            const modal1 = new Modal({ animation: false });
            const modal2 = new Modal({ animation: false });
            
            modal1.open();
            modal2.open();
            
            const event = new window.KeyboardEvent('keydown', { key: 'Escape' });
            document.dispatchEvent(event);
            
            await wait(50);
            expect(modal1.isOpen).toBe(true);
            expect(modal2.isOpen).toBe(false);
        });
    });

    describe('Backdrop Click', () => {
        beforeEach(async () => {
            await setupDOM();
        });

        afterEach(() => {
            teardownDOM();
        });

        it('should close on backdrop click', async () => {
            const modal = new Modal({ animation: false });
            modal.open();
            
            const event = new window.MouseEvent('click', { bubbles: true });
            Object.defineProperty(event, 'target', { value: modal.backdrop });
            modal.backdrop.dispatchEvent(event);
            
            await wait(50);
            expect(modal.isOpen).toBe(false);
        });

        it('should not close on backdrop click if disabled', async () => {
            const modal = new Modal({
                animation: false,
                closeOnBackdrop: false,
            });
            modal.open();
            
            const event = new window.MouseEvent('click', { bubbles: true });
            Object.defineProperty(event, 'target', { value: modal.backdrop });
            modal.backdrop.dispatchEvent(event);
            
            await wait(50);
            expect(modal.isOpen).toBe(true);
        });
    });

    describe('Focus Trap', () => {
        beforeEach(async () => {
            await setupDOM();
        });

        afterEach(() => {
            teardownDOM();
        });

        it('should trap focus with Tab key', async () => {
            const firstButton = document.createElement('button');
            firstButton.id = 'first';
            firstButton.textContent = 'First';

            const lastButton = document.createElement('button');
            lastButton.id = 'last';
            lastButton.textContent = 'Last';

            const content = document.createElement('div');
            content.appendChild(firstButton);
            content.appendChild(lastButton);

            const modal = new Modal({
                animation: false,
                content: content,
            });
            modal.open();
            
            const lastButtonFromDOM = modal.element.querySelector('#last');
            
            // Focus last button
            lastButtonFromDOM.focus();
            Object.defineProperty(document, 'activeElement', { value: lastButtonFromDOM, configurable: true });
            
            // Tab from last should go to first
            const event = new window.KeyboardEvent('keydown', {
                key: 'Tab',
                bubbles: true,
                isTrusted: true,
            });
            
            // Spy on preventDefault since JSDOM doesn't set defaultPrevented
            const preventDefaultSpy = vi.fn();
            event.preventDefault = preventDefaultSpy;
            
            document.dispatchEvent(event);
            
            // Focus trap should have been called
            expect(preventDefaultSpy).toHaveBeenCalled();
        });

        it('should trap focus with Shift+Tab', async () => {
            const firstButton = document.createElement('button');
            firstButton.id = 'first';
            firstButton.textContent = 'First';

            const lastButton = document.createElement('button');
            lastButton.id = 'last';
            lastButton.textContent = 'Last';

            const content = document.createElement('div');
            content.appendChild(firstButton);
            content.appendChild(lastButton);

            const modal = new Modal({
                animation: false,
                content: content,
            });
            modal.open();
            
            const firstButtonFromDOM = modal.element.querySelector('#first');
            
            // Shift+Tab from first should go to last
            const event = new window.KeyboardEvent('keydown', {
                key: 'Tab',
                shiftKey: true,
                bubbles: true,
                isTrusted: true,
            });
            
            // Spy on preventDefault since JSDOM doesn't set defaultPrevented
            const preventDefaultSpy = vi.fn();
            event.preventDefault = preventDefaultSpy;
            
            Object.defineProperty(document, 'activeElement', { value: firstButtonFromDOM, configurable: true });
            document.dispatchEvent(event);
            
            expect(preventDefaultSpy).toHaveBeenCalled();
        });
    });

    describe('Content Management', () => {
        beforeEach(async () => {
            await setupDOM();
        });

        afterEach(() => {
            teardownDOM();
        });

        it('should accept string content', () => {
            const modal = new Modal({
                content: '<p>Hello World</p>',
            });
            
            const content = modal.element.querySelector('.modal-content');
            expect(content.innerHTML).toContain('Hello World');
        });

        it('should accept HTML element content', () => {
            const div = document.createElement('div');
            div.id = 'test-content';
            div.textContent = 'Test';
            
            const modal = new Modal({ content: div });
            
            const content = modal.element.querySelector('.modal-content');
            expect(content.querySelector('#test-content')).toBeDefined();
        });

        it('should update content', () => {
            const modal = new Modal({ content: '<p>Original</p>' });
            modal.setContent('<p>Updated</p>');
            
            const content = modal.element.querySelector('.modal-content');
            expect(content.innerHTML).toContain('Updated');
        });
    });

    describe('Multiple Modals', () => {
        beforeEach(async () => {
            await setupDOM();
        });

        afterEach(() => {
            teardownDOM();
        });

        it('should support multiple modals', async () => {
            const modal1 = new Modal({ animation: false });
            const modal2 = new Modal({ animation: false });
            
            modal1.open();
            modal2.open();
            
            const state = getState();
            expect(state.openModals).toBe(2);
        });

        it('should close all modals', async () => {
            const modal1 = new Modal({ animation: false });
            const modal2 = new Modal({ animation: false });
            
            modal1.open();
            modal2.open();
            
            closeAll();
            
            await wait(50);
            const state = getState();
            expect(state.openModals).toBe(0);
        });

        it('should maintain correct stack order', async () => {
            const modal1 = new Modal({ animation: false });
            const modal2 = new Modal({ animation: false });
            
            modal1.open();
            modal2.open();
            
            const state = getState();
            expect(state.stack[0]).toBe(modal1.id);
            expect(state.stack[1]).toBe(modal2.id);
        });
    });

    describe('Convenience Methods', () => {
        beforeEach(async () => {
            await setupDOM();
        });

        afterEach(() => {
            teardownDOM();
        });

        it('should open modal with convenience method', async () => {
            const modal = open({
                animation: false,
                content: '<p>Quick modal</p>',
            });
            
            expect(modal.isOpen).toBe(true);
            expect(document.body.contains(modal.element)).toBe(true);
        });

        it('should allow event listeners', async () => {
            const modal = new Modal({ animation: false });
            
            const openPromise = new Promise((resolve) => {
                modal.on('open', () => {
                    resolve();
                });
            });
            
            modal.open();
            await openPromise;
        });

        it('should remove event listeners', () => {
            const modal = new Modal({ animation: false });
            const handler = vi.fn();
            
            modal.on('open', handler);
            modal.off('open', handler);
            modal.open();
            
            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe('Cleanup', () => {
        beforeEach(async () => {
            await setupDOM();
        });

        afterEach(() => {
            teardownDOM();
        });

        it('should destroy modal', async () => {
            const modal = new Modal({ animation: false });
            modal.open();
            
            const id = modal.id;
            modal.destroy();
            
            const state = getState();
            expect(state.totalModals).toBe(0);
        });

        it('should close before destroying', async () => {
            const modal = new Modal({ animation: false });
            modal.open();
            modal.destroy();
            
            expect(modal.isOpen).toBe(false);
            expect(document.body.contains(modal.element)).toBe(false);
        });
    });
});
