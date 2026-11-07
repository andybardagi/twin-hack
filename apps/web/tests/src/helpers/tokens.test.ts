import { getAddress } from "viem";
import { expect, test } from "vitest";

import { tokens as paymentTokens } from "@workspace/payments/tokens";

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
  for (const [symbol, paymentToken] of Object.entries(paymentTokens)) {
    const token = tokens.find((token) => token.symbol === (symbol === "USDT0" ? "USDT" : symbol));
    expect(token?.address).toBe(getAddress(paymentToken.address));
    expect(token?.decimals).toBe(paymentToken.decimals);
  }
  for (const token of tokens) {
    expect(token.address).toBe(getAddress(token.address));
    expect(token.decimals).toBe(token.symbol === "USDT" ? 6 : 18);
    expect(token.fiatDecimals).toBe(token.symbol === "CHLt" ? 0 : 2);
    expect(token.config).toEqual({ canPay: true, canCollect: true });
  }
});
