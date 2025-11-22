/**
 * Core Modules Index
 * 
 * Central export point for all core functionality.
 * Import from this file instead of individual modules.
 * 
 * Usage:
 *   import { ThemeManager, App, Navigation, EventBus, Storage } from './core/index.js';
 */

// Theme management
export { default as ThemeManager } from './theme.js';

// App orchestrator
export { default as App, AppState } from './app.js';

// Navigation manager
export { default as Navigation } from './navigation.js';

// Event bus
export { default as EventBus } from './event-bus.js';

// Storage wrapper
export { default as Storage, StorageType } from './storage.js';
