import type { orders } from "@/lib/db/schema";

export type Order = typeof orders.$inferSelect;

/** The relayed transaction that paid an order. */
export type OrderPayment = { payerAddress: string; txHash: string };

export interface OrderRepository {
  create(
    input: Omit<Order, "id" | "createdAt" | "signature" | "settledAt" | "payerAddress" | "txHash">,
  ): Promise<Order>;
  /** Finds signed orders only: an unsigned reservation behaves as missing. */
  findById(id: string): Promise<Order | null>;
  findForSigning(id: string, merchantId: string): Promise<Order | null>;
  /** The merchant's signed orders, newest first. */
  listByMerchant(merchantId: string): Promise<Order[]>;
  /** Returns null unless the order is still unsigned and unexpired. */
  attachSignature(id: string, signature: string): Promise<Order | null>;
  /**
   * Writes settled_at only while it is null; returns the order with the first write's timestamp.
   * A payment, when given, is recorded even if a status poll settled the order first.
   */
  markSettled(id: string, payment?: OrderPayment): Promise<Order>;
}
