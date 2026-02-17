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

        // Scroll to bottom to trigger any lazy loading
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000); // Wait for lazy content to load

        // Intercept the newsletter API call to simulate loading
        let routeCompleteResolve;
        const routeComplete = new Promise(r => { routeCompleteResolve = r; });
        await page.route('**/newsletter-subscribe', async route => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, message: 'Subscribed successfully!' }),
            });
            // signal the test that the mocked route completed
            if (typeof routeCompleteResolve === 'function') routeCompleteResolve(true);
        });

        // Ensure newsletter module has loaded and handlers are attached (deferred init)
        await page.waitForFunction(() => !!(window.NewsletterAPI && typeof window.NewsletterAPI.init === 'function'), { timeout: 10000 });
        await page.evaluate(() => { if (window.NewsletterAPI && typeof window.NewsletterAPI.init === 'function') window.NewsletterAPI.init(); });

        // Use a newsletter form (not necessarily visible, for mobile compatibility)
        const form = page.locator('form[data-newsletter-form]').first();
        // Ensure the form is in viewport
        await form.scrollIntoViewIfNeeded();
        const emailLocator = form.locator('input[name="email"]');
        const submitLocator = form.locator('button[type="submit"]');
        const consentLocator = form.locator('input[name="consent"]');
        // Ensure inputs are visible and interactable, then fill
        await emailLocator.waitFor({ state: 'visible', timeout: 5000 });
        await emailLocator.fill('test@example.com');
        await consentLocator.waitFor({ state: 'visible', timeout: 5000 });
        await consentLocator.check();
        // Diagnostic: ensure consent checkbox is actually checked (avoids silent misses on mobile)
        expect(await consentLocator.isChecked()).toBe(true);

        // Install a DOM hook to catch the transient setting of `data-loading` (avoids race between set/reset)
        await page.evaluate(() => {
            if (!window.__orig_setAttribute_for_tests) {
                window.__orig_setAttribute_for_tests = Element.prototype.setAttribute;
            }
            window.__newsletter_loading_seen = false;
            Element.prototype.setAttribute = function(name, value) {
                try {
                    if (String(name) === 'data-loading' && String(value) === 'true') {
                        window.__newsletter_loading_seen = true;
                    }
                } catch (e) {
                    // ignore
                }
                return window.__orig_setAttribute_for_tests.apply(this, arguments);
            };
        });

        // Submit form
        await submitLocator.click();

        // Assert the DOM hook observed the loading state (reliable even if it's cleared quickly)
        const sawLoading = await page.evaluate(() => !!window.__newsletter_loading_seen);
        expect(sawLoading).toBe(true);

        // Also assert visible button ARIA/disabled state where possible
        await expect(submitLocator).toBeDisabled({ timeout: 5000 });
        await expect(submitLocator).toHaveAttribute('aria-busy', 'true', { timeout: 5000 });

        // Remove DOM hook
        await page.evaluate(() => {
            if (window.__orig_setAttribute_for_tests) {
                Element.prototype.setAttribute = window.__orig_setAttribute_for_tests;
                delete window.__orig_setAttribute_for_tests;
            }
            delete window.__newsletter_loading_seen;
        });
        // Wait for the mocked response to be fulfilled before tearing down
        await Promise.race([
            routeComplete,
            new Promise((_, reject) => setTimeout(() => reject(new Error('mock route did not complete in time')), 4000))
        ]);

        // Cleanup route
        await page.context().unroute('**/newsletter-subscribe');
    });

    test('Subscribe form handles successful API response', async ({ page }) => {
        await page.goto(`${BASE}/index.html`);

        const form = page.locator('form[data-newsletter-form]:visible');
        const emailLocator = form.locator('input[name="email"]');
        const submitLocator = form.locator('button[type="submit"]');
        const consentLocator = form.locator('input[name="consent"]');
        const messageLocator = form.locator('.form-message');

        // Mock successful API response
        await page.evaluate(() => {
            window.__originalFetchForTests = window.fetch;
            window.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
        });

        // Fill and submit form
        await emailLocator.fill('test@example.com');
        await consentLocator.check();
        await submitLocator.click();

        // Wait for visible success message (more reliable than fixed timeout)
        await messageLocator.waitFor({ state: 'visible', timeout: 5000 });
        const messageText = (await messageLocator.textContent()) || '';
        const messageClass = (await messageLocator.getAttribute('class')) || '';

        // Accept either the friendly copy or alternate success variants
        expect(messageText.toLowerCase()).toMatch(/thanks for subscrib|successfully subscribed|subscribed/i);
        expect(messageClass).toContain('success');

        // Check form is reset (email cleared)
        expect(await emailLocator.inputValue()).toBe('');

        // Restore fetch
        await page.evaluate(() => { if (window.__originalFetchForTests) window.fetch = window.__originalFetchForTests; });
    });

    test('Subscribe form handles API error response', async ({ page }) => {
        await page.goto(`${BASE}/index.html`);

        const form = page.locator('form[data-newsletter-form]:visible');
        const emailLocator = form.locator('input[name="email"]');
        const submitLocator = form.locator('button[type="submit"]');
        const consentLocator = form.locator('input[name="consent"]');
        const messageLocator = form.locator('.form-message');

        // Mock error API response that triggers "already subscribed"
        await page.evaluate(() => {
            window.__originalFetchForTests = window.fetch;
            window.fetch = () => Promise.resolve({ ok: false, status: 400, json: () => Promise.resolve({ error: 'Contact already exists' }) });
        });

        // Fill and submit form
        await emailLocator.fill('existing@example.com');
        await consentLocator.check();
        await submitLocator.click();

        // Wait for visible error message and assert tolerant text matching
        await messageLocator.waitFor({ state: 'visible', timeout: 5000 });
        const messageText = (await messageLocator.textContent()) || '';
        const messageClass = (await messageLocator.getAttribute('class')) || '';

        expect(messageText.toLowerCase()).toMatch(/already|already subscribed|contact already exists/i);
        expect(messageClass).toContain('error');

        // Check form is not reset (email remains)
        expect(await emailLocator.inputValue()).toBe('existing@example.com');

        // Restore fetch
        await page.evaluate(() => { if (window.__originalFetchForTests) window.fetch = window.__originalFetchForTests; });
    });

    test('Subscribe form handles network error', async ({ page }) => {
        await page.goto(`${BASE}/index.html`);

        const form = page.locator('form[data-newsletter-form]:visible');
        const emailLocator = form.locator('input[name="email"]');
        const submitLocator = form.locator('button[type="submit"]');
        const consentLocator = form.locator('input[name="consent"]');
        const messageLocator = form.locator('.form-message');

        // Mock network error
        await page.evaluate(() => {
            window.__originalFetchForTests = window.fetch;
            window.fetch = () => Promise.reject(new TypeError('Failed to fetch'));
        });

        // Fill and submit form
        await emailLocator.fill('test@example.com');
        await consentLocator.check();
        await submitLocator.click();

        // Wait for visible error message
        await messageLocator.waitFor({ state: 'visible', timeout: 5000 });
        const messageText = (await messageLocator.textContent()) || '';
        const messageClass = (await messageLocator.getAttribute('class')) || '';

        expect(messageText.toLowerCase()).toContain('network');
        expect(messageClass).toContain('error');

        // Restore fetch
        await page.evaluate(() => { if (window.__originalFetchForTests) window.fetch = window.__originalFetchForTests; });
    });

    test('Subscribe form prevents spam via honeypot', async ({ page }) => {
        await page.goto(`${BASE}/index.html`);

        const form = page.locator('form[data-newsletter-form]:visible');
        const emailLocator = form.locator('input[name="email"]');
        const submitLocator = form.locator('button[type="submit"]');
        const consentLocator = form.locator('input[name="consent"]');
        const honeypotLocator = form.locator('input[name="website"]');

        // Intercept network requests to capture any outgoing submission
        let captured = [];
        await page.route('**/newsletter-subscribe', route => {
            captured.push({ url: route.request().url(), method: route.request().method() });
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
        });

        // Fill honeypot (spam behavior)
        await honeypotLocator.fill('spam content');
        await emailLocator.fill('test@example.com');
        await consentLocator.check();
        await submitLocator.click();

        // Wait briefly for potential requests
        await page.waitForTimeout(500);

        // When honeypot is filled the module must NOT call the API
        expect(captured.length).toBe(0);

        // Cleanup route
        await page.unroute('**/newsletter-subscribe');
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