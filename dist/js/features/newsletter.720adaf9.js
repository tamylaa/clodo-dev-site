const state = {
isSubmitting: false,
forms: new Map(), // Track all newsletter forms on the page
};
const config = {
apiEndpoint: '/newsletter-subscribe',
emailRegex: /^(?!.*\.\.)[^\s@]+@[^\s@]+\.[^\s@]+$/,
messages: {
success: '🎉 Thanks for subscribing! Check your email to confirm.',
error: 'Something went wrong. Please try again.',
invalidEmail: 'Please enter a valid email address.',
alreadySubscribed: 'This email is already subscribed.',
networkError: 'Network error. Please check your connection.',
spamDetected: 'Spam detected. Please try again.',
authFailed: 'Email service authentication failed. Please try again later.',
rateLimited: 'Too many requests. Please wait a moment and try again.',
serviceUnavailable: 'Email service temporarily unavailable. Please try again later.',
serverError: 'Server error. Please try again later.',
},
successMessageDuration: 5000, // 5 seconds
errorMessageDuration: 7000, // 7 seconds
};
function isValidEmail(email) {
return config.emailRegex.test(email?.trim());
}
function showMessage(form, message, type = 'success') {
let messageEl = form.querySelector('.form-message');
if (!messageEl) {
messageEl = document.createElement('div');
messageEl.className = 'form-message';
messageEl.setAttribute('role', 'status');
messageEl.setAttribute('aria-live', 'polite');
form.appendChild(messageEl);
}
messageEl.innerHTML = '';
if (type === 'success') {
const checkmark = document.createElement('span');
checkmark.className = 'success-checkmark';
checkmark.setAttribute('aria-hidden', 'true');
messageEl.appendChild(checkmark);
form.classList.add('success-bounce');
setTimeout(() => form.classList.remove('success-bounce'), 600);
} else if (type === 'error') {
const inputs = form.querySelectorAll('.form-input');
inputs.forEach(input => {
input.classList.add('form-input--error');
setTimeout(() => input.classList.remove('form-input--error'), 500);
});
}
const textNode = document.createTextNode(' ' + message);
messageEl.appendChild(textNode);
messageEl.className = `form-message form-message--${type}`;
messageEl.style.display = 'block';
const duration = type === 'success' ? config.successMessageDuration : config.errorMessageDuration;
setTimeout(() => {
messageEl.style.display = 'none';
}, duration);
}
function setLoadingState(form, isLoading) {
const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
const emailInput = form.querySelector('input[type="email"]');
const consentCheckbox = form.querySelector('input[type="checkbox"]');
const submitControls = form.querySelectorAll('button[type="submit"], input[type="submit"]');
submitControls.forEach(btn => {
try {
btn.disabled = isLoading;
if (isLoading) {
btn.setAttribute('disabled', 'disabled');
} else {
btn.removeAttribute('disabled');
}
btn.setAttribute('aria-busy', isLoading.toString());
} catch (e) {
}
});
try { form.setAttribute('data-loading', isLoading ? 'true' : 'false'); } catch (e) {  }
if (submitBtn) {
if (isLoading) {
if (submitBtn.tagName.toLowerCase() === 'button') {
submitBtn.dataset.originalText = submitBtn.textContent;
submitBtn.textContent = 'Subscribing...';
} else if (submitBtn.tagName.toLowerCase() === 'input') {
submitBtn.dataset.originalText = submitBtn.value;
submitBtn.value = 'Subscribing...';
}
submitBtn.classList.add('btn-loading');
} else {
submitBtn.classList.remove('btn-loading');
if (submitBtn.dataset.originalText) {
if (submitBtn.tagName.toLowerCase() === 'button') {
submitBtn.textContent = submitBtn.dataset.originalText;
} else if (submitBtn.tagName.toLowerCase() === 'input') {
submitBtn.value = submitBtn.dataset.originalText;
}
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
function trackEvent(eventName, data = {}) {
if (typeof window.gtag === 'function') {
window.gtag('event', eventName, {
event_category: 'Newsletter',
...data
});
}
window.dispatchEvent(new CustomEvent('newsletter:event', {
detail: { eventName, data }
}));
}
async function subscribeToNewsletter(email, options = {}) {
const { honeypot = '', consent = true } = options;
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
_listIds: [3], // Your list ID from config
_updateEnabled: false, // Don't update existing contacts
}),
});
if (!response.ok) {
const errorData = await response.json().catch(() => ({}));
if (response.status === 400 && errorData.error?.includes('already exists')) {
throw new Error('already_subscribed');
}
if (response.status === 400 && errorData.error?.includes('Spam')) {
throw new Error('spam');
}
if (response.status === 401) {
throw new Error('auth_failed');
}
if (response.status === 429) {
throw new Error('rate_limited');
}
if (response.status === 503 || errorData.code === 'SERVICE_UNAVAILABLE') {
throw new Error('service_unavailable');
}
if (response.status >= 500) {
throw new Error('server_error');
}
throw new Error('api_error');
}
return await response.json();
}
async function handleSubmit(event) {
event.preventDefault();
const form = event.target;
if (state.isSubmitting) {
return;
}
const emailInput = form.querySelector('input[type="email"]');
const consentCheckbox = form.querySelector('input[type="checkbox"]');
const honeypotInput = form.querySelector('input[name="website"]') || 
form.querySelector('input[style*="display: none"]');
const email = emailInput?.value;
const consent = consentCheckbox ? consentCheckbox.checked : true;
const honeypot = honeypotInput?.value || '';
if (!isValidEmail(email)) {
showMessage(form, config.messages.invalidEmail, 'error');
emailInput?.focus();
trackEvent('newsletter_error', { error_type: 'invalid_email' });
return;
}
if (consentCheckbox && !consent) {
showMessage(form, 'Please accept the privacy policy to continue.', 'error');
consentCheckbox?.focus();
trackEvent('newsletter_error', { error_type: 'no_consent' });
return;
}
state.isSubmitting = true;
setLoadingState(form, true);
trackEvent('newsletter_submit_start', { email_domain: email.split('@')[1] });
try {
await subscribeToNewsletter(email, { honeypot, consent });
showMessage(form, config.messages.success, 'success');
trackEvent('newsletter_subscribe_success', { 
email_domain: email.split('@')[1] 
});
const emailInput = form.querySelector('input[type="email"]');
if (emailInput) {
emailInput.defaultValue = '';
emailInput.setAttribute('value', '');
emailInput.value = '';
}
if (typeof window.gtag === 'function') {
window.gtag('event', 'conversion', {
'send_to': 'AW-CONVERSION_ID/CONVERSION_LABEL', // Replace with actual conversion ID
'event_category': 'Newsletter',
'event_label': 'Subscription Success'
});
}
} catch (error) {
let errorMessage = config.messages.error;
let errorType = 'unknown';
if (error.message === 'already_subscribed') {
errorMessage = config.messages.alreadySubscribed;
errorType = 'already_subscribed';
} else if (error.message === 'spam') {
errorMessage = config.messages.spamDetected;
errorType = 'spam';
} else if (error.message === 'auth_failed') {
errorMessage = config.messages.authFailed;
errorType = 'auth_failed';
} else if (error.message === 'rate_limited') {
errorMessage = config.messages.rateLimited;
errorType = 'rate_limited';
} else if (error.message === 'service_unavailable') {
errorMessage = config.messages.serviceUnavailable;
errorType = 'service_unavailable';
} else if (error.message === 'server_error') {
errorMessage = config.messages.serverError;
errorType = 'server_error';
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
state.isSubmitting = false;
setLoadingState(form, false);
}
}
function initializeForm(form) {
if (state.forms.has(form)) {
return;
}
if (!form.querySelector('input[name="website"]')) {
const honeypot = document.createElement('input');
honeypot.type = 'text';
honeypot.name = 'website';
honeypot.tabIndex = -1;
honeypot.setAttribute('aria-hidden', 'true');
honeypot.style.cssText = 'position: absolute; left: -9999px; width: 1px; height: 1px;';
form.appendChild(honeypot);
}
form.addEventListener('submit', handleSubmit);
state.forms.set(form, true);
console.log('[Newsletter] Form initialized:', form);
}
function init() {
const forms = document.querySelectorAll('form[data-newsletter-form], form[action*="newsletter"]');
if (forms.length === 0) {
console.log('[Newsletter] No newsletter forms found on page');
return;
}
forms.forEach(initializeForm);
console.log(`[Newsletter] Initialized ${forms.length} form(s)`);
trackEvent('newsletter_module_loaded', { form_count: forms.length });
}
function destroy() {
state.forms.forEach((_, form) => {
form.removeEventListener('submit', handleSubmit);
});
state.forms.clear();
state.isSubmitting = false;
console.log('[Newsletter] Module destroyed');
}
if (typeof window !== 'undefined') {
window.NewsletterAPI = {
init,
destroy,
subscribe: subscribeToNewsletter,
isValidEmail,
subscribeToNewsletter,
};
}
export { init, destroy, subscribeToNewsletter, isValidEmail };