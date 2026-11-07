# 003 — Define backend API framework

## Status: done

Decided as part of feature 005 (order creation), which added the first product endpoints.

## Decisions

- Elysia, mounted in one Next.js catch-all composition root at `apps/web/app/api/[[...slugs]]/route.ts` with
  the `/api` prefix. It is the only place that wires route modules to their adapters, and it exports the `App`
  type.
- Route modules in `apps/web/lib/api/` are factories that take their ports as arguments
  (`ordersRoutes(repository, sessions, routerSource)`), so tests can pass other adapters.
- Ports and adapters live in `apps/web/lib/`, one adapter per port: `OrderRepository` /
  `drizzleOrderRepository`, `MerchantSettingsRepository` / `drizzleMerchantSettingsRepository`,
  `SessionReader` / `betterAuthSessionReader`, and `RouterReader` / `getRouterReader`.
- Request and response bodies are validated with Zod schemas from `apps/web/src/helpers/`.
- Clients call the API through Eden (`apps/web/lib/api-client.ts`), typed from `App`.
- Better-auth keeps its own route at `app/api/auth/[...all]/route.ts`; Elysia does not mount it.

The layout is described in `docs/architecture.md`.

## Out of scope

- Database/ORM (feature 001)
- docker-compose (feature 002)
- Auth (feature 004)
