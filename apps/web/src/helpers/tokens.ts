import { getAddress, type Address } from "viem";

import {
  isTokenSymbol,
  tokens as paymentTokens,
  type TokenSymbol,
} from "@workspace/payments/tokens";

export type Token = {
  name: string;
  symbol: string;
  address: Address;
  decimals: number;
  fiatDecimals: number;
  config: { canPay: boolean; canCollect: boolean };
};

const tokenMetadata: Record<TokenSymbol, Omit<Token, "symbol" | "address" | "decimals">> = {
  USDT0: {
    name: "Tether USD",
    fiatDecimals: 2,
    config: { canPay: true, canCollect: true },
  },
  ARGt: {
    name: "Argentine peso",
    fiatDecimals: 2,
    config: { canPay: true, canCollect: true },
  },
  BRAt: {
    name: "Brazilian real",
    fiatDecimals: 2,
    config: { canPay: true, canCollect: true },
  },
  COLt: {
    name: "Colombian peso",
    fiatDecimals: 2,
    config: { canPay: true, canCollect: true },
  },
  PERt: {
    name: "Peruvian sol",
    fiatDecimals: 2,
    config: { canPay: true, canCollect: true },
  },
  MEXt: {
    name: "Mexican peso",
    fiatDecimals: 2,
    config: { canPay: true, canCollect: true },
  },
  CHLt: {
    name: "Chilean peso",
    fiatDecimals: 0,
    config: { canPay: true, canCollect: true },
  },
  BOLt: {
    name: "Bolivian boliviano",
    fiatDecimals: 2,
    config: { canPay: true, canCollect: true },
  },
};

export const tokens: Token[] = Object.entries(paymentTokens).map(([symbol, token]) => {
  if (!isTokenSymbol(symbol)) throw new Error(`Unknown token: ${symbol}`);
  return {
    ...tokenMetadata[symbol],
    symbol: symbol === "USDT0" ? "USDT" : symbol,
    address: getAddress(token.address),
    decimals: token.decimals,
  };
});
