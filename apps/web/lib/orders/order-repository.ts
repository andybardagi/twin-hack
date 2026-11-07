import type { orders } from "@/lib/db/schema";

type Order = typeof orders.$inferSelect;

export interface OrderRepository {
  create(input: Omit<Order, "id" | "createdAt">): Promise<Order>;
  findById(id: string): Promise<Order | null>;
}
