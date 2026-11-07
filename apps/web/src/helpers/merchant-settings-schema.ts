import { z } from "zod";

import { tokens } from "@/src/helpers/tokens";

export const merchantSettingsInputSchema = z.object({
  defaultTokenAddress: z.string().transform((address, context) => {
    const token = tokens.find((token) => token.address.toLowerCase() === address.toLowerCase());
    if (!token?.config.canCollect) {
      context.addIssue({ code: "custom", message: "Choose a token available for collection." });
      return z.NEVER;
    }
    return token.address;
  }),
});
