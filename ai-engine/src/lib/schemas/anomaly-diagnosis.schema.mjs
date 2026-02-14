/**
 * Zod Schemas — Anomaly Diagnosis
 */

import { z } from 'zod';

export const SeverityEnum = z.enum(['critical', 'warning', 'info']);
export const CauseEnum = z.enum([
  'algorithm-update', 'technical-issue', 'content-change',
  'competitor-action', 'seasonal-pattern', 'data-artifact'
]);

export const AnomalyInputSchema = z.object({
  anomalies: z.array(z.object({
    type: z.string().optional(),
    severity: z.string().optional(),
    description: z.string().optional(),
    message: z.string().optional(),
    keyword: z.string().optional(),
    page: z.string().optional(),
    query: z.string().optional(),
    previousValue: z.number().optional().nullable(),
    currentValue: z.number().optional().nullable(),
    magnitude: z.union([z.number(), z.string()]).optional(),
    changePercent: z.union([z.number(), z.string()]).optional(),
    date: z.string().optional()
  })).min(1, 'At least one anomaly required'),
  currentData: z.object({}).passthrough().optional().default({})
});

export const DiagnosisSchema = z.object({
  anomalyId: z.string(),
  likelyCause: z.string(),
  causeCategory: CauseEnum.optional(),
  confidence: z.number().min(0).max(1),
  immediateAction: z.string(),
  investigationSteps: z.array(z.string()),
  isRealProblem: z.boolean(),
  severity: SeverityEnum,
  correlatedUpdate: z.string().optional(),
  explanation: z.string().optional(),
  confidenceBreakdown: z.object({
    primarySignal: z.string().optional(),
    alternativeCauses: z.array(z.string()).optional(),
    dataQuality: z.string().optional()
  }).optional(),
  nextSteps: z.array(z.string()).optional()
});

export const AnomalyDiagnoseOutputSchema = z.object({
  diagnoses: z.array(DiagnosisSchema)
});

export const ANOMALY_JSON_SCHEMA = {
  name: 'anomaly_diagnoses',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      diagnoses: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            anomalyId: { type: 'string' },
            likelyCause: { type: 'string' },
            confidence: { type: 'number' },
            immediateAction: { type: 'string' },
            investigationSteps: { type: 'array', items: { type: 'string' } },
            isRealProblem: { type: 'boolean' },
            severity: { type: 'string', enum: ['critical', 'warning', 'info'] },
            explanation: { type: 'string' },
            confidenceBreakdown: {
              type: 'object',
              properties: {
                primarySignal: { type: 'string' },
                alternativeCauses: { type: 'array', items: { type: 'string' } },
                dataQuality: { type: 'string' }
              }
            },
            nextSteps: { type: 'array', items: { type: 'string' } }
          },
          required: ['anomalyId', 'likelyCause', 'confidence', 'immediateAction', 'investigationSteps', 'isRealProblem', 'severity'],
          additionalProperties: false
        }
      }
    },
    required: ['diagnoses'],
    additionalProperties: false
  }
};
