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

// Determine if we're in development mode
const IS_DEVELOPMENT = BASE_URL.includes('localhost') || BASE_URL.includes('127.0.0.1');
const PRODUCTION_DOMAIN = 'https://www.clodo.dev';

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
            // Exclude Google site verification files and other non-page files
            if (item.startsWith('google') && item.includes('verification')) {
                continue;
            }
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
        if (canonical) {
            let expectedCanonical;
            if (IS_DEVELOPMENT) {
                // In development, canonical should point to production domain
                // Strip .html extension to match site's clean URL structure
                const path = finalUrl.replace(BASE_URL, '').replace(/\.html$/, '');
                expectedCanonical = PRODUCTION_DOMAIN + path;
            } else {
                // In production, canonical should match the final URL
                expectedCanonical = finalUrl;
            }

            if (canonical !== expectedCanonical) {
                results.canonicalIssues.push({ url: finalUrl, file: filePath, canonical, expected: expectedCanonical });
            }
        }

        // Check that stylesheets were applied (avoid pages relying on inline onload handlers that CSP blocks)
        const sheetCount = await page.evaluate(() => (document.styleSheets || []).length);
        const hasStylesheetLink = await page.evaluate(() => !!document.querySelector('link[rel="stylesheet"]'));
        const preloadStyles = await page.evaluate(() => Array.from(document.querySelectorAll('link[rel="preload"][as="style"]')).map(l => ({ href: l.getAttribute('href'), rel: l.rel })));

        if (sheetCount === 0 && !hasStylesheetLink && preloadStyles.length > 0) {
            // likely CSS was not applied because preload pattern depends on inline onload which may be blocked by CSP
            results.failed.push({ url: finalUrl, file: filePath, reason: 'No stylesheet applied (preload present but no stylesheet)', details: { preloadStyles } });
            await context.close();
            return;
        }

        // Success
        results.successful++;

    } catch (error) {
        const errMsg = error && error.message ? error.message : String(error);
        // If it's a redirect loop, capture the redirect chain using curl for diagnostics
        if (errMsg.includes('ERR_TOO_MANY_REDIRECTS') || errMsg.includes('too many redirects')) {
            try {
                const { execSync } = await import('child_process');
                const curlCmd = `curl -I -v -L --max-redirs 10 ${url}`;
                const curlOut = execSync(curlCmd, { encoding: 'utf8', stdio: 'pipe' });
                results.failed.push({ url, file: filePath, reason: errMsg, redirectTrace: curlOut });
            } catch (cErr) {
                results.failed.push({ url, file: filePath, reason: errMsg + ' (also failed to run curl for trace: ' + String(cErr) + ')' });
            }
        } else {
            results.failed.push({ url, file: filePath, reason: errMsg });
        }
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

    if (results.failed.length === 0 && (results.canonicalIssues.length === 0 || IS_DEVELOPMENT)) {
        console.log('✅ All pages loaded successfully with correct content and canonicals!');
    } else {
        console.log('❌ Some pages have issues.');
        process.exit(1);
    }
}

main().catch(console.error);