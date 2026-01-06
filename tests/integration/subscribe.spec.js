import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8000';

test.describe('Newsletter Subscribe Button Integration Tests', () => {
    test('Subscribe form exists and is properly structured', async ({ page }) => {
        await page.goto(`${BASE}/index.html`);

        // Find newsletter form
        // Use the first visible newsletter form for reliable assertions
        const form = await page.waitForSelector('form[data-newsletter-form]', { state: 'visible' });
        expect(form).toBeTruthy();

        // Check required form elements exist
        const emailInput = await form.$('input[name="email"]');
        const submitButton = await form.$('button[type="submit"]');
        const honeypot = await form.$('input[name="website"]');
        const consentCheckbox = await form.$('input[name="consent"]');
        const messageArea = await form.$('.form-message');

        expect(emailInput).toBeTruthy();
        expect(submitButton).toBeTruthy();
        expect(honeypot).toBeTruthy();
        expect(consentCheckbox).toBeTruthy();
        expect(messageArea).toBeTruthy();

        // Check accessibility attributes
        const emailAriaDescribedBy = await emailInput.getAttribute('aria-describedby');
        const messageAriaLive = await messageArea.getAttribute('aria-live');
        const messageRole = await messageArea.getAttribute('role');

        expect(emailAriaDescribedBy).toBeTruthy();
        expect(messageAriaLive).toBe('polite');
        expect(messageRole).toBe('status');
    });

    test('Subscribe form validates email input', async ({ page }) => {
        await page.goto(`${BASE}/index.html`);

        // Prefer the visible instance of the newsletter form
        const form = await page.waitForSelector('form[data-newsletter-form]', { state: 'visible' });
        const emailInput = await form.$('input[name="email"]');
        const submitButton = await form.$('button[type="submit"]');

        // Test invalid email
        await emailInput.fill('invalid-email');
        await submitButton.click();

        // Check if browser validation prevents submission (HTML5 validation)
        // Check immediately without waiting as HTML5 validation is synchronous
        const isValid = await emailInput.evaluate(el => el.checkValidity());
        expect(isValid).toBe(false);
    });

    test('Subscribe form requires consent checkbox', async ({ page }) => {
        await page.goto(`${BASE}/index.html`);

        // Prefer the first visible newsletter form to avoid interacting with hidden copies
        const formLocator = page.locator('form[data-newsletter-form]:visible');
        const emailLocator = formLocator.locator('input[name="email"]');
        const submitLocator = formLocator.locator('button[type="submit"]');
        const consentLocator = formLocator.locator('input[name="consent"]');

        // Wait for the input to be attached and visible to avoid intermittent timing issues
        await emailLocator.waitFor({ state: 'visible', timeout: 5000 });
        await emailLocator.fill('test@example.com');

        // Submit the form without checking consent
        await submitLocator.click();

        // Small wait for validation UI to appear
        await page.waitForTimeout(500);

        // Check if consent is required (HTML5 constraint validation)
        const consentValid = await consentLocator.evaluate(el => el.checkValidity());
        expect(consentValid).toBe(false);
    });

    test('Subscribe form submission shows loading state', async ({ page }) => {
        await page.goto(`${BASE}/index.html`);

        // Use a visible newsletter form to interact with real inputs
        const form = await page.waitForSelector('form[data-newsletter-form]', { state: 'visible' });
        const emailInput = await form.$('input[name="email"]');
        const submitButton = await form.$('button[type="submit"]');
        const consentCheckbox = await form.$('input[name="consent"]');

        // Mock fetch to delay response
        await page.evaluate(() => {
            window.originalFetch = window.fetch;
            window.fetch = () => new Promise(resolve => setTimeout(() => resolve({
                ok: true,
                json: () => Promise.resolve({ success: true, message: 'Subscribed successfully!' })
            }), 1000));
        });

        // Fill form properly
        await emailInput.fill('test@example.com');
        await consentCheckbox.check();

        // Submit form
        await submitButton.click();

        // Check loading state immediately with a short timeout
        // Accept either disabled attribute, a loading ARIA state, or button text indicating loading
        try {
            await page.waitForFunction(
                (btn) => btn.disabled || (btn.textContent && btn.textContent.toLowerCase().includes('subscrib')) || btn.getAttribute('aria-busy') === 'true',
                submitButton,
                { timeout: 2000 }
            );

            // Check loading state
            const isDisabled = await submitButton.evaluate(el => el.disabled);
            const buttonText = await submitButton.textContent();

            expect(isDisabled).toBe(true);
            expect(buttonText.toLowerCase()).toContain('subscrib');
        } finally {
            // Restore fetch
            await page.evaluate(() => {
                if (window.originalFetch) {
                    window.fetch = window.originalFetch;
                }
            });
        }
    });

    test('Subscribe form handles successful API response', async ({ page }) => {
        await page.goto(`${BASE}/index.html`);

        // Use a visible newsletter form to interact with real inputs
        const form = await page.waitForSelector('form[data-newsletter-form]', { state: 'visible' });
        const emailInput = await form.$('input[name="email"]');
        const submitButton = await form.$('button[type="submit"]');
        const consentCheckbox = await form.$('input[name="consent"]');
        const messageArea = await form.$('.form-message');

        try {
            // Mock successful API response
            await page.evaluate(() => {
                window.originalFetch = window.fetch;
                window.fetch = () => Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        success: true,
                        message: 'Successfully subscribed! Check your email for confirmation.'
                    })
                });
            });

            // Fill and submit form
            await emailInput.fill('test@example.com');
            await consentCheckbox.check();
            await submitButton.click();

            // Wait for response with shorter timeout
            await page.waitForTimeout(500);

            // Check success message
            const messageText = await messageArea.textContent();
            const messageClass = await messageArea.getAttribute('class');

            expect(messageText).toContain('Thanks for subscribing');
            expect(messageClass).toContain('success');

            // Check form is reset (email cleared, but consent may stay checked)
            const emailValue = await emailInput.inputValue();
            expect(emailValue).toBe('');
        } finally {
            // Restore fetch
            await page.evaluate(() => {
                if (window.originalFetch) {
                    window.fetch = window.originalFetch;
                }
            });
        }
    });

    test('Subscribe form handles API error response', async ({ page }) => {
        await page.goto(`${BASE}/index.html`);

        // Use a visible newsletter form to interact with real inputs
        const form = await page.waitForSelector('form[data-newsletter-form]', { state: 'visible' });
        const emailInput = await form.$('input[name="email"]');
        const submitButton = await form.$('button[type="submit"]');
        const consentCheckbox = await form.$('input[name="consent"]');
        const messageArea = await form.$('.form-message');

        try {
            // Mock error API response that triggers "already subscribed"
            await page.evaluate(() => {
                window.originalFetch = window.fetch;
                window.fetch = () => Promise.resolve({
                    ok: false,
                    status: 400,
                    json: () => Promise.resolve({
                        error: 'Contact already exists'
                    })
                });
            });

            // Fill and submit form
            await emailInput.fill('existing@example.com');
            await consentCheckbox.check();
            await submitButton.click();

            // Wait for response with shorter timeout
            await page.waitForTimeout(500);

            // Check error message
            const messageText = await messageArea.textContent();
            const messageClass = await messageArea.getAttribute('class');

            expect(messageText).toContain('already subscribed');
            expect(messageClass).toContain('error');

            // Check form is not reset
            const emailValue = await emailInput.inputValue();
            expect(emailValue).toBe('existing@example.com');
        } finally {
            // Restore fetch
            await page.evaluate(() => {
                if (window.originalFetch) {
                    window.fetch = window.originalFetch;
                }
            });
        }
    });

    test('Subscribe form handles network error', async ({ page }) => {
        await page.goto(`${BASE}/index.html`);

        const form = await page.$('form[data-newsletter-form]');
        const emailInput = await form.$('input[name="email"]');
        const submitButton = await form.$('button[type="submit"]');
        const consentCheckbox = await form.$('input[name="consent"]');
        const messageArea = await form.$('.form-message');

        // Mock network error
        await page.evaluate(() => {
            window.originalFetch = window.fetch;
            window.fetch = () => Promise.reject(new TypeError('Failed to fetch'));
        });

        // Fill and submit form
        await emailInput.fill('test@example.com');
        await consentCheckbox.check();
        await submitButton.click();

        // Wait for error handling
        await page.waitForTimeout(1000);

        // Check error message
        const messageText = await messageArea.textContent();
        const messageClass = await messageArea.getAttribute('class');

        expect(messageText).toContain('Network error');
        expect(messageClass).toContain('error');

        // Restore fetch
        await page.evaluate(() => {
            window.fetch = window.originalFetch;
        });
    });

    test('Subscribe form prevents spam via honeypot', async ({ page }) => {
        await page.goto(`${BASE}/index.html`);

        const form = await page.waitForSelector('form[data-newsletter-form]', { state: 'visible' });
        const emailInput = await form.$('input[name="email"]');
        const submitButton = await form.$('button[type="submit"]');
        const consentCheckbox = await form.$('input[name="consent"]');
        const honeypot = await form.$('input[name="website"]');

        // Mock fetch to capture request
        let capturedRequest = null;
        await page.evaluate(() => {
            window.originalFetch = window.fetch;
            window.fetch = (url, options) => {
                capturedRequest = { url, options };
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ success: true })
                });
            };
        });

        // Fill honeypot (spam behavior)
        await honeypot.fill('spam content');
        await emailInput.fill('test@example.com');
        await consentCheckbox.check();
        await submitButton.click();

        // Wait for processing
        await page.waitForTimeout(500);

        // Check that request was not made (spam detected)
        expect(capturedRequest).toBeNull();

        // Restore fetch
        await page.evaluate(() => {
            window.fetch = window.originalFetch;
        });
    });

    test('Subscribe form handles multiple forms on page', async ({ page }) => {
        await page.goto(`${BASE}/index.html`);

        // Check that at least one visible form exists on the page
        const allForms = await page.$$('form[data-newsletter-form]');
        const visibleForms = [];
        for (const f of allForms) {
            const isVisible = await f.evaluate(el => {
                const style = window.getComputedStyle(el);
                return style && style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
            });
            if (isVisible) visibleForms.push(f);
        }

        expect(visibleForms.length).toBeGreaterThanOrEqual(1);

        // If there are multiple visible forms, test the second visible one
        if (visibleForms.length > 1) {
            // Mock successful response
            await page.evaluate(() => {
                window.originalFetch = window.fetch;
                window.fetch = () => Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ success: true, message: 'Subscribed!' })
                });
            });

            // Test the second visible form on the page
            const secondForm = visibleForms[1];
            const emailInput = await secondForm.$('input[name="email"]');
            const consentCheckbox = await secondForm.$('input[name="consent"]');
            const submitButton = await secondForm.$('button[type="submit"]');

            // Fill and submit the second form
            await emailInput.fill('test2@example.com');
            await consentCheckbox.check();
            await submitButton.click();

            // Wait for response
            await page.waitForTimeout(1000);

            // Check that the second form shows success message
            const messageArea = await secondForm.$('.form-message');
            const messageText = await messageArea.textContent();
            expect(messageText).toContain('Thanks for subscribing');

            // Restore fetch
            await page.evaluate(() => {
                window.fetch = window.originalFetch;
            });
        } else {
            // If only one visible form, just verify it exists and has proper structure
            const form = visibleForms[0];
            const emailInput = await form.$('input[name="email"]');
            const submitButton = await form.$('button[type="submit"]');
            const messageArea = await form.$('.form-message');

            expect(emailInput).toBeTruthy();
            expect(submitButton).toBeTruthy();
            expect(messageArea).toBeTruthy();
        }
    });

    test('Subscribe form has proper accessibility attributes', async ({ page }) => {
        await page.goto(`${BASE}/index.html`);

        // Target a visible form for accessibility checks
        const form = await page.waitForSelector('form[data-newsletter-form]', { state: 'visible' });
        const emailInput = await form.$('input[name="email"]');
        const submitButton = await form.$('button[type="submit"]');
        const consentCheckbox = await form.$('input[name="consent"]');
        const consentLabel = await form.$('label[for="newsletter-consent"]');
        const honeypot = await form.$('input[name="website"]');

        // Check email input accessibility
        const emailLabel = await emailInput.getAttribute('aria-label') || await page.$eval(`label[for="${await emailInput.getAttribute('id')}"]`, el => el ? el.textContent : '');
        const emailAriaDescribedBy = await emailInput.getAttribute('aria-describedby');
        const emailRequired = await emailInput.getAttribute('required') !== null;
        const emailAutocomplete = await emailInput.getAttribute('autocomplete');
        const emailInputmode = await emailInput.getAttribute('inputmode');

        expect(emailLabel).toBeTruthy();
        expect(emailAriaDescribedBy).toBeTruthy();
        expect(emailRequired).toBe(true);
        expect(emailAutocomplete).toBe('email');
        expect(emailInputmode).toBe('email');

        // Check submit button accessibility
        const buttonAriaLabel = await submitButton.getAttribute('aria-label');
        expect(buttonAriaLabel).toContain('Subscribe');

        // Check consent checkbox accessibility
        const consentRequired = await consentCheckbox.getAttribute('required') !== null;
        const consentLabelExists = await consentLabel.textContent();
        expect(consentRequired).toBe(true);
        expect(consentLabelExists.length).toBeGreaterThan(0);

        // Check honeypot is hidden from screen readers
        const honeypotAriaHidden = await honeypot.getAttribute('aria-hidden');
        const honeypotTabindex = await honeypot.getAttribute('tabindex');
        expect(honeypotAriaHidden).toBe('true');
        expect(honeypotTabindex).toBe('-1');
    });
});