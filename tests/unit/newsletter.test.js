/**
 * Newsletter Module Unit Tests
 * 
 * Tests for the newsletter subscription feature including:
 * - Email validation
 * - Form submission
 * - Error handling
 * - Loading states
 * - API integration
 * 
 * Run with: npm test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { isValidEmail, subscribeToNewsletter, init, destroy } from '../public/js/features/newsletter.js';

// Mock global fetch
global.fetch = vi.fn();

describe('Newsletter Module', () => {
    
    describe('Email Validation', () => {
        it('should validate correct email addresses', () => {
            expect(isValidEmail('user@example.com')).toBe(true);
            expect(isValidEmail('test.user@domain.co.uk')).toBe(true);
            expect(isValidEmail('user+tag@example.com')).toBe(true);
            expect(isValidEmail('user_name@example.org')).toBe(true);
        });
        
        it('should reject invalid email addresses', () => {
            expect(isValidEmail('invalid')).toBe(false);
            expect(isValidEmail('invalid@')).toBe(false);
            expect(isValidEmail('@invalid.com')).toBe(false);
            expect(isValidEmail('invalid @example.com')).toBe(false);
            expect(isValidEmail('')).toBe(false);
            expect(isValidEmail(null)).toBe(false);
            expect(isValidEmail(undefined)).toBe(false);
        });
        
        it('should handle edge cases', () => {
            expect(isValidEmail('  user@example.com  ')).toBe(true); // Trimmed internally
            expect(isValidEmail('user@example')).toBe(false); // No TLD
            expect(isValidEmail('user..name@example.com')).toBe(false); // Double dots
        });
    });
    
    describe('API Subscription', () => {
        beforeEach(() => {
            // Reset fetch mock before each test
            global.fetch.mockReset();
        });
        
        it('should successfully subscribe with valid email', async () => {
            // Mock successful API response
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, message: 'Subscribed successfully' })
            });
            
            const result = await subscribeToNewsletter('user@example.com');
            
            expect(global.fetch).toHaveBeenCalledWith(
                '/newsletter-subscribe',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                })
            );
            
            expect(result).toEqual({ success: true, message: 'Subscribed successfully' });
        });
        
        it('should handle already subscribed error', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({ error: 'Email already exists' })
            });
            
            await expect(subscribeToNewsletter('existing@example.com'))
                .rejects.toThrow('already_subscribed');
        });
        
        it('should detect spam via honeypot', async () => {
            await expect(subscribeToNewsletter('spam@example.com', { honeypot: 'bot-filled-this' }))
                .rejects.toThrow('spam');
            
            // Should not call API if honeypot is filled
            expect(global.fetch).not.toHaveBeenCalled();
        });
        
        it('should handle network errors', async () => {
            global.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
            
            await expect(subscribeToNewsletter('user@example.com'))
                .rejects.toThrow();
        });
        
        it('should send correct payload to API', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true })
            });
            
            await subscribeToNewsletter('User@Example.COM', { consent: true });
            
            const callArgs = global.fetch.mock.calls[0][1];
            const body = JSON.parse(callArgs.body);
            
            // Should lowercase and trim email
            expect(body.email).toBe('user@example.com');
            expect(body.attributes.CONSENT).toBe(true);
            expect(body.attributes.SIGNUP_SOURCE).toBe('website');
            expect(body._listIds).toEqual([3]);
            expect(body._updateEnabled).toBe(false);
        });
    });
    
    describe('Form Initialization', () => {
        let container;
        
        beforeEach(() => {
            // Create a container with a newsletter form
            container = document.createElement('div');
            container.innerHTML = `
                <form data-newsletter-form>
                    <input type="email" name="email" required>
                    <input type="checkbox" name="consent" required>
                    <button type="submit">Subscribe</button>
                </form>
            `;
            document.body.appendChild(container);
        });
        
        afterEach(() => {
            // Cleanup
            destroy();
            document.body.removeChild(container);
        });
        
        it('should find and initialize newsletter forms', () => {
            init();
            
            const form = container.querySelector('form');
            const honeypot = form.querySelector('input[name="website"]');
            
            // Should add honeypot field
            expect(honeypot).toBeTruthy();
            expect(honeypot.style.position).toBe('absolute');
            expect(honeypot.tabIndex).toBe(-1);
        });
        
        it('should not initialize the same form twice', () => {
            init();
            const form = container.querySelector('form');
            const honeypots = form.querySelectorAll('input[name="website"]');
            
            expect(honeypots.length).toBe(1);
            
            // Call init again
            init();
            const honeypotsAfter = form.querySelectorAll('input[name="website"]');
            
            // Should still be only 1 honeypot
            expect(honeypotsAfter.length).toBe(1);
        });
        
        it('should handle multiple forms on the page', () => {
            // Add second form
            const form2 = document.createElement('form');
            form2.setAttribute('data-newsletter-form', '');
            form2.innerHTML = `
                <input type="email" name="email" required>
                <button type="submit">Subscribe</button>
            `;
            container.appendChild(form2);
            
            init();
            
            const forms = container.querySelectorAll('form[data-newsletter-form]');
            expect(forms.length).toBe(2);
            
            // Both should have honeypots
            forms.forEach(form => {
                expect(form.querySelector('input[name="website"]')).toBeTruthy();
            });
        });
    });
    
    describe('Form Submission', () => {
        let container, form;
        
        beforeEach(() => {
            container = document.createElement('div');
            container.innerHTML = `
                <form data-newsletter-form>
                    <input type="email" name="email" value="test@example.com" required>
                    <input type="checkbox" name="consent" checked required>
                    <button type="submit">Subscribe</button>
                </form>
            `;
            document.body.appendChild(container);
            form = container.querySelector('form');
            
            // Mock successful API response
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ success: true })
            });
            
            init();
        });
        
        afterEach(() => {
            destroy();
            document.body.removeChild(container);
            global.fetch.mockReset();
        });
        
        it('should prevent default form submission', () => {
            const event = new Event('submit', { bubbles: true, cancelable: true });
            const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
            
            form.dispatchEvent(event);
            
            expect(preventDefaultSpy).toHaveBeenCalled();
        });
        
        it('should disable form elements during submission', async () => {
            const submitBtn = form.querySelector('button[type="submit"]');
            const emailInput = form.querySelector('input[type="email"]');
            
            // Trigger submission
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            
            // Wait for next tick
            await new Promise(resolve => setTimeout(resolve, 0));
            
            // Elements should be disabled during submission
            // Note: This test needs to run quickly before async completes
            expect(submitBtn.textContent).toContain('Subscribing');
        });
        
        it('should show success message on successful subscription', async () => {
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            
            // Wait for async operations
            await vi.waitFor(() => {
                const message = form.querySelector('.form-message');
                return message && message.style.display !== 'none';
            });
            
            const message = form.querySelector('.form-message');
            expect(message).toBeTruthy();
            expect(message.className).toContain('success');
            expect(message.textContent).toContain('Thanks for subscribing');
        });
        
        it('should show error message on failure', async () => {
            // Mock API error
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => ({ error: 'Server error' })
            });
            
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            
            // Wait for async operations
            await vi.waitFor(() => {
                const message = form.querySelector('.form-message');
                return message && message.style.display !== 'none';
            });
            
            const message = form.querySelector('.form-message');
            expect(message).toBeTruthy();
            expect(message.className).toContain('error');
        });
        
        it('should validate email before submission', () => {
            const emailInput = form.querySelector('input[type="email"]');
            emailInput.value = 'invalid-email';
            
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            
            // Should not call API with invalid email
            expect(global.fetch).not.toHaveBeenCalled();
        });
        
        it('should require consent checkbox if present', () => {
            const consentCheckbox = form.querySelector('input[type="checkbox"]');
            consentCheckbox.checked = false;
            
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            
            // Should not call API without consent
            expect(global.fetch).not.toHaveBeenCalled();
        });
        
        it('should reset form after successful submission', async () => {
            const emailInput = form.querySelector('input[type="email"]');
            emailInput.value = 'test@example.com';
            
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            
            // Wait for async operations
            await vi.waitFor(() => {
                return emailInput.value === '';
            });
            
            expect(emailInput.value).toBe('');
        });
    });
    
    describe('Analytics Tracking', () => {
        let container, form;
        
        beforeEach(() => {
            // Mock gtag
            global.gtag = vi.fn();
            
            container = document.createElement('div');
            container.innerHTML = `
                <form data-newsletter-form>
                    <input type="email" name="email" value="test@example.com" required>
                    <button type="submit">Subscribe</button>
                </form>
            `;
            document.body.appendChild(container);
            form = container.querySelector('form');
            
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ success: true })
            });
            
            init();
        });
        
        afterEach(() => {
            destroy();
            document.body.removeChild(container);
            global.fetch.mockReset();
            delete global.gtag;
        });
        
        it('should track successful subscription', async () => {
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            
            await vi.waitFor(() => {
                return global.gtag.mock.calls.some(call => 
                    call[1] === 'newsletter_subscribe_success'
                );
            });
            
            expect(global.gtag).toHaveBeenCalledWith(
                'event',
                'newsletter_subscribe_success',
                expect.objectContaining({
                    email_domain: 'example.com'
                })
            );
        });
        
        it('should track validation errors', () => {
            const emailInput = form.querySelector('input[type="email"]');
            emailInput.value = 'invalid';
            
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            
            // Should dispatch custom event for errors
            const eventSpy = vi.fn();
            window.addEventListener('newsletter:event', eventSpy);
            
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            
            expect(eventSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: expect.objectContaining({
                        eventName: 'newsletter_error',
                        data: expect.objectContaining({
                            error_type: 'invalid_email'
                        })
                    })
                })
            );
        });
    });
});
