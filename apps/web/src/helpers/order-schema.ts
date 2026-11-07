import { maxUint256, parseUnits } from "viem";
import { z } from "zod";

import { tokens } from "@/src/helpers/tokens";

export const orderInputSchema = z
  .object({
    tokenAddress: z.string(),
    amount: z.string().regex(/^\d+(\.\d+)?$/, "Enter a positive decimal amount."),
  })
  .transform((input, context) => {
    const token = tokens.find(
      (token) => token.address.toLowerCase() === input.tokenAddress.toLowerCase(),
    );
    if (!token?.config.canCollect) {
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
