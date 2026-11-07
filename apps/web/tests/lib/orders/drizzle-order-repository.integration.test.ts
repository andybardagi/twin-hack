import { eq, inArray } from "drizzle-orm";
import { v7 } from "uuid";
import { afterEach, expect, test } from "vitest";
import { z } from "zod";

import { getDb } from "@/lib/db/client";
import { orders, user } from "@/lib/db/schema";
import { drizzleOrderRepository } from "@/lib/orders/drizzle-order-repository";
import { toReservedOrder } from "@/lib/orders/reserved-order";
import { orderInputSchema } from "@/src/helpers/order-schema";
import { tokens } from "@/src/helpers/tokens";
import { createSignedOrder, reservationInput } from "./order-fixture";

const merchantIds: string[] = [];
const signature = `0x${"22".repeat(65)}`;

afterEach(async () => {
  if (!merchantIds.length) return;
  await getDb().delete(orders).where(inArray(orders.merchantId, merchantIds));
  await getDb().delete(user).where(inArray(user.id, merchantIds));
  merchantIds.length = 0;
});

async function createMerchant() {
  const id = v7();
  merchantIds.push(id);
  await getDb()
    .insert(user)
    .values({ id, name: "Merchant", email: `${id}@example.com` });
  return id;
}

test.each([
  ["ARGt", "15000.50", "15000500000000000000000"],
  ["USDT", "123.45", "123450000"],
])(
  "stores exact %s base units and finds the order once signed",
  async (symbol, amount, baseUnits) => {
    const merchantId = await createMerchant();
    const token = tokens.find((token) => token.symbol === symbol);
    if (!token) throw new Error(`Missing token: ${symbol}`);
    const input = orderInputSchema.parse({ tokenAddress: token.address.toLowerCase(), amount });
    const order = await drizzleOrderRepository.create({
      ...reservationInput(merchantId),
      ...input,
    });

    expect(z.uuidv7().safeParse(order.id).success).toBe(true);
    expect(order).toMatchObject({
      tokenAddress: token.address,
      amount: baseUnits,
      signature: null,
    });
    expect(await drizzleOrderRepository.findById(order.id)).toBeNull();
    const signed = await drizzleOrderRepository.attachSignature(order.id, signature);
    expect(signed).toEqual({ ...order, signature });
    expect(await drizzleOrderRepository.findById(order.id)).toEqual(signed);
  },
);

test("round-trips the expiry as whole unix seconds", async () => {
  const merchantId = await createMerchant();
  const now = new Date("2026-11-07T12:00:00.999Z");
  const order = await drizzleOrderRepository.create(reservationInput(merchantId, now));
  const [stored] = await getDb().select().from(orders).where(eq(orders.id, order.id)).limit(1);
  if (!stored) throw new Error("Missing stored order");

  expect(stored.expiresAt.toISOString()).toBe("2026-11-07T12:15:00.000Z");
  expect(toReservedOrder(stored).expiry).toBe(Date.parse("2026-11-07T12:15:00Z") / 1000);
});

test("only the owner can load an unsigned order for signing", async () => {
  const merchantId = await createMerchant();
  const otherMerchantId = await createMerchant();
  const order = await drizzleOrderRepository.create(reservationInput(merchantId));

  expect(await drizzleOrderRepository.findForSigning(order.id, merchantId)).toEqual(order);
  expect(await drizzleOrderRepository.findForSigning(order.id, otherMerchantId)).toBeNull();
  expect(await drizzleOrderRepository.findForSigning("not-a-uuid", merchantId)).toBeNull();
});

test("attaches a signature once and never to an expired order", async () => {
  const merchantId = await createMerchant();
  const signed = await createSignedOrder(merchantId);
  expect(await drizzleOrderRepository.attachSignature(signed.id, signature)).toBeNull();
  expect(await drizzleOrderRepository.findById(signed.id)).toEqual(signed);

  const expired = await drizzleOrderRepository.create(
    reservationInput(merchantId, new Date(Date.now() - 16 * 60 * 1000)),
  );
  expect(await drizzleOrderRepository.attachSignature(expired.id, signature)).toBeNull();
  expect(await drizzleOrderRepository.findById(expired.id)).toBeNull();
});

test("writes settled_at once, even under concurrent settles", async () => {
  const merchantId = await createMerchant();
  const order = await createSignedOrder(merchantId);

  const [first, second] = await Promise.all([
    drizzleOrderRepository.markSettled(order.id),
    drizzleOrderRepository.markSettled(order.id),
  ]);
  expect(first.settledAt).toBeInstanceOf(Date);
  expect(second.settledAt).toEqual(first.settledAt);
  const again = await drizzleOrderRepository.markSettled(order.id);
  expect(again).toEqual({ ...order, settledAt: first.settledAt });
});

test("returns null for an unknown order UUID", async () => {
  expect(await drizzleOrderRepository.findById(v7())).toBeNull();
});

test.each(["abc", "", "1", "01900000-0000-7000-8000-00000000000z"])(
  "returns null for malformed id %s before Postgres can reject it",
  async (id) => {
    expect(await drizzleOrderRepository.findById(id)).toBeNull();
  },
);

test("restricts deleting a merchant who owns an order", async () => {
  const merchantId = await createMerchant();
  const order = await createSignedOrder(merchantId);

  await expect(getDb().delete(user).where(eq(user.id, merchantId))).rejects.toMatchObject({
    cause: { code: "23503" },
  });
  expect(await drizzleOrderRepository.findById(order.id)).toEqual(order);
  const [merchant] = await getDb().select().from(user).where(eq(user.id, merchantId)).limit(1);
  expect(merchant?.id).toBe(merchantId);
});
