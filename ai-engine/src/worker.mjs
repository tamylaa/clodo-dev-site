/**
 * AI Engine — Worker Entry Point
 * 
 * Standalone multi-model AI worker for SEO analytics.
 * Supports 6 providers: Claude (preferred), OpenAI, Gemini, Mistral, DeepSeek, Cloudflare AI.
 * 
 * Deployment: wrangler deploy --config config/wrangler.toml
 */

import {
  createEnhancedRouter,
  createLogger,
  createCorsMiddleware,
  createErrorHandler
} from '@tamyla/clodo-framework';

import { verifyToken } from './middleware/auth.mjs';
import { UsageTracker } from './middleware/usage-tracker.mjs';
import { registerRoutes } from './routes.mjs';
import { getProviderStatus } from './providers/ai-provider.mjs';

const logger = createLogger('ai-engine');

// ── Health Checker ───────────────────────────────────────────────────

class HealthChecker {
  constructor(env) {
    this.env = env;
  }

  async check() {
    const checks = {};

    // KV connectivity
    try {
      if (this.env.KV_AI) {
        await this.env.KV_AI.get('__health__');
        checks.kv_ai = { status: 'ok' };
      } else {
        checks.kv_ai = { status: 'warn', message: 'No KV binding' };
      }
    } catch (err) {
      checks.kv_ai = { status: 'fail', message: err.message };
    }

    // Workers AI binding
    checks.workers_ai = this.env.AI
      ? { status: 'ok' }
      : { status: 'warn', message: 'No AI binding' };

    // Provider availability
    const providers = getProviderStatus(this.env);
    const availableCount = Object.values(providers).filter(p => p.available).length;
    checks.providers = {
      status: availableCount > 0 ? 'ok' : 'fail',
      available: availableCount,
      total: Object.keys(providers).length,
      details: Object.fromEntries(
        Object.entries(providers).map(([id, p]) => [id, p.available ? 'configured' : 'not configured'])
      )
    };

    const allOk = Object.values(checks).every(c => c.status !== 'fail');
    return { healthy: allOk, checks };
  }
}

// ── CORS ─────────────────────────────────────────────────────────────

const cors = createCorsMiddleware({
  origins: ['*'],
  methods: ['GET', 'POST', 'OPTIONS'],
  headers: ['Content-Type', 'Authorization', 'x-ai-engine-service']
});

const errorHandler = createErrorHandler({ includeStack: false });

// ── Worker Export ────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return cors(request, new Response(null, { status: 204 }));
    }

    // Health endpoint (no auth required)
    if (url.pathname === '/health' || url.pathname === '/') {
      const checker = new HealthChecker(env);
      const health = await checker.check();
      const response = new Response(JSON.stringify({
        service: 'ai-engine',
        version: '2.0.0',
        environment: env.ENVIRONMENT || 'development',
        ...health
      }), {
        status: health.healthy ? 200 : 503,
        headers: { 'Content-Type': 'application/json' }
      });
      return cors(request, response);
    }

    // Authentication (all /ai/* routes)
    if (url.pathname.startsWith('/ai/')) {
      const auth = verifyToken(request, env);
      if (!auth.authorized) {
        const response = new Response(JSON.stringify({
          error: 'Unauthorized',
          message: auth.error
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
        return cors(request, response);
      }

      // Rate limiting
      const usageTracker = new UsageTracker(env.KV_AI, env);
      const rateCheck = await usageTracker.checkAndIncrement(auth.caller || 'global');
      if (!rateCheck.allowed) {
        const response = new Response(JSON.stringify({
          error: 'Rate limit exceeded',
          limit: rateCheck.limit,
          resetAt: rateCheck.resetAt
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '3600',
            'X-RateLimit-Limit': String(rateCheck.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateCheck.resetAt
          }
        });
        return cors(request, response);
      }

      // Route dispatch
      try {
        const router = createEnhancedRouter();
        registerRoutes(router, env, usageTracker);

        const response = await router.handle(request);
        if (response) return cors(request, response);
      } catch (err) {
        if (err.status) {
          const response = new Response(JSON.stringify({
            error: err.message
          }), {
            status: err.status,
            headers: { 'Content-Type': 'application/json' }
          });
          return cors(request, response);
        }

        logger.error(`Unhandled error on ${url.pathname}:`, err.message);
        const response = new Response(JSON.stringify({
          error: 'Internal server error',
          message: env.ENVIRONMENT !== 'production' ? err.message : undefined
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
        return cors(request, response);
      }
    }

    // 404 fallback
    return cors(request, new Response(JSON.stringify({
      error: 'Not found',
      endpoints: ['/health', '/ai/capabilities', '/ai/providers', '/ai/usage',
        '/ai/intent-classify', '/ai/anomaly-diagnose', '/ai/embedding-cluster',
        '/ai/chat', '/ai/content-rewrite', '/ai/refine-recs', '/ai/smart-forecast']
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    }));
  }
};
