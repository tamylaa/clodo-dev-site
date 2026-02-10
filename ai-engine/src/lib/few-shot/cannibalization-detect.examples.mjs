/**
 * Few-Shot Examples — Cannibalization Detection
 */

const CANNIBALIZATION_EXAMPLES = [
  {
    input: {
      pages: [
        { url: '/blog/best-crm-software', title: 'Best CRM Software 2025', keywords: ['best crm software'], position: 8, clicks: 120 },
        { url: '/reviews/crm-comparison', title: 'CRM Software Comparison & Reviews', keywords: ['best crm software', 'crm comparison'], position: 12, clicks: 45 }
      ]
    },
    output: {
      conflicts: [{
        keyword: 'best crm software',
        severity: 'high',
        pages: [
          { url: '/blog/best-crm-software', title: 'Best CRM Software 2025', position: 8, clicks: 120 },
          { url: '/reviews/crm-comparison', title: 'CRM Software Comparison & Reviews', position: 12, clicks: 45 }
        ],
        recommendation: 'Consolidate into a single authoritative page. Redirect /reviews/crm-comparison to /blog/best-crm-software and merge unique review content.',
        suggestedCanonical: '/blog/best-crm-software',
        estimatedTrafficLoss: 35
      }],
      summary: '1 cannibalization conflict detected. Both pages target "best crm software" and split ranking signals, with neither reaching top-5.',
      overallSeverity: 'high'
    }
  },
  {
    input: {
      pages: [
        { url: '/services/seo-audit', title: 'SEO Audit Services', keywords: ['seo audit'], position: 3, clicks: 800 },
        { url: '/blog/seo-audit-guide', title: 'How to Do an SEO Audit', keywords: ['seo audit', 'seo audit guide'], position: 5, clicks: 400 },
        { url: '/tools/free-seo-audit', title: 'Free SEO Audit Tool', keywords: ['seo audit', 'free seo audit'], position: 15, clicks: 60 }
      ]
    },
    output: {
      conflicts: [{
        keyword: 'seo audit',
        severity: 'critical',
        pages: [
          { url: '/services/seo-audit', title: 'SEO Audit Services', position: 3, clicks: 800 },
          { url: '/blog/seo-audit-guide', title: 'How to Do an SEO Audit', position: 5, clicks: 400 },
          { url: '/tools/free-seo-audit', title: 'Free SEO Audit Tool', position: 15, clicks: 60 }
        ],
        recommendation: 'Three-way cannibalization. Differentiate intent: keep /services for transactional, /blog for informational, and either redirect /tools or add clear canonical to /services. Add internal links from guide → service page.',
        suggestedCanonical: '/services/seo-audit',
        estimatedTrafficLoss: 45
      }],
      summary: '1 critical cannibalization cluster involving 3 pages competing for "seo audit". The services page has the strongest position but is being suppressed.',
      overallSeverity: 'critical'
    }
  }
];

/**
 * Format cannibalization examples for system prompt injection.
 */
export function formatCannibalizationExamples(maxExamples = 2) {
  return CANNIBALIZATION_EXAMPLES.slice(0, maxExamples)
    .map((ex, i) => `Example ${i + 1}:\nInput: ${JSON.stringify(ex.input, null, 2)}\nOutput: ${JSON.stringify(ex.output, null, 2)}`)
    .join('\n\n');
}

export { CANNIBALIZATION_EXAMPLES };
