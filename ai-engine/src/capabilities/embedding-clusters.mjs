/**
 * Capability 3: Semantic Keyword Clustering via Embeddings
 * 
 * Groups keywords by meaning using Cloudflare Workers AI embeddings.
 * Uses agglomerative clustering with Union-Find for efficiency.
 */

import { createLogger } from '@tamyla/clodo-framework';
import { runEmbeddings } from '../providers/ai-provider.mjs';

const logger = createLogger('ai-embeddings');

export async function clusterByEmbeddings(body, env) {
  const { keywords = [], minSimilarity = 0.7 } = body;

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

  return {
    clusters: enrichedClusters,
    orphans: orphans.map(kw => typeof kw === 'string' ? { query: kw } : kw),
    stats: {
      total: keywords.length,
      clustered: clusteredIndices.size,
      orphaned: orphans.length,
      clusterCount: clusters.length,
      embeddingModel: env.CF_MODEL_EMBEDDING || '@cf/baai/bge-base-en-v1.5'
    },
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

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
