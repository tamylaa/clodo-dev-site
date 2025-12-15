/**
 * Core Modules Index
 * 
 * Central export point for all core functionality.
 * Import from this file instead of individual modules.
 * 
 * Usage:
 *   import { ThemeManager, App, Navigation, EventBus, Storage, Component, PerformanceMonitor, SEO } from './core/index.js';
 */

// Base component class
export { default as Component, createComponent, getComponent, hasComponent } from './component.js';

// Performance monitoring
export { default as PerformanceMonitor } from './performance-monitor.js';

// SEO management
export { default as SEO } from './seo.js';

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
