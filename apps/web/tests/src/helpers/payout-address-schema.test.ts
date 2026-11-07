import { expect, test } from "vitest";

import { payoutAddressInputSchema } from "@/src/helpers/payout-address-schema";

const router = "0x1234567890AbcdEF1234567890aBcdef12345678";
const payoutAddress = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9";
const schema = payoutAddressInputSchema(router);

test("accepts a checksummed address and trims pasted whitespace", () => {
  expect(schema.parse({ payoutAddress: ` ${payoutAddress}\n` })).toEqual({ payoutAddress });
});

test("accepts an all-lowercase address and returns it checksummed", () => {
  expect(schema.parse({ payoutAddress: payoutAddress.toLowerCase() })).toEqual({ payoutAddress });
});

test.each(["", "not an address", payoutAddress.replace("F", "f")])(
  "rejects %j as invalid",
  (value) => {
    const result = schema.safeParse({ payoutAddress: value });
    expect(result.error?.issues[0]?.message).toBe("Enter a valid address.");
  },
);

test.each([router, router.toLowerCase()])(
  "rejects the router address %s, matching the contract's InvalidPayout",
  (value) => {
    const result = schema.safeParse({ payoutAddress: value });
    expect(result.error?.issues[0]?.message).toContain("payment router");
  },
);
