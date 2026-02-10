/**
 * Capability 4: Conversational Analytics AI (v2)
 *
 * Natural language Q&A about SEO data. Multi-turn conversation support.
 * Grounds all answers in actual analytics data to prevent hallucination.
 *
 * Note: Conversational responses are intentionally NOT parsed as JSON —
 * the raw text response IS the product. We only pass jsonMode for
 * structured follow-up suggestions when the model supports it.
 */

import { createLogger } from '../lib/framework-shims.mjs';
import { runTextGeneration } from '../providers/ai-provider.mjs';
import { ConversationalOutputSchema, CONVERSATIONAL_JSON_SCHEMA } from '../lib/schemas/index.mjs';
import { parseAndValidate } from '../lib/response-parser.mjs';

const logger = createLogger('ai-chat');

export async function chatWithData(body, env) {
  const { message, analyticsContext = {}, history = [] } = body;

  if (!message || typeof message !== 'string') {
    return { error: 'No message provided' };
  }

  const complexity = history.length > 3 || message.length > 200 ? 'complex' : 'standard';

  const result = await runTextGeneration({
    systemPrompt: buildChatSystemPrompt(analyticsContext),
    userPrompt: buildChatUserPrompt(message, history),
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

  logger.info(`Chat response via ${result.provider} (${result.durationMs}ms)`, {
    parseMethod: meta.parseMethod,
    hasFollowUps: !!(parsed?.suggestedFollowUps?.length)
  });

  return {
    response: parsed?.response || result.text,
    suggestedFollowUps: parsed?.suggestedFollowUps || [],
    dataCitations: parsed?.dataCitations || [],
    metadata: {
      provider: result.provider,
      model: result.model,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
      durationMs: result.durationMs,
      conversationLength: history.length + 1,
      parseQuality: {
        method: meta.parseMethod,
        schemaValid: meta.schemaValid
      }
    }
  };
}

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
