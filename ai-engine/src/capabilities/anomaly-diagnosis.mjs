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
import { AnomalyInputSchema, AnomalyDiagnoseOutputSchema, ANOMALY_JSON_SCHEMA } from '../lib/schemas/index.mjs';
import { parseAndValidate } from '../lib/response-parser.mjs';
import { formatAnomalyExamples } from '../lib/few-shot/index.mjs';
import { formatUpdatesForPrompt } from '../lib/seo-knowledge/index.mjs';
import { validateInput } from '../lib/validate-input.mjs';
import { zScore, percentChange, round } from '../lib/math-utils.mjs';

const logger = createLogger('ai-anomaly');

export async function diagnoseAnomalies(body, env) {
  const v = validateInput(AnomalyInputSchema, body);
  if (!v.valid) return v.error;

  const { anomalies = [], currentData = {} } = v.data;

  if (!anomalies.length) {
    return { diagnoses: [], message: 'No anomalies to diagnose' };
  }

  const topAnomalies = anomalies
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
    .slice(0, 5);

  // ── Phase 0: Deterministic z-score scoring ─────────────────────────
  const scoredAnomalies = topAnomalies.map(a => scoreAnomaly(a));
  const patternMatches = scoredAnomalies.map(a => matchKnownPattern(a));

  // Determine date range for Google Update correlation
  const period = currentData.period || {};
  const updateContext = period.start && period.end
    ? formatUpdatesForPrompt(period.start, period.end)
    : 'No date range provided — cannot correlate with confirmed Google updates.';

  const result = await runTextGeneration({
    systemPrompt: buildDiagnosisSystemPrompt(updateContext),
    userPrompt: buildDiagnosisUserPrompt(scoredAnomalies, currentData, patternMatches),
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

  const diagnoses = (parsed?.diagnoses || fallbackDiagnoses(topAnomalies)).map((d, i) => {
    const explainability = generateExplainability(d, scoredAnomalies[i], patternMatches[i]);
    return {
      anomalyId: d.anomalyId || topAnomalies[i]?.id || `anomaly-${i}`,
      likelyCause: d.likelyCause || 'Unknown',
      confidence: Math.max(0, Math.min(1, d.confidence ?? 0.5)),
      immediateAction: d.immediateAction || 'Monitor closely for 48 hours',
      investigationSteps: d.investigationSteps || [],
      isRealProblem: d.isRealProblem !== false,
      severity: d.severity || topAnomalies[i]?.severity || 'warning',
      zScoreMagnitude: scoredAnomalies[i]?.zScoreMagnitude ?? null,
      changePct: scoredAnomalies[i]?.changePct ?? null,
      patternMatch: patternMatches[i] || null,
      source: meta.fallbackUsed ? 'ai-engine-fallback' : 'ai-engine',
      ...explainability
    };
  });

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
6. explanation: Plain-language summary explaining the diagnosis and confidence level
7. confidenceBreakdown: Object with primarySignal (key evidence), alternativeCauses (other possibilities), dataQuality (assessment of data reliability)
8. nextSteps: Array of prioritized follow-up actions beyond immediateAction

IMPORTANT: If the date range overlaps with a confirmed Google algorithm update listed above,
you MUST mention it by name and explain how that specific update type could cause the observed change.

${fewShot}

RESPOND ONLY with this JSON:
{"diagnoses":[{"anomalyId":"...","likelyCause":"...","confidence":0.0,"immediateAction":"...","investigationSteps":["..."],"isRealProblem":true,"severity":"critical|warning|info","explanation":"...","confidenceBreakdown":{"primarySignal":"...","alternativeCauses":["..."],"dataQuality":"..."},"nextSteps":["..."]}]}`;
}

function buildDiagnosisUserPrompt(anomalies, currentData, patternMatches = []) {
  const anomalyBlock = anomalies.map((a, i) => {
    const pm = patternMatches[i];
    const patternInfo = pm ? `\n  Pattern match: ${pm.label} (likely: ${pm.likelyCauses.join(', ')})` : '';
    const zInfo = a.zScoreMagnitude != null ? `\n  Z-score magnitude: ${a.zScoreMagnitude}` : '';
    const changePctInfo = a.changePct != null ? `\n  Change %: ${a.changePct}%` : '';

    return `ANOMALY ${i + 1} (${a.severity || 'unknown'}):
  Type: ${a.type || 'unknown'}
  Description: ${a.description || a.message || 'No description'}
  Affected: ${a.keyword || a.page || a.query || 'N/A'}
  Previous value: ${a.previousValue ?? 'N/A'}
  Current value: ${a.currentValue ?? 'N/A'}
  Change magnitude: ${a.magnitude || a.changePercent || 'N/A'}${changePctInfo}${zInfo}${patternInfo}`;
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

function generateExplainability(diagnosis, anomalyData, patternMatch) {
  const { likelyCause, confidence, immediateAction, investigationSteps, isRealProblem, severity } = diagnosis;
  const { changePct, zScoreMagnitude } = anomalyData;

  // Plain-language explanation
  let explanation = 'This anomaly appears to be caused by ' + likelyCause;
  if (confidence > 0.8) {
    explanation += ', and we\'re highly confident in this diagnosis based on the data patterns.';
  } else if (confidence > 0.5) {
    explanation += ', with moderate confidence-further investigation recommended.';
  } else {
    explanation += ', but confidence is low; this could be a data artifact.';
  }

  if (changePct) {
    explanation += ' The metric changed by ' + changePct + '%, which ';
    if (Math.abs(changePct) > 50) explanation += 'is a significant shift.';
    else explanation += 'is a notable but not extreme change.';
  }

  // Confidence breakdown
  const confidenceBreakdown = {
    primarySignal: patternMatch ? 'Matches known pattern: ' + patternMatch.label : 'Based on statistical analysis and SEO knowledge',
    alternativeCauses: patternMatch ? patternMatch.likelyCauses.filter(c => c !== likelyCause) : ['Data artifact', 'Measurement error', 'External factors'],
    dataQuality: zScoreMagnitude ? (zScoreMagnitude > 2 ? 'High statistical significance' : 'Moderate statistical significance') : 'Limited quantitative data'
  };

  // Next steps
  const nextSteps = [
    immediateAction,
    ...investigationSteps,
    'Monitor the metric for 48-72 hours to confirm trend',
    'Document findings and any actions taken for future reference'
  ];

  return { explanation, confidenceBreakdown, nextSteps };
}

function severityRank(s) {
  return { critical: 0, warning: 1, info: 2 }[s] ?? 3;
}

// ── Z-Score Anomaly Scoring ───────────────────────────────────────────

function scoreAnomaly(anomaly) {
  const prev = parseFloat(anomaly.previousValue);
  const curr = parseFloat(anomaly.currentValue);

  if (isNaN(prev) || isNaN(curr)) {
    return { ...anomaly, zScoreMagnitude: null, changePct: null };
  }

  const changePct = round(percentChange(prev, curr), 2);
  const approxStdDev = Math.abs(prev) * 0.15 || 1;
  const z = round(zScore(curr, prev, approxStdDev), 2);

  return { ...anomaly, zScoreMagnitude: Math.abs(z), changePct };
}

// ── Pattern Library — Known Anomaly Signatures ───────────────────────

const ANOMALY_PATTERNS = [
  {
    id: 'sudden-position-drop',
    match: (a) => a.type?.includes('position') && a.changePct < -50,
    label: 'Sudden Position Drop',
    likelyCauses: ['algorithm-update', 'technical-issue', 'manual-action'],
    urgency: 'critical'
  },
  {
    id: 'ctr-drop-stable-position',
    match: (a) => a.type?.includes('ctr') && a.changePct < -20,
    label: 'CTR Drop (possible SERP feature displacement)',
    likelyCauses: ['competitor-action', 'serp-feature-change'],
    urgency: 'warning'
  },
  {
    id: 'impression-spike',
    match: (a) => a.type?.includes('impression') && a.changePct > 100,
    label: 'Sudden Impression Spike',
    likelyCauses: ['trending-topic', 'indexing-burst', 'seasonal-pattern'],
    urgency: 'info'
  },
  {
    id: 'traffic-cliff',
    match: (a) => (a.type?.includes('click') || a.type?.includes('traffic')) && a.changePct < -50,
    label: 'Traffic Cliff',
    likelyCauses: ['algorithm-update', 'technical-issue', 'content-removal'],
    urgency: 'critical'
  },
  {
    id: 'gradual-decline',
    match: (a) => a.changePct != null && a.changePct < -15 && a.changePct > -50,
    label: 'Gradual Metric Decline',
    likelyCauses: ['content-decay', 'competitor-action', 'seasonal-pattern'],
    urgency: 'warning'
  },
  {
    id: 'zero-traffic',
    match: (a) => a.currentValue === 0 && a.previousValue > 0,
    label: 'Zero Traffic / Complete Loss',
    likelyCauses: ['deindexed', 'technical-issue', 'redirect-error'],
    urgency: 'critical'
  }
];

function matchKnownPattern(anomaly) {
  for (const pattern of ANOMALY_PATTERNS) {
    try {
      if (pattern.match(anomaly)) {
        return {
          patternId: pattern.id,
          label: pattern.label,
          likelyCauses: pattern.likelyCauses,
          urgency: pattern.urgency
        };
      }
    } catch { /* pattern match failed, skip */ }
  }
  return null;
}

export { scoreAnomaly, matchKnownPattern, ANOMALY_PATTERNS };
