import { z } from "zod";

import { apiClient } from "@/lib/api-client";
import { orderInputSchema } from "@/src/helpers/order-schema";

const createdOrderSchema = z.object({ id: z.uuidv7() });

export class CreateOrderError extends Error {
  constructor(public readonly status: number) {
    super("Couldn't create the order. Check your connection and try again.");
  }
}

export async function createOrder(
  input: z.input<typeof orderInputSchema>,
): Promise<z.output<typeof createdOrderSchema>> {
  const { tokenAddress } = orderInputSchema.parse(input);
  // The API converts the decimal amount to base units; send the schema's input.
  const { data, error } = await apiClient.api.orders.post({ tokenAddress, amount: input.amount });
  if (error) throw new CreateOrderError(error.status);
  return createdOrderSchema.parse(data);
}
