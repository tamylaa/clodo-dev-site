// Product page script: improved copy-to-clipboard UX and minimal analytics hooks
(function(){
  function showToast(msg){
    let t = document.getElementById('clodo-toast');
    if(!t){
      t = document.createElement('div');
      t.id = 'clodo-toast';
      t.setAttribute('role','status');
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
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard');
      // analytics hook (no-op if analytics not available)
      try{ if(window.analytics && typeof window.analytics.track==='function') window.analytics.track('copy_snippet', {page:'product', snippet: selector||'inline'}); }catch(e){ /* ignore analytics errors */ }
    }catch(err){ showToast('Copy failed — select and press Ctrl+C'); }
  }

  document.addEventListener('click', function(e){
    const btn = e.target.closest && e.target.closest('.copy-btn');
    if(!btn) return;
    copyTextFrom(btn);
  });
})();