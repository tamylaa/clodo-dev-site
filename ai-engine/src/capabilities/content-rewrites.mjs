/**
 * Capability 5: Content Rewrite Suggestions (v2)
 *
 * Generates optimized title, meta description, and H1 rewrites
 * based on target keywords, search intent, and SERP patterns.
 *
 * Enhanced with:
 *   - Zod schema validation
 *   - Structured output (jsonMode / jsonSchema)
 *   - Character-count guardrails in post-processing
 */

import { createLogger } from '../lib/framework-shims.mjs';
import { runTextGeneration } from '../providers/ai-provider.mjs';
import { ContentRewriteOutputSchema, CONTENT_REWRITE_JSON_SCHEMA } from '../lib/schemas/index.mjs';
import { parseAndValidate } from '../lib/response-parser.mjs';

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
    maxTokens: 4096,
    jsonMode: true,
    jsonSchema: CONTENT_REWRITE_JSON_SCHEMA
  }, env);

  const { data: parsed, meta } = parseAndValidate(
    result.text,
    ContentRewriteOutputSchema,
    {
      fallback: () => ({ rewrites: fallbackRewrites(batch) }),
      expect: 'object'
    }
  );

  const rewrites = (parsed?.rewrites || fallbackRewrites(batch)).map((r, i) => {
    // Post-process: add character counts and flag issues
    const sugTitle = r.title?.suggested || r.rewritten?.title || '';
    const sugDesc = r.description?.suggested || r.rewritten?.description || '';
    return {
      url: r.url || batch[i]?.url || `page-${i}`,
      title: typeof r.title === 'object' ? r.title : {
        current: batch[i]?.title || '',
        suggested: sugTitle,
        reasoning: r.reasoning || ''
      },
      description: typeof r.description === 'object' ? r.description : {
        current: batch[i]?.description || '',
        suggested: sugDesc,
        reasoning: r.reasoning || ''
      },
      h1: typeof r.h1 === 'object' ? r.h1 : {
        current: batch[i]?.h1 || '',
        suggested: r.rewritten?.h1 || '',
        reasoning: r.reasoning || ''
      },
      estimatedCTRLift: r.estimatedCTRLift || r.estimatedImpact || 'Unknown',
      titleLength: sugTitle.length,
      descriptionLength: sugDesc.length,
      warnings: [
        ...(sugTitle.length > 60 ? [`Title too long (${sugTitle.length} chars, max 60)`] : []),
        ...(sugDesc.length > 160 ? [`Description too long (${sugDesc.length} chars, max 160)`] : []),
        ...(sugTitle.length < 30 ? [`Title too short (${sugTitle.length} chars, min 30)`] : [])
      ],
      source: meta.fallbackUsed ? 'ai-engine-fallback' : 'ai-engine'
    };
  });

  logger.info(`Generated rewrites for ${rewrites.length} pages via ${result.provider}`, {
    parseMethod: meta.parseMethod,
    schemaValid: meta.schemaValid
  });

  return {
    rewrites,
    metadata: {
      provider: result.provider,
      model: result.model,
      pagesProcessed: batch.length,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
      durationMs: result.durationMs,
      parseQuality: {
        method: meta.parseMethod,
        schemaValid: meta.schemaValid,
        fallbackUsed: meta.fallbackUsed
      }
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

// parseRewriteResponse replaced by parseAndValidate from response-parser.mjs

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
