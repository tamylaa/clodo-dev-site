/**
 * Zod Schemas — Site Health Pulse
 *
 * Composite capability that orchestrates page-scorer, cannibalization-detect,
 * content-gaps, and anomaly-diagnosis in parallel, then cross-references
 * findings into a unified health score + insight chains.
 */

import { z } from 'zod';

// ── Input ───────────────────────────────────────────────────────────

export const SiteHealthPulseInputSchema = z.object({
  // Page data — drives page-scorer + cannibalization
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
    keywords: z.array(z.string()).optional(),
    position: z.number().optional(),
    clicks: z.number().optional(),
    impressions: z.number().optional()
  })).min(1).max(20, 'Maximum 20 pages per pulse check'),

  // Anomaly data — drives anomaly-diagnosis
  anomalies: z.array(z.object({
    type: z.string(),
    severity: z.string(),
    metric: z.string().optional(),
    currentValue: z.number().optional(),
    expectedValue: z.number().optional(),
    details: z.string().optional()
  })).optional().default([]),

  currentData: z.object({
    period: z.object({
      start: z.string().optional(),
      end: z.string().optional()
    }).optional(),
    totalClicks: z.number().optional(),
    totalImpressions: z.number().optional(),
    avgCTR: z.number().optional(),
    avgPosition: z.number().optional()
  }).optional().default({}),

  // Content gap data — drives content-gaps
  siteKeywords: z.array(z.string()).optional().default([]),
  competitorKeywords: z.array(z.object({
    keyword: z.string(),
    source: z.string().optional(),
    position: z.number().optional(),
    volume: z.number().optional()
  })).optional().default([]),

  // Shared context
  context: z.object({
    siteUrl: z.string().optional(),
    industry: z.string().optional(),
    targetAudience: z.string().optional()
  }).optional().default({})
});

// ── Output ──────────────────────────────────────────────────────────

const InsightSchema = z.object({
  id: z.string(),
  type: z.enum(['cross-capability', 'single-capability', 'warning']),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  title: z.string(),
  description: z.string(),
  capabilities: z.array(z.string()),
  affectedUrls: z.array(z.string()).optional(),
  suggestedAction: z.string()
});

const DimensionSummarySchema = z.object({
  score: z.number().min(0).max(100),
  grade: z.enum(['A+', 'A', 'B', 'C', 'D', 'F']),
  issueCount: z.number(),
  topIssue: z.string().nullable()
});

export const SiteHealthPulseOutputSchema = z.object({
  healthScore: z.number().min(0).max(100),
  grade: z.enum(['A+', 'A', 'B', 'C', 'D', 'F']),
  dimensions: z.object({
    pageQuality: DimensionSummarySchema,
    cannibalization: DimensionSummarySchema,
    contentCoverage: DimensionSummarySchema,
    anomalyRisk: DimensionSummarySchema
  }),
  insights: z.array(InsightSchema),
  topPriorities: z.array(z.object({
    rank: z.number(),
    title: z.string(),
    category: z.string(),
    impact: z.enum(['critical', 'high', 'medium', 'low']),
    effort: z.enum(['quick-win', 'moderate', 'major'])
  })).max(5),
  summary: z.string(),
  capabilitiesRun: z.array(z.string()),
  metadata: z.object({
    durationMs: z.number().optional(),
    subCapabilities: z.record(z.object({
      ran: z.boolean(),
      durationMs: z.number().optional(),
      error: z.string().optional()
    })).optional()
  }).passthrough().optional()
});
