/**
 * Tests: Capability Manifest
 */

import { describe, it, expect } from 'vitest';
import { getCapabilityManifest } from '../../src/capabilities/manifest.mjs';
import { createMockEnv } from '../setup.mjs';

describe('Capability Manifest', () => {
  it('returns all 14 capabilities', () => {
    const manifest = getCapabilityManifest(createMockEnv());

    expect(manifest.capabilities).toHaveLength(14);
    expect(manifest.engine).toBe('ai-engine');
    expect(manifest.version).toBe('3.0.0');
  });

  it('includes provider availability info', () => {
    const manifest = getCapabilityManifest(createMockEnv());

    expect(manifest.providers).toBeInstanceOf(Array);
    expect(manifest.providers.length).toBeGreaterThan(0);
    expect(manifest.providers[0]).toHaveProperty('id');
    expect(manifest.providers[0]).toHaveProperty('name');
    expect(manifest.providers[0]).toHaveProperty('tier');
  });

  it('respects capability toggles', () => {
    const env = createMockEnv({ CAPABILITY_CHAT: 'false' });
    const manifest = getCapabilityManifest(env);

    const chat = manifest.capabilities.find(c => c.id === 'chat');
    expect(chat.enabled).toBe(false);

    const intent = manifest.capabilities.find(c => c.id === 'intent-classify');
    expect(intent.enabled).toBe(true);
  });

  it('each capability has required fields', () => {
    const manifest = getCapabilityManifest(createMockEnv());

    for (const cap of manifest.capabilities) {
      expect(cap.id).toBeTruthy();
      expect(cap.name).toBeTruthy();
      expect(cap.description).toBeTruthy();
      expect(cap.endpoint).toMatch(/^\/ai\//);
      expect(cap.method).toBe('POST');
      expect(typeof cap.enabled).toBe('boolean');
      expect(cap.inputSchema).toBeDefined();
    }
  });
});
