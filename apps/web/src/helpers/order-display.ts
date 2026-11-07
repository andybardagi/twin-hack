import { formatUnits } from "viem";

import { tokens } from "@/src/helpers/tokens";

export function formatOrderDisplay(
  amount: string,
  tokenAddress: string,
): { amount: string; token: string } {
  const token = tokens.find((token) => token.address.toLowerCase() === tokenAddress.toLowerCase());
  if (!token) return { amount: `${amount} base units`, token: tokenAddress };

  return { amount: formatUnits(BigInt(amount), token.decimals), token: token.symbol };
}
