/**
 * Few-Shot Examples — Smart Forecasting
 */

export const SMART_FORECAST_FEW_SHOT = [
  {
    scenario: 'Steady growth with weekly seasonality',
    input: { dataPoints: 90, metrics: ['clicks', 'impressions'] },
    analysis: {
      clicks: {
        trend: 'increasing',
        trendStrength: 0.72,
        seasonalityDetected: true,
        method: 'holt-winters',
        keyInsight: 'Clicks show 8% month-over-month growth with strong Monday peaks. Forecasting continued growth with seasonal adjustment.'
      },
      impressions: {
        trend: 'stable',
        trendStrength: 0.15,
        seasonalityDetected: true,
        method: 'exponential-smoothing',
        keyInsight: 'Impressions are flat despite click growth, suggesting improved CTR rather than expanded visibility.'
      }
    }
  },
  {
    scenario: 'Post-algorithm-update recovery',
    input: { dataPoints: 60, metrics: ['clicks'] },
    analysis: {
      clicks: {
        trend: 'increasing',
        trendStrength: 0.45,
        seasonalityDetected: false,
        method: 'linear-regression',
        keyInsight: 'Traffic dropped 40% on day 15 (algorithm update) and has been recovering at ~2% per day. At current trajectory, full recovery expected in 12 days.'
      }
    }
  }
];

export function formatForecastExamples() {
  return `When analyzing time series data, consider these patterns:

1. **Trend Detection**: Use linear regression slope. Strength > 0.5 = strong trend.
2. **Seasonality**: Check for weekly (7-day) and monthly (30-day) cycles.
3. **Change Points**: Sudden shifts often correlate with algorithm updates, technical issues, or seasonal events.
4. **Method Selection**: 
   - Stable data → exponential smoothing
   - Trending data → Holt's linear method
   - Seasonal data → Holt-Winters
   - Short series (<14 points) → linear regression

Example analysis patterns:\n${JSON.stringify(SMART_FORECAST_FEW_SHOT, null, 2)}`;
}
