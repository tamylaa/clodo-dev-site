/**
 * Dynamic Announcement Manager
 * Handles page-specific, context-aware announcements loaded from config
 * Replaces static banner injection with dynamic, dismissible announcements
 */

(function() {
  'use strict';

  class AnnouncementManager {
    constructor() {
      this.config = null;
      this.currentPage = window.location.pathname;
      this.announcements = [];
      this.container = null;
    }

    /**
     * Initialize the announcement manager
     * Load config and render appropriate announcements
     */
    async init() {
      try {
        // Load announcements config
        const response = await fetch('/config/announcements.json');
        if (!response.ok) {
          console.warn('[Announcements] Config not found');
          return;
        }

        this.config = await response.json();
        
        if (!this.config.enabled) {
          console.log('[Announcements] Announcements disabled in config');
          return;
        }

        // Check if current page is excluded globally
        if (this.isPageExcluded()) {
          console.log('[Announcements] Page excluded globally');
          return;
        }

        console.log('[Announcements] Manager initialized');
        
        // Get the announcement container or create one
        this.container = document.querySelector('.announcement-container');
        if (!this.container) {
          this.createContainer();
        }

        // Determine which announcements to show
        await this.determineAnnouncements();

        // Render announcements with configured delays
        if (this.announcements.length > 0) {
          this.renderWithDelays();
        } else {
          console.log('[Announcements] No announcements for this page');
          this.clearContainer();
        }
      } catch (error) {
        console.error('[Announcements] Error initializing:', error);
      }
    }

    /**
     * Check if current page is globally excluded
     */
    isPageExcluded() {
      if (!this.config.excludePages) return false;
      return this.config.excludePages.some(page => 
        this.currentPage === page || this.matchesPattern(this.currentPage, page)
      );
    }

    /**
     * Create announcement container if it doesn't exist
     */
    createContainer() {
      this.container = document.createElement('div');
      this.container.className = 'announcement-container';
      const body = document.body;
      if (body) {
        body.insertBefore(this.container, body.firstChild);
      }
    }

    /**
     * Clear the announcement container
     */
    clearContainer() {
      if (this.container) {
        this.container.innerHTML = '';
        this.container.style.display = 'none';
      }
    }

    /**
     * Determine which announcements should be displayed
     */
    async determineAnnouncements() {
      // Check for page-specific announcements first
      if (this.config.pageSpecificAnnouncements[this.currentPage]) {
        const pageAnnouncements = this.config.pageSpecificAnnouncements[this.currentPage];
        for (const announcement of pageAnnouncements) {
          if (!this.isDismissed(announcement)) {
            this.announcements.push(announcement);
          }
        }
        console.log(`[Announcements] Found ${this.announcements.length} page-specific announcement(s)`);
        return;
      }

      // Fall back to global announcements if not excluded
      if (this.config.globalAnnouncements) {
        for (const announcement of this.config.globalAnnouncements) {
          if (this.shouldShowGlobalAnnouncement(announcement)) {
            if (!this.isDismissed(announcement)) {
              this.announcements.push(announcement);
            }
          }
        }
      }
      
      console.log(`[Announcements] Found ${this.announcements.length} global announcement(s) for this page`);
    }

    /**
     * Check if a global announcement should be shown on this page
     */
    shouldShowGlobalAnnouncement(announcement) {
      // Check if page is in exclude list
      if (announcement.excludePages && announcement.excludePages.includes(this.currentPage)) {
        return false;
      }

      // Check if page matches exclude patterns
      if (announcement.excludePatterns) {
        for (const pattern of announcement.excludePatterns) {
          if (this.matchesPattern(this.currentPage, pattern)) {
            return false;
          }
        }
      }

      return true;
    }

    /**
     * Check if a path matches a pattern (supports wildcards)
     */
    matchesPattern(path, pattern) {
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*');
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(path);
    }

    /**
     * Check if announcement has been dismissed
     */
    isDismissed(announcement) {
      if (!announcement.dismissible || !announcement.storageKey) {
        return false;
      }
      return localStorage.getItem(announcement.storageKey) === 'dismissed';
    }

    /**
     * Mark announcement as dismissed
     */
    dismissAnnouncement(storageKey) {
      if (storageKey) {
        localStorage.setItem(storageKey, 'dismissed');
        console.log(`[Announcements] Dismissed: ${storageKey}`);
      }
    }

    /**
     * Render announcements with configured delays and smooth fade-in
     */
    renderWithDelays() {
      if (!this.container) return;

      this.container.innerHTML = '';
      this.container.style.display = 'block';

      // Add CSS for animations if not already present
      if (!document.getElementById('announcement-styles')) {
        const style = document.createElement('style');
        style.id = 'announcement-styles';
        style.textContent = `
          @keyframes announceSlideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .announcement-banner {
            animation: announceSlideDown 0.4s ease-out forwards;
          }
        `;
        document.head.appendChild(style);
      }

      // Render each announcement with its configured delay
      for (const announcement of this.announcements) {
        const delay = announcement.delayMs !== undefined ? announcement.delayMs : (this.config.defaultDelayMs || 2500);
        
        setTimeout(() => {
          const element = this.createAnnouncementElement(announcement);
          this.container.appendChild(element);
          console.log(`[Announcements] Rendered with ${delay}ms delay: ${announcement.id}`);
        }, delay);
      }
    }

    /**
     * Create a single announcement element
     */
    createAnnouncementElement(announcement) {
      const typeConfig = this.config.types[announcement.type] || this.config.types.info;
      
      const div = document.createElement('div');
      div.className = `announcement-banner announcement-${announcement.type}`;
      div.setAttribute('data-banner-id', announcement.id);
      div.setAttribute('role', 'banner');
      div.setAttribute('aria-label', `${announcement.type} announcement`);
      
      div.style.cssText = `
        background: ${typeConfig.background};
        color: ${typeConfig.color};
        padding: 8px 0;
        position: ${announcement.position === 'sticky' ? 'sticky' : 'relative'};
        top: ${announcement.position === 'sticky' ? '0' : 'auto'};
        z-index: ${announcement.position === 'sticky' ? '999' : 'auto'};
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        border-bottom: 1px solid rgba(255,255,255,0.10);
      `;

      const contentDiv = document.createElement('div');
      contentDiv.className = 'announcement-content';
      contentDiv.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 16px;
        flex-wrap: wrap;
      `;

      // Icon
      if (announcement.icon) {
        const iconDiv = document.createElement('div');
        iconDiv.className = 'announcement-icon';
        iconDiv.style.cssText = 'font-size: 1.2rem; flex-shrink: 0;';
        iconDiv.textContent = announcement.icon;
        contentDiv.appendChild(iconDiv);
      }

      // Text content
      const textDiv = document.createElement('div');
      textDiv.className = 'announcement-text';
      textDiv.style.cssText = 'flex: 1; min-width: 200px; text-align: center;';

      if (announcement.title) {
        const titleSpan = document.createElement('strong');
        titleSpan.className = 'announcement-title';
        titleSpan.style.cssText = 'display: block; font-size: 1rem; font-weight: 600; margin-bottom: 4px;';
        titleSpan.textContent = announcement.title;
        textDiv.appendChild(titleSpan);
      }

      if (announcement.message) {
        const messageSpan = document.createElement('span');
        messageSpan.className = 'announcement-message';
        messageSpan.style.cssText = 'font-size: 0.9rem; font-weight: 400; opacity: 0.95;';
        messageSpan.textContent = announcement.message;
        textDiv.appendChild(messageSpan);
      }

      contentDiv.appendChild(textDiv);

      // Actions (CTA + Close)
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'announcement-actions';
      actionsDiv.style.cssText = 'display: flex; align-items: center; gap: 8px; flex-shrink: 0;';

      // CTA link
      if (announcement.cta) {
        const link = document.createElement('a');
        link.href = announcement.cta.url;
        link.className = 'announcement-link';
        link.textContent = announcement.cta.text;
        link.style.cssText = `
          color: ${typeConfig.color};
          text-decoration: underline;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 6px;
          background: rgba(255,255,255,0.10);
          transition: opacity 0.15s ease-out;
          cursor: pointer;
        `;
        link.addEventListener('mouseover', () => {
          link.style.opacity = '0.8';
        });
        link.addEventListener('mouseout', () => {
          link.style.opacity = '1';
        });
        actionsDiv.appendChild(link);
      }

      // Close button
      if (announcement.dismissible) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'announcement-close';
        closeBtn.setAttribute('aria-label', 'Dismiss announcement');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
          background: none;
          border: none;
          color: ${typeConfig.color};
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: background-color 0.15s ease-out;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          line-height: 1;
          width: 24px;
          height: 24px;
          opacity: 0.8;
        `;
        
        closeBtn.addEventListener('click', () => {
          this.dismissAnnouncement(announcement.storageKey);
          div.style.display = 'none';
          console.log(`[Announcements] User dismissed: ${announcement.id}`);
        });

        closeBtn.addEventListener('mouseover', () => {
          closeBtn.style.backgroundColor = 'rgba(255,255,255,0.2)';
          closeBtn.style.opacity = '1';
        });

        closeBtn.addEventListener('mouseout', () => {
          closeBtn.style.backgroundColor = 'transparent';
          closeBtn.style.opacity = '0.8';
        });

        actionsDiv.appendChild(closeBtn);
      }

      contentDiv.appendChild(actionsDiv);
      div.appendChild(contentDiv);

      return div;
    }
  }

  // Initialize when document is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const manager = new AnnouncementManager();
      manager.init();
    });
  } else {
    const manager = new AnnouncementManager();
    manager.init();
  }

  // Expose to window for manual control if needed
  window.AnnouncementManager = AnnouncementManager;
})();
