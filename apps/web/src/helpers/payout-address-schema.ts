import { getAddress, isAddress, type Address } from "viem";
import { z } from "zod";

const checksummedAddressSchema = z.custom<Address>(
  (value) =>
    typeof value === "string" && isAddress(value, { strict: false }) && getAddress(value) === value,
  "Enter a checksummed address.",
);

export function payoutAddressInputSchema(router: Address) {
  return z.object({
    payoutAddress: z
      .string()
      .trim()
      .pipe(checksummedAddressSchema)
      .refine(
        (address) => address !== router,
        "The payment router can’t receive settlements. Enter a different address.",
      ),
  });
}
