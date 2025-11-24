/**
 * Features Modules Index
 * 
 * Central reference point for all feature modules.
 * Features are optional functionality that can be enabled/disabled.
 * 
 * These are loaded as separate script tags, not as ES modules.
 * Access via window.NewsletterAPI, window.FormsAPI, etc.
 */

// All feature modules are now loaded and exposed to window via separate script tags
// This file documents the available APIs but doesn't re-export them

if (typeof window !== 'undefined') {
    // Create a Features namespace for organization
    window.Features = {
        Newsletter: typeof window.NewsletterAPI !== 'undefined' ? window.NewsletterAPI : null,
        Forms: typeof window.FormsAPI !== 'undefined' ? window.FormsAPI : null,
        // Additional features to be added as they're extracted from script.js
    };
}
