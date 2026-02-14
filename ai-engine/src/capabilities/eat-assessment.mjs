/**
 * Capability: E-A-T Assessment (Expertise, Authoritativeness, Trustworthiness)
 *
 * Analyzes content quality based on Google's E-A-T guidelines.
 * Uses compromise for NLP analysis and AI for scoring and recommendations.
 */

import { createLogger } from '../lib/framework-shims.mjs';
import { runTextGeneration } from '../providers/ai-provider.mjs';
import { EATAssessmentInputSchema, EATAssessmentOutputSchema, EAT_JSON_SCHEMA } from '../lib/schemas/index.mjs';
import { parseAndValidate } from '../lib/response-parser.mjs';
import { validateInput } from '../lib/validate-input.mjs';
import nlp from 'compromise';

const logger = createLogger('ai-eat');

export async function assessEAT(body, env) {
  const v = validateInput(EATAssessmentInputSchema, body);
  if (!v.valid) return v.error;

  const { content, url, author, publishDate, topic } = v.data;

  // Phase 1: Deterministic NLP analysis with compromise
  const nlpAnalysis = analyzeContentNLP(content);

  // Phase 2: AI-powered assessment
  const result = await runTextGeneration({
    systemPrompt: buildEATSystemPrompt(),
    userPrompt: buildEATUserPrompt(content, nlpAnalysis, { url, author, publishDate, topic }),
    complexity: 'standard',
    capability: 'eat-assess',
    maxTokens: 2000,
    jsonMode: true,
    jsonSchema: EAT_JSON_SCHEMA
  }, env);

  const { data: parsed, meta } = parseAndValidate(
    result.text,
    EATAssessmentOutputSchema,
    {
      fallback: () => ({ scores: { expertise: 0.5, authoritativeness: 0.5, trustworthiness: 0.5, overall: 0.5 }, analysis: { expertise: 'Analysis unavailable', authoritativeness: 'Analysis unavailable', trustworthiness: 'Analysis unavailable' }, recommendations: ['Manual review recommended'] }),
      expect: 'object'
    }
  );

  const assessment = parsed || { scores: { expertise: 0.5, authoritativeness: 0.5, trustworthiness: 0.5, overall: 0.5 }, analysis: { expertise: 'Analysis unavailable', authoritativeness: 'Analysis unavailable', trustworthiness: 'Analysis unavailable' }, recommendations: ['Manual review recommended'] };

  // Add explainability
  const explainability = generateExplainability(assessment, nlpAnalysis);

  logger.info(`E-A-T assessment completed via ${result.provider}`, {
    parseMethod: meta.parseMethod,
    schemaValid: meta.schemaValid,
    expertiseScore: assessment.scores.expertise
  });

  return {
    ...assessment,
    ...explainability,
    metadata: {
      provider: result.provider,
      model: result.model,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
      durationMs: result.durationMs,
      parseQuality: {
        method: meta.parseMethod,
        schemaValid: meta.schemaValid,
        fallbackUsed: meta.fallbackUsed
      },
      nlpAnalysis: nlpAnalysis.summary
    }
  };
}

function analyzeContentNLP(content) {
  let sentences = 0, words = 0, entities = 0, topics = 0, questions = 0, adjectives = 0, verbs = 0;
  let hasCitations = false, hasCredentials = false, hasData = false;

  try {
    const doc = nlp(content);
    sentences = doc.sentences().length;
    words = doc.terms().length;
    entities = doc.entities().length;
    topics = doc.topics().length;
    questions = doc.questions().length;
    adjectives = doc.adjectives().length;
    verbs = doc.verbs().length;
  } catch (e) {
    // Fallback to basic analysis
    sentences = content.split(/[.!?]+/).length;
    words = content.split(/\s+/).length;
  }

  hasCitations = /\b(cited|according to|source|reference|study|research)\b/i.test(content);
  hasCredentials = /\b(phd|dr\.|professor|expert|specialist|certified)\b/i.test(content);
  hasData = /\b(\d+%|\d+ percent|statistics|data|chart|graph)\b/i.test(content);

  return {
    sentences,
    words,
    entities,
    topics,
    questions,
    adjectives,
    verbs,
    hasCitations,
    hasCredentials,
    hasData,
    summary: `Content has ${words} words, ${sentences} sentences, ${entities} entities, ${topics} topics. Citations: ${hasCitations}, Credentials: ${hasCredentials}, Data: ${hasData}`
  };
}

function generateExplainability(assessment, nlpAnalysis) {
  const { scores } = assessment;

  let explanation = 'This content demonstrates ';
  if (scores.overall > 0.8) {
    explanation += 'excellent E-A-T alignment with strong expertise and trustworthiness signals.';
  } else if (scores.overall > 0.6) {
    explanation += 'good E-A-T alignment but has room for improvement in certain areas.';
  } else {
    explanation += 'moderate E-A-T alignment and may benefit from enhancements to build authority.';
  }

  const confidenceBreakdown = {
    primarySignal: nlpAnalysis.hasCredentials ? 'Author credentials and citations detected' : 'Content structure and topic depth',
    alternativeFactors: ['Author reputation', 'Site authority', 'User engagement metrics'],
    contentQuality: nlpAnalysis.words > 500 ? 'Substantial content depth' : 'Content may need expansion'
  };

  const nextSteps = [
    'Add author bio with credentials if missing',
    'Include citations and references for claims',
    'Ensure content is regularly updated',
    'Monitor user engagement and feedback'
  ];

  return { explanation, confidenceBreakdown, nextSteps };
}

function buildEATSystemPrompt() {
  return `You are an expert E-A-T evaluator following Google's quality guidelines.

Analyze content for Expertise, Authoritativeness, and Trustworthiness:

EXPERTISE: Does the content demonstrate deep knowledge? Score 0.0-1.0
AUTHORITATIVENESS: Is the creator/site recognized as an authority? Score 0.0-1.0  
TRUSTWORTHINESS: Is the content accurate, unbiased, and transparent? Score 0.0-1.0

Provide:
1. scores: Object with expertise, authoritativeness, trustworthiness, overall
2. analysis: Detailed explanation for each E-A-T dimension
3. recommendations: 3-5 specific improvements

RESPOND ONLY with this JSON:
{"scores":{"expertise":0.0,"authoritativeness":0.0,"trustworthiness":0.0,"overall":0.0},"analysis":{"expertise":"...","authoritativeness":"...","trustworthiness":"..."},"recommendations":["..."]}`;
}

function buildEATUserPrompt(content, nlpAnalysis, metadata) {
  const context = metadata.url ? `URL: ${metadata.url}\n` : '';
  const author = metadata.author ? `Author: ${metadata.author}\n` : '';
  const date = metadata.publishDate ? `Published: ${metadata.publishDate}\n` : '';
  const topic = metadata.topic ? `Topic: ${metadata.topic}\n` : '';

  return `${context}${author}${date}${topic}
NLP Analysis: ${nlpAnalysis.summary}

CONTENT TO ANALYZE:
${content.substring(0, 2000)}`;
}