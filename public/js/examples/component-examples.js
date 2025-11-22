/**
 * Component System Examples
 * 
 * Demonstrates how to use the base Component class to build
 * reusable, maintainable UI components.
 */

import { Component } from '../core/component.js';

// ==================== EXAMPLE 1: Counter Component ====================

/**
 * Simple counter component demonstrating state management
 */
class CounterComponent extends Component {
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            initialCount: 0,
            step: 1,
        };
    }
    
    onInit() {
        // Initialize state
        this.setState('count', this.options.initialCount);
        
        // Observe count changes
        this.observe('count', (newCount, oldCount) => {
            this._log(`Count changed from ${oldCount} to ${newCount}`);
            this._updateDisplay();
        });
    }
    
    onMount() {
        // Create UI
        this.element.innerHTML = `
            <div class="counter">
                <button class="counter__decrement">-</button>
                <span class="counter__value">0</span>
                <button class="counter__increment">+</button>
            </div>
        `;
        
        // Bind events
        this.on('click', (e) => {
            if (e.target.matches('.counter__increment')) {
                this.increment();
            } else if (e.target.matches('.counter__decrement')) {
                this.decrement();
            }
        });
        
        // Update initial display
        this._updateDisplay();
    }
    
    increment() {
        const count = this.getState('count');
        this.setState('count', count + this.options.step);
    }
    
    decrement() {
        const count = this.getState('count');
        this.setState('count', count - this.options.step);
    }
    
    _updateDisplay() {
        const valueEl = this.$('.counter__value');
        if (valueEl) {
            valueEl.textContent = this.getState('count');
        }
    }
}

// ==================== EXAMPLE 2: Accordion Component ====================

/**
 * Accordion component demonstrating lifecycle and events
 */
class AccordionComponent extends Component {
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            multiple: false, // Allow multiple panels open
            activeIndex: 0,  // Initial active panel
        };
    }
    
    onInit() {
        // Initialize state
        this.setState({
            activePanels: this.options.multiple ? [] : [this.options.activeIndex],
        });
    }
    
    onMount() {
        // Find all panels
        this.panels = Array.from(this.$('.accordion__panel', true));
        this.headers = Array.from(this.$('.accordion__header', true));
        
        // Setup ARIA
        this.panels.forEach((panel, index) => {
            const header = this.headers[index];
            const content = panel.querySelector('.accordion__content');
            
            header.setAttribute('role', 'button');
            header.setAttribute('aria-expanded', 'false');
            header.setAttribute('aria-controls', `panel-${this.id}-${index}`);
            
            content.id = `panel-${this.id}-${index}`;
            content.setAttribute('role', 'region');
            content.setAttribute('aria-labelledby', header.id || `header-${this.id}-${index}`);
        });
        
        // Bind events
        this.on('click', (e) => {
            const header = e.target.closest('.accordion__header');
            if (header) {
                const index = this.headers.indexOf(header);
                this.toggle(index);
            }
        });
        
        // Set initial active panels
        this.getState('activePanels').forEach(index => {
            this._openPanel(index);
        });
    }
    
    toggle(index) {
        const activePanels = this.getState('activePanels');
        const isActive = activePanels.includes(index);
        
        if (isActive) {
            this.close(index);
        } else {
            this.open(index);
        }
    }
    
    open(index) {
        const activePanels = this.getState('activePanels');
        
        if (!this.options.multiple) {
            // Close all other panels
            activePanels.forEach(i => this._closePanel(i));
            this.setState('activePanels', [index]);
        } else {
            if (!activePanels.includes(index)) {
                this.setState('activePanels', [...activePanels, index]);
            }
        }
        
        this._openPanel(index);
    }
    
    close(index) {
        const activePanels = this.getState('activePanels');
        this.setState('activePanels', activePanels.filter(i => i !== index));
        this._closePanel(index);
    }
    
    _openPanel(index) {
        const header = this.headers[index];
        const panel = this.panels[index];
        
        header.setAttribute('aria-expanded', 'true');
        panel.classList.add('accordion__panel--active');
        
        this._emit('panel:open', { index });
    }
    
    _closePanel(index) {
        const header = this.headers[index];
        const panel = this.panels[index];
        
        header.setAttribute('aria-expanded', 'false');
        panel.classList.remove('accordion__panel--active');
        
        this._emit('panel:close', { index });
    }
}

// ==================== EXAMPLE 3: Form Validator Component ====================

/**
 * Form validator demonstrating error handling and validation
 */
class FormValidatorComponent extends Component {
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            validateOnBlur: true,
            validateOnInput: false,
            showErrors: true,
        };
    }
    
    onInit() {
        // Initialize state
        this.setState({
            errors: {},
            touched: {},
            isValid: false,
        });
        
        // Define validation rules
        this.rules = new Map();
    }
    
    onMount() {
        // Find form fields
        this.fields = Array.from(this.$('input, textarea, select', true));
        
        // Bind events
        if (this.options.validateOnBlur) {
            this.on('blur', (e) => {
                if (this.fields.includes(e.target)) {
                    this.validateField(e.target);
                }
            }, true);
        }
        
        if (this.options.validateOnInput) {
            this.on('input', (e) => {
                if (this.fields.includes(e.target)) {
                    this.validateField(e.target);
                }
            }, true);
        }
        
        // Handle form submit
        this.on('submit', (e) => {
            e.preventDefault();
            this.validate();
        });
    }
    
    addRule(fieldName, validator) {
        if (!this.rules.has(fieldName)) {
            this.rules.set(fieldName, []);
        }
        this.rules.get(fieldName).push(validator);
        return this;
    }
    
    validateField(field) {
        const name = field.name;
        const value = field.value;
        const validators = this.rules.get(name) || [];
        
        let error = null;
        
        for (const validator of validators) {
            const result = validator(value, field);
            if (result !== true) {
                error = result;
                break;
            }
        }
        
        const errors = this.getState('errors');
        const touched = this.getState('touched');
        
        this.setState({
            errors: { ...errors, [name]: error },
            touched: { ...touched, [name]: true },
        });
        
        if (this.options.showErrors) {
            this._showFieldError(field, error);
        }
        
        return !error;
    }
    
    validate() {
        let isValid = true;
        
        this.fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        this.setState('isValid', isValid);
        
        if (isValid) {
            this._emit('valid');
        } else {
            this._emit('invalid');
        }
        
        return isValid;
    }
    
    _showFieldError(field, error) {
        const errorEl = field.parentElement.querySelector('.field-error');
        
        if (error) {
            field.classList.add('field--invalid');
            field.setAttribute('aria-invalid', 'true');
            
            if (errorEl) {
                errorEl.textContent = error;
                errorEl.style.display = 'block';
            }
        } else {
            field.classList.remove('field--invalid');
            field.removeAttribute('aria-invalid');
            
            if (errorEl) {
                errorEl.textContent = '';
                errorEl.style.display = 'none';
            }
        }
    }
}

// ==================== USAGE EXAMPLES ====================

/**
 * Example 1: Counter
 */
function initCounterExample() {
    const element = document.getElementById('counter-example');
    if (!element) return;
    
    const counter = new CounterComponent(element, {
        debug: true,
        initialCount: 5,
        step: 2,
        trackPerformance: true,
    });
    
    // Listen to state changes
    counter.element.addEventListener('component:statechange', (e) => {
        console.log('State changed:', e.detail);
    });
}

/**
 * Example 2: Accordion
 */
function initAccordionExample() {
    const element = document.getElementById('accordion-example');
    if (!element) return;
    
    const accordion = new AccordionComponent(element, {
        debug: true,
        multiple: false,
        activeIndex: 0,
    });
    
    // Listen to panel events
    accordion.element.addEventListener('component:panel:open', (e) => {
        console.log('Panel opened:', e.detail.index);
    });
}

/**
 * Example 3: Form Validator
 */
function initFormValidatorExample() {
    const element = document.getElementById('form-example');
    if (!element) return;
    
    const validator = new FormValidatorComponent(element, {
        debug: true,
        validateOnBlur: true,
    });
    
    // Add validation rules
    validator
        .addRule('email', (value) => {
            if (!value) return 'Email is required';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                return 'Invalid email format';
            }
            return true;
        })
        .addRule('password', (value) => {
            if (!value) return 'Password is required';
            if (value.length < 8) return 'Password must be at least 8 characters';
            return true;
        });
    
    // Listen to validation events
    validator.element.addEventListener('component:valid', () => {
        console.log('Form is valid!');
    });
}

// ==================== EXPORTS ====================

export {
    CounterComponent,
    AccordionComponent,
    FormValidatorComponent,
    initCounterExample,
    initAccordionExample,
    initFormValidatorExample,
};
