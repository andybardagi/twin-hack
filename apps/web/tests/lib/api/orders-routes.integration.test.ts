import { inArray } from "drizzle-orm";
import { Elysia } from "elysia";
import { v7 } from "uuid";
import { afterEach, expect, expectTypeOf, test, vi } from "vitest";
import { z } from "zod";

import { POST, type App } from "@/app/api/[[...slugs]]/route";
import { GET as authGET } from "@/app/api/auth/[...all]/route";
import { ordersRoutes } from "@/lib/api/orders-routes";
import { getDb } from "@/lib/db/client";
import { orders, user, verification } from "@/lib/db/schema";
import { drizzleOrderRepository } from "@/lib/orders/drizzle-order-repository";
import { betterAuthSessionReader } from "@/lib/session/better-auth-session-reader";
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

test("creates an order with the session merchant and transformed base units", async () => {
  expectTypeOf<App["~Routes"]["api"]["orders"]["post"]["response"][201]>().toEqualTypeOf<{
    id: string;
  }>();
  expectTypeOf<App["~Routes"]["api"]["orders"]["post"]["response"][422]>().toEqualTypeOf<{
    message: string;
  }>();
  expectTypeOf<App["~Routes"]["api"]["orders"]["post"]["response"][500]>().toEqualTypeOf<{
    message: string;
  }>();
  const { merchantId, cookie } = await signIn();
  const response = await POST(orderRequest({ ...validBody, merchantId: v7() }, cookie));
  expect(response.status).toBe(201);
  const result = z
    .object({ id: z.uuidv7() })
    .strict()
    .parse(await response.json());
  expect(await drizzleOrderRepository.findById(result.id)).toMatchObject({
    merchantId,
    tokenAddress: token.address,
    amount: "123450000",
  });

  const sessionResponse = await authGET(
    new Request(`${baseURL}/api/auth/get-session`, { headers: { cookie } }),
  );
  expect(sessionResponse.status).toBe(200);
  expect(await sessionResponse.json()).toMatchObject({ user: { id: merchantId } });
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
    const response = await POST(orderRequest(body, cookie));
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
  const app = new Elysia({ prefix: "/api" }).use(
    ordersRoutes(
      {
        ...drizzleOrderRepository,
        async create() {
          throw error;
        },
      },
      betterAuthSessionReader,
    ),
  );
  const response = await app.fetch(orderRequest(validBody, cookie));
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ message: "Couldn't create the order. Try again." });
  expect(logError).toHaveBeenCalledWith(error);
});

test("returns a generic error when the repository returns a non-v7 order id", async () => {
  const { cookie } = await signIn();
  const app = new Elysia({ prefix: "/api" }).use(
    ordersRoutes(
      {
        ...drizzleOrderRepository,
        async create(input) {
          return { ...input, id: "550e8400-e29b-41d4-a716-446655440000", createdAt: new Date() };
        },
      },
      betterAuthSessionReader,
    ),
  );
  const response = await app.fetch(orderRequest(validBody, cookie));
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ message: "Couldn't create the order. Try again." });
});

test("returns a generic error when session lookup fails", async () => {
  const app = new Elysia({ prefix: "/api" }).use(
    ordersRoutes(drizzleOrderRepository, {
      async read() {
        throw new Error("Private auth configuration");
      },
    }),
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
