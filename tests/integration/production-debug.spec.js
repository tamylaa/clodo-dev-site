/**
 * Production Debug Test
 * Tests to identify why Try Live Demo button isn't working on production
 */

import { test, expect } from '@playwright/test';

test.describe('Production Button Debug', () => {
    test('check if stackblitz module loads and attaches handlers', async ({ page }) => {
        // Navigate to production site
        await page.goto('https://www.clodo.dev/');
        
        // Wait for page to be fully loaded
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Check if buttons exist
        const buttons = await page.locator('[data-stackblitz-url]').count();
        console.log(`Found ${buttons} buttons with data-stackblitz-url`);
        expect(buttons).toBeGreaterThan(0);
        
        // Check if stackblitz module loaded
        const moduleLoaded = await page.evaluate(() => {
            return typeof window.__stackblitzModule !== 'undefined';
        });
        console.log('Stackblitz module loaded:', moduleLoaded);
        
        // Check if openStackBlitz function exists
        const functionExists = await page.evaluate(() => {
            return typeof window.openStackBlitz === 'function';
        });
        console.log('openStackBlitz function exists:', functionExists);
        
        // Check if handlers are attached
        const handlersAttached = await page.evaluate(() => {
            const buttons = document.querySelectorAll('[data-stackblitz-url]');
            const results = [];
            buttons.forEach((btn, i) => {
                results.push({
                    index: i,
                    text: btn.textContent.trim().substring(0, 20),
                    hasListener: btn.__stackblitzBound === true,
                    onclick: btn.onclick ? 'YES' : 'NO'
                });
            });
            return results;
        });
        console.log('Button handlers:', JSON.stringify(handlersAttached, null, 2));
        
        // Check console for initialization messages
        const logs = [];
        page.on('console', msg => {
            if (msg.text().includes('StackBlitz') || msg.text().includes('stackblitz')) {
                logs.push(msg.text());
            }
        });
        
        // Try clicking the first button
        const firstButton = page.locator('[data-stackblitz-url]').first();
        await firstButton.scrollIntoViewIfNeeded();
        
        // Listen for popup
        const popupPromise = page.waitForEvent('popup', { timeout: 5000 }).catch(() => null);
        
        await firstButton.click();
        const popup = await popupPromise;
        
        if (popup) {
            console.log('✓ Popup opened successfully');
            await popup.close();
        } else {
            console.log('✗ No popup opened - button click handler not working');
        }
        
        // Print all console logs
        console.log('Console logs:', logs);
        
        // Check if click worked
        expect(popup).not.toBeNull();
    });
    
    test('check main.js execution order', async ({ page }) => {
        const consoleLogs = [];
        page.on('console', msg => {
            consoleLogs.push({
                type: msg.type(),
                text: msg.text()
            });
        });
        
        await page.goto('https://www.clodo.dev/');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Filter for relevant logs
        const relevantLogs = consoleLogs.filter(log => 
            log.text.includes('Main.js') ||
            log.text.includes('StackBlitz') ||
            log.text.includes('SEO') ||
            log.text.includes('init')
        );
        
        console.log('=== Initialization Logs ===');
        relevantLogs.forEach(log => {
            console.log(`[${log.type}] ${log.text}`);
        });
        
        // Check if stackblitz init log appears
        const stackblitzInitLog = relevantLogs.find(log => 
            log.text.includes('StackBlitz integration initialized')
        );
        
        if (stackblitzInitLog) {
            console.log('✓ StackBlitz was initialized');
        } else {
            console.log('✗ StackBlitz initialization not found in logs');
        }
    });
});
