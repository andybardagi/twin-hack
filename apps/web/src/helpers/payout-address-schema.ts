import { getAddress, isAddress, isAddressEqual, type Address } from "viem";
import { z } from "zod";

export const checksummedAddressSchema = z.custom<Address>(
  (value) =>
    typeof value === "string" && isAddress(value, { strict: false }) && getAddress(value) === value,
  "Enter a checksummed address.",
);

export function payoutAddressInputSchema(router: Address) {
  return z.object({
    payoutAddress: z
      .string()
      .trim()
      // Strict mode accepts all-lowercase addresses (no checksum to verify) but still
      // rejects mixed-case addresses whose EIP-55 checksum is wrong, which signals a typo.
      .refine((value) => isAddress(value, { strict: true }), "Enter a valid address.")
      .transform((value) => getAddress(value))
      .refine(
        (address) => !isAddressEqual(address, router),
        "The payment router can’t receive settlements. Enter a different address.",
      ),
  });
}
