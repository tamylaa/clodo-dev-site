/**
 * Tests: Authentication Middleware
 */

import { describe, it, expect } from 'vitest';
import { verifyToken } from '../../src/middleware/auth.mjs';
import { createMockEnv } from '../setup.mjs';

function makeRequest(headers = {}) {
  return {
    headers: {
      get: (name) => headers[name.toLowerCase()] || null
    }
  };
}

describe('Auth Middleware', () => {
  describe('Service Binding auth', () => {
    it('accepts requests with x-ai-engine-service header', () => {
      const req = makeRequest({ 'x-ai-engine-service': 'visibility-analytics' });
      const result = verifyToken(req, createMockEnv());

      expect(result.authorized).toBe(true);
      expect(result.method).toBe('service-binding');
      expect(result.caller).toBe('visibility-analytics');
    });
  });

  describe('Bearer token auth', () => {
    it('accepts valid bearer token', () => {
      const req = makeRequest({ authorization: 'Bearer test-token-123' });
      const result = verifyToken(req, createMockEnv());

      expect(result.authorized).toBe(true);
      expect(result.method).toBe('bearer-token');
    });

    it('rejects invalid bearer token', () => {
      const req = makeRequest({ authorization: 'Bearer wrong-token' });
      const result = verifyToken(req, createMockEnv());

      expect(result.authorized).toBe(false);
      expect(result.error).toBe('Invalid token');
    });
  });

  describe('Dev mode', () => {
    it('allows access when no token is configured (non-production)', () => {
      const req = makeRequest({});
      const env = createMockEnv({ AI_ENGINE_TOKEN: undefined });
      const result = verifyToken(req, env);

      expect(result.authorized).toBe(true);
      expect(result.method).toBe('dev-mode');
    });

    it('rejects in production when no token is configured', () => {
      const req = makeRequest({});
      const env = createMockEnv({ AI_ENGINE_TOKEN: undefined, ENVIRONMENT: 'production' });
      const result = verifyToken(req, env);

      expect(result.authorized).toBe(false);
    });
  });

  describe('No authentication', () => {
    it('rejects when no auth is provided but token is configured', () => {
      const req = makeRequest({});
      const result = verifyToken(req, createMockEnv());

      expect(result.authorized).toBe(false);
      expect(result.error).toBe('No authentication provided');
    });
  });
});
