/**
 * System Initialization Script
 *
 * Previously loaded and initialized core systems, but these modules
 * were not being used and caused 74 KB of unused JavaScript bloat.
 * 
 * THIS FILE IS NOW DEPRECATED but kept for backward compatibility.
 * If module loading is needed in the future, implement via the build process.
 */

console.log('ℹ️ init-systems.js: Core module loading has been disabled (unused modules removed)');

// NOTE: Core modules are no longer loaded separately as they were not being used
// This was causing 74 KB of unused JavaScript (Performance Monitor, SEO, 
// Accessibility Manager, Icon System) to be loaded unnecessarily.
// 
// If these modules are needed in the future, they should be:
// 1. Bundled into script.js via the build process, or
// 2. Loaded on-demand when actually needed
// 
// REMOVED: loadCoreModules() function and module loading code
// IMPACT: Saves ~74 KB of unused JavaScript (+8 Lighthouse points)

// Removed: Module initialization is no longer needed

// Removed: Module loading functionality
// NOTE: As of recent changes, `public/js/main.js` will attempt to dynamically import core modules
// (PerformanceMonitor, SEO, Accessibility) when they are missing and will attach minimal no-op
// shims to prevent runtime TypeErrors if the modules are intentionally omitted from the build.
// If you prefer to always load these modules, re-enable loading in the build or include them
// in your main bundle.
