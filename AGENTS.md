# Project Overview

## Tech Stack

pnpm workspace + Turborepo. Next.js 16 (App Router) + React 19 in `apps/web`; shared component library `@workspace/ui` (Base UI + cva + Tailwind CSS v4) in `packages/ui`. TypeScript (ESM) everywhere. Lint/format with oxlint/oxfmt.

### This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Build, Test & Verify

From the repo root:

- `pnpm lint` / `pnpm lint:fix` — oxlint
- `pnpm format` (check) / `pnpm format:fix` — oxfmt
- `pnpm typecheck` — tsc per package via turbo
- `pnpm build` — turbo build (Next.js)
- `pnpm knip` — unused files, exports, and dependencies
- `pnpm dev` — dev servers

A change is done only when `pnpm lint && pnpm typecheck && pnpm build` passes. No test runner is configured yet — the first feature needing tests adds Vitest as part of its scope.

## Code Style

See `docs/conventions.md`. Highlights: kebab-case filenames, named exports, TypeScript ESM, no ESLint/Prettier configs. App route files stay thin: use `apps/web/components/<area>/` for app-specific components, `apps/web/src/helpers/` for shared helpers/schemas, and do not add `app/**/_components` or `app/**/_lib`.

## UI Style

See `docs/design-style.md`. Highlights: Base UI primitives + cva variants + `cn()` for components, Tailwind design-token utilities only (no hard-coded colors), default shadcn neutral (black-and-white) theme.

## Architecture

See `docs/architecture.md`. Dependency direction: `apps/web` → `packages/ui` and `packages/payments` → external; packages never import from apps. Cross-package imports only through each package's `exports` map.

## Repo Structure

/apps/web -> Next.js application
/apps/storybook -> @workspace/storybook, Storybook docs/preview for @workspace/ui components
/packages/ui -> @workspace/ui shared component library
/packages/payments -> @workspace/payments PaymentRouter SDK (viem) used by the web relayer
/packages/typescript-config -> shared tsconfig presets
/docs/architecture.md -> architecture and placement rules
/docs/conventions.md -> code conventions
/docs/design-style.md -> visual / UI style guidance
/docs/PRDs -> Contains the PRDs for the project
