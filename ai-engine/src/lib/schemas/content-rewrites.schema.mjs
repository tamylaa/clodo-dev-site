/**
 * Zod Schemas — Content Rewrites
 */

import { z } from 'zod';

export const ContentRewriteInputSchema = z.object({
  pages: z.array(z.object({
    url: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    h1: z.string().optional(),
    targetKeyword: z.string().optional(),
    targetKeywords: z.array(z.union([
      z.string(),
      z.object({ query: z.string(), keyword: z.string().optional() })
    ])).optional(),
    clicks: z.number().optional(),
    impressions: z.number().optional(),
    position: z.number().optional(),
    ctr: z.number().optional(),
    intent: z.string().optional()
  })).min(1).max(50),
  competitors: z.array(z.object({
    url: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    position: z.number().optional()
  })).max(20).optional(),
  tone: z.enum(['professional', 'casual', 'technical', 'persuasive']).default('professional'),
  locale: z.string().default('en-US'),
  industry: z.string().optional()
});

const SingleRewriteSchema = z.object({
  url: z.string(),
  original: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    h1: z.string().optional()
  }).optional(),
  rewritten: z.object({
    title: z.string(),
    description: z.string(),
    h1: z.string()
  }),
  reasoning: z.string().optional(),
  estimatedImpact: z.enum(['high', 'medium', 'low']).optional(),
  titleLength: z.number().optional(),
  descriptionLength: z.number().optional(),
  explanation: z.string().optional(),
  confidenceBreakdown: z.object({
    primarySignal: z.string().optional(),
    alternativeApproaches: z.array(z.string()).optional(),
    contentQuality: z.string().optional()
  }).optional(),
  nextSteps: z.array(z.string()).optional()
});

export const ContentRewriteOutputSchema = z.object({
  rewrites: z.array(SingleRewriteSchema),
  summary: z.object({
    totalPages: z.number(),
    highImpact: z.number(),
    avgTitleLengthBefore: z.number().optional(),
    avgTitleLengthAfter: z.number().optional()
  }).optional()
});

export const CONTENT_REWRITE_JSON_SCHEMA = {
  name: 'content_rewrites',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      rewrites: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            original: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                h1: { type: 'string' }
              },
              required: ['title', 'description', 'h1'],
              additionalProperties: false
            },
            rewritten: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                h1: { type: 'string' }
              },
              required: ['title', 'description', 'h1'],
              additionalProperties: false
            },
            reasoning: { type: 'string' },
            estimatedImpact: { type: 'string', enum: ['high', 'medium', 'low'] },
            titleLength: { type: 'number' },
            descriptionLength: { type: 'number' },
            explanation: { type: 'string' },
            confidenceBreakdown: {
              type: 'object',
              properties: {
                primarySignal: { type: 'string' },
                alternativeApproaches: { type: 'array', items: { type: 'string' } },
                contentQuality: { type: 'string' }
              }
            },
            nextSteps: { type: 'array', items: { type: 'string' } }
          },
          required: ['url', 'original', 'rewritten', 'reasoning', 'estimatedImpact', 'titleLength', 'descriptionLength'],
          additionalProperties: false
        }
      },
      summary: {
        type: 'object',
        properties: {
          totalPages: { type: 'number' },
          highImpact: { type: 'number' },
          avgTitleLengthBefore: { type: 'number' },
          avgTitleLengthAfter: { type: 'number' }
        },
        required: ['totalPages', 'highImpact', 'avgTitleLengthBefore', 'avgTitleLengthAfter'],
        additionalProperties: false
      }
    },
    required: ['rewrites', 'summary'],
    additionalProperties: false
  }
};
