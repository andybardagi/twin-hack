# Architecture

## Overview

pnpm workspace + Turborepo monorepo. Two workspace groups (`pnpm-workspace.yaml`):

```
apps/
  web                      → Next.js 16 app (App Router, React 19)
  storybook                → @workspace/storybook — Storybook docs/preview for @workspace/ui (Vite builder)
packages/
  ui                       → @workspace/ui — shared component library (shadcn-style, Base UI, Tailwind v4)
  typescript-config        → @workspace/typescript-config — shared tsconfig presets
```

## Dependency direction

```
apps/web ────────► @workspace/ui ──► @base-ui/react, cva, tailwind-merge
apps/storybook ──►      │
    │                   │
    └───────────────────┴──► @workspace/typescript-config (dev-only)
```

- Apps depend on packages. **Packages never import from apps.**
- `@workspace/ui` has no dependency on other workspace packages except the tsconfig preset.
- Cross-package imports go through the `exports` map of `@workspace/ui` (`./components/*`, `./hooks/*`, `./lib/*`, `./globals.css`, `./postcss.config`) — never deep-import via relative paths across packages.

## apps/web layout

```
app/          → routes (App Router: layout.tsx, page.tsx) — thin: pages/layouts only, no business logic
components/   → app-specific components grouped by feature/surface (e.g. theme-provider.tsx, query-provider.tsx)
hooks/        → app-specific hooks
lib/          → app-specific utilities
src/helpers/  → shared helper functions/schemas used by multiple frontend components or by both frontend and backend
tests/        → all *.test.ts / *.test.tsx files, mirroring the app/lib/src tree (see Testing layout below)
```

Path alias `@/*` resolves to the app root (see `apps/web/tsconfig.json`).

Keep `app/` route segments thin. Do not place route-private UI in `app/**/_components`, and do not place shared helper code in
`app/**/_lib`. App-specific UI belongs under `apps/web/components/<area>/`; shared helper-like code belongs under
`apps/web/src/helpers/`.

`QueryProvider` (TanStack Query) lives next to `ThemeProvider` under `apps/web/components/`.

Backend layout (API framework, DB, migrations) is undecided — see pending items in `feature_list.json`.

### apps/web testing layout

All test files live under `apps/web/tests/`, mirroring the `app/`, `lib/`, and `src/` tree 1:1 — no `.test.ts`/`.test.tsx` files colocated next
to source. Example: `apps/web/src/helpers/generate-id.ts` is tested at `apps/web/tests/src/helpers/generate-id.test.ts`.
When a test runner is added (the first feature that needs tests must add Vitest), `*.integration.test.ts` files live in the same
mirrored location as their unit-test counterparts, distinguished by the `.integration.test.ts` suffix.

## apps/storybook layout

```
.storybook/   → main.ts (framework, Vite/Tailwind config), preview.ts (globals.css import, dark-mode decorator)
stories/      → *.stories.tsx, one per @workspace/ui component, imported via @workspace/ui/components/*
```

Every component in `packages/ui/src/components/` must have a matching story here (see `docs/conventions.md`).

## packages/ui layout

```
src/components/   → shared components (one file per component, e.g. button.tsx)
src/hooks/        → shared hooks
src/lib/          → shared utilities (utils.ts exports cn())
src/styles/       → globals.css (Tailwind v4 theme, design tokens)
```

## Component placement rule

- Reusable across apps or design-system material → `packages/ui/src/components/`.
- Specific to one app (wiring, providers, page sections) → `apps/web/components/`.
- Group app components by domain/surface inside `apps/web/components/` (`auth/`, `workspace/`, `landing/`, ...), not in `app/**/_components`.
- When in doubt, start app-local; promote to `@workspace/ui` only when a second consumer appears.

## Helper placement rule

- Shared helper functions, schemas, and small pure utilities used by multiple app components or by both frontend and backend →
  `apps/web/src/helpers/`.
- Persistence-backed, framework, service, adapter, database, and route-handler code stays in `apps/web/lib/` once a backend is chosen
  (see pending items in `feature_list.json`).
- Do not add `app/**/_lib` folders for shared helper code.

## Styling & theming

- Tailwind CSS v4 via `@tailwindcss/postcss`. No `tailwind.config.js` — theme lives in `packages/ui/src/styles/globals.css` (imported once in `apps/web/app/layout.tsx` as `@workspace/ui/globals.css`).
- Design tokens are CSS variables (`--primary`, `--muted`, `--radius-*`, …); components reference them through Tailwind utilities (`bg-primary`, etc.).
- Dark mode via `next-themes` (`ThemeProvider` in `apps/web/components/theme-provider.tsx`, `suppressHydrationWarning` on `<html>`).
- Visual rules live in `docs/design-style.md`. Keep the default shadcn neutral (black-and-white) theme.

## Build orchestration

Turborepo (`turbo.json`): `build` and `typecheck` fan out per package with `^build`/`^typecheck` dependencies; `lint`/`format` are root-level tasks (`//#lint`, `//#format`, aggregated as `//#quality`).

`storybook` (persistent, uncached) and `build-storybook` (cacheable, outputs `storybook-static/**`) are separate task keys scoped to `apps/storybook` — deliberately **not** part of the `build` task, so `pnpm build`/the `pnpm lint && pnpm typecheck && pnpm build` verification bar does not cover Storybook's own build. Only `typecheck`/`lint` reach `apps/storybook`; run `pnpm build-storybook` explicitly to verify the Storybook build itself.

## Next.js caveat

This is Next.js 16 — newer than most training data. Before writing routing, caching, or data-fetching code, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices.
