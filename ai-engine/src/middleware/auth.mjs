/**
 * Authentication Middleware
 * 
 * Verifies requests to the AI Engine via three methods:
 *   1. Cloudflare Service Binding (zero-trust, preferred for worker-to-worker)
 *   2. Bearer token (for HTTP access from external clients)
 *   3. Dev mode (when no token is configured — local development only)
 * 
 * Production MUST have AI_ENGINE_TOKEN set via `wrangler secret put AI_ENGINE_TOKEN`
 */

import { createLogger } from '@tamyla/clodo-framework';

const logger = createLogger('ai-auth');

/**
 * Verify the incoming request is authorized.
 * 
 * @param {Request} request
 * @param {Object} env
 * @returns {{ authorized: boolean, method: string, error?: string }}
 */
export function verifyToken(request, env) {
  // Method 1: Cloudflare Service Binding — trusted by default
  const serviceHeader = request.headers.get('x-ai-engine-service');
  if (serviceHeader) {
    logger.info(`Service binding auth from: ${serviceHeader}`);
    return { authorized: true, method: 'service-binding', caller: serviceHeader };
  }

  // Method 2: Bearer token
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (env.AI_ENGINE_TOKEN && token === env.AI_ENGINE_TOKEN) {
      return { authorized: true, method: 'bearer-token' };
    }
    return { authorized: false, method: 'bearer-token', error: 'Invalid token' };
  }

  // Method 3: Dev mode — no token configured means open access (local dev only)
  if (!env.AI_ENGINE_TOKEN) {
    if (env.ENVIRONMENT === 'production') {
      logger.error('CRITICAL: No AI_ENGINE_TOKEN in production!');
      return { authorized: false, method: 'none', error: 'No token configured in production' };
    }
    logger.warn('Dev mode: no AI_ENGINE_TOKEN set — allowing unauthenticated access');
    return { authorized: true, method: 'dev-mode' };
  }

  return { authorized: false, method: 'none', error: 'No authentication provided' };
}
