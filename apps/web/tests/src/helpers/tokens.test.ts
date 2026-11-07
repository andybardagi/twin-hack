import { getAddress } from "viem";
import { expect, test } from "vitest";

import { tokens } from "@/src/helpers/tokens";

test("lists all eight collectable Arbitrum tokens with checksummed addresses", () => {
  expect(tokens.map((token) => token.symbol)).toEqual([
    "USDT",
    "ARGt",
    "BRAt",
    "COLt",
    "PERt",
    "MEXt",
    "CHLt",
    "BOLt",
  ]);
  expect(new Set(tokens.map((token) => token.address)).size).toBe(8);
  for (const token of tokens) {
    expect(token.address).toBe(getAddress(token.address));
    expect(token.decimals).toBe(token.symbol === "USDT" ? 6 : 18);
    expect(token.fiatDecimals).toBe(token.symbol === "CHLt" ? 0 : 2);
    expect(token.config).toEqual({ canPay: true, canCollect: true });
  }
});
