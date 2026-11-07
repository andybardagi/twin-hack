# 001 — Define DB, ORM, migrations, and id schema

## Status: pending

Establish the database, data-access layer, migration engine, and primary-key convention before any persistence-backed feature.

Do not add product tables in this feature. Document the choice and update `docs/architecture.md` and `docs/conventions.md` with the chosen layout and commands.

## Locked decisions

- **Database:** Postgres
- **ORM / access:** Drizzle ORM with the `pg` driver
- **Migrations:** drizzle-kit, with reviewed SQL committed alongside schema changes
- **IDs:** UUIDv7 generated in app code before insert (no database defaults on id columns)

## Implementation

- `apps/web/lib/db/client.ts` exports `getDb()`. Importing it performs no environment validation or connection setup.
  The first call requires `DATABASE_URL` and caches a Drizzle client backed by a `pg.Pool`; connections open on query.
- Server code uses the client at runtime. No database or environment variable is required for `pnpm build`.
- `apps/web/lib/db/schema.ts` is the empty schema entry point. No product tables or placeholder migrations are added.
- `apps/web/drizzle.config.ts` points to the schema and writes generated SQL and metadata to `lib/db/migrations/`.
- Run `pnpm --filter web db:generate` and `pnpm --filter web db:migrate` from the root. Generation does not require
  a database; migration requires an exported `DATABASE_URL` and a reachable database.
- Install `drizzle-orm` and `pg` in `apps/web`, with `drizzle-kit` and `@types/pg` as development dependencies.
- UUIDv7 is a convention only here. Add neither the `uuid` dependency nor an ID helper until the first consumer.

For local development, export `DATABASE_URL='postgresql://app:password@localhost:5433/app'` after starting the root
Compose service (feature 002). Next.js may also read an untracked `apps/web/.env.local`; drizzle-kit reads the shell
environment. No tracked environment file is added. See `docs/conventions.md` for the workflow and connectivity example.

## Verification

- Run root lint, typecheck, build (without `DATABASE_URL`), knip, and format checks.
- Verify importing the client without `DATABASE_URL` does not throw or connect.
- With local Postgres healthy, execute `select 1` through `getDb()` (see the example in `docs/conventions.md`).
- `knip.json` explicitly lists `lib/db/client.ts` as an entry until the first persistence consumer imports it.

## Out of scope

- docker-compose local DB (feature 002)
- API framework (feature 003)
- Product schema
