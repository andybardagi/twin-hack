import { eq, inArray } from "drizzle-orm";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { v7 } from "uuid";
import { createWalletClient, http, keccak256, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrum } from "viem/chains";
import { afterEach, expect, test, vi } from "vitest";

import { tokens } from "@workspace/payments/tokens";
import { hashOrder, signOrder } from "@workspace/payments/typed-data";

import { PayOrderStatus } from "@/components/orders/pay-order-status";
import type { RouterReader } from "@/lib/chain/router-reader";
import { getDb } from "@/lib/db/client";
import { orders, user } from "@/lib/db/schema";
import { drizzleOrderRepository } from "@/lib/orders/drizzle-order-repository";
import { verifyPayOrder, type PayOrder } from "@/lib/orders/pay-order";
import { toReservedOrder } from "@/lib/orders/reserved-order";
import { toSignableOrder } from "@/src/helpers/order-schema";
import { reservationInput } from "./order-fixture";

const routerAddress = tokens.USDT0.address;
const merchant = privateKeyToAccount(keccak256(toHex("pay-order-test-merchant"))).address;
const device = privateKeyToAccount(keccak256(toHex("pay-order-test-device")));
const rotatedKey = privateKeyToAccount(keccak256(toHex("pay-order-test-rotated"))).address;
const merchantIds: string[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  if (!merchantIds.length) return;
  await getDb().delete(orders).where(inArray(orders.merchantId, merchantIds));
  await getDb().delete(user).where(inArray(user.id, merchantIds));
  merchantIds.length = 0;
});

function chain({ signingKey = device.address, paid = false } = {}) {
  const reader: RouterReader = {
    signingKeyOf: async () => signingKey,
    feeBps: async () => 50,
    paid: async () => paid,
  };
  return () => ({ routerAddress, reader });
}

function unreachable() {
  const reader: RouterReader = {
    signingKeyOf: async () => {
      throw new Error("RPC down");
    },
    feeBps: async () => 50,
    paid: async () => {
      throw new Error("RPC down");
    },
  };
  return { routerAddress, reader };
}

async function createMerchant() {
  const merchantId = v7();
  merchantIds.push(merchantId);
  await getDb()
    .insert(user)
    .values({ id: merchantId, name: "Merchant", email: `${merchantId}@example.com` });
  return merchantId;
}

/** Inserts directly so expired orders can carry a real signature too. */
async function createSignedOrder(now = new Date()) {
  const merchantId = await createMerchant();
  const order = await drizzleOrderRepository.create({
    ...reservationInput(merchantId, now),
    merchantAddress: merchant,
  });
  const signer = createWalletClient({ account: device, chain: arbitrum, transport: http() });
  const signature = await signOrder(
    signer,
    { chainId: arbitrum.id, router: routerAddress },
    toSignableOrder(toReservedOrder(order)),
  );
  await getDb().update(orders).set({ signature }).where(eq(orders.id, order.id));
  return { ...order, signature };
}

const display = { amount: "123.45", token: "USDT" };

test("a signature from the merchant's on-chain key is valid", async () => {
  const order = await createSignedOrder();
  const signed = toSignableOrder(toReservedOrder(order));
  expect(await verifyPayOrder(order.id, drizzleOrderRepository, chain())).toEqual({
    status: "valid",
    display,
    payment: {
      router: routerAddress,
      orderHash: hashOrder({ chainId: arbitrum.id, router: routerAddress }, signed),
      receiveToken: tokens.USDT0.address,
      receiveAmount: "123450000",
      expiry: Number(signed.expiry),
    },
  });
});

test("a rotated signing key or a forged signature makes the order invalid", async () => {
  const order = await createSignedOrder();
  expect(
    await verifyPayOrder(order.id, drizzleOrderRepository, chain({ signingKey: rotatedKey })),
  ).toEqual({ status: "invalid" });

  for (const signature of [`0x${"11".repeat(65)}`, `0x${"00".repeat(65)}`, "not-hex"]) {
    await getDb().update(orders).set({ signature }).where(eq(orders.id, order.id));
    expect(await verifyPayOrder(order.id, drizzleOrderRepository, chain())).toEqual({
      status: "invalid",
    });
  }
});

test("a validly signed order past its expiry is expired", async () => {
  const order = await createSignedOrder(new Date(Date.now() - 16 * 60 * 1000));
  expect(await verifyPayOrder(order.id, drizzleOrderRepository, chain())).toEqual({
    status: "expired",
    display,
  });
});

test("a paid order stays paid after expiry and key rotation", async () => {
  const order = await createSignedOrder(new Date(Date.now() - 16 * 60 * 1000));
  expect(
    await verifyPayOrder(
      order.id,
      drizzleOrderRepository,
      chain({ signingKey: rotatedKey, paid: true }),
    ),
  ).toEqual({ status: "paid", display });
});

test("missing, malformed and unsigned orders are not found", async () => {
  const merchantId = await createMerchant();
  const unsigned = await drizzleOrderRepository.create(reservationInput(merchantId));
  for (const id of [unsigned.id, v7(), "not-a-uuid"]) {
    expect(await verifyPayOrder(id, drizzleOrderRepository, chain())).toEqual({
      status: "not-found",
    });
  }
});

test("an unreachable chain is never a pass", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const order = await createSignedOrder();
  expect(await verifyPayOrder(order.id, drizzleOrderRepository, unreachable)).toEqual({
    status: "unverified",
  });
});

test("no pay page state exposes the merchant address", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const open = await createSignedOrder();
  const expired = await createSignedOrder(new Date(Date.now() - 16 * 60 * 1000));
  const views: PayOrder[] = [
    await verifyPayOrder(open.id, drizzleOrderRepository, chain()),
    await verifyPayOrder(open.id, drizzleOrderRepository, chain({ paid: true })),
    await verifyPayOrder(open.id, drizzleOrderRepository, chain({ signingKey: rotatedKey })),
    await verifyPayOrder(open.id, drizzleOrderRepository, unreachable),
    await verifyPayOrder(expired.id, drizzleOrderRepository, chain()),
  ];
  expect(views.map((view) => view.status)).toEqual([
    "valid",
    "paid",
    "invalid",
    "unverified",
    "expired",
  ]);

  const merchantHex = merchant.slice(2).toLowerCase();
  for (const view of views) {
    if (view.status === "not-found") throw new Error("Order should exist");
    const html = renderToStaticMarkup(
      createElement(PayOrderStatus, { order: view, retryHref: `/pay/order/${open.id}` }),
    );
    expect(JSON.stringify(view).toLowerCase()).not.toContain(merchantHex);
    expect(html.toLowerCase()).not.toContain(merchantHex);
  }
});
