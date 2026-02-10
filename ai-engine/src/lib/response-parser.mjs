/**
 * Response Parser — Unified LLM output → validated data
 *
 * Replaces the "regex-extract → JSON.parse → hope" pattern across all
 * capabilities with a deterministic pipeline:
 *
 *   1. Attempt native JSON (if the provider returned clean JSON text)
 *   2. Regex-extract JSON from surrounding prose  (array or object)
 *   3. Strip markdown code fences and retry
 *   4. Validate with the capability's Zod schema
 *   5. If all else fails, run the capability-specific fallback function
 *
 * Every invocation returns { data, meta } where meta records which path
 * succeeded so quality can be tracked.
 */

import { createLogger } from '../lib/framework-shims.mjs';

const logger = createLogger('response-parser');

/**
 * Parse an LLM text response and validate against a Zod schema.
 *
 * @param {string}   text         Raw text from the LLM
 * @param {import('zod').ZodSchema} schema  Zod schema for validation
 * @param {object}   [opts]
 * @param {Function} [opts.fallback]   () => fallback data if parsing fails completely
 * @param {Function} [opts.preprocess] (raw) => transformed raw before validation
 * @param {string}   [opts.expect]     'object' | 'array' — hint for extraction
 * @returns {{ data: any, meta: { parseMethod: string, schemaValid: boolean, fallbackUsed: boolean, errors?: string[] } }}
 */
export function parseAndValidate(text, schema, opts = {}) {
  const { fallback, preprocess, expect = 'auto' } = opts;
  const meta = { parseMethod: 'none', schemaValid: false, fallbackUsed: false, errors: [] };

  // 1. Try native JSON parse
  let raw = tryNativeJSON(text);
  if (raw !== undefined) {
    meta.parseMethod = 'native-json';
  }

  // 2. Regex extract
  if (raw === undefined) {
    raw = extractJSON(text, expect);
    if (raw !== undefined) meta.parseMethod = 'regex-extract';
  }

  // 3. Strip markdown fences and retry
  if (raw === undefined) {
    const stripped = stripCodeFences(text);
    if (stripped !== text) {
      raw = tryNativeJSON(stripped);
      if (raw !== undefined) {
        meta.parseMethod = 'stripped-fences';
      } else {
        raw = extractJSON(stripped, expect);
        if (raw !== undefined) meta.parseMethod = 'stripped-fences-regex';
      }
    }
  }

  // 4. Pre-process hook (e.g. wrap array in object)
  if (raw !== undefined && preprocess) {
    try {
      raw = preprocess(raw);
    } catch (err) {
      meta.errors.push(`preprocess: ${err.message}`);
    }
  }

  // 5. Zod validation
  if (raw !== undefined) {
    const result = schema.safeParse(raw);
    if (result.success) {
      meta.schemaValid = true;
      return { data: result.data, meta };
    }
    // Schema failed but we have raw data — return coerced but mark invalid
    meta.errors.push(...flattenZodErrors(result.error));
    logger.warn('Schema validation failed, using raw parsed data', { errors: meta.errors.slice(0, 3) });
    return { data: raw, meta };
  }

  // 6. Complete failure → fallback
  if (fallback) {
    meta.fallbackUsed = true;
    meta.parseMethod = 'fallback';
    logger.warn('All parsing failed, using fallback');
    return { data: fallback(), meta };
  }

  // No fallback provided — return null with error details
  meta.fallbackUsed = true;
  meta.parseMethod = 'none';
  meta.errors.push('Could not extract JSON from LLM output');
  return { data: null, meta };
}

// ── Helpers ────────────────────────────────────────────────

function tryNativeJSON(text) {
  const trimmed = text.trim();
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
}

function extractJSON(text, expect) {
  let regex;
  if (expect === 'array') {
    regex = /\[[\s\S]*\]/;
  } else if (expect === 'object') {
    regex = /\{[\s\S]*\}/;
  } else {
    // Auto-detect: try object first (more common), then array
    const objMatch = text.match(/\{[\s\S]*\}/);
    const arrMatch = text.match(/\[[\s\S]*\]/);

    // Prefer whichever starts earlier in the text
    if (objMatch && arrMatch) {
      const m = objMatch.index <= arrMatch.index ? objMatch : arrMatch;
      try { return JSON.parse(m[0]); } catch { /* fall through */ }
    }

    if (objMatch) {
      try { return JSON.parse(objMatch[0]); } catch { /* fall through */ }
    }
    if (arrMatch) {
      try { return JSON.parse(arrMatch[0]); } catch { /* fall through */ }
    }
    return undefined;
  }

  const match = text.match(regex);
  if (!match) return undefined;
  try {
    return JSON.parse(match[0]);
  } catch {
    return undefined;
  }
}

function stripCodeFences(text) {
  // Remove ```json ... ``` or ``` ... ```
  return text
    .replace(/^```(?:json|javascript|js)?\s*\n?/gm, '')
    .replace(/\n?```\s*$/gm, '')
    .trim();
}

function flattenZodErrors(zodError) {
  if (!zodError?.issues) return ['Unknown validation error'];
  return zodError.issues.map(issue => {
    const path = issue.path.join('.');
    return `${path ? path + ': ' : ''}${issue.message}`;
  });
}

// ── Batch Helper ────────────────────────────────────────────

/**
 * Parse a response that is expected to be a JSON array, mapping each element
 * against a per-item schema. Useful for batch operations (intent classify, etc.)
 *
 * @param {string}   text            Raw LLM text
 * @param {import('zod').ZodSchema} itemSchema  Schema for a SINGLE item
 * @param {Function} [fallbackItem]  (index, original) => fallback for one item
 * @param {any[]}    [originals]     Original input items for fallback reference
 */
export function parseArrayResponse(text, itemSchema, fallbackItem, originals = []) {
  const meta = { parseMethod: 'none', schemaValid: false, fallbackUsed: false, errors: [], itemErrors: 0 };

  let arr;
  const native = tryNativeJSON(text);
  if (Array.isArray(native)) {
    arr = native;
    meta.parseMethod = 'native-json';
  }

  if (!arr) {
    const extracted = extractJSON(text, 'array');
    if (Array.isArray(extracted)) {
      arr = extracted;
      meta.parseMethod = 'regex-extract';
    }
  }

  if (!arr) {
    const stripped = stripCodeFences(text);
    const retry = tryNativeJSON(stripped) || extractJSON(stripped, 'array');
    if (Array.isArray(retry)) {
      arr = retry;
      meta.parseMethod = 'stripped-fences';
    }
  }

  if (!arr) {
    meta.fallbackUsed = true;
    meta.parseMethod = 'fallback';
    if (fallbackItem) {
      return {
        data: originals.map((orig, i) => fallbackItem(i, orig)),
        meta
      };
    }
    meta.errors.push('Could not extract JSON array from LLM output');
    return { data: [], meta };
  }

  // Validate each item
  const validated = arr.map((item, i) => {
    const result = itemSchema.safeParse(item);
    if (result.success) return result.data;
    meta.itemErrors++;
    // Return raw item if it partially matches
    return item;
  });

  meta.schemaValid = meta.itemErrors === 0;
  if (meta.itemErrors > 0) {
    meta.errors.push(`${meta.itemErrors}/${arr.length} items failed schema validation`);
  }

  return { data: validated, meta };
}

// ── Quality Tracking Helper ─────────────────────────────────────

/**
 * Build a quality-tracking record from parse meta.
 * Intended to be passed to UsageTracker.trackQuality().
 */
export function qualityRecord(capability, meta, extras = {}) {
  return {
    capability,
    parseMethod: meta.parseMethod,
    schemaValid: meta.schemaValid,
    fallbackUsed: meta.fallbackUsed,
    errorCount: meta.errors?.length || 0,
    timestamp: Date.now(),
    ...extras
  };
}
