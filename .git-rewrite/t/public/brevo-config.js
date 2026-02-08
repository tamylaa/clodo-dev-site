// Brevo (formerly Sendinblue) configuration
// This file contains public configuration and loads secure credentials from brevo-secure-config.js

window.BREVO_CONFIG = {
    // API key and list ID are loaded from the secure config file
    get API_KEY() {
        const key = window.BREVO_SECURE_CONFIG?.API_KEY || 'YOUR_BREVO_API_KEY_HERE';
        console.log('BREVO_CONFIG API_KEY getter called. Secure config available:', !!window.BREVO_SECURE_CONFIG);
        console.log('API_KEY value:', key ? key.substring(0, 10) + '...' : 'NOT SET');
        return key;
    },

    get LIST_ID() {
        const id = window.BREVO_SECURE_CONFIG?.LIST_ID || null;
        console.log('BREVO_CONFIG LIST_ID getter called. LIST_ID value:', id);
        return id;
    },

    // Optional: Configure double opt-in
    DOUBLE_OPT_IN: true,

    // Optional: Template ID for confirmation email (if using double opt-in)
    TEMPLATE_ID: null,

    // Optional: Redirect URL after successful subscription
    REDIRECT_URL: null
};

// Debug: Check if secure config is loaded when this script runs
console.log('brevo-config.js loaded. BREVO_SECURE_CONFIG available:', !!window.BREVO_SECURE_CONFIG);
if (window.BREVO_SECURE_CONFIG) {
    console.log('Secure config contents:', {
        hasApiKey: !!window.BREVO_SECURE_CONFIG.API_KEY,
        listId: window.BREVO_SECURE_CONFIG.LIST_ID
    });
} else {
    console.log('BREVO_SECURE_CONFIG not found - secure config file may not be loading');
}