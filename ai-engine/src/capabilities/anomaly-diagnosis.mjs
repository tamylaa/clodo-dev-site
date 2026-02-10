/**
 * Capability 2: Anomaly Root-Cause Diagnosis (v2)
 *
 * Enhanced with:
 *   - Google Algorithm Update correlation (deterministic knowledge base)
 *   - Few-shot examples for consistent diagnosis quality
 *   - Zod schema validation on LLM output
 *   - Structured output (jsonMode) for cleaner parsing
 */

import { createLogger } from '../lib/framework-shims.mjs';
import { runTextGeneration } from '../providers/ai-provider.mjs';
import { AnomalyDiagnoseOutputSchema, ANOMALY_JSON_SCHEMA } from '../lib/schemas/index.mjs';
import { parseAndValidate } from '../lib/response-parser.mjs';
import { formatAnomalyExamples } from '../lib/few-shot/index.mjs';
import { formatUpdatesForPrompt } from '../lib/seo-knowledge/index.mjs';

const logger = createLogger('ai-anomaly');

export async function diagnoseAnomalies(body, env) {
  const { anomalies = [], currentData = {} } = body;

  if (!anomalies.length) {
    return { diagnoses: [], message: 'No anomalies to diagnose' };
  }

  const topAnomalies = anomalies
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
    .slice(0, 5);

  // Determine date range for Google Update correlation
  const period = currentData.period || {};
  const updateContext = period.start && period.end
    ? formatUpdatesForPrompt(period.start, period.end)
    : 'No date range provided — cannot correlate with confirmed Google updates.';

  const result = await runTextGeneration({
    systemPrompt: buildDiagnosisSystemPrompt(updateContext),
    userPrompt: buildDiagnosisUserPrompt(topAnomalies, currentData),
    complexity: 'standard',
    capability: 'anomaly-diagnose',
    maxTokens: 3000,
    jsonMode: true,
    jsonSchema: ANOMALY_JSON_SCHEMA
  }, env);

  const { data: parsed, meta } = parseAndValidate(
    result.text,
    AnomalyDiagnoseOutputSchema,
    {
      fallback: () => ({ diagnoses: fallbackDiagnoses(topAnomalies) }),
      expect: 'object'
    }
  );

  const diagnoses = (parsed?.diagnoses || fallbackDiagnoses(topAnomalies)).map((d, i) => ({
    anomalyId: d.anomalyId || topAnomalies[i]?.id || `anomaly-${i}`,
    likelyCause: d.likelyCause || 'Unknown',
    confidence: Math.max(0, Math.min(1, d.confidence ?? 0.5)),
    immediateAction: d.immediateAction || 'Monitor closely for 48 hours',
    investigationSteps: d.investigationSteps || [],
    isRealProblem: d.isRealProblem !== false,
    severity: d.severity || topAnomalies[i]?.severity || 'warning',
    source: meta.fallbackUsed ? 'ai-engine-fallback' : 'ai-engine'
  }));

  logger.info(`Diagnosed ${diagnoses.length} anomalies via ${result.provider}`, {
    parseMethod: meta.parseMethod,
    schemaValid: meta.schemaValid
  });

  return {
    diagnoses,
    metadata: {
      provider: result.provider,
      model: result.model,
      anomaliesProcessed: topAnomalies.length,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
      durationMs: result.durationMs,
      parseQuality: {
        method: meta.parseMethod,
        schemaValid: meta.schemaValid,
        fallbackUsed: meta.fallbackUsed
      }
    }
  };
}

function buildDiagnosisSystemPrompt(updateContext) {
  const fewShot = formatAnomalyExamples(2);

  return `You are an expert SEO analyst performing URGENT anomaly diagnosis.
The system has detected sudden, significant metric changes.

${updateContext}

For each anomaly, provide:
1. likelyCause: Most probable explanation (algorithm-update, content-change, technical-issue, competitor-action, seasonal-pattern, data-artifact)
2. confidence: 0.0-1.0 how sure you are
3. immediateAction: Specific, actionable step to take RIGHT NOW
4. investigationSteps: 2-3 follow-up checks to confirm the diagnosis
5. isRealProblem: true/false — is this a genuine issue or a data artifact?

IMPORTANT: If the date range overlaps with a confirmed Google algorithm update listed above,
you MUST mention it by name and explain how that specific update type could cause the observed change.

${fewShot}

RESPOND ONLY with this JSON:
{"diagnoses":[{"anomalyId":"...","likelyCause":"...","confidence":0.0,"immediateAction":"...","investigationSteps":["..."],"isRealProblem":true,"severity":"critical|warning|info"}]}`;
}

function buildDiagnosisUserPrompt(anomalies, currentData) {
  const anomalyBlock = anomalies.map((a, i) => {
    return `ANOMALY ${i + 1} (${a.severity || 'unknown'}):
  Type: ${a.type || 'unknown'}
  Description: ${a.description || a.message || 'No description'}
  Affected: ${a.keyword || a.page || a.query || 'N/A'}
  Previous value: ${a.previousValue ?? 'N/A'}
  Current value: ${a.currentValue ?? 'N/A'}
  Change magnitude: ${a.magnitude || a.changePercent || 'N/A'}`;
  }).join('\n\n');

  const contextBlock = currentData.summary ? `
SITE CONTEXT:
  Total impressions: ${currentData.summary.totalImpressions || 'N/A'}
  Total clicks: ${currentData.summary.totalClicks || 'N/A'}
  Average CTR: ${currentData.summary.avgCTR || 'N/A'}
  Average position: ${currentData.summary.avgPosition || 'N/A'}
  Period: ${currentData.period?.start || '?'} to ${currentData.period?.end || '?'}` : '';

  return `${anomalyBlock}\n${contextBlock}`;
}

function parseDiagnosisResponse_REMOVED() { /* replaced by parseAndValidate */ }

function fallbackDiagnoses(anomalies) {
  return anomalies.map((a, i) => ({
    anomalyId: a.id || `anomaly-${i}`,
    likelyCause: 'Unable to determine — LLM response could not be parsed',
    confidence: 0,
    immediateAction: 'Manual investigation required',
    investigationSteps: ['Check GSC for manual actions', 'Verify site uptime', 'Review recent content changes'],
    isRealProblem: true,
    severity: a.severity || 'warning',
    source: 'ai-engine-fallback'
  }));
}

function severityRank(s) {
  return { critical: 0, warning: 1, info: 2 }[s] ?? 3;
}
