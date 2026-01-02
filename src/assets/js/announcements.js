/**
 * Lazy Loading Announcement System
 * Loads and displays announcements after page load to avoid delaying initial render
 */

class AnnouncementManager {
    constructor() {
        this.container = null;
        this.currentAnnouncement = null;
        this.isLoading = false;
        this.isVisible = false;
        this.config = {
            lazyLoadDelay: 1000, // Delay before loading (ms)
            showDelay: 500, // Delay before showing after load (ms)
            position: 'top', // 'top' or 'bottom'
            dismissible: true,
            autoHideDelay: null, // Auto-hide after X ms (null = never)
            maxImpressions: null, // Max times to show per session
            cookieExpiry: 7 // Days to remember dismissal
        };
    }

    /**
     * Initialize the announcement system
     */
    async init() {
        // Create container
        this.createContainer();

        // Load configuration
        await this.loadConfig();

        // Check if should load announcement
        if (this.shouldLoadAnnouncement()) {
            // Start lazy loading
            setTimeout(() => {
                this.loadAnnouncement();
            }, this.config.lazyLoadDelay);
        }
    }

    /**
     * Create the announcement container
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'announcement-container';
        this.container.setAttribute('aria-live', 'polite');
        this.container.setAttribute('aria-label', 'Site announcements');

        // Insert at top of body
        document.body.insertBefore(this.container, document.body.firstChild);
    }

    /**
     * Load announcement configuration
     */
    async loadConfig() {
        try {
            // Load page-specific config first
            const pageConfig = await this.loadPageConfig();
            if (pageConfig?.announcement) {
                Object.assign(this.config, pageConfig.announcement);
                // Override with lazy loading settings if present
                if (pageConfig.announcement.lazyLoading) {
                    Object.assign(this.config, pageConfig.announcement.lazyLoading);
                }
                return;
            }

            // Fall back to global config
            const globalConfig = await this.loadGlobalConfig();
            if (globalConfig) {
                Object.assign(this.config, globalConfig);
                // Override with lazy loading settings if present
                if (globalConfig.lazyLoading) {
                    Object.assign(this.config, globalConfig.lazyLoading);
                }
            }

            // Override with window config if available
            if (window.announcementConfig) {
                Object.assign(this.config, window.announcementConfig);
            }
        } catch (error) {
            console.warn('Failed to load announcement config:', error);
        }
    }

    /**
     * Load page-specific announcement config
     */
    async loadPageConfig() {
        const pageName = this.getCurrentPageName();
        if (!pageName) return null;

        try {
            const response = await fetch(`/content/pages/${pageName}.json`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            // Page config doesn't exist, which is fine
        }
        return null;
    }

    /**
     * Load global announcement config
     */
    async loadGlobalConfig() {
        try {
            const response = await fetch('/content/announcement.json');
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('Failed to load global announcement config:', error);
        }
        return null;
    }

    /**
     * Get current page name for config loading
     */
    getCurrentPageName() {
        const path = window.location.pathname;
        const pageName = path.split('/').pop() || 'index';
        return pageName.replace('.html', '');
    }

    /**
     * Check if announcement should be loaded
     */
    shouldLoadAnnouncement() {
        // Check if disabled
        if (!this.config.enabled) return false;

        // Check cookie for dismissal
        if (this.isDismissed()) return false;

        // Check impression limits
        if (this.hasReachedImpressionLimit()) return false;

        // Check targeting rules
        if (!this.matchesTargetingRules()) return false;

        return true;
    }

    /**
     * Check if announcement was dismissed
     */
    isDismissed() {
        const cookieName = `announcement_dismissed_${this.config.id}`;
        const cookie = this.getCookie(cookieName);
        return cookie === 'true';
    }

    /**
     * Check if impression limit reached
     */
    hasReachedImpressionLimit() {
        if (!this.config.maxImpressions) return false;

        const cookieName = `announcement_impressions_${this.config.id}`;
        const impressions = parseInt(this.getCookie(cookieName) || '0');
        return impressions >= this.config.maxImpressions;
    }

    /**
     * Check if current page matches targeting rules
     */
    matchesTargetingRules() {
        const currentPath = window.location.pathname;

        // Check exclude pages
        if (this.config.targeting?.excludePages) {
            for (const excludePath of this.config.targeting.excludePages) {
                if (currentPath.includes(excludePath)) {
                    return false;
                }
            }
        }

        // Check include pages (default: all pages)
        if (this.config.targeting?.pages) {
            const includesAll = this.config.targeting.pages.includes('*');
            if (!includesAll) {
                const matchesInclude = this.config.targeting.pages.some(page =>
                    currentPath.includes(page)
                );
                if (!matchesInclude) return false;
            }
        }

        return true;
    }

    /**
     * Load and display announcement
     */
    async loadAnnouncement() {
        if (this.isLoading) return;

        this.isLoading = true;

        try {
            // Load announcement HTML template
            const template = await this.loadAnnouncementTemplate();

            if (template) {
                // Render announcement
                this.renderAnnouncement(template);

                // Track impression
                this.trackImpression();

                // Show with delay
                setTimeout(() => {
                    this.showAnnouncement();
                }, this.config.showDelay);

                // Auto-hide if configured
                if (this.config.autoHideDelay) {
                    setTimeout(() => {
                        this.hideAnnouncement();
                    }, this.config.autoHideDelay);
                }
            }
        } catch (error) {
            console.warn('Failed to load announcement:', error);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Load announcement HTML template
     */
    async loadAnnouncementTemplate() {
        try {
            // For now, we'll create the HTML dynamically
            // In a real implementation, you might load from a server endpoint
            return this.createAnnouncementHTML();
        } catch (error) {
            console.warn('Failed to load announcement template:', error);
            return null;
        }
    }

    /**
     * Create announcement HTML dynamically
     */
    createAnnouncementHTML() {
        const announcement = this.config;

        let html = `
            <div class="announcement-banner announcement-info"
                 data-banner-id="${announcement.id}"
                 role="banner"
                 aria-label="info announcement"
                 style="background: linear-gradient(135deg, ${announcement.style?.backgroundColor || '#1d4ed8'}, ${announcement.style?.backgroundColorAlt || announcement.style?.backgroundColor || '#1d4ed8'});
                        color: ${announcement.style?.textColor || '#ffffff'};
                        padding: 8px 0;
                        position: relative;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                        border-bottom: 1px solid rgba(255,255,255,0.10);">
                <div class="announcement-content"
                     style="display: flex; align-items: center; justify-content: center; gap: 16px;
                            max-width: 1200px; margin: 0 auto; padding: 0 16px; flex-wrap: wrap;">
                    <div class="announcement-icon" style="font-size: 1.2rem; flex-shrink: 0;">
                        ${announcement.content?.icon || '🚀'}
                    </div>
                    <div class="announcement-text" style="flex: 1; min-width: 200px; text-align: center;">
        `;

        // Badge
        if (announcement.content?.badge) {
            html += `
                <strong class="announcement-badge"
                        style="display: inline-block; font-size: 0.75rem; font-weight: 700;
                               padding: 2px 8px; border-radius: 4px;
                               background: ${announcement.style?.accentColor || '#fbbf24'};
                               color: #000; margin-right: 8px;">
                    ${announcement.content.badge}
                </strong>
            `;
        }

        // Message
        html += `
            <span class="announcement-message" style="font-size: 0.9rem; font-weight: 400; opacity: 0.95;">
                ${announcement.content?.message || ''}
            </span>
        `;

        html += `
                    </div>
                    <div class="announcement-actions" style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
        `;

        // Link
        if (announcement.content?.link?.text) {
            const linkUrl = announcement.content.link.url || announcement.content.link.href || '#';
            const isExternal = announcement.content.link.external;
            html += `
                <a href="${linkUrl}"
                   class="announcement-link"
                   style="color: ${announcement.style?.textColor || '#ffffff'};
                          text-decoration: underline; font-weight: 600;
                          padding: 4px 12px; border-radius: 6px;
                          background: rgba(255,255,255,0.10);
                          transition: opacity 0.15s ease-out;"
                   ${isExternal ? 'target="_blank" rel="noopener"' : ''}>
                    ${announcement.content.link.text}
                </a>
            `;
        }

        // Dismiss button
        if (announcement.dismissible) {
            html += `
                <button class="announcement-close"
                        aria-label="Dismiss announcement"
                        data-banner-id="${announcement.id}"
                        style="background: none; border: none;
                               color: ${announcement.style?.textColor || '#ffffff'};
                               cursor: pointer; padding: 4px; border-radius: 6px;
                               transition: background-color 0.15s ease-out;
                               display: flex; align-items: center; justify-content: center;
                               font-size: 1.2rem; line-height: 1; width: 24px; height: 24px;">
                    ×
                </button>
            `;
        }

        html += `
                    </div>
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Render announcement in container
     */
    renderAnnouncement(html) {
        this.container.innerHTML = html;
        this.currentAnnouncement = this.container.querySelector('.announcement-banner');

        // Add event listeners
        this.attachEventListeners();
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        if (!this.currentAnnouncement) return;

        // Dismiss button
        const dismissBtn = this.currentAnnouncement.querySelector('.announcement-close');
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                this.dismissAnnouncement();
            });
        }

        // Link click tracking
        const link = this.currentAnnouncement.querySelector('.announcement-link');
        if (link) {
            link.addEventListener('click', () => {
                this.trackLinkClick();
            });
        }
    }

    /**
     * Show announcement with animation
     */
    showAnnouncement() {
        if (!this.currentAnnouncement) return;

        this.currentAnnouncement.style.opacity = '0';
        this.currentAnnouncement.style.transform = 'translateY(-100%)';
        this.currentAnnouncement.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';

        // Force reflow
        this.currentAnnouncement.offsetHeight;

        this.currentAnnouncement.style.opacity = '1';
        this.currentAnnouncement.style.transform = 'translateY(0)';
        this.isVisible = true;
    }

    /**
     * Hide announcement
     */
    hideAnnouncement() {
        if (!this.currentAnnouncement || !this.isVisible) return;

        this.currentAnnouncement.style.opacity = '0';
        this.currentAnnouncement.style.transform = 'translateY(-100%)';

        setTimeout(() => {
            if (this.container) {
                this.container.innerHTML = '';
                this.currentAnnouncement = null;
                this.isVisible = false;
            }
        }, 300);
    }

    /**
     * Dismiss announcement
     */
    dismissAnnouncement() {
        this.setCookie(`announcement_dismissed_${this.config.id}`, 'true', this.config.cookieExpiry);
        this.hideAnnouncement();
    }

    /**
     * Track impression
     */
    trackImpression() {
        const cookieName = `announcement_impressions_${this.config.id}`;
        const current = parseInt(this.getCookie(cookieName) || '0');
        this.setCookie(cookieName, (current + 1).toString(), 1); // 1 day expiry for impressions
    }

    /**
     * Track link click
     */
    trackLinkClick() {
        // Track analytics event
        if (window.gtag) {
            window.gtag('event', 'announcement_click', {
                announcement_id: this.config.id,
                page_location: window.location.pathname
            });
        }
    }

    /**
     * Cookie utilities
     */
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if not disabled globally
    if (!window.disableAnnouncements) {
        const announcementManager = new AnnouncementManager();
        announcementManager.init();

        // Make available globally for debugging
        window.announcementManager = announcementManager;
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnnouncementManager;
}