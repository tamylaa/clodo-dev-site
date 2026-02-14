/**
 * Zod Schemas — Smart Forecasting
 */

import { z } from 'zod';

export const SmartForecastInputSchema = z.object({
  timeSeries: z.array(z.object({
    date: z.string(),
    clicks: z.number().optional(),
    impressions: z.number().optional(),
    position: z.number().optional(),
    ctr: z.number().optional(),
    conversions: z.number().optional(),
    revenue: z.number().optional()
  })).min(7, 'Need at least 7 data points for forecasting'),
  forecastDays: z.number().min(1).max(365).default(30),
  metrics: z.array(z.enum(['clicks', 'impressions', 'position', 'ctr', 'conversions', 'revenue'])).default(['clicks', 'impressions']),
  seasonality: z.enum(['auto', 'weekly', 'monthly', 'none']).default('auto'),
  includeConfidenceIntervals: z.boolean().default(true)
});

const ForecastPointSchema = z.object({
  date: z.string(),
  value: z.number(),
  lower: z.number().optional(),
  upper: z.number().optional()
});

const MetricForecastSchema = z.object({
  metric: z.string(),
  method: z.string(),
  forecast: z.array(ForecastPointSchema),
  trend: z.enum(['increasing', 'decreasing', 'stable', 'volatile']),
  trendStrength: z.number().min(0).max(1).optional(),
  seasonalityDetected: z.boolean().optional(),
  changePoints: z.array(z.object({
    index: z.number(),
    date: z.string().optional(),
    direction: z.enum(['up', 'down'])
  })).optional(),
  accuracy: z.object({
    mape: z.number().optional(),
    rmse: z.number().optional()
  }).optional()
});

export const SmartForecastOutputSchema = z.object({
  _input: z.object({
    dataPoints: z.number(),
    fieldsReceived: z.array(z.string())
  }).optional(),
  forecasts: z.record(z.string(), MetricForecastSchema),
  summary: z.object({
    dataPoints: z.number(),
    forecastHorizon: z.number(),
    primaryTrend: z.string(),
    keyInsight: z.string()
  }).optional(),
  warnings: z.array(z.string()).optional(),
  stats: z.any().optional(),
  metadata: z.any().optional()
});

export const SMART_FORECAST_JSON_SCHEMA = {
  name: 'smart_forecast',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      _input: {
        type: 'object',
        properties: {
          dataPoints: { type: 'number' },
          fieldsReceived: { type: 'array', items: { type: 'string' } }
        },
        required: ['dataPoints', 'fieldsReceived'],
        additionalProperties: false
      },
      forecasts: {
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: {
            metric: { type: 'string' },
            method: { type: 'string' },
            trend: { type: 'string', enum: ['increasing', 'decreasing', 'stable', 'volatile'] },
            trendStrength: { type: 'number' },
            seasonalityDetected: { type: 'boolean' },
            forecast: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string' },
                  value: { type: 'number' },
                  lower: { type: 'number' },
                  upper: { type: 'number' }
                },
                required: ['date', 'value'],
                additionalProperties: false
              }
            },
            changePoints: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  index: { type: 'number' },
                  date: { type: 'string' },
                  direction: { type: 'string', enum: ['up', 'down'] }
                },
                required: ['index', 'direction'],
                additionalProperties: false
              }
            },
            accuracy: {
              type: 'object',
              properties: {
                mape: { type: 'number' },
                rmse: { type: 'number' }
              },
              required: [],
              additionalProperties: false
            }
          },
          required: ['metric', 'method', 'trend', 'forecast'],
          additionalProperties: false
        }
      },
      summary: {
        type: 'object',
        properties: {
          dataPoints: { type: 'number' },
          forecastHorizon: { type: 'number' },
          primaryTrend: { type: 'string' },
          keyInsight: { type: 'string' }
        },
        required: ['dataPoints', 'forecastHorizon', 'primaryTrend', 'keyInsight'],
        additionalProperties: false
      },
      warnings: { type: 'array', items: { type: 'string' } },
      stats: {},
      metadata: {}
    },
    required: ['forecasts'],
    additionalProperties: false
  }
};
