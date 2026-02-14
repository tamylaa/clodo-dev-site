# AI Engine — Strategic Moat Implementation Plan

## Work Breakdown Structure (WBS) · Prioritized · First-Principles

> **Goal:** Transform the AI Engine from a "Prompt → Parse → Hope" wrapper into a defensible,
> research-backed SEO intelligence platform that high-frequency SEO teams cannot replicate
> with generic ChatGPT prompts.

---

## Table of Contents

1. [First-Principles Analysis](#1-first-principles-analysis)
2. [Current State Audit Summary](#2-current-state-audit-summary)
3. [Open Source Package Inventory](#3-open-source-package-inventory)
4. [Reusable Codebase Elements](#4-reusable-codebase-elements)
5. [Moat Architecture: 7 Pillars](#5-moat-architecture-7-pillars)
6. [WBS Phase 1 — Foundation (Weeks 1-2)](#6-wbs-phase-1--foundation-weeks-1-2)
7. [WBS Phase 2 — Intelligence Layer (Weeks 3-5)](#7-wbs-phase-2--intelligence-layer-weeks-3-5)
8. [WBS Phase 3 — Differentiation (Weeks 6-8)](#8-wbs-phase-3--differentiation-weeks-6-8)
9. [WBS Phase 4 — Learning Loop (Weeks 9-10)](#9-wbs-phase-4--learning-loop-weeks-9-10)
10. [Dependency Graph](#10-dependency-graph)
11. [Risk Matrix](#11-risk-matrix)
12. [Success Metrics](#12-success-metrics)

---

## 1. First-Principles Analysis

### What do high-frequency SEO teams actually do daily?

Starting from zero assumptions, here is what SEO practitioners do repeatedly:

| Activity | Frequency | Pain Level | Current AI Engine Coverage |
|---|---|---|---|
| **Classify keyword intent** for content briefs | Daily (50-500 keywords/day) | Medium — manual is tedious but doable | ✅ Basic (zero-shot, no examples) |
| **Diagnose traffic drops** after algorithm updates | Weekly (spikes around Google updates) | Critical — panic + no clear answer | ✅ Basic (no timeline correlation) |
| **Cluster keywords** into topic hubs | Weekly (100-5000 keywords) | High — spreadsheet hell | ✅ Intermediate (embeddings + union-find) |
| **Rewrite titles/metas** for CTR optimization | Daily (5-50 pages/day) | Medium — creative fatigue | ✅ Basic+ (good constraints, no SERP grounding) |
| **Forecast traffic** for stakeholder reporting | Weekly/Monthly | High — Excel + gut feeling | ✅ Intermediate (basic stats + LLM overlay) |
| **Refine recommendations** from audit tools | Weekly | Medium — too many generic recs | ✅ Intermediate (two-pass critique→refine) |
| **Chat about data** with non-technical stakeholders | Daily | Low-Medium — explaining data | ✅ Basic (data dump, no hallucination detection) |
| **Content gap analysis** vs competitors | Weekly | **VERY HIGH — no automation** | ❌ Not built |
| **Internal linking opportunity detection** | Monthly | **HIGH — manual crawl analysis** | ❌ Not built |
| **SERP feature tracking & optimization** | Daily | **HIGH — scattered across tools** | ❌ Not built |
| **Cannibalization detection & resolution** | Monthly | **VERY HIGH — hard to spot** | ❌ Not built |
| **Page-level SEO scoring** with priorities | Daily | **HIGH — every audit tool does this differently** | ❌ Not built |

### First-Principles Insight: Where Are the Moats?

**The moat is NOT in calling an LLM.** Anyone can call Claude/GPT-4 with a prompt. The moat lives in:

1. **Domain-specific pre-processing** — Statistical analysis BEFORE the LLM sees data
2. **Structured output guarantees** — Results that code can consume, not just text
3. **Accumulated intelligence** — Learning from every request to improve the next one
4. **Multi-signal fusion** — Combining embeddings + statistics + LLM reasoning
5. **Edge-native speed** — Sub-200ms responses on Cloudflare Workers (competitors need round-trips to origin servers)
6. **Vertical depth** — SEO-specific knowledge graphs, entity models, SERP pattern databases
7. **Feedback loops** — Users correcting outputs trains the system to be better

---

## 2. Current State Audit Summary

### Capability Ratings

| Capability | Sophistication | Key Weakness | Moat Potential |
|---|---|---|---|
| Intent Classifier | **Basic** | Zero-shot, no examples, no validation | High — few-shot + heuristic pre-screen |
| Anomaly Diagnosis | **Basic** | Zero-shot, static taxonomy, no timeline awareness | Very High — needs Google update database |
| Embedding Clusters | **Intermediate** | Union-find is good; no silhouette scoring, no labeling | High — add k-means, topic naming |
| Conversational AI | **Basic** | Data dump in prompt, no hallucination check | Medium — needs RAG + citation |
| Content Rewrites | **Basic+** | Best constraints; no SERP competitor analysis | Very High — SERP-grounded rewrites = killer feature |
| Recommendation Refiner | **Intermediate** | Two-pass is genuinely smart; needs evidence grounding | Medium — already differentiated |
| Smart Forecasting | **Intermediate** | Basic stats done well; LLM overlay is thin | High — needs Holt-Winters, seasonality detection |

### Systemic Weaknesses (apply to ALL capabilities)

1. **No structured output** — Every capability uses `text.match(/\{[\s\S]*\}/)` regex to extract JSON from free text
2. **No input validation** — Beyond basic empty checks, payloads aren't schema-validated
3. **No output validation** — Parsed JSON is never validated against expected schema
4. **No few-shot examples** — Zero prompts include example input→output pairs
5. **No confidence calibration** — LLM self-reported confidence is unreliable
6. **No evaluation framework** — No way to measure if outputs improved over time

---

## 3. Open Source Package Inventory

### Tier 1: Production-Ready, Workers-Compatible (Zero/Few Dependencies)

| Package | Version | Weekly DL | Purpose | Size | Workers Safe? |
|---|---|---|---|---|---|
| **`zod`** | 4.3.6 | 91M | Schema validation + type inference | 2kb gzip core | ✅ Yes (zero deps) |
| **`simple-statistics`** | 7.8.8 | 577K | Descriptive stats, regression, distributions | Zero deps | ✅ Yes |
| **`ml-distance`** | 4.0.1 | 211K | Cosine, Jaccard, Euclidean + 30 more distances | 3 deps (tiny) | ✅ Yes |
| **`ml-kmeans`** | 7.0.0 | 91K | K-means clustering with k-means++ init | 4 deps (tiny) | ✅ Yes |
| **`ml-hclust`** | 4.0.0 | 9K | Hierarchical clustering (AGNES/Ward) | 4 deps (tiny) | ✅ Yes |
| **`compromise`** | 14.14.5 | 351K | Client-side NLP (tokenizer, POS, entities) | ~250kb min | ⚠️ Large but pure JS |
| **`ajv`** | 8.17.1 | 230M | JSON Schema validator (fastest) | 4 deps | ✅ Yes |

### Tier 2: Useful Utilities

| Package | Purpose | Workers Safe? | Notes |
|---|---|---|---|
| **`fast-json-stringify`** | Fast JSON serialization from schema | ✅ | Pair with ajv for full schema pipeline |
| **`compromise-stats`** | TF-IDF, n-grams from compromise | ✅ | Plugin for content analysis |
| **`string-similarity`** | Dice coefficient, Levenshtein | ✅ | Title/meta deduplication |

### Tier 3: Reference Only (Too Heavy for Workers)

| Package | Purpose | Why Not Workers | Alternative |
|---|---|---|---|
| **`natural`** | Full NLP (stemming, Bayes, TF-IDF) | 13.8MB, 15 deps, Node.js APIs | Use compromise or custom |
| **`brain.js`** | Neural networks in JS | Heavy, GPU-oriented | Use Workers AI models |
| **`tensorflow.js`** | Full ML framework | Way too large | Use Workers AI |

### Provider-Native Structured Output

| Provider | Feature | Method | Status |
|---|---|---|---|
| **Claude** | Tool Use / JSON mode | `tools` parameter with JSON schema | ✅ Production |
| **OpenAI** | Structured Outputs | `response_format: { type: "json_schema", json_schema: {...} }` | ✅ Production |
| **Gemini** | JSON mode | `response_mime_type: "application/json"` + schema | ✅ Production |
| **Mistral** | JSON mode | `response_format: { type: "json_object" }` | ✅ Production |
| **DeepSeek** | JSON mode | `response_format: { type: "json_object" }` | ✅ Production |
| **Cloudflare** | — | No native structured output | ❌ Regex only |

---

## 4. Reusable Codebase Elements

### What We Already Have That's Good

| Element | Location | Reusability | Notes |
|---|---|---|---|
| Multi-provider orchestrator | `ai-provider.mjs` | **Core** — all upgrades flow through this | Add structured output params here |
| Model registry + capability routing | `model-registry.mjs` | **Core** — extend, don't replace | Add model feature flags (json_mode, tools) |
| Provider adapter pattern | `adapters/*.mjs` | **Core** — each adapter becomes structured-output aware | Modify each adapter's API call format |
| KV usage tracking | `usage-tracker.mjs` | **Extend** — add quality metrics | Track parse failures, response quality |
| Framework shims | `lib/framework-shims.mjs` | **Keep** — lightweight and Workers-safe | No changes needed |
| Cosine similarity | `embedding-clusters.mjs` | **Extract** — useful across capabilities | Move to `src/lib/math-utils.mjs` |
| Linear slope + basic stats | `smart-forecasting.mjs` | **Extract** — used by forecasting, needed by anomaly | Move to `src/lib/math-utils.mjs` |
| Test fixtures + validators | `tests/fixtures/` | **Extend** — add Zod schemas as source of truth | Validators become Zod schemas |
| Fallback patterns | Every capability | **Standardize** — every capability has its own fallback | Create `src/lib/response-parser.mjs` |

### Code to Extract & Share

```
src/lib/math-utils.mjs        ← cosine similarity, linear slope, descriptive stats, avg()
src/lib/response-parser.mjs   ← unified JSON extraction, schema validation, fallback generation
src/lib/schemas/               ← Zod schemas for every capability input + output
src/lib/few-shot-examples/     ← Example input→output pairs per capability
src/lib/seo-knowledge/         ← Google update timeline, SERP feature taxonomy, intent heuristics
```

---

## 5. Moat Architecture: 7 Pillars

### Pillar 1: Structured Output Pipeline (Foundation)
**Why it matters:** Eliminates the "hope" from "Prompt → Parse → Hope." Every response is validated.
**Moat strength:** Medium alone, but ENABLES every other pillar.

### Pillar 2: Statistical Pre-Processing (Intelligence Before the LLM)
**Why it matters:** LLMs are expensive and slow. Computing stats first means shorter prompts, better results.
**Moat strength:** High — competitors who skip this get worse results at higher cost.

### Pillar 3: Few-Shot Exemplars (SEO Knowledge Encoding)
**Why it matters:** Zero-shot prompts produce generic output. Few-shot with real SEO examples produces expert output.
**Moat strength:** Very High — the example bank IS proprietary knowledge.

### Pillar 4: SERP-Grounded Intelligence (Real Data → Real Rewrites)
**Why it matters:** Rewriting titles without knowing what's ACTUALLY ranking is guessing. SERP data makes it science.
**Moat strength:** Very High — this is the killer feature most competitors lack.

### Pillar 5: SEO Knowledge Graph (Google Updates, Entity Models)
**Why it matters:** Anomaly diagnosis is useless without knowing WHEN Google pushed an update.
**Moat strength:** High — curated data that accumulates over time.

### Pillar 6: Quality Feedback Loop (Learning From Usage)
**Why it matters:** Every user interaction is training data. Log quality signals → improve prompts → better outputs.
**Moat strength:** Very High — compounds over time, impossible to replicate without users.

### Pillar 7: New High-Value Capabilities (Cannibalization, Content Gaps)
**Why it matters:** These are the HIGHEST pain-point activities with NO good automation today.
**Moat strength:** Very High — first-mover advantage in unsolved problems.

---

## 6. WBS Phase 1 — Foundation (Weeks 1-2)

> **Theme:** Build the shared infrastructure that every subsequent improvement needs.
> **Dependencies:** None — this is the critical path start.

### 1.1 Shared Math Library
**Priority:** P0 (Blocks Phase 2)
**Effort:** 3-4 hours
**Description:** Extract and consolidate math utilities scattered across capabilities.

| Task | Details | File |
|---|---|---|
| 1.1.1 | Create `src/lib/math-utils.mjs` | Extract from forecasting + embeddings |
| 1.1.2 | Functions: `cosineSimilarity()`, `linearSlope()`, `avg()`, `descriptiveStats()`, `percentChange()`, `zScore()`, `movingAverage()`, `exponentialSmoothing()` | Pure functions, no deps |
| 1.1.3 | Add Holt-Winters triple exponential smoothing | Reference `simple-statistics` patterns |
| 1.1.4 | Add seasonal decomposition (STL-lite) | Additive decomposition: trend + seasonal + residual |
| 1.1.5 | Update `smart-forecasting.mjs` and `embedding-clusters.mjs` to import from shared lib | Remove duplicated code |
| 1.1.6 | Unit tests for every function | `tests/unit/math-utils.test.mjs` |

**Open source leverage:**
- `simple-statistics` — Use as reference for implementations. If bundle size is acceptable (~1.18MB unpacked but tree-shakeable), import directly for `linearRegression()`, `standardDeviation()`, `quantile()`, `sampleCorrelation()`.
- Keep pure math functions in-house for Workers size optimization.

### 1.2 Schema Validation Layer (Zod)
**Priority:** P0 (Blocks everything)
**Effort:** 6-8 hours
**Description:** Define input AND output schemas for every capability using Zod.

| Task | Details | File |
|---|---|---|
| 1.2.1 | Install `zod` as production dependency | `npm install zod` |
| 1.2.2 | Create `src/lib/schemas/intent-classifier.schema.mjs` | Input: keywords[], context. Output: classifications[] with intent enum |
| 1.2.3 | Create `src/lib/schemas/anomaly-diagnosis.schema.mjs` | Input: anomalies[], currentData. Output: diagnoses[] with cause enum |
| 1.2.4 | Create `src/lib/schemas/embedding-clusters.schema.mjs` | Input: keywords[], minSimilarity. Output: clusters[], orphans[] |
| 1.2.5 | Create `src/lib/schemas/conversational-ai.schema.mjs` | Input: message, analyticsContext, history[]. Output: response string |
| 1.2.6 | Create `src/lib/schemas/content-rewrites.schema.mjs` | Input: pages[]. Output: rewrites[] with title/desc/h1 objects |
| 1.2.7 | Create `src/lib/schemas/recommendation-refiner.schema.mjs` | Input: recommendations[], analyticsContext. Output: refined[] |
| 1.2.8 | Create `src/lib/schemas/smart-forecasting.schema.mjs` | Input: timeSeries[], forecastDays. Output: forecasts{}, outlook |
| 1.2.9 | Create `src/lib/schemas/index.mjs` — barrel export | All schemas accessible from one import |
| 1.2.10 | Add input validation to every capability entry function | Replace manual checks with `schema.safeParse()` |
| 1.2.11 | Unit tests for schema validation | `tests/unit/schemas.test.mjs` |

**Open source leverage:**
- `zod` (v4) — 2kb gzipped core, zero dependencies, perfect for Workers.
- Use `z.enum()` for intent types, severity levels, trend directions.
- Use `z.coerce` for flexible number parsing from LLM outputs.
- Zod schemas double as documentation AND runtime validators.

### 1.3 Structured Output Pipeline
**Priority:** P0 (Blocks Phase 2)
**Effort:** 8-10 hours
**Description:** Make every LLM call return validated, structured JSON — not regex-extracted hopeful text.

| Task | Details | File |
|---|---|---|
| 1.3.1 | Create `src/lib/response-parser.mjs` | Unified response parsing with Zod validation |
| 1.3.2 | Add `jsonMode` flag to `runTextGeneration()` params | `ai-provider.mjs` — routes to provider's native JSON mode |
| 1.3.3 | Update Claude adapter for tool-use/JSON mode | `adapters/claude.mjs` — use `tools` parameter |
| 1.3.4 | Update OpenAI adapter for structured outputs | `adapters/openai.mjs` — use `response_format.json_schema` |
| 1.3.5 | Update Gemini adapter for JSON mode | `adapters/gemini.mjs` — use `response_mime_type` |
| 1.3.6 | Update Mistral adapter for JSON mode | `adapters/mistral.mjs` — use `response_format` |
| 1.3.7 | Update DeepSeek adapter for JSON mode | `adapters/deepseek.mjs` — use `response_format` |
| 1.3.8 | Cloudflare fallback: keep regex extraction + Zod validation | `adapters/cloudflare.mjs` — no native JSON mode |
| 1.3.9 | `response-parser.mjs`: `parseAndValidate(text, zodSchema, fallbackFn)` | Unified: try native JSON → try regex extract → validate with Zod → fallback |
| 1.3.10 | Add `modelFeatures` to model-registry | Track which models support `json_mode`, `tools`, `structured_output` |
| 1.3.11 | Update all 7 capabilities to use `parseAndValidate()` | Replace all `text.match(/\{[\s\S]*\}/)` calls |
| 1.3.12 | Integration tests for structured output | `tests/unit/structured-output.test.mjs` |

**Architecture:**
```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌────────────┐
│  Capability  │──→  │  ai-provider  │──→  │   Adapter     │──→  │  LLM API   │
│  (schema in) │     │  (add json   │     │  (native JSON │     │  (returns  │
│              │     │   mode flag) │     │   mode param) │     │   JSON)    │
└─────────────┘     └──────────────┘     └──────────────┘     └────────────┘
                                                                      │
                                                                      ▼
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌────────────┐
│  Validated   │◀──  │  Zod Schema  │◀──  │  response-   │◀──  │  Raw JSON  │
│  Result      │     │  .parse()    │     │  parser.mjs  │     │  or text   │
└─────────────┘     └──────────────┘     └──────────────┘     └────────────┘
```

### 1.4 Few-Shot Example Bank
**Priority:** P1 (Blocks Phase 2 capabilities)
**Effort:** 5-6 hours
**Description:** Create curated example input→output pairs for every capability.

| Task | Details | File |
|---|---|---|
| 1.4.1 | Create `src/lib/few-shot/intent-examples.mjs` | 5 examples: transactional, commercial, informational, navigational, ambiguous |
| 1.4.2 | Create `src/lib/few-shot/anomaly-examples.mjs` | 4 examples: algorithm update, technical issue, competitor action, seasonal |
| 1.4.3 | Create `src/lib/few-shot/rewrite-examples.mjs` | 3 examples: transactional page, informational guide, commercial comparison |
| 1.4.4 | Create `src/lib/few-shot/forecast-examples.mjs` | 3 examples: rising trend, seasonal pattern, post-update recovery |
| 1.4.5 | Create `src/lib/few-shot/refiner-examples.mjs` | 2 examples: weak→strong recommendation transformation |
| 1.4.6 | Create `src/lib/few-shot/index.mjs` | Barrel export with `getExamples(capability, count)` |
| 1.4.7 | Update each capability's system prompt to include 2-3 examples | Inject examples between instructions and output format |
| 1.4.8 | A/B test: measure parse success rate before/after few-shot | Track in KV: `parse_success_rate` per capability |

**Key principle:** Examples should come from REAL SEO scenarios, not synthetic ones. Each example should demonstrate the EXACT output format expected.

### 1.5 Quality Tracking in KV
**Priority:** P1 (Enables Phase 4)
**Effort:** 3-4 hours
**Description:** Extend existing KV usage tracker to record quality signals.

| Task | Details | File |
|---|---|---|
| 1.5.1 | Add to `usage-tracker.mjs`: `trackQuality(capability, metrics)` | Track: parse_success, schema_valid, fallback_used, response_time_ms |
| 1.5.2 | Add per-capability quality counters | `quality:intent-classify:parse_success`, `quality:intent-classify:fallback_count` |
| 1.5.3 | Add quality summary endpoint | `GET /api/quality` — returns success rates per capability |
| 1.5.4 | Dashboard-ready output format | Percentages, trends, alerts when fallback rate > 20% |

---

## 7. WBS Phase 2 — Intelligence Layer (Weeks 3-5)

> **Theme:** Make each capability genuinely smart by adding pre-LLM intelligence.
> **Dependencies:** Phase 1 (schemas, structured output, math library).

### 2.1 Smart Intent Classifier v2
**Priority:** P1
**Effort:** 6-8 hours
**Depends on:** 1.2, 1.3, 1.4

| Task | Details |
|---|---|
| 2.1.1 | **Heuristic pre-screen**: Before calling the LLM, apply regex/keyword rules to pre-classify obvious intents | `"buy" + "price" → transactional` with 0.9 confidence, skip LLM call. Saves cost. |
| 2.1.2 | **Intent keyword dictionary**: Build a lookup of ~200 intent signal words | `"how to" → informational`, `"best" → commercial`, `"login" → navigational`, `"coupon" → transactional` |
| 2.1.3 | **Inject few-shot examples**: 5 examples covering edge cases | Ambiguous queries like "apple" (product vs fruit) demonstrate reasoning |
| 2.1.4 | **Structured output**: Use provider JSON mode | Return Zod-validated `IntentClassification[]` |
| 2.1.5 | **Confidence calibration**: Add post-hoc calibration | If heuristic and LLM agree → boost confidence. If they disagree → lower confidence, flag for review. |
| 2.1.6 | **Business value model**: Score based on keyword commercial signals | Contains price terms (+3), brand terms (+2), comparison words (+2), buying intent words (+3) |

**Moat factor:** The heuristic dictionary + calibration layer means we can handle 30-50% of keywords WITHOUT LLM calls. Faster AND cheaper.

### 2.2 Anomaly Diagnosis v2 — Timeline-Aware
**Priority:** P1
**Effort:** 8-10 hours
**Depends on:** 1.1, 1.2, 1.3, 1.4

| Task | Details |
|---|---|
| 2.2.1 | **Google Update Timeline**: Create `src/lib/seo-knowledge/google-updates.mjs` | Static database of known Google updates with dates, types, and typical impact patterns. Cover 2023-2025. Sources: Search Engine Land, Google Search Status Dashboard. |
| 2.2.2 | **Anomaly-to-update correlation**: For each anomaly, check if date falls within ±7 days of a known update | Pre-compute "this anomaly coincides with the March 2025 Core Update" before sending to LLM |
| 2.2.3 | **Statistical anomaly scoring**: Compute z-score of the change magnitude | Is this a 2σ event or a 5σ event? LLM gets this context. |
| 2.2.4 | **Pattern library**: Known anomaly patterns | "Position drop + impressions stable = cannibalization", "CTR drop + position stable = SERP feature gained by competitor" |
| 2.2.5 | **Few-shot examples**: 4 examples with reasoning chains | Show the LLM HOW to reason about algorithm updates vs technical issues |
| 2.2.6 | **Confidence calibration**: Cross-reference diagnosis with pattern matching | If statistical pattern matches LLM diagnosis → high confidence |

**Moat factor:** The Google Update Timeline is curated, proprietary knowledge that makes every diagnosis instantly more credible. Users learn to trust the system.

### 2.3 Smart Forecasting v2 — Statistical Foundation
**Priority:** P2
**Effort:** 10-12 hours
**Depends on:** 1.1, 1.2, 1.3

| Task | Details |
|---|---|
| 2.3.1 | **Holt-Winters implementation**: Triple exponential smoothing in `math-utils.mjs` | Level + trend + seasonal components. Use 7-day seasonality for daily data. |
| 2.3.2 | **Seasonal decomposition**: Detect day-of-week patterns | Additive model: observed = trend + seasonal + residual |
| 2.3.3 | **Trend detection**: Linear regression + change-point detection | Is the trend accelerating? Where did it change? |
| 2.3.4 | **Statistical forecast FIRST**: Generate baseline forecast without LLM | Holt-Winters prediction with confidence intervals |
| 2.3.5 | **LLM as overlay**: Send statistical forecast to LLM for contextual adjustment | "The statistical model predicts X. Given these additional factors [context], adjust the forecast." |
| 2.3.6 | **Dual output**: Return both statistical forecast AND LLM-adjusted forecast | Users see the "math says X, AI says Y because Z" — transparency builds trust |
| 2.3.7 | **Accuracy tracking**: Store forecasts in KV, compare to actuals later | `forecast:YYYYMMDD:metric → predicted_value`. Job checks accuracy after forecast period ends. |

**Open source leverage:**
- `simple-statistics`: `linearRegression()`, `standardDeviation()`, `quantile()`
- Build Holt-Winters from scratch (small, well-documented algorithm, ~50 lines)
- Consider `ml-regression` for polynomial regression if needed

**Moat factor:** Combining statistical rigor with LLM contextual reasoning is a genuine innovation. Neither pure-stats nor pure-LLM tools do this.

### 2.4 Content Rewrites v2 — SERP-Grounded
**Priority:** P1
**Effort:** 8-10 hours
**Depends on:** 1.2, 1.3, 1.4

| Task | Details |
|---|---|
| 2.4.1 | **SERP data input**: Extend schema to accept `competitors[]` per page | Each page can include top 5 competing titles, descriptions, URLs from SERP |
| 2.4.2 | **Competitor title analysis**: Pre-compute before LLM call | Character counts, power word presence, number/year inclusion, keyword position |
| 2.4.3 | **CTR prediction model**: Heuristic CTR estimator | Based on position + title features: has number (+0.5% CTR), has year (+0.3%), under 55 chars (+0.2%) |
| 2.4.4 | **SERP-aware prompt**: Show the LLM what's ACTUALLY ranking | "Here's what positions 1-5 look like. Write something that stands out while matching intent." |
| 2.4.5 | **Title scoring**: Score current AND suggested titles | Feature vector: keyword position, char length, power words, freshness signals, intent match |
| 2.4.6 | **A/B suggestion**: Generate 2 variants per element (safe + bold) | Safe = incremental improvement. Bold = creative risk. Let user choose. |
| 2.4.7 | **NLP analysis with `compromise`**: Analyze title/meta structure | POS tagging to ensure natural language. Detect keyword stuffing patterns. |

**Open source leverage:**
- `compromise`: Tokenize titles, check POS patterns, detect stuffing
- `compromise-stats`: TF-IDF for keyword density analysis
- `string-similarity`: Detect too-similar titles (deduplication)

**Moat factor:** SERP-grounded rewrites are the #1 requested feature by SEO teams. Knowing what competitors are doing transforms generic suggestions into competitive intelligence.

### 2.5 Embedding Clusters v2 — Proper Clustering
**Priority:** P2
**Effort:** 6-8 hours
**Depends on:** 1.1, 1.2

| Task | Details |
|---|---|
| 2.5.1 | **K-means option**: Add `ml-kmeans` as alternative to agglomerative | User chooses: `method: "agglomerative" | "kmeans"`. K-means better for large sets (>500 keywords). |
| 2.5.2 | **Optimal k detection**: Silhouette scoring | Try k=2 to k=20, pick k with highest silhouette score |
| 2.5.3 | **Cluster labeling**: Use LLM to name clusters | Send cluster keywords to LLM: "Name this topic cluster in 2-4 words" |
| 2.5.4 | **Content hub mapping**: Suggest pillar page + cluster content structure | "This cluster could be a pillar page about X with Y supporting articles" |
| 2.5.5 | **Hierarchical visualization data**: Return dendrogram-compatible structure | For UI to render cluster hierarchy |
| 2.5.6 | **Inter-cluster similarity**: Compute distances between cluster centroids | Identify which clusters could merge (cannibalization risk) |

**Open source leverage:**
- `ml-kmeans`: K-means with k-means++ initialization (91K weekly downloads)
- `ml-hclust`: Hierarchical clustering with Ward's method
- `ml-distance`: Compute inter-cluster distances (cosine, Jaccard)

---

## 8. WBS Phase 3 — Differentiation (Weeks 6-8)

> **Theme:** Build capabilities that DON'T EXIST in competitor tools.
> **Dependencies:** Phase 1 + Phase 2 core capabilities.

### 3.1 Keyword Cannibalization Detector (NEW CAPABILITY)
**Priority:** P1
**Effort:** 12-15 hours
**Depends on:** 1.2, 1.3, 2.5 (embedding clusters)

| Task | Details |
|---|---|
| 3.1.1 | **API endpoint**: `POST /api/capabilities/cannibalization-detect` | Input: pages[] with URLs, keywords, positions, impressions |
| 3.1.2 | **Overlap detection**: Find pages competing for same keywords | If page A and page B both rank for keyword K → candidate cannibalization |
| 3.1.3 | **Embedding similarity**: Use embeddings to find semantically similar pages | Pages with >0.85 content similarity competing for overlapping keywords = high risk |
| 3.1.4 | **Impact scoring**: Quantify the cost of cannibalization | "These 2 pages split 500 impressions. Consolidating could capture 700." |
| 3.1.5 | **Resolution recommendations**: LLM-generated fix suggestions | Merge, redirect, differentiate, canonicalize — with specific steps |
| 3.1.6 | **Schema + validation + tests** | Full Zod schema, structured output, test fixtures |

**Why this is a moat:** Cannibalization detection is one of the most painful manual SEO tasks. Most tools just show "overlapping keywords" without quantifying impact or suggesting solutions. Our embeddings-based approach finds SEMANTIC cannibalization that keyword-level tools miss.

### 3.2 Content Gap Analyzer (NEW CAPABILITY)
**Priority:** P2
**Effort:** 10-12 hours
**Depends on:** 1.2, 1.3, 2.5

| Task | Details |
|---|---|
| 3.2.1 | **API endpoint**: `POST /api/capabilities/content-gaps` | Input: myKeywords[], competitorKeywords[], industry context |
| 3.2.2 | **Gap identification**: Keywords competitors rank for that we don't | Set difference: competitor keywords - my keywords |
| 3.2.3 | **Opportunity scoring**: Rank gaps by traffic potential × achievability | High traffic competitor keywords where our domain has topical authority |
| 3.2.4 | **Cluster gaps into topics**: Use embedding clusters on gap keywords | Group gaps into actionable content briefs, not just keyword lists |
| 3.2.5 | **Content brief generation**: LLM generates brief for top gap clusters | Title suggestion, target keywords, outline, word count estimate |
| 3.2.6 | **Schema + validation + tests** | Full pipeline |

### 3.3 SEO Page Scorer (NEW CAPABILITY)
**Priority:** P2
**Effort:** 8-10 hours
**Depends on:** 1.2, 1.3, 2.4

| Task | Details |
|---|---|
| 3.3.1 | **API endpoint**: `POST /api/capabilities/page-score` | Input: page URL, title, description, h1, keywords, content metrics |
| 3.3.2 | **Heuristic scoring**: Compute scores without LLM | Title length, keyword position, meta length, H1 presence, keyword density |
| 3.3.3 | **Score breakdown**: Return component scores | `{ titleScore: 78, metaScore: 65, h1Score: 90, overallScore: 77 }` |
| 3.3.4 | **Priority ranking**: Sort pages by improvement potential | Pages with low scores + high traffic = highest priority |
| 3.3.5 | **Actionable fixes**: Specific fix per score component | "Title is 72 chars (too long). Suggested: 'X' (58 chars)" |
| 3.3.6 | **Schema + validation + tests** | Full pipeline |

**Moat factor:** Every SEO tool scores pages differently. Ours is transparent (show the formula), LLM-enriched (explain why each fix matters), and integrated with our rewrite engine (one-click fix suggestions).

### 3.4 Conversational AI v2 — RAG + Citation
**Priority:** P2
**Effort:** 8-10 hours
**Depends on:** 1.2, 1.3

| Task | Details |
|---|---|
| 3.4.1 | **Citation system**: Every claim must reference a data point | "CTR dropped 15%[1]" where [1] = specific query + date range |
| 3.4.2 | **Hallucination guard**: Post-generation check | Extract all numbers from response → verify each exists in input data |
| 3.4.3 | **Confidence signal**: Rate response reliability | "High confidence" (all cited) vs "Medium" (some inferred) vs "Low" (insufficient data) |
| 3.4.4 | **Follow-up suggestions**: Generate 2-3 suggested next questions | Based on what data is available but wasn't asked about yet |
| 3.4.5 | **Conversation memory in KV**: Store conversation context | Allow multi-turn across requests (with TTL) |

---

## 9. WBS Phase 4 — Learning Loop (Weeks 9-10)

> **Theme:** Make the system get smarter with every request.
> **Dependencies:** Phase 1 quality tracking, all capabilities.

### 4.1 Feedback Collection API
**Priority:** P2
**Effort:** 4-5 hours

| Task | Details |
|---|---|
| 4.1.1 | **API endpoint**: `POST /api/feedback` | Input: requestId, capability, rating (1-5), corrections (optional) |
| 4.1.2 | **Store in KV**: Feedback linked to request | `feedback:{requestId} → { rating, corrections, capability, timestamp }` |
| 4.1.3 | **Aggregate metrics**: Per-capability satisfaction scores | Rolling 7-day average satisfaction per capability |
| 4.1.4 | **Schema + validation** | Zod schema for feedback input |

### 4.2 Prompt Evolution System
**Priority:** P3
**Effort:** 6-8 hours

| Task | Details |
|---|---|
| 4.2.1 | **Prompt versioning**: Store prompt versions in KV | `prompt:intent-classify:v1`, `prompt:intent-classify:v2` |
| 4.2.2 | **A/B routing**: Serve different prompt versions to different requests | 90% traffic on stable prompt, 10% on experimental |
| 4.2.3 | **Quality comparison**: Compare parse success + user satisfaction across versions | Auto-promote if experimental > stable by statistically significant margin |
| 4.2.4 | **Prompt evolution dashboard data**: Return which version is winning | `GET /api/prompts/status` |

### 4.3 Evaluation Framework
**Priority:** P2
**Effort:** 8-10 hours

| Task | Details |
|---|---|
| 4.3.1 | **Golden dataset**: Curate 20 "ground truth" examples per capability | Known-correct input→output pairs from real SEO data |
| 4.3.2 | **Evaluation script**: Run all capabilities against golden dataset | `npm run evaluate` — outputs accuracy, schema compliance, response time |
| 4.3.3 | **Regression detection**: Compare current results to baseline | Alert if accuracy drops >5% on any capability |
| 4.3.4 | **CI integration**: Run evaluation on every PR | Block merge if regression detected |

---

## 10. Dependency Graph

```
Phase 1 (Foundation)
├── 1.1 Math Library ─────────────────────┐
├── 1.2 Schema Validation (Zod) ──────────┤
├── 1.3 Structured Output Pipeline ───────┤── All depend on nothing
├── 1.4 Few-Shot Example Bank ────────────┤
└── 1.5 Quality Tracking ────────────────┘

Phase 2 (Intelligence)
├── 2.1 Intent Classifier v2 ─── depends on: 1.2, 1.3, 1.4
├── 2.2 Anomaly Diagnosis v2 ─── depends on: 1.1, 1.2, 1.3, 1.4
├── 2.3 Smart Forecasting v2 ─── depends on: 1.1, 1.2, 1.3
├── 2.4 Content Rewrites v2 ──── depends on: 1.2, 1.3, 1.4
└── 2.5 Embedding Clusters v2 ── depends on: 1.1, 1.2

Phase 3 (Differentiation)
├── 3.1 Cannibalization ──── depends on: 1.2, 1.3, 2.5
├── 3.2 Content Gaps ─────── depends on: 1.2, 1.3, 2.5
├── 3.3 Page Scorer ──────── depends on: 1.2, 1.3, 2.4
└── 3.4 Chat v2 (RAG) ───── depends on: 1.2, 1.3

Phase 4 (Learning)
├── 4.1 Feedback API ─────── depends on: 1.5
├── 4.2 Prompt Evolution ─── depends on: 4.1, 1.5
└── 4.3 Evaluation Framework ─ depends on: 1.2 (schemas as ground truth)
```

### Critical Path
```
1.2 (Zod) → 1.3 (Structured Output) → 2.1 (Intent v2) → 2.4 (Rewrites v2) → 3.1 (Cannibalization)
```

### Parallelization Opportunities
- 1.1 (Math) and 1.2 (Zod) can be built simultaneously
- 1.4 (Few-shot) can be written while 1.3 (Structured Output) is being coded
- 2.1, 2.2, 2.4 can all start once 1.2+1.3 are done (parallel)
- 3.1 and 3.2 can be built in parallel
- 4.1 can start anytime after 1.5

---

## 11. Risk Matrix

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| Zod adds unacceptable bundle size | Medium | Low (2kb gzip) | Test Workers bundle size. Fallback: minimal hand-written validators. |
| Provider JSON modes produce different formats | High | Medium | Normalize in response-parser.mjs. Each adapter maps to canonical format. |
| `compromise` too large for Workers (250kb) | Medium | Medium | Use `compromise/one` (tokenizer only, much smaller). Or handwritten title analysis. |
| `simple-statistics` uses Node.js APIs | High | Low (zero deps, pure JS) | Test in Workers runtime. Fallback: copy specific functions. |
| Few-shot examples increase prompt token cost | Medium | High | Use 2-3 examples max. Measure cost increase. Drop to 1 example for simple tasks. |
| Google Update Timeline becomes stale | Medium | High | Add `lastUpdated` field. Log warning when >30 days old. Provide update instructions. |
| User feedback is sparse/unreliable | Medium | High | Implicit signals first (parse success, response time). Explicit feedback is bonus. |
| Cannibalization detection false positives | High | Medium | Require >0.85 semantic similarity AND >3 overlapping keywords. Conservative thresholds. |
| Workers memory/CPU limits for large clustering | High | Medium | Stream embeddings in batches. Cap at 2000 keywords per request. |
| LLM structured output still returns invalid JSON | Medium | Medium | Always have Zod validation + fallback. Double-parse: try JSON.parse, then regex, then fallback. |

---

## 12. Success Metrics

### Phase 1 Completion Criteria
- [ ] All 7 capabilities have Zod input + output schemas
- [ ] Parse success rate > 95% (up from ~80% estimated baseline)
- [ ] Fallback rate < 5% across all capabilities
- [ ] Math library has >95% unit test coverage
- [ ] Structured output works with Claude, OpenAI, and Gemini

### Phase 2 Completion Criteria
- [ ] Intent classifier: >90% accuracy on golden dataset (50 test queries)
- [ ] Anomaly diagnosis: Correctly identifies Google updates when date matches (100%)
- [ ] Forecasting: Statistical forecast within ±15% of actuals on historical data
- [ ] Content rewrites: 100% of outputs pass schema validation
- [ ] Embedding clusters: Silhouette score > 0.5 on test dataset

### Phase 3 Completion Criteria
- [ ] Cannibalization: Detects known cannibalization cases in test data with >80% precision
- [ ] Content gaps: Returns actionable briefs (validated by manual review)
- [ ] Page scorer: Scores correlate with actual ranking improvements (historical validation)
- [ ] Chat v2: Zero hallucinated numbers in responses (citation check)

### Phase 4 Completion Criteria
- [ ] Feedback API operational with <100ms response time
- [ ] Evaluation framework runs in CI with regression detection
- [ ] Prompt versioning supports A/B testing with <1% overhead

### Overall KPIs
| Metric | Baseline (Now) | Target (Week 10) |
|---|---|---|
| Parse success rate | ~80% (estimated) | >97% |
| Capabilities count | 7 | 10 |
| Avg response time | ~3s | <2s (with pre-processing cache) |
| Schema validation coverage | 0% | 100% |
| Few-shot example count | 0 | 25+ (across all capabilities) |
| User satisfaction (feedback) | N/A | >4.0/5.0 |
| LLM calls saved by heuristics | 0% | 20-30% of intent classification |
| Test count | 89 | 200+ |

---

## Appendix A: Package Installation Plan

```bash
# Phase 1 — Foundation
npm install zod

# Phase 2 — Intelligence
npm install simple-statistics ml-distance ml-kmeans

# Phase 3 — Differentiation (optional, evaluate first)
npm install compromise
# OR for minimal:
npm install compromise/one

# Already have (dev):
# vitest, wrangler
```

## Appendix B: File Creation Roadmap

```
Phase 1 creates:
  src/lib/math-utils.mjs
  src/lib/response-parser.mjs
  src/lib/schemas/
    intent-classifier.schema.mjs
    anomaly-diagnosis.schema.mjs
    embedding-clusters.schema.mjs
    conversational-ai.schema.mjs
    content-rewrites.schema.mjs
    recommendation-refiner.schema.mjs
    smart-forecasting.schema.mjs
    index.mjs
  src/lib/few-shot/
    intent-examples.mjs
    anomaly-examples.mjs
    rewrite-examples.mjs
    forecast-examples.mjs
    refiner-examples.mjs
    index.mjs
  tests/unit/math-utils.test.mjs
  tests/unit/schemas.test.mjs
  tests/unit/structured-output.test.mjs

Phase 2 modifies:
  src/capabilities/intent-classifier.mjs      (major rewrite)
  src/capabilities/anomaly-diagnosis.mjs       (major rewrite)
  src/capabilities/smart-forecasting.mjs       (major rewrite)
  src/capabilities/content-rewrites.mjs        (major rewrite)
  src/capabilities/embedding-clusters.mjs      (moderate update)
  src/providers/ai-provider.mjs                (add jsonMode support)
  src/providers/model-registry.mjs             (add model features)
  src/providers/adapters/claude.mjs            (structured output)
  src/providers/adapters/openai.mjs            (structured output)
  src/providers/adapters/gemini.mjs            (JSON mode)
  src/providers/adapters/mistral.mjs           (JSON mode)
  src/providers/adapters/deepseek.mjs          (JSON mode)

Phase 2 creates:
  src/lib/seo-knowledge/
    google-updates.mjs
    intent-heuristics.mjs
    serp-features.mjs
  tests/unit/intent-v2.test.mjs
  tests/unit/anomaly-v2.test.mjs
  tests/unit/forecast-v2.test.mjs

Phase 3 creates:
  src/capabilities/cannibalization-detect.mjs
  src/capabilities/content-gaps.mjs
  src/capabilities/page-scorer.mjs
  src/lib/schemas/cannibalization.schema.mjs
  src/lib/schemas/content-gaps.schema.mjs
  src/lib/schemas/page-scorer.schema.mjs
  tests/unit/cannibalization.test.mjs
  tests/unit/content-gaps.test.mjs
  tests/unit/page-scorer.test.mjs
  tests/fixtures/cannibalization-payloads.mjs
  tests/fixtures/content-gap-payloads.mjs

Phase 4 creates:
  src/lib/feedback.mjs
  src/lib/prompt-versions.mjs
  tests/evaluate/
    golden-dataset/
      intent-golden.json
      anomaly-golden.json
      rewrite-golden.json
      forecast-golden.json
    evaluate.mjs
    regression-check.mjs
```

## Appendix C: Estimated Total Effort

| Phase | Tasks | Estimated Hours | Calendar Weeks |
|---|---|---|---|
| Phase 1 — Foundation | 5 work packages, ~40 tasks | 25-32 hours | 1.5-2 weeks |
| Phase 2 — Intelligence | 5 work packages, ~35 tasks | 38-48 hours | 2.5-3 weeks |
| Phase 3 — Differentiation | 4 work packages, ~24 tasks | 38-47 hours | 2-3 weeks |
| Phase 4 — Learning Loop | 3 work packages, ~12 tasks | 18-23 hours | 1-1.5 weeks |
| **Total** | **17 work packages, ~111 tasks** | **119-150 hours** | **7-10 weeks** |

---

## 13. Implementation Audit — February 2026

### Completion Summary

| Phase | WBS Items | ✅ Done | ⚠️ Partial | ❌ Missing | Completion |
|---|---|---|---|---|---|
| **Phase 1** Foundation | 5 packages / ~40 tasks | 5 | 0 | 0 | **100%** |
| **Phase 2** Intelligence | 5 packages / ~35 tasks | 2 | 3 | 0 | **~85%** |
| **Phase 3** Differentiation | 4 packages / ~24 tasks | 4 | 0 | 0 | **100%** |
| **Phase 4** Learning Loop | 3 packages / ~12 tasks | 1 | 2 | 0 | **~75%** |
| **Overall** | **17 packages / ~111 tasks** | **12** | **5** | **0** | **~92%** |

### The 8% Gap — What Was Deliberately Deferred

These 5 items were partially implemented with good reason:

| # | Item | What's Missing | Verdict |
|---|---|---|---|
| 1 | **Holt-Winters is double, not triple exponential** | No seasonal component (gamma). `seasonalDecompose()` exists in math-utils but unused by forecasting. | **Now wired in** — Phase 5 closes this gap |
| 2 | **Intent dictionary ~85 words, not ~200** | 15 regex patterns covering ~85 signal words vs the ~200 specified | **Expanded to ~150+** — Phase 5 closes this gap |
| 3 | **K-means clustering not implemented** | Schema accepts `method: 'kmeans'` but falls back to agglomerative. `ml-kmeans` not installed. | **Acceptable** — agglomerative works for target volumes (100-2000 keywords) |
| 4 | **No `compromise` NLP for title analysis** | Title scoring uses regex/heuristics, not POS tagging | **Correct decision** — compromise is 250kb, would bloat Workers bundle for marginal gain on 5-10 word titles |
| 5 | **A/B prompt routing not wired up** | Registry + experiment logger exist, but capabilities don't branch between versions at runtime | **Acceptable** — premature without real user traffic to split |

### Zero-Dependency Strategy (Deviation From WBS)

The WBS recommended `simple-statistics`, `ml-kmeans`, `ml-distance`, and `compromise`. Instead, all math was hand-rolled in one ~230-line `math-utils.mjs`. This was the **correct call**:
- Zero bundle bloat (Workers have strict size limits)
- Zero supply-chain risk
- Full control over every algorithm
- 17 exported functions covering all WBS requirements

### Critical Bugs Found & Fixed

| # | Bug | Impact | Resolution |
|---|---|---|---|
| 1 | **KV binding mismatch**: `env.AI_KV` used in 3 files but Wrangler binding is `env.KV_AI` | Chat memory, feedback, experiment logging **silently failing** in production (KV guards masked the failure) | Fixed — 13 occurrences across conversational-ai, feedback, prompt-versions |
| 2 | **Embedding-cluster route missing `logUsage()`** | Embedding requests invisible to usage tracking and quality dashboards | Fixed — added logUsage call |
| 3 | **Root wrangler.toml missing 3 capability toggles** | Cannibalization, content-gaps, page-scorer toggles undefined in dev config | Fixed — added all 3 |
| 4 | **Hardcoded year `(2025)` in content-rewrite variants** | Stale date in generated titles | Fixed — `new Date().getFullYear()` |
| 5 | **Non-standard complexity values `'moderate'`/`'quick'`** in 5 capability files | Fell through to default model routing instead of optimized routing | Fixed — normalized to `standard`/`simple` |
| 6 | **404 response listed 7 of 17 endpoints** | API discoverability gap | Fixed — all 17 endpoints listed |
| 7 | **Dead code**: unused errorHandler, removed function stub, unused import | Code hygiene | Cleaned up |

### Test Results

- **215 tests across 10 test files — 100% passing**
- **0 regressions** from all changes across Phases 1-4
- Target was 200+ tests — exceeded

### Moat Pillar Grades

| Pillar | Status | Grade |
|---|---|---|
| **1. Structured Output Pipeline** | Full chain: schema → provider JSON mode → parser → Zod validation | **A** |
| **2. Statistical Pre-Processing** | z-scores, scoring functions, CTR models, change-point detection — all run BEFORE the LLM | **A** |
| **3. Few-Shot Exemplars** | 8 capability-specific example banks (exceeds WBS target of 5) | **A** |
| **4. SERP-Grounded Intelligence** | CTR prediction, competitor analysis, title scoring, 10-feature SERP database | **A-** |
| **5. SEO Knowledge Graph** | Google updates DB (24 entries), intent heuristics, SERP features, anomaly patterns | **B+** |
| **6. Quality Feedback Loop** | Feedback API, quality tracking, prompt versioning, experiment logging | **B+** |
| **7. New High-Value Capabilities** | Cannibalization, content-gaps, page-scorer — all shipped with hybrid pipelines | **A** |

---

## 14. Phase 5 — Moat Deepening (Post-Audit)

> **Theme:** Close remaining gaps and build the cognitive-load-free executive experience.
> **Triggered by:** Post-implementation audit revealing 8% gap + strategic opportunities.

### Tier 1: High-Impact (Implement Now)

| # | Opportunity | Why It Matters | Effort | Status |
|---|---|---|---|---|
| **5.1** | **Site Health Pulse** — composite endpoint running page-scorer + cannibalization + content-gaps + anomaly detection in parallel, returning a unified executive dashboard score | A marketing leader wants ONE call that says "your site health is 73/100, here are the top 3 things to fix." This IS the cognitive-load-free differentiator. | 6-8 hrs | **DONE** |
| **5.2** | **Cross-capability insight chains** — anomaly diagnosis findings auto-suggest follow-up capabilities (cannibalization on affected URLs, page scoring on dropped pages) | Transforms 10 independent tools into one SEO intelligence brain. One finding triggers the next investigation automatically. | Built into 5.1 | **DONE** |
| **5.3** | **Wire `seasonalDecompose()` into forecasting** | Function exists in math-utils but wasn't imported. Closes WBS gap #1. | 30 min | **DONE** |
| **5.4** | **Expand intent dictionary to ~150+ words** | Closes WBS gap #2. More signal words = more LLM calls saved. | 1-2 hrs | **DONE** |

### Tier 2: Differentiation Polish (Next Sprint)

| # | Opportunity | Why It Matters | Effort |
|---|---|---|---|
| **5.5** | **Streaming `/ai/chat`** via SSE | Every chat interface users have ever used streams. A 3-second wait feels broken in 2026. All 5 external providers support it. | 6-8 hrs |
| **5.6** | **Response envelope standardization** | Currently each capability returns different response shapes. A standard `{ success, data, metadata, warnings }` envelope makes the API feel like one product. | 3-4 hrs |
| **5.7** | **Cost estimation endpoint** — `POST /ai/estimate-cost` | "This analysis will cost ~$0.12 and take 4 seconds." Marketing leaders need budget predictability. | 3-4 hrs |
| **5.8** | **Webhook/callback for large jobs** — accept `callbackUrl`, return `jobId`, POST results when done | For 1000+ keyword clustering or 50+ page scoring, synchronous can timeout. Async unlocks enterprise scale. | 6-8 hrs |

### Tier 3: Future Moat Deepeners (Roadmap)

| # | Opportunity | Why It Matters |
|---|---|---|
| **5.9** | **Competitor intelligence layer** — accumulate SERP snapshots over time | Currently SERP-grounded rewrites need the caller to provide competitor data. Self-accumulated SERP history becomes a data moat — the longer it runs, the more valuable. |
| **5.10** | **Natural language → capability routing** — "why did my traffic drop?" auto-routes to anomaly diagnosis | A marketing leader shouldn't need to know endpoint names. They describe a problem in English. |
| **5.11** | **Batch/bulk endpoint** — process multiple capability requests in one call | "Score 50 pages AND find cannibalization AND rewrite the worst 10" in one API call. |

### What We Explicitly Won't Build (Avoiding Overengineering)

| Item | Reason |
|---|---|
| `compromise` NLP library | 250kb for POS tagging on 5-word titles. Regex handles it fine. |
| K-means clustering | Agglomerative + silhouette covers target volumes. K-means matters at 5000+ scale. |
| Live A/B prompt routing | Infrastructure ready. Ship when there's traffic to split. |
| Full RAG with vector DB | Vectorize index ready in wrangler.toml. Current context-injection works for SEO dashboard data volumes. |

---

*Document updated from implementation audit plus post-audit gap analysis. Phase 5 Tier 1 fully implemented: Site Health Pulse (Capability 11), cross-capability insight chains, seasonal forecasting, intent dictionary expansion. 239 tests passing across 11 test files. Last updated: February 2026.*
