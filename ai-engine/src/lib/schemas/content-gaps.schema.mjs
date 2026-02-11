/**
 * Zod Schemas — Content Gap Analysis
 *
 * Identifies topics/keywords where competitors rank but the target site
 * doesn't, revealing content opportunities.
 */

import { z } from 'zod';

// ── Input ───────────────────────────────────────────────────────────

export const ContentGapsInputSchema = z.object({
  siteKeywords: z.array(z.string()).min(1, 'At least 1 site keyword required'),
  competitorKeywords: z.array(z.object({
    keyword: z.string(),
    source: z.string().optional(),
    position: z.number().optional(),
    volume: z.number().optional()
  })).min(1, 'At least 1 competitor keyword required'),
  context: z.object({
    siteUrl: z.string().optional(),
    industry: z.string().optional(),
    targetAudience: z.string().optional()
  }).optional().default({})
});

// ── Output ──────────────────────────────────────────────────────────

const ContentGapSchema = z.object({
  keyword: z.string(),
  opportunity: z.enum(['high', 'medium', 'low']),
  estimatedVolume: z.number().min(0).optional(),
  difficulty: z.enum(['easy', 'moderate', 'hard']).optional(),
  suggestedContentType: z.string(),
  suggestedTitle: z.string(),
  reasoning: z.string(),
  competitorUrls: z.array(z.string()).optional().default([])
});

export const ContentGapsOutputSchema = z.object({
  gaps: z.array(ContentGapSchema),
  summary: z.string(),
  topOpportunities: z.array(z.string()).max(5)
});

// ── JSON Schema for structured output ──────────────────────────────

export const CONTENT_GAPS_JSON_SCHEMA = {
  name: 'content_gap_analysis',
  strict: true,
  schema: {
    type: 'object',
    required: ['gaps', 'summary', 'topOpportunities'],
    properties: {
      gaps: {
        type: 'array',
        items: {
          type: 'object',
          required: ['keyword', 'opportunity', 'suggestedContentType', 'suggestedTitle', 'reasoning'],
          properties: {
            keyword: { type: 'string' },
            opportunity: { type: 'string', enum: ['high', 'medium', 'low'] },
            estimatedVolume: { type: 'number' },
            difficulty: { type: 'string', enum: ['easy', 'moderate', 'hard'] },
            suggestedContentType: { type: 'string' },
            suggestedTitle: { type: 'string' },
            reasoning: { type: 'string' },
            competitorUrls: { type: 'array', items: { type: 'string' } }
          },
          additionalProperties: false
        }
      },
      summary: { type: 'string' },
      topOpportunities: { type: 'array', items: { type: 'string' } }
    },
    additionalProperties: false
  }
};
