// Product page script: improved copy-to-clipboard UX and minimal analytics hooks
(function(){
  function showToast(msg){
    let t = document.getElementById('clodo-toast');
    if(!t){
      t = document.createElement('div');
      t.id = 'clodo-toast';
      t.setAttribute('role','status');
      t.setAttribute('aria-live','polite');
      t.setAttribute('aria-atomic','true');
      t.style.position = 'fixed';
      t.style.right = '1rem';
      t.style.bottom = '1.5rem';
      t.style.background = 'rgba(11,18,32,0.95)';
      t.style.color = '#fff';
      t.style.padding = '0.6rem 1rem';
      t.style.borderRadius = '6px';
      t.style.boxShadow = '0 6px 18px rgba(2,6,23,0.4)';
      t.style.zIndex = 9999;
      t.style.fontSize = '0.95rem';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    setTimeout(()=>{ t.style.opacity = '0'; }, 2200);
  }

  async function copyTextFrom(button){
    try{
      const selector = button.getAttribute('data-copy-target');
      const target = selector ? document.querySelector(selector + ' code') : button.previousElementSibling && button.previousElementSibling.querySelector('code');
      const text = target ? (target.innerText || target.textContent) : null;
      if(!text) throw new Error('Nothing to copy');
      try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers: use textarea + execCommand
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      showToast('Copied to clipboard');
      // Add visual feedback class
      button.classList.add('copied');
      button.textContent = '✓ Copied!';
      setTimeout(() => {
        button.classList.remove('copied');
        button.textContent = 'Copy';
      }, 2000);
      // analytics hook (no-op if analytics not available)
      try{ if(window.analytics && typeof window.analytics.track==='function') window.analytics.track('copy_snippet', {page:'product', snippet: selector||'inline'}); }catch(e){ /* ignore analytics errors */ }
    } catch (err) {
      showToast('Copy failed — select and press Ctrl+C');
    }
    }catch(err){ showToast('Copy failed — select and press Ctrl+C'); }
  }

  document.addEventListener('click', function(e){
    const btn = e.target.closest && e.target.closest('.copy-btn');
    if(!btn) return;
    copyTextFrom(btn);
  });

  // Accessibility: enable captions by default on demo video (if present)
  document.addEventListener('DOMContentLoaded', function(){
    try{
      const vid = document.querySelector('#product-demo video');
      if(vid){
        // Show built-in controls for users and enable the first text track (captions) if available
        vid.controls = true;
        const tracks = vid.textTracks || [];
        if(tracks && tracks.length){
          tracks[0].mode = 'showing';
        }
      }
    }catch(e){/* ignore */}
  });

  // ===== READING PROGRESS BAR =====
  function initReadingProgress(){
    const progressBar = document.getElementById('progress-bar');
    if(!progressBar) return;
    
    function updateProgress(){
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = scrollPercent + '%';
    }
    
    let rafId = null;
    window.addEventListener('scroll', () => {
      if(rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateProgress);
    });
    
    updateProgress();
  }

  // ===== READING TIME & LD-JSON INJECTION =====
  function initReadingTimeAndSchema(){
    try{
      const articleEl = document.querySelector('.product-article');
      if(!articleEl) return;
      const text = articleEl.innerText || articleEl.textContent || '';
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      const minutes = Math.max(1, Math.round(words / 200));

      // Update visible reading time element
      const rtEl = document.querySelector('.reading-time');
      if(rtEl) rtEl.textContent = `${minutes} min read`;

      // Update or insert meta tag for reading time
      let meta = document.querySelector('meta[property="article:reading_time_minutes"]');
      if(!meta){
        meta = document.createElement('meta');
        meta.setAttribute('property','article:reading_time_minutes');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', String(minutes));

      // Update Article LD-JSON if present
      const s = document.getElementById('ldjson--article');
      if(s){
        try{
          const data = JSON.parse(s.textContent || '{}');
          data['article:reading_time_minutes'] = minutes;
          s.textContent = JSON.stringify(data, null, 2);
        }catch(e){ /* ignore malformed JSON */ }
      }
    }catch(e){ /* swallow errors to avoid blocking page */ }
  }

  // ===== TABLE OF CONTENTS FUNCTIONALITY =====
  function initTableOfContents(){
    const tocLinks = document.querySelectorAll('.table-of-contents a[href^="#"]');
    if(tocLinks.length === 0) return;
    
    const sections = {};
    tocLinks.forEach(link => {
      const sectionId = link.getAttribute('href').substring(1);
      const section = document.getElementById(sectionId);
      if(section) sections[sectionId] = section;
    });
    
    // Smooth scroll for TOC links
    tocLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if(href.startsWith('#')) {
          e.preventDefault();
          const targetId = href.substring(1);
          const target = document.getElementById(targetId);
          if(target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Update active state
            tocLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
          }
        }
      });
    });
    
    // Highlight active section on scroll
    if('IntersectionObserver' in window){
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if(entry.isIntersecting){
            tocLinks.forEach(link => {
              if(link.getAttribute('href') === '#' + entry.target.id){
                link.classList.add('active');
              } else {
                link.classList.remove('active');
              }
            });
          }
        });
      }, { threshold: 0.3 });
      
      Object.values(sections).forEach(section => observer.observe(section));
    }
  }

  // ===== SCROLL-BASED ANIMATIONS =====
  function initScrollAnimations(){
    const animateElements = document.querySelectorAll('.animate-on-scroll');
    if(animateElements.length === 0) return;
    
    if('IntersectionObserver' in window){
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if(entry.isIntersecting){
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });
      
      animateElements.forEach(el => observer.observe(el));
    } else {
      // Fallback: show all elements if IntersectionObserver not supported
      animateElements.forEach(el => el.classList.add('animate-in'));
    }
  }

  // ===== FEATURE CARD ANIMATIONS =====
  function initFeatureCardAnimations(){
    const cards = document.querySelectorAll('.feature-card');
    if(cards.length === 0 || !('IntersectionObserver' in window)) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if(entry.isIntersecting){
          setTimeout(() => {
            entry.target.classList.add('animate-in');
          }, index * 100);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    
    cards.forEach(card => {
      card.style.opacity = '0';
      observer.observe(card);
    });
  }

  // ===== SMOOTH SCROLLING FOR ANCHOR LINKS =====
  function initSmoothScrolling(){
    document.addEventListener('click', function(e){
      const link = e.target.closest('a[href^="#"]');
      if(!link || link.classList.contains('table-of-contents')) return;
      
      const href = link.getAttribute('href');
      if(href === '#') return;
      
      const targetId = href.substring(1);
      const target = document.getElementById(targetId);
      
      if(target){
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Push state to history (for better UX)
        if(history.pushState){
          history.pushState(null, null, href);
        }
      }
    });
  }

  // ===== ANIMATED COUNTERS =====
  function initAnimatedCounters(){
    const counters = document.querySelectorAll('[data-end-value]');
    if(counters.length === 0 || !('IntersectionObserver' in window)) return;
    
    function animateCounterValue(el, endValue, suffix, decimals, duration){
      const startTime = Date.now();
      el.classList.add('animated');
      
      function animateCounter(){
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function: ease-out cubic
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = endValue * easeProgress;
        
        el.textContent = currentValue.toFixed(decimals) + suffix;
        
        if(progress < 1){
          requestAnimationFrame(animateCounter);
        }
      }
      
      animateCounter();
    }
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          const el = entry.target;
          const endValue = parseFloat(el.getAttribute('data-end-value'));
          const suffix = el.getAttribute('data-suffix') || '';
          const decimals = parseInt(el.getAttribute('data-decimals') || '0');
          const duration = 1500; // 1.5 seconds
          
          animateCounterValue(el, endValue, suffix, decimals, duration);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.3 });
    
    counters.forEach(counter => observer.observe(counter));
  }

  function initTestimonialAnimations(){
    const testimonials = document.querySelectorAll('.case-study-card, .testimonial-card');
    if(!testimonials.length) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.style.opacity = '1';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    
    testimonials.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.animationDelay = `${index * 0.1}s`;
      observer.observe(card);
    });
  }

  function initArchitectureDiagram(){
    const svg = document.querySelector('.architecture svg');
    if(!svg) return;
    
    const rects = svg.querySelectorAll('rect');
    const labels = [
      { index: 0, label: 'Developer - Write & test code locally', description: 'Your machine - IDE, git, local testing' },
      { index: 1, label: 'CI & Validation - Automate checks', description: 'Run tests, linting, schema validation' },
      { index: 2, label: 'Orchestrator - WranglerDeployer', description: 'Coordinate deploy and migration workflow' },
      { index: 3, label: 'Cloudflare - Deploy live', description: 'Workers + D1 database live in production' }
    ];
    
    rects.forEach((rect, i) => {
      const label = labels[i];
      if(!label) return;
      
      rect.style.cursor = 'pointer';
      rect.addEventListener('mouseenter', () => {
        showToast(`${label.label}`);
        rect.style.opacity = '0.8';
      });
      
      rect.addEventListener('mouseleave', () => {
        rect.style.opacity = '1';
      });
    });
  }

  function initAnalyticsTracking(){
    // Track all elements with data-analytics-event attributes
    const trackableElements = document.querySelectorAll('[data-analytics-event]');
    
    trackableElements.forEach(element => {
      element.addEventListener('click', function(e){
        const event = this.getAttribute('data-analytics-event');
        const category = this.getAttribute('data-event-category');
        const label = this.getAttribute('data-event-label');
        
        // Send to analytics if available
        if(window.gtag){
          window.gtag('event', event, {
            event_category: category,
            event_label: label,
            timestamp: new Date().toISOString()
          });
        }
        
        // Fallback: log to console for debugging
        console.log('[Analytics]', { event, category, label });
      });
    });
  }

  function initPerformanceMonitoring(){
    // Monitor Core Web Vitals (LCP, FID, CLS)
    
    // Largest Contentful Paint (LCP)
    if('PerformanceObserver' in window){
      try{
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          if(window.gtag){
            window.gtag('event', 'page_view', {
              metric_name: 'LCP',
              metric_value: Math.round(lastEntry.renderTime || lastEntry.loadTime),
              metric_unit: 'milliseconds'
            });
          }
          
          console.log('[Performance] LCP:', Math.round(lastEntry.renderTime || lastEntry.loadTime), 'ms');
        });
        
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch(e) {
        console.warn('[Performance] LCP monitoring not available');
      }
      
      // Cumulative Layout Shift (CLS)
      try{
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
          for(const entry of entryList.getEntries()){
            if(!entry.hadRecentInput){
              clsValue += entry.value;
            }
          }
          
          if(window.gtag){
            window.gtag('event', 'page_view', {
              metric_name: 'CLS',
              metric_value: Math.round(clsValue * 100) / 100,
              metric_unit: 'score'
            });
          }
          
          console.log('[Performance] CLS:', Math.round(clsValue * 100) / 100);
        });
        
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch(e) {
        console.warn('[Performance] CLS monitoring not available');
      }
      
      // First Input Delay (FID) - note: modern browsers prefer INP
      try{
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const firstInput = entries[0];
          
          if(window.gtag){
            window.gtag('event', 'page_view', {
              metric_name: 'FID',
              metric_value: Math.round(firstInput.processingDuration),
              metric_unit: 'milliseconds'
            });
          }
          
          console.log('[Performance] FID:', Math.round(firstInput.processingDuration), 'ms');
        });
        
        fidObserver.observe({ type: 'first-input', buffered: true });
      } catch(e) {
        console.warn('[Performance] FID monitoring not available');
      }
    }
  }

  // Initialize all features when DOM is ready
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){
      initReadingProgress();
      initReadingTimeAndSchema();
      initTableOfContents();
      initScrollAnimations();
      initFeatureCardAnimations();
      initSmoothScrolling();
      initAnimatedCounters();
      initTestimonialAnimations();
      initArchitectureDiagram();
      initAnalyticsTracking();
      initPerformanceMonitoring();
    });
  } else {
    initReadingProgress();
    initReadingTimeAndSchema();
    initTableOfContents();
    initScrollAnimations();
    initFeatureCardAnimations();
    initSmoothScrolling();
    initAnimatedCounters();
    initTestimonialAnimations();
    initArchitectureDiagram();
    initAnalyticsTracking();
    initPerformanceMonitoring();
  }

})();