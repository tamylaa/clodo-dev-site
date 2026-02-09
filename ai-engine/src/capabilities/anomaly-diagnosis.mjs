/**
 * Capability 2: Anomaly Root-Cause Diagnosis
 * 
 * Uses LLM to diagnose WHY anomalies happened — algorithm update,
 * technical issue, competitor action, or seasonal pattern.
 */

import { createLogger } from '@tamyla/clodo-framework';
import { runTextGeneration } from '../providers/ai-provider.mjs';

const logger = createLogger('ai-anomaly');

export async function diagnoseAnomalies(body, env) {
  const { anomalies = [], currentData = {} } = body;

  if (!anomalies.length) {
    return { diagnoses: [], message: 'No anomalies to diagnose' };
  }

  const topAnomalies = anomalies
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
    .slice(0, 5);

  const result = await runTextGeneration({
    systemPrompt: buildDiagnosisSystemPrompt(),
    userPrompt: buildDiagnosisUserPrompt(topAnomalies, currentData),
    complexity: 'standard',
    capability: 'anomaly-diagnose',
    maxTokens: 3000
  }, env);

  const diagnoses = parseDiagnosisResponse(result.text, topAnomalies);

  logger.info(`Diagnosed ${diagnoses.length} anomalies via ${result.provider}`);

  return {
    diagnoses,
    metadata: {
      provider: result.provider,
      model: result.model,
      anomaliesProcessed: topAnomalies.length,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
      durationMs: result.durationMs
    }
  };
}

function buildDiagnosisSystemPrompt() {
  return `You are an expert SEO analyst performing URGENT anomaly diagnosis.
The system has detected sudden, significant metric changes.

For each anomaly, provide:
1. likelyCause: Most probable explanation (algorithm update, content change, technical issue, competitor action, seasonal pattern, data artifact)
2. confidence: 0.0-1.0 how sure you are
3. immediateAction: Specific, actionable step to take RIGHT NOW
4. investigationSteps: 2-3 follow-up checks to confirm the diagnosis
5. isRealProblem: true/false — is this a genuine issue or a data artifact?

Consider common causes:
- Google algorithm updates (core updates, spam updates, helpful content)
- Technical issues (site downtime, robots.txt changes, canonical errors, redirect chains)
- Content changes (page edits, URL changes, content removal)
- Competitor actions (new content, link building, SERP feature capture)
- Seasonal patterns (holiday traffic, industry cycles)
- Data artifacts (GSC reporting delays, sampling changes)

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

function parseDiagnosisResponse(text, originalAnomalies) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallbackDiagnoses(originalAnomalies);

    const parsed = JSON.parse(jsonMatch[0]);
    const diagnoses = parsed.diagnoses || parsed;
    if (!Array.isArray(diagnoses)) return fallbackDiagnoses(originalAnomalies);

    return diagnoses.map((d, i) => ({
      anomalyId: d.anomalyId || originalAnomalies[i]?.id || `anomaly-${i}`,
      likelyCause: d.likelyCause || 'Unknown',
      confidence: Math.max(0, Math.min(1, d.confidence || 0.5)),
      immediateAction: d.immediateAction || 'Monitor closely for 48 hours',
      investigationSteps: d.investigationSteps || [],
      isRealProblem: d.isRealProblem !== false,
      severity: d.severity || originalAnomalies[i]?.severity || 'warning',
      source: 'ai-engine'
    }));
  } catch (err) {
    logger.warn('Failed to parse diagnosis response:', err.message);
    return fallbackDiagnoses(originalAnomalies);
  }
}

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
