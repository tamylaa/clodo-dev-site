// Enhanced JavaScript for clodo.dev
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Setup theme toggle
        setupThemeToggle();

        // Setup lazy loading for images
        setupLazyLoading();

        // Fetch GitHub stars count
        fetchGitHubStars();

        // Handle contact form submission
        setupContactForm();

        // Setup newsletter form
        setupNewsletterForm();

        // Smooth scrolling for anchor links
        setupSmoothScrolling();

        // Setup navigation active state detection
        setupNavActiveState();

        // Setup mobile menu toggle
        setupMobileMenu();

        // Add fade-in animations on scroll
        setupScrollAnimations();

        // Update stats dynamically (placeholder for future API integration)
        updateDynamicStats();
    } catch (error) {
        console.error('Error initializing application:', error);
        showNotification('Application failed to load properly. Please refresh the page.', 'error');
    }
});

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    // Don't show notification for every error to avoid spam
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    showNotification('An unexpected error occurred. Please try again.', 'error');
});

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

async function fetchGitHubStars() {
    const starElements = document.querySelectorAll('#star-count, #github-stars');

    try {
        // Add loading state
        starElements.forEach(element => {
            element.setAttribute('aria-live', 'polite');
            element.setAttribute('aria-busy', 'true');
            element.classList.add('state-loading');
            element.innerHTML = '<span class="spinner spinner--sm" aria-hidden="true"></span>';
        });

        const response = await fetch('https://api.github.com/repos/tamylaa/clodo-framework', {
            timeout: 5000 // 5 second timeout
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.stargazers_count !== undefined && data.stargazers_count >= 0) {
            const formattedCount = data.stargazers_count.toLocaleString();
            starElements.forEach(element => {
                element.setAttribute('aria-busy', 'false');
                element.classList.remove('state-loading');
                element.classList.add('state-success');
                element.textContent = formattedCount;
            });
            
            // Cache the result
            localStorage.setItem('github-stars-cache', formattedCount);
        } else {
            throw new Error('Invalid star count data');
        }
    } catch (error) {
        console.warn('Could not fetch GitHub stars:', error.message);
        // Fallback to cached or default value
        const fallbackValue = localStorage.getItem('github-stars-cache') || '—';
        starElements.forEach(element => {
            element.setAttribute('aria-busy', 'false');
            element.classList.remove('state-loading');
            element.classList.add('state-error');
            element.textContent = fallbackValue;
        });

        // Cache the fallback for future use
        if (fallbackValue !== '—') {
            localStorage.setItem('github-stars-cache', fallbackValue);
        }
    }
}

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

function setupNewsletterForm() {
    const newsletterForm = document.querySelector('.newsletter-form');
    if (!newsletterForm) return;

    newsletterForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const emailInput = newsletterForm.querySelector('input[type="email"]');
        const submitBtn = newsletterForm.querySelector('button[type="submit"]');
        const messageEl = newsletterForm.querySelector('.form-message');
        // Ensure message element has an id for aria-describedby linkage
        if (messageEl && !messageEl.id) {
            messageEl.id = 'newsletter-message';
        }
        
        if (!emailInput.value) {
            showFormMessage(messageEl, 'Please enter your email address.', 'error');
            emailInput.setAttribute('aria-invalid', 'true');
            if (messageEl) {
                const helperId = emailInput.getAttribute('aria-describedby') || '';
                const ids = new Set(helperId.split(' ').filter(Boolean));
                ids.add(messageEl.id);
                emailInput.setAttribute('aria-describedby', Array.from(ids).join(' '));
            }
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value)) {
            showFormMessage(messageEl, 'Please enter a valid email address.', 'error');
            emailInput.setAttribute('aria-invalid', 'true');
            if (messageEl) {
                const helperId = emailInput.getAttribute('aria-describedby') || '';
                const ids = new Set(helperId.split(' ').filter(Boolean));
                ids.add(messageEl.id);
                emailInput.setAttribute('aria-describedby', Array.from(ids).join(' '));
            }
            return;
        }

        const originalText = submitBtn.textContent;
        submitBtn.setAttribute('aria-busy', 'true');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner spinner--sm spinner--white"></span> Subscribing...';

        try {
            // Simulate API call (replace with actual API endpoint)
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Success
            showFormMessage(messageEl, '✓ Successfully subscribed! Check your email for confirmation.', 'success');
            emailInput.value = '';
            emailInput.removeAttribute('aria-invalid');
            
            // Store email preference
            localStorage.setItem('newsletter-subscribed', 'true');
            
        } catch (error) {
            showFormMessage(messageEl, 'Failed to subscribe. Please try again.', 'error');
            emailInput.setAttribute('aria-invalid', 'true');
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
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            messageEl.classList.remove('show');
        }, 5000);
    }
}

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

function setupScrollAnimations() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        return; // Skip adding observers for animations
    }
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, observerOptions);

    // Observe elements that should animate in
    document.querySelectorAll('.feature-card, .testimonial, .stat-item').forEach(el => {
        observer.observe(el);
    });
}

function updateDynamicStats() {
    // Placeholder for dynamic stats - in a real app, these would come from APIs
    const stats = {
        companies: 0,
        services: 0
    };

    // Animate numbers (simple implementation)
    animateNumber(document.querySelector('.stat-number'), stats.companies);
}

function animateNumber(element, target) {
    if (!element) return;

    let current = 0;
    const increment = target / 50;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 50);
}

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

// Performance optimization: Lazy load images (if any)
// Add any performance monitoring or analytics here

// Handle mobile menu (placeholder for future implementation)
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

// Exports for unit tests (Node/CommonJS environment)
/* eslint-disable no-undef */
if (typeof module === 'object' && module && typeof module.exports === 'object') {
    module.exports = {
        fetchGitHubStars,
        setupSmoothScrolling,
        setupScrollAnimations,
        showNotification
    };
}
/* eslint-enable no-undef */