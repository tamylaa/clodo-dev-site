/**
 * Capability 3: Semantic Keyword Clustering via Embeddings (v2)
 *
 * Groups keywords by meaning using Cloudflare Workers AI embeddings.
 * Uses agglomerative clustering with Union-Find for efficiency.
 *
 * Enhanced with:
 *   - Shared math-utils (cosineSimilarity)
 *   - Zod schema validation on output
 *   - Silhouette scoring for cluster quality
 *   - Optional LLM cluster labelling
 *   - Inter-cluster similarity matrix
 *   - Content hub mapping suggestions
 */

import { createLogger } from '../lib/framework-shims.mjs';
import { runEmbeddings, runTextGeneration } from '../providers/ai-provider.mjs';
import { cosineSimilarity, avg, round } from '../lib/math-utils.mjs';
import { EmbeddingClusterInputSchema, EmbeddingClusterOutputSchema } from '../lib/schemas/index.mjs';
import { validateInput } from '../lib/validate-input.mjs';

const logger = createLogger('ai-embeddings');

export async function clusterByEmbeddings(body, env) {
  const v = validateInput(EmbeddingClusterInputSchema, body);
  if (!v.valid) return v.error;

  const { keywords = [], minSimilarity = 0.7 } = v.data;

  if (keywords.length < 2) {
    return { clusters: [], orphans: keywords, stats: { total: keywords.length, clustered: 0 } };
  }

  const queries = keywords.map(kw => typeof kw === 'string' ? kw : kw.query || kw.keyword || '');
  const validIdx = queries.map((q, i) => q.length > 0 ? i : -1).filter(i => i >= 0);
  const validQueries = validIdx.map(i => queries[i]);

  if (validQueries.length < 2) {
    return { clusters: [], orphans: keywords, stats: { total: keywords.length, clustered: 0 } };
  }

  const allEmbeddings = [];
  const batchSize = 100;

  for (let i = 0; i < validQueries.length; i += batchSize) {
    const batch = validQueries.slice(i, i + batchSize);
    const result = await runEmbeddings(batch, env);
    allEmbeddings.push(...result.embeddings);
  }

  logger.info(`Got ${allEmbeddings.length} embeddings, clustering with threshold ${minSimilarity}`);

  const clusters = agglomerativeCluster(validIdx, allEmbeddings, keywords, minSimilarity);
  const clusteredIndices = new Set(clusters.flatMap(c => c.keywordIndices));
  const orphans = keywords.filter((_, i) => !clusteredIndices.has(i));
  const enrichedClusters = clusters.map(cluster => enrichCluster(cluster, keywords));

  // Phase 1: Compute silhouette scores for cluster quality assessment
  const clusterAssignments = buildClusterAssignments(validIdx, clusters, allEmbeddings.length);
  const silhouetteScores = computeSilhouetteScores(allEmbeddings, clusterAssignments);
  const avgSilhouette = silhouetteScores.length > 0 ? round(avg(silhouetteScores), 4) : null;

  // Phase 2: Compute inter-cluster similarity matrix
  const clusterCentroids = enrichedClusters.map((_, ci) => {
    const memberEmbIdx = clusters[ci].keywordIndices.map(ki => validIdx.indexOf(ki)).filter(i => i >= 0);
    return computeCentroid(memberEmbIdx.map(i => allEmbeddings[i]));
  });
  const interClusterSimilarity = computeInterClusterMatrix(clusterCentroids, enrichedClusters);

  // Phase 3: Optional LLM-based cluster labeling (only for <=20 clusters to control cost)
  let llmLabels = null;
  if (enrichedClusters.length >= 2 && enrichedClusters.length <= 20) {
    try {
      llmLabels = await generateLLMLabels(enrichedClusters, env);
    } catch (e) {
      logger.warn('LLM cluster labeling failed, using heuristic labels', { error: e.message });
    }
  }

  // Apply LLM labels if available
  if (llmLabels) {
    enrichedClusters.forEach((c, i) => {
      if (llmLabels[i]) {
        c.llmLabel = llmLabels[i].label;
        c.suggestedContentType = llmLabels[i].contentType;
      }
    });
  }

  // Phase 4: Content hub mapping
  const hubSuggestions = generateHubMapping(enrichedClusters, interClusterSimilarity);

  return {
    clusters: enrichedClusters,
    orphans: orphans.map(kw => typeof kw === 'string' ? { query: kw } : kw),
    stats: {
      total: keywords.length,
      clustered: clusteredIndices.size,
      orphaned: orphans.length,
      clusterCount: clusters.length,
      avgSilhouetteScore: avgSilhouette,
      clusterQuality: avgSilhouette !== null
        ? (avgSilhouette > 0.5 ? 'strong' : avgSilhouette > 0.25 ? 'moderate' : 'weak')
        : 'unknown',
      embeddingModel: env.CF_MODEL_EMBEDDING || '@cf/baai/bge-base-en-v1.5'
    },
    interClusterSimilarity,
    hubSuggestions,
    _provider: 'cloudflare'
  };
}

function agglomerativeCluster(validIdx, embeddings, keywords, minSimilarity) {
  const n = embeddings.length;
  const similarities = [];

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sim = cosineSimilarity(embeddings[i], embeddings[j]);
      if (sim >= minSimilarity) {
        similarities.push({ i, j, sim });
      }
    }
  }

  similarities.sort((a, b) => b.sim - a.sim);

  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x) => parent[x] === x ? x : (parent[x] = find(parent[x]));
  const union = (a, b) => { parent[find(a)] = find(b); };

  for (const { i, j } of similarities) {
    union(i, j);
  }

  const groups = {};
  for (let i = 0; i < n; i++) {
    const root = find(i);
    if (!groups[root]) groups[root] = [];
    groups[root].push(validIdx[i]);
  }

  return Object.values(groups)
    .filter(indices => indices.length >= 2)
    .map(indices => ({
      keywordIndices: indices,
      keywords: indices.map(i => {
        const kw = keywords[i];
        return typeof kw === 'string' ? kw : kw.query || kw.keyword;
      }),
      size: indices.length
    }));
}

function enrichCluster(cluster, allKeywords) {
  const kwData = cluster.keywordIndices.map(i => allKeywords[i]).filter(Boolean);
  const totalImpressions = kwData.reduce((s, kw) => s + (kw.impressions || 0), 0);
  const totalClicks = kwData.reduce((s, kw) => s + (kw.clicks || 0), 0);
  const avgPosition = kwData.length > 0
    ? kwData.reduce((s, kw) => s + (kw.position || 50), 0) / kwData.length : 0;

  const sorted = [...kwData].sort((a, b) => (b.impressions || 0) - (a.impressions || 0));
  const label = sorted[0]?.query || sorted[0]?.keyword || cluster.keywords[0] || 'Unknown cluster';

  return {
    label,
    keywords: cluster.keywords,
    keywordIndices: cluster.keywordIndices,
    size: cluster.size,
    totalImpressions,
    totalClicks,
    avgPosition: parseFloat(avgPosition.toFixed(1)),
    avgCTR: totalImpressions > 0 ? parseFloat((totalClicks / totalImpressions).toFixed(4)) : 0
  };
}

// cosineSimilarity now imported from ../lib/math-utils.mjs

// ── Silhouette Scoring ─────────────────────────────────────────────

/**
 * Build cluster assignment map: embeddingIndex -> clusterIndex (or -1 for orphans).
 */
function buildClusterAssignments(validIdx, clusters, embeddingCount) {
  const assignments = new Array(embeddingCount).fill(-1);
  clusters.forEach((cluster, ci) => {
    cluster.keywordIndices.forEach(ki => {
      const embIdx = validIdx.indexOf(ki);
      if (embIdx >= 0) assignments[embIdx] = ci;
    });
  });
  return assignments;
}

/**
 * Compute silhouette score for each clustered point.
 * s(i) = (b(i) - a(i)) / max(a(i), b(i))
 * where a(i) = avg distance to same-cluster points, b(i) = min avg distance to other clusters.
 */
function computeSilhouetteScores(embeddings, assignments) {
  const n = embeddings.length;
  const scores = [];

  for (let i = 0; i < n; i++) {
    if (assignments[i] === -1) continue; // skip orphans
    const myCluster = assignments[i];

    // a(i): avg distance to same-cluster members
    const sameCluster = [];
    const otherClusters = {};

    for (let j = 0; j < n; j++) {
      if (i === j || assignments[j] === -1) continue;
      const dist = 1 - cosineSimilarity(embeddings[i], embeddings[j]);
      if (assignments[j] === myCluster) {
        sameCluster.push(dist);
      } else {
        const cj = assignments[j];
        if (!otherClusters[cj]) otherClusters[cj] = [];
        otherClusters[cj].push(dist);
      }
    }

    if (sameCluster.length === 0) continue; // singleton in its cluster
    const a = avg(sameCluster);

    // b(i): min avg distance to any other cluster
    const otherAvgs = Object.values(otherClusters).map(dists => avg(dists));
    if (otherAvgs.length === 0) continue;
    const b = Math.min(...otherAvgs);

    const s = Math.max(a, b) === 0 ? 0 : (b - a) / Math.max(a, b);
    scores.push(s);
  }

  return scores;
}

// ── Inter-Cluster Similarity ──────────────────────────────────────

/**
 * Compute the centroid (mean embedding) for a group of embeddings.
 */
function computeCentroid(embeddings) {
  if (!embeddings.length) return [];
  const dim = embeddings[0].length;
  const centroid = new Array(dim).fill(0);
  for (const emb of embeddings) {
    for (let d = 0; d < dim; d++) centroid[d] += emb[d];
  }
  for (let d = 0; d < dim; d++) centroid[d] /= embeddings.length;
  return centroid;
}

/**
 * Build a matrix of pairwise cluster similarities using centroids.
 */
function computeInterClusterMatrix(centroids, clusters) {
  if (centroids.length < 2) return [];
  const matrix = [];
  for (let i = 0; i < centroids.length; i++) {
    for (let j = i + 1; j < centroids.length; j++) {
      if (centroids[i].length && centroids[j].length) {
        matrix.push({
          clusterA: clusters[i].label,
          clusterB: clusters[j].label,
          similarity: round(cosineSimilarity(centroids[i], centroids[j]), 4)
        });
      }
    }
  }
  return matrix.sort((a, b) => b.similarity - a.similarity);
}

// ── LLM Cluster Labeling ──────────────────────────────────────────

/**
 * Use LLM to generate semantic labels and content type suggestions for clusters.
 */
async function generateLLMLabels(clusters, env) {
  const clusterSummaries = clusters.map((c, i) =>
    `Cluster ${i + 1} (${c.size} keywords): ${c.keywords.slice(0, 8).join(', ')}${c.keywords.length > 8 ? '...' : ''}`
  ).join('\n');

  const result = await runTextGeneration({
    systemPrompt: `You are an SEO content strategist. For each keyword cluster, provide:
1. A concise semantic label (2-5 words) describing the topic
2. The best content type to target this cluster (blog-post, landing-page, guide, comparison, faq, tool-page)

Respond ONLY with JSON: {"labels":[{"label":"...","contentType":"..."}]}`,
    userPrompt: `Label these keyword clusters:\n${clusterSummaries}`,
    complexity: 'simple',
    capability: 'embedding-cluster-label',
    maxTokens: 1024,
    jsonMode: true
  }, env);

  try {
    const parsed = JSON.parse(result.text);
    return parsed.labels || null;
  } catch {
    return null;
  }
}

// ── Content Hub Mapping ───────────────────────────────────────────

/**
 * Suggest content hub structure based on cluster relationships.
 * Groups highly similar clusters into hub-and-spoke topics.
 */
function generateHubMapping(clusters, interClusterSim) {
  if (clusters.length < 2) return [];

  // Find pairs with similarity > 0.6 — these could be hub-spoke relationships
  const relatedPairs = interClusterSim.filter(p => p.similarity > 0.6);
  if (relatedPairs.length === 0) return [];

  // Build adjacency and find the cluster with most connections as hub
  const connections = {};
  for (const pair of relatedPairs) {
    connections[pair.clusterA] = (connections[pair.clusterA] || 0) + 1;
    connections[pair.clusterB] = (connections[pair.clusterB] || 0) + 1;
  }

  const hubs = Object.entries(connections)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label]) => {
      const spokes = relatedPairs
        .filter(p => p.clusterA === label || p.clusterB === label)
        .map(p => ({
          topic: p.clusterA === label ? p.clusterB : p.clusterA,
          similarity: p.similarity
        }))
        .sort((a, b) => b.similarity - a.similarity);

      const hubCluster = clusters.find(c => c.label === label);
      return {
        hubTopic: label,
        hubSize: hubCluster?.size || 0,
        totalImpressions: hubCluster?.totalImpressions || 0,
        spokes,
        suggestedPillarPage: `${label} — Comprehensive Guide`,
        internalLinkingOpportunity: spokes.length
      };
    });

  return hubs;
}

export { computeSilhouetteScores, computeCentroid, generateHubMapping };