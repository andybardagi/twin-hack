import { getAddress } from "viem";

import type { Order } from "@/lib/orders/order-repository";
import type { ReservedOrder } from "@/src/helpers/order-schema";

const ORDER_LIFETIME_SECONDS = 15 * 60;

/** Whole seconds, so expires_at round-trips exactly to the signed uint64 expiry. */
export function reservationExpiresAt(now: Date): Date {
  return new Date((Math.floor(now.getTime() / 1000) + ORDER_LIFETIME_SECONDS) * 1000);
}

export function toReservedOrder(order: Order): ReservedOrder {
  return {
    id: order.id,
    merchant: getAddress(order.merchantAddress),
    receiveToken: getAddress(order.tokenAddress),
    receiveAmount: order.amount,
    expiry: order.expiresAt.getTime() / 1000,
    feeBps: order.feeBps,
  };
}
