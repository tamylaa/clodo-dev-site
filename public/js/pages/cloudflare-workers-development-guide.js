// Cloudflare Workers Development Guide Interactive Features
document.addEventListener('DOMContentLoaded', function() {
    // Filter functionality for comparison table
    const filterButtons = document.querySelectorAll('.filter-btn');
    const tableRows = document.querySelectorAll('.platform-row');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');

            const filterValue = button.getAttribute('data-filter');

            tableRows.forEach(row => {
                if (filterValue === 'all' || row.getAttribute('data-category').includes(filterValue)) {
                    row.style.display = '';
                    row.style.animation = 'fadeIn 0.3s ease-out';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    });

    // Counter animation for metrics
    const counterElements = document.querySelectorAll('[data-animate="counter"]');

    const animateCounter = function(element) {
        const target = parseInt(element.getAttribute('data-target'));
        const suffix = element.getAttribute('data-suffix') || '';
        const duration = 2000; // 2 seconds
        const step = target / (duration / 16); // 60fps
        let current = 0;

        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current) + suffix;
        }, 16);
    };

    // Intersection Observer for counter animation
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counters = entry.target.querySelectorAll('[data-animate="counter"] .metric-value');
                counters.forEach(counter => {
                    if (!counter.hasAttribute('data-animated')) {
                        counter.setAttribute('data-animated', 'true');
                        animateCounter(counter);
                    }
                });
            }
        });
    }, observerOptions);

    // Observe metrics dashboard
    const metricsDashboard = document.querySelector('.metrics-dashboard');
    if (metricsDashboard) {
        observer.observe(metricsDashboard);
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add hover effects for code examples
    const codeExamples = document.querySelectorAll('.code-example');
    codeExamples.forEach(example => {
        example.addEventListener('mouseenter', () => {
            example.style.transform = 'translateY(-2px)';
            example.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
        });

        example.addEventListener('mouseleave', () => {
            example.style.transform = 'translateY(0)';
            example.style.boxShadow = 'none';
        });
    });

    // Table of contents active state tracking
    const tocLinks = document.querySelectorAll('.table-of-contents a');
    const sections = document.querySelectorAll('section[id]');

    const updateActiveTocLink = function() {
        const scrollPosition = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                tocLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    };

    window.addEventListener('scroll', updateActiveTocLink);
    updateActiveTocLink(); // Initial call

    // Add active class styles for TOC
    const style = document.createElement('style');
    style.textContent = `
        .table-of-contents a.active {
            color: #6366f1;
            font-weight: 700;
        }
    `;
    document.head.appendChild(style);

    // FAQ accordion functionality
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('h3');
        const answer = item.querySelector('div[itemprop="acceptedAnswer"]');

        if (answer) {
            answer.style.display = 'block'; // Keep answers visible by default
        }

        question.addEventListener('click', () => {
            // Simple toggle for demonstration
            if (answer.style.maxHeight) {
                answer.style.maxHeight = null;
            } else {
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });

    // Add loading animation for filter transitions
    const originalDisplay = {};
    tableRows.forEach(row => {
        originalDisplay[row] = row.style.display;
    });

    // Reading Progress Bar
    const updateProgress = function() {
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            progressBar.style.width = scrolled + '%';
        }
    };
    
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        window.addEventListener('scroll', updateProgress, { passive: true });
        updateProgress(); // Initialize
    }

    // Performance optimization: Debounce scroll events
    let scrollTimeout;
    const debouncedScroll = function() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(updateActiveTocLink, 10);
    };

    window.addEventListener('scroll', debouncedScroll, { passive: true });
    updateActiveTocLink(); // Initialize
});