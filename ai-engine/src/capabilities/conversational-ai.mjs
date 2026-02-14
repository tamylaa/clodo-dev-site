/**
 * Capability 4: Conversational Analytics AI (v2)
 *
 * Natural language Q&A about SEO data. Multi-turn conversation support.
 * Grounds all answers in actual analytics data to prevent hallucination.
 *
 * Enhanced with:
 *   - Citation verification (cross-check numbers against source data)
 *   - Hallucination guard (flag unverifiable numeric claims)
 *   - KV conversation memory (persist history across requests)
 */

import { createLogger } from '../lib/framework-shims.mjs';
import { runTextGeneration } from '../providers/ai-provider.mjs';
import { ConversationalInputSchema, ConversationalOutputSchema, CONVERSATIONAL_JSON_SCHEMA } from '../lib/schemas/index.mjs';
import { parseAndValidate } from '../lib/response-parser.mjs';
import { validateInput } from '../lib/validate-input.mjs';

const logger = createLogger('ai-chat');

const MEMORY_TTL = 3600; // 1 hour TTL for conversation memory
const MAX_MEMORY_TURNS = 20; // Maximum history length in KV

export async function chatWithData(body, env) {
  const v = validateInput(ConversationalInputSchema, body);
  if (!v.valid) return v.error;

  const { message, analyticsContext = {}, history = [], conversationId } = v.data;

  if (!message || typeof message !== 'string') {
    return { error: 'No message provided' };
  }

  // ── Phase 0: Load conversation memory from KV if conversationId provided ──
  let fullHistory = [...history];
  if (conversationId && env.KV_AI) {
    try {
      const stored = await loadConversationMemory(conversationId, env);
      if (stored && stored.length > 0 && history.length === 0) {
        fullHistory = stored; // Use KV history if none provided in request
      }
    } catch (e) {
      logger.warn('Failed to load conversation memory', { error: e.message });
    }
  }

  const complexity = fullHistory.length > 3 || message.length > 200 ? 'complex' : 'standard';

  // ── Phase 1: Extract reference numbers from analytics context ──
  const referenceData = extractReferenceNumbers(analyticsContext);

  const result = await runTextGeneration({
    systemPrompt: buildChatSystemPrompt(analyticsContext),
    userPrompt: buildChatUserPrompt(message, fullHistory),
    complexity,
    capability: 'chat',
    maxTokens: 2048,
    jsonMode: true,
    jsonSchema: CONVERSATIONAL_JSON_SCHEMA
  }, env);

  // Try structured parse for follow-up suggestions; fall back to raw text
  const { data: parsed, meta } = parseAndValidate(
    result.text,
    ConversationalOutputSchema,
    { fallback: () => ({ response: result.text }), expect: 'object' }
  );

  const responseText = parsed?.response || result.text;

  // ── Phase 2: Citation verification ────────────────────────────────
  const citations = parsed?.dataCitations || [];
  const verifiedCitations = verifyCitations(citations, referenceData);

  // ── Phase 3: Hallucination guard — flag unverifiable numeric claims ──
  const hallucinationCheck = checkForHallucinations(responseText, referenceData);

  // ── Phase 4: Save to KV memory ────────────────────────────────────
  if (conversationId && env.KV_AI) {
    try {
      const updatedHistory = [
        ...fullHistory,
        { role: 'user', content: message },
        { role: 'assistant', content: responseText }
      ].slice(-MAX_MEMORY_TURNS);
      await saveConversationMemory(conversationId, updatedHistory, env);
    } catch (e) {
      logger.warn('Failed to save conversation memory', { error: e.message });
    }
  }

  logger.info(`Chat response via ${result.provider} (${result.durationMs}ms)`, {
    parseMethod: meta.parseMethod,
    hasFollowUps: !!(parsed?.suggestedFollowUps?.length),
    citationsVerified: verifiedCitations.verified,
    hallucinationFlags: hallucinationCheck.flags.length
  });

  return {
    response: responseText,
    suggestedFollowUps: parsed?.suggestedFollowUps || [],
    dataCitations: verifiedCitations.citations,
    trustScore: hallucinationCheck.trustScore,
    warnings: hallucinationCheck.flags.length > 0 ? hallucinationCheck.flags : undefined,
    metadata: {
      provider: result.provider,
      model: result.model,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
      durationMs: result.durationMs,
      conversationLength: fullHistory.length + 1,
      conversationId: conversationId || undefined,
      parseQuality: {
        method: meta.parseMethod,
        schemaValid: meta.schemaValid
      }
    }
  };
}

// ── Citation Verification ────────────────────────────────────────────

/**
 * Extract all numeric reference values from analytics context for verification.
 */
function extractReferenceNumbers(context) {
  const refs = {};
  const summary = context.summary || {};

  if (summary.totalImpressions != null) refs['totalImpressions'] = summary.totalImpressions;
  if (summary.totalClicks != null) refs['totalClicks'] = summary.totalClicks;
  if (summary.avgCTR != null) refs['avgCTR'] = summary.avgCTR;
  if (summary.avgPosition != null) refs['avgPosition'] = summary.avgPosition;

  const topQueries = context.topQueries || context.gsc?.queries || [];
  for (const q of topQueries) {
    if (q.query) {
      if (q.impressions != null) refs[`${q.query}:impressions`] = q.impressions;
      if (q.clicks != null) refs[`${q.query}:clicks`] = q.clicks;
      if (q.position != null) refs[`${q.query}:position`] = q.position;
      if (q.ctr != null) refs[`${q.query}:ctr`] = q.ctr;
    }
  }

  const topPages = context.topPages || context.gsc?.pages || [];
  for (const p of topPages) {
    const key = p.page || p.url;
    if (key) {
      if (p.impressions != null) refs[`${key}:impressions`] = p.impressions;
      if (p.clicks != null) refs[`${key}:clicks`] = p.clicks;
      if (p.position != null) refs[`${key}:position`] = p.position;
    }
  }

  return refs;
}

/**
 * Verify LLM-cited metrics against actual source data.
 */
function verifyCitations(citations, referenceData) {
  let verified = 0;
  let unverified = 0;

  const enriched = citations.map(c => {
    const refKey = findMatchingRef(c.metric, referenceData);
    if (refKey !== null) {
      const refVal = referenceData[refKey];
      const citedNum = parseFloat(String(c.value).replace(/[,%]/g, ''));
      const match = !isNaN(citedNum) && !isNaN(refVal) && isClose(citedNum, refVal, c.metric);
      if (match) verified++;
      else unverified++;
      return { ...c, verified: match, referenceValue: refVal };
    }
    unverified++;
    return { ...c, verified: false };
  });

  return { citations: enriched, verified, unverified, total: citations.length };
}

function findMatchingRef(metric, refs) {
  if (!metric) return null;
  const m = metric.toLowerCase();
  for (const key of Object.keys(refs)) {
    if (key.toLowerCase().includes(m) || m.includes(key.toLowerCase())) return key;
  }
  // Common aliases
  if (m.includes('impression')) { const k = Object.keys(refs).find(k => k.includes('Impressions')); if (k) return k; }
  if (m.includes('click')) { const k = Object.keys(refs).find(k => k.includes('Clicks')); if (k) return k; }
  if (m.includes('ctr')) { const k = Object.keys(refs).find(k => k.includes('CTR')); if (k) return k; }
  if (m.includes('position')) { const k = Object.keys(refs).find(k => k.includes('Position')); if (k) return k; }
  return null;
}

function isClose(cited, ref, metric) {
  // CTR values may be cited as percentages
  if (metric && metric.toLowerCase().includes('ctr') && ref < 1 && cited > 1) {
    return Math.abs(cited - ref * 100) < 0.5;
  }
  // Allow 1% tolerance for rounding
  if (ref === 0) return cited === 0;
  return Math.abs(cited - ref) / Math.abs(ref) < 0.01;
}

// ── Hallucination Guard ──────────────────────────────────────────────

/**
 * Scan response text for numeric claims and flag any that can't be verified.
 */
function checkForHallucinations(text, referenceData) {
  const flags = [];
  const refValues = Object.values(referenceData).map(v => Number(v)).filter(v => !isNaN(v));
  const refSet = new Set(refValues.map(v => String(v)));

  // Also add percentage versions of CTR-like values
  for (const v of refValues) {
    if (v < 1) refSet.add(String((v * 100).toFixed(1)));
    if (v < 1) refSet.add(String((v * 100).toFixed(2)));
  }
  // Add rounded versions
  for (const v of refValues) {
    refSet.add(String(Math.round(v)));
    refSet.add(String(v.toFixed(1)));
  }

  // Extract numbers from response
  const numberPattern = /\b(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\b/g;
  const matches = [...text.matchAll(numberPattern)];

  let verifiable = 0;
  let unverifiable = 0;

  for (const match of matches) {
    const num = match[1].replace(/,/g, '');
    // Skip trivially small numbers (1, 2, 3, etc.) and years
    if (parseFloat(num) < 10 || (parseFloat(num) >= 2020 && parseFloat(num) <= 2030)) continue;

    if (refSet.has(num)) {
      verifiable++;
    } else {
      unverifiable++;
      if (flags.length < 3) { // Cap at 3 warnings
        flags.push(`Unverified number "${match[1]}" in response — not found in provided analytics data`);
      }
    }
  }

  const total = verifiable + unverifiable;
  const trustScore = total === 0 ? 1.0 : verifiable / total;

  return { trustScore: Math.round(trustScore * 100) / 100, flags };
}

// ── KV Conversation Memory ───────────────────────────────────────────

async function loadConversationMemory(conversationId, env) {
  const key = `chat:${conversationId}`;
  const data = await env.KV_AI.get(key, { type: 'json' });
  return data?.history || null;
}

async function saveConversationMemory(conversationId, history, env) {
  const key = `chat:${conversationId}`;
  await env.KV_AI.put(key, JSON.stringify({ history, updatedAt: new Date().toISOString() }), {
    expirationTtl: MEMORY_TTL
  });
}

export { extractReferenceNumbers, verifyCitations, checkForHallucinations };

function buildChatSystemPrompt(context) {
  const summary = context.summary || {};
  const period = context.period || {};

  let dataBlock = 'CURRENT ANALYTICS DATA:\n';

  if (summary.totalImpressions != null) {
    dataBlock += `  Total impressions: ${summary.totalImpressions?.toLocaleString() || 'N/A'}\n`;
    dataBlock += `  Total clicks: ${summary.totalClicks?.toLocaleString() || 'N/A'}\n`;
    dataBlock += `  Average CTR: ${(summary.avgCTR * 100)?.toFixed(2) || 'N/A'}%\n`;
    dataBlock += `  Average position: ${summary.avgPosition?.toFixed(1) || 'N/A'}\n`;
    dataBlock += `  Period: ${period.start || '?'} to ${period.end || '?'}\n`;
  }

  const topQueries = context.topQueries || context.gsc?.queries?.slice(0, 10) || [];
  if (topQueries.length > 0) {
    dataBlock += '\nTOP QUERIES:\n';
    topQueries.forEach(q => {
      dataBlock += `  "${q.query}" — pos: ${q.position?.toFixed(1)}, CTR: ${(q.ctr * 100)?.toFixed(1)}%, imp: ${q.impressions}, clicks: ${q.clicks}\n`;
    });
  }

  const topPages = context.topPages || context.gsc?.pages?.slice(0, 10) || [];
  if (topPages.length > 0) {
    dataBlock += '\nTOP PAGES:\n';
    topPages.forEach(p => {
      dataBlock += `  ${p.page} — pos: ${p.position?.toFixed(1)}, CTR: ${(p.ctr * 100)?.toFixed(1)}%, imp: ${p.impressions}\n`;
    });
  }

  if (context.anomalies?.length > 0) {
    dataBlock += `\nRECENT ANOMALIES: ${context.anomalies.length} detected\n`;
    context.anomalies.slice(0, 3).forEach(a => {
      dataBlock += `  [${a.severity}] ${a.type}: ${a.description || a.message}\n`;
    });
  }

  if (context.recommendations?.length > 0) {
    dataBlock += `\nACTIVE RECOMMENDATIONS: ${context.recommendations.length}\n`;
    context.recommendations.slice(0, 5).forEach(r => {
      dataBlock += `  [${r.priority}] ${r.title}\n`;
    });
  }

  return `You are an SEO analytics assistant. Answer the user's questions using ONLY the data provided below. If the data doesn't contain enough information to answer, say so honestly.

Be specific: cite exact numbers, pages, and keywords from the data. Don't make up metrics.
Be actionable: when possible, suggest what to do about findings.
Be concise: 2-4 paragraphs max unless the user asks for detail.

RESPOND with a JSON object: {"response": "your answer text", "suggestedFollowUps": ["follow-up question 1", "..."], "dataCitations": [{"metric": "name", "value": "number"}]}

${dataBlock}`;
}

function buildChatUserPrompt(message, history) {
  if (history.length === 0) return message;

  const recentHistory = history.slice(-5);
  const historyBlock = recentHistory
    .map(turn => `${turn.role === 'user' ? 'User' : 'Assistant'}: ${turn.content}`)
    .join('\n\n');

  return `Previous conversation:\n${historyBlock}\n\nUser: ${message}`;
}
