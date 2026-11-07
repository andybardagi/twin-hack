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
lib/          → app-specific infrastructure and services
  db/         → client.ts (lazy Drizzle/pg client), schema.ts (tables), migrations/ (generated SQL and metadata)
src/helpers/  → shared helper functions/schemas used by multiple frontend components or by both frontend and backend
tests/        → all *.test.ts / *.test.tsx files, mirroring the app/lib/src tree (see Testing layout below)
```

Path alias `@/*` resolves to the app root (see `apps/web/tsconfig.json`).

Keep `app/` route segments thin. Do not place route-private UI in `app/**/_components`, and do not place shared helper code in
`app/**/_lib`. App-specific UI belongs under `apps/web/components/<area>/`; shared helper-like code belongs under
`apps/web/src/helpers/`.

`QueryProvider` (TanStack Query) lives next to `ThemeProvider` under `apps/web/components/`.

### Database

Postgres is the database. Drizzle ORM uses the `pg` driver; drizzle-kit generates and applies SQL migrations.
Persistence stays app-local under `apps/web/lib/db/` until a second consumer appears. `apps/web/drizzle.config.ts`
reads `lib/db/schema.ts` and writes generated SQL and metadata to `lib/db/migrations/`. Auth tables and the initial migration are defined. Commit generated migrations alongside schema changes.

Server code imports `getDb` from `@/lib/db/client`. Importing the module does not read `DATABASE_URL` or create a
pool. The first `getDb()` call requires `DATABASE_URL` and caches a Drizzle client backed by a `pg.Pool` for that
module instance; the pool opens connections on demand when queried. Keep this module out of Client Components
and call `getDb()` at runtime, not at module scope or during prerendering. Building the app requires no database.

The root `docker-compose.yml` runs Postgres 17 with a healthcheck, a named data volume, and port 5432 bound to
localhost on host port 5433 to avoid conflicting with a database already using 5432. The connection URL and
migration commands are documented in `docs/conventions.md`.

Primary keys use UUIDv7 generated in app code before insert, with no database default on ID columns. Better-auth's
ID generator uses `uuid`'s `v7()` for all auth records.

### Authentication

- `lib/auth.ts` lazily creates better-auth with the Drizzle adapter, anonymous SIWE plugin, and Next.js cookies
  integration. Environment validation and database initialization happen at runtime; builds need no env variables.
- `app/api/auth/[...all]/route.ts` mounts better-auth's GET/POST handlers directly. The general backend API framework
  remains undecided (feature 003 is pending); authentication does not select Elysia or add product endpoints.
- `lib/db/schema.ts` defines better-auth's user, session, account, verification, and wallet_address tables. Sessions
  retain the better-auth default lifetime. SIWE requests use Arbitrum's chain ID (42161). EOA signatures verify locally
  with viem; whenever local verification fails, including invalid regular-wallet signatures, `ARBITRUM_RPC_URL`
  is consulted to support ERC-1271/6492 smart wallets. Unauthenticated requests can trigger this fallback. Valid
  regular-wallet logins need no RPC. No ENS lookup.
- `lib/auth-client.ts` holds the SIWE-enabled client. `lib/wagmi.ts` configures wagmi 3 for EIP-6963 wallet discovery;
  `components/auth/` contains wallet sign-in, its provider, and sign out. No WalletConnect, wallet dialog, or network
  switch is needed for login. TanStack Query mutations handle pending/error states and navigation after success.
- `/sign-in` redirects existing sessions home; `/` uses `getAuth().api.getSession` with `await headers()` in the page
  and redirects logged-out requests to `/sign-in`. No proxy is used. `lib/wallet-address.ts` fetches at most one primary
  wallet row using only the session user's ID. Missing addresses show a sign-out/retry message. Sign out invalidates
  the server session before navigating to `/sign-in`.
- Contract calls and wallet views are deferred to a later PR.

### apps/web testing layout

All test files live under `apps/web/tests/`, mirroring the `app/`, `lib/`, and `src/` tree 1:1 — no `.test.ts`/`.test.tsx` files colocated next
to source. Example: `apps/web/src/helpers/generate-id.ts` is tested at `apps/web/tests/src/helpers/generate-id.test.ts`.
Vitest is configured in `apps/web/vitest.config.ts`. `*.integration.test.ts` files live in the same mirrored location
as unit tests and use real Postgres. Run `pnpm test` after migrations; no integration tests are silently skipped.

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
- Persistence-backed, framework, service, adapter, database, and route-handler code stays in `apps/web/lib/`.
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
