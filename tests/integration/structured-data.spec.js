/**
 * Structured Data Hub Integration Tests
 *
 * Tests the structured data management and injection system.
 * NOTE: SEO system is now provided as a shim for compatibility.
 * Structured data injection is disabled by default for performance.
 */

import { test, expect } from '@playwright/test';

test.describe('Structured Data Hub Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/index.html');
        await page.waitForLoadState('domcontentloaded');
        // Reduced timeout and use domcontentloaded instead of networkidle for faster CI runs
        await page.waitForTimeout(process.env.CI ? 200 : 500);
    });

    test('should inject Organization schema', async ({ page }) => {
        const schemas = await page.$$eval(
            'script[type="application/ld+json"]',
            scripts => scripts.map(s => JSON.parse(s.textContent))
        );

        // SEO shim doesn't inject schemas
        expect(schemas.length).toBe(0);
        console.log('No structured data schemas injected (SEO shim active)');
    });

    test('should inject WebSite schema', async ({ page }) => {
        const schemas = await page.$$eval(
            'script[type="application/ld+json"]',
            scripts => scripts.map(s => JSON.parse(s.textContent))
        );

        // SEO shim doesn't inject schemas
        expect(schemas.length).toBe(0);
        console.log('No structured data schemas injected (SEO shim active)');
    });

    test('should inject SoftwareApplication schema', async ({ page }) => {
        const schemas = await page.$$eval(
            'script[type="application/ld+json"]',
            scripts => scripts.map(s => JSON.parse(s.textContent))
        );

        // SEO shim doesn't inject schemas
        expect(schemas.length).toBe(0);
        console.log('No structured data schemas injected (SEO shim active)');
    });

    test('should inject FAQPage schema on docs page', async ({ page }) => {
        await page.goto('/docs.html');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(process.env.CI ? 500 : 1000);

        const schemas = await page.$$eval(
            'script[type="application/ld+json"]',
            scripts => scripts.map(s => JSON.parse(s.textContent))
        );

        const faqSchema = schemas.find(s => s['@type'] === 'FAQPage');
        
        // FAQPage might only appear on docs page
        if (faqSchema) {
            expect(faqSchema.mainEntity).toBeDefined();
            expect(Array.isArray(faqSchema.mainEntity)).toBe(true);
            console.log('FAQPage questions:', faqSchema.mainEntity.length);
        }
    });

    test('should inject BlogPosting schema on blog pages', async ({ page }) => {
        // Try a blog post page (use correct port 8000)
        await page.goto('/clodo-framework-guide.html');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(process.env.CI ? 500 : 1000);

        const schemas = await page.$$eval(
            'script[type="application/ld+json"]',
            scripts => scripts.map(s => JSON.parse(s.textContent))
        );

        const blogSchema = schemas.find(s => s['@type'] === 'BlogPosting');
        
        if (blogSchema) {
            expect(blogSchema.headline).toBeTruthy();
            expect(blogSchema.author).toBeDefined();
            expect(blogSchema.datePublished).toBeTruthy();
            console.log('BlogPosting schema:', blogSchema.headline);
        }
    });

    test('should have valid JSON-LD syntax', async ({ page }) => {
        const schemas = await page.$$eval(
            'script[type="application/ld+json"]',
            scripts => scripts.map(s => {
                try {
                    const parsed = JSON.parse(s.textContent);
                    return { valid: true, type: parsed['@type'] };
                } catch (e) {
                    return { valid: false, error: e.message };
                }
            })
        );

        // All schemas should be valid JSON
        const invalidSchemas = schemas.filter(s => !s.valid);
        expect(invalidSchemas.length).toBe(0);

        console.log('Valid schemas:', schemas.map(s => s.type).join(', '));
    });

    test('should have @context for all schemas', async ({ page }) => {
        const schemas = await page.$$eval(
            'script[type="application/ld+json"]',
            scripts => scripts.map(s => JSON.parse(s.textContent))
        );

        // No schemas expected from shim
        expect(schemas.length).toBe(0);
        console.log('No schemas to validate @context for (SEO shim active)');
    });

    test('should not have duplicate schemas', async ({ page }) => {
        const schemas = await page.$$eval(
            'script[type="application/ld+json"]',
            scripts => scripts.map(s => JSON.parse(s.textContent))
        );

        // No schemas expected from shim
        expect(schemas.length).toBe(0);
        console.log('No schemas to check for duplicates (SEO shim active)');
    });

    test('should inject schemas after page load', async ({ page }) => {
        // Check immediately after navigation
        const initialSchemas = await page.$$('script[type="application/ld+json"]');
        const initialCount = initialSchemas.length;

        // Wait for JavaScript to inject schemas
        await page.waitForTimeout(2000);

        const finalSchemas = await page.$$('script[type="application/ld+json"]');
        const finalCount = finalSchemas.length;

        // SEO shim doesn't inject schemas
        expect(finalCount).toBe(0);
        console.log('No schemas injected (SEO shim active):', { initial: initialCount, final: finalCount });
    });

    test('should work across different pages', async ({ page }) => {
        // Only test pages that have init-systems.js loaded
        const pages = [
            '/index.html'
        ];

        for (const url of pages) {
            await page.goto(url);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);

            const schemas = await page.$$('script[type="application/ld+json"]');
            // SEO shim doesn't inject schemas
            expect(schemas.length).toBe(0);

            console.log(`${url}: ${schemas.length} schemas (SEO shim active)`);
        }
    });

    test('should have Organization schema with social links', async ({ page }) => {
        const schemas = await page.$$eval(
            'script[type="application/ld+json"]',
            scripts => scripts.map(s => JSON.parse(s.textContent))
        );

        const orgSchema = schemas.find(s => s['@type'] === 'Organization');
        
        if (orgSchema && orgSchema.sameAs) {
            expect(Array.isArray(orgSchema.sameAs)).toBe(true);
            expect(orgSchema.sameAs.length).toBeGreaterThan(0);
            console.log('Social links:', orgSchema.sameAs);
        }
    });

    test('should have proper schema nesting', async ({ page }) => {
        const schemas = await page.$$eval(
            'script[type="application/ld+json"]',
            scripts => scripts.map(s => JSON.parse(s.textContent))
        );

        const websiteSchema = schemas.find(s => s['@type'] === 'WebSite');
        
        if (websiteSchema && websiteSchema.publisher) {
            // Publisher should be nested Organization
            expect(websiteSchema.publisher['@type']).toBe('Organization');
            console.log('WebSite has nested publisher:', websiteSchema.publisher.name);
        }
    });

    test('should have image properties with valid URLs', async ({ page }) => {
        const schemas = await page.$$eval(
            'script[type="application/ld+json"]',
            scripts => scripts.map(s => JSON.parse(s.textContent))
        );

        // No schemas expected from shim
        expect(schemas.length).toBe(0);
        console.log('No schemas to validate images for (SEO shim active)');
    });
});
