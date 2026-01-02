/**
 * Configuration Schema Validation
 *
 * Industry-standard approach: JSON Schema validation for all config files
 * Benefits: Type safety, validation, documentation, IDE support
 */

import Ajv from 'ajv';

// Schema definitions for each config type
const schemas = {
  theme: {
    type: 'object',
    properties: {
      colors: {
        type: 'object',
        properties: {
          brand: { type: 'object' },
          background: { type: 'object' },
          text: { type: 'object' }
        }
      },
      typography: { type: 'object' },
      spacing: { type: 'object' }
    },
    required: ['colors']
  },

  navigation: {
    type: 'object',
    properties: {
      main: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            href: { type: 'string' },
            external: { type: 'boolean' }
          },
          required: ['label', 'href']
        }
      }
    }
  }
};

const ajv = new Ajv({ allErrors: true });

/**
 * Validate config against schema
 */
export const validateConfig = (config, schemaName) => {
  const schema = schemas[schemaName];
  if (!schema) return { valid: true };

  const validate = ajv.compile(schema);
  const valid = validate(config);

  return {
    valid,
    errors: validate.errors
  };
}