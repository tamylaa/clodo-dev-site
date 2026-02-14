/**
 * Tests — Math Utilities
 * 
 * Unit tests for all functions in src/lib/math-utils.mjs
 */

import { describe, it, expect } from 'vitest';
import {
  descriptiveStats, avg, median, percentile, zScore, percentChange,
  linearSlope, linearRegression, movingAverage, exponentialSmoothing,
  holtWinters, seasonalDecompose, detectChangePoints,
  cosineSimilarity, jaccardSimilarity, round, variance
} from '../../src/lib/math-utils.mjs';

// ── Descriptive Statistics ───────────────────────────────────────────

describe('descriptiveStats', () => {
  it('returns null for empty input', () => {
    expect(descriptiveStats([])).toBeNull();
    expect(descriptiveStats(null)).toBeNull();
  });

  it('computes correct stats for a simple array', () => {
    const stats = descriptiveStats([1, 2, 3, 4, 5]);
    expect(stats.count).toBe(5);
    expect(stats.mean).toBe(3);
    expect(stats.median).toBe(3);
    expect(stats.min).toBe(1);
    expect(stats.max).toBe(5);
    expect(stats.range).toBe(4);
    expect(stats.sum).toBe(15);
    expect(stats.stdDev).toBeGreaterThan(0);
  });

  it('handles single-element array', () => {
    const stats = descriptiveStats([42]);
    expect(stats.count).toBe(1);
    expect(stats.mean).toBe(42);
    expect(stats.median).toBe(42);
    expect(stats.stdDev).toBe(0);
  });

  it('computes IQR correctly', () => {
    const stats = descriptiveStats([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(stats.q1).toBeLessThan(stats.q3);
    expect(stats.iqr).toBe(stats.q3 - stats.q1);
  });
});

describe('avg', () => {
  it('returns 0 for empty array', () => expect(avg([])).toBe(0));
  it('returns 0 for null', () => expect(avg(null)).toBe(0));
  it('computes average correctly', () => expect(avg([2, 4, 6])).toBe(4));
  it('handles single value', () => expect(avg([10])).toBe(10));
});

describe('median', () => {
  it('returns 0 for empty array', () => expect(median([])).toBe(0));
  it('handles odd-length sorted array', () => expect(median([1, 2, 3])).toBe(2));
  it('handles even-length sorted array', () => expect(median([1, 2, 3, 4])).toBe(2.5));
});

describe('percentile', () => {
  it('computes 50th percentile (median)', () => {
    expect(percentile([1, 2, 3, 4, 5], 50)).toBe(3);
  });
  it('computes 25th percentile', () => {
    const p = percentile([1, 2, 3, 4, 5, 6, 7, 8], 25);
    expect(p).toBeGreaterThanOrEqual(2);
    expect(p).toBeLessThanOrEqual(3);
  });
});

describe('zScore', () => {
  it('returns 0 for value equal to mean with 0 stddev', () => {
    expect(zScore(5, 5, 0)).toBe(0);
  });
  it('computes z-score correctly', () => {
    expect(zScore(10, 5, 2.5)).toBe(2);
    expect(zScore(0, 5, 2.5)).toBe(-2);
  });
});

describe('percentChange', () => {
  it('returns Infinity for 0 old value with non-zero new value', () => expect(percentChange(0, 10)).toBe(Infinity));
  it('returns 0 when both values are 0', () => expect(percentChange(0, 0)).toBe(0));
  it('computes increase correctly', () => expect(percentChange(100, 150)).toBe(50));
  it('computes decrease correctly', () => expect(percentChange(100, 50)).toBe(-50));
});

describe('round', () => {
  it('rounds to specified precision', () => {
    expect(round(3.14159, 2)).toBe(3.14);
    expect(round(3.14159, 4)).toBe(3.1416);
  });
  it('rounds to 0 decimal places', () => expect(round(3.7, 0)).toBe(4));
});

describe('variance', () => {
  it('returns 0 for constant values', () => expect(variance([5, 5, 5])).toBe(0));
  it('computes variance correctly', () => {
    const v = variance([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(v).toBeGreaterThan(0);
  });
});

// ── Regression ───────────────────────────────────────────────────────

describe('linearSlope', () => {
  it('computes positive slope for increasing data', () => {
    expect(linearSlope([1, 2, 3, 4, 5])).toBeGreaterThan(0);
  });
  it('computes negative slope for decreasing data', () => {
    expect(linearSlope([5, 4, 3, 2, 1])).toBeLessThan(0);
  });
  it('returns 0 for constant data', () => {
    expect(linearSlope([3, 3, 3])).toBe(0);
  });
  it('returns 0 for insufficient data', () => {
    expect(linearSlope([1])).toBe(0);
    expect(linearSlope([])).toBe(0);
  });
});

describe('linearRegression', () => {
  it('returns slope and intercept', () => {
    const result = linearRegression([10, 20, 30, 40, 50]);
    expect(result).toHaveProperty('slope');
    expect(result).toHaveProperty('intercept');
    expect(result.slope).toBeGreaterThan(0);
  });
});

// ── Time Series ──────────────────────────────────────────────────────

describe('movingAverage', () => {
  it('computes moving average with specified window', () => {
    const ma = movingAverage([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3);
    expect(ma).toBeInstanceOf(Array);
    expect(ma.length).toBeLessThanOrEqual(10);
    // First full window average should be (1+2+3)/3 = 2
    expect(ma[0]).toBeCloseTo(2, 5);
  });
});

describe('exponentialSmoothing', () => {
  it('returns smoothed array of same length as input', () => {
    const result = exponentialSmoothing([10, 20, 30, 40, 50], 0.3);
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBe(5);
    // First value is always the original
    expect(result[0]).toBe(10);
  });
  it('returns empty for empty data', () => {
    const result = exponentialSmoothing([]);
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBe(0);
  });
});

describe('holtWinters', () => {
  it('returns object with forecast array for trending data', () => {
    const data = [100, 110, 120, 130, 140, 150, 160, 170, 180, 190];
    const result = holtWinters(data, 0.3, 0.1, 5);
    expect(result).toHaveProperty('forecast');
    expect(result).toHaveProperty('fitted');
    expect(result).toHaveProperty('level');
    expect(result).toHaveProperty('trend');
    expect(result.forecast).toBeInstanceOf(Array);
    expect(result.forecast.length).toBe(5);
    // Forecasts should continue the upward trend
    expect(result.forecast[0]).toBeGreaterThan(180);
  });
});

describe('seasonalDecompose', () => {
  it('returns trend and seasonal components', () => {
    const data = [10, 20, 10, 20, 10, 20, 10, 20, 10, 20, 10, 20];
    const result = seasonalDecompose(data, 2);
    expect(result).toHaveProperty('trend');
    expect(result).toHaveProperty('seasonal');
  });
});

describe('detectChangePoints', () => {
  it('detects a sudden shift in data', () => {
    const data = [10, 10, 10, 10, 10, 50, 50, 50, 50, 50];
    // Use windowSize=3 so the algorithm has enough points on both sides
    const points = detectChangePoints(data, 3);
    expect(points.length).toBeGreaterThan(0);
    // The change point should be near index 5
    expect(points[0]).toHaveProperty('index');
  });
  it('returns empty for stable data', () => {
    const data = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10];
    const points = detectChangePoints(data, 3);
    expect(points.length).toBe(0);
  });
});

// ── Distance Metrics ─────────────────────────────────────────────────

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 5);
  });
  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 5);
  });
  it('returns value between -1 and 1', () => {
    const sim = cosineSimilarity([1, 2, 3], [4, 5, 6]);
    expect(sim).toBeGreaterThanOrEqual(-1);
    expect(sim).toBeLessThanOrEqual(1);
  });
  it('handles zero vectors gracefully', () => {
    expect(cosineSimilarity([0, 0], [1, 2])).toBe(0);
  });
});

describe('jaccardSimilarity', () => {
  it('returns 1 for identical sets', () => {
    expect(jaccardSimilarity(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(1);
  });
  it('returns 0 for disjoint sets', () => {
    expect(jaccardSimilarity(['a', 'b'], ['c', 'd'])).toBe(0);
  });
  it('computes partial overlap correctly', () => {
    const sim = jaccardSimilarity(['a', 'b', 'c'], ['b', 'c', 'd']);
    // intersection = {b,c} = 2, union = {a,b,c,d} = 4, J = 0.5
    expect(sim).toBeCloseTo(0.5, 5);
  });
  it('returns 0 for empty arrays', () => {
    expect(jaccardSimilarity([], [])).toBe(0);
  });
});
