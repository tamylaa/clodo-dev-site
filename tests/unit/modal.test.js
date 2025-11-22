/**
 * Modal Component Tests
 */

import { jest } from '@jest/globals';
import { JSDOM } from 'jsdom';

// Test helpers
let dom;
let window;
let document;
let Modal;
let open;
let closeAll;
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
    getState = module.getState;
}

/**
 * Cleanup DOM
 */
function teardownDOM() {
    if (dom) {
        closeAll();
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

        it('should emit before-open event', (done) => {
            const modal = new Modal({ animation: false });
            
            window.addEventListener('modal:before-open', (e) => {
                expect(e.detail.modalId).toBe(modal.id);
                done();
            }, { once: true });
            
            modal.open();
        });

        it('should emit open event', (done) => {
            const modal = new Modal({ animation: false });
            
            window.addEventListener('modal:open', (e) => {
                expect(e.detail.modalId).toBe(modal.id);
                done();
            }, { once: true });
            
            modal.open();
        });

        it('should focus first element', async () => {
            const modal = new Modal({
                animation: false,
                content: '<button id="first">First</button><button id="second">Second</button>',
            });
            
            modal.open();
            await wait(50);
            
            const firstButton = modal.element.querySelector('#first');
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

        it('should emit before-close event', (done) => {
            const modal = new Modal({ animation: false });
            modal.open();
            
            window.addEventListener('modal:before-close', (e) => {
                expect(e.detail.modalId).toBe(modal.id);
                done();
            }, { once: true });
            
            modal.close();
        });

        it('should emit close event', (done) => {
            const modal = new Modal({ animation: false });
            modal.open();
            
            window.addEventListener('modal:close', (e) => {
                expect(e.detail.modalId).toBe(modal.id);
                done();
            }, { once: true });
            
            modal.close();
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
            const modal = new Modal({
                animation: false,
                content: '<button id="first">First</button><button id="last">Last</button>',
            });
            modal.open();
            
            const firstButton = modal.element.querySelector('#first');
            const lastButton = modal.element.querySelector('#last');
            
            // Focus last button
            lastButton.focus();
            
            // Tab from last should go to first
            const event = new window.KeyboardEvent('keydown', {
                key: 'Tab',
                bubbles: true,
            });
            Object.defineProperty(document, 'activeElement', { value: lastButton, configurable: true });
            document.dispatchEvent(event);
            
            // Focus trap should have been called
            expect(event.defaultPrevented).toBe(true);
        });

        it('should trap focus with Shift+Tab', async () => {
            const modal = new Modal({
                animation: false,
                content: '<button id="first">First</button><button id="last">Last</button>',
            });
            modal.open();
            
            const firstButton = modal.element.querySelector('#first');
            
            // Shift+Tab from first should go to last
            const event = new window.KeyboardEvent('keydown', {
                key: 'Tab',
                shiftKey: true,
                bubbles: true,
            });
            Object.defineProperty(document, 'activeElement', { value: firstButton, configurable: true });
            document.dispatchEvent(event);
            
            expect(event.defaultPrevented).toBe(true);
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

        it('should allow event listeners', (done) => {
            const modal = new Modal({ animation: false });
            
            modal.on('open', () => {
                done();
            });
            
            modal.open();
        });

        it('should remove event listeners', () => {
            const modal = new Modal({ animation: false });
            const handler = jest.fn();
            
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
