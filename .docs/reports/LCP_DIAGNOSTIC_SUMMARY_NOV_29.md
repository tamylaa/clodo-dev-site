# 📉 LCP Diagnostic Summary & Experiment Log
**Date:** November 29, 2025
**Current LCP:** 3.5s (Target: <2.5s)
**Status:** ⚠️ Needs Improvement

## 1. Executive Summary
We have spent the session diagnosing a persistent LCP (Largest Contentful Paint) issue. Despite previous optimization attempts (inlining CSS, using system fonts), the LCP remains at **3.5s**. 

**The Core Bottleneck:**
The Lighthouse report reveals a **Render Delay of 3,060ms**. 
*   **What this means:** The browser receives the HTML quickly (TTFB is low), parses it, and builds the DOM. However, it **refuses to paint the text** on the screen for 3 full seconds.
*   **Why:** It is waiting for a resource it considers "critical" to finish loading. This is almost certainly the main `styles.css` file or a font file, despite our attempts to make them asynchronous.

---

## 2. Experiment Log & Findings

| Experiment / Action | Finding | Impact |
| :--- | :--- | :--- |
| **1. Lighthouse Audit** | LCP is 3.5s. LCP Element is `<h1 id="hero-title">`. | Confirmed we are failing the Core Web Vital. |
| **2. Metric Breakdown** | **TTFB:** 450ms (Good)<br>**Load Delay:** 0ms (Excellent)<br>**Render Delay:** 3060ms (CRITICAL FAILURE)<br>**Render Time:** ~0ms | Proved the issue is NOT server speed or HTML size. It is purely a **resource blocking** issue. |
| **3. `build.js` Review** | The script inlines `dist/critical.css` and injects the Hero HTML. | Confirmed the *mechanism* for optimization exists, but the *content* might be the issue. |
| **4. `critical.css` Inspection** | The file is quite large for "critical" CSS. It contains full color palettes, resets, and navbar styles. | **Hypothesis:** The "critical" CSS is too generic. It might be missing specific styles for the Hero H1, causing a layout shift or wait. |
| **5. `index.html` Inspection** | Contains `<link rel="preload" href="styles.css" ...>`. | The "preload" pattern is used, but if the browser decides the inline styles aren't enough to paint the H1, it will wait for this file anyway. |

---

## 3. Architecture & Bottleneck Analysis

### The Architecture
*   **Build System:** Custom Node.js script (`build/build.js`).
*   **Templating:** String replacement (`<!-- HERO_PLACEHOLDER -->`).
*   **CSS Strategy:** 
    *   `critical.css` (Inlined in `<head>`)
    *   `styles.css` (Preloaded/Async)

### The Bottleneck Points
1.  **The "Async" Illusion:** We are using `<link rel="preload" as="style" onload="this.rel='stylesheet'">`. While this is a standard pattern, if the `critical.css` doesn't fully style the LCP element (the H1), the browser might block rendering until `styles.css` loads to avoid a Flash of Unstyled Content (FOUC).
2.  **Render Delay:** The 3s delay matches the timeout for font downloading or a slow stylesheet fetch on a throttled network. Since we switched to System Fonts, the culprit is likely the stylesheet.

---

## 4. Why We Are Digressing
We have been "admiring the problem"—running audits and reading files—without changing the code that controls the behavior. We have confirmed the diagnosis (Render Delay) multiple times. Further analysis will not yield new data.

**We need to stop analyzing and start coding.**

---

## 5. The Corrective Plan (Next Steps)

To break the 3s Render Delay, we must ensure the browser has **zero reason** to wait for `styles.css`.

1.  **Create `hero-critical.css`:** A tiny, hand-crafted CSS file containing *only* the styles for the Hero H1, P, and Button. No resets, no variables, just raw CSS.
2.  **Update `build.js`:** Modify the build script to inline this specific `hero-critical.css` *in addition to* or *instead of* the generic `critical.css`.
3.  **Force Async:** Move the `styles.css` link to the bottom of the `<body>` or use a more aggressive deferral strategy to prove it's not blocking.

**Recommendation:** Proceed immediately to **Step 1: Create `hero-critical.css`**.
