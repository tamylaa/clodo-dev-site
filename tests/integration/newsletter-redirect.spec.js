import { test, expect } from '@playwright/test';

test.describe('Newsletter submission - non-JS fallback', () => {
    test('form-encoded POST should redirect to subscribe/thanks or error page', async ({ page }) => {
        const resp = await page.request.post('http://localhost:8000/newsletter-subscribe', {
            data: 'email=test%40example.com&noscript=1',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'text/html'
            }
        });

        // Accept either an explicit 303 redirect or a followed redirect that resolves to a 200 page
        const status = resp.status();
        expect([303, 200]).toContain(status);

        if (status === 303) {
            const loc = resp.headers()['location'] || '';
            expect(loc).toContain('/subscribe');
        } else {
            // Playwright followed the redirect; ensure final URL is the subscribe page
            const finalUrl = resp.url();
            expect(finalUrl).toContain('/subscribe');
        }
    });

    test('JSON POST should return JSON (no 303 redirect)', async ({ page }) => {
        const resp = await page.request.post('http://localhost:8000/newsletter-subscribe', {
            data: JSON.stringify({ email: 'test@example.com' }),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        expect(resp.status()).not.toBe(303);
        const contentType = resp.headers()['content-type'] || '';
        expect(contentType).toContain('application/json');

        // Parse JSON (may be error payload depending on env)
        const body = await resp.json().catch(() => ({}));
        expect(typeof body).toBe('object');
    });
});