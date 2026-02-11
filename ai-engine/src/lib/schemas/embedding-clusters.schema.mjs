/**
 * Zod Schemas — Embedding Clusters
 */

import { z } from 'zod';

const KeywordItem = z.union([
  z.string(),
  z.object({
    query: z.string().optional(),
    keyword: z.string().optional(),
    clicks: z.number().optional(),
    impressions: z.number().optional(),
    ctr: z.number().optional(),
    position: z.number().optional()
  })
]);

export const EmbeddingClusterInputSchema = z.object({
  keywords: z.array(KeywordItem).min(2, 'Need at least 2 keywords for clustering'),
  minSimilarity: z.number().min(0).max(1).default(0.7),
  method: z.enum(['agglomerative', 'kmeans']).default('agglomerative'),
  maxClusters: z.number().min(2).max(50).optional()
});

export const ClusterSchema = z.object({
  label: z.string(),
  keywords: z.array(z.string()),
  keywordIndices: z.array(z.number()),
  size: z.number(),
  totalImpressions: z.number().optional(),
  totalClicks: z.number().optional(),
  avgPosition: z.number().optional(),
  avgCTR: z.number().optional()
});

export const EmbeddingClusterOutputSchema = z.object({
  clusters: z.array(ClusterSchema),
  orphans: z.array(z.any()),
  stats: z.object({
    total: z.number(),
    clustered: z.number(),
    orphaned: z.number(),
    clusterCount: z.number(),
    embeddingModel: z.string().optional()
  })
});
