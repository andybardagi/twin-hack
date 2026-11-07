import { expect, test } from "vitest";

import { payoutAddressInputSchema } from "@/src/helpers/payout-address-schema";

const router = "0x1234567890AbcdEF1234567890aBcdef12345678";
const payoutAddress = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9";
const schema = payoutAddressInputSchema(router);

test("accepts a checksummed address and trims pasted whitespace", () => {
  expect(schema.parse({ payoutAddress: ` ${payoutAddress}\n` })).toEqual({ payoutAddress });
});

test.each(["", "not an address", payoutAddress.toLowerCase(), payoutAddress.replace("F", "f")])(
  "rejects %j as not checksummed",
  (value) => {
    const result = schema.safeParse({ payoutAddress: value });
    expect(result.error?.issues[0]?.message).toBe("Enter a checksummed address.");
  },
);

test("rejects the router address, matching the contract's InvalidPayout", () => {
  const result = schema.safeParse({ payoutAddress: router });
  expect(result.error?.issues[0]?.message).toContain("payment router");
});
