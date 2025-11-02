// Core initialization - loads immediately
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Setup critical features first
        setupThemeToggle();
        setupNewsletterForm();
        setupSmoothScrolling();
        setupNavActiveState();
        setupMobileMenu();
        setupContactForm();
        setupAnnouncementBar();
        setupMicroInteractions();
        updateDynamicStats();

        // Lazy load non-critical features after initial page load
        setTimeout(() => {
            loadDeferredFeatures();
        }, 100);

    } catch (error) {
        console.error('Error initializing application:', error);
        showNotification('Application failed to load properly. Please refresh the page.', 'error');
    }
});

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    showNotification('An unexpected error occurred. Please try again.', 'error');
});

// ===== CRITICAL FEATURES (load immediately) =====

// Theme toggle functionality
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

    // Set initial theme
    applyTheme(initialTheme);
    themeToggle.setAttribute('data-theme', initialTheme);

    // Handle theme toggle click
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        applyTheme(newTheme);
        themeToggle.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            const newTheme = e.matches ? 'dark' : 'light';
            applyTheme(newTheme);
            themeToggle.setAttribute('data-theme', newTheme);
        }
    });
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.style.colorScheme = 'dark';
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.style.colorScheme = 'light';
    }
}

// Newsletter form with Brevo integration
function setupNewsletterForm() {
    const newsletterForm = document.querySelector('.newsletter-form');
    if (!newsletterForm) {
        console.warn('Newsletter form not found on this page');
        return;
    }

    console.log('Newsletter form initialized');

    // Pre-fill email from URL parameters if present
    const urlParams = new URLSearchParams(window.location.search);
    const emailFromUrl = urlParams.get('email');
    if (emailFromUrl) {
        const emailInput = newsletterForm.querySelector('input[type="email"]');
        if (emailInput) {
            emailInput.value = emailFromUrl;
            console.log('Pre-filled email from URL:', emailFromUrl);
        }
    }

    newsletterForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Newsletter form submitted');

        const emailInput = newsletterForm.querySelector('input[type="email"]');
        const submitBtn = newsletterForm.querySelector('button[type="submit"]');
        const messageEl = newsletterForm.querySelector('.form-message');
        const consentCheckbox = newsletterForm.querySelector('input[name="consent"]');

        console.log('Form elements found:', {
            emailInput: !!emailInput,
            submitBtn: !!submitBtn,
            messageEl: !!messageEl,
            consentCheckbox: !!consentCheckbox
        });

        // Ensure message element has an id for aria-describedby linkage
        if (messageEl && !messageEl.id) {
            messageEl.id = 'newsletter-message';
        }

        if (!emailInput.value) {
            showFormMessage(messageEl, 'Please enter your email address.', 'error');
            emailInput.setAttribute('aria-invalid', 'true');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value)) {
            showFormMessage(messageEl, 'Please enter a valid email address.', 'error');
            emailInput.setAttribute('aria-invalid', 'true');
            return;
        }

        // Validate Cloudflare Turnstile if present and rendered
        const turnstileWidget = document.querySelector('.cf-turnstile');
        let turnstileResponse = null;

        if (turnstileWidget) {
            // Get Turnstile response token (only if widget has rendered)
            const turnstileInput = turnstileWidget.querySelector('input[name="cf-turnstile-response"]');

            // Only validate if the widget has actually rendered (input exists)
            if (turnstileInput) {
                turnstileResponse = turnstileInput.value;

                // Only require response if widget has a non-empty value
                if (turnstileResponse && turnstileResponse.trim() === '') {
                    showFormMessage(messageEl, 'Please complete the verification.', 'error');
                    return;
                }
            }
            // If widget exists but hasn't rendered yet, allow submission without token
        }

        const originalText = submitBtn.textContent;
        submitBtn.setAttribute('aria-busy', 'true');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner spinner--sm spinner--white"></span> Subscribing...';

        try {
            // Check if Brevo is configured
            if (!window.BREVO_CONFIG || !window.BREVO_CONFIG.API_KEY || window.BREVO_CONFIG.API_KEY === 'YOUR_BREVO_API_KEY_HERE') {
                throw new Error('Brevo API key not configured. Please check brevo-secure-config.js');
            }

            if (!window.BREVO_CONFIG.LIST_ID) {
                throw new Error('Brevo list ID not configured. Please check brevo-secure-config.js and update LIST_ID');
            }

            console.log('Brevo config loaded:', {
                hasApiKey: !!window.BREVO_CONFIG.API_KEY,
                listId: window.BREVO_CONFIG.LIST_ID,
                apiKeyPrefix: window.BREVO_CONFIG.API_KEY.substring(0, 10) + '...'
            });

            // Use Cloudflare Worker to proxy the Brevo API call (avoids CORS issues)
            const requestBody = {
                email: emailInput.value,
                listIds: [window.BREVO_CONFIG.LIST_ID],
                updateEnabled: true,
                attributes: {
                    SOURCE: newsletterForm.querySelector('input[name="source"]')?.value || 'website',
                    SUBSCRIPTION_DATE: new Date().toISOString(),
                    CONSENT_GIVEN: true,
                    TURNSTILE_TOKEN: turnstileResponse
                }
            };

            // Include honeypot field for spam protection
            const honeypotField = newsletterForm.querySelector('input[name="honeypot"]');
            if (honeypotField) {
                requestBody.honeypot = honeypotField.value;
            }

            const response = await fetch('/newsletter-subscribe', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            let data;
            try {
                data = await response.json();
            } catch (e) {
                data = null;
            }

            if (response.ok) {
                // Success - redirect to subscription page for better UX
                console.log('Newsletter subscription successful:', data);

                // Check if we're already on the subscription page
                if (window.location.pathname.includes('subscribe')) {
                    // On subscription page - show success message
                    showFormMessage(messageEl, '✓ Successfully subscribed! Welcome to the Clodo community.', 'success');
                    emailInput.value = '';
                    if (consentCheckbox) consentCheckbox.checked = false;
                    emailInput.removeAttribute('aria-invalid');

                    // Reset Turnstile
                    const turnstileWidget = document.querySelector('.cf-turnstile');
                    if (turnstileWidget && window.turnstile) {
                        window.turnstile.reset(turnstileWidget);
                    }

                    // Redirect to home page after 3 seconds
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 3000);
                } else {
                    // On footer - redirect to subscription page with pre-filled email
                    const params = new URLSearchParams({
                        email: emailInput.value,
                        source: 'footer'
                    });
                    window.location.href = '/subscribe.html?' + params.toString();
                }
            } else {
                // Handle specific Brevo API errors
                let errorMessage = 'Failed to subscribe. Please try again.';

                if (data) {
                    if (data.code === 'duplicate_parameter') {
                        errorMessage = 'This email is already subscribed to our newsletter.';
                    } else if (data.code === 'invalid_parameter') {
                        errorMessage = 'Please enter a valid email address.';
                    } else if (data.message) {
                        errorMessage = data.message;
                    }
                }

                showFormMessage(messageEl, errorMessage, 'error');
                emailInput.setAttribute('aria-invalid', 'true');

                // Reset Turnstile on error
                const turnstileWidget = document.querySelector('.cf-turnstile');
                if (turnstileWidget && window.turnstile) {
                    window.turnstile.reset(turnstileWidget);
                }

                // If on subscription page and it's a duplicate, still show success-like message
                if (window.location.pathname.includes('subscribe') && data.code === 'duplicate_parameter') {
                    showFormMessage(messageEl, '✓ This email is already subscribed to our newsletter!', 'success');
                    emailInput.value = '';
                    if (consentCheckbox) consentCheckbox.checked = false;
                    emailInput.removeAttribute('aria-invalid');
                }
            }

        } catch (error) {
            console.error('Newsletter subscription error:', error);

            let errorMessage = 'Network error. Please check your connection and try again.';

            // Provide more specific error messages
            if (error.message && error.message.includes('Failed to fetch')) {
                errorMessage = 'Unable to connect to newsletter service. Please check your internet connection.';
            } else if (error.message && error.message.includes('CORS')) {
                errorMessage = 'Connection blocked by security policy. Please contact support.';
            } else if (error.message) {
                errorMessage = `Subscription failed: ${error.message}`;
            }

            showFormMessage(messageEl, errorMessage, 'error');
            emailInput.setAttribute('aria-invalid', 'true');

            // Reset Turnstile on error
            const turnstileWidget = document.querySelector('.cf-turnstile');
            if (turnstileWidget && window.turnstile) {
                window.turnstile.reset(turnstileWidget);
            }
        } finally {
            submitBtn.setAttribute('aria-busy', 'false');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

function showFormMessage(messageEl, text, type) {
    messageEl.textContent = text;
    messageEl.className = `form-message show ${type}`;

    // Add enhanced animations for success states
    if (type === 'success') {
        // Add success icon animation
        messageEl.innerHTML = `<span class="icon icon--success icon--animated" aria-hidden="true">✓</span> ${text}`;

        // Trigger success animation
        messageEl.style.animation = 'none';
        messageEl.offsetHeight; // Trigger reflow
        messageEl.style.animation = 'successPulse 0.6s ease-out';

        // Auto-hide success messages after 5 seconds
        setTimeout(() => {
            messageEl.classList.remove('show');
        }, 5000);
    } else if (type === 'error') {
        // Add error icon
        messageEl.innerHTML = `<span class="icon icon--error" aria-hidden="true">⚠</span> ${text}`;
    }
}

// Smooth scrolling for anchor links
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.offsetTop;
                const offsetPosition = elementPosition - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Navigation active state detection
function setupNavActiveState() {
    const navLinks = document.querySelectorAll('.nav-link');

    // Handle scroll-based active state for on-page sections
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '-80px 0px -66%'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.id;
                updateActiveNavLink(sectionId);
            }
        });
    }, observerOptions);

    // Observe all sections
    document.querySelectorAll('section[id]').forEach(section => {
        observer.observe(section);
    });

    // Handle click events on nav links
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            const dataSection = this.getAttribute('data-section');
            if (dataSection) {
                setTimeout(() => {
                    updateActiveNavLink(dataSection);
                }, 100);
            }
        });
    });
}

function updateActiveNavLink(sectionId) {
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    navLinks.forEach(link => {
        if (link.getAttribute('data-section') === sectionId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Mobile menu toggle
function setupMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    if (!mobileMenuToggle || !mobileMenu) return;

    // Toggle menu on button click
    mobileMenuToggle.addEventListener('click', function() {
        const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
        mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
        mobileMenu.classList.toggle('active');
    });

    // Close menu when a link is clicked
    const menuLinks = mobileMenu.querySelectorAll('a');
    menuLinks.forEach(link => {
        link.addEventListener('click', function() {
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
            mobileMenu.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        const isClickInsideMenu = mobileMenu.contains(event.target);
        const isClickInsideToggle = mobileMenuToggle.contains(event.target);

        if (!isClickInsideMenu && !isClickInsideToggle && mobileMenu.classList.contains('active')) {
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
            mobileMenu.classList.remove('active');
        }
    });

    // Close menu on escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && mobileMenu.classList.contains('active')) {
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
            mobileMenu.classList.remove('active');
        }
    });
}

// Contact form submission
function setupContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        // Show loading state
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        try {
            // In a real implementation, this would send to your API
            // For now, simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Show success message
            showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');

            // Reset form
            contactForm.reset();

        } catch (error) {
            showNotification('Failed to send message. Please try again.', 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Announcement bar for migration
function setupAnnouncementBar() {
    try {
        const isMigratePage = /migrate\.html$/.test(window.location.pathname);
        if (isMigratePage) return; // don't show on migrate page itself

        const banner = document.querySelector('.migration-banner');
        if (!banner) return; // banner not found

        // Check if user has dismissed the banner
        if (localStorage.getItem('cf-migrate-announcement-dismissed') === 'true') {
            banner.style.display = 'none';
            return;
        }

        // Show the banner (it's already in the HTML)
        banner.style.display = 'block';

        const dismissBtn = banner.querySelector('.banner-close');
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                localStorage.setItem('cf-migrate-announcement-dismissed', 'true');
                banner.style.display = 'none';
            });
        }
    } catch (e) {
        // Non-fatal
        console.warn('Announcement bar failed:', e);
    }
}

// Update stats dynamically
function updateDynamicStats() {
    // Update current year
    const yearElements = document.querySelectorAll('.current-year');
    yearElements.forEach(el => {
        el.textContent = new Date().getFullYear();
    });

    // Simulate dynamic stats (in production, these would come from APIs)
    const stats = {
        users: '10,000+',
        deployments: '50,000+',
        uptime: '99.9%'
    };

    Object.keys(stats).forEach(key => {
        const elements = document.querySelectorAll(`.stat-${key}`);
        elements.forEach(el => {
            el.textContent = stats[key];
        });
    });
}

// ===== DEFERRED FEATURES (load after page load) =====

async function loadDeferredFeatures() {
    try {
        // Load lazy loading functionality
        await loadScript('./js/lazy-loading.js');

        // Load GitHub integration
        await loadScript('./js/github-integration.js');

        // Load scroll animations
        await loadScript('./js/scroll-animations.js');

    } catch (error) {
        console.warn('Some deferred features failed to load:', error);
    }
}

// Utility function to load scripts dynamically
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// ===== UTILITY FUNCTIONS =====

// Notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    const validTypes = ['success', 'error', 'info'];
    const normalizedType = validTypes.includes(type) ? type : 'info';
    notification.className = `notification notification-${normalizedType}`;
    notification.textContent = message;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 400px;
    `;

    // Set background color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6'
    };
    notification.style.backgroundColor = colors[type] || colors.info;

    // Add to page
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
}

// ===== PERFORMANCE OPTIMIZATION =====

// Navbar scroll effect with requestAnimationFrame + hysteresis
let lastScrollTop = 0;
let scheduled = false;
const HIDE_THRESHOLD = 10; // px to hide when scrolling down
const SHOW_THRESHOLD = 4;  // px to show when scrolling up

function handleScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        navbar.style.transform = 'none';
        if (scrollTop > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.backdropFilter = 'blur(20px)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.backdropFilter = 'blur(10px)';
        }
        lastScrollTop = scrollTop;
        return;
    }

    const delta = scrollTop - lastScrollTop;

    if (delta > HIDE_THRESHOLD && scrollTop > 100) {
        // Scrolling down sufficiently
        navbar.style.transform = 'translateY(-100%)';
    } else if (delta < -SHOW_THRESHOLD) {
        // Scrolling up
        navbar.style.transform = 'translateY(0)';
    }

    // Background blur based on position (no layout shift)
    if (scrollTop > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.backdropFilter = 'blur(20px)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.backdropFilter = 'blur(10px)';
    }

    lastScrollTop = scrollTop;
}

window.addEventListener('scroll', () => {
    if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(() => {
            handleScroll();
            scheduled = false;
        });
    }
});

// Enhanced micro-interactions
function setupMicroInteractions() {
    // Enhanced button interactions
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.98)';
        });

        button.addEventListener('mouseup', function() {
            this.style.transform = '';
        });

        button.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });

    // Enhanced form input focus effects
    document.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('form-group--focused');
        });

        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('form-group--focused');
        });
    });

    // Enhanced card hover effects with staggered animation
    document.querySelectorAll('.card').forEach((card, index) => {
        card.style.transitionDelay = `${index * 50}ms`;
    });

    // Add loading state enhancements
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function() {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.setAttribute('aria-busy', 'true');
                submitBtn.disabled = true;
            }
        });
    });
}

// Exports for unit tests (Node/CommonJS environment)
/* eslint-disable no-undef */
if (typeof module === 'object' && module && typeof module.exports === 'object') {
    module.exports = {
        setupSmoothScrolling,
        showNotification
    };
}
/* eslint-enable no-undef */