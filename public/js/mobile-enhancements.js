/**
 * Mobile UX Enhancements for Clodo Framework
 * ==========================================
 *
 * This script provides mobile-specific UX improvements:
 * - Touch gesture handling
 * - Mobile navigation enhancements
 * - Touch-friendly interactions
 * - Mobile performance optimizations
 * - Swipe gestures for navigation
 */

(function() {
    'use strict';

    // Mobile detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                    (window.innerWidth <= 768 && window.innerHeight <= 1024);

    if (!isMobile) return; // Exit if not mobile

    // Touch gesture handling
    class TouchHandler {
        constructor(element, options = {}) {
            this.element = element;
            this.options = {
                swipeThreshold: 50,
                tapThreshold: 150,
                ...options
            };

            this.touchStartX = null;
            this.touchStartY = null;
            this.touchStartTime = null;
            this.isTracking = false;

            this.bindEvents();
        }

        bindEvents() {
            this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
            this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
            this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        }

        handleTouchStart(e) {
            const touch = e.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
            this.touchStartTime = Date.now();
            this.isTracking = true;
        }

        handleTouchMove(e) {
            if (!this.isTracking) return;

            const touch = e.touches[0];
            const deltaX = touch.clientX - this.touchStartX;
            const deltaY = touch.clientY - this.touchStartY;

            // Prevent scrolling if it's a horizontal swipe
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
                e.preventDefault();
            }
        }

        handleTouchEnd(e) {
            if (!this.isTracking) return;

            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - this.touchStartX;
            const deltaY = touch.clientY - this.touchStartY;
            const deltaTime = Date.now() - this.touchStartTime;

            this.isTracking = false;

            // Detect swipe
            if (deltaTime < this.options.tapThreshold) {
                if (Math.abs(deltaX) > this.options.swipeThreshold) {
                    const direction = deltaX > 0 ? 'right' : 'left';
                    this.onSwipe(direction, Math.abs(deltaX));
                } else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
                    this.onTap();
                }
            }
        }

        onSwipe(direction, distance) {
            // Override in subclasses
        }

        onTap() {
            // Override in subclasses
        }
    }

    // Mobile navigation enhancements
    class MobileNavigation {
        constructor() {
            this.menuToggle = document.getElementById('mobile-menu-toggle');
            this.menu = document.getElementById('mobile-menu');
            this.overlay = null;

            if (this.menuToggle && this.menu) {
                this.init();
            }
        }

        init() {
            // Create overlay for better UX
            this.overlay = document.createElement('div');
            this.overlay.className = 'mobile-menu-overlay';
            this.overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 999;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
            `;
            document.body.appendChild(this.overlay);

            // Enhanced toggle functionality
            this.menuToggle.addEventListener('click', this.toggleMenu.bind(this));
            this.overlay.addEventListener('click', this.closeMenu.bind(this));

            // Close menu on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isMenuOpen()) {
                    this.closeMenu();
                }
            });

            // Close menu when clicking on links
            this.menu.addEventListener('click', (e) => {
                if (e.target.tagName === 'A') {
                    this.closeMenu();
                }
            });

            // Touch handler for swipe to close
            new TouchHandler(this.menu, {
                onSwipe: (direction) => {
                    if (direction === 'left') {
                        this.closeMenu();
                    }
                }
            });
        }

        toggleMenu() {
            if (this.isMenuOpen()) {
                this.closeMenu();
            } else {
                this.openMenu();
            }
        }

        openMenu() {
            this.menu.setAttribute('data-visible', 'true');
            this.menuToggle.setAttribute('aria-expanded', 'true');
            this.overlay.style.opacity = '1';
            this.overlay.style.visibility = 'visible';
            document.body.style.overflow = 'hidden';

            // Focus management
            const firstLink = this.menu.querySelector('a');
            if (firstLink) {
                firstLink.focus();
            }
        }

        closeMenu() {
            this.menu.setAttribute('data-visible', 'false');
            this.menuToggle.setAttribute('aria-expanded', 'false');
            this.overlay.style.opacity = '0';
            this.overlay.style.visibility = 'hidden';
            document.body.style.overflow = '';

            // Return focus to toggle
            this.menuToggle.focus();
        }

        isMenuOpen() {
            return this.menu.getAttribute('data-visible') === 'true';
        }
    }

    // Touch-friendly button enhancements
    class TouchButton {
        constructor(button) {
            this.button = button;
            this.init();
        }

        init() {
            // Add touch feedback
            this.button.addEventListener('touchstart', () => {
                this.button.style.transform = 'scale(0.98)';
            }, { passive: true });

            this.button.addEventListener('touchend', () => {
                this.button.style.transform = '';
            }, { passive: true });

            this.button.addEventListener('touchcancel', () => {
                this.button.style.transform = '';
            }, { passive: true });
        }
    }

    // Mobile scrolling optimizations
    class MobileScroll {
        constructor() {
            this.init();
        }

        init() {
            // Improve scroll performance on mobile
            let scrollTimer;
            window.addEventListener('scroll', () => {
                clearTimeout(scrollTimer);
                document.body.classList.add('scrolling');

                scrollTimer = setTimeout(() => {
                    document.body.classList.remove('scrolling');
                }, 100);
            }, { passive: true });

            // Add momentum scrolling CSS
            const style = document.createElement('style');
            style.textContent = `
                .scrolling * {
                    pointer-events: none;
                }
                .scrolling a,
                .scrolling button {
                    pointer-events: auto;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Viewport height fix for mobile browsers
    class ViewportFix {
        constructor() {
            this.init();
        }

        init() {
            // Fix for mobile viewport height issues
            const setVH = () => {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
            };

            setVH();
            window.addEventListener('resize', setVH);
            window.addEventListener('orientationchange', () => {
                setTimeout(setVH, 100);
            });
        }
    }

    // Initialize mobile enhancements
    document.addEventListener('DOMContentLoaded', () => {
        // Initialize mobile navigation
        new MobileNavigation();

        // Initialize touch buttons
        document.querySelectorAll('.touch-target, button, .nav-link, .github-btn').forEach(button => {
            new TouchButton(button);
        });

        // Initialize scroll optimizations
        new MobileScroll();

        // Initialize viewport fix
        new ViewportFix();

        // Add mobile-specific CSS class
        document.documentElement.classList.add('mobile-enhanced');

        // Performance monitoring for mobile
        if ('PerformanceObserver' in window) {
            try {
                new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        if (entry.entryType === 'layout-shift' && entry.value > 0.1) {
                            console.warn('Mobile layout shift detected:', entry);
                        }
                    });
                }).observe({ entryTypes: ['layout-shift'] });
            } catch (e) {
                // Ignore if not supported
            }
        }
    });

    // Export for potential use in other scripts
    window.MobileUX = {
        TouchHandler,
        MobileNavigation,
        TouchButton,
        MobileScroll,
        ViewportFix
    };

})();