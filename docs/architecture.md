# Architecture

## Overview

pnpm workspace + Turborepo monorepo. Two workspace groups (`pnpm-workspace.yaml`):

```
apps/
  web                      → Next.js 16 app (App Router, React 19)
  storybook                → @workspace/storybook — Storybook docs/preview for @workspace/ui (Vite builder)
packages/
  ui                       → @workspace/ui — shared component library (shadcn-style, Base UI, Tailwind v4)
  payments                 → @workspace/payments — PaymentRouter ABI, token list, EIP-712 helpers (viem)
  typescript-config        → @workspace/typescript-config — shared tsconfig presets
```

`contracts/` (outside the pnpm workspace) is the Foundry project for `PaymentRouter`, with `forge-std` and
`openzeppelin-contracts` as git submodules under `contracts/lib/`.

## Dependency direction

```
apps/web ────────► @workspace/ui ──► @base-ui/react, cva, tailwind-merge
apps/storybook ──►      │
    │                   │
    └───────────────────┴──► @workspace/typescript-config (dev-only)

apps/web ────────► @workspace/payments ──► viem
```

- Apps depend on packages. **Packages never import from apps.**
- `@workspace/ui` and `@workspace/payments` have no dependency on other workspace packages except the tsconfig preset.
- Cross-package imports go through the `exports` map of `@workspace/ui` (`./components/*`, `./hooks/*`, `./lib/*`, `./globals.css`, `./postcss.config`) or `@workspace/payments` (`./*` → `src/*.ts`, e.g. `@workspace/payments/abi`) — never deep-import via relative paths across packages.
- `apps/web/next.config.ts` lists both packages in `transpilePackages`.

## apps/web layout

```
app/          → routes (App Router: layout.tsx, page.tsx) — thin: pages/layouts only, no business logic
  api/[[...slugs]]/route.ts → Elysia composition root (see Backend API)
components/   → app-specific components grouped by feature/surface (e.g. theme-provider.tsx, query-provider.tsx)
  auth/ orders/ settings/
hooks/        → app-specific hooks
lib/          → app-specific infrastructure and services
  api/        → Elysia route module factories (orders-routes.ts, merchant-settings-routes.ts)
  chain/      → chain config, RouterReader port and its viem adapter
  db/         → client.ts (lazy Drizzle/pg client), schema.ts (tables), migrations/ (generated SQL and metadata)
  merchant-settings/ → MerchantSettingsRepository port and its Drizzle adapter
  orders/     → OrderRepository port and its Drizzle adapter, signature check, settlement, pay page verification
  session/    → SessionReader port and its better-auth adapter
  signing-key/ → browser-only device signing key (IndexedDB, AES-GCM wrapping)
src/helpers/  → shared helper functions/schemas used by multiple frontend components or by both frontend and backend
tests/        → all *.test.ts / *.test.tsx files, mirroring the app/lib/src tree (see Testing layout below)
  chain/      → fork tests, run separately with test:chain
```

Path alias `@/*` resolves to the app root (see `apps/web/tsconfig.json`).

Keep `app/` route segments thin. Do not place route-private UI in `app/**/_components`, and do not place shared helper code in
`app/**/_lib`. App-specific UI belongs under `apps/web/components/<area>/`; shared helper-like code belongs under
`apps/web/src/helpers/`.

`QueryProvider` (TanStack Query) lives next to `ThemeProvider` under `apps/web/components/`.

### Database

Postgres is the database. Drizzle ORM uses the `pg` driver; drizzle-kit generates and applies SQL migrations.
Persistence stays app-local under `apps/web/lib/db/` until a second consumer appears. `apps/web/drizzle.config.ts`
reads `lib/db/schema.ts` and writes generated SQL and metadata to `lib/db/migrations/`. Commit generated migrations alongside schema changes.

Tables: better-auth's auth tables (migration `0000`), `orders` (`0001`, extended in `0003`), and
`merchant_settings` (`0002`).

- `orders`: `id` (UUIDv7, also the on-chain `orderId`), `merchant_id` (FK `user.id`, on delete restrict),
  `token_address` (checksummed), `amount` (`numeric(78,0)` base units, gross of fee), `merchant_address`,
  `expires_at` (whole seconds, so it matches the signed `expiry`), `fee_bps`, `signature` (null until signed),
  `settled_at` (null until a status poll sees the payment), `created_at`. Rows with no signature are reservations
  and are never shown. Order status (open, expired, paid) derives from `expires_at` and `settled_at`.
- `merchant_settings`: `merchant_id` (primary key, FK `user.id`, on delete cascade) and `default_token_address`.

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
- `app/api/auth/[...all]/route.ts` mounts better-auth's GET/POST handlers directly, outside the Elysia app.
- `lib/db/schema.ts` defines better-auth's user, session, account, verification, and wallet_address tables. Sessions
  retain the better-auth default lifetime. SIWE requests use Arbitrum's chain ID (42161). EOA signatures verify locally
  with viem. Only regular wallets are supported; smart wallets such as Safe cannot sign in. Malformed and
  contract-style signatures are rejected as unauthorized. No ENS lookup.
- `lib/auth-client.ts` holds the SIWE-enabled client. `lib/wagmi.ts` configures wagmi 3 for EIP-6963 wallet discovery;
  `components/auth/` contains wallet sign-in, its provider, and sign out. No WalletConnect, wallet dialog, or network
  switch is needed for login. TanStack Query mutations handle pending/error states and navigation after success.
- `/sign-in` redirects existing sessions home; `/` uses `getAuth().api.getSession` with `await headers()` in the page
  and redirects logged-out requests to `/sign-in`. No proxy is used. `lib/wallet-address.ts` fetches at most one primary
  wallet row using only the session user's ID. Missing addresses show a sign-out/retry message. Sign out invalidates
  the server session before navigating to `/sign-in`.

### Backend API

Elysia is mounted in one composition root, `app/api/[[...slugs]]/route.ts`, with the `/api` prefix. It is the
only file that wires route modules to adapters, exports `GET`, `POST` and `PUT` as `app.fetch`, and exports the
`App` type. Route modules in `lib/api/` are factories that take ports as arguments. Each port in `lib/` has one
adapter:

| Port                                                                                   | Adapter                                               |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `OrderRepository` (`lib/orders/order-repository.ts`)                                   | `drizzleOrderRepository`                              |
| `MerchantSettingsRepository` (`lib/merchant-settings/merchant-settings-repository.ts`) | `drizzleMerchantSettingsRepository`                   |
| `SessionReader` (`lib/session/session-reader.ts`)                                      | `betterAuthSessionReader`                             |
| `RouterReader` (`lib/chain/router-reader.ts`)                                          | `getRouterReader` (`lib/chain/viem-router-reader.ts`) |

Routes:

- `POST /api/orders`: reserves an order for the session's merchant (id, `expires_at` now + 15 minutes, `feeBps`
  read from the router) and returns the fields to sign.
- `POST /api/orders/:id/signature`: checks the signature against the merchant's on-chain `signingKeyOf` and
  attaches it while the reservation is unsigned and unexpired.
- `GET /api/orders/:id/status`: owner only. Reads `paid(merchant, orderId)`, writes `settled_at` once, and returns
  `open`, `expired` or `paid`.
- `GET` / `PUT /api/merchant-settings`: the session merchant's default receive token.

Bodies are validated with Zod schemas from `src/helpers/`. Errors return `{ message }` with copy the merchant can
act on; chain read failures return 503. Server Components that need the same data call the adapters directly.
Client Components call the API through Eden (`lib/api-client.ts`).

### Chain

- Arbitrum One only. `lib/chain/chain-config.ts` reads `PAYMENT_ROUTER_ADDRESS` and `ARBITRUM_RPC_URL` at runtime.
  With either missing, the router is not configured and chain-dependent pages show a not-available state; builds
  need neither. Invalid values throw.
- `lib/chain/read-router.ts` turns a missing config or failed read into `null`, so callers report "try again" and
  never treat it as a pass.
- Contract writes (`setSigningKey`, `setPayoutAddress`) are sent from the merchant's wallet with wagmi on
  `/settings`. The server never sends transactions.

### Orders and signing key

- `/settings`: signing key (register, rotate, revoke), forward address (read from and written to the router only),
  and default receive token (`merchant_settings`).
- Signing key: `lib/signing-key/` generates the key in the browser and stores it in IndexedDB, wrapped by a
  non-extractable AES-GCM key. It never leaves the device. The router holds one key per merchant.
- `/orders/new` loads the on-chain `signingKeyOf` and blocks the form, with a link to settings, unless it matches
  this device's key. The device key signs the EIP-712 order (`signOrder` from `@workspace/payments/typed-data`)
  with no wallet prompt.
- `/orders/[id]`: owner only, 404 otherwise. Shows the amount, the QR linking to `/pay/order/<id>` (origin from
  `BETTER_AUTH_URL`), and polls `/api/orders/:id/status` every 3 seconds while the order is open.
- `/pay/order/[id]`: public. `lib/orders/pay-order.ts` verifies the stored signature against the on-chain key and
  reads `paid`, then renders valid, invalid, expired, paid, or "try again" on RPC failure. The merchant address
  never reaches the browser.
- Tokens: `src/helpers/tokens.ts` derives the static list from `@workspace/payments/tokens` and adds a name,
  `fiatDecimals` (2, or 0 for CHLt), and `canPay` / `canCollect`.

### apps/web testing layout

All test files live under `apps/web/tests/`, mirroring the `app/`, `lib/`, and `src/` tree 1:1 — no `.test.ts`/`.test.tsx` files colocated next
to source. Example: `apps/web/src/helpers/generate-id.ts` is tested at `apps/web/tests/src/helpers/generate-id.test.ts`.
Vitest is configured in `apps/web/vitest.config.ts`. `*.integration.test.ts` files live in the same mirrored location
as unit tests and use real Postgres. Run `pnpm test` after migrations; no integration tests are silently skipped.

Chain tests live in `apps/web/tests/chain/` and are excluded from `pnpm test`. `pnpm --filter web test:chain`
(`apps/web/vitest.chain.config.ts`) starts Anvil on an Arbitrum fork, deploys `PaymentRouter` from
`contracts/out/`, and runs against it and real Postgres, one file at a time.

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
