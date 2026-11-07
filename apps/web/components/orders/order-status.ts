import { assertNever } from "@workspace/payments/assert-never";

import { apiClient } from "@/lib/api-client";
import { orderStatusSchema, type OrderStatus } from "@/src/helpers/order-schema";

const POLL_INTERVAL_MS = 3000;

export class OrderStatusError extends Error {
  constructor(public readonly status: number) {
    super("Couldn't check the payment status. Check your connection and try again.");
  }
}

export async function readOrderStatus(id: string): Promise<OrderStatus> {
  const { data, error } = await apiClient.api.orders({ id }).status.get();
  if (error) throw new OrderStatusError(error.status);
  return orderStatusSchema.parse(data).status;
}

/** Polls only while the order can still be paid. */
export function orderStatusPollInterval(status: OrderStatus | undefined): number | false {
  switch (status) {
    case undefined:
    case "open":
      return POLL_INTERVAL_MS;
    case "expired":
    case "paid":
      return false;
    default:
      return assertNever(status);
  }
}
