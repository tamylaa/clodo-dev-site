import { describe, it, expect, beforeEach, vi } from 'vitest';
import { onRequestPost } from '../../functions/newsletter-subscribe.js';

describe('Newsletter function - non-JS fallback', () => {
    beforeEach(() => {
        // Reset global fetch
        global.fetch = vi.fn();
    });

    it('should redirect form-encoded submissions (no-JS) to thanks page on success', async () => {
        // Mock Brevo API success
        global.fetch.mockResolvedValueOnce({ status: 204, ok: true, text: async () => '' });

        const request = {
            headers: {
                get: (k) => {
                    return k === 'content-type' ? 'application/x-www-form-urlencoded' : (k === 'accept' ? 'text/html' : null);
                }
            },
            text: async () => 'email=test%40example.com&noscript=1'
        };

        const res = await onRequestPost({ request, env: { BREVO_API_KEY: 'DUMMY', BREVO_LIST_ID: '3' } });
        expect(res.status).toBe(303);
        expect(res.headers.get('Location')).toBe('/subscribe/thanks.html');
    });

    it('should return JSON for application/json requests', async () => {
        // Mock Brevo API success with JSON
        global.fetch.mockResolvedValueOnce({ ok: true, status: 200, text: async () => JSON.stringify({ success: true }), json: async () => ({ success: true }) });

        const request = {
            headers: {
                get: (k) => {
                    return k === 'content-type' ? 'application/json' : null;
                }
            },
            json: async () => ({ email: 'test@example.com' })
        };

        const res = await onRequestPost({ request, env: { BREVO_API_KEY: 'DUMMY', BREVO_LIST_ID: '3' } });
        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toContain('application/json');
        const body = JSON.parse(await res.text());
        expect(body).toBeDefined();
    });
});