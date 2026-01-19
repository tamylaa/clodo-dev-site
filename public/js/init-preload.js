// Finds preload links for styles and converts them to stylesheet (apply quickly to avoid FOUC).
// This avoids inline onload handlers which are blocked by strict CSP but applies styles eagerly to reduce layout shift.
(function () {

    // Helper: map asset href/src to hashed asset using manifest keys (reused by styles & scripts)
    function mapAssetHref(href) {
      if (!href || !window.__assetManifest__ && typeof window.__assetManifest__ === 'undefined') return null;
      // Use the live manifest reference if present
      const manifestRef = (window && window.__assetManifest__) ? window.__assetManifest__ : null;
      if (!manifestRef) return null;
      const key = href.replace(/^\//, '');
      // Direct key match
      if (manifestRef[key]) return '/' + manifestRef[key];
      // Basename match
      const basename = key.split('/').pop();
      if (manifestRef[basename]) return '/' + manifestRef[basename];
      // Common transform: pages -> top-level js
      if (key.includes('js/pages/')) {
        const alt = key.replace('js/pages/', 'js/');
        if (manifestRef[alt]) return '/' + manifestRef[alt];
      }
      // Fallback: any manifest key that ends with the key or basename
      for (const mk in manifestRef) {
        if (mk.endsWith(key) || mk.endsWith(basename)) return '/' + manifestRef[mk];
      }
      return null;
    }

  try {
    const links = document.querySelectorAll('link[rel="preload"][as="style"]');
    if (!links || links.length === 0) return;

    // If an asset manifest is present, rewrite preload hrefs to hashed filenames before applying them
    let manifest = (window && window.__assetManifest__) ? window.__assetManifest__ : null;
    let manifestPresent = manifest && Object.keys(manifest).length > 0;
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
                    const mapped = mapAssetHref(href);
                    if (mapped) ln.setAttribute('href', mapped);
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
          const mapped = mapAssetHref(href);
          if (mapped) {
            ln.setAttribute('href', mapped);
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

    // Map script src attributes to hashed assets using asset manifest (prevents 404s for pages referencing un-hashed paths)
    try {
      if (manifestPresent) {
        const scripts = document.querySelectorAll('script[src]:not([data-asset-mapped])');
        scripts.forEach((s) => {
          try {
            const src = s.getAttribute('src');
            if (!src) return;
            // Skip if already appears hashed
            if (/\.[0-9a-f]{6,}\./.test(src)) return;
            const mapped = mapAssetHref(src);
            if (mapped) {
              s.setAttribute('src', mapped);
              s.setAttribute('data-asset-mapped', '1');
              console.log('[init-preload] mapped script', src, '->', mapped);
            }
          } catch (e) { console.debug('[init-preload] script mapping failure', e); }
        });
      }
    } catch (e) {
      console.debug('[init-preload] script mapping top-level error', e);
    }

  } catch (e) {
    console.warn('[init-preload] Unexpected error in init-preload script', e);
  }
})();
