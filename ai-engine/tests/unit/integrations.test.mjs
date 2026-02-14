/**
 * Tests: Integration Features
 */

import { describe, it, expect, vi } from 'vitest';
import { parseCSV, generateCSV, validateKeywordCSV } from '../../src/lib/csv-utils.mjs';
import { validateWebhookUrl } from '../../src/lib/webhook-utils.mjs';

describe('CSV Utilities', () => {
  it('parses valid CSV', () => {
    const csvText = 'query,clicks,impressions\nkeyword1,100,1000\nkeyword2,200,2000';
    const result = parseCSV(csvText);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(3);
    expect(result.data[1][0]).toBe('keyword1');
  });

  it('validates keyword CSV format', () => {
    const validCSV = [
      ['query', 'clicks', 'impressions'],
      ['test keyword', '100', '1000']
    ];

    const result = validateKeywordCSV(validCSV);
    expect(result.valid).toBe(true);
    expect(result.rowCount).toBe(1);
  });

  it('rejects invalid CSV format', () => {
    const invalidCSV = [
      ['wrong', 'headers'],
      ['data']
    ];

    const result = validateKeywordCSV(invalidCSV);
    expect(result.valid).toBe(false);
  });

  it('generates CSV from data', () => {
    const data = [
      { name: 'test', value: 123 },
      { name: 'test2', value: 456 }
    ];

    const result = generateCSV(data, ['name', 'value']);
    expect(result.success).toBe(true);
    expect(result.csv).toContain('name,value');
    expect(result.csv).toContain('test,123');
  });
});

describe('Webhook Utilities', () => {
  it('validates HTTPS URLs', () => {
    expect(validateWebhookUrl('https://example.com/webhook')).toBe(true);
    expect(validateWebhookUrl('http://example.com/webhook')).toBe(true);
    expect(validateWebhookUrl('ftp://example.com')).toBe(false);
    expect(validateWebhookUrl('invalid-url')).toBe(false);
  });
});