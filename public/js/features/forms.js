/**
 * Forms Module
 * 
 * Generic form handling utilities for validation, submission, and state management.
 * Provides reusable helpers for all forms across the site.
 * 
 * Features:
 * - Field validation (email, URL, phone, required, min/max length, regex)
 * - Real-time validation feedback
 * - Form state management (pristine, dirty, submitting, submitted)
 * - Error message display
 * - Success message display
 * - Loading states
 * - Async submission handling
 * - Form serialization
 * - Accessibility (ARIA attributes, live regions)
 * 
 * @module features/forms
 */

// Validation rules
const validators = {
    /**
     * Validates required fields
     */
    required: (value) => {
        const trimmed = String(value || '').trim();
        return {
            valid: trimmed.length > 0,
            message: 'This field is required'
        };
    },
    
    /**
     * Validates email addresses (RFC 5322 compliant)
     */
    email: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const trimmed = String(value || '').trim();
        return {
            valid: emailRegex.test(trimmed),
            message: 'Please enter a valid email address'
        };
    },
    
    /**
     * Validates URLs
     */
    url: (value) => {
        try {
            new URL(value);
            return { valid: true, message: '' };
        } catch {
            return {
                valid: false,
                message: 'Please enter a valid URL (e.g., https://example.com)'
            };
        }
    },
    
    /**
     * Validates minimum length
     */
    minLength: (value, min) => {
        const length = String(value || '').length;
        return {
            valid: length >= min,
            message: `Must be at least ${min} characters`
        };
    },
    
    /**
     * Validates maximum length
     */
    maxLength: (value, max) => {
        const length = String(value || '').length;
        return {
            valid: length <= max,
            message: `Must be no more than ${max} characters`
        };
    },
    
    /**
     * Validates against custom regex pattern
     */
    pattern: (value, regex, message = 'Invalid format') => {
        const pattern = regex instanceof RegExp ? regex : new RegExp(regex);
        return {
            valid: pattern.test(String(value || '')),
            message
        };
    },
    
    /**
     * Validates phone numbers (flexible international format)
     */
    phone: (value) => {
        // Accepts: +1234567890, (123) 456-7890, 123-456-7890, etc.
        const phoneRegex = /^[\d\s\-+()]{10,}$/;
        const trimmed = String(value || '').trim();
        return {
            valid: phoneRegex.test(trimmed),
            message: 'Please enter a valid phone number'
        };
    },
    
    /**
     * Validates numeric values
     */
    numeric: (value) => {
        return {
            valid: !isNaN(parseFloat(value)) && isFinite(value),
            message: 'Please enter a valid number'
        };
    },
    
    /**
     * Validates minimum numeric value
     */
    min: (value, minValue) => {
        const num = parseFloat(value);
        return {
            valid: !isNaN(num) && num >= minValue,
            message: `Must be at least ${minValue}`
        };
    },
    
    /**
     * Validates maximum numeric value
     */
    max: (value, maxValue) => {
        const num = parseFloat(value);
        return {
            valid: !isNaN(num) && num <= maxValue,
            message: `Must be no more than ${maxValue}`
        };
    }
};

/**
 * Form state manager
 */
class FormState {
    constructor(form) {
        this.form = form;
        this.pristine = true;
        this.dirty = false;
        this.submitting = false;
        this.submitted = false;
        this.valid = false;
        this.errors = new Map();
    }
    
    markDirty() {
        this.pristine = false;
        this.dirty = true;
    }
    
    markSubmitting() {
        this.submitting = true;
    }
    
    markSubmitted() {
        this.submitting = false;
        this.submitted = true;
    }
    
    reset() {
        this.pristine = true;
        this.dirty = false;
        this.submitting = false;
        this.submitted = false;
        this.errors.clear();
    }
    
    setError(fieldName, message) {
        this.errors.set(fieldName, message);
        this.valid = false;
    }
    
    clearError(fieldName) {
        this.errors.delete(fieldName);
        this.valid = this.errors.size === 0;
    }
    
    clearAllErrors() {
        this.errors.clear();
        this.valid = true;
    }
}

/**
 * Validates a single field based on its attributes and custom rules
 * @param {HTMLInputElement} field - Field to validate
 * @param {Object} customRules - Custom validation rules
 * @returns {Object} Validation result
 */
function validateField(field, customRules = {}) {
    const value = field.value;
    const fieldName = field.name || field.id;
    const results = [];
    
    // Check required
    if (field.hasAttribute('required') || customRules.required) {
        results.push(validators.required(value));
    }
    
    // Check type-specific validation
    if (field.type === 'email') {
        if (value) results.push(validators.email(value));
    } else if (field.type === 'url') {
        if (value) results.push(validators.url(value));
    } else if (field.type === 'tel') {
        if (value) results.push(validators.phone(value));
    } else if (field.type === 'number') {
        if (value) results.push(validators.numeric(value));
    }
    
    // Check min/max length
    if (field.minLength && field.minLength > 0) {
        results.push(validators.minLength(value, field.minLength));
    }
    if (field.maxLength && field.maxLength > 0) {
        results.push(validators.maxLength(value, field.maxLength));
    }
    
    // Check min/max value (for numbers)
    if (field.min !== '' && field.type === 'number') {
        results.push(validators.min(value, parseFloat(field.min)));
    }
    if (field.max !== '' && field.type === 'number') {
        results.push(validators.max(value, parseFloat(field.max)));
    }
    
    // Check pattern
    if (field.pattern) {
        results.push(validators.pattern(value, field.pattern, 'Invalid format'));
    }
    
    // Apply custom rules
    Object.entries(customRules).forEach(([ruleName, ruleValue]) => {
        if (validators[ruleName] && ruleName !== 'required') {
            if (typeof ruleValue === 'boolean' && ruleValue) {
                results.push(validators[ruleName](value));
            } else {
                results.push(validators[ruleName](value, ruleValue));
            }
        }
    });
    
    // Find first error
    const firstError = results.find(r => !r.valid);
    
    return {
        valid: !firstError,
        message: firstError ? firstError.message : '',
        fieldName
    };
}

/**
 * Displays field error message
 * @param {HTMLInputElement} field - Field element
 * @param {string} message - Error message
 */
function showFieldError(field, message) {
    // Remove existing error
    clearFieldError(field);
    
    // Mark field as invalid
    field.setAttribute('aria-invalid', 'true');
    field.classList.add('field-error');
    
    // Create error message element
    const errorId = `${field.id || field.name}-error`;
    const errorEl = document.createElement('div');
    errorEl.id = errorId;
    errorEl.className = 'field-error-message';
    errorEl.textContent = message;
    errorEl.setAttribute('role', 'alert');
    errorEl.setAttribute('aria-live', 'polite');
    
    // Insert error after field
    const formGroup = field.closest('.form-group') || field.parentElement;
    if (formGroup) {
        formGroup.appendChild(errorEl);
    } else {
        field.insertAdjacentElement('afterend', errorEl);
    }
    
    // Link error to field
    field.setAttribute('aria-describedby', errorId);
}

/**
 * Clears field error message
 * @param {HTMLInputElement} field - Field element
 */
function clearFieldError(field) {
    // Remove invalid state
    field.setAttribute('aria-invalid', 'false');
    field.classList.remove('field-error');
    
    // Remove error message
    const errorId = `${field.id || field.name}-error`;
    const existingError = document.getElementById(errorId);
    if (existingError) {
        existingError.remove();
    }
    
    // Clear aria-describedby if it only referenced the error
    const describedBy = field.getAttribute('aria-describedby');
    if (describedBy === errorId) {
        field.removeAttribute('aria-describedby');
    }
}

/**
 * Validates all fields in a form
 * @param {HTMLFormElement} form - Form to validate
 * @param {Object} customRules - Custom validation rules per field
 * @returns {Object} Validation result
 */
function validateForm(form, customRules = {}) {
    const fields = form.querySelectorAll('input, textarea, select');
    const errors = [];
    
    fields.forEach(field => {
        // Skip hidden fields and buttons
        if (field.type === 'hidden' || field.type === 'submit' || field.type === 'button') {
            return;
        }
        
        // Skip honeypot fields
        if (field.name === 'website' || field.classList.contains('hp-field')) {
            return;
        }
        
        const fieldRules = customRules[field.name] || {};
        const result = validateField(field, fieldRules);
        
        if (!result.valid) {
            errors.push(result);
            showFieldError(field, result.message);
        } else {
            clearFieldError(field);
        }
    });
    
    return {
        valid: errors.length === 0,
        errors,
        firstError: errors[0] || null
    };
}

/**
 * Serializes form data to an object
 * @param {HTMLFormElement} form - Form to serialize
 * @returns {Object} Form data as key-value pairs
 */
function serializeForm(form) {
    const formData = new FormData(form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
        // Skip honeypot fields
        if (key === 'website') continue;
        
        // Handle multiple values (checkboxes, multi-select)
        if (data[key]) {
            if (Array.isArray(data[key])) {
                data[key].push(value);
            } else {
                data[key] = [data[key], value];
            }
        } else {
            data[key] = value;
        }
    }
    
    return data;
}

/**
 * Sets form loading state
 * @param {HTMLFormElement} form - Form element
 * @param {boolean} isLoading - Loading state
 */
function setFormLoading(form, isLoading) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const fields = form.querySelectorAll('input, textarea, select, button');
    
    if (isLoading) {
        // Disable all fields
        fields.forEach(field => field.disabled = true);
        
        // Update submit button
        if (submitBtn) {
            submitBtn.setAttribute('aria-busy', 'true');
            submitBtn.classList.add('btn--loading');
            
            // Show spinner if exists
            const spinner = submitBtn.querySelector('.btn-spinner, .spinner');
            if (spinner) {
                spinner.style.display = 'inline-block';
            }
        }
        
        form.classList.add('form--submitting');
    } else {
        // Enable all fields
        fields.forEach(field => field.disabled = false);
        
        // Update submit button
        if (submitBtn) {
            submitBtn.setAttribute('aria-busy', 'false');
            submitBtn.classList.remove('btn--loading');
            
            // Hide spinner
            const spinner = submitBtn.querySelector('.btn-spinner, .spinner');
            if (spinner) {
                spinner.style.display = 'none';
            }
        }
        
        form.classList.remove('form--submitting');
    }
}

/**
 * Shows form-level message (success or error)
 * @param {HTMLFormElement} form - Form element
 * @param {string} message - Message to display
 * @param {'success'|'error'|'info'} type - Message type
 * @param {number} duration - Auto-hide duration (ms), 0 to keep visible
 */
function showFormMessage(form, message, type = 'success', duration = 5000) {
    // Find or create message container
    let messageEl = form.querySelector('.form-message');
    
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.className = 'form-message';
        messageEl.setAttribute('role', type === 'error' ? 'alert' : 'status');
        messageEl.setAttribute('aria-live', 'polite');
        form.appendChild(messageEl);
    }
    
    // Set message
    messageEl.textContent = message;
    messageEl.className = `form-message form-message--${type}`;
    messageEl.style.display = 'block';
    
    // Auto-hide
    if (duration > 0) {
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, duration);
    }
}

/**
 * Clears form-level message
 * @param {HTMLFormElement} form - Form element
 */
function clearFormMessage(form) {
    const messageEl = form.querySelector('.form-message');
    if (messageEl) {
        messageEl.style.display = 'none';
        messageEl.textContent = '';
    }
}

/**
 * Handles async form submission with validation
 * @param {HTMLFormElement} form - Form element
 * @param {Function} submitHandler - Async function to handle submission
 * @param {Object} options - Options
 * @returns {Promise<void>}
 */
async function handleFormSubmit(form, submitHandler, options = {}) {
    const {
        validate = true,
        customRules = {},
        successMessage = 'Success!',
        errorMessage = 'Something went wrong. Please try again.',
        resetOnSuccess = false,
        onSuccess = null,
        onError = null
    } = options;
    
    // Validate if enabled
    if (validate) {
        const validation = validateForm(form, customRules);
        if (!validation.valid) {
            // Focus first error field
            if (validation.firstError) {
                const errorField = form.querySelector(`[name="${validation.firstError.fieldName}"]`);
                if (errorField) errorField.focus();
            }
            return;
        }
    }
    
    // Set loading state
    setFormLoading(form, true);
    clearFormMessage(form);
    
    try {
        // Serialize form data
        const formData = serializeForm(form);
        
        // Call submit handler
        const result = await submitHandler(formData);
        
        // Show success message
        showFormMessage(form, successMessage, 'success');
        
        // Reset form if requested
        if (resetOnSuccess) {
            form.reset();
        }
        
        // Call success callback
        if (onSuccess) {
            onSuccess(result);
        }
        
    } catch (error) {
        // Show error message
        const errMsg = error.message || errorMessage;
        showFormMessage(form, errMsg, 'error', 7000);
        
        // Call error callback
        if (onError) {
            onError(error);
        }
        
        console.error('[Forms] Submission error:', error);
    } finally {
        // Reset loading state
        setFormLoading(form, false);
    }
}

/**
 * Initializes real-time validation for a form
 * @param {HTMLFormElement} form - Form element
 * @param {Object} customRules - Custom validation rules per field
 */
function initRealtimeValidation(form, customRules = {}) {
    const fields = form.querySelectorAll('input, textarea, select');
    
    fields.forEach(field => {
        // Skip hidden fields and buttons
        if (field.type === 'hidden' || field.type === 'submit' || field.type === 'button') {
            return;
        }
        
        // Skip honeypot fields
        if (field.name === 'website' || field.classList.contains('hp-field')) {
            return;
        }
        
        // Validate on blur (after user leaves field)
        field.addEventListener('blur', () => {
            const fieldRules = customRules[field.name] || {};
            const result = validateField(field, fieldRules);
            
            if (!result.valid && field.value) {
                showFieldError(field, result.message);
            } else {
                clearFieldError(field);
            }
        });
        
        // Clear error on input (while typing)
        field.addEventListener('input', () => {
            clearFieldError(field);
        });
    });
}

// Export public API
export default {
    validateField,
    validateForm,
    showFieldError,
    clearFieldError,
    serializeForm,
    setFormLoading,
    showFormMessage,
    clearFormMessage,
    handleFormSubmit,
    initRealtimeValidation,
    validators,
    FormState
};

// Also export individual functions for testing
export {
    validateField,
    validateForm,
    showFieldError,
    clearFieldError,
    serializeForm,
    setFormLoading,
    showFormMessage,
    clearFormMessage,
    handleFormSubmit,
    initRealtimeValidation,
    validators,
    FormState
};
