import { eq, inArray } from "drizzle-orm";
import { v7 } from "uuid";
import { afterEach, expect, test } from "vitest";
import { z } from "zod";

import { getDb } from "@/lib/db/client";
import { orders, user } from "@/lib/db/schema";
import { drizzleOrderRepository } from "@/lib/orders/drizzle-order-repository";
import { orderInputSchema } from "@/src/helpers/order-schema";
import { tokens } from "@/src/helpers/tokens";

const merchantIds: string[] = [];

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
])("creates and finds an order with exact %s base units", async (symbol, amount, baseUnits) => {
  const merchantId = await createMerchant();
  const token = tokens.find((token) => token.symbol === symbol);
  if (!token) throw new Error(`Missing token: ${symbol}`);
  const input = orderInputSchema.parse({ tokenAddress: token.address.toLowerCase(), amount });
  const order = await drizzleOrderRepository.create({ merchantId, ...input });

  expect(z.uuidv7().safeParse(order.id).success).toBe(true);
  expect(order).toEqual({
    id: order.id,
    merchantId,
    tokenAddress: token.address,
    amount: baseUnits,
    createdAt: expect.any(Date),
  });
  expect(await drizzleOrderRepository.findById(order.id)).toEqual(order);
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
  const token = tokens.find((token) => token.symbol === "ARGt");
  if (!token) throw new Error("Missing ARGt token");
  const order = await drizzleOrderRepository.create({
    merchantId,
    ...orderInputSchema.parse({ tokenAddress: token.address, amount: "1" }),
  });

  await expect(getDb().delete(user).where(eq(user.id, merchantId))).rejects.toMatchObject({
    cause: { code: "23503" },
  });
  expect(await drizzleOrderRepository.findById(order.id)).toEqual(order);
  const [merchant] = await getDb().select().from(user).where(eq(user.id, merchantId)).limit(1);
  expect(merchant?.id).toBe(merchantId);
});
