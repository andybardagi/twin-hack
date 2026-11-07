import { eq } from "drizzle-orm";
import { v7 } from "uuid";

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
    const [order] = await getDb().select().from(orders).where(eq(orders.id, id)).limit(1);
    return order ?? null;
  },
};
