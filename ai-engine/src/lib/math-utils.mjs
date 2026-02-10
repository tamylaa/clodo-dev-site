/**
 * Math Utilities — Shared Statistical Functions
 * 
 * Extracted from smart-forecasting.mjs and embedding-clusters.mjs.
 * Pure functions — no dependencies, Workers-safe.
 * 
 * Functions: descriptive stats, regression, time series, distance metrics.
 */

// ── Descriptive Statistics ───────────────────────────────────────────

/**
 * Compute descriptive statistics for a numeric array.
 */
export function descriptiveStats(values) {
  if (!values || values.length === 0) return null;
  const n = values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((s, v) => s + v, 0);
  const mean = sum / n;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);

  return {
    count: n,
    sum: round(sum, 4),
    mean: round(mean, 4),
    median: round(median(sorted), 4),
    min: sorted[0],
    max: sorted[n - 1],
    range: round(sorted[n - 1] - sorted[0], 4),
    variance: round(variance, 6),
    stdDev: round(stdDev, 4),
    q1: round(percentile(sorted, 25), 4),
    q3: round(percentile(sorted, 75), 4),
    iqr: round(percentile(sorted, 75) - percentile(sorted, 25), 4)
  };
}

export function avg(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

export function median(sorted) {
  const n = sorted.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  return n % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (idx - lower) * (sorted[upper] - sorted[lower]);
}

/**
 * Compute z-score of a value relative to a series.
 */
export function zScore(value, mean, stdDev) {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

/**
 * Percentage change between old and new values.
 */
export function percentChange(oldVal, newVal) {
  if (oldVal === 0) return newVal === 0 ? 0 : Infinity;
  return ((newVal - oldVal) / Math.abs(oldVal)) * 100;
}

// ── Regression ───────────────────────────────────────────────────────

/**
 * Simple linear regression slope (least-squares).
 */
export function linearSlope(values) {
  const n = values.length;
  if (n < 2) return 0;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += values[i]; sumXY += i * values[i]; sumX2 += i * i;
  }
  const denom = n * sumX2 - sumX * sumX;
  return denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
}

/**
 * Linear regression returning slope, intercept, and R².
 */
export function linearRegression(values) {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] || 0, r2: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += values[i]; sumXY += i * values[i]; sumX2 += i * i; sumY2 += values[i] * values[i];
  }

  const denom = n * sumX2 - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // R² calculation
  const ssRes = values.reduce((s, v, i) => s + (v - (intercept + slope * i)) ** 2, 0);
  const ssTot = values.reduce((s, v) => s + (v - sumY / n) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);

  return { slope: round(slope, 6), intercept: round(intercept, 4), r2: round(r2, 4) };
}

// ── Time Series ──────────────────────────────────────────────────────

/**
 * Simple moving average.
 */
export function movingAverage(values, window = 7) {
  if (values.length < window) return [...values];
  const result = [];
  for (let i = 0; i <= values.length - window; i++) {
    const slice = values.slice(i, i + window);
    result.push(round(avg(slice), 4));
  }
  return result;
}

/**
 * Single exponential smoothing.
 */
export function exponentialSmoothing(values, alpha = 0.3) {
  if (values.length === 0) return [];
  const result = [values[0]];
  for (let i = 1; i < values.length; i++) {
    result.push(round(alpha * values[i] + (1 - alpha) * result[i - 1], 4));
  }
  return result;
}

/**
 * Holt-Winters double exponential smoothing (trend + level).
 * For time series with trend but no strong seasonality.
 * 
 * @param {number[]} values - Time series data
 * @param {number} alpha - Level smoothing (0-1)
 * @param {number} beta - Trend smoothing (0-1)
 * @param {number} horizon - Number of periods to forecast
 * @returns {{ fitted: number[], forecast: number[], level: number, trend: number }}
 */
export function holtWinters(values, alpha = 0.3, beta = 0.1, horizon = 7) {
  const n = values.length;
  if (n < 2) return { fitted: [...values], forecast: Array(horizon).fill(values[0] || 0), level: values[0] || 0, trend: 0 };

  // Initialize
  let level = values[0];
  let trend = values[1] - values[0];
  const fitted = [level];

  // Fit
  for (let i = 1; i < n; i++) {
    const prevLevel = level;
    level = alpha * values[i] + (1 - alpha) * (prevLevel + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    fitted.push(round(level + trend, 4));
  }

  // Forecast
  const forecast = [];
  for (let h = 1; h <= horizon; h++) {
    forecast.push(round(level + h * trend, 4));
  }

  return { fitted, forecast, level: round(level, 4), trend: round(trend, 4) };
}

/**
 * Seasonal decomposition (additive).
 * Decomposes into trend + seasonal + residual.
 * 
 * @param {number[]} values - Time series data
 * @param {number} period - Seasonal period (e.g., 7 for weekly)
 * @returns {{ trend: number[], seasonal: number[], residual: number[] }}
 */
export function seasonalDecompose(values, period = 7) {
  const n = values.length;
  if (n < period * 2) return { trend: [...values], seasonal: Array(n).fill(0), residual: Array(n).fill(0) };

  // Step 1: Compute centered moving average (trend)
  const trend = [];
  const halfP = Math.floor(period / 2);
  for (let i = 0; i < n; i++) {
    if (i < halfP || i >= n - halfP) {
      trend.push(null);
    } else {
      const window = values.slice(i - halfP, i + halfP + (period % 2 === 0 ? 0 : 1));
      trend.push(round(avg(window), 4));
    }
  }

  // Fill nulls at edges with nearest value
  for (let i = 0; i < trend.length; i++) {
    if (trend[i] === null) trend[i] = trend.find(v => v !== null) || values[i];
  }

  // Step 2: Detrend
  const detrended = values.map((v, i) => v - trend[i]);

  // Step 3: Compute seasonal component (average of same period positions)
  const seasonalAvg = Array(period).fill(0);
  const counts = Array(period).fill(0);
  for (let i = 0; i < n; i++) {
    seasonalAvg[i % period] += detrended[i];
    counts[i % period]++;
  }
  for (let i = 0; i < period; i++) {
    seasonalAvg[i] = counts[i] > 0 ? round(seasonalAvg[i] / counts[i], 4) : 0;
  }

  // Normalize seasonal to sum to zero
  const seasonalMean = avg(seasonalAvg);
  const normalizedSeasonal = seasonalAvg.map(s => round(s - seasonalMean, 4));

  // Step 4: Build full seasonal and residual
  const seasonal = values.map((_, i) => normalizedSeasonal[i % period]);
  const residual = values.map((v, i) => round(v - trend[i] - seasonal[i], 4));

  return { trend, seasonal, residual };
}

/**
 * Detect change points using a sliding window variance comparison.
 * Returns indices where significant shifts occurred.
 */
export function detectChangePoints(values, windowSize = 7, threshold = 2.0) {
  const changePoints = [];
  if (values.length < windowSize * 2) return changePoints;

  for (let i = windowSize; i <= values.length - windowSize; i++) {
    const left = values.slice(i - windowSize, i);
    const right = values.slice(i, i + windowSize);
    const leftMean = avg(left);
    const rightMean = avg(right);
    const pooledStd = Math.sqrt((variance(left) + variance(right)) / 2);
    if (pooledStd > 0) {
      const tStat = Math.abs(leftMean - rightMean) / (pooledStd * Math.sqrt(2 / windowSize));
      if (tStat > threshold) {
        changePoints.push({ index: i, tStat: round(tStat, 2), leftMean: round(leftMean, 2), rightMean: round(rightMean, 2) });
      }
    }
  }
  return changePoints;
}

// ── Distance Metrics ─────────────────────────────────────────────────

/**
 * Cosine similarity between two vectors.
 */
export function cosineSimilarity(a, b) {
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

/**
 * Jaccard similarity for two sets (as arrays).
 */
export function jaccardSimilarity(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

// ── Helpers ──────────────────────────────────────────────────────────

function variance(arr) {
  const m = avg(arr);
  return arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length;
}

function round(val, decimals) {
  const factor = 10 ** decimals;
  return Math.round(val * factor) / factor;
}

export { round, variance };
