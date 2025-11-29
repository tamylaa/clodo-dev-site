import { chromium } from 'playwright';

(async () => {
  console.log('🚀 Launching browser to check LCP...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Target URL - assumes dev server is running
  const url = 'http://localhost:8001';
  
  try {
    console.log(`Navigate to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Get LCP using the Performance API directly
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        });
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
        
        // Fallback if already fired
        setTimeout(() => {
            // Check if any entries exist in buffer
            const entries = performance.getEntriesByType('largest-contentful-paint');
            if (entries.length > 0) {
                resolve(entries[entries.length - 1].startTime);
            } else {
                resolve(null);
            }
        }, 3000);
      });
    });

    if (lcp) {
      console.log(`✅ LCP: ${Math.round(lcp)}ms`);
    } else {
      console.log('❌ LCP not detected (timeout or no content)');
    }
  } catch (error) {
    console.error('Error checking LCP:', error.message);
    console.log('💡 Tip: Make sure the dev server is running with "npm run serve" in another terminal.');
  } finally {
    await browser.close();
  }
})();
