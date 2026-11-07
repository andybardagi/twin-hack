import { getAddress } from "viem";

import { tokens } from "@workspace/payments/tokens";

import { drizzleOrderRepository } from "@/lib/orders/drizzle-order-repository";
import { reservationExpiresAt } from "@/lib/orders/reserved-order";

export function reservationInput(merchantId: string, now = new Date()) {
  return {
    merchantId,
    merchantAddress: getAddress("0x00000000000000000000000000000000000000aa"),
    tokenAddress: getAddress(tokens.USDT0.address),
    amount: "123450000",
    expiresAt: reservationExpiresAt(now),
    feeBps: 50,
  };
}

export async function createSignedOrder(merchantId: string) {
  const order = await drizzleOrderRepository.create(reservationInput(merchantId));
  const signed = await drizzleOrderRepository.attachSignature(order.id, `0x${"11".repeat(65)}`);
  if (!signed) throw new Error("Fixture order could not be signed");
  return signed;
}
