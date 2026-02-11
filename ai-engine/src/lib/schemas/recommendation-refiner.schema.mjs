/**
 * Zod Schemas — Recommendation Refiner
 */

import { z } from 'zod';

export const RecommendationRefinerInputSchema = z.object({
  recommendations: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    priority: z.enum(['high', 'medium', 'low']).optional(),
    category: z.string().optional(),
    effort: z.string().optional()
  })).min(1).max(30),
  analyticsContext: z.object({
    topPages: z.array(z.any()).optional(),
    recentTrends: z.array(z.any()).optional(),
    siteType: z.string().optional(),
    monthlyTraffic: z.number().optional()
  }).optional(),
  constraints: z.object({
    budget: z.enum(['low', 'medium', 'high']).optional(),
    teamSize: z.enum(['solo', 'small', 'large']).optional(),
    timeline: z.enum(['urgent', 'quarter', 'year']).optional()
  }).optional()
});

const RefinedRecommendationSchema = z.object({
  original: z.string(),
  refined: z.string(),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  effort: z.enum(['minimal', 'moderate', 'significant']),
  estimatedImpact: z.string(),
  actionSteps: z.array(z.string()).max(5),
  rationale: z.string(),
  dependencies: z.array(z.string()).optional(),
  kpiTargets: z.array(z.object({
    metric: z.string(),
    currentValue: z.string().optional(),
    targetValue: z.string()
  })).optional()
});

export const RecommendationRefinerOutputSchema = z.object({
  refined: z.array(RefinedRecommendationSchema),
  executionOrder: z.array(z.number()).optional(),
  quickWins: z.array(z.number()).optional(),
  summary: z.object({
    totalRecommendations: z.number(),
    criticalCount: z.number().optional(),
    estimatedTimelineWeeks: z.number().optional()
  }).optional()
});

export const RECOMMENDATION_REFINER_JSON_SCHEMA = {
  name: 'refined_recommendations',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      refined: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            original: { type: 'string' },
            refined: { type: 'string' },
            priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
            effort: { type: 'string', enum: ['minimal', 'moderate', 'significant'] },
            estimatedImpact: { type: 'string' },
            actionSteps: { type: 'array', items: { type: 'string' } },
            rationale: { type: 'string' },
            dependencies: { type: 'array', items: { type: 'string' } },
            kpiTargets: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  metric: { type: 'string' },
                  currentValue: { type: 'string' },
                  targetValue: { type: 'string' }
                },
                required: ['metric', 'currentValue', 'targetValue'],
                additionalProperties: false
              }
            }
          },
          required: ['original', 'refined', 'priority', 'effort', 'estimatedImpact', 'actionSteps', 'rationale', 'dependencies', 'kpiTargets'],
          additionalProperties: false
        }
      },
      executionOrder: { type: 'array', items: { type: 'number' } },
      quickWins: { type: 'array', items: { type: 'number' } },
      summary: {
        type: 'object',
        properties: {
          totalRecommendations: { type: 'number' },
          criticalCount: { type: 'number' },
          estimatedTimelineWeeks: { type: 'number' }
        },
        required: ['totalRecommendations', 'criticalCount', 'estimatedTimelineWeeks'],
        additionalProperties: false
      }
    },
    required: ['refined', 'executionOrder', 'quickWins', 'summary'],
    additionalProperties: false
  }
};
