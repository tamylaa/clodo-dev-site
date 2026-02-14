# API Visibility Guide — Frontend Integration

> **Purpose:** Defines what API response data should be visible to end users vs hidden as implementation details. Ensures the AI feels like expertise, not technology.

**Last Updated:** February 10, 2026

---

## The Three Layers of Visibility

### Layer 1: Always Visible (80% of response data)
**What users care about:** The outcomes, scores, and actionable recommendations. This is the "answer" they came for.

### Layer 2: Progressive Disclosure (15% of response data)
**What builds trust:** The "why" behind the answer. Available on click/expand, but not in-your-face.

### Layer 3: Never Visible (5% of response data)
**Implementation details:** Internal plumbing that would confuse users or reveal competitive IP.

---

## Layer 1: Always Visible — The Outcomes

| Capability | Always Show | Example UI |
|---|---|---|
| **intent-classifier** | Intent label + confidence | `"Transactional (92% confident)"` |
| **anomaly-diagnosis** | Root cause + severity + action | `"Traffic dropped 40% — likely Google Core Update. Check these 3 pages."` |
| **embedding-clusters** | Cluster names + keyword groups | `"These 12 keywords belong together. Target them with one page."` |
| **conversational-ai** | The response text | Natural language answer |
| **content-rewrites** | Before/after suggestions + predicted CTR lift | `"Change title from X → Y (est. +18% CTR)"` |
| **recommendation-refiner** | Refined recommendations + priority | Ranked action items |
| **smart-forecasting** | Forecast chart + trend narrative | `"Clicks projected to reach 2,400 by March (+15%)"` |
| **cannibalization-detect** | Conflicting pages + resolution | `"These 2 pages compete for 'crm software'. Merge into one."` |
| **content-gaps** | Missing topics + suggested titles | `"Competitors rank for 'crm implementation guide' — you don't."` |
| **page-scorer** | Score + grade + top fix | `"Page health: 73/100 (B). Priority: Add schema markup."` |
| **site-health-pulse** | Health score + top 3 priorities | `"Site health: 78/100. #1 priority: Fix cannibalization on /blog."` |

---

## Layer 2: Progressive Disclosure — The Reasoning

Available in expandable "Details" panels, "Why this result?" sections, or tooltips. Shows when users want to understand the "why".

| Field | Capabilities | Why Show It | UI Pattern |
|---|---|---|---|
| `confidence` / `businessValue` | intent-classifier, anomaly | "How sure are you?" — lets users prioritise | Confidence meter |
| `dimensions` (technical, content, UX, onPage) | page-scorer | "Where exactly is the problem?" — actionable detail | Radar chart |
| `seasonalityDetected` + `seasonalPattern` | smart-forecasting | "Is this seasonal or a real trend?" — prevents panic | Seasonal overlay on chart |
| `insights[].description` + `suggestedAction` | site-health-pulse | Cross-capability "aha moments" — the premium value | Insight cards |
| `topPriorities[].effort` | site-health-pulse | "Quick win vs major project" — resource planning | Effort badges |
| `conflicts[].severity` | cannibalization | Lets users triage which conflicts matter | Severity indicators |
| Deterministic pre-score vs final score | page-scorer | "Here's the rule-based score. AI adjusted it because..." | Before/after comparison |
| `method` field | forecasting, clustering | "Statistical + AI" builds more trust than "AI said so" | Method badge |

---

## Layer 3: Never Visible — The Plumbing

**Never render these in the frontend.** They're for internal dashboards, debugging, and cost monitoring only.

| Field | Why Hidden | Where It Lives |
|---|---|---|
| `metadata.provider` / `metadata.model` | Users don't care if it was Claude or Gemini. Invites "why not GPT-4?" debates. | Every capability response |
| `metadata.tokensUsed` / `metadata.cost` | Internal cost accounting. Users see pricing tiers, not per-request math. | Every capability response |
| `metadata.parseQuality.method` | Whether it was `json_parse`, `regex_extract`, or `markdown_table` is implementation detail. | Every capability response |
| `metadata.parseQuality.fallbackUsed` | If LLM returned garbage and we fell back to deterministic — user should never know. | Every capability response |
| `metadata.durationMs` (raw) | Show "Fast" / "Analyzing..." UX, not "1,247ms". | Every capability response |
| Few-shot examples | Competitive IP. The prompt engineering is the secret sauce. | `src/lib/few-shot/` |
| Prompt text | Never expose system prompts. Ever. | Built in capability files |
| Heuristic dictionary / regex patterns | The 155-word intent dictionary is a moat. Don't reveal the shortcuts. | `src/lib/seo-knowledge/intent-heuristics.mjs` |
| Provider failover logic | "Claude was down so we used Gemini" — users should never see this. | `src/providers/ai-provider.mjs` |
| `schema valid` / Zod internals | Parse plumbing. | `metadata.parseQuality.schemaValid` |
| Model registry / routing rules | Competitive architecture detail. | `src/providers/model-registry.mjs` |

---

## Frontend Rendering Strategy

### Consume Everything, Render Selectively

```javascript
// Frontend receives full API response
const response = await fetch('/ai/site-health-pulse', { ... });

// Always render (Layer 1)
renderHealthScore(response.healthScore, response.grade);
renderTopPriorities(response.topPriorities);
renderSummary(response.summary);

// Render in expandable details (Layer 2)
if (userClickedDetails) {
  renderInsights(response.insights);
  renderDimensions(response.dimensions);
}

// Never render (Layer 3)
console.log('Internal:', response.metadata); // For debugging only
```

### Progressive Disclosure Patterns

- **Default view:** Scores, grades, top recommendations
- **"Show details" button:** Dimensions, confidence, method
- **"Why this result?" tooltip:** Reasoning and methodology
- **"Advanced" tab:** Cross-capability insights (for power users)

### Error Handling

When `metadata.parseQuality.fallbackUsed` is true, still render the result normally. The user should never know the LLM failed — the deterministic fallback is still a valid answer.

---

## Admin-Only Endpoints

The `/ai/usage` and `/ai/quality` endpoints should be **completely separate** from the user-facing app. These show:

- Cost per capability per day
- Fallback rate (are LLMs returning garbage?)
- Provider distribution (are we over-relying on one?)
- Quality scores over time

**Access:** Internal dashboard for product owners only. Never expose to end users.

---

## Why This Matters

1. **Trust over transparency:** Users want expertise, not implementation details. "Your traffic will grow 15%" builds confidence. "Claude processed 847 tokens" builds anxiety.

2. **Competitive moat:** The prompt engineering, heuristics, and routing logic are IP. Don't give competitors a roadmap.

3. **User experience:** 80% of users only need the answer. 15% want the reasoning. 5% would be confused by the plumbing.

4. **Future-proofing:** If you switch from Claude to Gemini, the UI doesn't change. If you add a new provider, users don't see it.

---

## Implementation Checklist

- [ ] Frontend renders only Layer 1 by default
- [ ] Layer 2 available via expandable sections
- [ ] Layer 3 fields never reach DOM
- [ ] Admin dashboard consumes `/ai/usage` and `/ai/quality`
- [ ] Error states hide fallback details
- [ ] Confidence meters and method badges implemented
- [ ] Cross-capability insights prominently featured in site-health-pulse