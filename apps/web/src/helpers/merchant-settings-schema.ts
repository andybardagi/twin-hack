import { z } from "zod";

import { findCollectableToken } from "@/src/helpers/tokens";

export const merchantSettingsInputSchema = z.object({
  defaultTokenAddress: z.string().transform((address, context) => {
    const token = findCollectableToken(address);
    if (!token) {
      context.addIssue({ code: "custom", message: "Choose a token available for collection." });
      return z.NEVER;
    }
    return token.address;
  }),
});
