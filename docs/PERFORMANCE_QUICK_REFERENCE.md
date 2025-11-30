# ⚡ Performance Optimization Quick Reference
## Best Practices Aligned with Real-World Outcomes

**TL;DR:** Use these evidence-based levers. Avoid the traps.

---

## 🎯 Quick Decision Framework

### I want to improve performance. What do I do?

```
STEP 1: Measure
└─ npm run lighthouse:audit
   └─ Get both local AND production scores

STEP 2: Analyze
└─ Read the Lighthouse JSON
├─ What's the bottleneck? (rendering, loading, etc.)
└─ Don't guess

STEP 3: Identify Root Cause
├─ Is it a real problem or perceived?
├─ Example: "TBT is high" → But is it blocking anything?
└─ Use Chrome DevTools if unclear

STEP 4: Choose Solution
├─ Tier 1 (Infrastructure): Server-side, Cloudflare, caching
├─ Tier 2 (Assets): Images, fonts, CSS split
├─ Tier 3 (Code Quality): Memory, selectors, animations
└─ AVOID Tier 4: Script deferral, lazy-loading critical code

STEP 5: Make ONE change
└─ Test with lighthouse
├─ Better? Keep it
└─ Worse? Revert immediately

STEP 6: Commit with evidence
└─ "perf: improve X by Y (lighthouse: 89→91)"
```

---

## ✅ The Proven Levers

### Lever #1: Server-Side Processing ⭐ BEST
**What:** Move expensive operations off the client  
**Why:** Reduces JavaScript execution on critical path  
**How:** Use Cloudflare Functions, Workers, API proxying  
**Example:** Analytics proxy (commit 7628000) - Simple change, massive impact  
**Expected Impact:** 5-20% score improvement  
**Risk:** VERY LOW  
**Best For:** Reducing TBT, improving interactivity

### Lever #2: Asset Optimization ✅ PROVEN
**What:** Optimize images, fonts, CSS delivery  
**Why:** Reduces network time and parsing overhead  
**How:** WebP images, async font loading, code splitting  
**Example:** Font optimization (FONT_OPTIMIZATION_REPORT.md) - Eliminated 798ms  
**Expected Impact:** 3-15% score improvement  
**Risk:** LOW  
**Best For:** Improving FCP, LCP, First Paint

### Lever #3: Infrastructure Optimization ✅ PROVEN
**What:** Leverage CDN, caching, compression  
**Why:** Network is often the bottleneck  
**How:** Cloudflare Pages (already set up), cache headers, compression  
**Example:** Cloudflare edge caching - 10-30% faster delivery  
**Expected Impact:** 5-20% score improvement  
**Risk:** VERY LOW  
**Best For:** Improving all metrics with minimal code changes

### Lever #4: Code Quality ✅ SAFE
**What:** Efficient JavaScript, CSS, memory management  
**Why:** Reduces execution time and GC pauses  
**How:** Remove dead code, optimize selectors, avoid forced reflows  
**Example:** Animation GPU acceleration - Smooth 60fps  
**Expected Impact:** 2-5% score improvement  
**Risk:** LOW  
**Best For:** Improving CLS, INP, overall smoothness

---

## ❌ The Traps (Don't Fall Into These)

### Trap #1: Script Deferral ⚠️ DANGEROUS
**Pattern:** "This script runs during load, so defer it"  
**What Happens:** Race conditions, initialization failures, broken features  
**Production Result:** 89 → 52-61 (WORSE!) 😭  
**Why:** Code depends on things happening in order  
**Lesson:** Just because code runs during load doesn't mean it should be deferred  
**Alternative:** Use Tier 1 instead (server-side processing)

### Trap #2: Premature Lazy-Loading ⚠️ RISKY
**Pattern:** "Users won't need this until later, so lazy-load it"  
**What Happens:** UI glitches, interaction delays, poor UX  
**When to Use:** Only for truly optional features (ads, analytics)  
**When NOT to Use:** Critical features, UI systems, initialization code  
**Lesson:** Load critical code early, lazy-load only truly optional features  
**Alternative:** Use code splitting and async loading correctly

### Trap #3: Optimizing Before Measuring ⚠️ WASTES TIME
**Pattern:** "I think this might be slow, let me optimize it"  
**What Happens:** Wasted effort, possible regressions, frustration  
**Real Example:** Font hints optimization - Removed 69ms but only 2% impact  
**Why:** You're guessing instead of knowing  
**Lesson:** Always measure first, analyze, THEN optimize  
**Alternative:** Use Lighthouse JSON breakdown to identify real bottleneck

### Trap #4: Making Multiple Changes at Once ⚠️ UNDEBUGGABLE
**Pattern:** "I'll optimize all these things in one commit"  
**What Happens:** Can't tell which change helped/hurt  
**Real Example:** Commits c0488f9, 0845741 - multiple changes = unclear impact  
**Why:** When it breaks, you can't find the culprit  
**Lesson:** One change per commit, one test per change  
**Alternative:** Use feature branches for multi-step changes

### Trap #5: Trusting Local Testing Alone ⚠️ INSUFFICIENT
**Pattern:** "It's fast on my machine, ship it!"  
**What Happens:** Production performs differently due to:
- Network conditions (3G vs. 500Mbps CDN)
- Device capabilities (powerful CPU vs. entry-level mobile)
- Caching (Cloudflare edge vs. localhost)  
**Why:** Local ≠ Production in critical ways  
**Lesson:** Always test on production with real Lighthouse audit  
**Alternative:** Use enhanced audit script that tests both

---

## 📊 Current State & Targets

### Production (www.clodo.dev)
```
Current:     89/100  ✅ GOOD
Target:      92/100  (stretch: 95+)
Gap:         +3-6 points (achievable)
Risk:        VERY LOW (incremental improvements)
Effort:      2-3 hours
```

### Local (3G throttled)
```
Current:     74/100  ✅ EXPECTED
Gap to Prod: -15 points (NORMAL - network difference)
Baseline:    For regression detection
Use For:     Finding bugs before production
```

---

## 🚀 What to Do Next

### This Week (2-3 hours)
1. ✅ Analyze production Lighthouse JSON
2. ✅ Identify 2-3 low-risk optimization opportunities
3. ✅ Implement and test each separately
4. ✅ Document findings

**Expected Result:** 89 → 91-92 production

### Next Week (1 hour)
1. ✅ Set up performance budget (prevent regressions)
2. ✅ Add CI check for performance
3. ✅ Document baseline metrics

**Expected Result:** Safety net in place

### Ongoing (30 min/week)
1. ✅ Monitor with enhanced audit script
2. ✅ Review trends
3. ✅ Alert on regressions

**Expected Result:** Stable performance, early warning

---

## 🧪 Testing Performance

### Quick Local Test
```powershell
npm run build              # Build once
npm run lighthouse:audit   # Test local + production
```

### Full Analysis
1. Get reports from `lighthouse-results/`
2. Open HTML report in browser
3. Review JSON report for details:
   ```json
   categories.performance.score
   timing.FCP
   timing.LCP
   timing.TBT
   ```

### Comparing to Baseline
```powershell
# Baseline from November 30, 2025
# Production: 89/100
# Local:      74/100

# If production < 85: Investigation needed
# If production 85-89: OK, monitor trends
# If production ≥ 90: Excellent!
```

---

## 🎓 One-Liners to Remember

| Principle | Remember |
|-----------|----------|
| **Simple wins** | Commit 7628000 (server-side proxy) beat complex deferral attempts |
| **Measure first** | Lighthouse JSON is your friend - use it |
| **One change at a time** | You'll know what helped/hurt |
| **Test production** | Local ≠ production (network is different) |
| **Avoid deferral** | Unless it's truly optional (analytics, ads) |
| **Infrastructure first** | CDN, caching, compression before code changes |
| **Prevention > cure** | Performance budgets catch regressions early |
| **Document findings** | Future you will thank current you |

---

## 📚 See Also

- **Deep Dive:** `/docs/PERFORMANCE_LEARNING_FRAMEWORK.md`
- **Action Plan:** `/docs/PERFORMANCE_ACTION_PLAN.md`
- **Historical:** `/docs/PERFORMANCE_OPTIMIZATION_REPORT.md`
- **Font Optimization:** `/FONT_OPTIMIZATION_REPORT.md`

---

## 🚨 Emergency: Score Dropped!

```powershell
# 1. Run immediate audit
npm run lighthouse:audit

# 2. Check last commit
git log --oneline -5

# 3. If obvious culprit
git revert <commit-hash>
git push origin master

# 4. If unclear
git bisect start
git bisect bad HEAD
git bisect good 7628000  # Last known good
# Continue bisect to find culprit
```

---

**Last Updated:** November 30, 2025  
**Status:** Reference Guide for Daily Use  
**Questions?** See PERFORMANCE_LEARNING_FRAMEWORK.md
