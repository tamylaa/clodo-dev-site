export default {
  async fetch(request) {
    try {
      const url = new URL(request.url);
      const target = url.searchParams.get('u') || 'https://clodo.dev/edge-vs-cloud-computing';
      const iterations = Math.max(1, parseInt(url.searchParams.get('n') || '1', 10));
      const results = [];
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        // fetch target; allow streaming
        const resp = await fetch(target, { cf: { cacheEverything: 'on' } });
        const headersArrived = Date.now();

        let ttfb = headersArrived - start;
        let bytes = 0;
        // Attempt to measure TTFB more precisely by reading first chunk
        if (resp.body && resp.body.getReader) {
          const reader = resp.body.getReader();
          const first = await reader.read();
          const firstTime = Date.now();
          if (first.value) bytes += first.value.length;
          ttfb = firstTime - start;
          // drain rest
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) bytes += value.length;
          }
        }

        const total = Date.now() - start;
        results.push({
          status: resp.status,
          ttfb,
          total,
          bytes,
          contentType: resp.headers.get('content-type'),
          url: target
        });
      }

      const meta = {
        now: new Date().toISOString(),
        // colo info available in real Cloudflare environment
        colo: request.cf ? request.cf.colo : null
      };

      return new Response(JSON.stringify({ meta, results }, null, 2), {
        headers: { 'content-type': 'application/json' }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'content-type': 'application/json' } });
    }
  }
};
