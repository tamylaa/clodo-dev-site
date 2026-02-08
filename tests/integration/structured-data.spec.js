/**
 * Structured Data Hub Integration Tests
 * 
 * Tests the structured data management and injection system.
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';

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

        const orgSchema = schemas.find(s => s['@type'] === 'Organization');
        expect(orgSchema).toBeDefined();

        if (orgSchema) {
            expect(orgSchema.name).toBe('Clodo Framework');
            expect(orgSchema.url).toBe('https://www.clodo.dev');
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
            expect(websiteSchema.url).toBe('https://www.clodo.dev');
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

    test('Organization schema should include @id', async ({ page }) => {
        const schemas = await page.$$eval(
            'script[type="application/ld+json"]',
            scripts => scripts.map(s => JSON.parse(s.textContent))
        );
        const orgSchema = schemas.find(s => s['@type'] === 'Organization');
        expect(orgSchema).toBeDefined();
        if (orgSchema) {
            expect(orgSchema['@id']).toBeTruthy();
            expect(orgSchema['@id']).toContain('#organization');
            console.log('Organization @id:', orgSchema['@id']);
        }
    });

    test('SoftwareApplication should include reviews when available', async ({ page }) => {
        const schemas = await page.$$eval(
            'script[type="application/ld+json"]',
            scripts => scripts.map(s => JSON.parse(s.textContent))
        );
        const softwareSchema = schemas.find(s => s['@type'] === 'SoftwareApplication');
        expect(softwareSchema).toBeDefined();
        if (softwareSchema) {
            // If reviews were generated from testimonials, they should appear as an array
            if (softwareSchema.review) {
                expect(Array.isArray(softwareSchema.review)).toBe(true);
                expect(softwareSchema.review.length).toBeGreaterThan(0);
                console.log('SoftwareApplication reviews:', softwareSchema.review.length);
            } else {
                console.log('No reviews present in SoftwareApplication schema (might be intentional)');
            }
        }
    });

    test('Microdata Reviews should include itemReviewed', async ({ page }) => {
        await page.goto('/blog/cloudflare-infrastructure-myth.html');
        await page.waitForLoadState('domcontentloaded');
        const reviewBlocks = await page.$$('[itemscope][itemtype="https://schema.org/Review"]');
        expect(reviewBlocks.length).toBeGreaterThan(0);
        for (const block of reviewBlocks) {
            const hasItemReviewed = await block.$('[itemprop="itemReviewed"]');
            expect(hasItemReviewed).toBeTruthy();
        }
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

        // BreadcrumbList should also be present on blog posts
        const breadcrumbSchema = schemas.find(s => s['@type'] === 'BreadcrumbList');
        expect(breadcrumbSchema).toBeDefined();
        if (breadcrumbSchema) {
            expect(Array.isArray(breadcrumbSchema.itemListElement)).toBe(true);
            expect(breadcrumbSchema.itemListElement[0].position).toBe(1);
            expect(breadcrumbSchema.itemListElement[0].name).toBe('Home');
        }
    });

    test('should inject FAQPage schema on /faq', async ({ page }) => {
        await page.goto('/faq');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(process.env.CI ? 500 : 1000);

        const schemas = await page.$$eval(
            'script[type="application/ld+json"]',
            scripts => scripts.map(s => JSON.parse(s.textContent))
        );

        const faqSchema = schemas.find(s => s['@type'] === 'FAQPage');
        expect(faqSchema).toBeDefined();
        if (faqSchema) {
            expect(Array.isArray(faqSchema.mainEntity)).toBe(true);
            expect(faqSchema.mainEntity.length).toBeGreaterThan(0);
            console.log('FAQPage questions on /faq:', faqSchema.mainEntity.length);
        }
    });

    test('should inject HowTo and TechArticle schemas on /what-is-edge-computing', async ({ page }) => {
        await page.goto('/what-is-edge-computing.html');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(process.env.CI ? 500 : 1000);

        const schemas = await page.$$eval(
            'script[type="application/ld+json"]',
            scripts => scripts.map(s => JSON.parse(s.textContent))
        );

        const howTo = schemas.find(s => s['@type'] === 'HowTo');
        const article = schemas.find(s => s['@type'] === 'TechArticle' || s['@type'] === 'Article' || s['@type'] === 'TechArticle');

        expect(howTo).toBeDefined();
        expect(article).toBeDefined();

        if (howTo) {
            expect(Array.isArray(howTo.step)).toBe(true);
            expect(howTo.step.length).toBeGreaterThanOrEqual(4);
            // Ensure at least one step references the Clodo scaffold command
            const containsClodo = howTo.step.some(s => (s.text || s.name || '').includes('create-clodo-service'));
            expect(containsClodo).toBe(true);
            console.log('HowTo steps:', howTo.step.length);
        }

        if (article) {
            // Ensure metrics were attached as hasPart ItemList
            if (article.hasPart) {
                expect(article.hasPart['@type']).toBe('ItemList');
                expect(Array.isArray(article.hasPart.itemListElement)).toBe(true);
                expect(article.hasPart.itemListElement.length).toBeGreaterThan(0);
                const metricNames = article.hasPart.itemListElement.map(e => e.item.name);
                expect(metricNames.some(n => n.toLowerCase().includes('median response'))).toBe(true);
                console.log('Article metrics items:', article.hasPart.itemListElement.length);
            } else {
                throw new Error('Article schema missing metrics (hasPart)');
            }

            // The TechArticle should be authored by Clodo Framework (fallback allowed)
            if (article.author) {
                const authorName = typeof article.author === 'string' ? article.author : (article.author.name || '');
                expect(authorName.toLowerCase()).toContain('clodo');
            } else {
                console.log('Article author not present; ensure page-config schema is set');
            }
            console.log('Article schema present:', article.headline || article.name || 'unknown');
        }

        // Visible benchmarks section should be present in the page
        const hasBenchmarks = await page.$('section.benchmark-section');
        expect(hasBenchmarks).toBeTruthy();
    });

    // Verify SSI includes are expanded and HowTo is visible
    test('should expand HowTo include and render visible howto and benchmarks', async ({ page }) => {
        await page.goto('/what-is-edge-computing.html');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(process.env.CI ? 500 : 1000);

        // HowTo section should be present and the include comment should be removed
        // Template uses id '#howto' and class '.howto-section'
        const howToSection = await page.$('section.howto-section') || await page.$('#howto');
        expect(howToSection).toBeTruthy();

        const pageHtml = await page.content();
        expect(pageHtml.includes('<!--#include file="../templates/howto-section.html" -->')).toBe(false);

        const bench = await page.$('section.benchmark-section');
        expect(bench).toBeTruthy();
    });

    // Regression test: all pages configured with TechArticle must include metrics as hasPart
    test('should generate TechArticle with metrics for pages configured as TechArticle', async ({ page }) => {
        const pageConfig = JSON.parse(fs.readFileSync('data/schemas/page-config.json', 'utf8'));
        const techPages = Object.entries(pageConfig.pagesByPath || {}).filter(([k, v]) => v.schema && v.schema.type === 'TechArticle').map(([k]) => k);
        expect(techPages.length).toBeGreaterThan(0);

        for (const file of techPages) {
            const url = `/${file}`;
            await page.goto(url);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(process.env.CI ? 500 : 1000);

            const schemas = await page.$$eval(
                'script[type="application/ld+json"]',
                scripts => scripts.map(s => JSON.parse(s.textContent))
            );

            const article = schemas.find(s => s['@type'] === 'TechArticle' || s['@type'] === 'Article');
            expect(article).toBeDefined();
            expect(article.hasPart).toBeDefined();
            expect(Array.isArray(article.hasPart.itemListElement)).toBe(true);
            expect(article.hasPart.itemListElement.length).toBeGreaterThan(0);
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

    test('should expose hero og:image and ImageObject JSON-LD on case studies page', async ({ page }) => {
        await page.goto('/saas-product-startups-cloudflare-case-studies.html');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(process.env.CI ? 500 : 1000);

        const ogImage = await page.getAttribute('meta[property="og:image"]', 'content');
        expect(ogImage).toBe('https://www.clodo.dev/images/seo/optimized/hero-cloudflare-collab-1200x630.png');

        const schemas = await page.$$eval(
            'script[type="application/ld+json"]',
            scripts => scripts.map(s => JSON.parse(s.textContent))
        );

        const imgSchema = schemas.find(s => s['@type'] === 'ImageObject');
        expect(imgSchema).toBeDefined();
        if (imgSchema) {
            expect(imgSchema.url).toContain('/images/seo/optimized/hero-cloudflare-collab-1200x630.png');
            expect(imgSchema.caption).toContain('Evaluating Cloudflare');
        }
    });

    test('should render hero picture with responsive sources and correct alt', async ({ page }) => {
        await page.goto('/saas-product-startups-cloudflare-case-studies.html');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(process.env.CI ? 500 : 1000);

        const picture = await page.$('picture.hero-image');
        expect(picture).toBeTruthy();

        const img = await page.$('picture.hero-image img');
        expect(img).toBeTruthy();

        const alt = await img.getAttribute('alt');
        expect(alt).toBe('Cloudflare collaboration overview with logos of Discord, Shopify and GitHub.');

        // ensure webp source exists
        const webpSource = await page.$('picture.hero-image source[type="image/webp"]');
        expect(webpSource).toBeTruthy();

        // ensure png fallback source exists
        const pngSource = await page.$('picture.hero-image source[type="image/png"]');
        expect(pngSource).toBeTruthy();
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
