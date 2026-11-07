# 002 — Local docker-compose for the chosen DB

## Status: pending

Depends on feature 001.

Stand up a root `docker-compose.yml` service for the database chosen in 001 so local app work and future integration tests share one `DATABASE_URL`.

Credentials must be template-generic (not product-specific names).

## Suggested defaults (not locked)

- Root `docker-compose.yml` Postgres service
- `DATABASE_URL` for the app and future integration tests
- `docker compose up -d` is enough to bring the DB up

## Out of scope

- ORM/migration implementation beyond wiring the URL (owned by 001)
- API framework (feature 003)
