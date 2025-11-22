/**
 * Core Modules Index
 * 
 * Central export point for all core functionality.
 * Import from this file instead of individual modules.
 * 
 * Usage:
 *   import { ThemeManager, App, Router } from './core/index.js';
 */

// Theme management
export { default as ThemeManager } from './theme.js';

// App orchestrator
export { default as App, AppState } from './app.js';

// Future core modules (to be implemented):
// export { default as Router } from './router.js';
// export { default as EventBus } from './events.js';
// export { default as Storage } from './storage.js';
