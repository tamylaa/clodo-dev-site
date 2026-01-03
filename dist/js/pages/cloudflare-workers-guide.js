// Cloudflare Workers Guide - Interactive Features
// Handles table of contents, copy-to-clipboard, progress bar, and social sharing

document.addEventListener('DOMContentLoaded', function() {
    // Table of Contents Toggle for Mobile
    const tocToggle = document.querySelector('.toc-toggle');
    const tocNav = document.querySelector('.toc-nav');

    if (tocToggle && tocNav) {
        tocToggle.addEventListener('click', function() {
            tocNav.classList.toggle('expanded');
            const isExpanded = tocNav.classList.contains('expanded');
            tocToggle.setAttribute('aria-expanded', isExpanded);

            // Rotate arrow icon
            const svg = tocToggle.querySelector('svg');
            if (svg) {
                svg.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
            }
        });
    }

    // Copy to Clipboard Functionality
    const copyButtons = document.querySelectorAll('.copy-button');

    copyButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const code = this.getAttribute('data-code');

            try {
                await navigator.clipboard.writeText(code);

                // Visual feedback
                const originalText = this.innerHTML;
                this.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>Copied!';
                this.classList.add('copied');

                // Reset after 2 seconds
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.classList.remove('copied');
                }, 2000);

            } catch (err) {
                console.error('Failed to copy code:', err);
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = code;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);

                // Visual feedback for fallback
                const originalText = this.innerHTML;
                this.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>Copied!';
                this.classList.add('copied');

                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.classList.remove('copied');
                }, 2000);
            }
        });
    });

    // Active Section Highlighting in Table of Contents
    const tocLinks = document.querySelectorAll('.toc-link, .toc-sublink');
    const headings = document.querySelectorAll('h1[id], h2[id], h3[id], h4[id]');

    function updateActiveSection() {
        const scrollPosition = window.scrollY + 150; // Increased offset for better detection

        // Remove active class from all links
        tocLinks.forEach(link => link.classList.remove('active'));

        // Find the current section - start from the bottom and work up
        let currentSection = null;
        for (let i = headings.length - 1; i >= 0; i--) {
            const heading = headings[i];
            if (heading.offsetTop <= scrollPosition) {
                currentSection = heading;
                break;
            }
        }

        if (currentSection) {
            const targetLink = document.querySelector(`a[href="#${currentSection.id}"]`);
            if (targetLink) {
                targetLink.classList.add('active');

                // Also highlight parent if it's a sublink
                const parentLi = targetLink.closest('.toc-item');
                if (parentLi && targetLink.classList.contains('toc-sublink')) {
                    const parentLink = parentLi.querySelector('.toc-link');
                    if (parentLink) {
                        parentLink.classList.add('active');
                    }
                }
            }
        }
    }

    // Throttle scroll events for better performance
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        if (!scrollTimeout) {
            scrollTimeout = setTimeout(function() {
                updateActiveSection();
                scrollTimeout = null;
            }, 50);
        }
    });

    // Initial call
    updateActiveSection();

    // Smooth scrolling for TOC links
    tocLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                // Calculate header offset dynamically
                const header = document.querySelector('header') || document.querySelector('nav');
                const headerOffset = header ? header.offsetHeight + 20 : 100;

                const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
                const offsetPosition = elementPosition - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });

                // Update URL without triggering scroll
                history.pushState(null, null, `#${targetId}`);

                // Close mobile TOC if open
                if (window.innerWidth <= 1024) {
                    tocNav.classList.remove('expanded');
                    if (tocToggle) {
                        tocToggle.setAttribute('aria-expanded', 'false');
                        const svg = tocToggle.querySelector('svg');
                        if (svg) {
                            svg.style.transform = 'rotate(0deg)';
                        }
                    }
                }
            }
        });
    });

    // Reading Progress Bar
    const progressBar = document.getElementById('progressBar');

    function updateProgressBar() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;

        if (progressBar) {
            progressBar.style.width = Math.min(scrollPercent, 100) + '%';
        }
    }

    // Throttle scroll events
    let progressTimeout;
    window.addEventListener('scroll', function() {
        if (!progressTimeout) {
            progressTimeout = setTimeout(function() {
                updateProgressBar();
                progressTimeout = null;
            }, 16); // ~60fps
        }
    });

    // Initial call
    updateProgressBar();

    // Social Sharing Functionality
    const shareButtons = document.querySelectorAll('.share-btn');

    shareButtons.forEach(button => {
        button.addEventListener('click', function() {
            const url = this.getAttribute('data-url');

            if (this.classList.contains('twitter-share')) {
                const text = this.getAttribute('data-text');
                const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
                window.open(twitterUrl, '_blank', 'width=600,height=400');

            } else if (this.classList.contains('linkedin-share')) {
                const title = this.getAttribute('data-title');
                const summary = this.getAttribute('data-summary');
                const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(summary)}`;
                window.open(linkedinUrl, '_blank', 'width=600,height=600');

            } else if (this.classList.contains('copy-link')) {
                navigator.clipboard.writeText(url).then(() => {
                    // Visual feedback
                    const originalText = this.innerHTML;
                    this.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>Copied!';

                    setTimeout(() => {
                        this.innerHTML = originalText;
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy URL:', err);
                    // Fallback
                    const textArea = document.createElement('textarea');
                    textArea.value = url;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);

                    const originalText = this.innerHTML;
                    this.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>Copied!';

                    setTimeout(() => {
                        this.innerHTML = originalText;
                    }, 2000);
                });
            }
        });
    });
});