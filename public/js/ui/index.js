/**
 * UI Modules Index
 * 
 * Central reference point for all UI component modules.
 * UI modules handle interactive components and visual feedback.
 * 
 * These are loaded as separate script tags, not as ES modules.
 * Access via window.NavigationComponent, window.Modal, window.Tabs, window.TooltipAPI
 */

// All UI modules are now loaded and exposed to window via separate script tags
// This file documents the available APIs but doesn't re-export them

if (typeof window !== 'undefined') {
    // Create a UI namespace for organization
    window.UI = {
        NavigationComponent: typeof window.NavigationComponent !== 'undefined' ? window.NavigationComponent : null,
        Modal: typeof window.Modal !== 'undefined' ? window.Modal : null,
        Tabs: typeof window.Tabs !== 'undefined' ? window.Tabs : null,
        TooltipAPI: typeof window.TooltipAPI !== 'undefined' ? window.TooltipAPI : null,
    };
}
