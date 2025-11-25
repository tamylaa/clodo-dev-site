// Core initialization - loads immediately
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Setup critical features first
        setupThemeToggle();
        setupNewsletterForm();
        setupSmoothScrolling();
        setupNavActiveState();
        setupMobileMenu();
        setupNavDropdowns();
        setupContactForm();
        setupAnnouncementBar();
        setupMicroInteractions();
        setupStackBlitzIntegration();
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

    // Handle page-based active state for navigation links
    setPageActiveState();

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

function setPageActiveState() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('#') && !href.includes('http')) {
            // Remove leading slash for comparison
            const linkPath = href.startsWith('/') ? href : '/' + href;
            if (currentPath === linkPath || (currentPath === '/' && linkPath === '/index.html')) {
                link.classList.add('active');
            }
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

// Navigation dropdown functionality
function setupNavDropdowns() {
    const dropdownToggles = document.querySelectorAll('.nav-dropdown-toggle');

    dropdownToggles.forEach(toggle => {
        const dropdown = toggle.closest('.nav-dropdown');
        const _menu = dropdown.querySelector('.nav-dropdown-menu');

        // Desktop hover functionality
        dropdown.addEventListener('mouseenter', function() {
            if (window.innerWidth > 768) {
                toggle.setAttribute('aria-expanded', 'true');
            }
        });

        dropdown.addEventListener('mouseleave', function() {
            if (window.innerWidth > 768) {
                toggle.setAttribute('aria-expanded', 'false');
            }
        });

        // Mobile click functionality
        toggle.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
                toggle.setAttribute('aria-expanded', !isExpanded);
            }
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(event) {
        const dropdowns = document.querySelectorAll('.nav-dropdown');
        dropdowns.forEach(dropdown => {
            const toggle = dropdown.querySelector('.nav-dropdown-toggle');
            const _menu = dropdown.querySelector('.nav-dropdown-menu');

            if (!dropdown.contains(event.target) && window.innerWidth > 768) {
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
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

// Comprehensive Announcement Banner System
class AnnouncementBanner {
    constructor() {
        this.banners = [];
        this.storageKey = 'clodo-announcements';
        this.init();
    }

    init() {
        this.loadBanners();
        this.renderBanners();
        this.setupEventListeners();
        this.autoHideBanners();
    }

    // Define all available announcements
    getAvailableBanners() {
        return [
            {
                id: 'migration-2025',
                type: 'info',
                priority: 10,
                title: 'New: Migrate to Cloudflare',
                message: 'Migrate from Vercel/Railway to Cloudflare with Clodo Framework. Get enterprise-grade performance and security.',
                link: {
                    text: 'Learn more',
                    url: 'migrate.html'
                },
                dismissible: true,
                autoHide: false,
                startDate: '2025-01-01',
                endDate: '2025-12-31',
                targetPages: ['index.html', 'about.html', 'product.html'], // Show on specific pages
                excludePages: ['migrate.html'] // Don't show on these pages
            },
            {
                id: 'launch-announcement',
                type: 'success',
                priority: 5,
                title: '🎉 Clodo Framework v1.0 Released!',
                message: 'Enterprise SaaS development just got 10x faster. Build production-ready applications on Cloudflare Edge.',
                link: {
                    text: 'Get Started',
                    url: 'docs.html'
                },
                dismissible: true,
                autoHide: 30000, // Auto-hide after 30 seconds
                startDate: '2025-11-01',
                endDate: '2025-11-30'
            }
        ];
    }

    loadBanners() {
        const dismissed = this.getDismissedBanners();
        const available = this.getAvailableBanners();

        // Filter banners based on date, dismissal status, and page targeting
        this.banners = available.filter(banner => {
            // Check if banner is dismissed
            if (dismissed.includes(banner.id)) return false;

            // Check date range
            const now = new Date();
            const startDate = banner.startDate ? new Date(banner.startDate) : null;
            const endDate = banner.endDate ? new Date(banner.endDate) : null;

            if (startDate && now < startDate) return false;
            if (endDate && now > endDate) return false;

            // Check page targeting
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';

            if (banner.excludePages && banner.excludePages.includes(currentPage)) return false;
            if (banner.targetPages && !banner.targetPages.includes(currentPage)) return false;

            return true;
        }).sort((a, b) => b.priority - a.priority); // Sort by priority
    }

    renderBanners() {
        const container = document.querySelector('.announcement-container');
        if (!container) {
            // Create container if it doesn't exist
            const newContainer = document.createElement('div');
            newContainer.className = 'announcement-container';
            document.body.insertBefore(newContainer, document.body.firstChild);
        }

        const containerElement = document.querySelector('.announcement-container');
        if (!containerElement) return;

        // Clear existing banners
        containerElement.innerHTML = '';

        // Render active banners
        this.banners.forEach(banner => {
            const bannerElement = this.createBannerElement(banner);
            containerElement.appendChild(bannerElement);
        });
    }

    createBannerElement(banner) {
        const bannerDiv = document.createElement('div');
        bannerDiv.className = `announcement-banner announcement-${banner.type}`;
        bannerDiv.setAttribute('data-banner-id', banner.id);
        bannerDiv.setAttribute('role', 'banner');
        bannerDiv.setAttribute('aria-label', `${banner.type} announcement`);

        bannerDiv.innerHTML = `
            <div class="announcement-content">
                <div class="announcement-icon">
                    ${this.getBannerIcon(banner.type)}
                </div>
                <div class="announcement-text">
                    ${banner.title ? `<strong class="announcement-title">${banner.title}</strong>` : ''}
                    <span class="announcement-message">${banner.message}</span>
                </div>
                <div class="announcement-actions">
                    ${banner.link ? `<a href="${banner.link.url}" class="announcement-link">${banner.link.text}</a>` : ''}
                    ${banner.dismissible ? `<button class="announcement-close" aria-label="Dismiss announcement" data-banner-id="${banner.id}">×</button>` : ''}
                </div>
            </div>
        `;

        return bannerDiv;
    }

    getBannerIcon(type) {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            news: '📰'
        };
        return icons[type] || '📢';
    }

    setupEventListeners() {
        // Handle banner dismissal
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('announcement-close')) {
                const bannerId = e.target.getAttribute('data-banner-id');
                this.dismissBanner(bannerId);
            }
        });

        // Handle banner links (track clicks if needed)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('announcement-link')) {
                const bannerId = e.target.closest('.announcement-banner').getAttribute('data-banner-id');
                this.trackBannerClick(bannerId);
            }
        });
    }

    dismissBanner(bannerId) {
        const dismissed = this.getDismissedBanners();
        dismissed.push(bannerId);
        localStorage.setItem(this.storageKey, JSON.stringify(dismissed));

        // Animate out and remove
        const banner = document.querySelector(`[data-banner-id="${bannerId}"]`);
        if (banner) {
            banner.style.animation = 'slideOutUp 0.3s ease-out forwards';
            setTimeout(() => {
                banner.remove();
            }, 300);
        }
    }

    getDismissedBanners() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        } catch (e) {
            return [];
        }
    }

    autoHideBanners() {
        this.banners.forEach(banner => {
            if (banner.autoHide && banner.autoHide > 0) {
                setTimeout(() => {
                    const bannerElement = document.querySelector(`[data-banner-id="${banner.id}"]`);
                    if (bannerElement && !bannerElement.classList.contains('dismissed')) {
                        this.dismissBanner(banner.id);
                    }
                }, banner.autoHide);
            }
        });
    }

    trackBannerClick(bannerId) {
        // Track banner clicks for analytics
        try {
            const clicks = JSON.parse(localStorage.getItem('banner-clicks') || '{}');
            clicks[bannerId] = (clicks[bannerId] || 0) + 1;
            localStorage.setItem('banner-clicks', JSON.stringify(clicks));
        } catch (e) {
            // Non-fatal
        }
    }

    // Admin methods for managing banners
    resetAllBanners() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem('banner-clicks');
        this.init();
    }

    showBanner(bannerId) {
        const dismissed = this.getDismissedBanners();
        const index = dismissed.indexOf(bannerId);
        if (index > -1) {
            dismissed.splice(index, 1);
            localStorage.setItem(this.storageKey, JSON.stringify(dismissed));
            this.init();
        }
    }
}

// Initialize announcement system
new AnnouncementBanner();

// Legacy function for backward compatibility
function setupAnnouncementBar() {
    // This function is now handled by the AnnouncementBanner class
    // Keeping for backward compatibility
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
        // Initialize lazy loading functionality inline
        setupLazyLoading();

        // Load GitHub integration
        await loadScript('./js/github-integration.js');

        // Load scroll animations
        await loadScript('./js/scroll-animations.js');

    } catch (error) {
        console.warn('Some deferred features failed to load:', error);
    }
}

// Lazy loading functionality - inlined to avoid MIME type issues
function setupLazyLoading() {
    // Support for native lazy loading attribute
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');

    // If native lazy loading is supported, we're done
    if ('loading' in HTMLImageElement.prototype) {
        return;
    }

    // Fallback: Use Intersection Observer for older browsers
    const imageObserverOptions = {
        threshold: 0.01,
        rootMargin: '50px'
    };

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;

                // Load image from data-src
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                }

                // Load srcset from data-srcset
                if (img.dataset.srcset) {
                    img.srcset = img.dataset.srcset;
                }

                // Add loaded class
                img.classList.add('lazy-loaded');

                // Stop observing this image
                observer.unobserve(img);
            }
        });
    }, imageObserverOptions);

    lazyImages.forEach(img => {
        // Add placeholder if not already present
        if (!img.dataset.src) {
            img.dataset.src = img.src;
            img.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22400%22 height=%22300%22/%3E%3C/svg%3E';
        }

        img.classList.add('lazy');
        imageObserver.observe(img);
    });

    // Also setup lazy loading for background images with data-src
    const lazyBgs = document.querySelectorAll('[data-bg-src]');
    const bgObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                el.style.backgroundImage = `url(${el.dataset.bgSrc})`;
                el.classList.add('lazy-loaded');
                observer.unobserve(el);
            }
        });
    }, imageObserverOptions);

    lazyBgs.forEach(el => {
        el.classList.add('lazy');
        bgObserver.observe(el);
    });
}

// Utility function to load scripts dynamically
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.setAttribute('nonce', 'N0Nc3Cl0d0');
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// ===== UTILITY FUNCTIONS =====

// Enhanced notification system with loading states (defined later in file)

// ===== PERFORMANCE OPTIMIZATION =====

// Navbar scroll effect - always visible with enhanced background on scroll
let scheduled = false;

function handleScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Always keep navbar visible
    navbar.style.transform = 'translateY(0)';

    // Enhanced background blur when scrolled (no layout shift)
    if (scrollTop > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.backdropFilter = 'blur(20px)';
        navbar.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.backdropFilter = 'blur(10px)';
        navbar.style.boxShadow = 'none';
    }
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

    // Enhanced loading states for better UX
    setupLoadingStates();
}

// ===== LOADING STATE MANAGEMENT =====
function setupLoadingStates() {
    // Enhanced form loading states
    document.querySelectorAll('form').forEach(form => {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            form.addEventListener('submit', function() {
                setLoadingState(submitBtn, true);
            });
        }
    });

    // Async content loading simulation
    setupAsyncContentLoading();
}

// Set loading state for elements
function setLoadingState(element, isLoading) {
    if (isLoading) {
        element.setAttribute('aria-busy', 'true');
        element.disabled = true;
        element.classList.add('state-loading');

        // Store original text for restoration
        if (!element.dataset.originalText) {
            element.dataset.originalText = element.textContent;
        }
        element.textContent = 'Loading...';
    } else {
        element.setAttribute('aria-busy', 'false');
        element.disabled = false;
        element.classList.remove('state-loading');

        // Restore original text
        if (element.dataset.originalText) {
            element.textContent = element.dataset.originalText;
        }
    }
}

// Show loading overlay
function _showLoadingOverlay(message = 'Loading...') {
    let overlay = document.querySelector('.loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="spinner spinner--lg"></div>
                <div class="loading-text">${message}</div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Hide loading overlay
function _hideLoadingOverlay() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
        overlay.classList.remove('show');
        setTimeout(() => {
            overlay.remove();
            document.body.style.overflow = '';
        }, 300);
    }
}

// Show skeleton loading for content areas
function showSkeletonLoading(container, type = 'card') {
    if (!container) return;

    const skeletonCount = type === 'list' ? 3 : 1;
    container.innerHTML = '';

    for (let i = 0; i < skeletonCount; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = `skeleton skeleton--${type}`;
        container.appendChild(skeleton);
    }
}

// Hide skeleton loading and show real content
function hideSkeletonLoading(container, content) {
    if (!container) return;

    // Add fade-in animation
    container.style.opacity = '0';
    container.innerHTML = content;

    setTimeout(() => {
        container.style.transition = 'opacity 0.3s ease';
        container.style.opacity = '1';
    }, 100);
}

// Simulate async content loading
function setupAsyncContentLoading() {
    // Simulate loading testimonials
    const testimonialContainer = document.querySelector('.testimonials');
    if (testimonialContainer && testimonialContainer.children.length === 0) {
        showSkeletonLoading(testimonialContainer, 'card');

        // Simulate API call
        setTimeout(() => {
            const testimonials = `
                <div class="testimonial">
                    <div class="testimonial__content">
                        <p>"Clodo Framework transformed our development workflow. What used to take weeks now takes days."</p>
                    </div>
                    <div class="testimonial__info">
                        <h4>Sarah Chen</h4>
                        <p>CTO, TechFlow Inc.</p>
                    </div>
                </div>
                <div class="testimonial">
                    <div class="testimonial__content">
                        <p>"The enterprise-grade security and performance monitoring give us peace of mind."</p>
                    </div>
                    <div class="testimonial__info">
                        <h4>Michael Rodriguez</h4>
                        <p>Lead Developer, DataSecure</p>
                    </div>
                </div>
            `;
            hideSkeletonLoading(testimonialContainer, testimonials);
        }, 2000);
    }

    // Simulate loading stats
    const statsContainer = document.querySelector('.stats-grid');
    if (statsContainer) {
        const statElements = statsContainer.querySelectorAll('.stat-number');
        statElements.forEach(stat => {
            if (stat.textContent.includes('—')) {
                stat.classList.add('loading-pulse');
                // Simulate stat loading
                setTimeout(() => {
                    stat.classList.remove('loading-pulse');
                    // In real implementation, this would be actual data
                }, 1500);
            }
        });
    }
}

// Progress bar functionality
function _showProgressBar(container, progress = 0) {
    let progressBar = container.querySelector('.progress-bar');
    if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.innerHTML = '<div class="progress-fill"></div>';
        container.appendChild(progressBar);
    }

    const fill = progressBar.querySelector('.progress-fill');
    fill.style.width = `${progress}%`;
}

function _showIndeterminateProgress(container) {
    let progressBar = container.querySelector('.progress-bar');
    if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.className = 'progress-bar progress-bar--animated';
        progressBar.innerHTML = '<div class="progress-fill"></div>';
        container.appendChild(progressBar);
    }
}

// Enhanced notification system with loading states
function showNotification(message, type = 'info', duration = 5000) {
    const validTypes = ['success', 'error', 'info', 'warning'];
    const normalizedType = validTypes.includes(type) ? type : 'info';

    const notification = document.createElement('div');
    notification.className = `notification notification--${normalizedType}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');

    let icon = '';
    switch (normalizedType) {
        case 'success':
            icon = '✓';
            break;
        case 'error':
            icon = '✕';
            break;
        case 'warning':
            icon = '⚠';
            break;
        default:
            icon = 'ℹ';
    }

    notification.innerHTML = `
        <div class="notification__content">
            <span class="notification__icon">${icon}</span>
            <span class="notification__message">${message}</span>
        </div>
        <button class="notification__close" aria-label="Close notification">×</button>
    `;

    // Add to notification container
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }

    container.appendChild(notification);

    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);

    // Auto remove
    if (duration > 0) {
        setTimeout(() => {
            removeNotification(notification);
        }, duration);
    }

    // Close button
    const closeBtn = notification.querySelector('.notification__close');
    closeBtn.addEventListener('click', () => removeNotification(notification));

    return notification;
}

function removeNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// Try modal setup
function setupStackBlitzIntegration() {
    // Button now uses inline onclick handler for reliability
    // No need for additional event listeners
    console.log('StackBlitz integration initialized (using inline onclick)');
}

// StackBlitz opening function with error handling and fallbacks
function _openStackBlitz(templateUrl) {
    try {
        // Attempt to open StackBlitz
        const popup = window.open(templateUrl, '_blank', 'noopener,noreferrer');

        if (!popup) {
            throw new Error('Popup blocked');
        }

        // Track successful opens
        if (typeof gtag !== 'undefined') {
            // eslint-disable-next-line no-undef
            gtag('event', 'stackblitz_open', {
                event_category: 'demo',
                event_label: 'homepage_cta',
                value: 1
            });
        }

        // Show success feedback
        showNotification('🚀 Opening instant coding environment...', 'success');

    } catch (error) {
        console.warn('StackBlitz popup blocked, falling back to modal');

        // Track fallback usage
        if (typeof gtag !== 'undefined') {
            // eslint-disable-next-line no-undef
            gtag('event', 'stackblitz_fallback', {
                event_category: 'demo',
                event_label: 'popup_blocked'
            });
        }

        // Show setup modal as fallback
        showSetupModal();
    }
}

// Fallback modal for when StackBlitz fails
function showSetupModal() {
    const modalHTML = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <button class="modal-close" onclick="closeModal()" aria-label="Close modal">×</button>
                <div class="modal-header">
                    <h3>🚀 Try Clodo Framework - Fallback Mode</h3>
                    <p>StackBlitz couldn't open automatically. Choose your preferred setup method:</p>
                </div>
                <div class="modal-body">
                    <div class="setup-options">
                        <div class="setup-option">
                            <h4>⚡ Instant Environment (Recommended)</h4>
                            <p>Enable popups for stackblitz.com and try the button again, or <a href="https://stackblitz.com/github/tamylaa/clodo-starter-template?file=index.js" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">open StackBlitz directly</a>.</p>
                        </div>
                        <div class="setup-option">
                            <h4>💻 Local Development</h4>
                            <p>Set up Clodo Framework on your machine:</p>
                            <div class="code-blocks">
                                <div class="code-block">
                                    <h5>Windows PowerShell:</h5>
                                    <pre><code>irm https://raw.githubusercontent.com/tamylaa/clodo-dev-site/main/setup-clodo.ps1 | iex</code></pre>
                                </div>
                                <div class="code-block">
                                    <h5>macOS/Linux:</h5>
                                    <pre><code>curl -fsSL https://raw.githubusercontent.com/tamylaa/clodo-dev-site/main/setup-clodo.js | node</code></pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add modal styles
    const modalStyles = `
        <style>
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: modalFadeIn 0.3s ease-out;
            }

            .modal-content {
                background: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                max-width: 600px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
                animation: modalSlideIn 0.3s ease-out;
                position: relative;
            }

            .modal-close {
                position: absolute;
                top: 16px;
                right: 16px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: var(--text-secondary);
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }

            .modal-close:hover {
                background: var(--bg-secondary);
                color: var(--text-primary);
            }

            .modal-header {
                padding: 24px 24px 16px;
                border-bottom: 1px solid var(--border-color);
            }

            .modal-header h3 {
                margin: 0 0 8px;
                font-size: 24px;
                font-weight: 600;
            }

            .modal-header p {
                margin: 0;
                color: var(--text-secondary);
            }

            .modal-body {
                padding: 24px;
            }

            .setup-options {
                display: flex;
                flex-direction: column;
                gap: 24px;
            }

            .setup-option h4 {
                margin: 0 0 8px;
                font-size: 18px;
                font-weight: 600;
            }

            .setup-option p {
                margin: 0 0 16px;
                color: var(--text-secondary);
            }

            .code-blocks {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .code-block h5 {
                margin: 0 0 8px;
                font-size: 14px;
                font-weight: 600;
                color: var(--text-secondary);
            }

            .code-block pre {
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: 6px;
                padding: 12px;
                margin: 0;
                overflow-x: auto;
            }

            .code-block code {
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                font-size: 14px;
                color: var(--text-primary);
            }

            @keyframes modalFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: scale(0.9) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }

            @media (max-width: 768px) {
                .modal-content {
                    width: 95%;
                    margin: 20px;
                }

                .code-blocks {
                    flex-direction: column;
                }
            }
        </style>
    `;

    // Inject modal into page
    document.body.insertAdjacentHTML('beforeend', modalStyles + modalHTML);

    // Focus management
    const modal = document.querySelector('.modal-content');

    if (modal) {
        modal.focus();
    }

    // Close modal function
    window.closeModal = function() {
        const overlay = document.querySelector('.modal-overlay');
        if (overlay) {
            overlay.remove();
        }
        delete window.closeModal;
    };

    // Keyboard navigation
    document.addEventListener('keydown', function handleKeydown(e) {
        if (e.key === 'Escape') {
            // eslint-disable-next-line no-undef
            closeModal();
            document.removeEventListener('keydown', handleKeydown);
        }
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

// ===== TRY CLODO MODAL FUNCTIONALITY =====

/* eslint-disable no-unused-vars */
function showTryModal() {
    // Create modal HTML with embedded styles
    const modalHTML = `
        <style>
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: modalFadeIn 0.3s ease-out;
            }

            .modal-content {
                background: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                max-width: 500px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
                animation: modalSlideIn 0.3s ease-out;
                position: relative;
            }

            .modal-close {
                position: absolute;
                top: 16px;
                right: 16px;
                background: none;
                border: none;
                color: var(--text-secondary);
                cursor: pointer;
                padding: 8px;
                border-radius: 6px;
                transition: all 0.2s;
            }

            .modal-close:hover {
                background: var(--bg-secondary);
                color: var(--text-primary);
            }

            .modal-header {
                padding: 24px 24px 16px;
                border-bottom: 1px solid var(--border-color);
            }

            .modal-header h2 {
                margin: 0 0 8px 0;
                font-size: 1.5rem;
                font-weight: 600;
            }

            .modal-header p {
                margin: 0;
                color: var(--text-secondary);
                font-size: 0.95rem;
            }

            .modal-body {
                padding: 24px;
            }

            .setup-options {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .setup-option {
                display: flex;
                align-items: center;
                padding: 16px;
                border: 2px solid var(--border-color);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                background: var(--bg-primary);
            }

            .setup-option:hover {
                border-color: var(--primary-color);
                background: var(--bg-secondary);
                transform: translateY(-1px);
            }

            .option-icon {
                font-size: 1.5rem;
                margin-right: 16px;
                width: 40px;
                text-align: center;
            }

            .option-content {
                flex: 1;
            }

            .option-content h3 {
                margin: 0 0 4px 0;
                font-size: 1rem;
                font-weight: 600;
            }

            .option-content p {
                margin: 0 0 4px 0;
                color: var(--text-secondary);
                font-size: 0.9rem;
            }

            .option-content code {
                background: var(--bg-secondary);
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 0.8rem;
                color: var(--primary-color);
            }

            .option-arrow {
                font-size: 1.2rem;
                color: var(--primary-color);
                margin-left: 16px;
            }

            .modal-footer {
                margin-top: 20px;
                padding-top: 16px;
                border-top: 1px solid var(--border-color);
            }

            .modal-note {
                margin: 0;
                font-size: 0.9rem;
                color: var(--text-secondary);
                text-align: center;
            }

            @keyframes modalFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: scale(0.9) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }

            @media (max-width: 640px) {
                .modal-content {
                    margin: 20px;
                    width: calc(100% - 40px);
                }

                .setup-option {
                    flex-direction: column;
                    text-align: center;
                    gap: 8px;
                }

                .option-icon {
                    margin-right: 0;
                    margin-bottom: 8px;
                }

                .option-arrow {
                    margin-left: 0;
                    margin-top: 8px;
                }
            }
        </style>

        <div id="try-modal" class="modal-overlay" role="dialog" aria-labelledby="try-modal-title" aria-describedby="try-modal-desc">
            <div class="modal-content">
                <button class="modal-close" aria-label="Close modal">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div class="modal-header">
                    <h2 id="try-modal-title">🚀 Try Clodo Framework - Alternative Options</h2>
                    <p id="try-modal-desc">StackBlitz couldn't open automatically. Try these alternatives:</p>
                </div>

                <div class="modal-body">
                    <div class="stackblitz-direct-link">
                        <p><strong>🔗 Direct Link:</strong> <a href="https://stackblitz.com/github/tamylaa/clodo-starter-template?file=index.js" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">Open StackBlitz Instantly</a></p>
                    </div>

                    <div class="setup-options">
                        <div class="setup-option" data-action="powershell">
                            <div class="option-icon">🪟</div>
                            <div class="option-content">
                                <h3>Windows (PowerShell)</h3>
                                <p>Automated setup for Windows users</p>
                                <code>./setup-clodo.ps1 my-app</code>
                            </div>
                            <div class="option-arrow">→</div>
                        </div>

                        <div class="setup-option" data-action="javascript">
                            <div class="option-icon">🌐</div>
                            <div class="option-content">
                                <h3>Cross-platform (Node.js)</h3>
                                <p>Works on Windows, macOS, Linux</p>
                                <code>node setup-clodo.js my-app</code>
                            </div>
                            <div class="option-arrow">→</div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <p class="modal-note">
                            💡 <strong>Pro tip:</strong> These options create a complete working app with API endpoints, database integration, and deployment ready.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Add event listeners to setup options
    document.querySelectorAll('.setup-option').forEach(option => {
        option.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            switch(action) {
                case 'powershell':
                    runPowerShellSetup();
                    break;
                case 'javascript':
                    runJSSetup();
                    break;
            }
        });
    });

    // Add event listener to close button
    document.querySelector('.modal-close').addEventListener('click', closeTryModal);

    // Focus management
    const modal = document.getElementById('try-modal');
    modal.focus();

    // Close on escape key
    document.addEventListener('keydown', handleModalKeydown);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closeTryModal() {
    const modal = document.getElementById('try-modal');
    if (modal) {
        modal.remove();
        document.removeEventListener('keydown', handleModalKeydown);
        document.body.style.overflow = '';
    }
}

function handleModalKeydown(event) {
    if (event.key === 'Escape') {
        closeTryModal();
    }
}

function runPowerShellSetup() {
    closeTryModal();

    // Copy PowerShell command to clipboard
    const command = `Invoke-WebRequest -Uri "https://raw.githubusercontent.com/tamylaa/clodo-dev-site/main/setup-clodo.ps1" -OutFile "setup-clodo.ps1"; ./setup-clodo.ps1 my-clodo-app`;
    navigator.clipboard.writeText(command).then(() => {
        showNotification('PowerShell command copied to clipboard! Open PowerShell and paste to get started.', 'success');
    }).catch(() => {
        showNotification('Copy this command: ' + command, 'info');
    });
}

function runJSSetup() {
    closeTryModal();

    // Copy JavaScript command to clipboard
    const command = `curl -o setup-clodo.js https://raw.githubusercontent.com/tamylaa/clodo-dev-site/main/setup-clodo.js && node setup-clodo.js my-clodo-app`;
    navigator.clipboard.writeText(command).then(() => {
        showNotification('JavaScript command copied to clipboard! Open terminal and paste to get started.', 'success');
    }).catch(() => {
        showNotification('Copy this command: ' + command, 'info');
    });
}

// ===== ANALYTICS & MARKETING TRACKING =====

// Enhanced analytics tracking for marketing insights
function trackEvent(eventName, parameters = {}) {
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, {
            ...parameters,
            page_location: window.location.href,
            page_title: document.title
        });
    }

    // Also track in console for development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('Analytics Event:', eventName, parameters);
    }
}

// Track user engagement and marketing metrics
function setupMarketingAnalytics() {
    // Track time on page
    let startTime = Date.now();
    window.addEventListener('beforeunload', () => {
        const timeSpent = Math.round((Date.now() - startTime) / 1000);
        trackEvent('page_time', {
            event_category: 'engagement',
            event_label: 'time_on_page',
            value: timeSpent,
            custom_parameter_1: document.title
        });
    });

    // Track scroll depth
    let maxScroll = 0;
    window.addEventListener('scroll', () => {
        const scrollPercent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
        if (scrollPercent > maxScroll && scrollPercent % 25 === 0) {
            maxScroll = scrollPercent;
            trackEvent('scroll_depth', {
                event_category: 'engagement',
                event_label: 'scroll_percentage',
                value: scrollPercent
            });
        }
    });

    // Track feature discovery (when elements come into view)
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px 0px -50px 0px'
    };

    const featureObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const featureId = entry.target.id || entry.target.className;
                trackEvent('feature_view', {
                    event_category: 'engagement',
                    event_label: featureId,
                    value: 1
                });
                featureObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe key marketing sections
    const marketingSections = ['hero', 'features', 'testimonials', 'pricing', 'newsletter'];
    marketingSections.forEach(sectionId => {
        const element = document.getElementById(sectionId);
        if (element) {
            featureObserver.observe(element);
        }
    });

    // Track outbound link clicks
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.href && !link.href.includes(window.location.origin)) {
            trackEvent('outbound_link_click', {
                event_category: 'engagement',
                event_label: link.href,
                link_domain: new URL(link.href).hostname
            });
        }
    });

    // Track form interactions
    document.addEventListener('focusin', (e) => {
        if (e.target.matches('input, textarea, select')) {
            trackEvent('form_interaction', {
                event_category: 'engagement',
                event_label: e.target.name || e.target.id || e.target.type
            });
        }
    });

    // Track user type based on behavior
    let userType = 'visitor';
    if (document.referrer.includes('github.com')) {
        userType = 'developer';
    } else if (document.referrer.includes('stackoverflow.com') || document.referrer.includes('reddit.com')) {
        userType = 'researcher';
    }

    // Set user type dimension
    if (typeof gtag !== 'undefined') {
        gtag('config', 'GA_MEASUREMENT_ID', {
            'custom_map': {'dimension1': userType}
        });
    }
}

// Track conversion events
function trackConversion(conversionType, details = {}) {
    trackEvent('conversion', {
        event_category: 'conversion',
        event_label: conversionType,
        ...details
    });
}

// Newsletter signup tracking (already exists but enhanced)
function trackNewsletterSignup(method = 'form') {
    trackConversion('newsletter_signup', {
        signup_method: method,
        page_location: window.location.pathname
    });
}

// Demo interaction tracking (already exists but enhanced)
function trackDemoInteraction(demoType, success = true) {
    trackEvent('demo_interaction', {
        event_category: 'engagement',
        event_label: demoType,
        success: success,
        value: success ? 1 : 0
    });
}

// Initialize marketing analytics
document.addEventListener('DOMContentLoaded', function() {
    setupMarketingAnalytics();
});

/* eslint-enable no-unused-vars */