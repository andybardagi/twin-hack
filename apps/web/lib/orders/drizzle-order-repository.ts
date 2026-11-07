import { and, eq, gt, isNotNull, isNull } from "drizzle-orm";
import { v7 } from "uuid";
import { z } from "zod";

import { getDb } from "@/lib/db/client";
import { orders } from "@/lib/db/schema";
import type { OrderRepository } from "@/lib/orders/order-repository";

export const drizzleOrderRepository: OrderRepository = {
  async create(input) {
    const [order] = await getDb()
      .insert(orders)
      .values({ ...input, id: v7() })
      .returning();
    if (!order) throw new Error("Order insert did not return a row.");
    return order;
  },
  async findById(id) {
    if (!z.uuid().safeParse(id).success) return null;

    const [order] = await getDb()
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), isNotNull(orders.signature)))
      .limit(1);
    return order ?? null;
  },
  async findForSigning(id, merchantId) {
    if (!z.uuid().safeParse(id).success) return null;

    const [order] = await getDb()
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.merchantId, merchantId)))
      .limit(1);
    return order ?? null;
  },
  async attachSignature(id, signature) {
    const [order] = await getDb()
      .update(orders)
      .set({ signature })
      .where(and(eq(orders.id, id), isNull(orders.signature), gt(orders.expiresAt, new Date())))
      .returning();
    return order ?? null;
  },
  async markSettled(id) {
    const [settled] = await getDb()
      .update(orders)
      .set({ settledAt: new Date() })
      .where(and(eq(orders.id, id), isNull(orders.settledAt)))
      .returning();
    if (settled) return settled;

    // A concurrent poll settled it first; keep that timestamp.
    const [order] = await getDb().select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) throw new Error(`Cannot settle missing order ${id}.`);
    return order;
  },
};
