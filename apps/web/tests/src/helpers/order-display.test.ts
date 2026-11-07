import { maxUint256 } from "viem";
import { expect, test } from "vitest";

import { formatOrderDisplay } from "@/src/helpers/order-display";
import { tokens } from "@/src/helpers/tokens";

test.each([
  ["USDT", "123450000", "123.45"],
  ["ARGt", "15000500000000000000000", "15000.5"],
  ["CHLt", "100000000000000000000", "100"],
  ["ARGt", "9007199254740993010000000000000000", "9007199254740993.01"],
  ["ARGt", "1", "0.000000000000000001"],
])("displays %s base units %s exactly", (symbol, baseUnits, amount) => {
  const token = tokens.find((token) => token.symbol === symbol);
  if (!token) throw new Error(`Missing token: ${symbol}`);

  expect(formatOrderDisplay(baseUnits, token.address.toLowerCase())).toEqual({
    amount,
    token: symbol,
  });
});

test("shows raw base units and address when a token is no longer listed", () => {
  const address = "0x0000000000000000000000000000000000000001";
  expect(formatOrderDisplay(maxUint256.toString(), address)).toEqual({
    amount: `${maxUint256} base units`,
    token: address,
  });
});
