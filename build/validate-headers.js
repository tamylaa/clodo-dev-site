#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(fileURLToPath(import.meta.url), '..', '..');

/**
 * Validate Cloudflare Pages _headers file
 * Checks for common syntax errors and unsupported headers
 */

console.log('🔍 Validating _headers file for Cloudflare Pages compatibility...\n');

const headersPath = join(__dirname, 'public', '_headers');

try {
    const content = readFileSync(headersPath, 'utf8');
    const lines = content.split('\n');

    let errors = [];
    let warnings = [];
    let currentPath = null;
    let lineNumber = 0;

    // Cloudflare Pages supported headers (not exhaustive, but common ones)
    const supportedHeaders = new Set([
        'cache-control',
        'content-type',
        'content-security-policy',
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection',
        'referrer-policy',
        'permissions-policy',
        'strict-transport-security',
        'x-robots-tag',
        'x-dns-prefetch-control',
        'service-worker-allowed',
        'pragma',
        'expires'
    ]);

    // Cloudflare-specific headers that are NOT supported in Pages
    const unsupportedHeaders = new Set([
        'cf-bot-management-score',
        'cf-ray',
        'cf-cache-status',
        'cf-request-id',
        'cf-connecting-ip',
        'cf-ipcountry',
        'cf-visitor'
    ]);

    for (const line of lines) {
        lineNumber++;

        // Skip empty lines and comments
        if (!line.trim() || line.trim().startsWith('#')) {
            continue;
        }

        // Check if this is a path line (starts with /)
        if (line.trim().startsWith('/')) {
            currentPath = line.trim();
            continue;
        }

        // Check if this is a header line (contains colon and is indented)
        if (line.includes(':') && line.startsWith('  ')) {
            const [headerName] = line.trim().split(':');
            const headerLower = headerName.toLowerCase().trim();

            // Check for unsupported Cloudflare headers
            if (unsupportedHeaders.has(headerLower)) {
                errors.push({
                    line: lineNumber,
                    message: `Unsupported Cloudflare header: ${headerName}. This header is not supported in Cloudflare Pages.`,
                    severity: 'error'
                });
            }

            // Check for potentially problematic headers
            if (headerLower === 'content-security-policy') {
                const headerValue = line.split(':').slice(1).join(':').trim();
                if (headerValue.length > 2048) {
                    warnings.push({
                        line: lineNumber,
                        message: `CSP header is very long (${headerValue.length} chars). Consider splitting or simplifying.`,
                        severity: 'warning'
                    });
                }
            }

            // Check for malformed headers
            if (!line.includes(':')) {
                errors.push({
                    line: lineNumber,
                    message: 'Header line missing colon separator.',
                    severity: 'error'
                });
            }

            // Check for headers with empty values
            const [, ...valueParts] = line.split(':');
            const value = valueParts.join(':').trim();
            if (!value) {
                warnings.push({
                    line: lineNumber,
                    message: `Header ${headerName} has empty value.`,
                    severity: 'warning'
                });
            }

            continue;
        }

        // If we get here, it's an unexpected line format
        if (line.trim()) {
            errors.push({
                line: lineNumber,
                message: `Unexpected line format: ${line.trim()}. Expected path (starting with /) or indented header.`,
                severity: 'error'
            });
        }
    }

    // Report results
    if (errors.length === 0 && warnings.length === 0) {
        console.log('✅ _headers file validation passed! No errors found.');
        console.log('📋 File appears compatible with Cloudflare Pages.');
        process.exit(0);
    }

    if (errors.length > 0) {
        console.log('❌ Validation failed with errors:');
        errors.forEach(error => {
            console.log(`  Line ${error.line}: ${error.message}`);
        });
        console.log('');
    }

    if (warnings.length > 0) {
        console.log('⚠️  Validation warnings:');
        warnings.forEach(warning => {
            console.log(`  Line ${warning.line}: ${warning.message}`);
        });
        console.log('');
    }

    if (errors.length > 0) {
        console.log('💡 Fix the errors above before deploying to Cloudflare Pages.');
        process.exit(1);
    } else {
        console.log('✅ No blocking errors found. Warnings are non-critical but should be reviewed.');
        process.exit(0);
    }

} catch (error) {
    console.error('❌ Failed to read _headers file:', error.message);
    process.exit(1);
}