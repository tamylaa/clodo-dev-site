/**
 * Few-Shot Examples — Content Rewrites
 */

export const CONTENT_REWRITE_FEW_SHOT = [
  {
    url: '/blog/seo-tips',
    original: {
      title: 'SEO Tips - Our Blog',
      description: 'Read our latest SEO tips and tricks for your website.',
      h1: 'SEO Tips'
    },
    rewritten: {
      title: '15 Proven SEO Tips That Increased Our Traffic 3x in 2024',
      description: 'Discover 15 actionable SEO strategies used by top-performing sites. Includes technical fixes, content optimization tactics, and link building approaches with real case studies.',
      h1: '15 Proven SEO Tips to Triple Your Organic Traffic'
    },
    reasoning: 'Original title is generic and lacks specificity. Added number, outcome, and year for CTR. Description expanded with value proposition and social proof. H1 includes the target benefit.',
    estimatedImpact: 'high'
  },
  {
    url: '/services/web-design',
    original: {
      title: 'Web Design Services',
      description: 'We offer web design services for businesses.',
      h1: 'Web Design'
    },
    rewritten: {
      title: 'Custom Web Design Services | Fast, Mobile-First Sites From $2,999',
      description: 'Get a professionally designed website that loads in under 2 seconds and converts visitors into customers. 200+ sites launched. Free consultation available.',
      h1: 'Custom Web Design That Converts Visitors Into Customers'
    },
    reasoning: 'Transactional page needs specifics: pricing anchor, speed claim, and social proof (200+ sites). Description front-loads the value proposition with measurable outcomes.',
    estimatedImpact: 'high'
  },
  {
    url: '/blog/what-is-schema-markup',
    original: {
      title: 'What is Schema Markup?',
      description: 'Learn about schema markup and how it works.',
      h1: 'What is Schema Markup?'
    },
    rewritten: {
      title: 'What Is Schema Markup? A Beginner\'s Guide With Examples (2024)',
      description: 'Schema markup helps search engines understand your content and can earn rich snippets. Learn the 7 most impactful schema types with step-by-step implementation examples.',
      h1: 'What Is Schema Markup? Complete Beginner\'s Guide'
    },
    reasoning: 'Informational query — added "Beginner\'s Guide" and year for freshness. Description gives specific number (7 types) and promises examples, increasing CTR for knowledge seekers.',
    estimatedImpact: 'medium'
  }
];

export function formatContentRewriteExamples(maxExamples = 2) {
  const selected = CONTENT_REWRITE_FEW_SHOT.slice(0, maxExamples);
  return `Here are example content rewrites for reference:\n\n${JSON.stringify(selected, null, 2)}\n\nNow generate rewrites for the following pages using the same format.`;
}
