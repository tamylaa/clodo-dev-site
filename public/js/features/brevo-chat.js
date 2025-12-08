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
    if (!this.isEnabled) {
      console.log('[BrevoChat] Disabled by feature flag');
      return;
    }

    this.websiteId = config.websiteId || 'YOUR_WEBSITE_ID'; // Replace with actual ID

    // Defer loading until after page load to preserve LCP
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.loadChat());
    } else {
      // Page already loaded, load immediately but defer
      setTimeout(() => this.loadChat(), 100);
    }
  }

  /**
   * Load Brevo chat widget
   */
  loadChat() {
    if (this.isLoaded) return;

    try {
      // Set up Brevo configuration
      window.BrevoConversationsSetup = {
        v: 2,
        websiteId: this.websiteId,
        // Add other configuration options as needed
        // popup: { enabled: true },
        // proactive: { enabled: true }
      };

      // Load the chat script
      const script = document.createElement('script');
      script.src = 'https://cdn.brevo.com/js/chat.js';
      script.async = true;
      script.id = 'brevo-chat-script';

      // Add nonce for CSP compliance
      const nonce = document.querySelector('script[nonce]')?.nonce;
      if (nonce) {
        script.nonce = nonce;
      }

      script.onload = () => {
        this.isLoaded = true;
        console.log('[BrevoChat] Widget loaded successfully');
        this.trackEngagement();
      };

      script.onerror = (error) => {
        console.error('[BrevoChat] Failed to load widget:', error);
        this.handleFallback();
      };

      document.head.appendChild(script);

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