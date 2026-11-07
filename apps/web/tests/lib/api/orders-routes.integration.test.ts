import { eq, inArray } from "drizzle-orm";
import { Elysia } from "elysia";
import { getAddress, zeroAddress } from "viem";
import { v7 } from "uuid";
import { afterEach, expect, expectTypeOf, test, vi } from "vitest";
import { z } from "zod";

import { tokens as paymentTokens } from "@workspace/payments/tokens";

import { POST, type App } from "@/app/api/[[...slugs]]/route";
import { GET as authGET } from "@/app/api/auth/[...all]/route";
import { ordersRoutes } from "@/lib/api/orders-routes";
import type { RouterReader, RouterReaderResult } from "@/lib/chain/router-reader";
import { getDb } from "@/lib/db/client";
import { orders, user, verification } from "@/lib/db/schema";
import { drizzleOrderRepository } from "@/lib/orders/drizzle-order-repository";
import { betterAuthSessionReader } from "@/lib/session/better-auth-session-reader";
import { reservedOrderSchema } from "@/src/helpers/order-schema";
import { tokens } from "@/src/helpers/tokens";
import { signInMerchant } from "./sign-in-merchant";

const baseURL = "http://localhost:3000";
const addresses: string[] = [];
const nonceIdentifiers: string[] = [];
const token = tokens.find((token) => token.symbol === "USDT");
if (!token) throw new Error("Missing USDT token");
const validBody = { tokenAddress: token.address.toLowerCase(), amount: "123.45" };

function orderRequest(body: unknown, cookie = ""): Request {
  return new Request(`${baseURL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify(body),
  });
}

const signIn = () => signInMerchant(addresses, nonceIdentifiers);

const routerReader: RouterReader = {
  signingKeyOf: async () => zeroAddress,
  feeBps: async () => 50,
  paid: async () => false,
};
function routerSource(reader: RouterReader = routerReader): () => RouterReaderResult {
  return () => ({ status: "configured", routerAddress: paymentTokens.USDT0.address, reader });
}
function ordersApp(source = routerSource(), repository = drizzleOrderRepository) {
  return new Elysia({ prefix: "/api" }).use(
    ordersRoutes(repository, betterAuthSessionReader, source),
  );
}

afterEach(async () => {
  vi.restoreAllMocks();
  const db = getDb();
  if (addresses.length) {
    const merchants = db.select({ id: user.id }).from(user).where(inArray(user.name, addresses));
    await db.delete(orders).where(inArray(orders.merchantId, merchants));
    await db.delete(user).where(inArray(user.name, addresses));
  }
  if (nonceIdentifiers.length) {
    await db.delete(verification).where(inArray(verification.identifier, nonceIdentifiers));
  }
  addresses.length = 0;
  nonceIdentifiers.length = 0;
});

test("reserves an order from session, server clock and router fee only", async () => {
  expectTypeOf<App["~Routes"]["api"]["orders"]["post"]["response"][201]>().toEqualTypeOf<
    z.infer<typeof reservedOrderSchema>
  >();
  expectTypeOf<App["~Routes"]["api"]["orders"]["post"]["response"][503]>().toEqualTypeOf<{
    message: string;
  }>();
  const { merchantId, cookie } = await signIn();
  const merchantAddress = addresses.at(-1);
  const before = Math.floor(Date.now() / 1000);
  const response = await ordersApp().fetch(
    orderRequest(
      {
        ...validBody,
        id: v7(),
        merchantId: v7(),
        merchant: zeroAddress,
        merchantAddress: zeroAddress,
        expiry: 1,
        expiresAt: new Date(0).toISOString(),
        feeBps: 0,
        signature: `0x${"11".repeat(65)}`,
      },
      cookie,
    ),
  );
  expect(response.status).toBe(201);
  const reserved = reservedOrderSchema.strict().parse(await response.json());
  expect(reserved).toMatchObject({
    merchant: merchantAddress,
    receiveToken: token.address,
    receiveAmount: "123450000",
    feeBps: 50,
  });
  expect(reserved.expiry - before).toBeGreaterThanOrEqual(15 * 60);
  expect(reserved.expiry - before).toBeLessThanOrEqual(15 * 60 + 5);
  const [stored] = await getDb().select().from(orders).where(eq(orders.id, reserved.id)).limit(1);
  expect(stored).toMatchObject({
    merchantId,
    merchantAddress: getAddress(merchantAddress ?? ""),
    expiresAt: new Date(reserved.expiry * 1000),
    feeBps: 50,
    signature: null,
  });

  const sessionResponse = await authGET(
    new Request(`${baseURL}/api/auth/get-session`, { headers: { cookie } }),
  );
  expect(sessionResponse.status).toBe(200);
  expect(await sessionResponse.json()).toMatchObject({ user: { id: merchantId } });
});

test("refuses to reserve without a router fee and stores nothing", async () => {
  const { merchantId, cookie } = await signIn();
  const logError = vi.spyOn(console, "error").mockImplementation(() => {});
  for (const source of [
    (): RouterReaderResult => ({ status: "not-configured" }),
    routerSource({
      ...routerReader,
      feeBps: async () => {
        throw new Error("RPC down");
      },
    }),
  ]) {
    const response = await ordersApp(source).fetch(orderRequest(validBody, cookie));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ message: "Couldn't reach Arbitrum. Try again." });
  }
  expect(logError).toHaveBeenCalledOnce();
  expect(
    await getDb().select().from(orders).where(eq(orders.merchantId, merchantId)).limit(1),
  ).toHaveLength(0);
});

test("requires a valid session cookie", async () => {
  for (const cookie of ["", "better-auth.session_token=invalid"]) {
    const response = await POST(orderRequest(validBody, cookie));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "Sign in to create an order." });
  }
});

test("rejects invalid bodies with 422 without storing an order", async () => {
  const { merchantId, cookie } = await signIn();
  for (const body of [
    {},
    { ...validBody, amount: 1 },
    { ...validBody, amount: "0" },
    { ...validBody, amount: "1.001" },
    { ...validBody, tokenAddress: "0x0000000000000000000000000000000000000000" },
  ]) {
    const response = await ordersApp().fetch(orderRequest(body, cookie));
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      message: "Check the token and amount, then try again.",
    });
  }
  expect(
    await getDb()
      .select()
      .from(orders)
      .where(inArray(orders.merchantId, [merchantId]))
      .limit(1),
  ).toHaveLength(0);
});

test("returns a generic error when persistence fails", async () => {
  const { cookie } = await signIn();
  const error = new Error("Private database connection details");
  const logError = vi.spyOn(console, "error");
  const app = ordersApp(routerSource(), {
    ...drizzleOrderRepository,
    async create() {
      throw error;
    },
  });
  const response = await app.fetch(orderRequest(validBody, cookie));
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ message: "Couldn't create the order. Try again." });
  expect(logError).toHaveBeenCalledWith(error);
});

test("returns a generic error when the repository returns a non-v7 order id", async () => {
  const { cookie } = await signIn();
  const app = ordersApp(routerSource(), {
    ...drizzleOrderRepository,
    async create(input) {
      return {
        ...input,
        id: "550e8400-e29b-41d4-a716-446655440000",
        signature: null,
        settledAt: null,
        createdAt: new Date(),
      };
    },
  });
  const response = await app.fetch(orderRequest(validBody, cookie));
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ message: "Couldn't create the order. Try again." });
});

test("returns a generic error when session lookup fails", async () => {
  const app = new Elysia({ prefix: "/api" }).use(
    ordersRoutes(
      drizzleOrderRepository,
      {
        async read() {
          throw new Error("Private auth configuration");
        },
      },
      routerSource(),
    ),
  );
  const response = await app.fetch(orderRequest(validBody));
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ message: "Couldn't create the order. Try again." });
});

test("rejects malformed JSON without exposing parser errors", async () => {
  const response = await POST(
    new Request(`${baseURL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    }),
  );
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ message: "Send a valid JSON body, then try again." });
});
