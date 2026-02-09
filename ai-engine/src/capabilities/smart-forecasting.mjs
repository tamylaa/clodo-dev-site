/**
 * Capability 7: Smart Forecasting
 * 
 * LLM-powered trend interpretation that understands seasonality,
 * algorithm updates, competitive shifts, and content lifecycle patterns.
 */

import { createLogger } from '@tamyla/clodo-framework';
import { runTextGeneration } from '../providers/ai-provider.mjs';

const logger = createLogger('ai-forecast');

export async function smartForecast(body, env) {
  const { timeSeries = [], forecastDays = 14, context = '' } = body;

  if (timeSeries.length < 7) {
    return { error: 'Need at least 7 data points for meaningful forecasting', dataPoints: timeSeries.length };
  }

  const stats = computeBasicStats(timeSeries);

  const result = await runTextGeneration({
    systemPrompt: buildForecastSystemPrompt(),
    userPrompt: buildForecastUserPrompt(timeSeries, stats, forecastDays, context),
    complexity: 'standard',
    capability: 'smart-forecast',
    maxTokens: 3000
  }, env);

  const forecast = parseForecastResponse(result.text, stats, forecastDays);

  logger.info(`Forecast generated via ${result.provider} — ${forecastDays} days ahead`);

  return {
    forecast,
    stats,
    metadata: {
      provider: result.provider,
      model: result.model,
      dataPoints: timeSeries.length,
      forecastDays,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
      durationMs: result.durationMs
    }
  };
}

function computeBasicStats(timeSeries) {
  const metrics = ['impressions', 'clicks', 'ctr', 'position'];
  const stats = {};

  for (const metric of metrics) {
    const values = timeSeries.map(d => d[metric]).filter(v => v != null);
    if (values.length === 0) continue;

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((s, v) => s + v, 0);
    const mean = sum / values.length;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
    const slope = linearSlope(values);

    const recentWeek = values.slice(-7);
    const previousWeek = values.slice(-14, -7);
    const weekOverWeek = previousWeek.length > 0
      ? ((avg(recentWeek) - avg(previousWeek)) / Math.max(avg(previousWeek), 1)) * 100
      : 0;

    stats[metric] = {
      current: values[values.length - 1],
      mean: parseFloat(mean.toFixed(2)),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      stdDev: parseFloat(Math.sqrt(variance).toFixed(2)),
      slope: parseFloat(slope.toFixed(4)),
      direction: slope > 0.01 ? 'rising' : slope < -0.01 ? 'falling' : 'stable',
      weekOverWeek: parseFloat(weekOverWeek.toFixed(1)),
      dataPoints: values.length
    };
  }

  return stats;
}

function linearSlope(values) {
  const n = values.length;
  if (n < 2) return 0;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += values[i]; sumXY += i * values[i]; sumX2 += i * i;
  }
  const denom = n * sumX2 - sumX * sumX;
  return denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
}

function avg(arr) {
  return arr.length === 0 ? 0 : arr.reduce((s, v) => s + v, 0) / arr.length;
}

function buildForecastSystemPrompt() {
  return `You are an expert SEO data scientist. You analyze website traffic time series data and generate contextual forecasts.

Unlike simple linear extrapolation, you consider:
1. SEASONALITY: Weekly patterns (weekday vs weekend), monthly cycles, holiday effects
2. TREND MOMENTUM: Is the trend accelerating, decelerating, or plateauing?
3. MEAN REVERSION: Spikes and drops tend to partially revert
4. ALGORITHM UPDATES: Google core updates can cause step-changes
5. CONTENT LIFECYCLE: New content surges then settles; aging content gradually decays
6. COMPETITIVE DYNAMICS: Position changes can cascade into traffic changes

For each metric, provide:
- forecast: predicted value range (low, mid, high) for the forecast period
- confidence: 0.0-1.0
- reasoning: 1-2 sentences explaining the prediction
- risks: potential events that could invalidate the forecast
- opportunities: actions that could beat the forecast

RESPOND ONLY with this JSON:
{"forecasts":{"impressions":{"current":0,"forecastMid":0,"forecastLow":0,"forecastHigh":0,"confidence":0.0,"reasoning":"...","trend":"rising|falling|stable"},"clicks":{...},"ctr":{...},"position":{...}},"overallOutlook":"1-paragraph summary","risks":["..."],"opportunities":["..."]}`;
}

function buildForecastUserPrompt(timeSeries, stats, forecastDays, context) {
  const recent = timeSeries.slice(-30);
  const dataBlock = recent.map(d =>
    `${d.date}: imp=${d.impressions || 'N/A'}, clicks=${d.clicks || 'N/A'}, ctr=${d.ctr ? (d.ctr * 100).toFixed(1) + '%' : 'N/A'}, pos=${d.position ? d.position.toFixed(1) : 'N/A'}`
  ).join('\n');

  const statsBlock = Object.entries(stats).map(([metric, s]) =>
    `${metric}: current=${s.current}, mean=${s.mean}, slope=${s.slope} (${s.direction}), WoW=${s.weekOverWeek}%, stdDev=${s.stdDev}`
  ).join('\n');

  let prompt = `TIME SERIES DATA (${recent.length} data points):\n${dataBlock}\n\nSTATISTICAL SUMMARY:\n${statsBlock}\n\nFORECAST HORIZON: ${forecastDays} days`;
  if (context) prompt += `\n\nADDITIONAL CONTEXT: ${context}`;
  return prompt;
}

function parseForecastResponse(text, stats, forecastDays) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallbackForecast(stats, forecastDays);

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      forecasts: parsed.forecasts || {},
      overallOutlook: parsed.overallOutlook || 'Unable to generate outlook',
      risks: parsed.risks || [],
      opportunities: parsed.opportunities || [],
      source: 'ai-engine',
      forecastDays
    };
  } catch (err) {
    logger.warn('Failed to parse forecast response:', err.message);
    return fallbackForecast(stats, forecastDays);
  }
}

function fallbackForecast(stats, forecastDays) {
  const forecasts = {};
  for (const [metric, s] of Object.entries(stats)) {
    const projected = s.current + (s.slope * forecastDays);
    forecasts[metric] = {
      current: s.current,
      forecastMid: parseFloat(Math.max(0, projected).toFixed(2)),
      forecastLow: parseFloat(Math.max(0, projected - s.stdDev).toFixed(2)),
      forecastHigh: parseFloat((projected + s.stdDev).toFixed(2)),
      confidence: 0.3,
      reasoning: 'Fallback linear extrapolation — LLM response could not be parsed',
      trend: s.direction
    };
  }

  return {
    forecasts,
    overallOutlook: 'LLM forecast unavailable — showing linear trend extrapolation as fallback.',
    risks: ['This is a simple linear projection without contextual analysis'],
    opportunities: [],
    source: 'ai-engine-fallback',
    forecastDays
  };
}
