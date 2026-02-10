/**
 * Few-Shot Examples — Anomaly Diagnosis
 */

export const ANOMALY_FEW_SHOT = [
  {
    metric: 'organic_clicks',
    period: '2024-03-01 → 2024-03-14',
    percentChange: -42,
    diagnosis: {
      severity: 'critical',
      primaryCause: 'algorithm-update',
      confidence: 0.85,
      reasoning: 'Google March 2024 Core Update rolled out March 5. The drop aligns with confirmed rollout dates and affects broad ranking signals. Site lost positions across 60% of tracked keywords.',
      affectedAreas: ['informational pages', 'blog content'],
      recommendedActions: [
        'Run a content audit on pages that lost >5 positions',
        'Check Google Search Status Dashboard for confirmed updates',
        'Compare pre/post SERP features for top keywords',
        'Review E-E-A-T signals on affected pages'
      ],
      relatedSignals: ['position drop across 60% of keywords', 'impressions stable but CTR declined']
    }
  },
  {
    metric: 'organic_impressions',
    period: '2024-06-01 → 2024-06-07',
    percentChange: -65,
    diagnosis: {
      severity: 'critical',
      primaryCause: 'technical-issue',
      confidence: 0.92,
      reasoning: 'Server migration on June 2 introduced a robots.txt misconfiguration blocking /blog/ and /products/ directories. Googlebot crawl rate dropped to zero for affected sections.',
      affectedAreas: ['/blog/', '/products/'],
      recommendedActions: [
        'Verify robots.txt allows Googlebot access to all intended paths',
        'Check Google Search Console Coverage report for crawl errors',
        'Submit affected URLs for re-indexing via URL Inspection tool',
        'Monitor crawl stats for recovery over next 48 hours'
      ],
      relatedSignals: ['crawl rate dropped to zero', 'no new pages indexed since June 2']
    }
  },
  {
    metric: 'organic_clicks',
    period: '2024-11-20 → 2024-12-20',
    percentChange: -28,
    diagnosis: {
      severity: 'warning',
      primaryCause: 'seasonal-pattern',
      confidence: 0.78,
      reasoning: 'Year-over-year comparison shows consistent Q4 decline for this B2B SaaS vertical. Budget cycles end in November, reducing search demand for enterprise software until January.',
      affectedAreas: ['enterprise pricing pages', 'demo request pages'],
      recommendedActions: [
        'Compare against prior year Q4 to confirm seasonality',
        'Shift content focus to planning/budgeting topics for January',
        'Prepare Q1 launch content to capture demand rebound',
        'Use this period for technical SEO improvements'
      ],
      relatedSignals: ['similar pattern in Q4 2023', 'competitor traffic also declining']
    }
  },
  {
    metric: 'organic_ctr',
    period: '2024-07-10 → 2024-07-24',
    percentChange: -35,
    diagnosis: {
      severity: 'warning',
      primaryCause: 'competitor-action',
      confidence: 0.72,
      reasoning: 'Competitor launched rich-snippet optimised FAQ sections on July 8. Their search listings now occupy more SERP real estate with expandable FAQ results, pushing organic CTR down for our listings at similar positions.',
      affectedAreas: ['top 5 ranking keywords', 'FAQ-heavy queries'],
      recommendedActions: [
        'Implement FAQ schema markup on top landing pages',
        'Analyse competitor SERP features with a tool like Ahrefs',
        'Optimise title tags and meta descriptions for CTR',
        'Test adding dates/numbers to title tags for click appeal'
      ],
      relatedSignals: ['average position stable', 'impressions unchanged', 'competitor showing FAQ rich results']
    }
  }
];

export function formatAnomalyExamples(maxExamples = 2) {
  const selected = ANOMALY_FEW_SHOT.slice(0, maxExamples);
  return `Here are example anomaly diagnoses for reference:\n\n${JSON.stringify(selected, null, 2)}\n\nNow diagnose the following anomaly using the same structure.`;
}
