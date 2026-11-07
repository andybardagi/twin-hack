# 001 — Define DB, ORM, migrations, and id schema

## Status: pending

Choose the database, data-access layer, migration engine, and primary-key convention before any persistence-backed feature.

Do not add product tables in this feature. Document the choice and update `docs/architecture.md` and `docs/conventions.md` with the chosen layout and commands.

## Suggested defaults (not locked)

- **Database:** Postgres
- **ORM / access:** Drizzle + drizzle-kit scripts, **or** a thin `pg` controller without an ORM
- **Migrations:** drizzle-kit **or** node-pg-migrate
- **IDs:** UUIDv7 generated in app code before insert (no database defaults on id columns)

## Out of scope

- docker-compose local DB (feature 002)
- API framework (feature 003)
- Product schema
