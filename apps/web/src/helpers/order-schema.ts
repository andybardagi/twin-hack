import { maxUint256, parseUnits, type Hex } from "viem";
import { z } from "zod";

import type { Order } from "@workspace/payments/typed-data";

import { orderIdToBytes32 } from "@/src/helpers/order-id";
import { checksummedAddressSchema } from "@/src/helpers/payout-address-schema";
import { findCollectableToken } from "@/src/helpers/tokens";

export const orderInputSchema = z
  .object({
    tokenAddress: z.string().min(1, "Choose a token available for collection."),
    amount: z.string().regex(/^\d+(\.\d+)?$/, "Enter a positive decimal amount."),
  })
  .transform((input, context) => {
    const token = findCollectableToken(input.tokenAddress);
    if (!token) {
      context.addIssue({
        code: "custom",
        path: ["tokenAddress"],
        message: "Choose a token available for collection.",
      });
      return z.NEVER;
    }

    const fraction = input.amount.split(".")[1] ?? "";
    if (fraction.length > token.fiatDecimals) {
      context.addIssue({
        code: "custom",
        path: ["amount"],
        message: `Enter at most ${token.fiatDecimals} decimal places.`,
      });
      return z.NEVER;
    }

    const amount = parseUnits(input.amount, token.decimals);
    if (amount <= 0n || amount > maxUint256) {
      context.addIssue({
        code: "custom",
        path: ["amount"],
        message: "Enter an amount greater than zero and within the token's uint256 limit.",
      });
      return z.NEVER;
    }

    return { tokenAddress: token.address, amount: amount.toString() };
  });

export const reservedOrderSchema = z.object({
  id: z.uuidv7(),
  merchant: checksummedAddressSchema,
  receiveToken: checksummedAddressSchema,
  receiveAmount: z.string().regex(/^\d+$/),
  expiry: z.number().int().positive(),
  feeBps: z.number().int().nonnegative(),
});

export type ReservedOrder = z.infer<typeof reservedOrderSchema>;

export const orderSignatureSchema = z.object({
  signature: z.custom<Hex>(
    (value) => typeof value === "string" && /^0x[0-9a-f]{130}$/i.test(value),
  ),
});

export function toSignableOrder({
  id,
  merchant,
  receiveToken,
  receiveAmount,
  expiry,
  feeBps,
}: ReservedOrder): Order {
  return {
    merchant,
    receiveToken,
    receiveAmount: BigInt(receiveAmount),
    orderId: orderIdToBytes32(id),
    expiry: BigInt(expiry),
    feeBps,
  };
}
