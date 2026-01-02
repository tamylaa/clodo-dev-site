#!/usr/bin/env node

/**
 * SEO Performance Testing Script
 * Tests and validates SEO improvements for Clodo Framework
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SEOTester {
    constructor() {
        this.baseUrl = 'https://www.clodo.dev';
        this.testResults = {
            timestamp: new Date().toISOString(),
            tests: [],
            summary: {}
        };
    }

    async runAllTests() {
        console.log('🚀 Starting SEO Performance Tests...\n');

        await this.testMetaTags();
        await this.testStructuredData();
        await this.testHreflangTags();
        await this.testSitemap();
        await this.testPerformanceMetrics();
        await this.testContentQuality();

        this.generateReport();
        this.saveResults();
    }

    async testMetaTags() {
        console.log('📋 Testing meta tags...');

        const pages = [
            '/',
            '/wrangler-to-clodo-migration',
            '/ruby-on-rails-cloudflare-integration',
            '/serverless-framework-comparison',
            '/worker-scaffolding-tools',
            '/advanced-cloudflare-workers-tutorial'
        ];

        const results = [];

        for (const page of pages) {
            try {
                const html = await this.fetchPage(page);
                const metaTags = this.extractMetaTags(html);

                const requiredTags = [
                    'title', 'description', 'keywords', 'canonical',
                    'og:title', 'og:description', 'og:type', 'og:url',
                    'twitter:card', 'twitter:title', 'twitter:description'
                ];

                const missingTags = requiredTags.filter(tag => !metaTags[tag]);

                results.push({
                    page,
                    status: missingTags.length === 0 ? 'PASS' : 'FAIL',
                    metaTags: metaTags,
                    missingTags,
                    score: Math.max(0, 100 - (missingTags.length * 10))
                });
            } catch (error) {
                results.push({
                    page,
                    status: 'ERROR',
                    error: error.message,
                    score: 0
                });
            }
        }

        this.testResults.tests.push({
            name: 'Meta Tags',
            results,
            averageScore: results.reduce((sum, r) => sum + r.score, 0) / results.length
        });

        console.log(`✅ Meta tags test completed. Average score: ${this.testResults.tests[0].averageScore.toFixed(1)}%\n`);
    }

    async testStructuredData() {
        console.log('🏗️ Testing structured data...');

        const pages = ['/', '/wrangler-to-clodo-migration'];
        const results = [];

        for (const page of pages) {
            try {
                const html = await this.fetchPage(page);
                const structuredData = this.extractStructuredData(html);

                const hasRequiredTypes = structuredData.some(item =>
                    item['@type'] === 'WebSite' || item['@type'] === 'Article'
                );

                results.push({
                    page,
                    hasStructuredData: structuredData.length > 0,
                    hasRequiredTypes,
                    dataCount: structuredData.length,
                    score: hasRequiredTypes ? 100 : (structuredData.length > 0 ? 50 : 0)
                });
            } catch (error) {
                results.push({
                    page,
                    status: 'ERROR',
                    error: error.message,
                    score: 0
                });
            }
        }

        this.testResults.tests.push({
            name: 'Structured Data',
            results,
            averageScore: results.reduce((sum, r) => sum + r.score, 0) / results.length
        });

        console.log(`✅ Structured data test completed. Average score: ${this.testResults.tests[1].averageScore.toFixed(1)}%\n`);
    }

    async testHreflangTags() {
        console.log('🌍 Testing hreflang tags...');

        const pages = [
            '/wrangler-to-clodo-migration',
            '/ruby-on-rails-cloudflare-integration'
        ];

        const results = [];

        for (const page of pages) {
            try {
                const html = await this.fetchPage(page);
                const hreflangTags = this.extractHreflangTags(html);

                const requiredLocales = ['en', 'de', 'it'];
                const presentLocales = hreflangTags.map(tag => tag.lang);

                const hasRequiredLocales = requiredLocales.every(locale =>
                    presentLocales.includes(locale)
                );

                results.push({
                    page,
                    hreflangCount: hreflangTags.length,
                    presentLocales,
                    hasRequiredLocales,
                    score: hasRequiredLocales ? 100 : (hreflangTags.length > 0 ? 50 : 0)
                });
            } catch (error) {
                results.push({
                    page,
                    status: 'ERROR',
                    error: error.message,
                    score: 0
                });
            }
        }

        this.testResults.tests.push({
            name: 'Hreflang Tags',
            results,
            averageScore: results.reduce((sum, r) => sum + r.score, 0) / results.length
        });

        console.log(`✅ Hreflang test completed. Average score: ${this.testResults.tests[2].averageScore.toFixed(1)}%\n`);
    }

    async testSitemap() {
        console.log('🗺️ Testing sitemap...');

        try {
            const sitemapPath = 'g:/coding/clodo-dev-site/public/sitemap.xml';
            const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
            const urls = this.parseSitemap(sitemapContent);

            const expectedUrls = [
                'https://www.clodo.dev/',
                'https://www.clodo.dev/wrangler-to-clodo-migration',
                'https://www.clodo.dev/ruby-on-rails-cloudflare-integration',
                'https://www.clodo.dev/serverless-framework-comparison',
                'https://www.clodo.dev/worker-scaffolding-tools',
                'https://www.clodo.dev/advanced-cloudflare-workers-tutorial'
            ];

            const missingUrls = expectedUrls.filter(url => !urls.includes(url));
            const extraUrls = urls.filter(url => !expectedUrls.includes(url));

            this.testResults.tests.push({
                name: 'Sitemap',
                sitemapUrl: `${this.baseUrl}/sitemap.xml`,
                totalUrls: urls.length,
                expectedUrls: expectedUrls.length,
                missingUrls,
                extraUrls,
                isValid: missingUrls.length === 0,
                score: missingUrls.length === 0 ? 100 : Math.max(0, 100 - (missingUrls.length * 20))
            });

            console.log(`✅ Sitemap test completed. Score: ${this.testResults.tests[3].score}%\n`);
        } catch (error) {
            this.testResults.tests.push({
                name: 'Sitemap',
                status: 'ERROR',
                error: error.message,
                score: 0
            });
            console.log(`❌ Sitemap test failed: ${error.message}\n`);
        }
    }

    async testPerformanceMetrics() {
        console.log('⚡ Testing performance metrics...');

        const pages = ['/', '/wrangler-to-clodo-migration'];
        const results = [];

        for (const page of pages) {
            try {
                const startTime = Date.now();
                const response = await this.fetchPage(page, true);
                const loadTime = Date.now() - startTime;

                const sizeKB = Buffer.byteLength(response, 'utf8') / 1024;
                const statusCode = 200; // Assume success if we got here

                results.push({
                    page,
                    loadTime,
                    sizeKB: sizeKB.toFixed(2),
                    statusCode,
                    score: this.calculatePerformanceScore(loadTime, sizeKB)
                });
            } catch (error) {
                results.push({
                    page,
                    status: 'ERROR',
                    error: error.message,
                    score: 0
                });
            }
        }

        this.testResults.tests.push({
            name: 'Performance',
            results,
            averageScore: results.reduce((sum, r) => sum + r.score, 0) / results.length
        });

        console.log(`✅ Performance test completed. Average score: ${this.testResults.tests[4].averageScore.toFixed(1)}%\n`);
    }

    async testContentQuality() {
        console.log('📝 Testing content quality...');

        const pages = [
            { path: '/wrangler-to-clodo-migration', minWords: 800 },
            { path: '/ruby-on-rails-cloudflare-integration', minWords: 600 },
            { path: '/serverless-framework-comparison', minWords: 700 },
            { path: '/worker-scaffolding-tools', minWords: 500 },
            { path: '/advanced-cloudflare-workers-tutorial', minWords: 600 }
        ];

        const results = [];

        for (const { path, minWords } of pages) {
            try {
                const html = await this.fetchPage(path);
                const text = this.extractTextContent(html);
                const wordCount = text.split(/\s+/).length;

                const hasHeadings = /<h[1-6][^>]*>.*?<\/h[1-6]>/gi.test(html);
                const hasImages = /<img[^>]+alt[^>]*>/gi.test(html);
                const hasLinks = /<a[^>]+href[^>]*>.*?<\/a>/gi.test(html);

                const score = this.calculateContentScore(wordCount, minWords, hasHeadings, hasImages, hasLinks);

                results.push({
                    page: path,
                    wordCount,
                    minWords,
                    hasHeadings,
                    hasImages,
                    hasLinks,
                    score
                });
            } catch (error) {
                results.push({
                    page: path,
                    status: 'ERROR',
                    error: error.message,
                    score: 0
                });
            }
        }

        this.testResults.tests.push({
            name: 'Content Quality',
            results,
            averageScore: results.reduce((sum, r) => sum + r.score, 0) / results.length
        });

        console.log(`✅ Content quality test completed. Average score: ${this.testResults.tests[5].averageScore.toFixed(1)}%\n`);
    }

    // Helper methods
    async fetchPage(path, returnRaw = false) {
        // For local testing, read files directly instead of fetching
        let filePath = path.startsWith('/') ? path.substring(1) : path;

        // Add .html extension if not present and not a root path
        if (!filePath.includes('.') && filePath !== '') {
            filePath += '.html';
        }

        const fullPath = `g:/coding/clodo-dev-site/public/${filePath}`;

        try {
            const content = fs.readFileSync(fullPath, 'utf8');
            return returnRaw ? content : content;
        } catch (error) {
            throw new Error(`File not found: ${fullPath}`);
        }
    }

    extractMetaTags(html) {
        const metaTags = {};
        const metaRegex = /<meta[^>]+(?:name|property)="([^"]+)"[^>]+content="([^"]*)"[^>]*>/gi;
        let match;

        while ((match = metaRegex.exec(html)) !== null) {
            metaTags[match[1]] = match[2];
        }

        // Extract title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
            metaTags.title = titleMatch[1];
        }

        // Extract canonical
        const canonicalMatch = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]*)"[^>]*>/i);
        if (canonicalMatch) {
            metaTags.canonical = canonicalMatch[1];
        }

        return metaTags;
    }

    extractStructuredData(html) {
        const jsonLdRegex = /<script[^>]+type="application\/ld\+json"[^>]*>([^<]+)<\/script>/gi;
        const structuredData = [];
        let match;

        while ((match = jsonLdRegex.exec(html)) !== null) {
            try {
                const data = JSON.parse(match[1]);
                if (Array.isArray(data)) {
                    structuredData.push(...data);
                } else {
                    structuredData.push(data);
                }
            } catch (e) {
                // Invalid JSON, skip
            }
        }

        return structuredData;
    }

    extractHreflangTags(html) {
        const hreflangTags = [];
        const hreflangRegex = /<link[^>]+rel="alternate"[^>]+hreflang="([^"]+)"[^>]+href="([^"]*)"[^>]*>/gi;
        let match;

        while ((match = hreflangRegex.exec(html)) !== null) {
            hreflangTags.push({
                lang: match[1],
                href: match[2]
            });
        }

        return hreflangTags;
    }

    parseSitemap(xml) {
        const urlRegex = /<loc>([^<]+)<\/loc>/gi;
        const urls = [];
        let match;

        while ((match = urlRegex.exec(xml)) !== null) {
            urls.push(match[1]);
        }

        return urls;
    }

    extractTextContent(html) {
        // Remove scripts, styles, and HTML tags
        return html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    calculatePerformanceScore(loadTime, sizeKB) {
        let score = 100;

        // Penalize slow load times
        if (loadTime > 3000) score -= 30;
        else if (loadTime > 2000) score -= 20;
        else if (loadTime > 1000) score -= 10;

        // Penalize large page sizes
        if (sizeKB > 500) score -= 20;
        else if (sizeKB > 200) score -= 10;

        return Math.max(0, score);
    }

    calculateContentScore(wordCount, minWords, hasHeadings, hasImages, hasLinks) {
        let score = 100;

        // Word count scoring
        if (wordCount < minWords) {
            score -= Math.min(50, (minWords - wordCount) / minWords * 50);
        }

        // Structure bonuses
        if (!hasHeadings) score -= 20;
        if (!hasImages) score -= 10;
        if (!hasLinks) score -= 10;

        return Math.max(0, score);
    }

    generateReport() {
        console.log('📊 SEO Test Results Summary\n');

        // Calculate overall score from tests that have scores
        const scoredTests = this.testResults.tests.filter(test => {
            const score = test.averageScore !== undefined ? test.averageScore : test.score;
            return score !== undefined && !isNaN(score);
        });

        const totalScore = scoredTests.reduce((sum, test) => {
            const score = test.averageScore !== undefined ? test.averageScore : test.score;
            return sum + (isNaN(score) ? 0 : score);
        }, 0);
        const overallScore = scoredTests.length > 0 ? totalScore / scoredTests.length : 0;

        console.log(`Overall SEO Score: ${overallScore.toFixed(1)}%\n`);

        this.testResults.tests.forEach(test => {
            const score = test.averageScore !== undefined ? test.averageScore : test.score;
            if (score !== undefined) {
                console.log(`${test.name}: ${score.toFixed(1)}%`);
            } else {
                console.log(`${test.name}: N/A`);
            }

            if (test.results) {
                test.results.forEach(result => {
                    const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
                    console.log(`  ${status} ${result.page || 'N/A'}: ${result.score}%`);
                });
            }
            console.log('');
        });

        this.testResults.summary = {
            overallScore,
            testCount: this.testResults.tests.length,
            timestamp: this.testResults.timestamp
        };
    }

    saveResults() {
        const resultsDir = path.join(__dirname, '..', 'test-results');
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
        }

        const filename = `seo-test-results-${new Date().toISOString().split('T')[0]}.json`;
        const filepath = path.join(resultsDir, filename);

        fs.writeFileSync(filepath, JSON.stringify(this.testResults, null, 2));
        console.log(`💾 Results saved to: ${filepath}`);
    }
}

// Run tests if called directly
if (process.argv[1].endsWith('seo-performance-test.js')) {
    const tester = new SEOTester();
    tester.runAllTests().catch(console.error);
}

export default SEOTester;