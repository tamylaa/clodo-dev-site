/**
 * Few-Shot Examples — Content Gap Analysis
 */

const CONTENT_GAPS_EXAMPLES = [
  {
    input: {
      siteKeywords: ['crm software', 'crm pricing', 'crm features'],
      competitorKeywords: [
        { keyword: 'crm for small business', source: 'competitor-a.com', position: 3, volume: 5400 },
        { keyword: 'crm implementation guide', source: 'competitor-b.com', position: 2, volume: 2900 },
        { keyword: 'crm vs erp', source: 'competitor-a.com', position: 5, volume: 3200 }
      ]
    },
    output: {
      gaps: [
        {
          keyword: 'crm for small business',
          opportunity: 'high',
          estimatedVolume: 5400,
          difficulty: 'moderate',
          suggestedContentType: 'comparison-guide',
          suggestedTitle: 'Best CRM for Small Business in 2025: Top 10 Picks',
          reasoning: 'High-volume commercial keyword. The site covers CRM software generally but lacks a small-business-specific landing page. Competitor ranks #3.',
          competitorUrls: ['competitor-a.com']
        },
        {
          keyword: 'crm implementation guide',
          opportunity: 'medium',
          estimatedVolume: 2900,
          difficulty: 'easy',
          suggestedContentType: 'long-form-guide',
          suggestedTitle: 'CRM Implementation Guide: Step-by-Step for 2025',
          reasoning: 'Informational keyword related to existing product content. Low competition, easy to create with existing domain expertise.',
          competitorUrls: ['competitor-b.com']
        },
        {
          keyword: 'crm vs erp',
          opportunity: 'medium',
          estimatedVolume: 3200,
          difficulty: 'moderate',
          suggestedContentType: 'comparison-article',
          suggestedTitle: 'CRM vs ERP: Key Differences, Pros & Cons Explained',
          reasoning: 'Commercial investigation query. Target audience likely evaluating both — good for capturing top-of-funnel traffic.',
          competitorUrls: ['competitor-a.com']
        }
      ],
      summary: '3 content gaps identified. Highest priority: "crm for small business" (5,400 monthly volume, competitor ranks #3). Two additional moderate-opportunity gaps in educational content.',
      topOpportunities: ['crm for small business', 'crm vs erp', 'crm implementation guide']
    }
  }
];

/**
 * Format content gap examples for system prompt injection.
 */
export function formatContentGapExamples(maxExamples = 1) {
  return CONTENT_GAPS_EXAMPLES.slice(0, maxExamples)
    .map((ex, i) => `Example ${i + 1}:\nInput: ${JSON.stringify(ex.input, null, 2)}\nOutput: ${JSON.stringify(ex.output, null, 2)}`)
    .join('\n\n');
}

export { CONTENT_GAPS_EXAMPLES };
