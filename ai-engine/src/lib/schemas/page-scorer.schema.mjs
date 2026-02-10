/**
 * Zod Schemas — SEO Page Scorer
 *
 * Scores individual pages across multiple SEO dimensions (technical,
 * content quality, on-page optimisation, UX signals) and gives
 * actionable improvement recommendations.
 */

import { z } from 'zod';

// ── Input ───────────────────────────────────────────────────────────

export const PageScorerInputSchema = z.object({
  pages: z.array(z.object({
    url: z.string().min(1),
    title: z.string().optional(),
    description: z.string().optional(),
    headings: z.array(z.string()).optional(),
    wordCount: z.number().optional(),
    loadTimeMs: z.number().optional(),
    mobileOptimised: z.boolean().optional(),
    internalLinks: z.number().optional(),
    externalLinks: z.number().optional(),
    images: z.number().optional(),
    imagesWithAlt: z.number().optional(),
    schemaMarkup: z.boolean().optional(),
    keywords: z.array(z.string()).optional()
  })).min(1).max(20, 'Maximum 20 pages per request'),
  context: z.object({
    siteUrl: z.string().optional(),
    industry: z.string().optional()
  }).optional().default({})
});

// ── Output ──────────────────────────────────────────────────────────

const DimensionScoreSchema = z.object({
  score: z.number().min(0).max(100),
  issues: z.array(z.string()),
  suggestions: z.array(z.string())
});

const PageScoreSchema = z.object({
  url: z.string(),
  overallScore: z.number().min(0).max(100),
  grade: z.enum(['A+', 'A', 'B', 'C', 'D', 'F']),
  dimensions: z.object({
    technical: DimensionScoreSchema,
    content: DimensionScoreSchema,
    onPage: DimensionScoreSchema,
    ux: DimensionScoreSchema
  }),
  topPriority: z.string(),
  estimatedImpact: z.enum(['high', 'medium', 'low'])
});

export const PageScorerOutputSchema = z.object({
  scores: z.array(PageScoreSchema),
  averageScore: z.number().min(0).max(100),
  summary: z.string()
});

// ── JSON Schema for structured output ──────────────────────────────

const dimensionScoreJsonSchema = {
  type: 'object',
  required: ['score', 'issues', 'suggestions'],
  properties: {
    score: { type: 'number' },
    issues: { type: 'array', items: { type: 'string' } },
    suggestions: { type: 'array', items: { type: 'string' } }
  },
  additionalProperties: false
};

export const PAGE_SCORER_JSON_SCHEMA = {
  name: 'page_scorer',
  strict: true,
  schema: {
    type: 'object',
    required: ['scores', 'averageScore', 'summary'],
    properties: {
      scores: {
        type: 'array',
        items: {
          type: 'object',
          required: ['url', 'overallScore', 'grade', 'dimensions', 'topPriority', 'estimatedImpact'],
          properties: {
            url: { type: 'string' },
            overallScore: { type: 'number' },
            grade: { type: 'string', enum: ['A+', 'A', 'B', 'C', 'D', 'F'] },
            dimensions: {
              type: 'object',
              required: ['technical', 'content', 'onPage', 'ux'],
              properties: {
                technical: dimensionScoreJsonSchema,
                content: dimensionScoreJsonSchema,
                onPage: dimensionScoreJsonSchema,
                ux: dimensionScoreJsonSchema
              },
              additionalProperties: false
            },
            topPriority: { type: 'string' },
            estimatedImpact: { type: 'string', enum: ['high', 'medium', 'low'] }
          },
          additionalProperties: false
        }
      },
      averageScore: { type: 'number' },
      summary: { type: 'string' }
    },
    additionalProperties: false
  }
};
