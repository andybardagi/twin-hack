import { eq, inArray } from "drizzle-orm";
import { Elysia } from "elysia";
import { getAddress, zeroAddress } from "viem";
import { arbitrum } from "viem/chains";
import { afterEach, expect, test, vi } from "vitest";

import type { RelayPaymentResult } from "@workspace/payments/relay";
import { tokens as paymentTokens } from "@workspace/payments/tokens";
import { hashOrder } from "@workspace/payments/typed-data";

import { payOrderRoutes } from "@/lib/api/pay-order-routes";
import type { Router } from "@/lib/chain/router-reader";
import { getDb } from "@/lib/db/client";
import { orders, user, verification } from "@/lib/db/schema";
import { drizzleOrderRepository } from "@/lib/orders/drizzle-order-repository";
import { toReservedOrder } from "@/lib/orders/reserved-order";
import type { PaymentRelayer } from "@/lib/payments/relay";
import { betterAuthSessionReader } from "@/lib/session/better-auth-session-reader";
import { toSignableOrder } from "@/src/helpers/order-schema";
import { createSignedOrder } from "../orders/order-fixture";
import { signInMerchant } from "./sign-in-merchant";

const baseURL = "http://localhost:3000";
const addresses: string[] = [];
const nonceIdentifiers: string[] = [];
const router = getAddress("0x4DE32c75eecDF3229114F105293698284b261Bb1");
const hash = `0x${"ab".repeat(32)}` as const;
const validBody = {
  payToken: paymentTokens.USDT0.address,
  maxPayAmount: "124000000",
  payerSignature: `0x${"22".repeat(65)}`,
  permit: {
    value: "124000000",
    deadline: "1900000000",
    v: 27,
    r: `0x${"33".repeat(32)}`,
    s: `0x${"44".repeat(32)}`,
  },
};

const routerSource = (): Router => ({
  routerAddress: router,
  reader: {
    signingKeyOf: async () => zeroAddress,
    feeBps: async () => 50,
    paid: async () => false,
  },
});

function payApp(relay: PaymentRelayer) {
  return new Elysia({ prefix: "/api" }).use(
    payOrderRoutes(drizzleOrderRepository, betterAuthSessionReader, routerSource, relay),
  );
}

function payRequest(id: string, body: unknown, cookie = ""): Request {
  return new Request(`${baseURL}/api/orders/${id}/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify(body),
  });
}

/** A merchant with a signed order, and a different signed-in customer. */
async function orderAndCustomer() {
  const merchant = await signInMerchant(addresses, nonceIdentifiers);
  const order = await createSignedOrder(merchant.merchantId);
  const customer = await signInMerchant(addresses, nonceIdentifiers);
  const payer = addresses.at(-1);
  if (!payer) throw new Error("Missing customer address");
  return { order, cookie: customer.cookie, payer: getAddress(payer) };
}

afterEach(async () => {
  const db = getDb();
  if (addresses.length) {
    const users = db.select({ id: user.id }).from(user).where(inArray(user.name, addresses));
    await db.delete(orders).where(inArray(orders.merchantId, users));
    await db.delete(user).where(inArray(user.name, addresses));
  }
  if (nonceIdentifiers.length) {
    await db.delete(verification).where(inArray(verification.identifier, nonceIdentifiers));
  }
  addresses.length = 0;
  nonceIdentifiers.length = 0;
});

test("relays the stored order with the session wallet as payer, then marks it settled", async () => {
  const { order, cookie, payer } = await orderAndCustomer();
  const relay = vi.fn<PaymentRelayer>(
    async () => ({ kind: "settled", hash }) as RelayPaymentResult,
  );

  const response = await payApp(relay).fetch(payRequest(order.id, validBody, cookie));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ hash });

  const signed = toSignableOrder(toReservedOrder(order));
  expect(relay).toHaveBeenCalledWith({
    router,
    order: signed,
    merchantSignature: order.signature,
    intent: {
      payer,
      payToken: getAddress(paymentTokens.USDT0.address),
      maxPayAmount: 124_000_000n,
      orderHash: hashOrder({ chainId: arbitrum.id, router }, signed),
    },
    payerSignature: validBody.payerSignature,
    permit: { ...validBody.permit, value: 124_000_000n, deadline: 1_900_000_000n },
  });
  const [stored] = await getDb().select().from(orders).where(eq(orders.id, order.id));
  expect(stored?.settledAt).toBeInstanceOf(Date);
  expect(stored?.payerAddress).toBe(payer);
  expect(stored?.txHash).toBe(hash);
});

test("requires a session", async () => {
  const { order } = await orderAndCustomer();
  const relay = vi.fn<PaymentRelayer>();
  const response = await payApp(relay).fetch(payRequest(order.id, validBody));
  expect(response.status).toBe(401);
  expect(relay).not.toHaveBeenCalled();
});

test("rejects tokens the customer can't pay with", async () => {
  const { order, cookie } = await orderAndCustomer();
  const relay = vi.fn<PaymentRelayer>();
  const response = await payApp(relay).fetch(
    payRequest(order.id, { ...validBody, payToken: zeroAddress }, cookie),
  );
  expect(response.status).toBe(422);
  expect(relay).not.toHaveBeenCalled();
});

test("returns 404 for an unknown order", async () => {
  const { cookie } = await orderAndCustomer();
  const relay = vi.fn<PaymentRelayer>();
  const response = await payApp(relay).fetch(
    payRequest("0190a3c4-0000-7000-8000-000000000000", validBody, cookie),
  );
  expect(response.status).toBe(404);
  expect(relay).not.toHaveBeenCalled();
});

test("explains an invalid order without settling it", async () => {
  const { order, cookie } = await orderAndCustomer();
  const relay = vi.fn<PaymentRelayer>(async () => ({
    kind: "invalid-order",
    reason: "self-payment",
  }));
  const response = await payApp(relay).fetch(payRequest(order.id, validBody, cookie));
  expect(response.status).toBe(409);
  expect(await response.json()).toEqual({
    message: "You can't pay your own order. Sign in with a different wallet.",
  });
  const [stored] = await getDb().select().from(orders).where(eq(orders.id, order.id));
  expect(stored?.settledAt).toBeNull();
});

test("explains a payment that would revert", async () => {
  const { order, cookie } = await orderAndCustomer();
  const relay = vi.fn<PaymentRelayer>(async () => ({
    kind: "reverted",
    errorName: "MaxPayExceeded",
  }));
  const response = await payApp(relay).fetch(payRequest(order.id, validBody, cookie));
  expect(response.status).toBe(422);
  expect(await response.json()).toEqual({
    message: "The price moved past your limit. Nothing was charged. Try again for a fresh quote.",
  });
});
