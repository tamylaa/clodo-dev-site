// Finds preload links for styles and converts them to stylesheet (apply quickly to avoid FOUC).
// This avoids inline onload handlers which are blocked by strict CSP but applies styles eagerly to reduce layout shift.
(function () {
  try {
    const links = document.querySelectorAll('link[rel="preload"][as="style"]');
    if (!links || links.length === 0) return;

    links.forEach((ln) => {
      // Try to apply stylesheet immediately so nav/breadcrumb styles take effect ASAP
      try {
        ln.rel = 'stylesheet';
        // Add css-ready class so transitions are re-enabled when CSS is present
        document.documentElement.classList.add('css-ready');
      } catch (e) {
        // ignore
      }

      // When the preload resource finishes loading, ensure it's stylesheet
      ln.addEventListener('load', function () {
        try {
          this.rel = 'stylesheet';
          document.documentElement.classList.add('css-ready');
        } catch (e) {
          // ignore
        }
      });

      // Fallback: if already loaded, ensure it's applied
      if (ln.sheet || ln.getAttribute('data-applied') === '1' || ln.rel === 'stylesheet') {
        ln.rel = 'stylesheet';
        document.documentElement.classList.add('css-ready');
      }

      // Some browsers may not fire load for preload; create a short fallback timer
      setTimeout(() => {
        if (!(ln.sheet || ln.rel === 'stylesheet')) {
          const href = ln.getAttribute('href');
          if (href) {
            const el = document.createElement('link');
            el.rel = 'stylesheet';
            el.href = href;
            el.addEventListener('load', () => document.documentElement.classList.add('css-ready'));
            document.head.appendChild(el);
            ln.setAttribute('data-applied', '1');
          }
        }
      }, 500);
    });
  } catch (e) {
    // graceful
  }
})();
