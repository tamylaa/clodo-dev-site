/**
 * Few-Shot Examples — SEO Page Scorer
 */

const PAGE_SCORER_EXAMPLES = [
  {
    input: {
      pages: [{
        url: '/blog/seo-tips',
        title: 'SEO Tips for 2025',
        description: 'Learn the best SEO tips.',
        headings: ['SEO Tips for 2025', 'Tip 1: Keyword Research', 'Tip 2: On-Page SEO'],
        wordCount: 1200,
        loadTimeMs: 3200,
        mobileOptimised: true,
        internalLinks: 3,
        externalLinks: 1,
        images: 4,
        imagesWithAlt: 2,
        schemaMarkup: false,
        keywords: ['seo tips', 'seo tips 2025']
      }]
    },
    output: {
      scores: [{
        url: '/blog/seo-tips',
        overallScore: 62,
        grade: 'C',
        dimensions: {
          technical: {
            score: 55,
            issues: ['Load time 3200ms exceeds 2500ms target', 'No schema markup detected'],
            suggestions: ['Optimize images and enable lazy loading', 'Add Article schema markup']
          },
          content: {
            score: 68,
            issues: ['Word count 1200 is below 1500 recommended minimum for competitive keywords', 'Only 2 of 4 images have alt text'],
            suggestions: ['Expand content to 1500+ words with deeper analysis', 'Add descriptive alt text to all images']
          },
          onPage: {
            score: 72,
            issues: ['Meta description too short (28 chars), should be 120-160', 'Only 3 internal links — aim for 5-8'],
            suggestions: ['Write a compelling 150-char meta description including target keyword', 'Add internal links to related blog posts']
          },
          ux: {
            score: 75,
            issues: ['Only 1 external link — consider citing authoritative sources'],
            suggestions: ['Link to 2-3 authoritative external sources to boost E-E-A-T signals']
          }
        },
        topPriority: 'Improve page load speed — currently 3.2s, target under 2.5s for Core Web Vitals',
        estimatedImpact: 'high'
      }],
      averageScore: 62,
      summary: '1 page analysed with an average score of 62/100 (Grade C). Top priorities: page speed optimisation and content expansion.'
    }
  }
];

/**
 * Format page scorer examples for system prompt injection.
 */
export function formatPageScorerExamples(maxExamples = 1) {
  return PAGE_SCORER_EXAMPLES.slice(0, maxExamples)
    .map((ex, i) => `Example ${i + 1}:\nInput: ${JSON.stringify(ex.input, null, 2)}\nOutput: ${JSON.stringify(ex.output, null, 2)}`)
    .join('\n\n');
}

export { PAGE_SCORER_EXAMPLES };
