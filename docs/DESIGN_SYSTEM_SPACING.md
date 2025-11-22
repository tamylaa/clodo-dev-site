# Design System Spacing Guidelines

## Purpose
Establish a clear, professional vertical and horizontal spacing system that is:
- Predictable (same tiers across pages)
- Intentional (hierarchy mirrors content importance)
- Token-driven (no raw magic numbers in production CSS)
- Adaptive (responsive without jarring jumps)

## Core Scale (Existing Tokens)
| Token | Rem | Px | Primary Use |
|-------|-----|----|-------------|
| --spacing-xs | 0.25rem | 4px | Micro gaps (icon + label) |
| --spacing-sm | 0.5rem | 8px | Compact inline spacing |
| --spacing-md | 1rem | 16px | Base element spacing |
| --spacing-lg | 1.5rem | 24px | Grouping related elements |
| --spacing-xl | 2rem | 32px | Section internal content rhythm |
| --spacing-2xl | 3rem | 48px | Standard vertical section padding (default) |
| --spacing-3xl | 4rem | 64px | Only for hero / page transitions |

## Section Vertical Rhythm
| Layer | Recommended | Notes |
|-------|-------------|-------|
| Standard section | padding: var(--spacing-2xl) 0 | Most blocks (features, cards, lists) |
| Dense section | padding: var(--spacing-xl) 0 | Data-heavy or nested layouts |
| Relaxed section | padding: var(--spacing-3xl) 0 | Use sparingly (landing hero, major CTA) |
| Intra-section element gaps | <= var(--spacing-xl) | Avoid stacking multiple >= xl gaps |

## Horizontal Spacing
- Use container side padding tokens: var(--spacing-md) (mobile) → var(--spacing-lg) (tablet+) where possible.
- Avoid large horizontal padding paired with full-width backgrounds unless intentional.
- Prefer max-width wrappers for readability instead of excessive side padding.

## Rules of Thumb
1. Never apply raw values like `4rem` or `64px` directly—always via a token.
2. Limit usage of `--spacing-3xl` to < 10% of sections per page.
3. Do not stack two large vertical spacings back-to-back (e.g., section padding 3xl + element margin 3xl).
4. Component internal spacing should rarely exceed `--spacing-lg`.
5. Replace arbitrary multiples (e.g., `2.5rem`) with nearest token unless there's strong visual justification.

## Responsive Strategy
- Mobile (0–767px): Use one step smaller vertical padding where content density is high.
- Tablet (768–1199px): Promote to standard (`--spacing-2xl`).
- Large (1200px+): Only escalate if content breathes poorly; prefer maintaining `--spacing-2xl`.
- Avoid automatic escalation to `--spacing-3xl` on large screens—opt-in only.

## Anti-Patterns
| Anti-pattern | Why | Fix |
|--------------|-----|-----|
| `padding: 4rem 0` everywhere | Flattens hierarchy | Use `--spacing-2xl` and reserve 3xl for hero |
| Mixed raw + token values | Inconsistent maintenance | Normalize to tokens |
| Nested containers each with vertical padding | Exaggerated cumulative spacing | Only outer section owns vertical padding |
| Excessive gap + large padding | Visual drift / white void | Reduce gap, keep single vertical source |

## Migration Checklist
1. Search: `padding: 4rem` → replace with `var(--spacing-2xl)` or `var(--spacing-3xl)` if justified.
2. Search: `margin: 4rem` → reduce to `var(--spacing-2xl)` or remove if near padded section.
3. Ensure only sections (semantic wrappers) define vertical rhythm.
4. Audit largest spacing usage count per page; flag if > 3 occurrences.

## Optional Future Enhancements
- Introduce semantic aliases: `--space-section-y`, `--space-hero-y`, `--space-dense-y`.
- Add a build audit script to output counts of each spacing token.
- Visual regression tests measuring section bounding heights.
- Container queries to adjust spacing based on actual content width.

## Quick Reference Cheatsheet
- Hero: `--spacing-3xl` top/bottom (sparingly)
- Standard section: `--spacing-2xl` top/bottom
- Dense / inside card groups: `--spacing-xl`
- Element bottom margin (paragraphs, headings): up to `--spacing-lg` unless leading a major transition.

## Review Cadence
Revisit spacing usage quarterly; track drift and prune oversights.

---
Maintainer Notes: If a designer requests "more air", prefer micro-adjusting typography leading or introducing whitespace via alignment shifts before escalating vertical padding tier.
