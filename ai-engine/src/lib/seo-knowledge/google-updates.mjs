/**
 * SEO Knowledge Base — Google Algorithm Updates
 *
 * A structured timeline of confirmed Google algorithm updates used by the
 * anomaly-diagnosis capability to correlate traffic drops with known events.
 * This replaces pure LLM "maybe it was an update" guessing with hard data.
 *
 * Source: Google Search Status Dashboard + confirmed industry reporting.
 * Dates are rollout START dates (rollouts often span 1-3 weeks).
 */

export const GOOGLE_UPDATES = [
  // 2025
  { date: '2025-06-17', name: 'June 2025 Core Update', type: 'core', scope: 'broad', duration: '~14 days', notes: 'Broad core ranking update' },
  { date: '2025-03-13', name: 'March 2025 Core Update', type: 'core', scope: 'broad', duration: '~14 days', notes: 'Follows December site reputation abuse enforcement' },

  // 2024
  { date: '2024-12-16', name: 'December 2024 Core Update', type: 'core', scope: 'broad', duration: '~14 days' },
  { date: '2024-11-11', name: 'November 2024 Core Update', type: 'core', scope: 'broad', duration: '~25 days' },
  { date: '2024-08-15', name: 'August 2024 Core Update', type: 'core', scope: 'broad', duration: '~20 days' },
  { date: '2024-06-20', name: 'June 2024 Spam Update', type: 'spam', scope: 'targeted', duration: '~7 days', notes: 'Site reputation abuse, expired domain abuse' },
  { date: '2024-03-05', name: 'March 2024 Core Update', type: 'core', scope: 'broad', duration: '~45 days', notes: 'Massive update combining core + spam + helpful content. Deindexed hundreds of low-quality sites.' },
  { date: '2024-03-05', name: 'March 2024 Spam Update', type: 'spam', scope: 'targeted', duration: '~14 days', notes: 'Expired domain abuse, scaled content abuse, site reputation abuse' },

  // 2023
  { date: '2023-11-02', name: 'November 2023 Core Update', type: 'core', scope: 'broad', duration: '~25 days' },
  { date: '2023-11-08', name: 'November 2023 Reviews Update', type: 'reviews', scope: 'reviews', duration: '~14 days' },
  { date: '2023-10-05', name: 'October 2023 Core Update', type: 'core', scope: 'broad', duration: '~14 days' },
  { date: '2023-10-04', name: 'October 2023 Spam Update', type: 'spam', scope: 'targeted', duration: '~14 days' },
  { date: '2023-09-14', name: 'September 2023 Helpful Content Update', type: 'helpful-content', scope: 'broad', duration: '~14 days' },
  { date: '2023-08-22', name: 'August 2023 Core Update', type: 'core', scope: 'broad', duration: '~16 days' },
  { date: '2023-04-12', name: 'April 2023 Reviews Update', type: 'reviews', scope: 'reviews', duration: '~13 days' },
  { date: '2023-03-15', name: 'March 2023 Core Update', type: 'core', scope: 'broad', duration: '~13 days' },
  { date: '2023-02-21', name: 'February 2023 Product Reviews Update', type: 'reviews', scope: 'reviews', duration: '~14 days' },

  // 2022
  { date: '2022-12-14', name: 'December 2022 Link Spam Update', type: 'spam', scope: 'targeted', duration: '~29 days' },
  { date: '2022-12-05', name: 'December 2022 Helpful Content Update', type: 'helpful-content', scope: 'broad', duration: '~38 days' },
  { date: '2022-10-19', name: 'October 2022 Spam Update', type: 'spam', scope: 'targeted', duration: '~2 days' },
  { date: '2022-09-12', name: 'September 2022 Core Update', type: 'core', scope: 'broad', duration: '~14 days' },
  { date: '2022-08-25', name: 'August 2022 Helpful Content Update', type: 'helpful-content', scope: 'broad', duration: '~15 days', notes: 'First helpful content update — site-wide classifier.' },
  { date: '2022-07-27', name: 'July 2022 Product Reviews Update', type: 'reviews', scope: 'reviews', duration: '~6 days' },
  { date: '2022-05-25', name: 'May 2022 Core Update', type: 'core', scope: 'broad', duration: '~15 days' },
  { date: '2022-03-23', name: 'March 2022 Product Reviews Update', type: 'reviews', scope: 'reviews', duration: '~18 days' }
];

/**
 * Find Google updates within a date range (±buffer days).
 *
 * @param {string} startDate  ISO date string: '2024-03-01'
 * @param {string} endDate    ISO date string: '2024-03-31'
 * @param {number} bufferDays Extra days before startDate to check (default 14)
 * @returns {Array} Matching updates
 */
export function findUpdatesInRange(startDate, endDate, bufferDays = 14) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const bufferedStart = new Date(start);
  bufferedStart.setDate(bufferedStart.getDate() - bufferDays);

  return GOOGLE_UPDATES.filter(update => {
    const updateDate = new Date(update.date);
    return updateDate >= bufferedStart && updateDate <= end;
  });
}

/**
 * Get the most recent update before or during a given date.
 */
export function getMostRecentUpdate(dateStr) {
  const target = new Date(dateStr);
  return GOOGLE_UPDATES.find(u => new Date(u.date) <= target) || null;
}

/**
 * Build a compact update context string for injection into LLM prompts.
 */
export function formatUpdatesForPrompt(startDate, endDate) {
  const relevant = findUpdatesInRange(startDate, endDate, 21);
  if (!relevant.length) {
    return 'No confirmed Google algorithm updates occurred during or near this period.';
  }
  const lines = relevant.map(u =>
    `- ${u.date}: ${u.name} (${u.type}, ${u.scope}${u.notes ? ', ' + u.notes : ''})`
  );
  return `Confirmed Google algorithm updates near this period:\n${lines.join('\n')}`;
}
