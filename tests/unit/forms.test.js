/**
 * Forms Module Unit Tests
 * 
 * Tests for generic form handling utilities including:
 * - Field validation
 * - Form validation
 * - Error display
 * - Form serialization
 * - Loading states
 * - Message display
 * - Form submission handling
 * 
 * Run with: npm test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
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
} from '@/features/forms.js';

describe('Forms Module', () => {
    
    describe('Validators', () => {
        describe('required validator', () => {
            it('should pass for non-empty values', () => {
                expect(validators.required('test').valid).toBe(true);
                expect(validators.required('  hello  ').valid).toBe(true);
                expect(validators.required(123).valid).toBe(true);
            });
            
            it('should fail for empty values', () => {
                expect(validators.required('').valid).toBe(false);
                expect(validators.required('   ').valid).toBe(false);
                expect(validators.required(null).valid).toBe(false);
                expect(validators.required(undefined).valid).toBe(false);
            });
        });
        
        describe('email validator', () => {
            it('should validate correct emails', () => {
                expect(validators.email('user@example.com').valid).toBe(true);
                expect(validators.email('test.user@domain.co.uk').valid).toBe(true);
                expect(validators.email('user+tag@example.com').valid).toBe(true);
            });
            
            it('should reject invalid emails', () => {
                expect(validators.email('invalid').valid).toBe(false);
                expect(validators.email('invalid@').valid).toBe(false);
                expect(validators.email('@invalid.com').valid).toBe(false);
                expect(validators.email('user @example.com').valid).toBe(false);
            });
        });
        
        describe('url validator', () => {
            it('should validate correct URLs', () => {
                expect(validators.url('https://example.com').valid).toBe(true);
                expect(validators.url('http://example.com').valid).toBe(true);
                expect(validators.url('https://example.com/path?query=value').valid).toBe(true);
            });
            
            it('should reject invalid URLs', () => {
                expect(validators.url('not-a-url').valid).toBe(false);
                expect(validators.url('example.com').valid).toBe(false);
                expect(validators.url('').valid).toBe(false);
            });
        });
        
        describe('minLength validator', () => {
            it('should pass for values meeting minimum', () => {
                expect(validators.minLength('hello', 3).valid).toBe(true);
                expect(validators.minLength('hello', 5).valid).toBe(true);
            });
            
            it('should fail for values below minimum', () => {
                expect(validators.minLength('hi', 3).valid).toBe(false);
                expect(validators.minLength('', 1).valid).toBe(false);
            });
        });
        
        describe('maxLength validator', () => {
            it('should pass for values within maximum', () => {
                expect(validators.maxLength('hello', 10).valid).toBe(true);
                expect(validators.maxLength('hello', 5).valid).toBe(true);
            });
            
            it('should fail for values exceeding maximum', () => {
                expect(validators.maxLength('hello world', 5).valid).toBe(false);
            });
        });
        
        describe('pattern validator', () => {
            it('should validate against regex pattern', () => {
                const digitPattern = /^\d+$/;
                expect(validators.pattern('12345', digitPattern).valid).toBe(true);
                expect(validators.pattern('abc123', digitPattern).valid).toBe(false);
            });
            
            it('should accept string patterns', () => {
                expect(validators.pattern('12345', '^\\d+$').valid).toBe(true);
            });
        });
        
        describe('phone validator', () => {
            it('should validate phone numbers', () => {
                expect(validators.phone('1234567890').valid).toBe(true);
                expect(validators.phone('+1 (555) 123-4567').valid).toBe(true);
                expect(validators.phone('555-123-4567').valid).toBe(true);
            });
            
            it('should reject invalid phone numbers', () => {
                expect(validators.phone('123').valid).toBe(false);
                expect(validators.phone('abc').valid).toBe(false);
            });
        });
        
        describe('numeric validator', () => {
            it('should validate numbers', () => {
                expect(validators.numeric('123').valid).toBe(true);
                expect(validators.numeric('123.45').valid).toBe(true);
                expect(validators.numeric('-10').valid).toBe(true);
            });
            
            it('should reject non-numbers', () => {
                expect(validators.numeric('abc').valid).toBe(false);
                expect(validators.numeric('12a3').valid).toBe(false);
            });
        });
        
        describe('min/max validators', () => {
            it('should validate minimum value', () => {
                expect(validators.min('10', 5).valid).toBe(true);
                expect(validators.min('10', 10).valid).toBe(true);
                expect(validators.min('10', 15).valid).toBe(false);
            });
            
            it('should validate maximum value', () => {
                expect(validators.max('10', 15).valid).toBe(true);
                expect(validators.max('10', 10).valid).toBe(true);
                expect(validators.max('10', 5).valid).toBe(false);
            });
        });
    });
    
    describe('Field Validation', () => {
        let input;
        
        beforeEach(() => {
            input = document.createElement('input');
            input.type = 'text';
            input.name = 'testField';
            input.id = 'testField';
        });
        
        it('should validate required fields', () => {
            input.setAttribute('required', '');
            input.value = '';
            
            const result = validateField(input);
            expect(result.valid).toBe(false);
            expect(result.message).toContain('required');
        });
        
        it('should validate email fields', () => {
            input.type = 'email';
            input.value = 'invalid-email';
            
            const result = validateField(input);
            expect(result.valid).toBe(false);
            expect(result.message).toContain('valid email');
        });
        
        it('should validate with custom rules', () => {
            input.value = 'hi';
            
            const result = validateField(input, { minLength: 5 });
            expect(result.valid).toBe(false);
            expect(result.message).toContain('at least 5');
        });
        
        it('should pass valid fields', () => {
            input.type = 'email';
            input.value = 'user@example.com';
            input.setAttribute('required', '');
            
            const result = validateField(input);
            expect(result.valid).toBe(true);
            expect(result.message).toBe('');
        });
    });
    
    describe('Error Display', () => {
        let container, input;
        
        beforeEach(() => {
            container = document.createElement('div');
            container.className = 'form-group';
            
            input = document.createElement('input');
            input.type = 'text';
            input.name = 'testField';
            input.id = 'testField';
            
            container.appendChild(input);
            document.body.appendChild(container);
        });
        
        afterEach(() => {
            document.body.removeChild(container);
        });
        
        it('should show field error', () => {
            showFieldError(input, 'This field is required');
            
            const errorEl = document.getElementById('testField-error');
            expect(errorEl).toBeTruthy();
            expect(errorEl.textContent).toBe('This field is required');
            expect(input.getAttribute('aria-invalid')).toBe('true');
            expect(input.classList.contains('field-error')).toBe(true);
        });
        
        it('should clear field error', () => {
            showFieldError(input, 'Error message');
            clearFieldError(input);
            
            const errorEl = document.getElementById('testField-error');
            expect(errorEl).toBeNull();
            expect(input.getAttribute('aria-invalid')).toBe('false');
            expect(input.classList.contains('field-error')).toBe(false);
        });
        
        it('should replace existing error', () => {
            showFieldError(input, 'First error');
            showFieldError(input, 'Second error');
            
            const errorEls = container.querySelectorAll('.field-error-message');
            expect(errorEls.length).toBe(1);
            expect(errorEls[0].textContent).toBe('Second error');
        });
    });
    
    describe('Form Validation', () => {
        let form;
        
        beforeEach(() => {
            form = document.createElement('form');
            document.body.appendChild(form);
            form.innerHTML = `
                <input type="text" name="username" id="username" required>
                <input type="email" name="email" id="email" required>
                <input type="text" name="website" class="hp-field" data-honeypot="true">
                <button type="submit">Submit</button>
            `;
        });
        
        afterEach(() => {
            document.body.removeChild(form);
        });
        
        it('should validate all fields', () => {
            form.querySelector('[name="username"]').value = '';
            form.querySelector('[name="email"]').value = 'invalid';
            
            const result = validateForm(form);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBe(2);
        });
        
        it('should pass valid form', () => {
            form.querySelector('[name="username"]').value = 'testuser';
            form.querySelector('[name="email"]').value = 'test@example.com';
            
            const result = validateForm(form);
            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
        });
        
        it('should skip honeypot fields', () => {
            form.querySelector('[name="username"]').value = 'testuser';
            form.querySelector('[name="email"]').value = 'test@example.com';
            form.querySelector('[name="website"]').value = 'bot filled this';
            
            const result = validateForm(form);
            expect(result.valid).toBe(true);
        });
        
        it('should apply custom rules', () => {
            form.querySelector('[name="username"]').value = 'ab';
            form.querySelector('[name="email"]').value = 'test@example.com';
            
            const result = validateForm(form, {
                username: { minLength: 3 }
            });
            
            expect(result.valid).toBe(false);
            expect(result.errors[0].fieldName).toBe('username');
        });
    });
    
    describe('Form Serialization', () => {
        let form;
        
        beforeEach(() => {
            form = document.createElement('form');
            document.body.appendChild(form);
            form.innerHTML = `
                <input type="text" name="username" value="testuser">
                <input type="email" name="email" value="test@example.com">
                <input type="text" name="website" value="honeypot">
                <input type="hidden" name="source" value="test">
                <input type="checkbox" name="consent" value="yes" checked>
            `;
        });
        
        afterEach(() => {
            document.body.removeChild(form);
        });
        
        it('should serialize form data', () => {
            const data = serializeForm(form);
            
            expect(data.username).toBe('testuser');
            expect(data.email).toBe('test@example.com');
            expect(data.source).toBe('test');
            expect(data.consent).toBe('yes');
        });
        
        it('should skip honeypot fields', () => {
            const data = serializeForm(form);
            expect(data.website).toBeUndefined();
        });
        
        it('should handle multiple values', () => {
            form.innerHTML += `
                <input type="checkbox" name="interests" value="coding" checked>
                <input type="checkbox" name="interests" value="design" checked>
            `;
            
            const data = serializeForm(form);
            expect(Array.isArray(data.interests)).toBe(true);
            expect(data.interests.length).toBe(2);
        });
    });
    
    describe('Loading States', () => {
        let form;
        
        beforeEach(() => {
            form = document.createElement('form');
            document.body.appendChild(form);
            form.innerHTML = `
                <input type="text" name="username">
                <button type="submit">Submit</button>
            `;
        });
        
        afterEach(() => {
            document.body.removeChild(form);
        });
        
        it('should set loading state', () => {
            setFormLoading(form, true);
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const input = form.querySelector('input');
            
            expect(submitBtn.disabled).toBe(true);
            expect(input.disabled).toBe(true);
            expect(submitBtn.getAttribute('aria-busy')).toBe('true');
            expect(form.classList.contains('form--submitting')).toBe(true);
        });
        
        it('should clear loading state', () => {
            setFormLoading(form, true);
            setFormLoading(form, false);
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const input = form.querySelector('input');
            
            expect(submitBtn.disabled).toBe(false);
            expect(input.disabled).toBe(false);
            expect(submitBtn.getAttribute('aria-busy')).toBe('false');
            expect(form.classList.contains('form--submitting')).toBe(false);
        });
    });
    
    describe('Form Messages', () => {
        let form;
        
        beforeEach(() => {
            form = document.createElement('form');
            document.body.appendChild(form);
        });
        
        afterEach(() => {
            document.body.removeChild(form);
        });
        
        it('should show success message', () => {
            showFormMessage(form, 'Success!', 'success');
            
            const message = form.querySelector('.form-message');
            expect(message).toBeTruthy();
            expect(message.textContent).toBe('Success!');
            expect(message.className).toContain('form-message--success');
            expect(message.style.display).toBe('block');
        });
        
        it('should show error message', () => {
            showFormMessage(form, 'Error!', 'error');
            
            const message = form.querySelector('.form-message');
            expect(message.className).toContain('form-message--error');
            expect(message.getAttribute('role')).toBe('alert');
        });
        
        it('should clear message', () => {
            showFormMessage(form, 'Test', 'success');
            clearFormMessage(form);
            
            const message = form.querySelector('.form-message');
            expect(message.style.display).toBe('none');
            expect(message.textContent).toBe('');
        });
    });
    
    describe('Form Submission Handler', () => {
        let form, submitHandler;
        
        beforeEach(() => {
            form = document.createElement('form');
            document.body.appendChild(form);
            form.innerHTML = `
                <input type="text" name="username" value="testuser" required>
                <button type="submit">Submit</button>
            `;
            
            submitHandler = vi.fn().mockResolvedValue({ success: true });
        });
        
        afterEach(() => {
            document.body.removeChild(form);
        });
        
        it('should handle successful submission', async () => {
            await handleFormSubmit(form, submitHandler, {
                validate: false,
                successMessage: 'Form submitted!'
            });
            
            expect(submitHandler).toHaveBeenCalledWith({
                username: 'testuser'
            });
            
            const message = form.querySelector('.form-message');
            expect(message.textContent).toBe('Form submitted!');
        });
        
        it('should validate before submission', async () => {
            form.querySelector('[name="username"]').value = '';
            
            await handleFormSubmit(form, submitHandler, {
                validate: true
            });
            
            // Should not call handler due to validation failure
            expect(submitHandler).not.toHaveBeenCalled();
        });
        
        it('should handle submission errors', async () => {
            submitHandler.mockRejectedValueOnce(new Error('Network error'));
            
            await handleFormSubmit(form, submitHandler, {
                validate: false,
                errorMessage: 'Failed to submit'
            });
            
            const message = form.querySelector('.form-message');
            expect(message.className).toContain('form-message--error');
        });
        
        it('should reset form on success if requested', async () => {
            const resetSpy = vi.fn();
            form.reset = resetSpy;
            
            await handleFormSubmit(form, submitHandler, {
                validate: false,
                resetOnSuccess: true
            });
            
            expect(resetSpy).toHaveBeenCalled();
        });
        
        it('should call success callback', async () => {
            const onSuccess = vi.fn();
            
            await handleFormSubmit(form, submitHandler, {
                validate: false,
                onSuccess
            });
            
            expect(onSuccess).toHaveBeenCalledWith({ success: true });
        });
    });
    
    describe('FormState Class', () => {
        let form, formState;
        
        beforeEach(() => {
            form = document.createElement('form');
            formState = new FormState(form);
        });
        
        it('should initialize with pristine state', () => {
            expect(formState.pristine).toBe(true);
            expect(formState.dirty).toBe(false);
            expect(formState.submitting).toBe(false);
            expect(formState.submitted).toBe(false);
        });
        
        it('should mark as dirty', () => {
            formState.markDirty();
            expect(formState.pristine).toBe(false);
            expect(formState.dirty).toBe(true);
        });
        
        it('should manage errors', () => {
            formState.setError('email', 'Invalid email');
            expect(formState.errors.size).toBe(1);
            expect(formState.valid).toBe(false);
            
            formState.clearError('email');
            expect(formState.errors.size).toBe(0);
            expect(formState.valid).toBe(true);
        });
        
        it('should reset state', () => {
            formState.markDirty();
            formState.markSubmitting();
            formState.setError('field', 'Error');
            
            formState.reset();
            
            expect(formState.pristine).toBe(true);
            expect(formState.dirty).toBe(false);
            expect(formState.errors.size).toBe(0);
        });
    });
});
