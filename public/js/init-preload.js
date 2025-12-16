// Finds preload links for styles and converts them to stylesheet after load.
// This avoids inline onload handlers which are blocked by strict CSP.
(function () {
  try {
    const links = document.querySelectorAll('link[rel="preload"][as="style"]');
    if (!links || links.length === 0) return;

    links.forEach((ln) => {
      // When the preload resource finishes loading, set it to stylesheet
      ln.addEventListener('load', function () {
        try {
          this.rel = 'stylesheet';
        } catch (e) {
          // ignore
        }
      });

      // Fallback: if already loaded, ensure it's applied
      if (ln.sheet || ln.getAttribute('data-applied') === '1') {
        ln.rel = 'stylesheet';
      }

      // Some browsers may not fire load for preload; create a fallback timer
      setTimeout(() => {
        if (!(ln.sheet || ln.rel === 'stylesheet')) {
          const href = ln.getAttribute('href');
          if (href) {
            const el = document.createElement('link');
            el.rel = 'stylesheet';
            el.href = href;
            document.head.appendChild(el);
            ln.setAttribute('data-applied', '1');
          }
        }
      }, 2500);
    });
  } catch (e) {
    // graceful
  }
})();
