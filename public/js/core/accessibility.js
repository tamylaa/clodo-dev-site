/**
 * @fileoverview Accessibility Enhancement Module for Clodo Framework
 * Implements WCAG 2.1 AA compliance features
 * @module core/accessibility
 */

/**
 * Accessibility Enhancement System
 * Provides runtime accessibility improvements for better screen reader support,
 * keyboard navigation, and user experience for people with disabilities
 */
class AccessibilityManager {
    constructor() {
        this.focusableElements = [
            'a[href]',
            'button:not([disabled])',
            'textarea:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            '[contenteditable]:not([contenteditable="false"])'
        ].join(', ');
        
        this.init();
    }

    /**
     * Initialize accessibility enhancements
     */
    init() {
        this.enhanceKeyboardNavigation();
        this.addFocusIndicators();
        this.implementSkipLinks();
        this.enhanceFormAccessibility();
        this.addLiveRegionSupport();
        this.monitorDynamicContent();
        this.enhanceTouchTargets();
        
        console.log('✅ Accessibility enhancements initialized');
    }

    /**
     * Enhance keyboard navigation throughout the site
     */
    enhanceKeyboardNavigation() {
        // ESC key handler for closing modals, dropdowns, etc.
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.handleEscapeKey();
            }
        });

        // Tab key handler for focus management
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        // Remove keyboard navigation indicator on mouse use
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });

        // Arrow key navigation for lists
        this.enhanceListNavigation();
    }

    /**
     * Handle ESC key press
     */
    handleEscapeKey() {
        // Close modals
        const openModal = document.querySelector('.modal[aria-hidden="false"]');
        if (openModal) {
            const closeButton = openModal.querySelector('[data-modal-close]');
            if (closeButton) closeButton.click();
            return;
        }

        // Close dropdowns
        const openDropdown = document.querySelector('.nav-dropdown[aria-expanded="true"]');
        if (openDropdown) {
            openDropdown.setAttribute('aria-expanded', 'false');
            const menu = openDropdown.querySelector('.nav-dropdown-menu');
            if (menu) menu.hidden = true;
            return;
        }

        // Close mobile menu
        const mobileMenu = document.querySelector('.mobile-menu.active');
        if (mobileMenu) {
            const toggleButton = document.querySelector('.mobile-menu-toggle');
            if (toggleButton) toggleButton.click();
        }
    }

    /**
     * Enhance arrow key navigation for lists and menus
     */
    enhanceListNavigation() {
        // Navigation menus
        document.querySelectorAll('[role="menu"]').forEach(menu => {
            const items = menu.querySelectorAll('[role="menuitem"]');
            
            menu.addEventListener('keydown', (e) => {
                const currentIndex = Array.from(items).indexOf(document.activeElement);
                
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    const nextIndex = (currentIndex + 1) % items.length;
                    items[nextIndex].focus();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prevIndex = (currentIndex - 1 + items.length) % items.length;
                    items[prevIndex].focus();
                } else if (e.key === 'Home') {
                    e.preventDefault();
                    items[0].focus();
                } else if (e.key === 'End') {
                    e.preventDefault();
                    items[items.length - 1].focus();
                }
            });
        });
    }

    /**
     * Add enhanced focus indicators for better visibility
     */
    addFocusIndicators() {
        const style = document.createElement('style');
        style.textContent = `
            /* Enhanced focus indicators for WCAG 2.1 AA compliance */
            body.keyboard-navigation *:focus {
                outline: 3px solid var(--primary-color, #3b82f6);
                outline-offset: 2px;
                border-radius: 4px;
            }

            body.keyboard-navigation a:focus {
                outline: 3px solid var(--primary-color, #3b82f6);
                outline-offset: 4px;
            }

            body.keyboard-navigation button:focus {
                outline: 3px solid var(--primary-color, #3b82f6);
                outline-offset: 2px;
                box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.1);
            }

            /* High contrast focus for form elements */
            body.keyboard-navigation input:focus,
            body.keyboard-navigation textarea:focus,
            body.keyboard-navigation select:focus {
                outline: 3px solid var(--primary-color, #3b82f6);
                outline-offset: 2px;
                border-color: var(--primary-color, #3b82f6);
            }

            /* Skip link enhancement */
            .skip-link:focus {
                outline: 3px solid var(--warning-color, #f59e0b);
                outline-offset: 3px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Implement skip links for keyboard navigation
     */
    implementSkipLinks() {
        const skipLink = document.querySelector('.skip-link');
        if (!skipLink) {
            // Create skip link if it doesn't exist
            const link = document.createElement('a');
            link.href = '#main-content';
            link.className = 'skip-link';
            link.textContent = 'Skip to main content';
            document.body.insertBefore(link, document.body.firstChild);
            
            // Ensure main content has the ID
            const main = document.querySelector('main');
            if (main && !main.id) {
                main.id = 'main-content';
            }
        }

        // Make skip link work properly
        document.querySelectorAll('.skip-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.setAttribute('tabindex', '-1');
                    target.focus();
                    target.removeAttribute('tabindex');
                }
            });
        });
    }

    /**
     * Enhance form accessibility
     */
    enhanceFormAccessibility() {
        // Ensure all form inputs have labels
        document.querySelectorAll('input, textarea, select').forEach(input => {
            if (!input.id && !input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
                console.warn('Form input without label:', input);
            }

            // Add required indicators
            if (input.required && !input.getAttribute('aria-required')) {
                input.setAttribute('aria-required', 'true');
            }

            // Add invalid state announcements
            input.addEventListener('invalid', (e) => {
                e.target.setAttribute('aria-invalid', 'true');
            });

            input.addEventListener('input', (e) => {
                if (e.target.validity.valid) {
                    e.target.setAttribute('aria-invalid', 'false');
                }
            });
        });

        // Error message association
        document.querySelectorAll('.form-error, .error-message').forEach(error => {
            const input = error.previousElementSibling;
            if (input && (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA')) {
                if (!error.id) {
                    error.id = `error-${input.id || Math.random().toString(36).substr(2, 9)}`;
                }
                input.setAttribute('aria-describedby', error.id);
            }
        });
    }

    /**
     * Add ARIA live region support for dynamic content
     */
    addLiveRegionSupport() {
        // Create a global announcer for screen readers
        if (!document.getElementById('aria-announcer')) {
            const announcer = document.createElement('div');
            announcer.id = 'aria-announcer';
            announcer.setAttribute('role', 'status');
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            announcer.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;';
            document.body.appendChild(announcer);
        }

        // Announce loading states
        window.announce = (message, priority = 'polite') => {
            const announcer = document.getElementById('aria-announcer');
            if (announcer) {
                announcer.setAttribute('aria-live', priority);
                announcer.textContent = message;
                
                // Clear after announcement
                setTimeout(() => {
                    announcer.textContent = '';
                }, 1000);
            }
        };

        // Monitor for success/error messages
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        if (node.matches('.success-message, .toast-success')) {
                            window.announce('Success: ' + node.textContent, 'polite');
                        } else if (node.matches('.error-message, .toast-error')) {
                            window.announce('Error: ' + node.textContent, 'assertive');
                        }
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * Monitor dynamic content for accessibility
     */
    monitorDynamicContent() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        // Check for missing alt text on images
                        if (node.tagName === 'IMG' && !node.alt) {
                            console.warn('Image without alt text:', node);
                            node.alt = ''; // Decorative image
                        }

                        // Check for buttons without accessible names
                        if (node.tagName === 'BUTTON' && !node.textContent.trim() && 
                            !node.getAttribute('aria-label') && !node.getAttribute('aria-labelledby')) {
                            console.warn('Button without accessible name:', node);
                        }

                        // Enhance new forms
                        if (node.tagName === 'FORM') {
                            this.enhanceFormAccessibility();
                        }
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * Enhance touch targets for mobile accessibility
     */
    enhanceTouchTargets() {
        // Ensure all clickable elements meet minimum size requirements (44x44px)
        const minSize = 44;
        
        document.querySelectorAll('a, button, input[type="button"], input[type="submit"]').forEach(element => {
            const rect = element.getBoundingClientRect();
            
            if (rect.width < minSize || rect.height < minSize) {
                // Add padding to meet minimum size
                const currentPadding = parseInt(window.getComputedStyle(element).padding) || 0;
                const neededPadding = Math.max(0, (minSize - Math.min(rect.width, rect.height)) / 2);
                
                if (neededPadding > currentPadding) {
                    element.style.padding = `${neededPadding}px`;
                }
            }
        });
    }

    /**
     * Get all focusable elements within a container
     * @param {HTMLElement} container - Container element
     * @returns {NodeList} Focusable elements
     */
    getFocusableElements(container = document) {
        return container.querySelectorAll(this.focusableElements);
    }

    /**
     * Trap focus within a container (for modals, dialogs)
     * @param {HTMLElement} container - Container to trap focus in
     */
    trapFocus(container) {
        const focusable = this.getFocusableElements(container);
        const firstFocusable = focusable[0];
        const lastFocusable = focusable[focusable.length - 1];

        const handleTabKey = (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        };

        container.addEventListener('keydown', handleTabKey);
        
        // Return cleanup function
        return () => {
            container.removeEventListener('keydown', handleTabKey);
        };
    }

    /**
     * Check color contrast ratio
     * @param {string} foreground - Foreground color (hex, rgb, rgba)
     * @param {string} background - Background color (hex, rgb, rgba)
     * @returns {number} Contrast ratio
     */
    getContrastRatio(foreground, background) {
        const getLuminance = (color) => {
            const rgb = color.match(/\d+/g).map(Number);
            const [r, g, b] = rgb.map(val => {
                val = val / 255;
                return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };

        const l1 = getLuminance(foreground);
        const l2 = getLuminance(background);
        
        return l1 > l2 ? (l1 + 0.05) / (l2 + 0.05) : (l2 + 0.05) / (l1 + 0.05);
    }

    /**
     * Validate contrast ratios on page
     * @returns {Array} Array of contrast issues
     */
    validateContrast() {
        const issues = [];
        
        document.querySelectorAll('*').forEach(element => {
            const styles = window.getComputedStyle(element);
            const color = styles.color;
            const backgroundColor = styles.backgroundColor;
            
            if (color && backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
                const ratio = this.getContrastRatio(color, backgroundColor);
                const fontSize = parseFloat(styles.fontSize);
                const isBold = parseInt(styles.fontWeight) >= 700;
                const isLargeText = fontSize >= 18 || (fontSize >= 14 && isBold);
                
                const requiredRatio = isLargeText ? 3 : 4.5; // WCAG AA
                
                if (ratio < requiredRatio) {
                    issues.push({
                        element,
                        ratio: ratio.toFixed(2),
                        required: requiredRatio,
                        color,
                        backgroundColor
                    });
                }
            }
        });
        
        return issues;
    }

    /**
     * Generate accessibility report
     * @returns {Object} Accessibility report
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            checks: {
                headings: this.checkHeadingHierarchy(),
                landmarks: this.checkLandmarks(),
                images: this.checkImages(),
                forms: this.checkForms(),
                links: this.checkLinks(),
                contrast: this.validateContrast()
            }
        };

        console.group('📋 Accessibility Report');
        console.log('Heading Issues:', report.checks.headings.issues.length);
        console.log('Landmark Issues:', report.checks.landmarks.issues.length);
        console.log('Image Issues:', report.checks.images.issues.length);
        console.log('Form Issues:', report.checks.forms.issues.length);
        console.log('Link Issues:', report.checks.links.issues.length);
        console.log('Contrast Issues:', report.checks.contrast.length);
        console.groupEnd();

        return report;
    }

    /**
     * Check heading hierarchy
     * @returns {Object} Heading check results
     */
    checkHeadingHierarchy() {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        const issues = [];
        let prevLevel = 0;

        headings.forEach(heading => {
            const level = parseInt(heading.tagName[1]);
            
            if (level - prevLevel > 1) {
                issues.push({
                    element: heading,
                    message: `Heading level skipped from H${prevLevel} to H${level}`
                });
            }
            
            prevLevel = level;
        });

        return { total: headings.length, issues };
    }

    /**
     * Check landmark regions
     * @returns {Object} Landmark check results
     */
    checkLandmarks() {
        const issues = [];
        
        if (!document.querySelector('header, [role="banner"]')) {
            issues.push({ message: 'Missing <header> or role="banner"' });
        }
        
        if (!document.querySelector('nav, [role="navigation"]')) {
            issues.push({ message: 'Missing <nav> or role="navigation"' });
        }
        
        if (!document.querySelector('main, [role="main"]')) {
            issues.push({ message: 'Missing <main> or role="main"' });
        }
        
        if (!document.querySelector('footer, [role="contentinfo"]')) {
            issues.push({ message: 'Missing <footer> or role="contentinfo"' });
        }

        return { issues };
    }

    /**
     * Check images for alt text
     * @returns {Object} Image check results
     */
    checkImages() {
        const images = Array.from(document.querySelectorAll('img'));
        const issues = images.filter(img => !img.hasAttribute('alt')).map(img => ({
            element: img,
            message: 'Image missing alt attribute'
        }));

        return { total: images.length, issues };
    }

    /**
     * Check form accessibility
     * @returns {Object} Form check results
     */
    checkForms() {
        const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
        const issues = [];

        inputs.forEach(input => {
            if (input.type === 'hidden') return;
            
            const hasLabel = input.id && document.querySelector(`label[for="${input.id}"]`);
            const hasAriaLabel = input.getAttribute('aria-label') || input.getAttribute('aria-labelledby');
            
            if (!hasLabel && !hasAriaLabel) {
                issues.push({
                    element: input,
                    message: 'Form input missing label'
                });
            }
        });

        return { total: inputs.length, issues };
    }

    /**
     * Check link accessibility
     * @returns {Object} Link check results
     */
    checkLinks() {
        const links = Array.from(document.querySelectorAll('a[href]'));
        const issues = [];

        links.forEach(link => {
            const text = link.textContent.trim();
            const ariaLabel = link.getAttribute('aria-label');
            
            if (!text && !ariaLabel) {
                issues.push({
                    element: link,
                    message: 'Link has no accessible text'
                });
            }
            
            if (text && text.length < 2) {
                issues.push({
                    element: link,
                    message: 'Link text too short'
                });
            }
        });

        return { total: links.length, issues };
    }
}

// Initialize accessibility manager
let accessibilityManager;

if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        accessibilityManager = new AccessibilityManager();
        
        // Make globally available
        window.AccessibilityManager = AccessibilityManager;
        window.a11y = accessibilityManager;
        
        // Add global methods
        window.announce = window.announce || function(message, priority = 'polite') {
            const announcer = document.getElementById('aria-announcer');
            if (announcer) {
                announcer.setAttribute('aria-live', priority);
                announcer.textContent = message;
                setTimeout(() => announcer.textContent = '', 1000);
            }
        };
    });
}

export default AccessibilityManager;
