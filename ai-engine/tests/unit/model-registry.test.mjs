/**
 * Tests: Model Registry
 */

import { describe, it, expect } from 'vitest';
import {
  MODELS, PROVIDERS, CAPABILITY_MODEL_MAP,
  getModel, getModelsForProvider, isProviderAvailable
} from '../../src/providers/model-registry.mjs';
import { createMockEnv } from '../setup.mjs';

describe('Model Registry', () => {
  describe('PROVIDERS', () => {
    it('should have all 6 providers defined', () => {
      expect(Object.keys(PROVIDERS)).toEqual(
        expect.arrayContaining(['claude', 'openai', 'gemini', 'mistral', 'deepseek', 'cloudflare'])
      );
      expect(Object.keys(PROVIDERS)).toHaveLength(6);
    });

    it('each provider has required fields', () => {
      for (const [id, provider] of Object.entries(PROVIDERS)) {
        expect(provider.id).toBe(id);
        expect(provider.name).toBeTruthy();
        expect(provider.tier).toMatch(/^(premium|mid|budget|free)$/);
        expect(provider.strengths).toBeInstanceOf(Array);
      }
    });
  });

  describe('MODELS', () => {
    it('should have models for all providers', () => {
      const providers = new Set(Object.values(MODELS).map(m => m.provider));
      expect(providers.size).toBe(6);
    });

    it('each model has required pricing and capability fields', () => {
      for (const [key, model] of Object.entries(MODELS)) {
        expect(model.id).toBeTruthy();
        expect(model.provider).toBeTruthy();
        expect(model.name).toBeTruthy();
        expect(model.contextWindow).toBeGreaterThan(0);
        expect(typeof model.costPer1kInput).toBe('number');
        expect(typeof model.costPer1kOutput).toBe('number');
        expect(model.quality).toMatch(/^(best|excellent|good|basic)$/);
        expect(model.speed).toMatch(/^(fastest|fast|medium|slow)$/);
        expect(model.bestFor).toBeInstanceOf(Array);
      }
    });

    it('Cloudflare models have zero cost', () => {
      const cfModels = Object.values(MODELS).filter(m => m.provider === 'cloudflare');
      for (const model of cfModels) {
        expect(model.costPer1kInput).toBe(0);
        expect(model.costPer1kOutput).toBe(0);
      }
    });

    it('Claude models are most expensive per output token (premium)', () => {
      const claudeDefault = MODELS['claude-sonnet-4'];
      const cfModel = MODELS['cf-llama-70b'];
      expect(claudeDefault.costPer1kOutput).toBeGreaterThan(cfModel.costPer1kOutput);
    });
  });

  describe('CAPABILITY_MODEL_MAP', () => {
    it('should have routing for all 10 capabilities', () => {
      const expected = ['intent-classify', 'anomaly-diagnose', 'embedding-cluster',
        'chat', 'content-rewrite', 'refine-recs', 'smart-forecast',
        'cannibalization-detect', 'content-gaps', 'page-scorer'];
      for (const cap of expected) {
        expect(CAPABILITY_MODEL_MAP[cap]).toBeDefined();
        expect(CAPABILITY_MODEL_MAP[cap].simple).toBeInstanceOf(Array);
        expect(CAPABILITY_MODEL_MAP[cap].standard).toBeInstanceOf(Array);
        expect(CAPABILITY_MODEL_MAP[cap].complex).toBeInstanceOf(Array);
      }
    });

    it('every model key in capability map exists in MODELS', () => {
      for (const [cap, chains] of Object.entries(CAPABILITY_MODEL_MAP)) {
        for (const [complexity, modelKeys] of Object.entries(chains)) {
          for (const key of modelKeys) {
            expect(MODELS[key], `Model "${key}" used in ${cap}/${complexity} not in registry`).toBeDefined();
          }
        }
      }
    });

    it('embedding-cluster only uses embedding model', () => {
      for (const chain of Object.values(CAPABILITY_MODEL_MAP['embedding-cluster'])) {
        expect(chain).toEqual(['cf-bge-embedding']);
      }
    });
  });

  describe('getModel()', () => {
    it('returns model by key', () => {
      const model = getModel('claude-sonnet-4');
      expect(model).toBeDefined();
      expect(model.provider).toBe('claude');
    });

    it('returns null for unknown key', () => {
      expect(getModel('nonexistent')).toBeNull();
    });
  });

  describe('getModelsForProvider()', () => {
    it('returns all models for a provider', () => {
      const claude = getModelsForProvider('claude');
      expect(claude.length).toBeGreaterThanOrEqual(3);
      expect(claude.every(m => m.provider === 'claude')).toBe(true);
    });
  });

  describe('isProviderAvailable()', () => {
    it('detects Claude as available with API key', () => {
      const env = createMockEnv();
      expect(isProviderAvailable('claude', env)).toBe(true);
    });

    it('detects Claude as unavailable without API key', () => {
      const env = createMockEnv({ ANTHROPIC_API_KEY: '' });
      expect(isProviderAvailable('claude', env)).toBe(false);
    });

    it('detects Cloudflare via AI binding', () => {
      const env = createMockEnv();
      expect(isProviderAvailable('cloudflare', env)).toBe(true);

      const envNoAI = createMockEnv({ AI: undefined });
      expect(isProviderAvailable('cloudflare', envNoAI)).toBe(false);
    });

    it('returns false for unknown provider', () => {
      expect(isProviderAvailable('nonexistent', createMockEnv())).toBe(false);
    });
  });
});
