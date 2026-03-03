/**
 * Zod Schemas — Schema Markup Generation
 *
 * Input / output validation for the generate-schema capability.
 * Accepts page data (title, headings, bodyPreview) and returns
 * ready-to-paste JSON-LD markup with optional LLM enhancement.
 */

import { z } from 'zod';

// ── Input ───────────────────────────────────────────────────────────

const PageInputSchema = z.object({
  url: z.string(),
  path: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  h1: z.string().optional(),
  h2s: z.array(z.string()).optional(),
  wordCount: z.number().optional(),
  keywords: z.array(z.object({
    query: z.string(),
    impressions: z.number().optional()
  })).optional(),
  bodyPreview: z.string().optional(),   // first ~800 chars for LLM context
  siteName: z.string().optional(),
  language: z.string().optional()
});

export const GenerateSchemaInputSchema = z.object({
  pages: z.array(PageInputSchema).min(1).max(20),
  schemaTypes: z.array(z.enum([
    'Article', 'FAQPage', 'HowTo', 'Review', 'Product', 'BreadcrumbList'
  ])).optional(),                        // force specific types (skip auto-detect)
  enhance: z.boolean().default(true)     // use LLM to fill placeholder text
});

// ── Output ──────────────────────────────────────────────────────────

const GeneratedSchemaItemSchema = z.object({
  type: z.string(),
  markup: z.string(),
  reason: z.string(),
  priority: z.enum(['required', 'recommended', 'optional']),
  enhanced: z.boolean()
});

const PageSchemaResultSchema = z.object({
  url: z.string(),
  detected: z.object({
    primary: z.string(),
    secondary: z.array(z.string())
  }),
  generated: z.array(GeneratedSchemaItemSchema)
});

export const GenerateSchemaOutputSchema = z.object({
  schemas: z.array(PageSchemaResultSchema),
  summary: z.object({
    totalPages: z.number(),
    totalSchemas: z.number(),
    typesGenerated: z.array(z.string())
  })
});

// ── JSON Schema for structured LLM output ───────────────────────────
// Used when the LLM fills FAQ answers / HowTo steps from bodyPreview.

export const GENERATE_SCHEMA_ENHANCE_JSON_SCHEMA = {
  name: 'schema_enhancement',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      enhancements: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            placeholder: { type: 'string' },
            replacement: { type: 'string' }
          },
          required: ['placeholder', 'replacement'],
          additionalProperties: false
        }
      }
    },
    required: ['enhancements'],
    additionalProperties: false
  }
};
