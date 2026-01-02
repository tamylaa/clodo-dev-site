/**
 * Theme Manager Module
 * 
 * Handles light/dark theme switching
 * Migrated from script.js setupThemeToggle()
 * 
 * Access via window.ThemeManager
 */

class ThemeManager {
    constructor() {
        this.THEME_KEY = 'site-theme';
        // Prefer already-applied theme from inline script
        this.currentTheme = document.documentElement.getAttribute('data-theme') || 
                           this.getStoredTheme() || 
                           this.getSystemPreference();
    }

    /**
     * Get system color scheme preference
     */
    getSystemPreference() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
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

        const lightIcon = toggleBtn.querySelector('.theme-icon--light');
        const darkIcon = toggleBtn.querySelector('.theme-icon--dark');

        if (this.currentTheme === 'dark') {
            if (lightIcon) lightIcon.style.display = 'none';
            if (darkIcon) darkIcon.style.display = 'inline';
        } else {
            if (lightIcon) lightIcon.style.display = 'inline';
            if (darkIcon) darkIcon.style.display = 'none';
        }
    }

    /**
     * Setup event listeners
     */
    setupListeners() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (!toggleBtn) {
            // Theme toggle not on this page - wait for DOM if needed
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupListeners());
            }
            return;
        }

        toggleBtn.addEventListener('click', () => this.toggle());
    }

    /**
     * Initialize theme manager
     * Skips re-applying theme if inline script already set it
     */
    init() {
        // Inline script already applied theme, just setup toggle listeners
        this.setupListeners();
        // Update toggle button to match current theme
        this.updateToggleButton();
        console.log('[ThemeManager] Initialized with theme:', this.currentTheme);
    }
}

// Initialize function
function initTheme() {
    const theme = new ThemeManager();
    theme.init();
    return theme;
}

// Expose to window
if (typeof window !== 'undefined') {
    window.ThemeManager = ThemeManager;
    window.initTheme = initTheme;
}
