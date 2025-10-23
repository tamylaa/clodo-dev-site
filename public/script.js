// Enhanced JavaScript for clodo.dev
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Fetch GitHub stars count
        fetchGitHubStars();

        // Handle contact form submission
        setupContactForm();

        // Smooth scrolling for anchor links
        setupSmoothScrolling();

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

async function fetchGitHubStars() {
    const starElements = document.querySelectorAll('#star-count, #github-stars');

    try {
        // Add loading state
        starElements.forEach(element => {
            element.setAttribute('aria-live', 'polite');
            element.textContent = '...';
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
                element.textContent = formattedCount;
            });
        } else {
            throw new Error('Invalid star count data');
        }
    } catch (error) {
        console.warn('Could not fetch GitHub stars:', error.message);
        // Fallback to cached or default value
        const fallbackValue = localStorage.getItem('github-stars-cache') || '0';
        starElements.forEach(element => {
            element.textContent = fallbackValue;
        });

        // Cache the fallback for future use
        if (fallbackValue !== '0') {
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

function setupScrollAnimations() {
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
    notification.className = `notification notification-${type}`;
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

// Navbar scroll effect with throttling
let lastScrollTop = 0;
let scrollThrottleTimer = null;

function handleScroll() {
    const navbar = document.querySelector('.navbar');
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop && scrollTop > 100) {
        // Scrolling down
        navbar.style.transform = 'translateY(-100%)';
    } else {
        // Scrolling up
        navbar.style.transform = 'translateY(0)';
    }

    // Add background blur on scroll
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
    if (!scrollThrottleTimer) {
        scrollThrottleTimer = setTimeout(() => {
            handleScroll();
            scrollThrottleTimer = null;
        }, 16); // ~60fps
    }
});

// Performance optimization: Lazy load images (if any)
// Add any performance monitoring or analytics here

// Handle mobile menu (placeholder for future implementation)
function setupMobileMenu() {
    // This would implement a hamburger menu for mobile
    // For now, the menu is hidden on mobile per CSS
}