/**
 * Worker-Runtime Utilities
 *
 * Lightweight, worker-safe implementations of the four utilities this project
 * previously pulled from @tamyla/clodo-framework.  The framework's barrel
 * export eagerly evaluates ~30 modules — many using Node-only APIs (fs, path,
 * child_process, readline, crypto) — which crashes Cloudflare Workers (1101).
 *
 * These are self-contained, zero-dependency replacements.
 */

// ── Logger ───────────────────────────────────────────────────────────

export const createLogger = (prefix = 'app') => ({
  info:  (msg, ...args) => console.log(`[${prefix}] ${msg}`, ...args),
  warn:  (msg, ...args) => console.warn(`[${prefix}] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[${prefix}] ${msg}`, ...args),
  debug: (msg, ...args) => console.debug(`[${prefix}] ${msg}`, ...args),
});

// ── CORS Middleware ──────────────────────────────────────────────────
// Usage:  const cors = createCorsMiddleware({ origins, methods, headers });
//         return cors(request, response);

export function createCorsMiddleware(options = {}) {
  const {
    origins = ['*'],
    methods = ['GET', 'POST', 'OPTIONS'],
    headers = ['Content-Type', 'Authorization'],
    maxAge  = 86400,
  } = options;

  const methodStr = methods.join(', ');
  const headerStr = headers.join(', ');

  return function applyCors(request, response) {
    const origin = request.headers.get('Origin') || '*';
    const allowed = origins.includes('*') ? '*' : (origins.includes(origin) ? origin : null);
    if (!allowed) return response;

    const h = new Headers(response.headers);
    h.set('Access-Control-Allow-Origin', allowed);
    h.set('Access-Control-Allow-Methods', methodStr);
    h.set('Access-Control-Allow-Headers', headerStr);
    h.set('Access-Control-Max-Age', String(maxAge));

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: h,
    });
  };
}

// ── Error Handler ────────────────────────────────────────────────────

export function createErrorHandler(options = {}) {
  const { includeStack = false } = options;

  return function handleError(err) {
    const body = {
      error: 'Internal Server Error',
      message: err?.message || String(err),
    };
    if (includeStack && err?.stack) body.stack = err.stack;

    return new Response(JSON.stringify(body), {
      status: err?.status || 500,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

// ── Router ───────────────────────────────────────────────────────────
// Minimal method + path → handler router with .get(), .post(), .handle().

export function createEnhancedRouter() {
  const routes = new Map();

  function register(method, path, handler) {
    routes.set(`${method} ${path}`, handler);
  }

  return {
    get:     (p, h) => register('GET', p, h),
    post:    (p, h) => register('POST', p, h),
    put:     (p, h) => register('PUT', p, h),
    patch:   (p, h) => register('PATCH', p, h),
    delete:  (p, h) => register('DELETE', p, h),
    options: (p, h) => register('OPTIONS', p, h),

    async handle(request) {
      const url = new URL(request.url);
      const key = `${request.method} ${url.pathname}`;
      const handler = routes.get(key);
      return handler ? handler(request) : null;
    },
  };
}
