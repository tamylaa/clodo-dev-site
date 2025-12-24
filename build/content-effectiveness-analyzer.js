#!/usr/bin/env node

/**
 * Content Effectiveness Analyzer
 * Measures how well proactive SEO content performs
 * 
 * Configure the contentPages array below with your own pages
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ContentAnalyzer {
    constructor() {
        // Configure your content pages here
        // These should be your key SEO-targeted landing pages
        this.contentPages = [
            {
                path: '/index.html',
                targetKeyword: 'your main keyword',
                publishDate: '2025-01-01',
                expectedTraffic: 1000
            },
            {
                path: '/about.html',
                targetKeyword: 'about keyword',
                publishDate: '2025-01-01',
                expectedTraffic: 500
            },
            {
                path: '/pricing.html',
                targetKeyword: 'pricing keyword',
                publishDate: '2025-01-01',
                expectedTraffic: 300
            }
            // Add more pages as needed
        ];

        this.results = {
            timestamp: new Date().toISOString(),
            analysis: [],
            summary: {}
        };
    }

    async analyzeContentEffectiveness() {
        console.log('📊 Analyzing content effectiveness...\n');

        for (const page of this.contentPages) {
            console.log(`Analyzing: ${page.path}`);

            const analysis = await this.analyzePage(page);
            this.results.analysis.push(analysis);

            console.log(`  SEO Score: ${analysis.seoScore}%`);
            console.log(`  Content Quality: ${analysis.contentQuality}%`);
            console.log(`  Traffic Potential: ${analysis.trafficPotential}\n`);
        }

        this.generateSummary();
        this.generateRecommendations();
        this.saveResults();
    }

    async analyzePage(pageConfig) {
        const filePath = path.join(__dirname, '..', 'public', pageConfig.path);

        if (!fs.existsSync(filePath)) {
            return {
                page: pageConfig.path,
                error: 'File not found',
                seoScore: 0,
                contentQuality: 0,
                trafficPotential: 'unknown'
            };
        }

        const html = fs.readFileSync(filePath, 'utf8');

        const seoScore = this.calculateSEOScore(html, pageConfig.targetKeyword);
        const contentQuality = this.calculateContentQuality(html);
        const trafficPotential = this.assessTrafficPotential(pageConfig, seoScore, contentQuality);

        return {
            page: pageConfig.path,
            targetKeyword: pageConfig.targetKeyword,
            publishDate: pageConfig.publishDate,
            seoScore,
            contentQuality,
            trafficPotential,
            metrics: {
                wordCount: this.getWordCount(html),
                headingCount: this.getHeadingCount(html),
                keywordDensity: this.getKeywordDensity(html, pageConfig.targetKeyword),
                hasStructuredData: this.hasStructuredData(html),
                hasMetaTags: this.hasMetaTags(html),
                loadTime: this.estimateLoadTime(html)
            }
        };
    }

    calculateSEOScore(html, targetKeyword) {
        let score = 100;

        // Title tag (20 points)
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (!titleMatch || !titleMatch[1].toLowerCase().includes(targetKeyword.toLowerCase())) {
            score -= 20;
        }

        // Meta description (15 points)
        const descMatch = html.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"[^>]*>/i);
        if (!descMatch || !descMatch[1].toLowerCase().includes(targetKeyword.toLowerCase())) {
            score -= 15;
        }

        // H1 tag (15 points)
        const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        if (!h1Match || !h1Match[1].toLowerCase().includes(targetKeyword.toLowerCase())) {
            score -= 15;
        }

        // URL structure (10 points)
        const urlFriendly = targetKeyword.toLowerCase().replace(/\s+/g, '-');
        if (!html.includes(urlFriendly)) {
            score -= 10;
        }

        // Keyword in content (20 points)
        const keywordDensity = this.getKeywordDensity(html, targetKeyword);
        if (keywordDensity < 0.5 || keywordDensity > 3.0) {
            score -= 20;
        }

        // Internal linking (10 points)
        const linkCount = (html.match(/<a[^>]+href="[^"]*"[^>]*>/g) || []).length;
        if (linkCount < 3) {
            score -= 10;
        }

        // Image alt tags (10 points)
        const imgCount = (html.match(/<img[^>]+alt="[^"]*"[^>]*>/g) || []).length;
        const totalImgs = (html.match(/<img[^>]*>/g) || []).length;
        if (totalImgs > 0 && imgCount / totalImgs < 0.8) {
            score -= 10;
        }

        return Math.max(0, score);
    }

    calculateContentQuality(html) {
        let score = 100;

        // Word count (30 points)
        const wordCount = this.getWordCount(html);
        if (wordCount < 500) score -= 30;
        else if (wordCount < 800) score -= 15;

        // Heading structure (20 points)
        const headingCount = this.getHeadingCount(html);
        if (headingCount < 3) score -= 20;
        else if (headingCount < 5) score -= 10;

        // Readability (20 points)
        const avgSentenceLength = this.getAverageSentenceLength(html);
        if (avgSentenceLength > 25) score -= 20;
        else if (avgSentenceLength > 20) score -= 10;

        // Code examples (15 points)
        const codeBlocks = (html.match(/<pre[^>]*>[\s\S]*?<\/pre>/g) || []).length +
                          (html.match(/<code[^>]*>[\s\S]*?<\/code>/g) || []).length;
        if (codeBlocks < 2) score -= 15;
        else if (codeBlocks < 4) score -= 7;

        // Lists and structure (15 points)
        const listItems = (html.match(/<li[^>]*>[\s\S]*?<\/li>/g) || []).length;
        if (listItems < 5) score -= 15;
        else if (listItems < 10) score -= 7;

        return Math.max(0, score);
    }

    assessTrafficPotential(pageConfig, seoScore, contentQuality) {
        const baseTraffic = pageConfig.expectedTraffic;
        const seoMultiplier = seoScore / 100;
        const qualityMultiplier = contentQuality / 100;

        const potentialTraffic = Math.round(baseTraffic * seoMultiplier * qualityMultiplier);

        if (potentialTraffic > baseTraffic * 0.8) return 'excellent';
        if (potentialTraffic > baseTraffic * 0.6) return 'good';
        if (potentialTraffic > baseTraffic * 0.4) return 'moderate';
        return 'low';
    }

    // Helper methods
    getWordCount(html) {
        const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        return text.split(' ').length;
    }

    getHeadingCount(html) {
        const headings = html.match(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/g) || [];
        return headings.length;
    }

    getKeywordDensity(html, keyword) {
        const text = html.replace(/<[^>]+>/g, ' ').toLowerCase();
        const keywordLower = keyword.toLowerCase();
        const keywordCount = (text.match(new RegExp(keywordLower, 'g')) || []).length;
        const totalWords = text.split(/\s+/).length;

        return (keywordCount / totalWords) * 100;
    }

    getAverageSentenceLength(html) {
        const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const totalWords = sentences.reduce((sum, sentence) => sum + sentence.trim().split(' ').length, 0);

        return sentences.length > 0 ? totalWords / sentences.length : 0;
    }

    hasStructuredData(html) {
        return /<script[^>]+type="application\/ld\+json"[^>]*>/.test(html);
    }

    hasMetaTags(html) {
        const required = ['description', 'keywords', 'author'];
        return required.every(tag =>
            new RegExp(`<meta[^>]+name="${tag}"[^>]+content="[^"]*"[^>]*>`, 'i').test(html)
        );
    }

    estimateLoadTime(html) {
        // Rough estimation based on content size
        const sizeKB = Buffer.byteLength(html, 'utf8') / 1024;
        // Assume 50KB/s connection speed
        return Math.round((sizeKB / 50) * 1000);
    }

    generateSummary() {
        const analyses = this.results.analysis.filter(a => !a.error);

        this.results.summary = {
            totalPages: analyses.length,
            averageSEOScore: analyses.reduce((sum, a) => sum + a.seoScore, 0) / analyses.length,
            averageContentQuality: analyses.reduce((sum, a) => sum + a.contentQuality, 0) / analyses.length,
            trafficPotential: {
                excellent: analyses.filter(a => a.trafficPotential === 'excellent').length,
                good: analyses.filter(a => a.trafficPotential === 'good').length,
                moderate: analyses.filter(a => a.trafficPotential === 'moderate').length,
                low: analyses.filter(a => a.trafficPotential === 'low').length
            },
            topPerformer: analyses.reduce((top, current) =>
                current.seoScore > top.seoScore ? current : top
            ),
            needsImprovement: analyses.filter(a => a.seoScore < 70 || a.contentQuality < 70)
        };
    }

    generateRecommendations() {
        console.log('\n💡 Content Effectiveness Recommendations:\n');

        const { summary } = this.results;

        if (summary.averageSEOScore < 70) {
            console.log('⚠️ SEO Score needs improvement:');
            console.log('  - Ensure target keywords are in title, H1, and meta description');
            console.log('  - Optimize keyword density (1-2%)');
            console.log('  - Add more internal links');
        }

        if (summary.averageContentQuality < 70) {
            console.log('📝 Content Quality needs improvement:');
            console.log('  - Increase word count (aim for 800+ words)');
            console.log('  - Add more headings for structure');
            console.log('  - Include code examples and practical demonstrations');
        }

        if (summary.trafficPotential.excellent > 0) {
            console.log('🎯 High-potential pages identified:');
            this.results.analysis
                .filter(a => a.trafficPotential === 'excellent')
                .forEach(a => console.log(`  - ${a.page} (${a.targetKeyword})`));
        }

        if (summary.needsImprovement.length > 0) {
            console.log('🔧 Pages needing improvement:');
            summary.needsImprovement.forEach(page => {
                console.log(`  - ${page.page}: SEO ${page.seoScore}%, Quality ${page.contentQuality}%`);
            });
        }
    }

    saveResults() {
        const resultsDir = path.join(__dirname, '..', 'test-results');
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
        }

        const filename = `content-effectiveness-${new Date().toISOString().split('T')[0]}.json`;
        const filepath = path.join(resultsDir, filename);

        fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
        console.log(`\n💾 Results saved to: ${filepath}`);
    }
}

// Run analysis if called directly
if (process.argv[1].endsWith('content-effectiveness-analyzer.js')) {
    const analyzer = new ContentAnalyzer();
    analyzer.analyzeContentEffectiveness().catch(console.error);
}

export default ContentAnalyzer;