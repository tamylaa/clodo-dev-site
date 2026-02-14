/**
 * Schema Validators — Runtime Shape Assertions for AI Engine Responses
 * 
 * Each validator checks the structural contract of a capability response.
 * Used by both unit tests and the live smoke test script.
 */

// ── Generic helpers ──────────────────────────────────────────────────

function assertType(value, type, path) {
  const actual = typeof value;
  if (actual !== type) {
    throw new Error(`${path}: expected ${type}, got ${actual} (${JSON.stringify(value)})`);
  }
}

function assertOneOf(value, allowed, path) {
  if (!allowed.includes(value)) {
    throw new Error(`${path}: expected one of [${allowed.join(', ')}], got "${value}"`);
  }
}

function assertArray(value, path) {
  if (!Array.isArray(value)) {
    throw new Error(`${path}: expected array, got ${typeof value}`);
  }
}

function assertRange(value, min, max, path) {
  if (typeof value !== 'number' || value < min || value > max) {
    throw new Error(`${path}: expected number in [${min}, ${max}], got ${value}`);
  }
}

function assertOptional(value, type, path) {
  if (value != null) assertType(value, type, path);
}

function assertObject(value, path) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${path}: expected object, got ${typeof value}`);
  }
}

// ── Metadata validator (shared across capabilities) ──────────────────

function validateMetadata(meta, path = 'metadata') {
  assertObject(meta, path);
  assertType(meta.provider, 'string', `${path}.provider`);
}

// ═══════════════════════════════════════════════════════════════════════
// Per-capability validators
// ═══════════════════════════════════════════════════════════════════════

export function validateIntentClassifyResponse(data) {
  assertArray(data.classifications, 'classifications');
  for (let i = 0; i < data.classifications.length; i++) {
    const c = data.classifications[i];
    const p = `classifications[${i}]`;
    assertType(c.query, 'string', `${p}.query`);
    assertOneOf(c.intent, ['transactional', 'commercial', 'informational', 'navigational'], `${p}.intent`);
    assertRange(c.confidence, 0, 1, `${p}.confidence`);
    assertRange(c.businessValue, 1, 10, `${p}.businessValue`);
    assertType(c.contentType, 'string', `${p}.contentType`);
    assertType(c.source, 'string', `${p}.source`);
  }
  validateMetadata(data.metadata);
  assertType(data.metadata.keywordsProcessed, 'number', 'metadata.keywordsProcessed');
  return true;
}

export function validateAnomalyDiagnoseResponse(data) {
  assertArray(data.diagnoses, 'diagnoses');
  for (let i = 0; i < data.diagnoses.length; i++) {
    const d = data.diagnoses[i];
    const p = `diagnoses[${i}]`;
    assertType(d.anomalyId, 'string', `${p}.anomalyId`);
    assertType(d.likelyCause, 'string', `${p}.likelyCause`);
    assertRange(d.confidence, 0, 1, `${p}.confidence`);
    assertType(d.immediateAction, 'string', `${p}.immediateAction`);
    assertArray(d.investigationSteps, `${p}.investigationSteps`);
    assertType(d.isRealProblem, 'boolean', `${p}.isRealProblem`);
    assertOneOf(d.severity, ['critical', 'warning', 'info'], `${p}.severity`);
  }
  validateMetadata(data.metadata);
  return true;
}

export function validateEmbeddingClusterResponse(data) {
  assertArray(data.clusters, 'clusters');
  for (let i = 0; i < data.clusters.length; i++) {
    const c = data.clusters[i];
    const p = `clusters[${i}]`;
    assertType(c.label, 'string', `${p}.label`);
    assertArray(c.keywords, `${p}.keywords`);
    assertType(c.size, 'number', `${p}.size`);
  }
  assertArray(data.orphans, 'orphans');
  assertObject(data.stats, 'stats');
  assertType(data.stats.total, 'number', 'stats.total');
  assertType(data.stats.clustered, 'number', 'stats.clustered');
  return true;
}

export function validateChatResponse(data) {
  assertType(data.response, 'string', 'response');
  if (data.response.length === 0) throw new Error('response: empty string');
  validateMetadata(data.metadata);
  assertType(data.metadata.conversationLength, 'number', 'metadata.conversationLength');
  return true;
}

export function validateContentRewriteResponse(data) {
  assertArray(data.rewrites, 'rewrites');
  for (let i = 0; i < data.rewrites.length; i++) {
    const r = data.rewrites[i];
    const p = `rewrites[${i}]`;
    assertType(r.url, 'string', `${p}.url`);
    assertObject(r.title, `${p}.title`);
    assertType(r.title.suggested, 'string', `${p}.title.suggested`);
    assertObject(r.description, `${p}.description`);
    assertObject(r.h1, `${p}.h1`);
    assertType(r.source, 'string', `${p}.source`);
  }
  validateMetadata(data.metadata);
  return true;
}

export function validateEATAssessResponse(data) {
  assertObject(data.scores, 'scores');
  assertType(data.scores.expertise, 'number', 'scores.expertise');
  assertType(data.scores.authoritativeness, 'number', 'scores.authoritativeness');
  assertType(data.scores.trustworthiness, 'number', 'scores.trustworthiness');
  assertType(data.scores.overall, 'number', 'scores.overall');
  assertObject(data.analysis, 'analysis');
  assertType(data.analysis.expertise, 'string', 'analysis.expertise');
  assertType(data.analysis.authoritativeness, 'string', 'analysis.authoritativeness');
  assertType(data.analysis.trustworthiness, 'string', 'analysis.trustworthiness');
  assertArray(data.recommendations, 'recommendations');
  validateMetadata(data.metadata);
  return true;
}

export function validateRefineRecsResponse(data) {
  assertArray(data.refined, 'refined');
  for (let i = 0; i < data.refined.length; i++) {
    const r = data.refined[i];
    const p = `refined[${i}]`;
    assertType(r.title, 'string', `${p}.title`);
    assertType(r.refinedBy, 'string', `${p}.refinedBy`);
  }
  assertType(data.critique, 'string', 'critique');
  validateMetadata(data.metadata);
  assertType(data.metadata.passes, 'number', 'metadata.passes');
  return true;
}

export function validateSmartForecastResponse(data) {
  assertObject(data.forecasts || data.forecast, 'forecasts');
  assertObject(data.stats, 'stats');
  validateMetadata(data.metadata);
  assertType(data.metadata.dataPoints, 'number', 'metadata.dataPoints');
  assertType(data.metadata.forecastDays, 'number', 'metadata.forecastDays');
  return true;
}

export function validateHealthResponse(data) {
  assertType(data.service, 'string', 'service');
  assertType(data.version, 'string', 'version');
  assertType(data.healthy, 'boolean', 'healthy');
  assertObject(data.checks, 'checks');
  return true;
}

export function validateCapabilitiesResponse(data) {
  assertType(data.engine, 'string', 'engine');
  assertArray(data.capabilities, 'capabilities');
  if (data.capabilities.length !== 7) {
    throw new Error(`capabilities: expected 7, got ${data.capabilities.length}`);
  }
  for (const cap of data.capabilities) {
    assertType(cap.id, 'string', 'capability.id');
    assertType(cap.endpoint, 'string', 'capability.endpoint');
    assertType(cap.method, 'string', 'capability.method');
  }
  return true;
}

export function validateProvidersResponse(data) {
  assertObject(data, 'providers');
  const expected = ['claude', 'openai', 'gemini', 'mistral', 'deepseek', 'cloudflare'];
  for (const id of expected) {
    assertObject(data[id], `providers.${id}`);
    assertType(data[id].available, 'boolean', `providers.${id}.available`);
  }
  return true;
}

// ── Cannibalization Detection ──────────────────────────────────────

export function validateCannibalizationResponse(data) {
  assertArray(data.conflicts, 'conflicts');
  for (const c of data.conflicts) {
    assertType(c.keyword, 'string', 'conflict.keyword');
    assertOneOf(c.severity, ['critical', 'high', 'medium', 'low'], 'conflict.severity');
    assertArray(c.pages, 'conflict.pages');
    assertType(c.recommendation, 'string', 'conflict.recommendation');
  }
  assertType(data.summary, 'string', 'summary');
  assertOneOf(data.overallSeverity, ['critical', 'high', 'medium', 'low', 'none'], 'overallSeverity');
  return true;
}

// ── Content Gaps ────────────────────────────────────────────────────

export function validateContentGapsResponse(data) {
  assertArray(data.gaps, 'gaps');
  for (const g of data.gaps) {
    assertType(g.keyword, 'string', 'gap.keyword');
    assertOneOf(g.opportunity, ['high', 'medium', 'low'], 'gap.opportunity');
    assertType(g.suggestedContentType, 'string', 'gap.suggestedContentType');
    assertType(g.suggestedTitle, 'string', 'gap.suggestedTitle');
    assertType(g.reasoning, 'string', 'gap.reasoning');
  }
  assertType(data.summary, 'string', 'summary');
  assertArray(data.topOpportunities, 'topOpportunities');
  return true;
}

// ── Page Scorer ─────────────────────────────────────────────────────

export function validatePageScorerResponse(data) {
  assertArray(data.scores, 'scores');
  for (const s of data.scores) {
    assertType(s.url, 'string', 'score.url');
    assertRange(s.overallScore, 0, 100, 'score.overallScore');
    assertOneOf(s.grade, ['A+', 'A', 'B', 'C', 'D', 'F'], 'score.grade');
    assertObject(s.dimensions, 'score.dimensions');
    assertType(s.topPriority, 'string', 'score.topPriority');
    assertOneOf(s.estimatedImpact, ['high', 'medium', 'low'], 'score.estimatedImpact');
  }
  assertRange(data.averageScore, 0, 100, 'averageScore');
  assertType(data.summary, 'string', 'summary');
  return true;
}

// ── Validator registry (maps capability id → validator function) ─────

export const VALIDATORS = {
  'intent-classify': validateIntentClassifyResponse,
  'anomaly-diagnose': validateAnomalyDiagnoseResponse,
  'embedding-cluster': validateEmbeddingClusterResponse,
  'chat': validateChatResponse,
  'content-rewrite': validateContentRewriteResponse,
  'eat-assess': validateEATAssessResponse,
  'refine-recs': validateRefineRecsResponse,
  'smart-forecast': validateSmartForecastResponse,
  'cannibalization-detect': validateCannibalizationResponse,
  'content-gaps': validateContentGapsResponse,
  'page-score': validatePageScorerResponse,
  'health': validateHealthResponse,
  'capabilities': validateCapabilitiesResponse,
  'providers': validateProvidersResponse
};
