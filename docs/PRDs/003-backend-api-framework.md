# 003 — Define backend API framework

## Status: pending

Choose the HTTP API framework and write the composition-root / ports-and-adapters layout into `docs/architecture.md` after the choice.

Do not add product routes in this feature.

## Suggested defaults (not locked)

- Elysia mounted in a thin Next.js catch-all `app/api/[[...slugs]]/route.ts` composition root
- Route modules as factories; explicit dependency injection at the composition boundary
- Copy/adapt the Elysia-on-Next.js integration note into `docs/external/` only when this feature runs

## Out of scope

- Database/ORM (feature 001)
- docker-compose (feature 002)
- Auth, product endpoints
