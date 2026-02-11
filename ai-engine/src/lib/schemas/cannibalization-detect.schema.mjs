/**
 * Zod Schemas — Keyword Cannibalization Detection
 *
 * Detects when multiple pages on the same site compete for the same
 * keyword, splitting ranking signals and suppressing overall performance.
 */

import { z } from 'zod';

// ── Input ───────────────────────────────────────────────────────────

export const CannibalizationInputSchema = z.object({
  pages: z.array(z.object({
    url: z.string().min(1),
    title: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    position: z.number().optional(),
    clicks: z.number().optional(),
    impressions: z.number().optional()
  })).min(2, 'At least 2 pages required for cannibalization detection'),
  context: z.object({
    siteUrl: z.string().optional(),
    industry: z.string().optional()
  }).optional().default({})
});

// ── Output ──────────────────────────────────────────────────────────

const ConflictPageSchema = z.object({
  url: z.string(),
  title: z.string().optional().default(''),
  position: z.number().optional(),
  clicks: z.number().optional(),
  impressions: z.number().optional()
});

const CannibalizationConflictSchema = z.object({
  keyword: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  pages: z.array(ConflictPageSchema).min(2),
  recommendation: z.string(),
  suggestedCanonical: z.string().optional(),
  estimatedTrafficLoss: z.number().min(0).max(100).optional()
});

export const CannibalizationOutputSchema = z.object({
  conflicts: z.array(CannibalizationConflictSchema),
  summary: z.string(),
  overallSeverity: z.enum(['critical', 'high', 'medium', 'low', 'none'])
});

// ── JSON Schema for structured output ──────────────────────────────

export const CANNIBALIZATION_JSON_SCHEMA = {
  name: 'cannibalization_detection',
  strict: true,
  schema: {
    type: 'object',
    required: ['conflicts', 'summary', 'overallSeverity'],
    properties: {
      conflicts: {
        type: 'array',
        items: {
          type: 'object',
          required: ['keyword', 'severity', 'pages', 'recommendation'],
          properties: {
            keyword: { type: 'string' },
            severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
            pages: {
              type: 'array',
              items: {
                type: 'object',
                required: ['url'],
                properties: {
                  url: { type: 'string' },
                  title: { type: 'string' },
                  position: { type: 'number' },
                  clicks: { type: 'number' },
                  impressions: { type: 'number' }
                },
                additionalProperties: false
              }
            },
            recommendation: { type: 'string' },
            suggestedCanonical: { type: 'string' },
            estimatedTrafficLoss: { type: 'number' }
          },
          additionalProperties: false
        }
      },
      summary: { type: 'string' },
      overallSeverity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'none'] }
    },
    additionalProperties: false
  }
};
