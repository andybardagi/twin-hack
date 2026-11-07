import { isHex, maxUint256, type Hex } from "viem";
import { z } from "zod";

import { tokens } from "@/src/helpers/tokens";

const bytes32 = z.custom<Hex>(
  (value) => typeof value === "string" && /^0x[0-9a-f]{64}$/i.test(value),
);

// Strings, not bigints: Eden types the request body from this schema, and JSON carries no bigint.
const uint256 = z
  .string()
  .regex(/^\d+$/)
  .refine((value) => BigInt(value) <= maxUint256);

/** What the payer's browser sends; the server fills in the order, payer and order hash itself. */
export const payOrderInputSchema = z.object({
  payToken: z
    .string()
    .refine(
      (address) =>
        tokens.some(
          (token) => token.config.canPay && token.address.toLowerCase() === address.toLowerCase(),
        ),
      "Choose a token you can pay with.",
    ),
  maxPayAmount: uint256.refine((value) => BigInt(value) > 0n),
  payerSignature: z.custom<Hex>((value) => typeof value === "string" && isHex(value)),
  permit: z
    .object({
      value: uint256,
      deadline: uint256,
      v: z.int().min(0).max(255),
      r: bytes32,
      s: bytes32,
    })
    .optional(),
});

export const payOrderResultSchema = z.object({ hash: bytes32 });
