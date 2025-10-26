# CSS Architecture and Design Language

This repo uses a lightweight, modular CSS architecture to keep styles consistent, maintainable, and fast.

## Goals
- Single source of truth for design tokens (colors, spacing, radii, typography)
- Clear separation of concerns: base, components, layout, page styles
- Small, incremental changes without introducing a framework
- Works with the existing build (no extra tooling required)

## File layout
- `public/styles.css`: Bundled global stylesheet (tokens + base + components + layout + common page bits)
- `public/css/base.css`: Tokens, resets, global element styles (reference; merged into styles.css)
- `public/css/components.css`: Reusable UI components (buttons, cards, badges, alerts, nav)
- `public/css/layout.css`: Grid, spacing utilities, responsive rules, shared sections (hero, footer)
- `public/css/pages/*.css`: Page-specific styles (e.g., `pages/index.css`, `pages/migrate.css`)

Note: The build copies/minifies everything under `public/` to `dist/`. You can safely link extra CSS files from HTML whenever you split page-specific styles.

## Design tokens
Tokens live as CSS variables in `:root` within `public/styles.css` and include:
- Colors: `--primary-color`, `--text-primary`, `--bg-secondary`, etc.
- Spacing: `--spacing-xs` .. `--spacing-3xl`
- Radius: `--radius-sm` .. `--radius-2xl`
- Shadows & transitions

Dark mode is supported via media query and the `[data-theme]` override.

## Naming and patterns
- BEM-inspired: `.block__element--modifier` for components
- Utilities are explicit: `.grid--cols-2`, `.margin-b-lg`, `.btn--primary`
- Page styles live under `public/css/pages/*.css` and are only linked by the relevant page

## How to add styles
1. If it’s global and reusable, add to `components.css` or `layout.css`
2. If it’s page-specific, create `public/css/pages/<page>.css` and link it from that page’s HTML
3. Prefer tokens over hard-coded values (e.g., `var(--spacing-lg)`)
4. Keep sections small and documented with comments

## Current changes
- Extracted migration page helpers into `public/css/pages/migrate.css`
- Kept site-wide components (announcement bar, callout variants) in `public/styles.css`

## Suggested next steps (optional)
- Create `public/css/utilities.css` for frequently used helpers, then include via `styles.css`
- Tighten lint rules (stylelint) to nudge token usage and disallow magic numbers for spacing/colors
- Document tokens in a quick reference under `docs/developer/TOKENS.md`
- Consider using CSS `@layer` to make cascade ordering clearer once browser support is sufficient for your audience

## Success criteria
- New pages ship with only a small page stylesheet and zero duplication
- Designers/engineers can find token values quickly and avoid color drift
- Linting passes and the build remains zero-config
