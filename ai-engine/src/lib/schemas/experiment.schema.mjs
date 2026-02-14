/**
 * Zod Schemas — AI Experimentation
 */

import { z } from 'zod';

export const ExperimentInputSchema = z.object({
  type: z.enum(['custom-prompt', 'ab-test', 'hypothesis-test']),
  capability: z.string().optional(), // For hypothesis testing
  prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
  promptAlt: z.string().optional(), // For A/B testing
  model: z.string().optional(), // Specific model override
  testData: z.any(), // The data to test on
  hypothesis: z.string().optional(), // For hypothesis testing
  iterations: z.number().min(1).max(10).default(3) // Number of test runs
});

export const ExperimentResultSchema = z.object({
  experimentId: z.string(),
  type: z.string(),
  results: z.array(z.object({
    promptVersion: z.string(),
    output: z.any(),
    tokensUsed: z.object({ input: z.number(), output: z.number() }),
    cost: z.number(),
    durationMs: z.number(),
    model: z.string(),
    provider: z.string()
  })),
  comparison: z.object({
    winner: z.string().optional(),
    confidence: z.number(),
    insights: z.array(z.string())
  }).optional(),
  hypothesisResult: z.object({
    supported: z.boolean(),
    evidence: z.array(z.string()),
    confidence: z.number()
  }).optional()
});

export const ExperimentOutputSchema = z.object({
  experiment: ExperimentResultSchema,
  explanation: z.string().optional(),
  confidenceBreakdown: z.object({
    primarySignal: z.string().optional(),
    alternativeApproaches: z.array(z.string()).optional(),
    dataQuality: z.string().optional()
  }).optional(),
  nextSteps: z.array(z.string()).optional()
});

export const EXPERIMENT_JSON_SCHEMA = {
  name: 'experiment',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      experiment: {
        type: 'object',
        properties: {
          experimentId: { type: 'string' },
          type: { type: 'string' },
          results: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                promptVersion: { type: 'string' },
                output: { type: 'object' },
                tokensUsed: { type: 'object', properties: { input: { type: 'number' }, output: { type: 'number' } } },
                cost: { type: 'number' },
                durationMs: { type: 'number' },
                model: { type: 'string' },
                provider: { type: 'string' }
              },
              required: ['promptVersion', 'output', 'tokensUsed', 'cost', 'durationMs', 'model', 'provider']
            }
          },
          comparison: {
            type: 'object',
            properties: {
              winner: { type: 'string' },
              confidence: { type: 'number' },
              insights: { type: 'array', items: { type: 'string' } }
            }
          },
          hypothesisResult: {
            type: 'object',
            properties: {
              supported: { type: 'boolean' },
              evidence: { type: 'array', items: { type: 'string' } },
              confidence: { type: 'number' }
            }
          }
        },
        required: ['experimentId', 'type', 'results']
      }
    },
    required: ['experiment'],
    additionalProperties: false
  }
};