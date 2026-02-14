/**
 * Capability 7: Smart Forecasting (v2)
 *
 * LLM-powered trend interpretation + computational forecasting.
 *
 * Enhanced with:
 *   - math-utils for statistical computation (holtWinters, seasonalDecompose, detectChangePoints)
 *   - Computational forecasting as primary, LLM for narrative + insight
 *   - Zod schema validation + structured output
 *   - Few-shot forecast context
 */

import { createLogger } from '../lib/framework-shims.mjs';
import { runTextGeneration } from '../providers/ai-provider.mjs';
import { SmartForecastInputSchema, SmartForecastOutputSchema, SMART_FORECAST_JSON_SCHEMA } from '../lib/schemas/index.mjs';
import { parseAndValidate } from '../lib/response-parser.mjs';
import { formatForecastExamples } from '../lib/few-shot/index.mjs';
import { validateInput } from '../lib/validate-input.mjs';
import {
  descriptiveStats, avg, linearSlope, linearRegression, movingAverage,
  exponentialSmoothing, holtWinters, seasonalDecompose, detectChangePoints, round
} from '../lib/math-utils.mjs';

const logger = createLogger('ai-forecast');

export async function smartForecast(body, env) {
  const v = validateInput(SmartForecastInputSchema, body);
  if (!v.valid) return v.error;

  const { timeSeries = [], forecastDays = 14, context = '', metrics: requestedMetrics } = v.data;

  if (timeSeries.length < 7) {
    return { error: 'Need at least 7 data points for meaningful forecasting', dataPoints: timeSeries.length };
  }

  const metricsToForecast = requestedMetrics || ['impressions', 'clicks', 'ctr', 'position'];
  const stats = computeBasicStats(timeSeries, metricsToForecast);

  // ── Phase 1: Computational forecasting ─────────────────────────────
  const computedForecasts = {};
  for (const metric of metricsToForecast) {
    const values = timeSeries.map(d => d[metric]).filter(v => v != null);
    if (values.length < 7) continue;

    const ds = descriptiveStats(values);
    const slope = linearSlope(values);
    const changePoints = detectChangePoints(values, 7, 1.5);

    // Seasonal decomposition — detect weekly patterns (period=7 for daily data)
    const period = 7;
    const decomp = values.length >= period * 2 ? seasonalDecompose(values, period) : null;
    const hasSeasonality = decomp
      ? decomp.seasonal.some(s => Math.abs(s) > ds.stdDev * 0.15)
      : false;

    // Select forecast method based on data characteristics
    let forecastValues, method;
    if (values.length >= 14) {
      // Try Holt-Winters (double exponential) for trending data
      const hw = holtWinters(values, 0.3, 0.1, forecastDays);
      forecastValues = hw.forecast;
      method = 'holt-winters';

      // If seasonality detected, add seasonal adjustment to forecasts
      if (hasSeasonality && decomp) {
        forecastValues = forecastValues.map((v, i) => {
          const seasonalAdj = decomp.seasonal[(values.length + i) % period];
          return round(v + seasonalAdj, 2);
        });
        method = 'holt-winters+seasonal';
      }
    } else {
      // Fallback to exponential smoothing for short series
      const lastSmoothed = exponentialSmoothing(values);
      // Project forward linearly from last smoothed value
      forecastValues = Array.from({ length: forecastDays }, (_, i) =>
        round(lastSmoothed + slope * (i + 1), 2)
      );
      method = 'exponential-smoothing+trend';
    }

    // Confidence intervals (±1.5 stddev)
    const margin = ds.stdDev * 1.5;
    const forecastWithBounds = forecastValues.map((v, i) => {
      const date = futureDate(timeSeries, i);
      return {
        date,
        value: round(Math.max(0, v), 2),
        lower: round(Math.max(0, v - margin * (1 + i * 0.02)), 2),
        upper: round(v + margin * (1 + i * 0.02), 2)
      };
    });

    const trend = slope > ds.stdDev * 0.1 ? 'increasing'
      : slope < -ds.stdDev * 0.1 ? 'decreasing'
      : ds.stdDev / ds.mean > 0.3 ? 'volatile' : 'stable';

    computedForecasts[metric] = {
      metric,
      method,
      trend,
      trendStrength: round(Math.min(1, Math.abs(slope) / (ds.stdDev || 1)), 2),
      seasonalityDetected: hasSeasonality,
      seasonalPattern: hasSeasonality && decomp ? decomp.seasonal.slice(0, period).map(s => round(s, 2)) : null,
      forecast: forecastWithBounds,
      changePoints: changePoints.map(cp => ({
        index: cp.index,
        date: timeSeries[cp.index]?.date || '',
        direction: cp.direction
      }))
    };
  }

  // ── Phase 2: LLM narrative + insight generation ────────────────────
  const result = await runTextGeneration({
    systemPrompt: buildForecastSystemPrompt(),
    userPrompt: buildForecastUserPrompt(timeSeries, stats, forecastDays, context, computedForecasts),
    complexity: 'standard',
    capability: 'smart-forecast',
    maxTokens: 3000,
    jsonMode: true,
    jsonSchema: SMART_FORECAST_JSON_SCHEMA
  }, env);

  // Parse LLM output for narrative insights
  const { data: llmData, meta } = parseAndValidate(
    result.text,
    SmartForecastOutputSchema,
    {
      fallback: () => ({}),
      expect: 'object'
    }
  );

  // Merge: computational forecasts are authoritative, LLM provides narrative
  // Dual output: both statistical and LLM-adjusted forecasts
  const mergedForecasts = {};
  for (const [metric, computed] of Object.entries(computedForecasts)) {
    const llmMetric = llmData?.forecasts?.[metric] || {};
    mergedForecasts[metric] = {
      ...computed,
      trend: llmMetric.trend || computed.trend,
      keyInsight: llmMetric?.reasoning || null,
      // Dual output: statistical vs LLM-adjusted forecasts
      statisticalForecast: computed.forecast,
      llmAdjusted: llmMetric.forecastMid != null ? {
        mid: llmMetric.forecastMid,
        low: llmMetric.forecastLow,
        high: llmMetric.forecastHigh,
        confidence: llmMetric.confidence
      } : null
    };
  }

  // Store forecast in KV for future accuracy tracking
  if (env.KV_AI) {
    try {
      const forecastKey = `forecast:${new Date().toISOString().split('T')[0]}:${forecastDays}d`;
      const forecastRecord = {
        date: new Date().toISOString(),
        forecastDays,
        metrics: Object.fromEntries(
          Object.entries(computedForecasts).map(([k, v]) => [k, {
            method: v.method,
            values: v.forecast.slice(0, 7).map(p => p.value)
          }])
        )
      };
      await env.KV_AI.put(forecastKey, JSON.stringify(forecastRecord), { expirationTtl: 2592000 }); // 30 days
    } catch (err) {
      logger.warn('Failed to store forecast for accuracy tracking:', err.message);
    }
  }

  logger.info(`Forecast generated via ${result.provider} — ${forecastDays} days ahead`, {
    metrics: Object.keys(computedForecasts),
    parseMethod: meta.parseMethod
  });

  return {
    _input: {
      dataPoints: timeSeries.length,
      fieldsReceived: Object.keys(body)
    },
    forecasts: mergedForecasts,
    summary: llmData?.summary || {
      dataPoints: timeSeries.length,
      forecastHorizon: forecastDays,
      primaryTrend: Object.values(computedForecasts)[0]?.trend || 'stable',
      keyInsight: 'Computational forecast generated from time series data.'
    },
    warnings: llmData?.warnings || [],
    stats,
    metadata: {
      provider: result.provider,
      model: result.model,
      dataPoints: timeSeries.length,
      forecastDays,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
      durationMs: result.durationMs,
      forecastMethods: Object.fromEntries(
        Object.entries(computedForecasts).map(([k, v]) => [k, v.method])
      ),
      parseQuality: {
        method: meta.parseMethod,
        schemaValid: meta.schemaValid,
        fallbackUsed: meta.fallbackUsed
      }
    }
  };
}

function futureDate(timeSeries, offsetDays) {
  const lastDate = timeSeries[timeSeries.length - 1]?.date;
  if (!lastDate) return `day+${offsetDays + 1}`;
  const d = new Date(lastDate);
  d.setDate(d.getDate() + offsetDays + 1);
  return d.toISOString().split('T')[0];
}

function computeBasicStats(timeSeries, metricsToForecast) {
  const stats = {};

  for (const metric of metricsToForecast) {
    const values = timeSeries.map(d => d[metric]).filter(v => v != null);
    if (values.length === 0) continue;

    const ds = descriptiveStats(values);
    const slope = linearSlope(values);

    const recentWeek = values.slice(-7);
    const previousWeek = values.slice(-14, -7);
    const weekOverWeek = previousWeek.length > 0
      ? ((avg(recentWeek) - avg(previousWeek)) / Math.max(avg(previousWeek), 1)) * 100
      : 0;

    stats[metric] = {
      current: values[values.length - 1],
      mean: round(ds.mean, 2),
      min: ds.min,
      max: ds.max,
      stdDev: round(ds.stdDev, 2),
      slope: round(slope, 4),
      direction: slope > 0.01 ? 'rising' : slope < -0.01 ? 'falling' : 'stable',
      weekOverWeek: round(weekOverWeek, 1),
      dataPoints: values.length,
      p25: round(ds.p25, 2),
      p75: round(ds.p75, 2)
    };
  }

  return stats;
}

// linearSlope and avg now imported from ../lib/math-utils.mjs

function buildForecastSystemPrompt() {
  const fewShot = formatForecastExamples();

  return `You are an expert SEO data scientist. You analyze website traffic time series data and generate contextual forecasts.

Unlike simple linear extrapolation, you consider:
1. SEASONALITY: Weekly patterns (weekday vs weekend), monthly cycles, holiday effects
2. TREND MOMENTUM: Is the trend accelerating, decelerating, or plateauing?
3. MEAN REVERSION: Spikes and drops tend to partially revert
4. ALGORITHM UPDATES: Google core updates can cause step-changes
5. CONTENT LIFECYCLE: New content surges then settles; aging content gradually decays
6. COMPETITIVE DYNAMICS: Position changes can cascade into traffic changes

${fewShot}

The system has already computed statistical forecasts. Your job is to:
1. Validate whether the computational forecast makes sense given the context
2. Identify the overall trend and provide a narrative summary
3. Flag risks and opportunities the numbers alone don't capture

RESPOND ONLY with this JSON:
{"forecasts":{"impressions":{"current":0,"forecastMid":0,"forecastLow":0,"forecastHigh":0,"confidence":0.0,"reasoning":"...","trend":"rising|falling|stable"},"clicks":{...},"ctr":{...},"position":{...}},"overallOutlook":"1-paragraph summary","risks":["..."],"opportunities":["..."]}`;
}

function buildForecastUserPrompt(timeSeries, stats, forecastDays, context, computedForecasts) {
  const recent = timeSeries.slice(-30);
  const dataBlock = recent.map(d =>
    `${d.date}: imp=${d.impressions || 'N/A'}, clicks=${d.clicks || 'N/A'}, ctr=${d.ctr ? (d.ctr * 100).toFixed(1) + '%' : 'N/A'}, pos=${d.position ? d.position.toFixed(1) : 'N/A'}`
  ).join('\n');

  const statsBlock = Object.entries(stats).map(([metric, s]) =>
    `${metric}: current=${s.current}, mean=${s.mean}, slope=${s.slope} (${s.direction}), WoW=${s.weekOverWeek}%, stdDev=${s.stdDev}`
  ).join('\n');

  const forecastBlock = Object.entries(computedForecasts).map(([metric, f]) =>
    `${metric}: method=${f.method}, trend=${f.trend}, next5=[${f.forecast.slice(0, 5).map(p => p.value).join(', ')}], changePoints=${f.changePoints.length}`
  ).join('\n');

  let prompt = `TIME SERIES DATA (${recent.length} data points):\n${dataBlock}\n\nSTATISTICAL SUMMARY:\n${statsBlock}\n\nCOMPUTED FORECASTS:\n${forecastBlock}\n\nFORECAST HORIZON: ${forecastDays} days`;
  if (context) prompt += `\n\nADDITIONAL CONTEXT: ${context}`;
  return prompt;
}

// parseForecastResponse and fallbackForecast replaced by parseAndValidate + computational forecasting
