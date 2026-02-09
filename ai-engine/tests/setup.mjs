/**
 * Test Setup
 * 
 * Global mocks for Cloudflare Worker environment.
 */

import { vi } from 'vitest';

// Mock clodo-framework
vi.mock('@tamyla/clodo-framework', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }),
  createEnhancedRouter: () => {
    const routes = { get: {}, post: {} };
    return {
      get: (path, handler) => { routes.get[path] = handler; },
      post: (path, handler) => { routes.post[path] = handler; },
      handle: async (request) => {
        const url = new URL(request.url);
        const method = request.method.toLowerCase();
        const handler = routes[method]?.[url.pathname];
        if (handler) return handler(request);
        return null;
      },
      _routes: routes
    };
  },
  createCorsMiddleware: () => (req, res) => res,
  createErrorHandler: () => (err) => new Response(JSON.stringify({ error: err.message }), { status: 500 })
}));

// Helper: Create a mock Cloudflare Worker env
export function createMockEnv(overrides = {}) {
  return {
    ENVIRONMENT: 'test',
    AI_PROVIDER: 'auto',
    AI_PREFERRED_PROVIDER: 'claude',
    AI_ENGINE_TOKEN: 'test-token-123',
    ANTHROPIC_API_KEY: 'sk-ant-test',
    OPENAI_API_KEY: 'sk-test',
    GOOGLE_AI_API_KEY: 'test-google-key',
    MISTRAL_API_KEY: 'test-mistral-key',
    DEEPSEEK_API_KEY: 'test-deepseek-key',
    MAX_REQUESTS_PER_HOUR: '120',
    CAPABILITY_INTENT: 'true',
    CAPABILITY_ANOMALY: 'true',
    CAPABILITY_EMBEDDINGS: 'true',
    CAPABILITY_CHAT: 'true',
    CAPABILITY_REWRITES: 'true',
    CAPABILITY_REFINER: 'true',
    CAPABILITY_FORECAST: 'true',
    CF_MODEL_LARGE: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    CF_MODEL_SMALL: '@cf/meta/llama-3.1-8b-instruct-fast',
    CF_MODEL_EMBEDDING: '@cf/baai/bge-base-en-v1.5',
    AI: {
      run: vi.fn().mockResolvedValue({ response: '{"test": true}' })
    },
    KV_AI: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined)
    },
    ...overrides
  };
}
