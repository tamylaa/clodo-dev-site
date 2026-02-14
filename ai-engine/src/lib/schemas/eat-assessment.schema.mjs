/**
 * Zod Schemas — E-A-T Assessment
 */

import { z } from 'zod';

export const EATAssessmentInputSchema = z.object({
  content: z.string().min(100, 'Content must be at least 100 characters'),
  url: z.string().url().optional(),
  author: z.string().optional(),
  publishDate: z.string().optional(),
  topic: z.string().optional()
});

export const EATScoreSchema = z.object({
  expertise: z.number().min(0).max(1),
  authoritativeness: z.number().min(0).max(1),
  trustworthiness: z.number().min(0).max(1),
  overall: z.number().min(0).max(1)
});

export const EATAssessmentOutputSchema = z.object({
  scores: EATScoreSchema,
  analysis: z.object({
    expertise: z.string(),
    authoritativeness: z.string(),
    trustworthiness: z.string()
  }),
  recommendations: z.array(z.string()),
  explanation: z.string().optional(),
  confidenceBreakdown: z.object({
    primarySignal: z.string().optional(),
    alternativeFactors: z.array(z.string()).optional(),
    contentQuality: z.string().optional()
  }).optional(),
  nextSteps: z.array(z.string()).optional()
});

export const EAT_JSON_SCHEMA = {
  name: 'eat_assessment',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      scores: {
        type: 'object',
        properties: {
          expertise: { type: 'number' },
          authoritativeness: { type: 'number' },
          trustworthiness: { type: 'number' },
          overall: { type: 'number' }
        },
        required: ['expertise', 'authoritativeness', 'trustworthiness', 'overall'],
        additionalProperties: false
      },
      analysis: {
        type: 'object',
        properties: {
          expertise: { type: 'string' },
          authoritativeness: { type: 'string' },
          trustworthiness: { type: 'string' }
        },
        required: ['expertise', 'authoritativeness', 'trustworthiness'],
        additionalProperties: false
      },
      recommendations: {
        type: 'array',
        items: { type: 'string' }
      },
      explanation: { type: 'string' },
      confidenceBreakdown: {
        type: 'object',
        properties: {
          primarySignal: { type: 'string' },
          alternativeFactors: { type: 'array', items: { type: 'string' } },
          contentQuality: { type: 'string' }
        }
      },
      nextSteps: { type: 'array', items: { type: 'string' } }
    },
    required: ['scores', 'analysis', 'recommendations'],
    additionalProperties: false
  }
};