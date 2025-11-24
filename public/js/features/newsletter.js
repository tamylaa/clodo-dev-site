/**
 * Newsletter Module
 * 
 * Handles newsletter subscription forms with:
 * - Email validation
 * - Brevo API integration via Cloudflare Worker
 * - Loading states & error handling
 * - Accessibility compliance (ARIA labels, live regions)
 * - Spam protection (honeypot)
 * - Analytics integration
 * 
 * @module features/newsletter
 */

// Newsletter state management
const state = {
    isSubmitting: false,
    forms: new Map(), // Track all newsletter forms on the page
};

// Configuration
const config = {
    // Cloudflare Worker endpoint (Cloudflare Pages Function)
    apiEndpoint: '/newsletter-subscribe',
    
    // Email validation regex (RFC 5322 compliant)
    emailRegex: /^(?!.*\.\.)[^\s@]+@[^\s@]+\.[^\s@]+$/,
    
    // UI messages
    messages: {
        success: '🎉 Thanks for subscribing! Check your email to confirm.',
        error: 'Something went wrong. Please try again.',
        invalidEmail: 'Please enter a valid email address.',
        alreadySubscribed: 'This email is already subscribed.',
        networkError: 'Network error. Please check your connection.',
        spamDetected: 'Spam detected. Please try again.',
    },
    
    // Timing
    successMessageDuration: 5000, // 5 seconds
    errorMessageDuration: 7000, // 7 seconds
};

/**
 * Validates an email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
    return config.emailRegex.test(email?.trim());
}

/**
 * Shows a message to the user
 * @param {HTMLFormElement} form - The form element
 * @param {string} message - Message to display
 * @param {'success'|'error'} type - Message type
 */
function showMessage(form, message, type = 'success') {
    // Find or create message container
    let messageEl = form.querySelector('.form-message');
    
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.className = 'form-message';
        messageEl.setAttribute('role', 'status');
        messageEl.setAttribute('aria-live', 'polite');
        form.appendChild(messageEl);
    }
    
    // Clear previous content
    messageEl.innerHTML = '';
    
    // Add icon for visual feedback
    if (type === 'success') {
        const checkmark = document.createElement('span');
        checkmark.className = 'success-checkmark';
        checkmark.setAttribute('aria-hidden', 'true');
        messageEl.appendChild(checkmark);
        
        // Add success bounce animation to form
        form.classList.add('success-bounce');
        setTimeout(() => form.classList.remove('success-bounce'), 600);
    } else if (type === 'error') {
        // Add shake animation to form inputs
        const inputs = form.querySelectorAll('.form-input');
        inputs.forEach(input => {
            input.classList.add('form-input--error');
            setTimeout(() => input.classList.remove('form-input--error'), 500);
        });
    }
    
    // Add message text
    const textNode = document.createTextNode(' ' + message);
    messageEl.appendChild(textNode);
    
    // Set message type class
    messageEl.className = `form-message form-message--${type}`;
    messageEl.style.display = 'block';
    
    // Auto-hide after duration
    const duration = type === 'success' ? config.successMessageDuration : config.errorMessageDuration;
    
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, duration);
}

/**
 * Sets form loading state
 * @param {HTMLFormElement} form - The form element
 * @param {boolean} isLoading - Loading state
 */
function setLoadingState(form, isLoading) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const emailInput = form.querySelector('input[type="email"]');
    const consentCheckbox = form.querySelector('input[type="checkbox"]');
    
    if (submitBtn) {
        submitBtn.disabled = isLoading;
        submitBtn.setAttribute('aria-busy', isLoading.toString());
        
        if (isLoading) {
            submitBtn.dataset.originalText = submitBtn.textContent;
            submitBtn.textContent = 'Subscribing...';
            submitBtn.classList.add('btn-loading');
        } else {
            submitBtn.classList.remove('btn-loading');
            if (submitBtn.dataset.originalText) {
                submitBtn.textContent = submitBtn.dataset.originalText;
            }
        }
    }
    
    if (emailInput) {
        emailInput.disabled = isLoading;
    }
    
    if (consentCheckbox) {
        consentCheckbox.disabled = isLoading;
    }
}

/**
 * Tracks newsletter events for analytics
 * @param {string} eventName - Event name
 * @param {Object} data - Event data
 */
function trackEvent(eventName, data = {}) {
    // Check if analytics is available
    if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, {
            event_category: 'Newsletter',
            ...data
        });
    }
    
    // Also dispatch custom event for other tracking systems
    window.dispatchEvent(new CustomEvent('newsletter:event', {
        detail: { eventName, data }
    }));
}

/**
 * Submits the newsletter subscription to Brevo via Cloudflare Worker
 * @param {string} email - User's email
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} API response
 */
async function subscribeToNewsletter(email, options = {}) {
    const { honeypot = '', consent = true } = options;
    
    // Check honeypot (spam protection)
    if (honeypot.trim() !== '') {
        throw new Error('spam');
    }
    
    const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: email.trim().toLowerCase(),
            honeypot,
            attributes: {
                CONSENT: consent,
                SIGNUP_SOURCE: 'website',
                SIGNUP_DATE: new Date().toISOString(),
            },
            // Brevo parameters
            _listIds: [3], // Your list ID from config
            _updateEnabled: false, // Don't update existing contacts
        }),
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle specific error cases
        if (response.status === 400 && errorData.error?.includes('already exists')) {
            throw new Error('already_subscribed');
        }
        
        if (response.status === 400 && errorData.error?.includes('Spam')) {
            throw new Error('spam');
        }
        
        throw new Error('api_error');
    }
    
    return await response.json();
}

/**
 * Handles form submission
 * @param {Event} event - Submit event
 */
async function handleSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    
    // Prevent double submission
    if (state.isSubmitting) {
        return;
    }
    
    // Get form data
    const emailInput = form.querySelector('input[type="email"]');
    const consentCheckbox = form.querySelector('input[type="checkbox"]');
    const honeypotInput = form.querySelector('input[name="website"]') || 
                         form.querySelector('input[style*="display: none"]');
    
    const email = emailInput?.value;
    const consent = consentCheckbox ? consentCheckbox.checked : true;
    const honeypot = honeypotInput?.value || '';
    
    // Validate email
    if (!isValidEmail(email)) {
        showMessage(form, config.messages.invalidEmail, 'error');
        emailInput?.focus();
        trackEvent('newsletter_error', { error_type: 'invalid_email' });
        return;
    }
    
    // Validate consent (if checkbox exists)
    if (consentCheckbox && !consent) {
        showMessage(form, 'Please accept the privacy policy to continue.', 'error');
        consentCheckbox?.focus();
        trackEvent('newsletter_error', { error_type: 'no_consent' });
        return;
    }
    
    // Set loading state
    state.isSubmitting = true;
    setLoadingState(form, true);
    trackEvent('newsletter_submit_start', { email_domain: email.split('@')[1] });
    
    try {
        // Submit to API
        await subscribeToNewsletter(email, { honeypot, consent });
        
        // Success!
        showMessage(form, config.messages.success, 'success');
        trackEvent('newsletter_subscribe_success', { 
            email_domain: email.split('@')[1] 
        });
        // Clear the email input
        const emailInput = form.querySelector('input[type="email"]');
        if (emailInput) {
            emailInput.defaultValue = '';
            emailInput.setAttribute('value', '');
            emailInput.value = '';
        }
        
        // Track conversion for marketing
        if (typeof window.gtag === 'function') {
            window.gtag('event', 'conversion', {
                'send_to': 'AW-CONVERSION_ID/CONVERSION_LABEL', // Replace with actual conversion ID
                'event_category': 'Newsletter',
                'event_label': 'Subscription Success'
            });
        }
        
    } catch (error) {
        // Handle errors
        let errorMessage = config.messages.error;
        let errorType = 'unknown';
        
        if (error.message === 'already_subscribed') {
            errorMessage = config.messages.alreadySubscribed;
            errorType = 'already_subscribed';
        } else if (error.message === 'spam') {
            errorMessage = config.messages.spamDetected;
            errorType = 'spam';
        } else if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
            errorMessage = config.messages.networkError;
            errorType = 'network';
        }
        
        showMessage(form, errorMessage, 'error');
        trackEvent('newsletter_error', { 
            error_type: errorType,
            error_message: error.message 
        });
        
        console.error('[Newsletter] Subscription error:', error);
        
    } finally {
        // Reset loading state
        state.isSubmitting = false;
        setLoadingState(form, false);
    }
}

/**
 * Initializes a single newsletter form
 * @param {HTMLFormElement} form - Form element to initialize
 */
function initializeForm(form) {
    // Check if already initialized
    if (state.forms.has(form)) {
        return;
    }
    
    // Add honeypot field for spam protection (hidden from users)
    if (!form.querySelector('input[name="website"]')) {
        const honeypot = document.createElement('input');
        honeypot.type = 'text';
        honeypot.name = 'website';
        honeypot.tabIndex = -1;
        honeypot.setAttribute('aria-hidden', 'true');
        honeypot.style.cssText = 'position: absolute; left: -9999px; width: 1px; height: 1px;';
        form.appendChild(honeypot);
    }
    
    // Add submit handler
    form.addEventListener('submit', handleSubmit);
    
    // Mark as initialized
    state.forms.set(form, true);
    
    console.log('[Newsletter] Form initialized:', form);
}

/**
 * Initializes all newsletter forms on the page
 */
function init() {
    // Find all newsletter forms
    const forms = document.querySelectorAll('form[data-newsletter-form], form[action*="newsletter"]');
    
    if (forms.length === 0) {
        console.log('[Newsletter] No newsletter forms found on page');
        return;
    }
    
    // Initialize each form
    forms.forEach(initializeForm);
    
    console.log(`[Newsletter] Initialized ${forms.length} form(s)`);
    trackEvent('newsletter_module_loaded', { form_count: forms.length });
}

/**
 * Destroys the newsletter module (cleanup)
 */
function destroy() {
    // Remove all event listeners
    state.forms.forEach((_, form) => {
        form.removeEventListener('submit', handleSubmit);
    });
    
    // Clear state
    state.forms.clear();
    state.isSubmitting = false;
    
    console.log('[Newsletter] Module destroyed');
}

// Expose API to window
if (typeof window !== 'undefined') {
    window.NewsletterAPI = {
        init,
        destroy,
        subscribe: subscribeToNewsletter,
        isValidEmail,
        subscribeToNewsletter,
    };
}
