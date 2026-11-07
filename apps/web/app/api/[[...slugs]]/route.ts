import { Elysia } from "elysia";

import { merchantSettingsRoutes } from "@/lib/api/merchant-settings-routes";
import { ordersRoutes } from "@/lib/api/orders-routes";
import { getRouterReader } from "@/lib/chain/viem-router-reader";
import { drizzleMerchantSettingsRepository } from "@/lib/merchant-settings/drizzle-merchant-settings-repository";
import { drizzleOrderRepository } from "@/lib/orders/drizzle-order-repository";
import { betterAuthSessionReader } from "@/lib/session/better-auth-session-reader";

const app = new Elysia({ prefix: "/api" })
  .use(ordersRoutes(drizzleOrderRepository, betterAuthSessionReader, getRouterReader))
  .use(merchantSettingsRoutes(drizzleMerchantSettingsRepository, betterAuthSessionReader));

export const GET = app.fetch;
export const POST = app.fetch;
export const PUT = app.fetch;
export type App = typeof app;
