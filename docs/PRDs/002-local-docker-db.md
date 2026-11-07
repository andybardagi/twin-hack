# 002 — Local docker-compose for the chosen DB

## Status: pending

Depends on feature 001.

Stand up a root `docker-compose.yml` service for the database chosen in 001 so local app work and future integration tests share one `DATABASE_URL`.

Credentials must be template-generic (not product-specific names).

## Locked decisions

- Root `docker-compose.yml` with a `postgres` service using `postgres:17-alpine`
- Template-generic local credentials: user `app`, password `password`, database `app`
- `DATABASE_URL='postgresql://app:password@localhost:5433/app'` for the app and future integration tests
- `docker compose up -d` from the root brings the DB up; wait for its healthcheck before using it
- Bind host port 5433 to localhost (container port 5432); persist data in the `postgres-data` named volume

## Local workflow

```sh
docker compose up -d
docker compose ps
export DATABASE_URL='postgresql://app:password@localhost:5433/app'
pnpm --filter web db:migrate
```

Run migrations after the first schema migration exists (feature 001 deliberately defines no tables). The shell
export is used by drizzle-kit and future integration tests. Next.js can use the same export or an untracked
`apps/web/.env.local`. No environment file is committed; the Compose credentials are local development placeholders.

`docker compose down` stops the service while retaining the named volume. See `docs/conventions.md` for schema
generation, migration review, and a server-side connectivity example.

## Verification

- `docker compose config` validates the root configuration.
- `docker compose up -d` starts the service; `docker compose ps` reports it healthy.
- App server code can execute `select 1` through the lazy Drizzle client using the documented URL.

## Out of scope

- ORM/migration implementation beyond wiring the URL (owned by 001)
- API framework (feature 003)
