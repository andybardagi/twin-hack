import { inArray } from "drizzle-orm";
import { v7 } from "uuid";
import { afterEach, expect, test } from "vitest";

import { getDb } from "@/lib/db/client";
import { orders, user } from "@/lib/db/schema";
import { drizzleOrderRepository } from "@/lib/orders/drizzle-order-repository";
import { findMerchantOrder } from "@/lib/orders/find-merchant-order";
import { tokens } from "@/src/helpers/tokens";

const merchantIds: string[] = [];

afterEach(async () => {
  if (!merchantIds.length) return;
  await getDb().delete(orders).where(inArray(orders.merchantId, merchantIds));
  await getDb().delete(user).where(inArray(user.id, merchantIds));
  merchantIds.length = 0;
});

test("only returns an order to its owner", async () => {
  const merchantId = v7();
  const otherMerchantId = v7();
  merchantIds.push(merchantId, otherMerchantId);
  await getDb()
    .insert(user)
    .values(merchantIds.map((id) => ({ id, name: "Merchant", email: `${id}@example.com` })));
  const token = tokens.find((token) => token.symbol === "USDT");
  if (!token) throw new Error("Missing USDT token");
  const order = await drizzleOrderRepository.create({
    merchantId,
    amount: "123450000",
    tokenAddress: token.address,
  });

  expect(await findMerchantOrder(order.id, merchantId)).toEqual(order);
  expect(await findMerchantOrder(order.id, otherMerchantId)).toBeNull();
  expect(await findMerchantOrder(v7(), merchantId)).toBeNull();
});

test.each(["not-a-uuid", "", "1", "01900000-0000-7000-8000-00000000000z"])(
  "rejects malformed id %s before Postgres can reject it",
  async (id) => {
    expect(await findMerchantOrder(id, v7())).toBeNull();
  },
);
