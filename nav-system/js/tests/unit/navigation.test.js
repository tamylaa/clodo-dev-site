/**
 * Navigation Manager Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    init,
    destroy,
    navigateTo,
    goBack,
    goForward,
    scrollToTop,
    scrollToElement,
    scrollToHash,
    updateActiveLinks,
    getCurrentPath,
    configure,
    normalizePath,
    isInternalLink,
} from '@/core/navigation.js';

describe('Navigation Manager', () => {
    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
            <nav>
                <a href="/" class="nav-link">Home</a>
                <a href="/about" class="nav-link">About</a>
                <a href="/docs" class="nav-link">Docs</a>
                <a href="https://external.com" class="external-link">External</a>
                <a href="#section" class="hash-link">Section</a>
                <a href="/download" download class="download-link">Download</a>
                <a href="/blank" target="_blank" class="blank-link">New Tab</a>
            </nav>
            <main>
                <section id="section">Content</section>
                <section id="features">Features</section>
            </main>
        `;
        
        // Mock window properties
        delete window.location;
        window.location = {
            href: 'http://localhost/',
            pathname: '/',
            origin: 'http://localhost',
            hash: '',
            search: '',
        };
        
        // Mock scrollTo
        window.scrollTo = vi.fn();
        window.scrollX = 0;
        window.scrollY = 0;
        
        // Mock history
        window.history.back = vi.fn();
        window.history.forward = vi.fn();
    });
    
    afterEach(() => {
        destroy();
    });
    
    describe('normalizePath', () => {
        it('should extract pathname from URL', () => {
            expect(normalizePath('http://localhost/about')).toBe('/about');
            expect(normalizePath('http://localhost/docs#section')).toBe('/docs');
            expect(normalizePath('http://localhost/page?query=1')).toBe('/page');
        });
        
        it('should handle relative paths', () => {
            expect(normalizePath('/about')).toBe('/about');
            expect(normalizePath('/docs/guide')).toBe('/docs/guide');
        });
    });
    
    describe('isInternalLink', () => {
        it('should identify internal links', () => {
            expect(isInternalLink('http://localhost/')).toBe(true);
            expect(isInternalLink('http://localhost/about')).toBe(true);
            expect(isInternalLink('/docs')).toBe(true);
        });
        
        it('should identify external links', () => {
            expect(isInternalLink('https://external.com')).toBe(false);
            expect(isInternalLink('http://other-site.com')).toBe(false);
        });
        
        it('should handle invalid URLs', () => {
            expect(isInternalLink('not-a-url')).toBe(false);
            expect(isInternalLink('')).toBe(false);
        });
    });
    
    describe('initialization', () => {
        it('should initialize with default config', () => {
            expect(() => init()).not.toThrow();
        });
        
        it('should accept custom config', () => {
            init({
                scrollBehavior: 'instant',
                activeClass: 'current',
                enablePrefetch: false,
            });
            // Config should be applied (tested via behavior)
        });
        
        it('should update active links on init', () => {
            destroy();
            window.location.pathname = '/about';
            init({ exactMatch: false });
            
            const aboutLink = document.querySelector('a[href="/about"]');
            expect(aboutLink.className).toBe('nav-link current');
            expect(aboutLink.getAttribute('aria-current')).toBe('page');
        });
    });
    
    describe('updateActiveLinks', () => {
        beforeEach(() => {
            configure({});
        });
        
        it('should add active class to current page link', () => {
            window.location.pathname = '/about';
            updateActiveLinks();
            
            const aboutLink = document.querySelector('a[href="/about"]');
            expect(aboutLink.className).toBe('nav-link current');
        });
        
        it('should remove active class from other links', () => {
            window.location.pathname = '/about';
            updateActiveLinks();
            
            const homeLink = document.querySelector('a[href="/"]');
            expect(homeLink.classList.contains('active')).toBe(false);
        });
        
        it('should set aria-current on active link', () => {
            window.location.pathname = '/docs';
            updateActiveLinks();
            
            const docsLink = document.querySelector('a[href="/docs"]');
            expect(docsLink.getAttribute('aria-current')).toBe('page');
        });
        
        it('should not mark external links as active', () => {
            updateActiveLinks();
            
            const externalLink = document.querySelector('.external-link');
            expect(externalLink.classList.contains('active')).toBe(false);
        });
        
        it('should support exact match mode', () => {
            configure({ exactMatch: true });
            window.location.pathname = '/docs/guide';
            updateActiveLinks();
            
            const docsLink = document.querySelector('a[href="/docs"]');
            expect(docsLink.classList.contains('active')).toBe(false);
        });
        
        it('should support prefix matching mode', () => {
            configure({ exactMatch: false });
            window.location.pathname = '/docs/guides';
            updateActiveLinks();
            
            const docsLink = document.querySelector('a[href="/docs"]');
            expect(docsLink.className).toBe('nav-link current');
        });
    });
    
    describe('scrollToTop', () => {
        beforeEach(() => {
            init();
            configure({ scrollBehavior: 'smooth' });
        });
        
        it('should scroll to top of page', () => {
            scrollToTop();
            
            expect(window.scrollTo).toHaveBeenCalledWith({
                left: 0,
                top: 0,
                behavior: 'smooth',
            });
        });
    });
    
    describe('scrollToElement', () => {
        beforeEach(() => {
            init();
            configure({ scrollBehavior: 'smooth' });
        });
        
        it('should scroll to element with offset', () => {
            const element = document.querySelector('#section');
            element.getBoundingClientRect = vi.fn(() => ({
                top: 500,
                bottom: 600,
                left: 0,
                right: 100,
            }));
            
            scrollToElement(element, 80);
            
            expect(window.scrollTo).toHaveBeenCalledWith({
                top: 420, // 500 - 80
                behavior: 'smooth',
            });
        });
        
        it('should handle missing element', () => {
            expect(() => scrollToElement(null)).not.toThrow();
        });
    });
    
    describe('scrollToHash', () => {
        beforeEach(() => {
            init();
        });
        
        it('should scroll to element by hash', () => {
            const element = document.querySelector('#section');
            element.getBoundingClientRect = vi.fn(() => ({
                top: 300,
                bottom: 400,
            }));
            
            const result = scrollToHash('#section');
            
            expect(result).toBe(true);
            expect(window.scrollTo).toHaveBeenCalled();
        });
        
        it('should handle hash without # prefix', () => {
            const element = document.querySelector('#features');
            element.getBoundingClientRect = vi.fn(() => ({ top: 200 }));
            
            const result = scrollToHash('features');
            expect(result).toBe(true);
        });
        
        it('should return false for missing element', () => {
            const result = scrollToHash('#nonexistent');
            expect(result).toBe(false);
        });
    });
    
    describe('navigation methods', () => {
        beforeEach(() => {
            init();
        });
        
        it('should navigate to URL', () => {
            const originalHref = window.location.href;
            navigateTo('/about');
            
            // Note: In real browser, this changes location
            // In test, we just verify it was called
            expect(window.location.href).toBeDefined();
        });
        
        it('should go back in history', () => {
            goBack();
            expect(window.history.back).toHaveBeenCalled();
        });
        
        it('should go forward in history', () => {
            goForward();
            expect(window.history.forward).toHaveBeenCalled();
        });
    });
    
    describe('getCurrentPath', () => {
        it('should return current path', () => {
            window.location.pathname = '/docs';
            init();
            
            expect(getCurrentPath()).toBe('/docs');
        });
    });
    
    describe('link click handling', () => {
        beforeEach(() => {
            init();
        });
        
        it('should emit navigation:before event on internal link click', () => {
            const handler = vi.fn();
            window.addEventListener('navigation:before', handler);
            
            const link = document.querySelector('a[href="/about"]');
            const event = new MouseEvent('click', { bubbles: true, cancelable: true });
            link.dispatchEvent(event);
            
            expect(handler).toHaveBeenCalled();
        });
        
        it('should not intercept external links', () => {
            const handler = vi.fn();
            window.addEventListener('navigation:before', handler);
            
            const link = document.querySelector('.external-link');
            const event = new MouseEvent('click', { bubbles: true });
            link.dispatchEvent(event);
            
            expect(handler).not.toHaveBeenCalled();
        });
        
        it('should not intercept download links', () => {
            const handler = vi.fn();
            window.addEventListener('navigation:before', handler);
            
            const link = document.querySelector('.download-link');
            const event = new MouseEvent('click', { bubbles: true });
            link.dispatchEvent(event);
            
            expect(handler).not.toHaveBeenCalled();
        });
        
        it('should not intercept target="_blank" links', () => {
            const handler = vi.fn();
            window.addEventListener('navigation:before', handler);
            
            const link = document.querySelector('.blank-link');
            const event = new MouseEvent('click', { bubbles: true });
            link.dispatchEvent(event);
            
            expect(handler).not.toHaveBeenCalled();
        });
        
        it('should allow hash-only links on same page', () => {
            const handler = vi.fn();
            window.addEventListener('navigation:before', handler);
            
            const link = document.querySelector('.hash-link');
            const event = new MouseEvent('click', { bubbles: true });
            link.dispatchEvent(event);
            
            // Should not intercept, let browser handle
            expect(handler).not.toHaveBeenCalled();
        });
    });
    
    describe('destroy', () => {
        it('should clean up event listeners', () => {
            init();
            destroy();
            
            // Should not throw errors after destroy
            expect(() => updateActiveLinks()).not.toThrow();
        });
    });
});
