/**
 * Capability: AI Experimentation & Customization
 *
 * Enables user-driven experimentation with custom prompts, A/B testing,
 * and hypothesis testing. Empowers solo founders to optimize AI outputs
 * without coding.
 */

import { createLogger } from '../lib/framework-shims.mjs';
import { runTextGeneration } from '../providers/ai-provider.mjs';
import { ExperimentInputSchema, ExperimentOutputSchema, EXPERIMENT_JSON_SCHEMA } from '../lib/schemas/index.mjs';
import { parseAndValidate } from '../lib/response-parser.mjs';
import { validateInput } from '../lib/validate-input.mjs';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('ai-experiment');

export async function runExperiment(body, env) {
  const v = validateInput(ExperimentInputSchema, body);
  if (!v.valid) return v.error;

  const { type, capability, prompt, promptAlt, model, testData, hypothesis, iterations } = v.data;

  const experimentId = uuidv4();

  let results = [];
  let comparison = null;
  let hypothesisResult = null;

  if (type === 'custom-prompt') {
    // Single custom prompt test
    const result = await runCustomPrompt(prompt, testData, model, env);
    results.push(result);
  } else if (type === 'ab-test') {
    // A/B test between two prompts
    const resultA = await runCustomPrompt(prompt, testData, model, env);
    const resultB = await runCustomPrompt(promptAlt, testData, model, env);
    results = [resultA, resultB];
    comparison = await compareResults(resultA, resultB, testData);
  } else if (type === 'hypothesis-test') {
    // Hypothesis testing on existing capability
    hypothesisResult = await testHypothesis(capability, hypothesis, prompt, testData, iterations, env);
  }

  const experiment = {
    experimentId,
    type,
    results,
    comparison,
    hypothesisResult
  };

  // Add explainability
  const explainability = generateExplainability(experiment);

  logger.info(`Experiment completed: ${type} with ${results.length} runs`, {
    experimentId,
    type,
    totalCost: results.reduce((sum, r) => sum + r.cost, 0)
  });

  return {
    experiment,
    ...explainability,
    metadata: {
      experimentId,
      type,
      runs: results.length,
      totalCost: results.reduce((sum, r) => sum + r.cost, 0),
      totalTokens: results.reduce((sum, r) => sum + r.tokensUsed.input + r.tokensUsed.output, 0),
      durationMs: results.reduce((sum, r) => sum + r.durationMs, 0)
    }
  };
}

async function runCustomPrompt(prompt, testData, modelOverride, env) {
  const systemPrompt = prompt;
  const userPrompt = typeof testData === 'string' ? testData : JSON.stringify(testData, null, 2);

  const result = await runTextGeneration({
    systemPrompt,
    userPrompt,
    complexity: 'standard',
    capability: 'experiment',
    model: modelOverride,
    maxTokens: 2000,
    jsonMode: false // Allow free-form output
  }, env);

  return {
    promptVersion: 'custom',
    output: result.text,
    tokensUsed: result.tokensUsed,
    cost: result.cost,
    durationMs: result.durationMs,
    model: result.model,
    provider: result.provider
  };
}

async function compareResults(resultA, resultB, testData) {
  // Use AI to compare the two outputs
  const comparisonPrompt = `Compare these two AI outputs for the same input and determine which is better.

INPUT DATA:
${JSON.stringify(testData, null, 2)}

OUTPUT A:
${resultA.output}

OUTPUT B:
${resultB.output}

Provide:
1. winner: "A", "B", or "tie"
2. confidence: 0.0-1.0 how confident you are
3. insights: 3 key differences or strengths of each`;

  const result = await runTextGeneration({
    systemPrompt: 'You are an expert evaluator comparing AI outputs.',
    userPrompt: comparisonPrompt,
    complexity: 'standard',
    capability: 'experiment-comparison',
    maxTokens: 1000,
    jsonMode: true,
    jsonSchema: {
      name: 'comparison',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          winner: { type: 'string', enum: ['A', 'B', 'tie'] },
          confidence: { type: 'number' },
          insights: { type: 'array', items: { type: 'string' } }
        },
        required: ['winner', 'confidence', 'insights']
      }
    }
  }, { AI_PREFERRED_PROVIDER: 'claude' }); // Force Claude for consistency

  const parsed = JSON.parse(result.text);
  return {
    winner: parsed.winner,
    confidence: parsed.confidence,
    insights: parsed.insights
  };
}

async function testHypothesis(capability, hypothesis, customPrompt, testData, iterations, env) {
  // Run the capability multiple times with different prompts to test hypothesis
  const results = [];
  const basePrompt = getBasePromptForCapability(capability);

  for (let i = 0; i < iterations; i++) {
    // Run with base prompt
    const baseResult = await runCapabilityWithPrompt(capability, basePrompt, testData, env);
    // Run with custom prompt
    const customResult = await runCapabilityWithPrompt(capability, customPrompt, testData, env);

    results.push({ base: baseResult, custom: customResult });
  }

  // Analyze if hypothesis is supported
  const evidence = [];
  let supportedCount = 0;

  results.forEach((r, i) => {
    const baseQuality = assessOutputQuality(r.base.output);
    const customQuality = assessOutputQuality(r.custom.output);

    if (customQuality > baseQuality) {
      supportedCount++;
      evidence.push(`Run ${i+1}: Custom prompt outperformed base (${customQuality} vs ${baseQuality})`);
    } else {
      evidence.push(`Run ${i+1}: Base prompt was better or equal (${baseQuality} vs ${customQuality})`);
    }
  });

  const confidence = supportedCount / iterations;
  const supported = confidence > 0.6; // Hypothesis supported if >60% of runs favor custom

  return {
    supported,
    evidence,
    confidence
  };
}

function getBasePromptForCapability(capability) {
  // Simplified - in real implementation, pull from prompt-versions
  const basePrompts = {
    'intent-classify': 'Classify search intent for these keywords.',
    'anomaly-diagnosis': 'Diagnose the root cause of these anomalies.',
    'content-rewrite': 'Rewrite content for better SEO.'
  };
  return basePrompts[capability] || 'Analyze this data.';
}

async function runCapabilityWithPrompt(capability, prompt, testData, env) {
  // Simplified simulation - in real implementation, this would call the actual capability
  return await runCustomPrompt(prompt, testData, null, env);
}

function assessOutputQuality(output) {
  // Simple heuristic scoring
  let score = 0.5; // baseline
  if (output.length > 100) score += 0.1;
  if (output.includes('analysis') || output.includes('recommendation')) score += 0.2;
  if (output.includes('confidence') || output.includes('evidence')) score += 0.2;
  return Math.min(1.0, score);
}

function generateExplainability(experiment) {
  const { type, results, comparison, hypothesisResult } = experiment;

  let explanation = `This ${type} experiment `;
  if (type === 'ab-test' && comparison) {
    explanation += `compared two prompts. ${comparison.winner === 'A' ? 'The first prompt' : comparison.winner === 'B' ? 'The second prompt' : 'Neither prompt'} performed better with ${comparison.confidence * 100}% confidence.`;
  } else if (type === 'hypothesis-test' && hypothesisResult) {
    explanation += `tested whether a custom prompt improves results. The hypothesis ${hypothesisResult.supported ? 'was supported' : 'was not supported'} with ${hypothesisResult.confidence * 100}% confidence.`;
  } else {
    explanation += `ran ${results.length} times to test your custom prompt.`;
  }

  const confidenceBreakdown = {
    primarySignal: type === 'ab-test' ? 'Direct output comparison' : 'Statistical analysis of multiple runs',
    alternativeApproaches: ['Manual evaluation', 'User feedback collection', 'Performance metrics tracking'],
    dataQuality: `Based on ${results.length} experimental runs`
  };

  const nextSteps = [
    'Review the results and iterate on your prompt',
    'Run additional experiments with refined prompts',
    'Implement winning prompts in production if hypothesis supported',
    'Track performance improvements over time'
  ];

  return { explanation, confidenceBreakdown, nextSteps };
}