#!/usr/bin/env node

/**
 * Page Loading and Content Verification Script
 *
 * Checks all pages (root and subpages) for:
 * - Successful loading (200 status)
 * - No unexpected redirections
 * - Content visibility (non-empty body)
 * - Canonical URL correctness
 *
 * Usage: node build/check-page-loading.js [baseUrl]
 * Default baseUrl: https://www.clodo.dev
 */

import { chromium } from 'playwright';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const BASE_URL = process.argv[2] || 'https://www.clodo.dev';

const results = {
    total: 0,
    successful: 0,
    failed: [],
    redirects: [],
    canonicalIssues: []
};

function getAllHtmlFiles(dir, relativePath = '') {
    const files = [];
    const items = readdirSync(dir);
    for (const item of items) {
        const fullPath = join(dir, item);
        const relPath = relativePath ? join(relativePath, item) : item;
        if (statSync(fullPath).isDirectory()) {
            files.push(...getAllHtmlFiles(fullPath, relPath));
        } else if (item.endsWith('.html')) {
            files.push(relPath);
        }
    }
    return files;
}

function getUrlForFile(filePath) {
    if (filePath === 'index.html') {
        return BASE_URL + '/';
    }
    return BASE_URL + '/' + filePath.replace(/\\/g, '/');
}

async function checkPage(browser, url, filePath) {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        if (!response) {
            throw new Error('No response received');
        }

        const status = response.status();
        const finalUrl = page.url();

        // Check for redirects
        const redirected = finalUrl !== url;
        if (redirected) {
            results.redirects.push({ from: url, to: finalUrl, status, file: filePath });
        }

        // Check status
        if (status !== 200) {
            results.failed.push({ url, file: filePath, reason: `HTTP ${status}`, finalUrl });
            await context.close();
            return;
        }

        // Check content
        const bodyText = await page.locator('body').textContent();
        if (!bodyText || bodyText.trim().length === 0) {
            results.failed.push({ url, file: filePath, reason: 'Empty or no content', finalUrl });
            await context.close();
            return;
        }

        // Check canonical
        const canonical = await page.locator('link[rel="canonical"]').getAttribute('href').catch(() => null);
        if (canonical && canonical !== finalUrl) {
            results.canonicalIssues.push({ url: finalUrl, file: filePath, canonical, expected: finalUrl });
        }

        // Success
        results.successful++;

    } catch (error) {
        results.failed.push({ url, file: filePath, reason: error.message });
    } finally {
        await context.close();
    }
}

async function main() {
    const publicDir = join(process.cwd(), 'public');
    const htmlFiles = getAllHtmlFiles(publicDir);

    console.log(`Found ${htmlFiles.length} HTML files to check`);
    console.log(`Starting page loading check for ${BASE_URL}`);

    const browser = await chromium.launch();

    for (const file of htmlFiles) {
        const url = getUrlForFile(file);
        console.log(`Checking: ${url} (${file})`);
        await checkPage(browser, url, file);
        results.total++;
    }

    await browser.close();

    // Report results
    console.log('\n=== Results ===');
    console.log(`Total pages checked: ${results.total}`);
    console.log(`Successful: ${results.successful}`);
    console.log(`Failed: ${results.failed.length}`);

    if (results.failed.length > 0) {
        console.log('\nFailed pages:');
        results.failed.forEach(fail => {
            console.log(`- ${fail.url} (${fail.file}): ${fail.reason}`);
        });
    }

    if (results.redirects.length > 0) {
        console.log('\nRedirects detected:');
        results.redirects.forEach(redir => {
            console.log(`- ${redir.from} (${redir.file}) -> ${redir.to} (${redir.status})`);
        });
    }

    if (results.canonicalIssues.length > 0) {
        console.log('\nCanonical issues:');
        results.canonicalIssues.forEach(issue => {
            console.log(`- ${issue.url} (${issue.file}): canonical=${issue.canonical}, expected=${issue.expected}`);
        });
    }

    if (results.failed.length === 0 && results.canonicalIssues.length === 0) {
        console.log('✅ All pages loaded successfully with correct content and canonicals!');
    } else {
        console.log('❌ Some pages have issues.');
        process.exit(1);
    }
}

main().catch(console.error);