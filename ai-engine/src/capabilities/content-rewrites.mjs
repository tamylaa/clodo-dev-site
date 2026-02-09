/**
 * Capability 5: Content Rewrite Suggestions
 * 
 * Generates optimized title, meta description, and H1 rewrites
 * based on target keywords, search intent, and SERP patterns.
 */

import { createLogger } from '@tamyla/clodo-framework';
import { runTextGeneration } from '../providers/ai-provider.mjs';

const logger = createLogger('ai-rewrites');

export async function generateRewrites(body, env) {
  const { pages = [] } = body;

  if (!pages.length) {
    return { rewrites: [], message: 'No pages provided' };
  }

  const batch = pages.slice(0, 10);

  const result = await runTextGeneration({
    systemPrompt: buildRewriteSystemPrompt(),
    userPrompt: buildRewriteUserPrompt(batch),
    complexity: 'standard',
    capability: 'content-rewrite',
    maxTokens: 4096
  }, env);

  const rewrites = parseRewriteResponse(result.text, batch);

  logger.info(`Generated rewrites for ${rewrites.length} pages via ${result.provider}`);

  return {
    rewrites,
    metadata: {
      provider: result.provider,
      model: result.model,
      pagesProcessed: batch.length,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
      durationMs: result.durationMs
    }
  };
}

function buildRewriteSystemPrompt() {
  return `You are an expert SEO copywriter who creates click-worthy, search-optimized content elements.

For each page, generate optimized rewrites for:
1. title: SEO title tag (50-60 chars, include primary keyword, add power words / numbers / year)
2. description: Meta description (140-155 chars, include call-to-action, mention benefit)
3. h1: Page heading (can differ from title, more engaging, matches user intent)

RULES:
- Match the keyword's search INTENT (transactional → urgency/CTA, informational → comprehensiveness, commercial → comparison/best-of)
- Include the PRIMARY target keyword naturally — don't stuff
- Add freshness signals ([2026], Updated, Latest) where appropriate
- Use power words: proven, essential, complete, ultimate, step-by-step
- Meta descriptions MUST include a CTA: "Learn how...", "Discover...", "Find out..."
- Preserve the page's core topic — don't change what the page is about
- For EACH rewrite, explain WHY it's better (1 sentence)

RESPOND ONLY with this JSON:
{"rewrites":[{"url":"...","title":{"current":"...","suggested":"...","reasoning":"..."},"description":{"current":"...","suggested":"...","reasoning":"..."},"h1":{"current":"...","suggested":"...","reasoning":"..."},"estimatedCTRLift":"..."}]}`;
}

function buildRewriteUserPrompt(pages) {
  const pageBlocks = pages.map((p, i) => {
    const keywords = Array.isArray(p.targetKeywords)
      ? p.targetKeywords.map(k => typeof k === 'string' ? k : k.query || k.keyword).join(', ')
      : p.targetKeywords || 'N/A';

    return `PAGE ${i + 1}:
  URL: ${p.url || 'N/A'}
  Current title: ${p.title || '(none)'}
  Current description: ${p.description || '(none)'}
  Current H1: ${p.h1 || '(none)'}
  Target keywords: ${keywords}
  Current position: ${p.position || 'N/A'}
  Current CTR: ${p.ctr ? (p.ctr * 100).toFixed(1) + '%' : 'N/A'}
  Intent: ${p.intent || 'unknown'}`;
  }).join('\n\n');

  return `Generate optimized rewrites for these pages:\n\n${pageBlocks}`;
}

function parseRewriteResponse(text, originalPages) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallbackRewrites(originalPages);

    const parsed = JSON.parse(jsonMatch[0]);
    const rewrites = parsed.rewrites || parsed;
    if (!Array.isArray(rewrites)) return fallbackRewrites(originalPages);

    return rewrites.map((r, i) => ({
      url: r.url || originalPages[i]?.url || `page-${i}`,
      title: {
        current: r.title?.current || originalPages[i]?.title || '',
        suggested: r.title?.suggested || '',
        reasoning: r.title?.reasoning || ''
      },
      description: {
        current: r.description?.current || originalPages[i]?.description || '',
        suggested: r.description?.suggested || '',
        reasoning: r.description?.reasoning || ''
      },
      h1: {
        current: r.h1?.current || originalPages[i]?.h1 || '',
        suggested: r.h1?.suggested || '',
        reasoning: r.h1?.reasoning || ''
      },
      estimatedCTRLift: r.estimatedCTRLift || 'Unknown',
      source: 'ai-engine'
    }));
  } catch (err) {
    logger.warn('Failed to parse rewrite response:', err.message);
    return fallbackRewrites(originalPages);
  }
}

function fallbackRewrites(pages) {
  return pages.map(p => ({
    url: p.url || 'unknown',
    title: { current: p.title || '', suggested: '', reasoning: 'LLM response could not be parsed' },
    description: { current: p.description || '', suggested: '', reasoning: 'LLM response could not be parsed' },
    h1: { current: p.h1 || '', suggested: '', reasoning: 'LLM response could not be parsed' },
    estimatedCTRLift: 'Unknown',
    source: 'ai-engine-fallback'
  }));
}
