// Finds preload links for styles and converts them to stylesheet (apply quickly to avoid FOUC).
// This avoids inline onload handlers which are blocked by strict CSP but applies styles eagerly to reduce layout shift.
(function () {
  try {
    const links = document.querySelectorAll('link[rel="preload"][as="style"]');
    if (!links || links.length === 0) return;

    // If an asset manifest is present, rewrite preload hrefs to hashed filenames before applying them
    let manifest = (window && window.__assetManifest__) ? window.__assetManifest__ : null;
    let manifestPresent = manifest && Object.keys(manifest).length > 0;

    // If the inline manifest is missing after deploy transformations, attempt a fast fetch of a persisted JSON manifest
    if(!manifestPresent){
      try{
        console.error('[init-preload] WARNING: asset manifest missing or empty. Attempting to fetch /asset-manifest.json as fallback.');
        fetch('/asset-manifest.json', { method: 'GET', cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(data => {
          if (data && Object.keys(data).length) {
            manifest = data;
            manifestPresent = true;
            console.log('[init-preload] Fetched asset manifest fallback from /asset-manifest.json');

            // apply manifest mapping now for any remaining preloads
            try {
              document.querySelectorAll('link[rel="preload"][as="style"]').forEach(ln => {
                try {
                  const href = ln.getAttribute('href');
                  if (href) {
                    const key = href.replace(/^\//, '');
                    if (manifest[key]) ln.setAttribute('href', '/' + manifest[key]);
                  }
                } catch (e) { console.debug('[init-preload] mapping on fallback failed', e); }
              });
            } catch (e) { console.debug('[init-preload] failed to apply fetched manifest', e); }
          }
        }).catch(err => console.debug('[init-preload] error fetching /asset-manifest.json', err));
      }catch(e){ console.debug('[init-preload] failed to log manifest warning', e); }
    }

    links.forEach((ln) => {
      try {
        const href = ln.getAttribute('href');
        if (href && manifestPresent) {
          const key = href.replace(/^\//, '');
          if (manifest[key]) {
            ln.setAttribute('href', '/' + manifest[key]);
          }
        }
      } catch (e) {
        console.debug('[init-preload] mapping failure', e);
      }

      // Try to apply stylesheet immediately so nav/breadcrumb styles take effect ASAP
      try {
        ln.rel = 'stylesheet';
        // Add css-ready class so transitions are re-enabled when CSS is present
        document.documentElement.classList.add('css-ready');
      } catch (e) {
        console.debug('[init-preload] failed to set rel=stylesheet early', e);
      }

      // When the preload resource finishes loading, ensure it's stylesheet
      ln.addEventListener('load', function () {
        try {
          this.rel = 'stylesheet';
          document.documentElement.classList.add('css-ready');
        } catch (e) {
          console.debug('[init-preload] load handler failed to set rel', e);
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
            try {
              // Try a short fetch to confirm resource exists before appending (best-effort)
              fetch(href, { method: 'GET', cache: 'no-store' }).then(r => {
                if (r && (r.status === 200 || r.status === 0)) {
                  const el = document.createElement('link');
                  el.rel = 'stylesheet';
                  el.href = href;
                  el.addEventListener('load', () => document.documentElement.classList.add('css-ready'));
                  document.head.appendChild(el);
                  ln.setAttribute('data-applied', '1');
                } else {
                  // As a last resort, append anyway to avoid missing critical styles
                  const el = document.createElement('link');
                  el.rel = 'stylesheet';
                  el.href = href;
                  el.addEventListener('load', () => document.documentElement.classList.add('css-ready'));
                  document.head.appendChild(el);
                  ln.setAttribute('data-applied', '1');
                  try{ console.warn('[init-preload] Fallback appended stylesheet (resource returned non-200) for', href);}catch(e){ console.debug('[init-preload] failed to log fallback non-200 warning', e); }
                }
              }).catch(() => {
                // network or CORS issue — still append to minimize FOUC
                const el = document.createElement('link');
                el.rel = 'stylesheet';
                el.href = href;
                el.addEventListener('load', () => document.documentElement.classList.add('css-ready'));
                document.head.appendChild(el);
                ln.setAttribute('data-applied', '1');
                try{ console.warn('[init-preload] Fallback appended stylesheet after fetch failure for', href);}catch(e){ console.debug('[init-preload] failed to log fallback fetch failure warning', e); }
              });
            } catch (e) {
              const el = document.createElement('link');
              el.rel = 'stylesheet';
              el.href = href;
              el.addEventListener('load', () => document.documentElement.classList.add('css-ready'));
              document.head.appendChild(el);
              ln.setAttribute('data-applied', '1');
            }
          }
        }
      }, 200);
    });
  } catch (e) {
    console.warn('[init-preload] Unexpected error in init-preload script', e);
  }
})();
