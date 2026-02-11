/**
 * Few-Shot Examples — Intent Classifier
 *
 * Curated examples demonstrating correct classification across all four
 * intent types, edge-cases, and multi-intent queries. These are appended
 * to the system prompt to anchor LLM behaviour.
 */

export const INTENT_FEW_SHOT = [
  {
    query: 'buy macbook pro 16 inch',
    intent: 'transactional',
    confidence: 0.95,
    businessValue: 9,
    contentType: 'product-page',
    reasoning: 'Explicit purchase verb "buy" with specific product — high commercial urgency.'
  },
  {
    query: 'best crm software for small business 2024',
    intent: 'commercial',
    confidence: 0.90,
    businessValue: 8,
    contentType: 'comparison-page',
    reasoning: '"Best" superlative + year qualifier signals evaluation phase before purchase.'
  },
  {
    query: 'how to fix 404 errors in wordpress',
    intent: 'informational',
    confidence: 0.92,
    businessValue: 4,
    contentType: 'how-to-guide',
    reasoning: '"How to" pattern indicates problem-solving; low direct revenue but good for authority.'
  },
  {
    query: 'github login',
    intent: 'navigational',
    confidence: 0.97,
    businessValue: 1,
    contentType: 'brand-page',
    reasoning: 'User knows the destination — seeking the GitHub login page directly.'
  },
  {
    query: 'ahrefs vs semrush pricing',
    intent: 'commercial',
    confidence: 0.88,
    businessValue: 7,
    contentType: 'comparison-page',
    reasoning: 'Direct brand comparison with "pricing" signals active tool evaluation.'
  },
  {
    query: 'what is semantic search',
    intent: 'informational',
    confidence: 0.94,
    businessValue: 3,
    contentType: 'glossary-entry',
    reasoning: '"What is" definitional pattern — pure information-seeking with low buying intent.'
  },
  {
    query: 'shopify discount code free shipping',
    intent: 'transactional',
    confidence: 0.85,
    businessValue: 8,
    contentType: 'landing-page',
    reasoning: 'Looking for discount codes signals imminent purchase; "free shipping" is a conversion trigger.'
  },
  {
    query: 'react useeffect cleanup function',
    intent: 'informational',
    confidence: 0.91,
    businessValue: 2,
    contentType: 'tutorial',
    reasoning: 'Technical reference query — developer looking for implementation guidance.'
  }
];

/**
 * Format few-shot examples for injection into the system prompt.
 */
export function formatIntentExamples(maxExamples = 4) {
  const selected = INTENT_FEW_SHOT.slice(0, maxExamples);
  const formatted = JSON.stringify(selected, null, 2);
  return `Here are example classifications for reference:\n\n${formatted}\n\nNow classify the following queries using the same format.`;
}
