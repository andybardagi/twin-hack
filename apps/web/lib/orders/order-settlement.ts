import type { Order, OrderRepository } from "@/lib/orders/order-repository";
import type { OrderStatus } from "@/src/helpers/order-schema";

export function deriveOrderStatus({ expiresAt, settledAt }: Order, now: Date): OrderStatus {
  if (settledAt) return "paid";
  return expiresAt <= now ? "expired" : "open";
}

/**
 * Resolves to null when the chain can't answer. The chain is read even after expiry,
 * because a payment mined before the expiry may only be seen by a later poll.
 */
export async function settleOrder(
  order: Order,
  repository: OrderRepository,
  isPaidOnChain: () => Promise<boolean | null>,
): Promise<OrderStatus | null> {
  if (order.settledAt) return deriveOrderStatus(order, new Date());

  const paid = await isPaidOnChain();
  if (paid === null) return null;
  const current = paid ? await repository.markSettled(order.id) : order;
  return deriveOrderStatus(current, new Date());
}
