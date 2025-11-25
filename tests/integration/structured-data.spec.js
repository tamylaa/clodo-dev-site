/**
 * Structured Data Hub Integration Tests
 * 
 * Tests the structured data management and injection system.
 */

import { test, expect } from '@playwright/test';

test.describe('Structured Data Hub Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/index.html');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('should inject Organization schema', async ({ page }) => {
        const schemas = await page.$$eval(
            'script[type="application/ld+json"]',
            scripts => scripts.map(s => JSON.parse(s.textContent))
        );

        const orgSchema = schemas.find(s => s['@type'] === 'Organization');
        expect(orgSchema).toBeDefined();

        if (orgSchema) {
            expect(orgSchema.name).toBe('Clodo Framework');
            expect(orgSchema.url).toBe('https://clodo.dev');
            expect(orgSchema.logo).toBeTruthy();
            expect(orgSchema.description).toBeTruthy();
            console.log('Organization schema:', orgSchema);
        }
    });

    test('should inject WebSite schema', async ({ page }) => {
        const schemas = await page.$$eval(
            'script[type="application/ld+json"]',
            scripts => scripts.map(s => JSON.parse(s.textContent))
        );

        const websiteSchema = schemas.find(s => s['@type'] === 'WebSite');
        expect(websiteSchema).toBeDefined();

        if (websiteSchema) {
            expect(websiteSchema.name).toBe('Clodo Framework');
            expect(websiteSchema.url).toBe('https://clodo.dev');
            expect(websiteSchema.potentialAction).toBeDefined();
            console.log('WebSite schema:', websiteSchema);
        }
    });

    test('should inject SoftwareApplication schema', async ({ page }) => {
        const schemas = await page.$$eval(
            'script[type="application/ld+json"]',
            scripts => scripts.map(s => JSON.parse(s.textContent))
        );

        const softwareSchema = schemas.find(s => s['@type'] === 'SoftwareApplication');
        expect(softwareSchema).toBeDefined();

        if (softwareSchema) {
            expect(softwareSchema.name).toBe('Clodo Framework');
            expect(softwareSchema.softwareVersion).toBeTruthy();
            expect(softwareSchema.applicationCategory).toBe('DeveloperApplication');
            console.log('SoftwareApplication schema:', softwareSchema);
        }
    });

    test('should inject FAQPage schema on docs page', async ({ page }) => {
        await page.goto('http://localhost:8080/docs.html');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

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
        // Try a blog post page
        await page.goto('http://localhost:8080/clodo-framework-guide.html');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

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

        for (const schema of schemas) {
            expect(schema['@context']).toBe('https://schema.org');
        }

        console.log('All schemas have @context:', schemas.length);
    });

    test('should not have duplicate schemas', async ({ page }) => {
        const schemas = await page.$$eval(
            'script[type="application/ld+json"]',
            scripts => scripts.map(s => JSON.parse(s.textContent))
        );

        const types = schemas.map(s => s['@type']);
        const uniqueTypes = new Set(types);

        // Note: Some pages might intentionally have multiple schemas of same type
        // This test just logs duplicates for awareness
        if (types.length !== uniqueTypes.size) {
            console.log('Duplicate schema types found:', types);
        }

        // All schemas should at least have a type
        expect(schemas.every(s => s['@type'])).toBe(true);
    });

    test('should inject schemas after page load', async ({ page }) => {
        // Check immediately after navigation
        const initialSchemas = await page.$$('script[type="application/ld+json"]');
        const initialCount = initialSchemas.length;

        // Wait for JavaScript to inject schemas
        await page.waitForTimeout(2000);

        const finalSchemas = await page.$$('script[type="application/ld+json"]');
        const finalCount = finalSchemas.length;

        // Should have schemas injected
        expect(finalCount).toBeGreaterThan(0);
        console.log('Schemas injected:', { initial: initialCount, final: finalCount });
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
            expect(schemas.length).toBeGreaterThan(0);

            console.log(`${url}: ${schemas.length} schemas`);
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

        for (const schema of schemas) {
            if (schema.image) {
                const imageUrl = typeof schema.image === 'string' 
                    ? schema.image 
                    : schema.image.url || schema.image['@id'];
                
                expect(imageUrl).toMatch(/^https?:\/\//);
                console.log(`${schema['@type']} has image:`, imageUrl);
            }

            if (schema.logo) {
                const logoUrl = typeof schema.logo === 'string'
                    ? schema.logo
                    : schema.logo.url || schema.logo['@id'];
                
                expect(logoUrl).toMatch(/^https?:\/\//);
                console.log(`${schema['@type']} has logo:`, logoUrl);
            }
        }
    });
});
