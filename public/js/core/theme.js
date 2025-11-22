/**
 * Theme Manager Module
 * 
 * Handles light/dark theme switching
 * Migrated from script.js setupThemeToggle()
 * 
 * Usage:
 * import { ThemeManager } from './core/theme.js';
 * const theme = new ThemeManager();
 * theme.init();
 */

export class ThemeManager {
    constructor() {
        this.THEME_KEY = 'clodo-theme';
        this.currentTheme = this.getStoredTheme() || 'dark';
    }

    /**
     * Get theme from localStorage
     */
    getStoredTheme() {
        try {
            return localStorage.getItem(this.THEME_KEY);
        } catch (e) {
            console.warn('[ThemeManager] localStorage not available', e);
            return null;
        }
    }

    /**
     * Save theme to localStorage
     */
    saveTheme(theme) {
        try {
            localStorage.setItem(this.THEME_KEY, theme);
        } catch (e) {
            console.warn('[ThemeManager] Could not save theme', e);
        }
    }

    /**
     * Apply theme to document
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        this.saveTheme(theme);
        
        // Update toggle button state if it exists
        this.updateToggleButton();
    }

    /**
     * Toggle between light and dark themes
     */
    toggle() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
    }

    /**
     * Update theme toggle button state
     */
    updateToggleButton() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (!toggleBtn) return;

        const moonIcon = toggleBtn.querySelector('.theme-icon-moon');
        const sunIcon = toggleBtn.querySelector('.theme-icon-sun');

        if (this.currentTheme === 'dark') {
            moonIcon?.classList.remove('hidden');
            sunIcon?.classList.add('hidden');
        } else {
            moonIcon?.classList.add('hidden');
            sunIcon?.classList.remove('hidden');
        }
    }

    /**
     * Setup event listeners
     */
    setupListeners() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (!toggleBtn) {
            console.warn('[ThemeManager] Theme toggle button not found');
            return;
        }

        toggleBtn.addEventListener('click', () => this.toggle());
    }

    /**
     * Initialize theme manager
     */
    init() {
        // Apply stored or default theme immediately
        this.applyTheme(this.currentTheme);
        
        // Setup event listeners when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupListeners());
        } else {
            this.setupListeners();
        }

        console.log('[ThemeManager] Initialized with theme:', this.currentTheme);
    }
}

// Named exports for flexibility
export function init() {
    const theme = new ThemeManager();
    theme.init();
    return theme;
}

// Default export
export default ThemeManager;
