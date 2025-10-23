# Hero Section - Visual Responsive Breakdown

## 🖥️ DESKTOP VIEW (≥1025px)

### Full Layout Diagram
```
╔════════════════════════════════════════════════════════════════════════╗
║                      BROWSER WINDOW (1400px+)                         ║
║ ┌──────────────────────────────────────────────────────────────────┐  ║
║ │ GRADIENT BACKGROUND (100vw height, animated)                    │  ║
║ │                                                                  │  ║
║ │  [16-32px padding]                                              │  ║
║ │  ┌──────────────────────────────────────────────────────────┐  │  ║
║ │  │ MAX-WIDTH: 1400px (content container)                   │  │  ║
║ │  │                                                          │  │  ║
║ │  │  ┌───────────────────┐    gap (32-96px)   ┌──────────┐ │  │  ║
║ │  │  │  HERO CONTENT     │                     │  CODE   │ │  │  ║
║ │  │  │  (1.1fr = 55%)    │◄─────────────────►  │ PREVIEW │ │  │  ║
║ │  │  │                   │                     │(0.9fr)  │ │  │  ║
║ │  │  │  Title: 40-64px   │                     │(45%)    │ │  │  ║
║ │  │  │  (clamp 5vw)      │                     │         │ │  │  ║
║ │  │  │                   │                     │  Max W: │ │  │  ║
║ │  │  │  Subtitle: 18-24px│                     │ 300-450 │ │  │  ║
║ │  │  │  (clamp 2.5vw)    │                     │   px    │ │  │  ║
║ │  │  │                   │                     │  3D     │ │  │  ║
║ │  │  │  [Buttons]        │                     │ Tilt    │ │  │  ║
║ │  │  │  Horizontal flex  │                     │(hover)  │ │  │  ║
║ │  │  │                   │                     │         │ │  │  ║
║ │  │  └───────────────────┘                     └─────────┘ │  │  ║
║ │  │                                                         │  │  ║
║ │  │  min-height: 500px                                     │  │  ║
║ │  │  padding: 80-120px (top), 40-80px (bottom)             │  │  ║
║ │  └──────────────────────────────────────────────────────────┘  │  ║
║ │                                                                  │  ║
║ └──────────────────────────────────────────────────────────────────┘  ║
╚════════════════════════════════════════════════════════════════════════╝

HERO SECTION HEIGHT: ~580-680px (including padding)
CONTENT WIDTH: Max 600px (naturally constrained)
CODE PREVIEW WIDTH: 300-450px (depends on viewport width at clamp point)
```

### Desktop Sizing Calculation Example (1920px screen)

```
Available width: 1920px
- Margins/window: ±32px = 1856px
- Content padding: ±32px = 1792px

1400px container (max-width applied):
- Horizontal padding: 32px each = 1336px content
- Grid columns: 1.1fr (735px) + 0.9fr (601px)

Layout:
┌─────────────┬─────────────────────┬──────────────┐
│ Padding     │ Content (735px)     │  Gap (96px) │ Code (601px) │ Padding │
│  32px       │ [clamped to 600px]  │              │ (clamped)    │ 32px    │
└─────────────┴─────────────────────┴──────────────┘
              (unused: 135px)              (unused: ~151px)
```

---

## 📱 TABLET VIEW (769px - 1024px)

### Full Layout Diagram
```
╔══════════════════════════════════════════╗
║     BROWSER WINDOW (iPad: 768px)        ║
║ ┌──────────────────────────────────────┐ ║
║ │ GRADIENT BACKGROUND (100vw height)  │ ║
║ │                                      │ ║
║ │  [padding 12-16px]                  │ ║
║ │  ┌────────────────────────────────┐ │ ║
║ │  │ CENTER ALIGNED CONTENT         │ │ ║
║ │  │ MAX-WIDTH: 800px (centered)    │ │ ║
║ │  │                                │ │ ║
║ │  │    Title: 36-52px (6vw)        │ │ ║
║ │  │    (centered)                  │ │ ║
║ │  │                                │ │ ║
║ │  │    Subtitle: 15-20px (2.5vw)   │ │ ║
║ │  │    (centered, lighter)         │ │ ║
║ │  │                                │ │ ║
║ │  │    ┌──────────────────────┐    │ │ ║
║ │  │    │ CODE PREVIEW         │    │ ║
║ │  │    │ Max-width: 500px     │    │ ║
║ │  │    │ (centered)           │    │ ║
║ │  │    │ NO 3D EFFECT         │    │ ║
║ │  │    │                      │    │ ║
║ │  │    └──────────────────────┘    │ │ ║
║ │  │                                │ │ ║
║ │  │ [Button 1]  [Button 2]         │ │ ║
║ │  │ (row, centered)                │ │ ║
║ │  │                                │ │ ║
║ │  └────────────────────────────────┘ │ ║
║ │                                      │ ║
║ └──────────────────────────────────────┘ ║
╚══════════════════════════════════════════╝

GRID: Single column (1fr)
TEXT ALIGN: center
LAYOUT: Vertical stack, centered
GAP: 3rem (48px) between sections
PADDING: 60-100px (top), 30-60px (bottom)
```

### Tablet Sizing Calculation Example (768px screen)

```
Available width: 768px
- Content padding: ±12-24px = 720-744px

Max-width container: 800px (would exceed, so container width = 720px)

Layout:
┌──────────────────────────────────────────┐
│  CENTERED CONTENT (720px)                │
├──────────────────────────────────────────┤
│           HERO TITLE (centered)          │
│           (font: 36-52px)                │
│                                          │
│        HERO SUBTITLE (centered)          │
│        (font: 15-20px)                   │
│                                          │
│    ┌──────────────────────────────┐     │
│    │ CODE PREVIEW (500px max)     │     │
│    │    (centered, no 3D)         │     │
│    └──────────────────────────────┘     │
│                                          │
│   [BUTTON 1]       [BUTTON 2]           │
│   (flex row)                            │
└──────────────────────────────────────────┘

Single column layout, everything centered vertically
Gap between title → subtitle: 1rem
Gap between subtitle → code: 2.5rem
Gap between buttons: 1rem
```

---

## 📱 MOBILE VIEW (≤480px)

### Full Layout Diagram
```
╔══════════════════════════╗
║  PHONE VIEW (375-480px)  ║
║ ┌────────────────────────┐║
║ │ GRADIENT BACKGROUND    ││
║ │ (100vw)                ││
║ │                        ││
║ │[4-8px pad]             ││
║ │┌──────────────────────┐││
║ ││ CONTENT (stacked)    │││
║ ││                      │││
║ ││  Title: 28-36px      │││
║ ││  (8vw scaling)       │││
║ ││                      │││
║ ││  Subtitle: 13.6-16px │││
║ ││  (4vw, tight line)   │││
║ ││                      │││
║ ││ ┌──────────────────┐ ││
║ ││ │CODE PREVIEW      │ ││
║ ││ │ FULL WIDTH       │ ││
║ ││ │ (no 3D)          │ ││
║ ││ │ NO OVERFLOW      │ ││
║ ││ └──────────────────┘ ││
║ ││                      │││
║ ││ ┌──────────────────┐ ││
║ ││ │[GET STARTED BTN] │ ││
║ ││ └──────────────────┘ ││
║ ││ ┌──────────────────┐ ││
║ ││ │[VIEW EXAMPLES]   │ ││
║ ││ └──────────────────┘ ││
║ ││                      │││
║ │└──────────────────────┘││
║ │                        ││
║ └────────────────────────┘║
╚══════════════════════════╝

GRID: Single column (1fr)
TEXT ALIGN: center
LAYOUT: Vertical stack, stacked buttons
BUTTON DIRECTION: column (not row!)
GAP: 0.75rem tight spacing
PADDING: 40-80px (top), 20-40px (bottom)
```

### Mobile Sizing Calculation Example (375px screen)

```
Available width: 375px
- Content padding: ±6-8px = 359-363px

Layout:
┌─────────────────────────────────┐
│   CENTERED MOBILE CONTENT       │
├─────────────────────────────────┤
│     TITLE (28-36px)             │
│     (line-height: 1.1)          │
│                                 │
│  SUBTITLE (13.6-16px)           │
│  (line-height: 1.6 tighter)     │
│                                 │
│ ┌─────────────────────────────┐ │
│ │  CODE PREVIEW (full width)  │ │
│ │  (no overflow)              │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │    [GET STARTED] (full)     │ │
│ │   (max-width: 320px)        │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │    [VIEW EXAMPLES] (full)   │ │
│ │   (max-width: 320px)        │ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘

Buttons: flex-direction column, full width
Button max-width: 320px (centered)
Gap between buttons: 0.75rem (12px)
Text centered
```

---

## 🎯 Key Dimension Reference

### Font Sizing (clamp values)
```
DESKTOP  TABLET        MOBILE
Title:
40-64px  36-52px       28-36px
(5vw)    (6vw)         (8vw)

Subtitle:
18-24px  15-20px       13.6-16px
(2.5vw)  (2.5vw)       (4vw)

Small text:
14-18px  14-18px       12-16px
(regular sizes)
```

### Spacing (clamp values)
```
                    Desktop         Tablet          Mobile
Section Padding:    80-120px (T)    60-100px (T)    40-80px (T)
                    40-80px (B)     30-60px (B)     20-40px (B)

Horizontal Padding: 16-32px         12-24px         6-8px
Gap (H/V):          32-96px (flex)  48px (fixed)    32px (fixed)
Button Gap:         24-32px         16px            12px
```

### Container Widths
```
Desktop:    max-width: 1400px
Tablet:     max-width: 800px
Mobile:     100% - padding (full width)
```

---

## 🔴 UNFINISHED ISSUE DETAIL

### Problem: Hero Section Visual Imbalance at Ultra-Wide Desktops

**Current State** (at 1920px width):
```
┌──────────────────────────────────────────────────────────────┐
│ Padding: 32px                                               │
│                                                              │
│ Content Area: 1336px                                        │
│ ├─ Left Column (1.1fr): 735px ──► CLAMPED TO 600px        │
│ │                      Unused: 135px (white space!)        │
│ ├─ Gap: 96px                                               │
│ └─ Right Column (0.9fr): 601px ──► CLAMPED TO 450px       │
│                       Unused: 151px (white space!)         │
│                                                              │
│ Padding: 32px                                               │
└──────────────────────────────────────────────────────────────┘
    VISUAL RESULT: Content cramped left, code cramped right
    SPACING: Very wide gap in the middle
    BALANCE: Asymmetrical and unpleasing
```

**Why This Happens**:
- Grid ratio `1.1fr 0.9fr` designed for ~900-1000px width
- At 1400px+ container, columns get too large
- Max-widths on content/code don't fill allocated space
- Large dynamic gap (clamp reaching 96px) pushes things apart

**Visual Impact**:
- ✅ Content is readable (600px max works well)
- ✅ Code preview doesn't overflow (450px max works well)
- ❌ Lots of unused horizontal space
- ❌ Gap too wide, creates disconnection
- ❌ Hero section feels "floating" rather than balanced

---

## 📊 CSS Properties Summary

| Component | Property | Value | Calculation |
|-----------|----------|-------|-------------|
| #hero | padding (vertical) | clamp(80px, 15vh, 120px) | Min:80px, Max:120px, Scales with viewport |
| #hero | padding (horizontal) | clamp(1rem, 4vw, 2rem) | Min:16px, Max:32px, Scales with viewport |
| .hero-container | display | grid | Two/one column layout |
| .hero-container | grid-template-columns | 1.1fr 0.9fr (desktop) | 55% / 45% split |
| .hero-container | grid-template-columns | 1fr (tablet/mobile) | Single column |
| .hero-container | gap | clamp(2rem, 8vw, 6rem) | Min:32px, Max:96px |
| .hero-container | max-width | 1400px | Container limit |
| .hero-container | min-height | 500px (desktop) | Minimum hero height |
| .hero-container | min-height | auto (tablet/mobile) | Natural height |
| .hero-content | max-width | 600px | Content width limit |
| .hero-title | font-size | clamp(2.5rem, 5vw, 4rem) | Min:40px, Max:64px |
| .hero-subtitle | font-size | clamp(1.125rem, 2.5vw, 1.5rem) | Min:18px, Max:24px |
| .code-preview | max-width | clamp(300px, 40vw, 450px) | Min:300px, Max:450px |
| .btn | max-width | 320px (mobile) | Prevents oversizing |

