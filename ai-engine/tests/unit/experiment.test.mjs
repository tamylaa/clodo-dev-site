/**
 * Tests: AI Experimentation & Customization
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runExperiment } from '../../src/capabilities/experiment.mjs';
import { createMockEnv } from '../setup.mjs';

// Mock the AI provider
vi.mock('../../src/providers/ai-provider.mjs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    runTextGeneration: vi.fn()
  };
});

import { runTextGeneration } from '../../src/providers/ai-provider.mjs';

describe('AI Experimentation & Customization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runTextGeneration.mockImplementation((params) => {
      // Return JSON for comparison requests, plain text for others
      if (params.jsonMode) {
        return Promise.resolve({
          text: JSON.stringify({
            winner: 'A',
            confidence: 0.7,
            insights: ['Prompt A was more detailed', 'Prompt B was shorter']
          }),
          tokensUsed: { input: 10, output: 20 },
          cost: 0.001,
          durationMs: 500,
          model: 'claude-3-haiku',
          provider: 'claude'
        });
      }
      return Promise.resolve({
        text: 'Test output from AI',
        tokensUsed: { input: 10, output: 20 },
        cost: 0.001,
        durationMs: 500,
        model: 'claude-3-haiku',
        provider: 'claude'
      });
    });
  });

  it('runs custom prompt experiment', async () => {
    const input = {
      type: 'custom-prompt',
      prompt: 'Analyze this SEO data: {data}',
      testData: { keywords: ['test keyword'], impressions: 1000 }
    };

    const result = await runExperiment(input, createMockEnv());

    expect(result.experiment.type).toBe('custom-prompt');
    expect(result.experiment.results).toHaveLength(1);
    expect(result.explanation).toContain('custom prompt');
    expect(result.metadata.experimentId).toBeDefined();
  });

  it('runs A/B test experiment', async () => {
    const input = {
      type: 'ab-test',
      prompt: 'Analyze this data: {data}',
      promptAlt: 'Evaluate this information: {data}',
      testData: { keywords: ['test keyword'], impressions: 1000 }
    };

    const result = await runExperiment(input, createMockEnv());

    expect(result.experiment.type).toBe('ab-test');
    expect(result.experiment.results).toHaveLength(2);
    expect(result.experiment.comparison).toBeDefined();
    expect(result.explanation).toContain('compared two prompts');
  });

  it('validates input schema', async () => {
    const invalidInput = {
      type: 'invalid-type',
      prompt: 'test'
    };

    const result = await runExperiment(invalidInput, createMockEnv());

    expect(result).toHaveProperty('error');
    expect(result.error).toBe('Invalid input');
  });
});