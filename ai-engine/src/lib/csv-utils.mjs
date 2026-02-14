/**
 * CSV Import/Export Utilities
 *
 * Handles CSV data for easy spreadsheet integration.
 * Supports import of keyword data and export of results.
 */

import { parse as csvParse } from 'csv-parse/sync';
import { stringify as csvStringify } from 'csv-stringify/sync';

export function parseCSV(csvText, options = {}) {
  try {
    const records = csvParse(csvText, {
      skip_empty_lines: true,
      trim: true,
      ...options
    });
    return { success: true, data: records };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export function generateCSV(data, columns) {
  try {
    const csvData = Array.isArray(data) ? data : [data];
    const csvText = csvStringify(csvData, {
      header: true,
      columns: columns
    });
    return { success: true, csv: csvText };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export function validateKeywordCSV(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return { valid: false, error: 'No data found' };
  }

  const headers = records[0];
  const requiredHeaders = ['query', 'clicks', 'impressions'];

  for (const required of requiredHeaders) {
    if (!headers.includes(required)) {
      return { valid: false, error: `Missing required column: ${required}` };
    }
  }

  // Validate data rows
  for (let i = 1; i < records.length; i++) {
    const row = records[i];
    if (row.length !== headers.length) {
      return { valid: false, error: `Row ${i} has wrong number of columns` };
    }
  }

  return { valid: true, headers, rowCount: records.length - 1 };
}

export function convertCSVToKeywords(csvRecords) {
  const headers = csvRecords[0];
  const queryIndex = headers.indexOf('query');
  const clicksIndex = headers.indexOf('clicks');
  const impressionsIndex = headers.indexOf('impressions');
  const ctrIndex = headers.indexOf('ctr');
  const positionIndex = headers.indexOf('position');

  return csvRecords.slice(1).map(row => ({
    query: row[queryIndex],
    clicks: parseInt(row[clicksIndex]) || 0,
    impressions: parseInt(row[impressionsIndex]) || 0,
    ctr: ctrIndex >= 0 ? parseFloat(row[ctrIndex]) || 0 : undefined,
    position: positionIndex >= 0 ? parseFloat(row[positionIndex]) || 0 : undefined
  }));
}