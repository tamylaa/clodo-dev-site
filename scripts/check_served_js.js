(async ()=>{
  const pw = await import('playwright');
  const chromium = pw.chromium;
  const fs = await import('fs');
  const path = await import('path');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8000', { waitUntil: 'networkidle' });
  const scripts = await page.$$eval('script[src]', s => s.map(x => ({ src: x.src, type: x.type })));
  console.log('Scripts found:', scripts.length);
  for (const s of scripts) {
    if (!s.src.includes('/js/')) continue;
    try {
      const res = await page.evaluate(async (u) => {
        const r = await fetch(u, { cache: 'no-store' });
        const t = await r.text();
        return { status: r.status, len: t.length, first: t.slice(0, 80), last: t.slice(-80) };
      }, s.src);
      console.log('\n--', s.src);
      console.log('type:', s.type);
      console.log('status:', res.status, 'len:', res.len);
      console.log('first:', res.first);
      console.log('last :', res.last);
      // compare with disk file if exists
      try {
        let localPath;
        try {
          localPath = new URL(s.src).pathname;
        } catch (err) {
          // Fallback for odd src values
          localPath = s.src.replace(/^https?:\/\//, '');
        }
        localPath = path.join(process.cwd(), 'dist', localPath.replace(/^\//, ''));
        if (fs.existsSync(localPath)) {
          const buf = fs.readFileSync(localPath, 'utf8');
          console.log('disk len:', buf.length, 'disk last:', buf.slice(-80));
          if (buf.length !== res.len) console.log('⚠️ MISMATCH length');
          if (buf.slice(-80) !== res.last) console.log('⚠️ MISMATCH tail');
        } else {
          console.log('no local file at', localPath);
        }
      } catch (e) { console.log('disk compare failed', e.message); }
    } catch (e) {
      console.log('fetch failed for', s.src, e.message);
    }
  }
  await browser.close();
})();