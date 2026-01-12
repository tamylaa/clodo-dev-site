# Product Page Enhancement - Code Examples & Implementation Guide

## Quick Reference: CSS Classes to Add

### Grid System
```css
/* Responsive grid layouts */
.grid-250 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-xl);
}

.grid-3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-2xl);
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: var(--spacing-2xl);
}

@media (max-width: 768px) {
  .grid-250, .grid-3, .grid-2 {
    grid-template-columns: 1fr;
  }
}
```

### Card System
```css
.feature-card {
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
  cursor: pointer;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-color);
}

.feature-card h3 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--text-primary);
  font-size: var(--font-size-lg);
}

.feature-card p {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}
```

### Badge System
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 600;
  background: var(--bg-secondary);
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
}

.badge svg {
  width: 16px;
  height: 16px;
}

.badge.badge--high {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
  color: #dc2626;
}

.badge.badge--featured {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-color-light));
  color: white;
  border-color: var(--primary-color);
}
```

### Animation Classes
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-on-scroll {
  opacity: 0;
  animation: fadeInUp 0.6s ease-out forwards;
}

.animate-on-scroll.animate-in {
  opacity: 1;
}

/* Staggered animation delays */
.animate-on-scroll:nth-child(1) { animation-delay: 0s; }
.animate-on-scroll:nth-child(2) { animation-delay: 0.1s; }
.animate-on-scroll:nth-child(3) { animation-delay: 0.2s; }
.animate-on-scroll:nth-child(4) { animation-delay: 0.3s; }
.animate-on-scroll:nth-child(5) { animation-delay: 0.4s; }
```

### Button System
```css
.btn-framework-primary {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-decoration: none;
}

.btn-framework-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);
  background: var(--primary-color-dark);
}

.btn-framework-primary:active {
  transform: translateY(0);
}

.btn-framework-primary:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.btn-framework-secondary {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-decoration: none;
}

.btn-framework-secondary:hover {
  background: var(--primary-color);
  color: white;
  transform: translateY(-2px);
}
```

### CTA Section
```css
.cta-section {
  padding: var(--spacing-3xl) var(--spacing-xl);
  background: linear-gradient(135deg, var(--primary-color-light), var(--primary-color));
  border-radius: var(--radius-lg);
  text-align: center;
  margin: var(--spacing-2xl) 0;
}

.cta-section h2 {
  color: white;
  margin-top: 0;
}

.cta-section p {
  color: rgba(255, 255, 255, 0.9);
  font-size: var(--font-size-lg);
}

.cta-buttons {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  margin-top: var(--spacing-lg);
  flex-wrap: wrap;
}
```

---

## Quick Reference: JavaScript Functions to Add

### Reading Progress Bar
```javascript
function initReadingProgress() {
    const progressBar = document.querySelector('.progress-bar');
    if (!progressBar) return;

    function updateProgress() {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = window.scrollY;
        const progress = (scrolled / scrollHeight) * 100;
        progressBar.style.width = progress + '%';
    }

    window.addEventListener('scroll', updateProgress);
    updateProgress(); // Initial call
}
```

### Table of Contents with Smooth Scrolling
```javascript
function initTableOfContents() {
    const tocLinks = document.querySelectorAll('nav a[href^="#"]');

    tocLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                const headerOffset = 80; // Account for fixed header
                const elementPosition = targetElement.offsetTop;
                const offsetPosition = elementPosition - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });

                // Update URL
                history.pushState(null, null, `#${targetId}`);
                
                // Highlight active link
                tocLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });

    // Highlight active section on scroll
    window.addEventListener('scroll', () => {
        tocLinks.forEach(link => {
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const rect = targetElement.getBoundingClientRect();
                if (rect.top <= 100 && rect.bottom >= 100) {
                    tocLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            }
        });
    });
}
```

### Scroll-Based Animations
```javascript
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    const animateElements = document.querySelectorAll('.animate-on-scroll');
    animateElements.forEach(element => {
        observer.observe(element);

        // Check if already in viewport
        const rect = element.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        if (rect.top < viewportHeight - 50) {
            element.classList.add('animate-in');
        }
    });

    // Fallback for older browsers
    setTimeout(() => {
        document.querySelectorAll('.animate-on-scroll:not(.animate-in)').forEach(el => {
            el.classList.add('animate-in');
        });
    }, 2000);
}
```

### Animated Counters
```javascript
function initAnimatedCounters() {
    const counters = document.querySelectorAll('[data-animate="counter"]');

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                animateCounter(entry.target);
                entry.target.classList.add('counted');
            }
        });
    }, observerOptions);

    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element) {
    const endValue = parseInt(element.getAttribute('data-end-value'), 10);
    const suffix = element.getAttribute('data-suffix') || '';
    const duration = 1500; // 1.5 seconds

    const startValue = 0;
    const range = endValue - startValue;
    const increment = range / (duration / 16.67); // 60fps
    let currentValue = startValue;

    const interval = setInterval(() => {
        currentValue += increment;
        if (currentValue >= endValue) {
            element.textContent = endValue + suffix;
            clearInterval(interval);
        } else {
            element.textContent = Math.floor(currentValue) + suffix;
        }
    }, 16.67);
}
```

### Feature Card Animations
```javascript
function initFeatureCardAnimations() {
    const featureCards = document.querySelectorAll('.feature-card');

    featureCards.forEach((card, index) => {
        card.classList.add('animate-on-scroll');
        
        // Add staggered delay via inline style
        card.style.animationDelay = `${index * 0.1}s`;

        // Hover effect
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}
```

### Smooth Scrolling for All Anchor Links
```javascript
function initSmoothScrolling() {
    const allLinks = document.querySelectorAll('a[href^="#"]');

    allLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.offsetTop;
                const offsetPosition = elementPosition - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });

                // Update URL
                history.pushState(null, null, this.getAttribute('href'));
            }
        });
    });
}
```

### Analytics Tracking
```javascript
function initAnalyticsTracking() {
    // Section view tracking
    const sections = document.querySelectorAll('section[id]');
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                trackEvent('section_viewed', {
                    section_id: entry.target.id,
                    section_title: entry.target.querySelector('h2, h3')?.textContent || 'unknown'
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));

    // Button click tracking
    document.querySelectorAll('.btn-framework-primary, .btn-framework-secondary').forEach(btn => {
        btn.addEventListener('click', function() {
            trackEvent('button_clicked', {
                button_text: this.textContent.trim(),
                button_class: this.className,
                button_href: this.getAttribute('href')
            });
        });
    });
}

function trackEvent(eventName, eventData) {
    try {
        if (window.analytics && typeof window.analytics.track === 'function') {
            window.analytics.track(eventName, eventData);
        }
    } catch (e) {
        // Silently fail if analytics not available
        console.debug('Analytics not available:', e);
    }
}
```

---

## HTML Structure Examples

### Reading Progress Bar
```html
<div class="reading-progress">
    <div class="progress-bar" id="progress-bar"></div>
</div>
```

### Table of Contents
```html
<nav class="table-of-contents animate-on-scroll" aria-label="Table of Contents">
    <h2>Table of Contents</h2>
    <ul>
        <li><a href="#get-clodo">Get Clodo</a></li>
        <li><a href="#wrangler-automation">Wrangler Automation</a></li>
        <li><a href="#testimonials">Customer Testimonials</a></li>
        <li><a href="#pricing">Pricing</a></li>
        <li><a href="#support">Support</a></li>
        <li><a href="#faq">FAQ</a></li>
    </ul>
</nav>
```

### Article Metadata
```html
<div class="article-metadata" style="display: flex; align-items: center; gap: 1rem; padding: 1.5rem 0; border-bottom: 1px solid var(--border-color); margin-bottom: 2rem;">
    <img src="https://api.gravatar.com/avatar/clodo?s=48&d=identicon" alt="Clodo Team" style="width: 48px; height: 48px; border-radius: 50%;" loading="lazy">
    <div>
        <p style="margin: 0 0 0.25rem 0; font-weight: 600; color: var(--text-primary);">
            <span style="color: var(--primary-color);">Clodo Framework Team</span>
        </p>
        <p style="margin: 0 0 0.25rem 0; font-size: 0.9rem; color: var(--text-secondary);">Expert developers with 10+ years of Cloudflare Workers experience</p>
        <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">
            <time datetime="2026-01-12">Published: January 12, 2026</time>
            <span style="color: var(--border-color);">•</span>
            <span>8 min read</span>
        </p>
    </div>
</div>
```

### Feature Cards Grid
```html
<div class="grid-250">
    <div class="feature-card animate-on-scroll">
        <h3>Enterprise Ready</h3>
        <p>Multi-tenant architecture, advanced security, and production monitoring built-in.</p>
    </div>
    <div class="feature-card animate-on-scroll">
        <h3>Full-Stack Features</h3>
        <p>Database integrations, authentication, API management, and more.</p>
    </div>
    <div class="feature-card animate-on-scroll">
        <h3>Developer Friendly</h3>
        <p>TypeScript-first, zero-config setup, and excellent documentation.</p>
    </div>
</div>
```

### Animated Metric Cards
```html
<div class="metric-card animate-on-scroll" data-animate="counter">
    <div class="metric-number" data-end-value="67" data-suffix="%">0%</div>
    <div class="metric-label">Cost Reduction</div>
</div>
```

### CTA Section
```html
<section class="cta-section animate-on-scroll">
    <h2>Ready to Automate Your Wrangler Deployments?</h2>
    <p>Get started with Clodo Framework today and reduce deployment risk by 67%.</p>
    <div class="cta-buttons">
        <a href="/quick-start" class="btn-framework-primary">
            Get Started Now
        </a>
        <a href="#pricing" class="btn-framework-secondary">
            View Pricing
        </a>
    </div>
</section>
```

---

## Integration Checklist

- [ ] Add reading progress bar HTML & CSS
- [ ] Add table of contents HTML & CSS
- [ ] Add animation keyframes to product.css
- [ ] Add .animate-on-scroll class to relevant sections
- [ ] Add grid and card CSS classes
- [ ] Add button system CSS
- [ ] Add badge system CSS
- [ ] Initialize reading progress in product.js
- [ ] Initialize table of contents in product.js
- [ ] Initialize scroll animations in product.js
- [ ] Initialize feature card animations in product.js
- [ ] Initialize smooth scrolling in product.js
- [ ] Initialize animated counters in product.js
- [ ] Initialize analytics tracking in product.js
- [ ] Test on desktop, tablet, and mobile
- [ ] Validate HTML and CSS
- [ ] Run full build process
- [ ] Check link health
- [ ] Verify no console errors
- [ ] Test animations performance
- [ ] Verify accessibility compliance

---

## Browser Testing Matrix

```
Browser              │ Version │ Animations │ Smooth Scroll │ Observer
─────────────────────┼─────────┼────────────┼───────────────┼──────────
Chrome               │ Latest  │ ✅ Native  │ ✅ Native     │ ✅ Native
Firefox              │ Latest  │ ✅ Native  │ ✅ Native     │ ✅ Native
Safari               │ Latest  │ ✅ Native  │ ✅ Native     │ ✅ Native
Edge                 │ Latest  │ ✅ Native  │ ✅ Native     │ ✅ Native
iOS Safari           │ Latest  │ ✅ Native  │ ✅ Native     │ ✅ Native
Chrome Mobile        │ Latest  │ ✅ Native  │ ✅ Native     │ ✅ Native
IE 11                │ 11      │ ⚠️ Fallback │ ⚠️ Fallback   │ ❌ Polyfill*
```

---

## Performance Tips

1. **Use `will-change` sparingly:**
   ```css
   .feature-card:hover {
       will-change: transform;
       transform: translateY(-8px);
   }
   ```

2. **Debounce scroll events:**
   ```javascript
   function debounce(func, wait) {
       let timeout;
       return function executedFunction(...args) {
           const later = () => {
               clearTimeout(timeout);
               func(...args);
           };
           clearTimeout(timeout);
           timeout = setTimeout(later, wait);
       };
   }
   ```

3. **Use `requestAnimationFrame` for animations:**
   ```javascript
   let animationId;
   function animate() {
       // Update animation
       animationId = requestAnimationFrame(animate);
   }
   animate();
   ```

4. **Lazy load images:**
   ```html
   <img src="image.jpg" loading="lazy" alt="Description">
   ```

---

## Resources & References

- [MDN - IntersectionObserver API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [MDN - CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations)
- [MDN - CSS Transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions)
- [MDN - Smooth Scrolling](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-behavior)
- [Web.dev - Performance](https://web.dev/performance/)
- [WebAIM - WCAG 2.1 Checklist](https://webaim.org/articles/wcag2checklist/)

---

**Last Updated:** January 12, 2026
**Version:** 1.0
**Status:** Ready for Implementation
