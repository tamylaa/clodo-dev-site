/**
 * Input Validation — Zod safeParse wrapper for capability entry points
 *
 * Usage:
 *   const v = validateInput(MyInputSchema, body);
 *   if (!v.valid) return v.error;
 *   const { keywords, context } = v.data;
 *
 * Only rejects for structural / type errors (invalid_type, unrecognized_keys).
 * Business-rule violations (too_small, too_big) are passed through so that
 * each capability can return its own domain-specific error message.
 */

import { createLogger } from './framework-shims.mjs';

const logger = createLogger('validate-input');

/**
 * @param {import('zod').ZodSchema} schema
 * @param {any} body
 * @returns {{ valid: true, data: any } | { valid: false, error: object }}
 */
export function validateInput(schema, body) {
  if (body === null || body === undefined || typeof body !== 'object' || Array.isArray(body)) {
    return {
      valid: false,
      error: { error: 'Invalid request body: expected a JSON object' }
    };
  }

  const result = schema.safeParse(body);

  if (result.success) {
    return { valid: true, data: result.data };
  }

  // Separate structural issues (wrong types, etc.) from business-rule issues
  const structural = result.error.issues.filter(i =>
    i.code === 'invalid_type' ||
    i.code === 'invalid_union' ||
    i.code === 'invalid_enum_value' ||
    i.code === 'invalid_value' ||
    i.code === 'unrecognized_keys' ||
    i.code === 'invalid_literal'
  );

  if (structural.length > 0) {
    logger.warn('Input validation failed', {
      errors: structural.map(i => `${i.path.join('.')}: ${i.message}`).slice(0, 5)
    });
    return {
      valid: false,
      error: {
        error: 'Invalid input',
        validationErrors: result.error.issues.map(i => ({
          path: i.path.join('.'),
          message: i.message,
          code: i.code
        }))
      }
    };
  }

  // Non-structural issues (too_small, too_big, custom refinements) —
  // proceed with the raw body so the capability can return its own message.
  return { valid: true, data: body };
}
