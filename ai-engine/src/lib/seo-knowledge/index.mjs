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
