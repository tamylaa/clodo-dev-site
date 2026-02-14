/**
 * SEO Knowledge Base — Intent Heuristics
 *
 * Rule-based intent signals that supplement LLM classification.
 * The intent-classifier uses these as a pre-filter and validation layer:
 *   1. Run heuristic classification first (cheap, instant, deterministic)
 *   2. If confidence ≥ 0.85, use heuristic result directly
 *   3. If confidence < 0.85 or ambiguous, defer to LLM
 *   4. Cross-check LLM output against heuristic for consistency
 */

/**
 * Pattern-based intent signals.
 * Each pattern has a regex, the intent it signals, a weight (0-1),
 * and what it catches.
 */
export const INTENT_PATTERNS = [
  // ── Transactional (~40 signal words) ────────────────────────────
  { pattern: /\b(buy|purchase|order|shop|deal|discount|coupon|promo|checkout|add to cart)\b/i, intent: 'transactional', weight: 0.90, label: 'purchase-verb' },
  { pattern: /\b(price|pricing|cost|cheap|affordable|subscription|plan|quote|estimate)\b/i, intent: 'transactional', weight: 0.70, label: 'price-signal' },
  { pattern: /\b(free (trial|shipping|download|version|sample))\b/i, intent: 'transactional', weight: 0.80, label: 'free-offer' },
  { pattern: /\b(for sale|on sale|limited offer|clearance|outlet)\b/i, intent: 'transactional', weight: 0.85, label: 'sale-signal' },
  { pattern: /\b(hire|book|reserve|schedule|appointment|enroll|register|subscribe)\b/i, intent: 'transactional', weight: 0.85, label: 'action-verb' },
  { pattern: /\b(download|install|get started|try now|demo|trial)\b/i, intent: 'transactional', weight: 0.75, label: 'acquisition-signal' },
  { pattern: /\b(warranty|guarantee|money back|refund|return policy)\b/i, intent: 'transactional', weight: 0.65, label: 'purchase-assurance' },
  { pattern: /\b(delivery|express|overnight|same day|next day)\b/i, intent: 'transactional', weight: 0.60, label: 'fulfilment-signal' },

  // ── Commercial Investigation (~40 signal words) ─────────────────
  { pattern: /\b(best|top|vs|versus|compare|comparison|review|reviews|rated|ranking)\b/i, intent: 'commercial', weight: 0.80, label: 'comparison' },
  { pattern: /\b(alternative|alternatives to|like|similar to|competitor)\b/i, intent: 'commercial', weight: 0.85, label: 'alternative-seeking' },
  { pattern: /\b(\d{4})\b/, intent: 'commercial', weight: 0.20, label: 'year-freshness' },
  { pattern: /\b(for (small business|startups|enterprise|teams|developers|beginners|freelancers|agencies))\b/i, intent: 'commercial', weight: 0.75, label: 'audience-filter' },
  { pattern: /\b(worth it|should i|is it good|reliable|trustworthy|legit|scam)\b/i, intent: 'commercial', weight: 0.80, label: 'evaluation' },
  { pattern: /\b(pros and cons|advantages|disadvantages|benefits|drawbacks|features)\b/i, intent: 'commercial', weight: 0.75, label: 'feature-evaluation' },
  { pattern: /\b(cheapest|most affordable|budget|premium|luxury|professional)\b/i, intent: 'commercial', weight: 0.70, label: 'tier-comparison' },
  { pattern: /\b(recommendations?|suggest|which one|what to choose|pick)\b/i, intent: 'commercial', weight: 0.70, label: 'recommendation-seeking' },
  { pattern: /\b(benchmark|performance|speed test|reliability|uptime)\b/i, intent: 'commercial', weight: 0.65, label: 'performance-eval' },

  // ── Informational (~45 signal words) ────────────────────────────
  { pattern: /\b(what is|what are|how to|how do|how does|why do|why does|when to|when should)\b/i, intent: 'informational', weight: 0.85, label: 'question-pattern' },
  { pattern: /\b(guide|tutorial|learn|explained|definition|meaning|example|examples|walkthrough)\b/i, intent: 'informational', weight: 0.80, label: 'learning-signal' },
  { pattern: /\b(tips|tricks|ideas|strategies|techniques|methods|ways to|steps to)\b/i, intent: 'informational', weight: 0.65, label: 'advice-pattern' },
  { pattern: /\b(difference between|pros and cons|vs meaning|compared to)\b/i, intent: 'informational', weight: 0.75, label: 'analysis-pattern' },
  { pattern: /\b(can you|can i|is it possible|how long|how much does|how many)\b/i, intent: 'informational', weight: 0.70, label: 'question-auxiliary' },
  { pattern: /\b(template|checklist|cheat sheet|worksheet|framework|formula|calculator)\b/i, intent: 'informational', weight: 0.70, label: 'resource-seeking' },
  { pattern: /\b(statistics|data|research|study|survey|report|trends|forecast)\b/i, intent: 'informational', weight: 0.60, label: 'data-seeking' },
  { pattern: /\b(beginner|advanced|intermediate|101|basics|fundamentals|introduction)\b/i, intent: 'informational', weight: 0.65, label: 'skill-level' },
  { pattern: /\b(diagram|infographic|chart|map|timeline|history|overview)\b/i, intent: 'informational', weight: 0.55, label: 'visual-content' },
  { pattern: /\b(cause|reason|solution|fix|solve|troubleshoot|debug|error)\b/i, intent: 'informational', weight: 0.70, label: 'problem-solving' },

  // ── Navigational (~30 signal words) ─────────────────────────────
  { pattern: /\b(login|log in|sign in|signin|signup|sign up|my account|dashboard)\b/i, intent: 'navigational', weight: 0.92, label: 'auth-nav' },
  { pattern: /\b(\.com|\.org|\.io|\.net|\.co)\b/i, intent: 'navigational', weight: 0.85, label: 'domain-nav' },
  { pattern: /\b(official|website|homepage|support|help center|contact|customer service)\b/i, intent: 'navigational', weight: 0.70, label: 'site-nav' },
  { pattern: /\b(app|application|software|platform|tool|extension|plugin)\b/i, intent: 'navigational', weight: 0.40, label: 'product-nav' },
  { pattern: /\b(api|docs|documentation|changelog|release notes|status page)\b/i, intent: 'navigational', weight: 0.75, label: 'developer-nav' },
  { pattern: /\b(hours|location|address|directions|phone number|near me|open now)\b/i, intent: 'navigational', weight: 0.80, label: 'local-nav' }
];

/**
 * Run heuristic intent classification on a single query.
 *
 * @param {string} query  The search query
 * @returns {{ intent: string, confidence: number, signals: string[], isAmbiguous: boolean }}
 */
export function classifyIntentHeuristic(query) {
  const normalised = query.toLowerCase().trim();
  const matches = [];

  for (const { pattern, intent, weight, label } of INTENT_PATTERNS) {
    if (pattern.test(normalised)) {
      matches.push({ intent, weight, label });
    }
  }

  if (matches.length === 0) {
    return { intent: 'informational', confidence: 0.3, signals: [], isAmbiguous: true };
  }

  // Aggregate scores per intent
  const scores = {};
  const signalsByIntent = {};
  for (const m of matches) {
    scores[m.intent] = (scores[m.intent] || 0) + m.weight;
    signalsByIntent[m.intent] = signalsByIntent[m.intent] || [];
    signalsByIntent[m.intent].push(m.label);
  }

  // Find dominant intent
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const [topIntent, topScore] = sorted[0];
  const secondScore = sorted[1]?.[1] || 0;

  // Confidence: normalise top score and penalise if close to second
  const rawConfidence = Math.min(topScore / 1.5, 1.0);
  const ambiguityPenalty = secondScore > 0 ? (secondScore / topScore) * 0.2 : 0;
  const confidence = Math.max(0.1, rawConfidence - ambiguityPenalty);

  return {
    intent: topIntent,
    confidence: parseFloat(confidence.toFixed(2)),
    signals: signalsByIntent[topIntent],
    isAmbiguous: sorted.length > 1 && (secondScore / topScore) > 0.6
  };
}

/**
 * Business value estimation based on intent + query signals.
 */
export function estimateBusinessValue(query, intent) {
  const baseValues = {
    transactional: 8,
    commercial: 6,
    informational: 3,
    navigational: 1
  };

  let value = baseValues[intent] || 3;

  // Adjustments
  if (/\b(enterprise|business|professional|premium)\b/i.test(query)) value += 1;
  if (/\b(free|open source|diy)\b/i.test(query)) value -= 1;
  if (/\b(pricing|plans|demo|trial)\b/i.test(query)) value += 1;
  if (/\b(agency|saas|platform|tool|software)\b/i.test(query)) value += 1;

  return Math.min(10, Math.max(1, value));
}

/**
 * Suggest content type based on intent and query patterns.
 */
export function suggestContentType(query, intent) {
  const q = query.toLowerCase();

  if (intent === 'transactional') {
    if (/\b(pricing|plans|cost)\b/.test(q)) return 'pricing-page';
    if (/\b(buy|order|shop)\b/.test(q)) return 'product-page';
    return 'landing-page';
  }

  if (intent === 'commercial') {
    if (/\b(vs|versus|compare|comparison)\b/.test(q)) return 'comparison-page';
    if (/\b(best|top|rated)\b/.test(q)) return 'listicle';
    if (/\b(review|reviews)\b/.test(q)) return 'review-page';
    if (/\b(alternative)\b/.test(q)) return 'alternatives-page';
    return 'comparison-page';
  }

  if (intent === 'informational') {
    if (/\b(what is|meaning|definition)\b/.test(q)) return 'glossary-entry';
    if (/\b(how to|tutorial|step)\b/.test(q)) return 'how-to-guide';
    if (/\b(tips|ideas|strategies)\b/.test(q)) return 'listicle';
    if (/\b(example|template|sample)\b/.test(q)) return 'resource-page';
    return 'article';
  }

  return 'brand-page'; // navigational
}
