import { test, expect } from '@playwright/test';

const PAGES = [
    '/',
    '/how-to-migrate-from-wrangler.html',
    '/faq.html',
    '/examples.html',
    '/wrangler-to-clodo-migration.html',
    '/ruby-on-rails-cloudflare-integration.html',
    '/serverless-framework-comparison.html',
    '/worker-scaffolding-tools.html',
    '/advanced-cloudflare-workers-tutorial.html'
];

test.describe('SEO Smoke Tests', () => {
    for (const path of PAGES) {
        test(`meta & OG present on ${path}`, async ({ page }) => {
            const resp = await page.goto(path);
            expect(resp && resp.status()).toBe(200);

            const description = await page.$eval('meta[name="description"]', el => el.content).catch(() => null);
            expect(description).toBeTruthy();

            const canonical = await page.$eval('link[rel="canonical"]', el => el.href).catch(() => null);
            expect(canonical).toBeTruthy();

            const ogTitle = await page.$eval('meta[property="og:title"]', el => el.content).catch(() => null);
            const ogDesc = await page.$eval('meta[property="og:description"]', el => el.content).catch(() => null);
            expect(ogTitle).toBeTruthy();
            expect(ogDesc).toBeTruthy();

            const twitter = await page.$eval('meta[name="twitter:card"]', el => el.content).catch(() => null);
            expect(twitter).toBeTruthy();
        });

        test(`structured data present on ${path}`, async ({ page }) => {
            await page.goto(path);
            const scripts = await page.$$eval('script[type="application/ld+json"]', scripts =>
                scripts.map(s => s.textContent).filter(Boolean)
            );
            expect(scripts.length).toBeGreaterThan(0);
            for (const s of scripts) {
                expect(() => JSON.parse(s)).not.toThrow();
                const obj = JSON.parse(s);
                expect(obj['@context']).toBeTruthy();
                expect(obj['@type']).toBeTruthy();
            }
        });
    }

    test('robots.txt contains sitemap', async ({ request }) => {
        const resp = await request.get('/robots.txt');
        expect(resp.status()).toBe(200);
        const body = await resp.text();
        expect(body).toContain('Sitemap:');
        expect(body).toMatch(/Sitemap:\s*https:\/\/[^\s]+\/sitemap.xml/);
    });

    test('sitemap.xml reachable and contains site root', async ({ request }) => {
        const resp = await request.get('/sitemap.xml');
        expect(resp.status()).toBe(200);
        const text = await resp.text();
        // Ensure sitemap references the canonical site root (www)
        expect(text).toContain('<loc>https://www.clodo.dev/</loc>');
    });
});
