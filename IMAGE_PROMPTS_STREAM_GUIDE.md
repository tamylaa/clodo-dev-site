# Cloudflare Stream Guide — Image Prompts & Specifications

## Overview
This document defines all images needed for the Cloudflare Stream Complete Guide page,
including detailed prompts for AI/manual image creation and placeholder generation specs.

---

## 1. Hero / Open Graph Image
**Filename:** `hero-cloudflare-stream-guide-1200x630.png`
**Purpose:** Open Graph social preview + hero section background
**Sizes:** 1200×630 (standard), 2400×1260 (retina), + WebP variants

**Prompt:**
> A professional, modern tech illustration showing a video streaming pipeline.
> Left side: a camera/upload icon emitting video frames. Center: Cloudflare's orange
> cloud logo with processing gears inside. Right side: multiple device screens
> (phone, tablet, laptop) displaying video playback with play buttons.
> Dark gradient background (#0f172a → #312e81). Purple accent highlights (#7c3aed).
> Clean flat design style, no text. Subtle grid pattern overlay. 16:9 aspect ratio.

---

## 2. Architecture — Stream Pipeline Diagram
**Filename:** `architecture-cloudflare-stream-pipeline.svg` (also PNG variants)
**Purpose:** Shows the end-to-end video processing pipeline
**Sizes:** 1200×675 (chart), 2400×1350 (retina), + WebP variants

**Prompt:**
> A clean technical architecture diagram showing the Cloudflare Stream video pipeline.
> Flow: Upload (camera icon) → Ingest API → Encoding Engine (H.264/AV1 boxes) →
> Global CDN (world map with edge nodes) → Adaptive Bitrate Player → End Users (devices).
> Each stage connected by directional arrows with data flow labels (e.g., "Raw MP4",
> "HLS/DASH", "ABR chunks"). Purple (#7c3aed) accent color for Cloudflare stages.
> White background, dark text (#1e293b), clean sans-serif font.
> Professional engineering diagram style. Horizontal left-to-right flow.

---

## 3. Comparison — Codec Bandwidth Chart
**Filename:** `comparison-codec-bandwidth-1200x675.png`
**Purpose:** H.264 vs AV1 vs VP9 bandwidth comparison bar chart
**Sizes:** 1200×675 (standard), 2400×1350 (retina), + WebP variants

**Prompt:**
> A clean horizontal bar chart comparing video codec bandwidth efficiency.
> Three codec groups: H.264 (blue bar), VP9 (green bar), AV1 (purple bar).
> Metrics shown per codec: bitrate at 1080p, 4K bitrate, compression efficiency %.
> AV1 shows ~30% better compression than H.264. VP9 is in between.
> Dark background (#0d1117) with light gridlines. Color-coded legend.
> Title: "Codec Bandwidth Efficiency Comparison". Subtitle: "Bitrate at equivalent quality"
> Modern data visualization style with rounded bar ends.

---

## 4. Chart — Pricing Comparison
**Filename:** `chart-pricing-comparison-1200x675.png`
**Purpose:** Stream vs Mux vs Bunny vs AWS MediaConvert pricing comparison
**Sizes:** 1200×675 (standard), 2400×1350 (retina), + WebP variants

**Prompt:**
> A pricing comparison chart showing video platform costs at different usage tiers.
> X-axis: Monthly minutes (1K, 10K, 100K, 1M). Y-axis: Monthly cost ($).
> Four lines/bars: Cloudflare Stream (purple #7c3aed), Mux (blue #3b82f6),
> Bunny Stream (orange #f59e0b), AWS MediaConvert (green #10b981).
> Cloudflare Stream is competitive at all tiers with simple flat pricing.
> AWS is cheapest at low volume but complex. Mux is premium pricing.
> Clean white background, grid lines, professional chart style.
> Legend at top-right. Title: "Video Platform Monthly Cost Comparison"

---

## 5. Architecture — Stream Integration
**Filename:** `architecture-stream-integration-1200x675.png`
**Purpose:** Shows how Stream integrates with other Cloudflare products
**Sizes:** 1200×675 (standard), 2400×1350 (retina), + WebP variants

**Prompt:**
> A hub-and-spoke architecture diagram with Cloudflare Stream at the center (purple circle).
> Connected spokes/boxes: Workers (orange), R2 Storage (blue), Access/Zero Trust (green),
> Pages (cyan), KV/D1 (yellow), Analytics (red). Each connection shows integration type:
> "Signed URLs", "Origin Storage", "Auth Middleware", "Embed Player", "Metadata", "Metrics".
> Clean modern style with rounded rectangles and subtle shadows.
> White/light gray background. Clear labels. Professional tech diagram aesthetic.

---

## 6. Architecture — Clodo + Stream Full-Stack
**Filename:** `architecture-clodo-stream-fullstack-1200x675.png`
**Purpose:** Full-stack architecture showing Clodo Framework with Stream integration
**Sizes:** 1200×675 (standard), 2400×1350 (retina), + WebP variants

**Prompt:**
> A three-tier full-stack architecture diagram for the Clodo Framework with Cloudflare Stream.
> Top tier "Frontend": Clodo Pages + Stream Player embed (cyan background box).
> Middle tier "API Layer": Clodo Workers + Stream API + Webhook handlers (purple background).
> Bottom tier "Data/Storage": R2 (video files) + D1/KV (metadata) + Stream (processing).
> Vertical arrows between tiers labeled: "Player SDK", "REST API", "Storage API".
> Side callout: "Developer Experience" with CLI commands (clodo generate, clodo deploy).
> Professional layered architecture style. Purple (#7c3aed) primary accent.
> White background, subtle shadows, clean sans-serif typography.

---

## Image Generation Matrix

| Image | Base Size | Retina Size | Formats |
|-------|-----------|-------------|---------|
| hero-cloudflare-stream-guide | 1200×630 | 2400×1260 | PNG, WebP |
| architecture-cloudflare-stream-pipeline | 1200×675 | 2400×1350 | SVG, PNG, WebP |
| comparison-codec-bandwidth | 1200×675 | 2400×1350 | PNG, WebP |
| chart-pricing-comparison | 1200×675 | 2400×1350 | PNG, WebP |
| architecture-stream-integration | 1200×675 | 2400×1350 | PNG, WebP |
| architecture-clodo-stream-fullstack | 1200×675 | 2400×1350 | PNG, WebP |

**Total: 6 base images → 24 optimized variants (6 × 4: PNG + WebP × 2 sizes)**
