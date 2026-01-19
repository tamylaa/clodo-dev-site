(function () {
  'use strict';

  function copyText(text, button) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(()=>{
        if (button) { button.textContent = 'Copied'; setTimeout(()=>button.textContent='Copy',2000); }
      });
    }

    // Fallback for older browsers
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      if (button) { button.textContent = 'Copied'; setTimeout(()=>button.textContent='Copy',2000); }
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  function initTOCandCopy() {
    try {
      const content = document.querySelector('main article');
      const toc = document.getElementById('page-toc');
      const list = toc && toc.querySelector('.toc-list');

      if (content && list) {
        // Toggle button behavior for accessibility
        const toggleBtn = toc.querySelector('.toc-toggle');
        if (toggleBtn) {
          // Ensure aria-controls references the list id if present
          if (list.id) toggleBtn.setAttribute('aria-controls', list.id);
          toggleBtn.addEventListener('click', () => {
            const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
            toggleBtn.setAttribute('aria-expanded', String(!expanded));
            list.style.display = expanded ? 'none' : '';
          });
        }

        const nodes = Array.from(content.querySelectorAll('h2, h3'));
        const ul = document.createElement('ul');
        ul.className = 'toc-list generated';
        let lastH2 = null;

        nodes.forEach(h => {
          if (!h.id) {
            h.id = h.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
          }
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = '#' + h.id;
          a.textContent = h.textContent.trim();
          a.addEventListener('click', function (e) {
            e.preventDefault();
            document.getElementById(h.id).scrollIntoView({ behavior: 'smooth', block: 'start' });
            history.replaceState(null, '', '#' + h.id);
          });

          if (h.tagName.toLowerCase() === 'h2') {
            ul.appendChild(li);
            li.appendChild(a);
            lastH2 = li;
          } else {
            let nested = lastH2 && lastH2.querySelector('ul');
            if (!nested) { nested = document.createElement('ul'); lastH2.appendChild(nested); }
            const li2 = document.createElement('li'); li2.appendChild(a); nested.appendChild(li2);
          }
        });

        if (ul.children.length) {
          list.innerHTML = '';
          list.appendChild(ul);
        }

        // Active heading observer
        if ('IntersectionObserver' in window) {
          const links = Array.from(list.querySelectorAll('a'));
          const obs = new IntersectionObserver((entries) => {
            entries.forEach(ent => {
              const id = ent.target.id;
              const link = list.querySelector('a[href="#' + id + '"]');
              if (ent.isIntersecting) {
                links.forEach(l => l.classList.remove('active')); if (link) link.classList.add('active');
              }
            });
          }, { rootMargin: '-40% 0px -40% 0px' });
          nodes.forEach(n => obs.observe(n));
        }
      }

      // copy-to-clipboard for code blocks
      const codeBlocks = document.querySelectorAll('pre > code');
      codeBlocks.forEach(code => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-sm btn-outline code-copy-btn';
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Copy code to clipboard');
        btn.textContent = 'Copy';
        btn.addEventListener('click', async () => {
          try {
            await copyText(code.textContent, btn);
          } catch (e) {
            btn.textContent = 'Copy';
            // keep UX simple: fallback to selecting text
            const ta = document.createElement('textarea');
            ta.value = code.textContent;
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); btn.textContent = 'Copied'; setTimeout(()=>btn.textContent='Copy',2000); } catch (err) { alert('Copy failed'); }
            document.body.removeChild(ta);
          }
        });
        const pre = code.parentNode;
        pre.style.position = 'relative';
        pre.appendChild(btn);
      });

    } catch (e) { console.warn('TOC script failed', e); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTOCandCopy);
  } else {
    initTOCandCopy();
  }
})();