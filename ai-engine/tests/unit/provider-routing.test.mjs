/**
 * Tests: Provider Routing & Fallback Chains
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockEnv } from '../setup.mjs';

// We need to test the routing logic without making real API calls.
// Import the model registry directly and test resolution logic.
import {
  CAPABILITY_MODEL_MAP, isProviderAvailable, getModel
} from '../../src/providers/model-registry.mjs';

describe('Provider Routing', () => {
  describe('Capability-based model selection', () => {
    it('routes intent-classify/simple to fast, cheap models', () => {
      const chain = CAPABILITY_MODEL_MAP['intent-classify'].simple;
      expect(chain[0]).toBe('claude-haiku-3.5');

      // Verify these are all fast/cheap models
      for (const key of chain) {
        const model = getModel(key);
        expect(model).toBeDefined();
        expect(['fastest', 'fast', 'medium']).toContain(model.speed);
      }
    });

    it('routes refine-recs/complex to best quality models', () => {
      const chain = CAPABILITY_MODEL_MAP['refine-recs'].complex;
      expect(chain[0]).toBe('claude-opus-4');

      const firstModel = getModel(chain[0]);
      expect(firstModel.quality).toBe('best');
    });

    it('always falls back to cloudflare for text generation', () => {
      const textCapabilities = ['intent-classify', 'anomaly-diagnose', 'chat',
        'content-rewrite', 'refine-recs', 'smart-forecast'];

      for (const cap of textCapabilities) {
        for (const complexity of ['simple', 'standard', 'complex']) {
          const chain = CAPABILITY_MODEL_MAP[cap][complexity];
          const lastModel = getModel(chain[chain.length - 1]);
          expect(lastModel.provider, `${cap}/${complexity} should end with cloudflare`).toBe('cloudflare');
        }
      }
    });
  });

  describe('Provider availability', () => {
    it('all providers available with full env', () => {
      const env = createMockEnv();
      const providers = ['claude', 'openai', 'gemini', 'mistral', 'deepseek', 'cloudflare'];
      for (const p of providers) {
        expect(isProviderAvailable(p, env), `${p} should be available`).toBe(true);
      }
    });

    it('only cloudflare available with minimal env', () => {
      const env = createMockEnv({
        ANTHROPIC_API_KEY: '',
        OPENAI_API_KEY: '',
        GOOGLE_AI_API_KEY: '',
        MISTRAL_API_KEY: '',
        DEEPSEEK_API_KEY: ''
      });

      expect(isProviderAvailable('claude', env)).toBe(false);
      expect(isProviderAvailable('openai', env)).toBe(false);
      expect(isProviderAvailable('cloudflare', env)).toBe(true);
    });
  });

  describe('Cost tracking accuracy', () => {
    it('Claude Sonnet 4 costs match registry', () => {
      const model = getModel('claude-sonnet-4');
      // $3/M input = $0.003/1k, $15/M output = $0.015/1k
      expect(model.costPer1kInput).toBe(0.003);
      expect(model.costPer1kOutput).toBe(0.015);

      // Test cost calculation: 1000 input + 500 output
      const cost = (1000 / 1000) * model.costPer1kInput + (500 / 1000) * model.costPer1kOutput;
      expect(cost).toBeCloseTo(0.0105, 4);
    });

    it('GPT-4o costs match registry', () => {
      const model = getModel('gpt-4o');
      expect(model.costPer1kInput).toBe(0.0025);
      expect(model.costPer1kOutput).toBe(0.01);
    });
  });
});
