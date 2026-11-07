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
  /** Public path of the coin icon. */
  icon: string;
  config: { canPay: boolean; canCollect: boolean };
};

const tokenMetadata: Record<TokenSymbol, Omit<Token, "symbol" | "address" | "decimals">> = {
  USDT0: {
    name: "Tether USD",
    icon: "/tokens/USDT.svg",
    fiatDecimals: 2,
    config: { canPay: true, canCollect: true },
  },
  ARGt: {
    name: "Argentine peso",
    icon: "/tokens/ARGt.avif",
    fiatDecimals: 2,
    config: { canPay: true, canCollect: true },
  },
  BRAt: {
    name: "Brazilian real",
    icon: "/tokens/BRAt.avif",
    fiatDecimals: 2,
    config: { canPay: true, canCollect: true },
  },
  COLt: {
    name: "Colombian peso",
    icon: "/tokens/COLt.avif",
    fiatDecimals: 2,
    config: { canPay: true, canCollect: true },
  },
  PERt: {
    name: "Peruvian sol",
    icon: "/tokens/PERt.avif",
    fiatDecimals: 2,
    config: { canPay: true, canCollect: true },
  },
  MEXt: {
    name: "Mexican peso",
    icon: "/tokens/MEXt.avif",
    fiatDecimals: 2,
    config: { canPay: true, canCollect: true },
  },
  CHLt: {
    name: "Chilean peso",
    icon: "/tokens/CHLt.avif",
    fiatDecimals: 0,
    config: { canPay: true, canCollect: true },
  },
  BOLt: {
    name: "Bolivian boliviano",
    icon: "/tokens/BOLt.avif",
    fiatDecimals: 2,
    config: { canPay: true, canCollect: true },
  },
};

export function findCollectableToken(address: string): Token | undefined {
  const token = tokens.find((token) => token.address.toLowerCase() === address.toLowerCase());
  return token?.config.canCollect ? token : undefined;
}

export const tokens: Token[] = Object.entries(paymentTokens).map(([symbol, token]) => {
  if (!isTokenSymbol(symbol)) throw new Error(`Unknown token: ${symbol}`);
  return {
    ...tokenMetadata[symbol],
    symbol: symbol === "USDT0" ? "USDT" : symbol,
    address: getAddress(token.address),
    decimals: token.decimals,
  };
});
