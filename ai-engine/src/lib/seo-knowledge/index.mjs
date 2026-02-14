/**
 * SEO Knowledge Base — Barrel Export
 */

export {
  GOOGLE_UPDATES,
  findUpdatesInRange,
  getMostRecentUpdate,
  formatUpdatesForPrompt
} from './google-updates.mjs';

export {
  INTENT_PATTERNS,
  classifyIntentHeuristic,
  estimateBusinessValue,
  suggestContentType
} from './intent-heuristics.mjs';

export {
  SERP_FEATURES,
  detectLikelySERPFeatures,
  getSERPFeatureTips,
  estimateSERPCTRImpact,
  formatSERPContext
} from './serp-features.mjs';
