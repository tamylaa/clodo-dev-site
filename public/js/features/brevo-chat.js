/**
 * Brevo Chat Integration Module
 *
 * Integrates Brevo live chat widget as an engagement magnet
 * Loads asynchronously to avoid LCP impact
 */

class BrevoChatManager {
  constructor() {
    this.isLoaded = false;
    this.isEnabled = true; // Feature flag
    this.websiteId = null; // To be set from config
  }

  /**
   * Initialize Brevo Chat
   * @param {Object} config - Configuration object
   */
  init(config = {}) {
    console.log('[BrevoChat] Init called with config:', config);
    if (!this.isEnabled) {
      console.log('[BrevoChat] Disabled by feature flag');
      return;
    }

    this.websiteId = config.websiteId || '68fe79edfbaca7d0230ae87d'; // Your actual Brevo website ID
    console.log('[BrevoChat] Website ID set to:', this.websiteId);

    // Defer loading until after page load to preserve LCP
    if (document.readyState === 'loading') {
      console.log('[BrevoChat] Waiting for DOMContentLoaded');
      document.addEventListener('DOMContentLoaded', () => this.loadChat());
    } else {
      // Page already loaded, load immediately but defer
      console.log('[BrevoChat] Page already loaded, deferring chat load');
      setTimeout(() => this.loadChat(), 100);
    }
  }

  /**
   * Load Brevo chat widget using the official Brevo Conversations code
   */
  loadChat() {
    if (this.isLoaded) return;

    try {
      // Use the official Brevo Conversations initialization code
      (function(d, w, c) {
        w.BrevoConversationsID = this.websiteId;
        w[c] = w[c] || function() {
          (w[c].q = w[c].q || []).push(arguments);
        };
        var s = d.createElement('script');
        s.async = true;
        s.src = 'https://conversations-widget.brevo.com/brevo-conversations.js';
        
        // Add nonce for CSP compliance
        const nonce = d.querySelector('script[nonce]')?.nonce;
        if (nonce) {
          s.nonce = nonce;
        }
        
        s.onload = () => {
          this.isLoaded = true;
          console.log('[BrevoChat] Widget loaded successfully');
          this.trackEngagement();
        };
        
        s.onerror = (error) => {
          console.error('[BrevoChat] Failed to load widget:', error);
          this.handleFallback();
        };
        
        if (d.head) d.head.appendChild(s);
      }).call(this, document, window, 'BrevoConversations');

    } catch (error) {
      console.error('[BrevoChat] Initialization error:', error);
      this.handleFallback();
    }
  }

  /**
   * Track engagement events
   */
  trackEngagement() {
    // Track chat events if Google Analytics is available
    if (window.gtag) {
      // Listen for Brevo chat events (if exposed)
      // This would need to be customized based on Brevo's event API
    }
  }

  /**
   * Handle fallback when chat fails to load
   */
  handleFallback() {
    // Could show a static contact link or form
    console.log('[BrevoChat] Using fallback contact method');
  }

  /**
   * Manually show/hide chat widget
   */
  show() {
    if (window.BrevoConversations && window.BrevoConversations.show) {
      window.BrevoConversations.show();
    }
  }

  hide() {
    if (window.BrevoConversations && window.BrevoConversations.hide) {
      window.BrevoConversations.hide();
    }
  }
}

// Export for use in main.js
export default BrevoChatManager;