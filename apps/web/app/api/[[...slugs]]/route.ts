import { Elysia } from "elysia";

import { ordersRoutes } from "@/lib/api/orders-routes";
import { drizzleOrderRepository } from "@/lib/orders/drizzle-order-repository";
import { betterAuthSessionReader } from "@/lib/session/better-auth-session-reader";

const app = new Elysia({ prefix: "/api" }).use(
  ordersRoutes(drizzleOrderRepository, betterAuthSessionReader),
);

export const GET = app.fetch;
export const POST = app.fetch;
export type App = typeof app;
