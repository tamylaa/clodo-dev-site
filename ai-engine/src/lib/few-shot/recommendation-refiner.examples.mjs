/**
 * Few-Shot Examples — Recommendation Refiner
 */

export const RECOMMENDATION_REFINER_FEW_SHOT = [
  {
    original: 'Improve page speed',
    refined: 'Reduce Largest Contentful Paint (LCP) from 4.2s to under 2.5s on the top 10 landing pages by optimizing images, implementing lazy loading, and enabling CDN caching',
    priority: 'critical',
    effort: 'moderate',
    estimatedImpact: 'Core Web Vitals directly affect rankings. Fixing LCP on top pages could improve organic CTR by 15-25% based on industry benchmarks.',
    actionSteps: [
      'Audit top 10 pages with PageSpeed Insights and note LCP element',
      'Convert hero images to WebP/AVIF with srcset for responsive delivery',
      'Implement native lazy loading on below-fold images and iframes',
      'Enable Brotli compression and CDN-level caching for static assets',
      'Re-measure and confirm LCP < 2.5s on mobile'
    ],
    rationale: 'LCP is the most impactful Core Web Vital for rankings. The top 10 pages generate 60% of organic traffic, so fixing them first maximises ROI.'
  },
  {
    original: 'Create more blog content',
    refined: 'Publish 4 bottom-of-funnel comparison articles targeting high-CPC commercial keywords (e.g., "[product] vs [competitor]", "best [category] for [use case]") within the next 30 days',
    priority: 'high',
    effort: 'significant',
    estimatedImpact: 'Commercial comparison content converts 3-5x better than informational posts. Targeting 4 high-CPC keywords could generate $2,000-5,000/month in equivalent ad value.',
    actionSteps: [
      'Identify top 10 commercial-intent keywords from GSC with position 5-20',
      'Select 4 keywords with highest CPC and MSV that match product capability',
      'Create detailed comparison frameworks with feature tables and real screenshots',
      'Add conversion CTAs within the content (not just at the end)',
      'Build 2-3 internal links from existing high-authority pages to each new post'
    ],
    rationale: 'Generic "more content" is unfocused. Bottom-of-funnel commercial content directly impacts revenue and is often under-represented in content strategies.'
  }
];

export function formatRecommendationExamples(maxExamples = 2) {
  const selected = RECOMMENDATION_REFINER_FEW_SHOT.slice(0, maxExamples);
  return `Here are examples of how vague recommendations should be refined into actionable, specific plans:\n\n${JSON.stringify(selected, null, 2)}\n\nNow refine the following recommendations using the same depth and specificity.`;
}
