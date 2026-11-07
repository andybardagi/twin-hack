import type { Hex } from "viem";
import type { z } from "zod";

import type { Order } from "@workspace/payments/typed-data";

import { apiClient } from "@/lib/api-client";
import { orderInputSchema, reservedOrderSchema, toSignableOrder } from "@/src/helpers/order-schema";

export class CreateOrderError extends Error {
  constructor(public readonly status: number) {
    super("Couldn't create the order. Check your connection and try again.");
  }
}

export async function createOrder(
  input: z.input<typeof orderInputSchema>,
  sign: (order: Order) => Promise<Hex>,
): Promise<{ id: string }> {
  const { tokenAddress } = orderInputSchema.parse(input);
  // The API converts the decimal amount to base units; send the schema's input.
  const reservation = await apiClient.api.orders.post({ tokenAddress, amount: input.amount });
  if (reservation.error) throw new CreateOrderError(reservation.error.status);
  const order = reservedOrderSchema.parse(reservation.data);

  const signature = await sign(toSignableOrder(order));
  const attached = await apiClient.api.orders({ id: order.id }).signature.post({ signature });
  if (attached.error) throw new CreateOrderError(attached.error.status);
  return { id: order.id };
}
