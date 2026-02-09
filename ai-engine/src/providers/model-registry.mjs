/**
 * Model Registry
 * 
 * Central catalog of all supported AI models across all providers.
 * Each model entry declares its capabilities, pricing, limits, and best-use-cases.
 * 
 * This registry is the single source of truth for model selection.
 * The router uses it to pick the optimal model for each task.
 */

// ── Provider definitions ─────────────────────────────────────────────

export const PROVIDERS = {
  claude: {
    id: 'claude',
    name: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com/v1',
    authHeader: 'x-api-key',
    envKey: 'ANTHROPIC_API_KEY',
    tier: 'premium',
    strengths: ['reasoning', 'analysis', 'long-context', 'structured-output', 'safety']
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    envKey: 'OPENAI_API_KEY',
    tier: 'premium',
    strengths: ['coding', 'creative', 'function-calling', 'vision']
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    authMethod: 'query-param',
    authParam: 'key',
    envKey: 'GOOGLE_AI_API_KEY',
    tier: 'premium',
    strengths: ['multimodal', 'speed', 'long-context', 'cost-efficiency']
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral AI',
    baseUrl: 'https://api.mistral.ai/v1',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    envKey: 'MISTRAL_API_KEY',
    tier: 'mid',
    strengths: ['speed', 'coding', 'european-compliance', 'cost-efficiency']
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    envKey: 'DEEPSEEK_API_KEY',
    tier: 'budget',
    strengths: ['reasoning', 'coding', 'cost-efficiency', 'math']
  },
  cloudflare: {
    id: 'cloudflare',
    name: 'Cloudflare Workers AI',
    authMethod: 'binding',
    envKey: 'AI',
    tier: 'free',
    strengths: ['zero-cost', 'low-latency', 'embeddings', 'simple-tasks']
  }
};

// ── Model catalog ────────────────────────────────────────────────────

export const MODELS = {
  // ── Anthropic Claude ─────────────────────────────────────────────
  'claude-sonnet-4': {
    id: 'claude-sonnet-4-20250514',
    provider: 'claude',
    name: 'Claude Sonnet 4',
    contextWindow: 200000,
    maxOutput: 16384,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
    speed: 'fast',
    quality: 'excellent',
    bestFor: ['analysis', 'recommendations', 'chat', 'rewrites', 'forecasting'],
    default: true
  },
  'claude-opus-4': {
    id: 'claude-opus-4-20250514',
    provider: 'claude',
    name: 'Claude Opus 4',
    contextWindow: 200000,
    maxOutput: 32768,
    costPer1kInput: 0.015,
    costPer1kOutput: 0.075,
    speed: 'slow',
    quality: 'best',
    bestFor: ['complex-refinement', 'deep-analysis', 'strategic-planning']
  },
  'claude-haiku-3.5': {
    id: 'claude-3-5-haiku-20241022',
    provider: 'claude',
    name: 'Claude 3.5 Haiku',
    contextWindow: 200000,
    maxOutput: 8192,
    costPer1kInput: 0.0008,
    costPer1kOutput: 0.004,
    speed: 'fastest',
    quality: 'good',
    bestFor: ['classification', 'simple-tasks', 'high-volume']
  },

  // ── OpenAI ───────────────────────────────────────────────────────
  'gpt-4o': {
    id: 'gpt-4o',
    provider: 'openai',
    name: 'GPT-4o',
    contextWindow: 128000,
    maxOutput: 16384,
    costPer1kInput: 0.0025,
    costPer1kOutput: 0.01,
    speed: 'fast',
    quality: 'excellent',
    bestFor: ['analysis', 'creative-writing', 'function-calling', 'rewrites']
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    provider: 'openai',
    name: 'GPT-4o Mini',
    contextWindow: 128000,
    maxOutput: 16384,
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006,
    speed: 'fastest',
    quality: 'good',
    bestFor: ['classification', 'simple-tasks', 'high-volume']
  },
  'o1': {
    id: 'o1',
    provider: 'openai',
    name: 'o1 (Reasoning)',
    contextWindow: 200000,
    maxOutput: 100000,
    costPer1kInput: 0.015,
    costPer1kOutput: 0.06,
    speed: 'slow',
    quality: 'best',
    bestFor: ['complex-reasoning', 'strategic-planning', 'deep-analysis']
  },
  'o3-mini': {
    id: 'o3-mini',
    provider: 'openai',
    name: 'o3-mini (Reasoning)',
    contextWindow: 200000,
    maxOutput: 100000,
    costPer1kInput: 0.0011,
    costPer1kOutput: 0.0044,
    speed: 'medium',
    quality: 'excellent',
    bestFor: ['reasoning', 'analysis', 'forecasting']
  },
  'codex-mini': {
    id: 'codex-mini-latest',
    provider: 'openai',
    name: 'Codex Mini',
    contextWindow: 200000,
    maxOutput: 100000,
    costPer1kInput: 0.0015,
    costPer1kOutput: 0.006,
    speed: 'fast',
    quality: 'excellent',
    bestFor: ['coding', 'structured-output', 'json-generation', 'data-analysis']
  },

  // ── Google Gemini ────────────────────────────────────────────────
  'gemini-2.0-flash': {
    id: 'gemini-2.0-flash',
    provider: 'gemini',
    name: 'Gemini 2.0 Flash',
    contextWindow: 1048576,
    maxOutput: 8192,
    costPer1kInput: 0.0001,
    costPer1kOutput: 0.0004,
    speed: 'fastest',
    quality: 'good',
    bestFor: ['speed', 'simple-tasks', 'high-volume', 'cost-sensitive']
  },
  'gemini-2.5-pro': {
    id: 'gemini-2.5-pro-preview-06-05',
    provider: 'gemini',
    name: 'Gemini 2.5 Pro',
    contextWindow: 1048576,
    maxOutput: 65536,
    costPer1kInput: 0.00125,
    costPer1kOutput: 0.01,
    speed: 'medium',
    quality: 'excellent',
    bestFor: ['complex-analysis', 'long-context', 'multimodal']
  },

  // ── Mistral ──────────────────────────────────────────────────────
  'mistral-large': {
    id: 'mistral-large-latest',
    provider: 'mistral',
    name: 'Mistral Large',
    contextWindow: 128000,
    maxOutput: 8192,
    costPer1kInput: 0.002,
    costPer1kOutput: 0.006,
    speed: 'fast',
    quality: 'excellent',
    bestFor: ['analysis', 'multilingual', 'european-compliance']
  },
  'codestral': {
    id: 'codestral-latest',
    provider: 'mistral',
    name: 'Codestral',
    contextWindow: 256000,
    maxOutput: 8192,
    costPer1kInput: 0.0003,
    costPer1kOutput: 0.0009,
    speed: 'fast',
    quality: 'excellent',
    bestFor: ['coding', 'structured-output', 'json-generation']
  },
  'mistral-small': {
    id: 'mistral-small-latest',
    provider: 'mistral',
    name: 'Mistral Small',
    contextWindow: 32000,
    maxOutput: 8192,
    costPer1kInput: 0.0001,
    costPer1kOutput: 0.0003,
    speed: 'fastest',
    quality: 'good',
    bestFor: ['classification', 'simple-tasks', 'high-volume']
  },

  // ── DeepSeek ─────────────────────────────────────────────────────
  'deepseek-chat': {
    id: 'deepseek-chat',
    provider: 'deepseek',
    name: 'DeepSeek-V3',
    contextWindow: 64000,
    maxOutput: 8192,
    costPer1kInput: 0.00027,
    costPer1kOutput: 0.0011,
    speed: 'fast',
    quality: 'excellent',
    bestFor: ['analysis', 'reasoning', 'cost-sensitive']
  },
  'deepseek-reasoner': {
    id: 'deepseek-reasoner',
    provider: 'deepseek',
    name: 'DeepSeek-R1 (Reasoning)',
    contextWindow: 64000,
    maxOutput: 8192,
    costPer1kInput: 0.00055,
    costPer1kOutput: 0.00219,
    speed: 'medium',
    quality: 'excellent',
    bestFor: ['complex-reasoning', 'math', 'deep-analysis']
  },

  // ── Cloudflare Workers AI (free) ─────────────────────────────────
  'cf-llama-70b': {
    id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    provider: 'cloudflare',
    name: 'Llama 3.3 70B',
    contextWindow: 8192,
    maxOutput: 4096,
    costPer1kInput: 0,
    costPer1kOutput: 0,
    speed: 'medium',
    quality: 'good',
    bestFor: ['simple-tasks', 'fallback', 'free-tier']
  },
  'cf-llama-8b': {
    id: '@cf/meta/llama-3.1-8b-instruct-fast',
    provider: 'cloudflare',
    name: 'Llama 3.1 8B',
    contextWindow: 4096,
    maxOutput: 2048,
    costPer1kInput: 0,
    costPer1kOutput: 0,
    speed: 'fastest',
    quality: 'basic',
    bestFor: ['classification', 'simple-extraction', 'free-tier']
  },
  'cf-bge-embedding': {
    id: '@cf/baai/bge-base-en-v1.5',
    provider: 'cloudflare',
    name: 'BGE Base Embeddings',
    contextWindow: 512,
    maxOutput: 768,
    costPer1kInput: 0,
    costPer1kOutput: 0,
    speed: 'fastest',
    quality: 'good',
    bestFor: ['embeddings'],
    type: 'embedding',
    dimensions: 768
  }
};

// ── Capability → Model routing map ───────────────────────────────────
// Defines the preferred model chain for each capability.
// First available model in the chain wins.

export const CAPABILITY_MODEL_MAP = {
  'intent-classify': {
    simple: ['claude-haiku-3.5', 'gpt-4o-mini', 'gemini-2.0-flash', 'mistral-small', 'cf-llama-8b'],
    standard: ['claude-sonnet-4', 'gpt-4o', 'gemini-2.0-flash', 'mistral-large', 'cf-llama-70b'],
    complex: ['claude-sonnet-4', 'gpt-4o', 'gemini-2.5-pro', 'mistral-large', 'cf-llama-70b']
  },
  'anomaly-diagnose': {
    simple: ['claude-haiku-3.5', 'gpt-4o-mini', 'deepseek-chat', 'cf-llama-70b'],
    standard: ['claude-sonnet-4', 'gpt-4o', 'deepseek-chat', 'mistral-large', 'cf-llama-70b'],
    complex: ['claude-sonnet-4', 'o3-mini', 'deepseek-reasoner', 'gemini-2.5-pro', 'cf-llama-70b']
  },
  'embedding-cluster': {
    simple: ['cf-bge-embedding'],
    standard: ['cf-bge-embedding'],
    complex: ['cf-bge-embedding']
  },
  'chat': {
    simple: ['claude-haiku-3.5', 'gpt-4o-mini', 'gemini-2.0-flash', 'cf-llama-8b'],
    standard: ['claude-sonnet-4', 'gpt-4o', 'gemini-2.0-flash', 'deepseek-chat', 'cf-llama-70b'],
    complex: ['claude-sonnet-4', 'gpt-4o', 'gemini-2.5-pro', 'deepseek-chat', 'cf-llama-70b']
  },
  'content-rewrite': {
    simple: ['claude-haiku-3.5', 'gpt-4o-mini', 'mistral-small', 'cf-llama-8b'],
    standard: ['claude-sonnet-4', 'gpt-4o', 'mistral-large', 'deepseek-chat', 'cf-llama-70b'],
    complex: ['claude-sonnet-4', 'gpt-4o', 'gemini-2.5-pro', 'mistral-large', 'cf-llama-70b']
  },
  'refine-recs': {
    simple: ['claude-sonnet-4', 'gpt-4o', 'deepseek-chat', 'cf-llama-70b'],
    standard: ['claude-sonnet-4', 'gpt-4o', 'gemini-2.5-pro', 'deepseek-chat', 'cf-llama-70b'],
    complex: ['claude-opus-4', 'o1', 'claude-sonnet-4', 'deepseek-reasoner', 'cf-llama-70b']
  },
  'smart-forecast': {
    simple: ['claude-haiku-3.5', 'gpt-4o-mini', 'deepseek-chat', 'cf-llama-70b'],
    standard: ['claude-sonnet-4', 'o3-mini', 'deepseek-chat', 'mistral-large', 'cf-llama-70b'],
    complex: ['claude-sonnet-4', 'o3-mini', 'deepseek-reasoner', 'gemini-2.5-pro', 'cf-llama-70b']
  }
};

/**
 * Get all models for a specific provider.
 */
export function getModelsForProvider(providerId) {
  return Object.entries(MODELS)
    .filter(([, m]) => m.provider === providerId)
    .map(([key, m]) => ({ key, ...m }));
}

/**
 * Get model by key, with optional override from environment.
 */
export function getModel(key) {
  return MODELS[key] || null;
}

/**
 * Check if a provider is available (has API key configured).
 */
export function isProviderAvailable(providerId, env) {
  const provider = PROVIDERS[providerId];
  if (!provider) return false;

  if (providerId === 'cloudflare') return !!env.AI;
  return !!env[provider.envKey];
}
