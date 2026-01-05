/**
 * Shared Table of Contents Manager Module
 * Handles TOC toggle, active section highlighting, and smooth scrolling
 */

export function initTableOfContents() {
  const tocToggle = document.querySelector('.toc-toggle');
  const tocNav = document.querySelector('.toc-nav');
  const tocLinks = document.querySelectorAll('.toc-link, .toc-sublink');
  const headings = document.querySelectorAll('h1[id], h2[id], h3[id], h4[id]');

  if (!tocLinks.length) {
    console.warn('TOC links not found');
    return;
  }

  // Toggle TOC on mobile
  if (tocToggle && tocNav) {
    tocToggle.addEventListener('click', function() {
      tocNav.classList.toggle('expanded');
      const isExpanded = tocNav.classList.contains('expanded');
      tocToggle.setAttribute('aria-expanded', isExpanded);

      // Rotate arrow icon if present
      const svg = tocToggle.querySelector('svg');
      if (svg) {
        svg.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
      }
    });
  }

  // Update active section highlighting
  function updateActiveSection() {
    const scrollPosition = window.scrollY + 150;

    // Remove active class from all links
    tocLinks.forEach(link => link.classList.remove('active'));

    // Find the current section
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

  // Throttle scroll events
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

  // Smooth scrolling and close mobile TOC
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
        if (window.innerWidth <= 1024 && tocNav) {
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
}
