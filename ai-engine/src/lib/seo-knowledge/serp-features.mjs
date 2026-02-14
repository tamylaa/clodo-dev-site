/**
 * SEO Knowledge Base — SERP Features
 *
 * Comprehensive reference for Google SERP features, their CTR impact,
 * optimisation strategies, and detection patterns.
 *
 * Used by content-rewrites, intent-classifier, and recommendation-refiner
 * to make SERP-aware suggestions.
 */

// ── SERP Feature Definitions ─────────────────────────────────────────

export const SERP_FEATURES = [
  {
    id: 'featured-snippet',
    name: 'Featured Snippet',
    description: 'Highlighted answer box above organic results (position 0)',
    ctrImpact: 'high',
    organicCTRChange: -0.12, // Featured snippets reduce organic #1 CTR by ~12%
    ownCTRBoost: 0.25,       // Owning the snippet can boost CTR by ~25%
    triggerIntents: ['informational', 'navigational'],
    triggerPatterns: ['what is', 'how to', 'why', 'definition', 'meaning', 'steps', 'best way'],
    optimisationTips: [
      'Structure content with clear H2/H3 headings matching the query',
      'Provide a concise 40-60 word answer directly after the heading',
      'Use numbered/bulleted lists for step-by-step queries',
      'Include a definition-style paragraph for "what is" queries',
      'Use tables for comparison queries'
    ],
    formats: ['paragraph', 'list', 'table']
  },
  {
    id: 'people-also-ask',
    name: 'People Also Ask',
    description: 'Expandable related questions with snippet answers',
    ctrImpact: 'medium',
    organicCTRChange: -0.05,
    ownCTRBoost: 0.08,
    triggerIntents: ['informational'],
    triggerPatterns: ['how', 'what', 'why', 'when', 'where', 'can', 'does', 'is'],
    optimisationTips: [
      'Create FAQ sections targeting related questions',
      'Use FAQ structured data (schema.org/FAQPage)',
      'Answer questions concisely in 2-3 sentences',
      'Include the question as an H2/H3 heading'
    ],
    formats: ['accordion']
  },
  {
    id: 'local-pack',
    name: 'Local Pack / Map Pack',
    description: '3-pack of local business listings with map',
    ctrImpact: 'high',
    organicCTRChange: -0.18,
    ownCTRBoost: 0.30,
    triggerIntents: ['local', 'transactional'],
    triggerPatterns: ['near me', 'in [city]', 'local', 'open now', 'directions', 'hours'],
    optimisationTips: [
      'Optimise Google Business Profile completely',
      'Ensure NAP consistency across directories',
      'Encourage and respond to reviews',
      'Use LocalBusiness structured data',
      'Create location-specific landing pages'
    ],
    formats: ['map', 'listings']
  },
  {
    id: 'knowledge-panel',
    name: 'Knowledge Panel',
    description: 'Entity information card on right side of SERP',
    ctrImpact: 'medium',
    organicCTRChange: -0.08,
    ownCTRBoost: 0.15,
    triggerIntents: ['navigational', 'informational'],
    triggerPatterns: ['[brand name]', 'who is', 'company', 'organization'],
    optimisationTips: [
      'Claim your Google Knowledge Panel',
      'Use Organization/Person schema markup',
      'Maintain consistent entity information across the web',
      'Build Wikipedia/Wikidata presence for notable entities'
    ],
    formats: ['panel']
  },
  {
    id: 'image-pack',
    name: 'Image Pack',
    description: 'Row of images displayed inline in search results',
    ctrImpact: 'low',
    organicCTRChange: -0.03,
    ownCTRBoost: 0.05,
    triggerIntents: ['informational', 'commercial'],
    triggerPatterns: ['photos', 'images', 'pictures', 'design', 'examples', 'ideas', 'inspiration'],
    optimisationTips: [
      'Use descriptive alt text with target keywords',
      'Optimise image file names',
      'Use WebP format with proper dimensions',
      'Implement ImageObject structured data',
      'Create image-rich content for visual queries'
    ],
    formats: ['carousel']
  },
  {
    id: 'video-carousel',
    name: 'Video Carousel',
    description: 'Horizontal scrollable video results, usually from YouTube',
    ctrImpact: 'medium',
    organicCTRChange: -0.10,
    ownCTRBoost: 0.12,
    triggerIntents: ['informational'],
    triggerPatterns: ['how to', 'tutorial', 'review', 'demo', 'walkthrough', 'video', 'watch'],
    optimisationTips: [
      'Create YouTube content targeting the keyword',
      'Use VideoObject structured data',
      'Add timestamps/chapters to videos',
      'Optimise video titles and descriptions for search',
      'Embed videos on corresponding pages'
    ],
    formats: ['carousel']
  },
  {
    id: 'shopping-results',
    name: 'Shopping Results',
    description: 'Product listings with images, prices, and ratings',
    ctrImpact: 'high',
    organicCTRChange: -0.15,
    ownCTRBoost: 0.20,
    triggerIntents: ['transactional', 'commercial'],
    triggerPatterns: ['buy', 'price', 'cheap', 'deal', 'discount', 'shop', 'order', 'best', 'review'],
    optimisationTips: [
      'Submit product feed to Google Merchant Center',
      'Use Product structured data with price, availability, reviews',
      'Ensure competitive pricing is visible',
      'Maintain high-quality product images',
      'Collect and display product reviews'
    ],
    formats: ['grid', 'carousel']
  },
  {
    id: 'sitelinks',
    name: 'Sitelinks',
    description: 'Additional deep links shown beneath a main result',
    ctrImpact: 'medium',
    organicCTRChange: 0.0,
    ownCTRBoost: 0.10,
    triggerIntents: ['navigational'],
    triggerPatterns: ['[brand]', 'login', 'dashboard', 'contact'],
    optimisationTips: [
      'Use clear site architecture with logical hierarchy',
      'Implement proper internal linking',
      'Use descriptive anchor text',
      'Create a comprehensive sitemap',
      'Ensure important pages are accessible within 2-3 clicks'
    ],
    formats: ['links']
  },
  {
    id: 'top-stories',
    name: 'Top Stories',
    description: 'News carousel for trending or timely topics',
    ctrImpact: 'medium',
    organicCTRChange: -0.07,
    ownCTRBoost: 0.15,
    triggerIntents: ['informational'],
    triggerPatterns: ['news', 'latest', 'update', 'today', 'breaking', 'announcement'],
    optimisationTips: [
      'Publish timely, newsworthy content',
      'Use Article/NewsArticle structured data',
      'Submit to Google News if eligible',
      'Ensure fast page load and Core Web Vitals compliance',
      'Use clear publication dates and author info'
    ],
    formats: ['carousel']
  },
  {
    id: 'ai-overview',
    name: 'AI Overview (SGE)',
    description: 'AI-generated answer synthesis at top of SERP',
    ctrImpact: 'high',
    organicCTRChange: -0.20,
    ownCTRBoost: 0.0,
    triggerIntents: ['informational'],
    triggerPatterns: ['what is', 'how does', 'explain', 'compare', 'vs', 'difference'],
    optimisationTips: [
      'Create comprehensive, authoritative content that AI can cite',
      'Use clear structure with facts, definitions, and examples',
      'Build E-E-A-T signals (expertise, experience, authority, trust)',
      'Focus on unique insights AI cannot easily synthesise',
      'Target long-tail queries where AI overviews are less common'
    ],
    formats: ['text']
  }
];

// ── Helper Functions ─────────────────────────────────────────────────

/**
 * Find SERP features likely triggered by a keyword query.
 */
export function detectLikelySERPFeatures(query, intent) {
  if (!query) return [];

  const q = query.toLowerCase();
  const matches = [];

  for (const feature of SERP_FEATURES) {
    // Check intent match
    const intentMatch = !intent || feature.triggerIntents.includes(intent);
    if (!intentMatch) continue;

    // Check pattern match
    const patternMatch = feature.triggerPatterns.some(pattern => {
      if (pattern.startsWith('[') && pattern.endsWith(']')) return false; // Skip placeholder patterns
      return q.includes(pattern.toLowerCase());
    });

    if (patternMatch) {
      matches.push({
        id: feature.id,
        name: feature.name,
        ctrImpact: feature.ctrImpact,
        organicCTRChange: feature.organicCTRChange
      });
    }
  }

  return matches;
}

/**
 * Get optimisation tips for a specific SERP feature.
 */
export function getSERPFeatureTips(featureId) {
  const feature = SERP_FEATURES.find(f => f.id === featureId);
  if (!feature) return null;
  return {
    name: feature.name,
    tips: feature.optimisationTips,
    expectedCTRBoost: feature.ownCTRBoost,
    formats: feature.formats
  };
}

/**
 * Estimate the CTR impact of detected SERP features on organic results.
 * Returns a modifier (negative = features steal clicks from organic).
 */
export function estimateSERPCTRImpact(detectedFeatures) {
  if (!detectedFeatures || detectedFeatures.length === 0) return 0;

  // Use the worst impact (most negative) since features compound
  let totalImpact = 0;
  for (const f of detectedFeatures) {
    const feature = SERP_FEATURES.find(sf => sf.id === f.id || sf.id === f);
    if (feature) {
      totalImpact += feature.organicCTRChange;
    }
  }

  // Cap at -40% total impact
  return Math.max(totalImpact, -0.40);
}

/**
 * Format SERP feature context for injection into LLM prompts.
 */
export function formatSERPContext(detectedFeatures) {
  if (!detectedFeatures || detectedFeatures.length === 0) return '';

  const lines = detectedFeatures.map(f => {
    const feature = SERP_FEATURES.find(sf => sf.id === f.id || sf.id === f);
    if (!feature) return null;
    return `- ${feature.name}: ${feature.description} (CTR impact: ${feature.ctrImpact})`;
  }).filter(Boolean);

  if (lines.length === 0) return '';
  return `\nDETECTED SERP FEATURES:\n${lines.join('\n')}`;
}
