// Secure Brevo configuration - TEMPLATE FILE
// This file should NOT be committed to version control
// Copy this to brevo-secure-config.js and fill in your actual credentials

console.log('brevo-secure-config.js is loading...');

window.BREVO_SECURE_CONFIG = {
    // Your Brevo API key - get this from https://app.brevo.com/settings/keys/api
    API_KEY: 'YOUR_BREVO_API_KEY_HERE',

    // Your mailing list ID - find this in your Brevo dashboard under Contacts > Lists
    // Go to https://app.brevo.com/contacts/lists and click on your list
    // The ID will be in the URL: https://app.brevo.com/contacts/lists/123
    LIST_ID: null, // Replace with your actual list ID
};

console.log('brevo-secure-config.js loaded successfully:', {
    hasApiKey: !!window.BREVO_SECURE_CONFIG.API_KEY && window.BREVO_SECURE_CONFIG.API_KEY !== 'YOUR_BREVO_API_KEY_HERE',
    listId: window.BREVO_SECURE_CONFIG.LIST_ID
});