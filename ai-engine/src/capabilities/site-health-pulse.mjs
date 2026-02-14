/**
 * Capability 11: Site Health Pulse
 *
 * Composite orchestrator that runs page-scorer, cannibalization-detect,
 * content-gaps, and anomaly-diagnosis in parallel, then cross-references
 * findings into a unified health score with insight chains.
 *
 * Architecture:
 *   1. Fan-out — dispatch applicable sub-capabilities concurrently
 *   2. Aggregate — normalise each sub-result into a 0-100 dimension score
 *   3. Cross-reference — detect patterns that span capabilities
 *   4. Synthesise — compute composite health score + top priorities
 *
 * No additional LLM call — the sub-capabilities handle AI inference.
 * This keeps cost zero-marginal and latency bounded by the slowest sub-cap.
 */

import { createLogger } from '../lib/framework-shims.mjs';
import { SiteHealthPulseInputSchema } from '../lib/schemas/site-health-pulse.schema.mjs';
import { validateInput } from '../lib/validate-input.mjs';
import { round, avg } from '../lib/math-utils.mjs';
import { scorePages } from './page-scorer.mjs';
import { detectCannibalization } from './cannibalization-detect.mjs';
import { analyseContentGaps } from './content-gaps.mjs';
import { diagnoseAnomalies } from './anomaly-diagnosis.mjs';

const logger = createLogger('ai-site-health-pulse');

// ── Main entry ──────────────────────────────────────────────────────

export async function siteHealthPulse(body, env) {
  const start = Date.now();
  const v = validateInput(SiteHealthPulseInputSchema, body);
  if (!v.valid) return v.error;

  const {
    pages,
    anomalies = [],
    currentData = {},
    siteKeywords = [],
    competitorKeywords = [],
    context = {}
  } = v.data;

  // ── Phase 1: Fan-out sub-capabilities ─────────────────────────────
  const subMeta = {};
  const tasks = [];

  // Always run page-scorer (pages is required)
  tasks.push(runSub('page-scorer', subMeta, () =>
    scorePages({ pages, context }, env)
  ));

  // Run cannibalization if ≥ 2 pages have keywords
  const pagesWithKw = pages.filter(p => p.keywords?.length);
  if (pagesWithKw.length >= 2) {
    tasks.push(runSub('cannibalization', subMeta, () =>
      detectCannibalization({ pages: pagesWithKw, context }, env)
    ));
  } else {
    subMeta['cannibalization'] = { ran: false };
  }

  // Run content-gaps if competitor data provided
  if (siteKeywords.length && competitorKeywords.length) {
    tasks.push(runSub('content-gaps', subMeta, () =>
      analyseContentGaps({ siteKeywords, competitorKeywords, context }, env)
    ));
  } else {
    subMeta['content-gaps'] = { ran: false };
  }

  // Run anomaly diagnosis if anomaly data provided
  if (anomalies.length) {
    tasks.push(runSub('anomaly-diagnosis', subMeta, () =>
      diagnoseAnomalies({ anomalies, currentData }, env)
    ));
  } else {
    subMeta['anomaly-diagnosis'] = { ran: false };
  }

  const results = await Promise.all(tasks);
  const subResults = {};
  for (const r of results) {
    if (r) subResults[r.name] = r.data;
  }

  // ── Phase 2: Normalise dimension scores ───────────────────────────
  const dimensions = {
    pageQuality: scorePageQuality(subResults['page-scorer']),
    cannibalization: scoreCannibalization(subResults['cannibalization']),
    contentCoverage: scoreContentCoverage(subResults['content-gaps'], siteKeywords, competitorKeywords),
    anomalyRisk: scoreAnomalyRisk(subResults['anomaly-diagnosis'], anomalies)
  };

  // ── Phase 3: Cross-capability insight chains ──────────────────────
  const insights = generateInsights(subResults, pages, dimensions);

  // ── Phase 4: Composite health score + priorities ──────────────────
  const activeScores = Object.values(dimensions).filter(d => d.score !== null);
  const weights = { pageQuality: 0.35, cannibalization: 0.20, contentCoverage: 0.25, anomalyRisk: 0.20 };

  let healthScore;
  if (activeScores.length === 0) {
    healthScore = 0;
  } else {
    let totalWeight = 0;
    let weighted = 0;
    for (const [key, dim] of Object.entries(dimensions)) {
      if (dim.score !== null) {
        weighted += dim.score * weights[key];
        totalWeight += weights[key];
      }
    }
    healthScore = round(weighted / totalWeight, 0);
  }

  const grade = scoreToGrade(healthScore);
  const topPriorities = deriveTopPriorities(insights, dimensions);
  const capabilitiesRun = Object.entries(subMeta).filter(([, m]) => m.ran !== false).map(([k]) => k);

  // Normalise null scores to 0 for output
  for (const dim of Object.values(dimensions)) {
    if (dim.score === null) dim.score = 0;
  }

  const durationMs = Date.now() - start;

  logger.info('Site Health Pulse complete', {
    healthScore,
    grade,
    capabilitiesRun: capabilitiesRun.length,
    insightCount: insights.length,
    durationMs
  });

  return {
    healthScore,
    grade,
    dimensions,
    insights,
    topPriorities,
    summary: buildSummary(healthScore, grade, dimensions, insights, capabilitiesRun),
    capabilitiesRun,
    metadata: {
      durationMs,
      subCapabilities: subMeta
    }
  };
}

// ── Sub-capability runner ───────────────────────────────────────────

async function runSub(name, metaMap, fn) {
  const start = Date.now();
  try {
    const data = await fn();
    metaMap[name] = { ran: true, durationMs: Date.now() - start };
    return { name, data };
  } catch (err) {
    logger.warn(`Sub-capability ${name} failed`, { error: err.message });
    metaMap[name] = { ran: true, durationMs: Date.now() - start, error: err.message };
    return { name, data: null };
  }
}

// ── Dimension scorers ───────────────────────────────────────────────

function scorePageQuality(result) {
  if (!result || result.error || !result.scores?.length) {
    return { score: null, grade: 'F', issueCount: 0, topIssue: null };
  }
  const avgScore = round(avg(result.scores.map(s => s.overallScore)), 0);
  const allIssues = result.scores.flatMap(s => {
    const dims = s.dimensions || {};
    return [
      ...(dims.technical?.issues || []),
      ...(dims.content?.issues || []),
      ...(dims.onPage?.issues || []),
      ...(dims.ux?.issues || [])
    ];
  });
  return {
    score: avgScore,
    grade: scoreToGrade(avgScore),
    issueCount: allIssues.length,
    topIssue: allIssues[0] || null
  };
}

function scoreCannibalization(result) {
  if (!result) {
    return { score: null, grade: 'A', issueCount: 0, topIssue: null };
  }
  if (result.error || !result.conflicts) {
    return { score: null, grade: 'F', issueCount: 0, topIssue: null };
  }
  const conflicts = result.conflicts || [];
  // No conflicts = perfect score
  if (conflicts.length === 0) {
    return { score: 100, grade: 'A+', issueCount: 0, topIssue: null };
  }
  // Deduct based on severity
  const severityPenalty = { critical: 25, high: 15, medium: 8, low: 3 };
  let penalty = 0;
  for (const c of conflicts) {
    penalty += severityPenalty[c.severity] || 5;
  }
  const score = Math.max(0, 100 - penalty);
  return {
    score,
    grade: scoreToGrade(score),
    issueCount: conflicts.length,
    topIssue: conflicts[0]?.keyword
      ? `"${conflicts[0].keyword}" cannibalised across ${conflicts[0].pages?.length || 2} pages`
      : `${conflicts.length} cannibalization conflicts detected`
  };
}

function scoreContentCoverage(result, siteKw, competitorKw) {
  if (!result || !competitorKw?.length) {
    return { score: null, grade: 'A', issueCount: 0, topIssue: null };
  }
  if (result.error) {
    return { score: null, grade: 'F', issueCount: 0, topIssue: null };
  }
  const gaps = result.gaps || [];
  if (gaps.length === 0) {
    return { score: 100, grade: 'A+', issueCount: 0, topIssue: null };
  }
  // Coverage = % of competitor keywords the site already covers
  const coverage = competitorKw.length > 0
    ? ((competitorKw.length - gaps.length) / competitorKw.length) * 100
    : 100;
  const score = round(Math.max(0, Math.min(100, coverage)), 0);
  const topGap = gaps[0];
  return {
    score,
    grade: scoreToGrade(score),
    issueCount: gaps.length,
    topIssue: topGap?.keyword
      ? `Missing content for "${topGap.keyword}"`
      : `${gaps.length} content gaps vs competitors`
  };
}

function scoreAnomalyRisk(result, anomalies) {
  if (!anomalies?.length) {
    return { score: null, grade: 'A', issueCount: 0, topIssue: null };
  }
  if (!result || result.error) {
    // Base on raw anomaly count if diagnosis failed
    const penalty = anomalies.length * 15;
    const score = Math.max(0, 100 - penalty);
    return { score, grade: scoreToGrade(score), issueCount: anomalies.length, topIssue: 'Anomalies detected but diagnosis unavailable' };
  }
  const diagnoses = result.diagnoses || [];
  const severityPenalty = { critical: 30, high: 20, medium: 10, low: 5 };
  let penalty = 0;
  for (const d of diagnoses) {
    penalty += severityPenalty[d.severity] || 10;
  }
  const score = Math.max(0, 100 - penalty);
  return {
    score,
    grade: scoreToGrade(score),
    issueCount: diagnoses.length,
    topIssue: diagnoses[0]?.cause || diagnoses[0]?.summary || 'Active anomalies detected'
  };
}

// ── Cross-capability insight chains ─────────────────────────────────

function generateInsights(subResults, pages, dimensions) {
  const insights = [];
  let id = 0;

  const pageResult = subResults['page-scorer'];
  const cannResult = subResults['cannibalization'];
  const gapResult = subResults['content-gaps'];
  const anomResult = subResults['anomaly-diagnosis'];

  // Chain 1: Low-scoring pages that are ALSO cannibalising
  if (pageResult?.scores && cannResult?.conflicts) {
    const lowPages = pageResult.scores.filter(s => s.overallScore < 60);
    const cannUrls = new Set(
      cannResult.conflicts.flatMap(c => c.pages?.map(p => p.url || p) || [])
    );
    const overlap = lowPages.filter(p => cannUrls.has(p.url));
    if (overlap.length > 0) {
      insights.push({
        id: `insight-${++id}`,
        type: 'cross-capability',
        severity: 'critical',
        title: 'Low-quality pages are cannibalising each other',
        description: `${overlap.length} page(s) score below 60 AND appear in cannibalization conflicts. These pages are competing with each other while also having quality issues — a double penalty from Google's perspective.`,
        capabilities: ['page-scorer', 'cannibalization-detect'],
        affectedUrls: overlap.map(p => p.url),
        suggestedAction: 'Consolidate the weakest cannibalising pages via 301 redirects, then improve the surviving page\'s content quality.'
      });
    }
  }

  // Chain 2: Content gaps + anomaly correlation (traffic drop → missing content)
  if (gapResult?.gaps?.length && anomResult?.diagnoses?.length) {
    const trafficDrops = anomResult.diagnoses.filter(d =>
      d.cause?.toLowerCase().includes('traffic') ||
      d.cause?.toLowerCase().includes('impressions') ||
      d.summary?.toLowerCase().includes('decline')
    );
    if (trafficDrops.length > 0 && gapResult.gaps.length >= 3) {
      insights.push({
        id: `insight-${++id}`,
        type: 'cross-capability',
        severity: 'high',
        title: 'Traffic decline coincides with content gaps',
        description: `Anomaly diagnosis found ${trafficDrops.length} traffic-related issue(s) while content gap analysis reveals ${gapResult.gaps.length} missing topics. Competitors may be capturing queries you haven't targeted yet.`,
        capabilities: ['anomaly-diagnosis', 'content-gaps'],
        suggestedAction: 'Prioritise creating content for the top 3 content gaps to recapture lost impression share.'
      });
    }
  }

  // Chain 3: Cannibalization + content gaps (cannibalising on existing terms while missing others)
  if (cannResult?.conflicts?.length && gapResult?.gaps?.length) {
    insights.push({
      id: `insight-${++id}`,
      type: 'cross-capability',
      severity: 'medium',
      title: 'Wasted effort: cannibalising existing keywords while missing new ones',
      description: `${cannResult.conflicts.length} cannibalization conflict(s) show the site is splitting authority on terms it already targets, while ${gapResult.gaps.length} competitor keywords remain unaddressed.`,
      capabilities: ['cannibalization-detect', 'content-gaps'],
      suggestedAction: 'Merge cannibalised pages to consolidate authority, then redirect the freed-up publishing bandwidth toward content gap topics.'
    });
  }

  // Chain 4: Page quality below threshold
  if (pageResult?.scores) {
    const failing = pageResult.scores.filter(s => s.overallScore < 40);
    if (failing.length > 0) {
      insights.push({
        id: `insight-${++id}`,
        type: 'single-capability',
        severity: failing.length >= 3 ? 'critical' : 'high',
        title: `${failing.length} page(s) critically underperforming`,
        description: `${failing.length} of ${pageResult.scores.length} pages score below 40/100. These are likely being suppressed by Google's quality systems.`,
        capabilities: ['page-scorer'],
        affectedUrls: failing.map(p => p.url),
        suggestedAction: 'Prioritise a content and technical overhaul on the worst-scoring pages — focus on the lowest-scoring dimension first.'
      });
    }
  }

  // Chain 5: Anomaly with no explanation (unknown causes)
  if (anomResult?.diagnoses) {
    const unknown = anomResult.diagnoses.filter(d =>
      d.confidence === 'low' || d.cause === 'unknown'
    );
    if (unknown.length > 0) {
      insights.push({
        id: `insight-${++id}`,
        type: 'warning',
        severity: 'medium',
        title: 'Undiagnosed anomalies need investigation',
        description: `${unknown.length} anomaly diagnosis(es) returned low confidence or unknown cause. Manual investigation recommended.`,
        capabilities: ['anomaly-diagnosis'],
        suggestedAction: 'Check Google Search Console for manual actions, review recent site changes, and verify server logs for crawl errors.'
      });
    }
  }

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  insights.sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9));

  return insights;
}

// ── Priority derivation ─────────────────────────────────────────────

function deriveTopPriorities(insights, dimensions) {
  const priorities = [];
  let rank = 0;

  // Convert cross-capability insights into priorities first
  for (const insight of insights.slice(0, 3)) {
    priorities.push({
      rank: ++rank,
      title: insight.title,
      category: insight.capabilities.join(' + '),
      impact: insight.severity,
      effort: insight.severity === 'critical' ? 'moderate' : 'quick-win'
    });
  }

  // Fill remaining slots from worst dimensions
  const dimEntries = Object.entries(dimensions)
    .filter(([, d]) => d.score !== null && d.score < 70)
    .sort((a, b) => a[1].score - b[1].score);

  for (const [key, dim] of dimEntries) {
    if (rank >= 5) break;
    if (priorities.some(p => p.title.toLowerCase().includes(key))) continue;
    if (dim.topIssue) {
      priorities.push({
        rank: ++rank,
        title: `Improve ${key}: ${dim.topIssue}`,
        category: key,
        impact: dim.score < 40 ? 'critical' : dim.score < 60 ? 'high' : 'medium',
        effort: 'moderate'
      });
    }
  }

  return priorities.slice(0, 5);
}

// ── Summary builder ─────────────────────────────────────────────────

function buildSummary(healthScore, grade, dimensions, insights, capabilitiesRun) {
  const parts = [`Site health score: ${healthScore}/100 (${grade}).`];

  const active = Object.entries(dimensions).filter(([, d]) => d.score !== null && d.score > 0);
  if (active.length) {
    const dimSummary = active
      .map(([key, d]) => `${formatDimName(key)}: ${d.score}/100`)
      .join(', ');
    parts.push(`Dimensions — ${dimSummary}.`);
  }

  const crossCap = insights.filter(i => i.type === 'cross-capability');
  if (crossCap.length) {
    parts.push(`${crossCap.length} cross-capability insight(s) detected — these reveal compounded issues that single tools miss.`);
  }

  parts.push(`Analysis ran ${capabilitiesRun.length} sub-capabilities in parallel.`);

  return parts.join(' ');
}

// ── Helpers ─────────────────────────────────────────────────────────

function scoreToGrade(score) {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 50) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

function formatDimName(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).trim();
}
