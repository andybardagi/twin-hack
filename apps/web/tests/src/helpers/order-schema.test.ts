import { formatUnits, maxUint256 } from "viem";
import { expect, test } from "vitest";

import { orderInputSchema } from "@/src/helpers/order-schema";
import { tokens } from "@/src/helpers/tokens";

function tokenFor(symbol: string) {
  const token = tokens.find((token) => token.symbol === symbol);
  if (!token) throw new Error(`Missing token: ${symbol}`);
  return token;
}

test("reports both field errors when token and amount are empty", () => {
  const result = orderInputSchema.safeParse({ tokenAddress: "", amount: "" });

  expect(result.success).toBe(false);
  if (result.success) throw new Error("Expected empty order input to fail validation");
  expect(result.error.issues).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        path: ["tokenAddress"],
        message: "Choose a token available for collection.",
      }),
      expect.objectContaining({
        path: ["amount"],
        message: "Enter a positive decimal amount.",
      }),
    ]),
  );
});

test.each([
  ["CHLt", "100.5"],
  ["CHLt", "100.0"],
  ["ARGt", "0"],
  ["ARGt", "0.00"],
  ["ARGt", "-1"],
  ["ARGt", "1.001"],
  ["USDT", "1.001"],
  ["ARGt", ""],
  ["ARGt", "1e3"],
  ["ARGt", "1,000"],
  ["ARGt", " 1"],
  ["ARGt", "1\n"],
  ["ARGt", "1\r"],
  ["ARGt", ".5"],
  ["ARGt", "1."],
  ["ARGt", "NaN"],
  ["ARGt", "1.2.3"],
  ["ARGt", maxUint256.toString()],
])("rejects %s amount %s", (symbol, amount) => {
  expect(
    orderInputSchema.safeParse({ tokenAddress: tokenFor(symbol).address, amount }).success,
  ).toBe(false);
});

test.each([
  ["ARGt", "15000.50", "15000500000000000000000", "15000.5"],
  ["USDT", "123.45", "123450000", "123.45"],
  ["CHLt", "100", "100000000000000000000", "100"],
  ["ARGt", "9007199254740993.01", "9007199254740993010000000000000000", "9007199254740993.01"],
])("converts %s %s exactly to base units", (symbol, amount, baseUnits, formatted) => {
  const token = tokenFor(symbol);
  const parsed = orderInputSchema.parse({ tokenAddress: token.address.toLowerCase(), amount });
  expect(parsed).toEqual({ tokenAddress: token.address, amount: baseUnits });
  expect(formatUnits(BigInt(parsed.amount), token.decimals)).toBe(formatted);
});

test.each(["ARGt", "USDT"])("enforces the uint256 boundary for %s", (symbol) => {
  const token = tokenFor(symbol);
  const scale = 10n ** BigInt(token.decimals);
  const largestWholeAmount = maxUint256 / scale;
  expect(
    orderInputSchema.safeParse({
      tokenAddress: token.address,
      amount: largestWholeAmount.toString(),
    }).success,
  ).toBe(true);
  expect(
    orderInputSchema.safeParse({
      tokenAddress: token.address,
      amount: (largestWholeAmount + 1n).toString(),
    }).success,
  ).toBe(false);
});

test.each(["0x0000000000000000000000000000000000000001", "invalid"])(
  "rejects unknown token %s",
  (tokenAddress) => {
    expect(orderInputSchema.safeParse({ tokenAddress, amount: "1" }).success).toBe(false);
  },
);

test("rejects a token when collection is disabled", () => {
  const token = tokenFor("ARGt");
  const canCollect = token.config.canCollect;
  token.config.canCollect = false;
  try {
    expect(orderInputSchema.safeParse({ tokenAddress: token.address, amount: "1" }).success).toBe(
      false,
    );
  } finally {
    token.config.canCollect = canCollect;
  }
});
