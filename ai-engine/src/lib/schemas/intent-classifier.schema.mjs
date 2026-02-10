/**
 * Zod Schemas — Intent Classifier
 * 
 * Input and output schemas for the intent classification capability.
 * Used for request validation AND LLM output validation.
 */

import { z } from 'zod';

// ── Input Schema ─────────────────────────────────────────────────────

export const IntentClassifyInputSchema = z.object({
  keywords: z.array(z.string().min(1)).min(1, 'At least one keyword required').max(500),
  context: z.object({
    siteUrl: z.string().optional(),
    industry: z.string().optional(),
    targetAudience: z.string().optional()
  }).optional().default({})
});

// ── Output Schemas ───────────────────────────────────────────────────

export const IntentEnum = z.enum(['transactional', 'commercial', 'informational', 'navigational']);

export const IntentClassificationSchema = z.object({
  query: z.string(),
  intent: IntentEnum,
  confidence: z.number().min(0).max(1),
  businessValue: z.number().min(1).max(10),
  contentType: z.string(),
  reasoning: z.string()
});

export const IntentClassifyOutputSchema = z.array(IntentClassificationSchema);

// ── JSON Schema for LLM structured output ────────────────────────────

export const INTENT_JSON_SCHEMA = {
  name: 'intent_classifications',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      classifications: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            intent: { type: 'string', enum: ['transactional', 'commercial', 'informational', 'navigational'] },
            confidence: { type: 'number' },
            businessValue: { type: 'number' },
            contentType: { type: 'string' },
            reasoning: { type: 'string' }
          },
          required: ['query', 'intent', 'confidence', 'businessValue', 'contentType', 'reasoning'],
          additionalProperties: false
        }
      }
    },
    required: ['classifications'],
    additionalProperties: false
  }
};
