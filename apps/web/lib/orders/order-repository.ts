import type { orders } from "@/lib/db/schema";

export type Order = typeof orders.$inferSelect;

export interface OrderRepository {
  create(input: Omit<Order, "id" | "createdAt" | "signature" | "settledAt">): Promise<Order>;
  /** Finds signed orders only: an unsigned reservation behaves as missing. */
  findById(id: string): Promise<Order | null>;
  findForSigning(id: string, merchantId: string): Promise<Order | null>;
  /** Returns null unless the order is still unsigned and unexpired. */
  attachSignature(id: string, signature: string): Promise<Order | null>;
}
