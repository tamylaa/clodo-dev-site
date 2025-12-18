/**
 * Navigation Component Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Test helpers
let dom;
let window;
let document;
let NavigationComponent;

/**
 * Setup DOM environment before each test
 */
async function setupDOM() {
    dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
            <head><title>Test</title></head>
            <body>
                <nav class="navbar" aria-label="Main navigation">
                    <button id="mobile-menu-toggle" aria-expanded="false">
                        <span class="hamburger"></span>
                    </button>
                    
                    <ul class="nav-menu" id="mobile-menu">
                        <li><a href="/" class="nav-link">Home</a></li>
                        <li><a href="/about.html" class="nav-link">About</a></li>
                        
                        <li class="nav-dropdown">
                            <a href="#" class="nav-dropdown-toggle" aria-haspopup="true" aria-expanded="false">
                                Docs
                            </a>
                            <ul class="nav-dropdown-menu" role="menu">
                                <li><a href="/docs.html">Getting Started</a></li>
                                <li><a href="/guide.html">Guide</a></li>
                            </ul>
                        </li>
                        
                        <li class="nav-dropdown">
                            <a href="#" class="nav-dropdown-toggle" aria-haspopup="true" aria-expanded="false">
                                Examples
                            </a>
                            <ul class="nav-dropdown-menu" role="menu">
                                <li><a href="/examples.html">All Examples</a></li>
                            </ul>
                        </li>
                    </ul>
                </nav>
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
    global.Event = window.Event;
    
    // Import module after globals are set
    const module = await import('../../public/js/ui/navigation-component.js');
    NavigationComponent = module.default;
}

/**
 * Cleanup DOM environment
 */
function teardownDOM() {
    if (NavigationComponent) {
        NavigationComponent.destroy();
    }
    if (dom) {
        dom.window.close();
    }
    delete global.window;
    delete global.document;
    delete global.CustomEvent;
    delete global.Event;
}

/**
 * Simulate click event
 */
function click(element) {
    const event = new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
    });
    element.dispatchEvent(event);
}

/**
 * Simulate keyboard event
 */
function keydown(key, target = document) {
    const event = new window.KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
    });
    target.dispatchEvent(event);
}

/**
 * Simulate mouse enter/leave
 */
function mouseenter(element) {
    const event = new window.MouseEvent('mouseenter', {
        bubbles: true,
        cancelable: true,
    });
    element.dispatchEvent(event);
}

function mouseleave(element) {
    const event = new window.MouseEvent('mouseleave', {
        bubbles: true,
        cancelable: true,
    });
    element.dispatchEvent(event);
}

/**
 * Set viewport width
 */
function setViewportWidth(width) {
    Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: width,
    });
}

/**
 * Wait for specified time
 */
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe('NavigationComponent', () => {
    describe('Initialization', () => {
        beforeEach(async () => {
            await setupDOM();
        });

        afterEach(() => {
            teardownDOM();
        });

        it('should initialize successfully', () => {
            NavigationComponent.init();
            const state = NavigationComponent.getState();
            expect(state.initialized).toBe(true);
        });

        it('should not initialize twice', () => {
            NavigationComponent.init();
            NavigationComponent.init(); // Second call
            const state = NavigationComponent.getState();
            expect(state.initialized).toBe(true);
        });

        it('should emit ready event on init', async () => {
            const readyPromise = new Promise((resolve) => {
                window.addEventListener('nav:ready', () => {
                    resolve();
                }, { once: true });
            });
            
            NavigationComponent.init();
            await readyPromise;
        });

        it('should accept configuration options', () => {
            NavigationComponent.init({ debug: true });
            const state = NavigationComponent.getState();
            assert.strictEqual(state.initialized, true);
        });
    });

    describe('Mobile Menu', () => {
        beforeEach(async () => {
            await setupDOM();
            setViewportWidth(375); // Mobile viewport
            NavigationComponent.init();
        });

        afterEach(() => {
            teardownDOM();
        });

        it('should toggle mobile menu on button click', () => {
            const toggle = document.querySelector('#mobile-menu-toggle');
            const menu = document.querySelector('#mobile-menu');
            
            click(toggle);
            assert.strictEqual(toggle.getAttribute('aria-expanded'), 'true');
            assert.strictEqual(menu.getAttribute('data-visible'), 'true');
            
            click(toggle);
            assert.strictEqual(toggle.getAttribute('aria-expanded'), 'false');
            assert.strictEqual(menu.getAttribute('data-visible'), 'false');
        });

        it('should emit toggle event when opening/closing', async () => {
            const toggle = document.querySelector('#mobile-menu-toggle');
            let eventCount = 0;
            
            const togglePromise = new Promise((resolve) => {
                window.addEventListener('nav:mobile-toggle', (e) => {
                    eventCount++;
                    if (eventCount === 1) {
                        assert.strictEqual(e.detail.open, true);
                    } else if (eventCount === 2) {
                        assert.strictEqual(e.detail.open, false);
                        resolve();
                    }
                });
            });
            
            click(toggle);
            click(toggle);
            await togglePromise;
        });

        it('should close menu on link click', () => {
            const toggle = document.querySelector('#mobile-menu-toggle');
            const link = document.querySelector('.nav-link');
            
            click(toggle); // Open
            assert.strictEqual(NavigationComponent.getState().mobileMenuOpen, true);
            
            click(link); // Click link
            assert.strictEqual(NavigationComponent.getState().mobileMenuOpen, false);
        });

        it('should close menu on outside click', () => {
            const toggle = document.querySelector('#mobile-menu-toggle');
            
            click(toggle); // Open
            assert.strictEqual(NavigationComponent.getState().mobileMenuOpen, true);
            
            click(document.body); // Click outside
            assert.strictEqual(NavigationComponent.getState().mobileMenuOpen, false);
        });

        it('should not close menu on inside click', () => {
            const toggle = document.querySelector('#mobile-menu-toggle');
            const menu = document.querySelector('#mobile-menu');
            
            click(toggle); // Open
            click(menu); // Click inside
            assert.strictEqual(NavigationComponent.getState().mobileMenuOpen, true);
        });

        it('should close menu on ESC key', () => {
            const toggle = document.querySelector('#mobile-menu-toggle');
            
            click(toggle); // Open
            keydown('Escape');
            assert.strictEqual(NavigationComponent.getState().mobileMenuOpen, false);
        });

        it('should close menu when resizing to desktop', () => {
            const toggle = document.querySelector('#mobile-menu-toggle');
            
            click(toggle); // Open
            setViewportWidth(1024); // Desktop
            window.dispatchEvent(new window.Event('resize'));
            
            assert.strictEqual(NavigationComponent.getState().mobileMenuOpen, false);
        });
    });

    describe('Dropdown Menus - Mobile', () => {
        beforeEach(async () => {
            await setupDOM();
            setViewportWidth(375); // Mobile viewport
            NavigationComponent.init();
        });

        afterEach(() => {
            teardownDOM();
        });

        it('should toggle dropdown on click (mobile)', () => {
            const dropdown = document.querySelector('.nav-dropdown');
            const toggle = dropdown.querySelector('.nav-dropdown-toggle');
            
            click(toggle);
            assert.strictEqual(toggle.getAttribute('aria-expanded'), 'true');
            assert.strictEqual(dropdown.classList.contains('open'), true);
            
            click(toggle);
            assert.strictEqual(toggle.getAttribute('aria-expanded'), 'false');
            assert.strictEqual(dropdown.classList.contains('open'), false);
        });

        it('should close other dropdowns when opening new one', () => {
            const dropdowns = document.querySelectorAll('.nav-dropdown');
            const dropdown1 = dropdowns[0];
            const dropdown2 = dropdowns[1];
            const toggle1 = dropdown1.querySelector('.nav-dropdown-toggle');
            const toggle2 = dropdown2.querySelector('.nav-dropdown-toggle');
            
            click(toggle1); // Open first
            assert.strictEqual(dropdown1.classList.contains('open'), true);
            
            click(toggle2); // Open second
            assert.strictEqual(dropdown1.classList.contains('open'), false);
            assert.strictEqual(dropdown2.classList.contains('open'), true);
        });
    });

    describe('Dropdown Menus - Desktop', () => {
        beforeEach(async () => {
            await setupDOM();
            setViewportWidth(1024); // Desktop viewport
            NavigationComponent.init();
        });

        afterEach(() => {
            teardownDOM();
        });

        it('should open dropdown on hover (desktop)', () => {
            const dropdown = document.querySelector('.nav-dropdown');
            const toggle = dropdown.querySelector('.nav-dropdown-toggle');
            
            mouseenter(dropdown);
            assert.strictEqual(toggle.getAttribute('aria-expanded'), 'true');
            assert.strictEqual(dropdown.classList.contains('open'), true);
        });

        it('should close dropdown on mouse leave with delay (desktop)', async () => {
            const dropdown = document.querySelector('.nav-dropdown');
            
            mouseenter(dropdown);
            assert.strictEqual(dropdown.classList.contains('open'), true);
            
            mouseleave(dropdown);
            // Should still be open immediately
            assert.strictEqual(dropdown.classList.contains('open'), true);
            
            // Wait for delay
            await wait(250);
            assert.strictEqual(dropdown.classList.contains('open'), false);
        });

        it('should cancel close if re-entering dropdown', async () => {
            const dropdown = document.querySelector('.nav-dropdown');
            
            mouseenter(dropdown);
            mouseleave(dropdown);
            
            // Re-enter before delay
            await wait(50);
            mouseenter(dropdown);
            
            // Wait past original delay
            await wait(250);
            assert.strictEqual(dropdown.classList.contains('open'), true);
        });

        it('should close dropdown on outside click', () => {
            const dropdown = document.querySelector('.nav-dropdown');
            
            mouseenter(dropdown);
            assert.strictEqual(dropdown.classList.contains('open'), true);
            
            click(document.body);
            assert.strictEqual(dropdown.classList.contains('open'), false);
        });

        it('should not close dropdown on inside click', () => {
            const dropdown = document.querySelector('.nav-dropdown');
            const menu = dropdown.querySelector('.nav-dropdown-menu');
            
            mouseenter(dropdown);
            click(menu);
            assert.strictEqual(dropdown.classList.contains('open'), true);
        });
    });

    describe('Keyboard Navigation', () => {
        beforeEach(async () => {
            await setupDOM();
            NavigationComponent.init();
        });

        afterEach(() => {
            teardownDOM();
        });

        it('should close menu and dropdowns on ESC key', () => {
            const toggle = document.querySelector('#mobile-menu-toggle');
            const dropdown = document.querySelector('.nav-dropdown');
            
            click(toggle);
            mouseenter(dropdown);
            
            keydown('Escape');
            
            assert.strictEqual(NavigationComponent.getState().mobileMenuOpen, false);
            assert.strictEqual(dropdown.classList.contains('open'), false);
        });

        it('should focus toggle button after ESC', () => {
            const toggle = document.querySelector('#mobile-menu-toggle');
            
            click(toggle);
            keydown('Escape');
            
            assert.strictEqual(document.activeElement, toggle);
        });

        it('should handle tab navigation in dropdown', () => {
            const dropdown = document.querySelector('.nav-dropdown');
            const toggle = dropdown.querySelector('.nav-dropdown-toggle');
            const links = dropdown.querySelectorAll('a');
            
            mouseenter(dropdown);
            toggle.focus();
            
            // Tab through links
            keydown('Tab');
            // Dropdown should stay open while tabbing through
            assert.strictEqual(dropdown.classList.contains('open'), true);
        });
    });

    describe('API Methods', () => {
        beforeEach(async () => {
            await setupDOM();
            NavigationComponent.init();
        });

        afterEach(() => {
            teardownDOM();
        });

        it('should toggle mobile menu programmatically', () => {
            NavigationComponent.toggleMobileMenu();
            assert.strictEqual(NavigationComponent.getState().mobileMenuOpen, true);
            
            NavigationComponent.toggleMobileMenu();
            assert.strictEqual(NavigationComponent.getState().mobileMenuOpen, false);
        });

        it('should close mobile menu programmatically', () => {
            NavigationComponent.toggleMobileMenu();
            NavigationComponent.closeMobileMenu();
            assert.strictEqual(NavigationComponent.getState().mobileMenuOpen, false);
        });

        it('should open dropdown programmatically', () => {
            const dropdown = document.querySelector('.nav-dropdown');
            NavigationComponent.openDropdown(dropdown);
            assert.strictEqual(dropdown.classList.contains('open'), true);
        });

        it('should close dropdown programmatically', () => {
            const dropdown = document.querySelector('.nav-dropdown');
            NavigationComponent.openDropdown(dropdown);
            NavigationComponent.closeDropdown(dropdown);
            assert.strictEqual(dropdown.classList.contains('open'), false);
        });

        it('should close all dropdowns', () => {
            const dropdowns = document.querySelectorAll('.nav-dropdown');
            dropdowns.forEach(d => NavigationComponent.openDropdown(d));
            
            NavigationComponent.closeAllDropdowns();
            
            dropdowns.forEach(d => {
                assert.strictEqual(d.classList.contains('open'), false);
            });
        });

        it('should get current state', () => {
            const state = NavigationComponent.getState();
            assert.strictEqual(typeof state.initialized, 'boolean');
            assert.strictEqual(typeof state.mobileMenuOpen, 'boolean');
            assert.strictEqual(typeof state.isMobile, 'boolean');
        });

        it('should configure component', () => {
            NavigationComponent.configure({ debug: true });
            // Configuration should be updated (internal state)
        });

        it('should enable/disable debug mode', () => {
            NavigationComponent.enableDebug();
            NavigationComponent.disableDebug();
            // Should not throw errors
        });
    });

    describe('Cleanup', () => {
        beforeEach(async () => {
            await setupDOM();
            NavigationComponent.init();
        });

        afterEach(() => {
            teardownDOM();
        });

        it('should destroy successfully', () => {
            NavigationComponent.destroy();
            const state = NavigationComponent.getState();
            assert.strictEqual(state.initialized, false);
        });

        it('should remove all event listeners on destroy', () => {
            const toggle = document.querySelector('#mobile-menu-toggle');
            
            NavigationComponent.destroy();
            
            click(toggle);
            // Should not toggle (no listeners)
            assert.strictEqual(NavigationComponent.getState().mobileMenuOpen, false);
        });

        it('should clear dropdown timers on destroy', async () => {
            const dropdown = document.querySelector('.nav-dropdown');
            
            mouseenter(dropdown);
            mouseleave(dropdown);
            NavigationComponent.destroy();
            
            await wait(250);
            // Should not throw errors from cleared timers
        });

        it('should reset state on destroy', () => {
            const toggle = document.querySelector('#mobile-menu-toggle');
            click(toggle); // Open menu
            
            NavigationComponent.destroy();
            
            const state = NavigationComponent.getState();
            assert.strictEqual(state.mobileMenuOpen, false);
            assert.strictEqual(state.activeDropdown, null);
        });
    });

    describe('Edge Cases', () => {
        beforeEach(async () => {
            await setupDOM();
            NavigationComponent.init();
        });

        afterEach(() => {
            teardownDOM();
        });

        it('should handle missing elements gracefully', async () => {
            teardownDOM();
            await setupDOM();
            
            // Remove toggle button
            const toggle = document.querySelector('#mobile-menu-toggle');
            toggle.remove();
            
            // Should not throw
            NavigationComponent.init();
        });

        it('should handle page visibility changes', () => {
            const toggle = document.querySelector('#mobile-menu-toggle');
            const dropdown = document.querySelector('.nav-dropdown');
            
            click(toggle);
            mouseenter(dropdown);
            
            // Simulate page becoming hidden
            Object.defineProperty(document, 'hidden', {
                writable: true,
                configurable: true,
                value: true,
            });
            document.dispatchEvent(new window.Event('visibilitychange'));
            
            assert.strictEqual(NavigationComponent.getState().mobileMenuOpen, false);
            assert.strictEqual(dropdown.classList.contains('open'), false);
        });

        it('should handle rapid toggle clicks', () => {
            const toggle = document.querySelector('#mobile-menu-toggle');
            
            click(toggle);
            click(toggle);
            click(toggle);
            click(toggle);
            
            // Should end in closed state
            assert.strictEqual(NavigationComponent.getState().mobileMenuOpen, false);
        });

        it('should handle simultaneous dropdown hovers', async () => {
            setViewportWidth(1024);
            const dropdowns = document.querySelectorAll('.nav-dropdown');
            
            mouseenter(dropdowns[0]);
            mouseenter(dropdowns[1]);
            
            // Only last hovered should be active
            assert.strictEqual(dropdowns[0].classList.contains('open'), false);
            assert.strictEqual(dropdowns[1].classList.contains('open'), true);
        });
    });
});
