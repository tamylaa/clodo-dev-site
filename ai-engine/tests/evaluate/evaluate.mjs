/**
 * Evaluation Framework
 *
 * Runs AI capabilities against golden datasets and scores outputs.
 * Can be used for:
 *   - Regression testing after prompt changes
 *   - Comparing model performance
 *   - Validating capability upgrades
 *
 * Usage:
 *   node tests/evaluate/evaluate.mjs [capability] [--provider=openai]
 *
 * Note: This is an offline evaluation script, not a Vitest test.
 * It requires a running worker or mock environment.
 */

import { ALL_GOLDEN_DATASETS } from './golden-datasets.mjs';

// ── Assertion Helpers ────────────────────────────────────────────────

function assertHasProperty(obj, path, ctx) {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') {
      return { pass: false, message: `${ctx}: Missing property "${path}" — got ${typeof current} at "${part}"` };
    }
    current = current[part];
  }
  if (current === undefined || current === null) {
    return { pass: false, message: `${ctx}: Property "${path}" is null/undefined` };
  }
  return { pass: true };
}

function assertMinLength(arr, min, ctx) {
  if (!Array.isArray(arr)) return { pass: false, message: `${ctx}: Expected array, got ${typeof arr}` };
  if (arr.length < min) return { pass: false, message: `${ctx}: Expected at least ${min} items, got ${arr.length}` };
  return { pass: true };
}

function assertInRange(value, min, max, ctx) {
  if (typeof value !== 'number') return { pass: false, message: `${ctx}: Expected number, got ${typeof value}` };
  if (value < min || value > max) return { pass: false, message: `${ctx}: ${value} not in range [${min}, ${max}]` };
  return { pass: true };
}

function assertEquals(actual, expected, ctx) {
  if (actual !== expected) return { pass: false, message: `${ctx}: Expected "${expected}", got "${actual}"` };
  return { pass: true };
}

function assertIncludes(arr, value, ctx) {
  if (!Array.isArray(arr)) return { pass: false, message: `${ctx}: Expected array for includes check` };
  if (!arr.includes(value)) return { pass: false, message: `${ctx}: Array does not include "${value}"` };
  return { pass: true };
}

// ── Capability-specific evaluators ───────────────────────────────────

const evaluators = {
  'intent-classify': (output, expectations) => {
    const results = [];
    const classifications = output.classifications || output.results || [];

    if (expectations.resultCount != null) {
      results.push(assertMinLength(classifications, expectations.resultCount, 'resultCount'));
    }
    if (expectations.firstIntent && classifications[0]) {
      const intent = classifications[0].intent || classifications[0].predictedIntent;
      results.push(assertEquals(intent, expectations.firstIntent, 'firstIntent'));
    }
    if (expectations.hasConfidence && classifications[0]) {
      results.push(assertHasProperty(classifications[0], 'confidence', 'hasConfidence'));
    }
    if (expectations.minConfidence != null && classifications[0]) {
      const conf = classifications[0].confidence;
      results.push(assertInRange(conf, expectations.minConfidence, 1.0, 'minConfidence'));
    }
    return results;
  },

  'anomaly-diagnosis': (output, expectations) => {
    const results = [];
    const diagnoses = output.diagnoses || [];

    if (expectations.hasDiagnoses) {
      results.push(assertMinLength(diagnoses, expectations.minDiagnoses || 1, 'hasDiagnoses'));
    }
    if (expectations.mentionsSeverity && diagnoses[0]) {
      results.push(assertHasProperty(diagnoses[0], 'severity', 'mentionsSeverity'));
    }
    if (expectations.hasActionItems && diagnoses[0]) {
      const hasActions = diagnoses[0].actionItems || diagnoses[0].recommendations;
      results.push({
        pass: !!hasActions,
        message: hasActions ? 'Has action items' : 'Missing action items/recommendations'
      });
    }
    return results;
  },

  'content-rewrite': (output, expectations) => {
    const results = [];
    const rewrites = output.rewrites || [];

    if (expectations.hasRewrites) {
      results.push(assertMinLength(rewrites, 1, 'hasRewrites'));
    }
    if (expectations.rewriteCount != null) {
      results.push(assertEquals(rewrites.length, expectations.rewriteCount, 'rewriteCount'));
    }
    if (rewrites[0]) {
      const title = rewrites[0].title?.suggested || '';
      if (expectations.suggestedTitleMinLength) {
        results.push(assertInRange(title.length, expectations.suggestedTitleMinLength, 999, 'titleMinLength'));
      }
      if (expectations.suggestedTitleMaxLength) {
        results.push(assertInRange(title.length, 0, expectations.suggestedTitleMaxLength, 'titleMaxLength'));
      }
      if (expectations.hasCTRAnalysis) {
        results.push(assertHasProperty(rewrites[0], 'ctrAnalysis', 'hasCTRAnalysis'));
      }
      if (expectations.hasVariants) {
        results.push(assertHasProperty(rewrites[0], 'variants', 'hasVariants'));
      }
    }
    return results;
  },

  'smart-forecast': (output, expectations) => {
    const results = [];
    const forecasts = output.forecasts || {};

    if (expectations.hasForecasts) {
      results.push({
        pass: Object.keys(forecasts).length > 0,
        message: Object.keys(forecasts).length > 0 ? 'Has forecasts' : 'No forecasts found'
      });
    }
    if (expectations.forecastMetric) {
      results.push(assertHasProperty(forecasts, expectations.forecastMetric, 'forecastMetric'));
    }
    if (expectations.hasStatisticalForecast && forecasts[expectations.forecastMetric]) {
      results.push(assertHasProperty(forecasts[expectations.forecastMetric], 'statisticalForecast', 'hasStatisticalForecast'));
    }
    return results;
  },

  'cannibalization-detect': (output, expectations) => {
    const results = [];
    const conflicts = output.conflicts || [];

    if (expectations.hasConflicts) {
      results.push(assertMinLength(conflicts, expectations.minConflicts || 1, 'hasConflicts'));
    }
    return results;
  },

  'content-gaps': (output, expectations) => {
    const results = [];
    const gaps = output.gaps || [];

    if (expectations.hasGaps) {
      results.push(assertMinLength(gaps, 1, 'hasGaps'));
    }
    if (expectations.excludesExisting) {
      const gapKeywords = gaps.map(g => g.keyword?.toLowerCase());
      results.push({
        pass: !gapKeywords.includes('seo guide'),
        message: gapKeywords.includes('seo guide')
          ? 'Existing keyword "seo guide" should not appear as a gap'
          : 'Correctly excludes existing keywords'
      });
    }
    return results;
  }
};

// ── Main Evaluation Runner ───────────────────────────────────────────

/**
 * Evaluate a capability against its golden dataset.
 * @param {string} capability - The capability name
 * @param {Function} runCapability - Async function(input) => output
 * @returns {Object} Evaluation results
 */
export async function evaluateCapability(capability, runCapability) {
  const dataset = ALL_GOLDEN_DATASETS[capability];
  if (!dataset) {
    return { capability, error: `No golden dataset for "${capability}"`, passed: 0, failed: 0, total: 0 };
  }

  const evaluator = evaluators[capability];
  if (!evaluator) {
    return { capability, error: `No evaluator for "${capability}"`, passed: 0, failed: 0, total: 0 };
  }

  const testResults = [];
  let passed = 0;
  let failed = 0;

  for (const testCase of dataset) {
    try {
      const output = await runCapability(testCase.input);
      const assertions = evaluator(output, testCase.expectations);

      const passCount = assertions.filter(a => a.pass).length;
      const failCount = assertions.filter(a => !a.pass).length;
      passed += passCount;
      failed += failCount;

      testResults.push({
        id: testCase.id,
        status: failCount === 0 ? 'PASS' : 'FAIL',
        assertions: assertions.length,
        passed: passCount,
        failed: failCount,
        failures: assertions.filter(a => !a.pass).map(a => a.message)
      });
    } catch (error) {
      failed++;
      testResults.push({
        id: testCase.id,
        status: 'ERROR',
        error: error.message
      });
    }
  }

  return {
    capability,
    total: passed + failed,
    passed,
    failed,
    score: passed + failed > 0 ? Math.round((passed / (passed + failed)) * 100) : 0,
    testResults
  };
}

/**
 * Run all evaluations.
 */
export async function evaluateAll(runCapabilityFn) {
  const results = {};
  for (const capability of Object.keys(ALL_GOLDEN_DATASETS)) {
    results[capability] = await evaluateCapability(capability, (input) => runCapabilityFn(capability, input));
  }

  const totalPassed = Object.values(results).reduce((s, r) => s + r.passed, 0);
  const totalFailed = Object.values(results).reduce((s, r) => s + r.failed, 0);

  return {
    summary: {
      totalPassed,
      totalFailed,
      overallScore: totalPassed + totalFailed > 0
        ? Math.round((totalPassed / (totalPassed + totalFailed)) * 100)
        : 0,
      capabilities: Object.keys(results).length
    },
    results
  };
}
