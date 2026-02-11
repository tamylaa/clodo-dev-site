/**
 * Zod Schemas — Conversational AI
 */

import { z } from 'zod';

export const ConversationalInputSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  analyticsContext: z.object({
    topPages: z.array(z.any()).optional(),
    recentTrends: z.array(z.any()).optional(),
    alerts: z.array(z.any()).optional(),
    dateRange: z.string().optional()
  }).optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).max(20).default([]),
  persona: z.enum(['analyst', 'advisor', 'technical']).default('analyst')
});

export const ConversationalOutputSchema = z.object({
  response: z.string(),
  suggestedFollowUps: z.array(z.string()).max(5).optional(),
  dataCitations: z.array(z.object({
    metric: z.string(),
    value: z.union([z.string(), z.number()]),
    source: z.string().optional()
  })).optional(),
  confidence: z.number().min(0).max(1).optional()
});

export const CONVERSATIONAL_JSON_SCHEMA = {
  name: 'conversational_response',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      response: { type: 'string' },
      suggestedFollowUps: {
        type: 'array',
        items: { type: 'string' }
      },
      dataCitations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            metric: { type: 'string' },
            value: { type: 'string' },
            source: { type: 'string' }
          },
          required: ['metric', 'value'],
          additionalProperties: false
        }
      },
      confidence: { type: 'number' }
    },
    required: ['response'],
    additionalProperties: false
  }
};
