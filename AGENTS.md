# ÁrMűhely Project Guide

## Overview

ÁrMűhely is a Hungarian-language financial planning application for beauty and salon businesses. It turns a previously standalone HTML calculator into a responsive TanStack Start application with five connected calculation modes.

## Architecture

- `src/routes/__root.tsx` defines the Hungarian document shell and SEO metadata.
- `src/routes/index.tsx` renders the single-page calculator experience.
- `src/components/Calculator.tsx` contains the domain types, calculation formulas, application state, reusable form components, and all five calculator views.
- `src/styles.css` contains the full responsive visual system, component styling, animations, and accessibility preferences.
- `netlify.toml` and `vite.config.ts` configure TanStack Start for Netlify deployment.

## Calculation Model

- Recurring costs are normalized to annual values using monthly, quarterly, half-yearly, or yearly multipliers.
- Work capacity is calculated from annual workdays minus vacation and education days, multiplied by daily working hours.
- Renovation and equipment purchases are annualized over their selected replacement cycles.
- Team salon costs flow automatically into the owner and employee calculators unless manually overridden.
- The pricing planner applies the measured cost-change percentage to a current service price.
- The price list converts a selected hourly rate (solo, owner, or a named coworker) times service duration, then adds per-service material cost.

## Coding Conventions

- Keep all user-facing copy in Hungarian.
- Use strict TypeScript types and descriptive names; avoid `any`.
- Keep calculation logic pure and derived with `useMemo` rather than duplicating computed values in state.
- Reuse `NumberField`, `MetricCard`, `Panel`, and `CostEditor` for consistent behavior.
- Add visual tokens to `:root` before introducing one-off colors.
- Preserve keyboard focus states, semantic labels, reduced-motion support, and mobile layouts.
- Use Lucide icons rather than emoji or text symbols for interface actions.

## Non-Obvious Decisions

- Calculator values persist in the browser with `localStorage`. There are no user accounts, and data never leaves the device.
- “Alaphelyzet” still clears only the current tab; the saved browser copy updates with that reset.
- “Eredmény másolása” copies a concise summary to the clipboard instead of implying a server save.
- The default view is empty (zeros and dashes) and remains fully editable.
- External font loading is limited to the two families imported at the top of `src/styles.css`.

## Local Development

Use `pnpm install` after cloning, then `pnpm dev` for local development. Production validation runs through the Netlify build pipeline with `pnpm build`.
