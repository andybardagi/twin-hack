import { formatUnits } from "viem";

import type { Order, OrderRepository } from "@/lib/orders/order-repository";
import { deriveOrderStatus } from "@/lib/orders/order-settlement";
import type { OrderStatus } from "@/src/helpers/order-schema";
import { formatTypedAmount } from "@/src/helpers/keypad";
import { tokens } from "@/src/helpers/tokens";

const BPS_DENOMINATOR = 10_000n;

/** One row of the merchant's order history, serializable for the client. */
export type OrderHistoryItem = {
  id: string;
  status: OrderStatus;
  /** ISO timestamp. */
  createdAt: string;
  tokenAddress: string;
  symbol: string;
  amount: string;
  /** Router fee kept from the amount, as the contract computes it. */
  commission: string;
  feeBps: number;
  payerAddress: string | null;
  txHash: string | null;
};

/** Grouped thousands, padded to the token's fiat decimals but never cut below its real precision. */
function formatAmount(baseUnits: bigint, decimals: number, fiatDecimals: number): string {
  const [whole = "0", fraction = ""] = formatUnits(baseUnits, decimals).split(".");
  const padded = fraction.padEnd(fiatDecimals, "0");
  return formatTypedAmount(padded ? `${whole}.${padded}` : whole);
}

function toOrderHistoryItem(order: Order, now: Date): OrderHistoryItem {
  const amount = BigInt(order.amount);
  const commission = (amount * BigInt(order.feeBps)) / BPS_DENOMINATOR;
  const token = tokens.find(
    (candidate) => candidate.address.toLowerCase() === order.tokenAddress.toLowerCase(),
  );
  const format = (value: bigint) =>
    token ? formatAmount(value, token.decimals, token.fiatDecimals) : `${value} base units`;

  return {
    id: order.id,
    status: deriveOrderStatus(order, now),
    createdAt: order.createdAt.toISOString(),
    tokenAddress: order.tokenAddress,
    symbol: token?.symbol ?? order.tokenAddress,
    amount: format(amount),
    commission: format(commission),
    feeBps: order.feeBps,
    payerAddress: order.payerAddress,
    txHash: order.txHash,
  };
}

export async function listOrderHistory(
  merchantId: string,
  repository: OrderRepository,
): Promise<OrderHistoryItem[]> {
  const orders = await repository.listByMerchant(merchantId);
  const now = new Date();
  return orders.map((order) => toOrderHistoryItem(order, now));
}
