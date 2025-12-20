#!/usr/bin/env node

/**
 * Link Health Checker for Clodo Dev Site
 * Validates internal links and provides analytics
 *
 * Usage:
 *   npm run check-links
 *   node build/check-links.js
 *
 * This script scans all HTML files in the public directory and:
 * - Validates that internal links point to existing files
 * - Reports broken links
 * - Provides link analytics
 * - Saves detailed report to build/link-health-report.json
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Dynamically attempt to load jsdom; if it's unavailable or incompatible (e.g., older Node),
// fall back to a regex-based HTML link extractor.
let JSDOM;
try {
  const jsdomModule = await import('jsdom');
  JSDOM = jsdomModule.JSDOM;
} catch (err) {
  JSDOM = null;
  console.warn('⚠️ jsdom unavailable or incompatible - falling back to a regex-based link parser.');
} 

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const SITE_ROOT = join(__dirname, '..');
const PUBLIC_DIR = join(SITE_ROOT, 'public');
const BUILD_DIR = join(SITE_ROOT, 'build');

// Track link analytics
let linkAnalytics = {
    totalLinks: 0,
    internalLinks: 0,
    externalLinks: 0,
    brokenLinks: [],
    linkClusters: {},
    linkPositions: {},
    contentTypes: {}
};

/**
 * Extract links from HTML content
 */
function extractLinks(html, filePath) {
    // Prefer jsdom when available for robust parsing; otherwise use a conservative regex fallback.
    try {
        if (JSDOM) {
            const dom = new JSDOM(html);
            const links = dom.window.document.querySelectorAll('a[href]');

            return Array.from(links).map(link => ({
                href: link.getAttribute('href'),
                text: (link.textContent || '').trim(),
                file: filePath.replace(SITE_ROOT + '\\', '').replace(SITE_ROOT + '/', ''),
                dataAttributes: {
                    linkType: link.getAttribute('data-link-type'),
                    contentCluster: link.getAttribute('data-content-cluster'),
                    linkPosition: link.getAttribute('data-link-position'),
                    contentType: link.getAttribute('data-content-type')
                }
            }));
        }

        // Regex fallback: capture href and inner text, strip inner HTML tags from text.
        const anchorRegex = /<a\b[^>]*\bhref=(?:'([^']*)'|"([^"]*)"|([^>\s]+))[^>]*>([\s\S]*?)<\/a>/gi;
        const results = [];
        let match;
        while ((match = anchorRegex.exec(html)) !== null) {
            const href = match[1] || match[2] || match[3] || '';
            const rawText = match[4] || '';
            const text = rawText.replace(/<[^>]+>/g, '').trim();
            results.push({
                href,
                text,
                file: filePath.replace(SITE_ROOT + '\\', '').replace(SITE_ROOT + '/', ''),
                dataAttributes: {
                    linkType: null,
                    contentCluster: null,
                    linkPosition: null,
                    contentType: null
                }
            });
        }

        return results;
    } catch (error) {
        console.warn(`Error parsing HTML in ${filePath}:`, error && error.message ? error.message : error);
        return [];
    }
}

/**
 * Check if a file exists
 */
function fileExists(filePath) {
    try {
        return existsSync(filePath);
    } catch {
        return false;
    }
}

/**
 * Validate internal link
 */
function validateInternalLink(link, baseDir) {
    if (!link.href || link.href.startsWith('http') || link.href.startsWith('//') || link.href.startsWith('mailto:') || link.href.startsWith('#')) {
        return { valid: true, type: 'external' };
    }

    // Handle relative paths
    let fullPath;
    if (link.href.startsWith('/')) {
        fullPath = join(PUBLIC_DIR, link.href);
    } else {
        fullPath = join(baseDir, link.href);
    }

    // Remove query parameters and fragments for file checking
    const cleanPath = fullPath.split('?')[0].split('#')[0];

    if (fileExists(cleanPath) || fileExists(cleanPath + '.html') || fileExists(join(cleanPath, 'index.html'))) {
        return { valid: true, type: 'internal' };
    }

    return { valid: false, type: 'broken', fullPath: cleanPath };
}

/**
 * Analyze link data attributes
 */
function analyzeLinkAttributes(link) {
    const { dataAttributes } = link;

    if (dataAttributes.contentCluster) {
        linkAnalytics.linkClusters[dataAttributes.contentCluster] =
            (linkAnalytics.linkClusters[dataAttributes.contentCluster] || 0) + 1;
    }

    if (dataAttributes.linkPosition) {
        linkAnalytics.linkPositions[dataAttributes.linkPosition] =
            (linkAnalytics.linkPositions[dataAttributes.linkPosition] || 0) + 1;
    }

    if (dataAttributes.contentType) {
        linkAnalytics.contentTypes[dataAttributes.contentType] =
            (linkAnalytics.contentTypes[dataAttributes.contentType] || 0) + 1;
    }
}

/**
 * Process a single HTML file
 */
function processFile(filePath) {
    try {
        const content = readFileSync(filePath, 'utf8');
        const links = extractLinks(content, filePath);
        const baseDir = dirname(filePath);

        links.forEach(link => {
            linkAnalytics.totalLinks++;

            const validation = validateInternalLink(link, baseDir);

            if (validation.type === 'internal') {
                linkAnalytics.internalLinks++;
                analyzeLinkAttributes(link);
            } else if (validation.type === 'external') {
                linkAnalytics.externalLinks++;
            } else if (validation.type === 'broken') {
                linkAnalytics.brokenLinks.push({
                    file: link.file,
                    href: link.href,
                    text: link.text,
                    expectedPath: validation.fullPath
                });
            }
        });
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
    }
}

/**
 * Recursively find all HTML files
 */
function findHtmlFiles(dir) {
    const files = [];

        function scan(directory) {
            const items = readdirSync(directory);

            items.forEach(item => {
                const fullPath = join(directory, item);
                const stat = statSync(fullPath);            if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                scan(fullPath);
            } else if (stat.isFile() && item.endsWith('.html')) {
                files.push(fullPath);
            }
        });
    }

    scan(dir);
    return files;
}

/**
 * Generate analytics report
 */
function generateReport() {
    console.log('\n🔗 Link Health Check Report');
    console.log('=' .repeat(50));
    console.log(`Total Links Found: ${linkAnalytics.totalLinks}`);
    console.log(`Internal Links: ${linkAnalytics.internalLinks}`);
    console.log(`External Links: ${linkAnalytics.externalLinks}`);
    console.log(`Broken Links: ${linkAnalytics.brokenLinks.length}`);

    if (linkAnalytics.brokenLinks.length > 0) {
        console.log('\n❌ Broken Links:');
        linkAnalytics.brokenLinks.forEach(link => {
            console.log(`  - ${link.file}: "${link.text}" -> ${link.href}`);
            console.log(`    Expected: ${link.expectedPath}`);
        });
    }

    console.log('\n📊 Link Analytics:');

    console.log('\nContent Clusters:');
    Object.entries(linkAnalytics.linkClusters)
        .sort(([,a], [,b]) => b - a)
        .forEach(([cluster, count]) => {
            console.log(`  ${cluster}: ${count} links`);
        });

    console.log('\nLink Positions:');
    Object.entries(linkAnalytics.linkPositions)
        .sort(([,a], [,b]) => b - a)
        .forEach(([position, count]) => {
            console.log(`  ${position}: ${count} links`);
        });

    console.log('\nContent Types:');
    Object.entries(linkAnalytics.contentTypes)
        .sort(([,a], [,b]) => b - a)
        .forEach(([type, count]) => {
            console.log(`  ${type}: ${count} links`);
        });

    // Save detailed report
    const reportPath = join(BUILD_DIR, 'link-health-report.json');
    writeFileSync(reportPath, JSON.stringify(linkAnalytics, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    return linkAnalytics.brokenLinks.length === 0;
}

/**
 * Main execution
 */
function main() {
    console.log('🔍 Scanning for HTML files...');

    const htmlFiles = findHtmlFiles(PUBLIC_DIR);
    console.log(`Found ${htmlFiles.length} HTML files`);

    let processedCount = 0;
    htmlFiles.forEach(file => {
        processFile(file);
        processedCount++;
        if (processedCount % 10 === 0) {
            console.log(`Processed ${processedCount}/${htmlFiles.length} files...`);
        }
    });

    console.log(`\n📊 Link Analysis Results:`);
    console.log(`   Total links found: ${linkAnalytics.totalLinks}`);
    console.log(`   Internal links: ${linkAnalytics.internalLinks}`);
    console.log(`   External links: ${linkAnalytics.externalLinks}`);
    console.log(`   Broken links: ${linkAnalytics.brokenLinks.length}`);

    const success = generateReport();

    if (!success) {
        console.log('\n❌ Link health check failed - broken links found');
        process.exit(1);
    } else {
        console.log('\n✅ All internal links are healthy!');
    }
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('check-links.js')) {
    main();
}

export { main as checkLinks, linkAnalytics };