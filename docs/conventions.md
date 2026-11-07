# Conventions

## Language & modules

- TypeScript everywhere, `"type": "module"` (ESM). No `require`.
- Explicit types at module boundaries; rely on inference inside function bodies.
- Named exports for components and utilities (`export { Button, buttonVariants }`); `export default` only where a framework requires it (Next.js pages/layouts).

## Lint & format

- **oxlint** and **oxfmt** — not ESLint, not Prettier. Do not add ESLint/Prettier configs or disable-comments in their syntax.
- Commands (root, apply everywhere):
  - `pnpm lint` / `pnpm lint:fix`
  - `pnpm format` (check) / `pnpm format:fix`
  - `pnpm typecheck`
  - `pnpm build`
  - `pnpm knip`
- Fix pipeline in one shot: `pnpm turbo //#quality:fix`.

## Verification bar

A change is not finished until `pnpm lint && pnpm typecheck && pnpm build` passes from the repo root.

**Testing:** Vitest is configured in `apps/web`. Run `pnpm test` from the root (or `pnpm --filter web test`). Tests live under `apps/web/tests/` mirroring source (see `docs/architecture.md`). Integration tests require real Postgres with migrations applied; the default test URL is the local Docker URL below. Export `DATABASE_URL` to use a dedicated test database. Tests create and clean up their own auth records.

**Unused code:** `pnpm knip` must stay clean. Configure `knip.json` before ignoring issues; never use broad `ignore` patterns.

## Database and migrations

- Postgres + Drizzle ORM (`pg` driver), with drizzle-kit for migrations. Dependencies and scripts belong to `apps/web`.
- Keep the client and table definitions in `apps/web/lib/db/client.ts` and `apps/web/lib/db/schema.ts`.
- Server code uses `getDb()` from `@/lib/db/client` at runtime. Importing it is safe without `DATABASE_URL`;
  calling it without the variable throws an actionable error. Never import it into Client Components.
- IDs are UUIDv7, generated in app code before insert. ID columns have no database default. Do not use serial IDs,
  `gen_random_uuid()`, or a database UUIDv7 default. Auth uses `v7()` from `uuid` in better-auth’s ID generator.

From the repo root, start the local database and export its template development URL:

```sh
docker compose up -d
docker compose ps
export DATABASE_URL='postgresql://app:password@localhost:5433/app'
```

Wait for the `postgres` service to be healthy before querying or migrating. These generic credentials are only for
local development. Data persists in the `postgres-data` named volume after `docker compose down`.

`DATABASE_URL` is server-only; never prefix it with `NEXT_PUBLIC_`. Export it in the shell for drizzle-kit and future
integration tests. For Next.js, either export it before starting the app or set it in an **untracked**
`apps/web/.env.local`. Drizzle scripts do not automatically load `.env.local`. Do not commit environment files or real credentials.

After editing the schema, generate and review SQL, then apply migrations:

```sh
pnpm --filter web db:generate
pnpm --filter web db:migrate
```

Generation uses `apps/web/drizzle.config.ts` and needs no connection or `DATABASE_URL`. Migration requires the URL
and a running Postgres instance. Generated SQL and metadata live in `apps/web/lib/db/migrations/` and must be
committed alongside schema changes. The initial migration defines auth tables. Do not
create placeholder product tables. Review migration safety for existing rows before applying SQL; do not use
schema push as a substitute for reviewed migrations.

To check connectivity from server code once Postgres is running:

```ts
import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db/client";

await getDb().execute(sql`select 1`);
```

## Wallet login locally

Server-only environment variables (never use `NEXT_PUBLIC_`):

- `BETTER_AUTH_SECRET`: at least 32 random characters; generate a local value with `openssl rand -base64 32`.
- `BETTER_AUTH_URL`: the app's public origin, locally `http://localhost:3000`. Its host (including port) must match
  the domain users sign in on, because SIWE verifies that domain. Use the same host in the browser and config.
- `DATABASE_URL`: the Postgres connection URL documented above.

Start Postgres, wait for its healthcheck, and apply migrations using the commands above. Export the variables in
the shell that starts Next.js, or put them in untracked `apps/web/.env.local` (never commit secrets or env files):

```sh
export BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
export BETTER_AUTH_URL='http://localhost:3000'
pnpm dev
```

To relay payments (`POST /api/payments/relay`), also set these server-only variables (never use `NEXT_PUBLIC_`):

- `RELAYER_PRIVATE_KEY`: 0x-prefixed 32-byte hex key of the account that pays gas for `pay`. It needs Arbitrum ETH.
- `ARBITRUM_RPC_URL`: optional Arbitrum One RPC URL; defaults to `https://arb1.arbitrum.io/rpc`.

Open `http://localhost:3000/sign-in` with an EIP-6963 browser wallet enabled. Choose the detected wallet, connect,
and sign the message. The message always uses Arbitrum (42161); login does not switch the wallet's network or send
transactions. With no detected wallet, install or enable one and reload. No email, ENS, or WalletConnect is used.
Only regular wallets are supported; smart wallets such as Safe cannot sign in. Signatures verify locally with viem.
The home page shows the session user's primary wallet address. Sign out returns to `/sign-in`; visiting `/` without
a session redirects there. Both themes use the shared neutral design tokens.

`pnpm test` runs integration tests against Postgres plus client action tests. Test auth settings are supplied by
Vitest. `pnpm build` requires none of these environment variables.

## Components (shadcn / Base UI pattern)

Follow the existing pattern in `packages/ui/src/components/button.tsx`:

- Build on **Base UI** primitives (`@base-ui/react/*`), not raw HTML elements, when a primitive exists.
- Variants with **cva** (`class-variance-authority`); export both the component and its `*Variants` object.
- Merge classes with `cn()` from `@workspace/ui/lib/utils` — never string concatenation.
- Set `data-slot="<component-name>"` on the rendered element.
- Plain `function` declarations for components (no `React.FC`, no `forwardRef` unless a ref is actually consumed).
- Spread `...props` last; accept `className` and merge it via `cn()`.
- **Every component added to `packages/ui/src/components/` must have a matching story** in `apps/storybook/stories/<component>.stories.tsx`.

## Files & naming

- One component per file, **kebab-case filenames** (`theme-provider.tsx`, `button.tsx`); PascalCase component names.
- Hooks in `hooks/`, prefixed `use`. App-specific UI components in `components/<area>/`, not `app/**/_components`. Shared helper functions and schemas in `src/helpers/`, not `app/**/_lib` or catch-all `lib/` helper files.
- Feature plan files live in `docs/PRDs/`, named `NNN-<plan-slug>.md` (zero-padded sequence, kebab-case slug — e.g. `001-db-infrastructure.md`).
- Imports: external packages first, then workspace packages (`@workspace/ui/...`), then app-local (`@/...`) — matching existing files.
- Test files never live next to their source. All `*.test.ts`/`*.test.tsx` (including `.integration.test.ts`) live under `apps/web/tests/`, mirroring the `app/`, `lib/`, and `src/` tree — see `docs/architecture.md`'s "apps/web testing layout" section.

## Forms and mutations

- Form state and validation use TanStack Form (`useForm`) with Zod schemas. Keep reusable form schemas in `apps/web/src/helpers/`.
- Client-side form submissions use TanStack Query mutations (`useMutation`). Put navigation, cache invalidation, toast/error state, and other post-submit effects in `onSuccess` and `onError` callbacks.
- Use `useQuery` for client-side async reads that need loading/error/cache state. Server Components should still fetch server-only data directly when that keeps secrets and backend dependencies out of the client bundle.

## Styling

- Tailwind utilities only; no CSS modules, no inline `style` unless dynamic.
- Use design-token utilities (`bg-primary`, `text-muted-foreground`, …), never hard-coded colors.
- Both light and dark mode must work — use token pairs and `dark:` variants as the existing components do.
- Follow `docs/design-style.md` for visual hierarchy. Keep the default shadcn neutral (black-and-white) theme.

## Workspace hygiene

- Add dependencies to the package that uses them (`pnpm add <pkg> --filter web`), not to the root, unless they're repo-wide tooling.
- Internal deps use `workspace:*` protocol.
- Respect the dependency direction in `docs/architecture.md`.
